const { Op } = require("sequelize");
const Loan = require("./loan.model");
const LoanTransaction = require("./loanTransaction.model");
const Company = require("../Masters/Company/company.model");
const Employee = require("../Masters/Employee/employee.model");

/**
 * Helper to verify company exists and user has access.
 */
const verifyCompanyAccess = async (companyId, user) => {
    const company = await Company.findOne({ where: { id: companyId, cstatus: true } });
    if (!company) {
        const error = new Error("Company not found.");
        error.statusCode = 404;
        error.errorCode = "COMPANY_NOT_FOUND";
        error.messageToShow = "Company not found.";
        throw error;
    }

    if (user.role_name === 'Contractor') {
        if (!user.contractor_id) {
            const error = new Error("Contractor profile not found.");
            error.statusCode = 403;
            error.errorCode = "CONTRACTOR_PROFILE_NOT_FOUND";
            error.messageToShow = "Contractor profile not found.";
            throw error;
        }
    } else {
        if (company.user_id !== user.id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }
    }

    return company;
};

class LoanService {
    /**
     * Creates a new loan.
     */
    static async createLoan(loanData, user) {
        // Uppercase conversion for strings
        for (const key in loanData) {
            if (typeof loanData[key] === 'string' && !key.toLowerCase().endsWith('id')) {
                loanData[key] = loanData[key].toUpperCase();
            }
        }

        // Verify the employee exists and fetch company_id
        const employee = await Employee.findOne({ where: { id: loanData.employee_id } });
        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        const companyId = employee.company_id;
        await verifyCompanyAccess(companyId, user);

        // Check if there are existing active loans for this employee
        const activeCount = await Loan.count({
            where: {
                employee_id: loanData.employee_id,
                status: "Active",
            }
        });

        const warnings = [];
        if (activeCount > 0) {
            warnings.push(`Employee already has ${activeCount} active loan(s).`);
        }

        const principal = parseFloat(loanData.total_amount);
        const interestRate = parseFloat(loanData.interest_rate || 0);
        const tenure = parseInt(loanData.tenure_months || 0);
        const interestType = loanData.interest_type || "FLAT";

        let totalInterest = 0;
        if (interestRate > 0) {
            if (interestType.toUpperCase() === "FLAT") {
                totalInterest = principal * (interestRate / 100);
            } else if (interestType.toUpperCase() === "REDUCING" && tenure > 0) {
                const r = (interestRate / 12) / 100;
                if (r > 0) {
                    const emiCalc = principal * (r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
                    totalInterest = (emiCalc * tenure) - principal;
                }
            }
        }

        // Auto-calculate EMI if blank but tenure is provided
        let emi = parseFloat(loanData.emi_amount);
        if ((!emi || isNaN(emi)) && tenure > 0) {
            emi = (principal + totalInterest) / tenure;
        }

        const newLoan = await Loan.create({
            ...loanData,
            company_id: companyId,
            remaining_amount: principal + totalInterest,
            emi_amount: emi || 0.00,
            status: "Active"
        });

        return {
            loan: newLoan,
            warnings: warnings.length > 0 ? warnings : null
        };
    }

    /**
     * Gets all loans for a worker.
     */
    static async getLoansByEmployee(employeeId, user) {
        const employee = await Employee.findOne({ where: { id: employeeId } });
        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        await verifyCompanyAccess(employee.company_id, user);

        const loans = await Loan.findAll({
            where: { employee_id: employeeId },
            order: [["createdAt", "DESC"]]
        });

        return loans;
    }

    /**
     * Override loan configurations/status.
     */
    static async updateLoan(id, updateData, user) {
        const loan = await Loan.findOne({
            where: { id },
            include: [{ model: Company, as: "company" }]
        });

        if (!loan) {
            const error = new Error("Loan not found.");
            error.statusCode = 404;
            error.errorCode = "LOAN_NOT_FOUND";
            error.messageToShow = "Loan not found.";
            throw error;
        }

        await verifyCompanyAccess(loan.company_id, user);

        // Capitalize string fields
        for (const key in updateData) {
            if (typeof updateData[key] === 'string' && !key.toLowerCase().endsWith('id')) {
                updateData[key] = updateData[key].toUpperCase();
            }
        }

        await loan.update(updateData);
        return loan;
    }

    /**
     * Records a physical manual repayment.
     */
    static async recordManualRepayment(id, repaymentData, user) {
        const loan = await Loan.findOne({
            where: { id },
            include: [{ model: Company, as: "company" }]
        });

        if (!loan) {
            const error = new Error("Loan not found.");
            error.statusCode = 404;
            error.errorCode = "LOAN_NOT_FOUND";
            error.messageToShow = "Loan not found.";
            throw error;
        }

        await verifyCompanyAccess(loan.company_id, user);

        const amount = parseFloat(repaymentData.amount);
        const remaining = Math.max(0, parseFloat(loan.remaining_amount) - amount);

        // Write transaction log
        await LoanTransaction.create({
            loan_id: loan.id,
            employee_id: loan.employee_id,
            amount: amount,
            type: "Manual_Payment",
            payment_source: repaymentData.payment_source || "Cash",
            description: repaymentData.description || "Manual repayment recorded."
        });

        // Update loan status & amount
        await loan.update({
            remaining_amount: remaining,
            status: remaining <= 0 ? "Completed" : loan.status,
            last_deduction_date: new Date()
        });

        return { remaining_amount: remaining };
    }

    /**
     * Repays loans using FIFO logic.
     */
    static async repayFIFO(employeeId, deductionPoolAmount, description, user) {
        const employee = await Employee.findOne({ where: { id: employeeId } });
        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        await verifyCompanyAccess(employee.company_id, user);

        let remainingPool = parseFloat(deductionPoolAmount);

        // Fetch active loans ordered FIFO (Earliest first)
        const activeLoans = await Loan.findAll({
            where: {
                employee_id: employeeId,
                status: 'Active',
                remaining_amount: { [Op.gt]: 0 }
            },
            order: [['created_at', 'ASC']]
        });

        for (const loan of activeLoans) {
            if (remainingPool <= 0) break;

            const loanRemaining = parseFloat(loan.remaining_amount);
            const deduction = Math.min(remainingPool, loanRemaining);

            // Log transaction
            await LoanTransaction.create({
                loan_id: loan.id,
                employee_id: employeeId,
                amount: deduction,
                type: 'Auto_Deduction',
                payment_source: 'Salary',
                description: description || 'Automated payroll deduction'
            });

            // Adjust remaining balance and state
            const newRemaining = loanRemaining - deduction;
            await loan.update({
                remaining_amount: newRemaining,
                status: newRemaining <= 0 ? 'Completed' : 'Active',
                last_deduction_date: new Date()
            });

            // Subtract from pool
            remainingPool -= deduction;
        }

        // Return applied amount
        return parseFloat(deductionPoolAmount) - remainingPool;
    }

    /**
     * Gets transaction list for a specific loan.
     */
    static async getTransactionsByLoan(loanId, user) {
        const loan = await Loan.findOne({
            where: { id: loanId },
            include: [{ model: Company, as: "company" }]
        });

        if (!loan) {
            const error = new Error("Loan not found.");
            error.statusCode = 404;
            error.errorCode = "LOAN_NOT_FOUND";
            error.messageToShow = "Loan not found.";
            throw error;
        }

        await verifyCompanyAccess(loan.company_id, user);

        const transactions = await LoanTransaction.findAll({
            where: { loan_id: loanId },
            order: [["transaction_date", "DESC"]]
        });

        return transactions;
    }

    /**
     * Retrieves global stats summary.
     */
    static async getLoanSummary(companyId, user) {
        await verifyCompanyAccess(companyId, user);

        const totalLoaned = await Loan.sum("total_amount", { where: { company_id: companyId } }) || 0;
        const totalPending = await Loan.sum("remaining_amount", { where: { company_id: companyId, status: ["Active", "Paused"] } }) || 0;
        const activeCount = await Loan.count({ where: { company_id: companyId, status: "Active" } });

        return {
            total_loaned: parseFloat(totalLoaned),
            total_pending: parseFloat(totalPending),
            active_count: activeCount
        };
    }

    /**
     * Gets all loans for a company.
     */
    static async getLoansByCompany(companyId, user) {
        await verifyCompanyAccess(companyId, user);
        return await Loan.findAll({
            where: { company_id: companyId },
            order: [["createdAt", "DESC"]]
        });
    }
}

module.exports = LoanService;
