const LoanService = require("./loan.service");
const {
    createLoanSchema,
    updateLoanSchema,
    manualRepaymentSchema,
    fifoDeductionSchema,
} = require("./loan.validators");
const { successResponse, errorResponse } = require("../../utils/response");

/**
 * Formats Joi validation error messages to be user-friendly.
 */
const formatJoiMessage = (message) => {
    if (!message) return "";
    let clean = message.replace(/"/g, "");

    const mapping = {
        employee_id: "Employee ID",
        total_amount: "Total Amount",
        emi_amount: "EMI Amount",
        emi_type: "EMI Type",
        tenure_months: "Tenure Months",
        interest_rate: "Interest Rate",
        interest_type: "Interest Type",
        deduction_type: "Deduction Type",
        start_date: "Start Date",
        status: "Status",
        amount: "Repayment Amount",
        payment_source: "Payment Source",
        description: "Description",
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class LoanController {
    /**
     * Creates a new loan record.
     */
    static async create(req, res) {
        const { error, value } = createLoanSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", error.details[0].message, friendlyMessage, error.details)
            );
        }

        try {
            const { loan, warnings } = await LoanService.createLoan(value, req.user);
            return res.status(201).json(
                successResponse("LOAN_CREATED", "Loan created successfully.", "Loan created successfully.", {
                    loan,
                    warning: warnings ? warnings[0] : null
                })
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to create loan.")
            );
        }
    }

    /**
     * Gets all historical and active loans for a worker.
     */
    static async getByEmployee(req, res) {
        const { employee_id } = req.params;
        if (!employee_id) {
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", "Employee ID is required.", "Employee ID is required.")
            );
        }

        try {
            const loans = await LoanService.getLoansByEmployee(employee_id, req.user);
            return res.status(200).json(
                successResponse("LOANS_RETRIEVED", "Loans retrieved successfully.", "Loans retrieved successfully.", loans)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "LOANS_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to retrieve loans.")
            );
        }
    }

    /**
     * Override terms or status of a loan.
     */
    static async update(req, res) {
        const { id } = req.params;
        const { error, value } = updateLoanSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", error.details[0].message, friendlyMessage, error.details)
            );
        }

        try {
            const updatedLoan = await LoanService.updateLoan(id, value, req.user);
            return res.status(200).json(
                successResponse("LOAN_UPDATED", "Loan updated successfully.", "Loan updated successfully.", updatedLoan)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "LOAN_UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to update loan.")
            );
        }
    }

    /**
     * Records a physical manual repayment.
     */
    static async recordRepayment(req, res) {
        const { id } = req.params;
        const { error, value } = manualRepaymentSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", error.details[0].message, friendlyMessage, error.details)
            );
        }

        try {
            const result = await LoanService.recordManualRepayment(id, value, req.user);
            return res.status(200).json(
                successResponse("REPAYMENT_RECORDED", "Repayment recorded successfully.", "Repayment recorded successfully.", result)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "REPAYMENT_RECORD_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to record repayment.")
            );
        }
    }

    /**
     * Performs FIFO loan repayment logic for a payroll deduction.
     */
    static async repayFIFO(req, res) {
        const { error, value } = fifoDeductionSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", error.details[0].message, friendlyMessage, error.details)
            );
        }

        try {
            const appliedAmount = await LoanService.repayFIFO(value.employee_id, value.amount, value.description, req.user);
            return res.status(200).json(
                successResponse("FIFO_DEDUCTION_APPLIED", "Deductions applied FIFO.", "Deductions applied successfully.", {
                    applied_amount: appliedAmount
                })
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "FIFO_DEDUCTION_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to apply FIFO deduction.")
            );
        }
    }

    /**
     * Gets transaction list for a specific loan.
     */
    static async getTransactions(req, res) {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", "Loan ID is required.", "Loan ID is required.")
            );
        }

        try {
            const transactions = await LoanService.getTransactionsByLoan(id, req.user);
            return res.status(200).json(
                successResponse("TRANSACTIONS_RETRIEVED", "Transactions retrieved successfully.", "Transactions retrieved successfully.", transactions)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "TRANSACTIONS_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to retrieve transactions.")
            );
        }
    }

    /**
     * Retrieves global loan summary statistics.
     */
    static async getSummary(req, res) {
        const { company_id } = req.query;
        if (!company_id) {
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required.")
            );
        }

        try {
            const summary = await LoanService.getLoanSummary(company_id, req.user);
            return res.status(200).json(
                successResponse("SUMMARY_RETRIEVED", "Summary retrieved successfully.", "Summary retrieved successfully.", summary)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "SUMMARY_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to retrieve summary.")
            );
        }
    }
}

module.exports = LoanController;
