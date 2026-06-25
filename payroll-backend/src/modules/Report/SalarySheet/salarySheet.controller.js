const db = require("../../../database/models/index");
const { OfficeStaffEntry, Employee } = db;

exports.getOfficeSalarySheet = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
        const { month_year } = req.query; // format: "YYYY-MM"

        if (!company_id || !month_year) {
            return res.status(400).json({ status: false, message: "Company ID and month_year are required" });
        }

        const [yearStr, monthStr] = month_year.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const lastDayOfMonth = new Date(year, month, 0).getDate();

        // Fetch office staff entries for this month, joined with employee details
        const entries = await OfficeStaffEntry.findAll({
            where: { company_id, month_year },
            include: [{
                model: Employee,
                as: "employee",
                attributes: ["member_id", "name", "uan", "gender"]
            }],
            order: [[{ model: Employee, as: "employee" }, "name", "ASC"]]
        });

        const reportData = entries.map(entry => {
            const emp = entry.employee;
            const basic = parseFloat(entry.basic_salary) || 0;
            const daysWorked = parseFloat(entry.no_of_days_worked) || 0;
            const absentDays = parseFloat(entry.ncp_days) || 0;
            const leaveWithPay = parseFloat(entry.leave_with_pay) || 0;
            
            // Re-calculate the "Salary Cut" for display purpose.
            const perDaySalary = basic / lastDayOfMonth;
            const salaryCut = perDaySalary * absentDays;

            return {
                id: entry.id,
                employeeCode: emp?.member_id || "",
                name: emp?.name || "Unknown",
                uan: emp?.uan || "",
                gender: emp?.gender || "",
                totalDaysInMonth: lastDayOfMonth,
                daysWorked: daysWorked,
                absentDays: absentDays,
                leaveWithPay: leaveWithPay,
                basicSalary: basic.toFixed(2),
                salaryCut: salaryCut.toFixed(2),
                addition: parseFloat(entry.addition_if_any || 0).toFixed(2),
                grossWages: parseFloat(entry.gross_wages || 0).toFixed(2),
                pf: parseFloat(entry.epf_contri_remitted || 0).toFixed(2),
                pt: parseFloat(entry.pt_amount || 0).toFixed(2),
                esic: parseFloat(entry.esic_amount || 0).toFixed(2),
                netWages: parseFloat(entry.net_wages || 0).toFixed(2)
            };
        });

        res.status(200).json({
            status: true,
            data: reportData,
            message: "Office Salary Sheet fetched successfully"
        });
    } catch (error) {
        console.error("Error generating Office Salary Sheet:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.getPackingSalarySheet = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
        const { month_year } = req.query; // format: "YYYY-MM"

        if (!company_id || !month_year) {
            return res.status(400).json({ status: false, message: "Company ID and month_year are required" });
        }

        const entries = await db.PackersEntry.findAll({
            where: { company_id, month_year },
            include: [{
                model: Employee,
                as: "employee",
                attributes: ["member_id", "name", "uan", "gender"]
            }],
            order: [[{ model: Employee, as: "employee" }, "name", "ASC"]]
        });

        const activeWage = await db.PackingWage.findOne({
            where: { company_id, status: true },
            order: [['createdAt', 'DESC']]
        });
        
        const rate1 = activeWage ? parseFloat(activeWage.rate_1 || 0) : 0;
        const rate2 = activeWage ? parseFloat(activeWage.rate_2 || 0) : 0;
        const rate3 = activeWage ? parseFloat(activeWage.rate_3 || 0) : 0;
        const rate4 = activeWage ? parseFloat(activeWage.rate_4 || 0) : 0;

        const reportData = entries.map(entry => {
            const emp = entry.employee;
            return {
                id: entry.id,
                employeeCode: emp?.member_id || "",
                name: emp?.name || "Unknown",
                uan: emp?.uan || "",
                gender: emp?.gender || "",
                daysWorked: parseFloat(entry.no_of_days_worked || 0),
                unit1: parseInt(entry.unit_1 || 0),
                rate1: rate1,
                unit2: parseInt(entry.unit_2 || 0),
                rate2: rate2,
                unit3: parseInt(entry.unit_3 || 0),
                rate3: rate3,
                unit4: parseInt(entry.unit_4 || 0),
                rate4: rate4,
                totalWages: parseFloat(entry.wages || 0).toFixed(2),
                extraPayment: parseFloat(entry.addition_if_any || 0).toFixed(2),
                holidayPayment: parseFloat(entry.weekly_leave || 0).toFixed(2),
                grossAmount: parseFloat(entry.gross_wages || 0).toFixed(2),
                pt: parseFloat(entry.pt_amount || 0).toFixed(2),
                pf: parseFloat(entry.epf_contri_remitted || 0).toFixed(2),
                esic: parseFloat(entry.esic_amount || 0).toFixed(2),
                netPayable: parseFloat(entry.net_wages || 0).toFixed(2)
            };
        });

        res.status(200).json({
            status: true,
            data: reportData,
            message: "Packing Salary Sheet fetched successfully"
        });
    } catch (error) {
        console.error("Error generating Packing Salary Sheet:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.getContractorSalarySheet = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
        const { month_year } = req.query; // format: "YYYY-MM"

        if (!company_id || !month_year) {
            return res.status(400).json({ status: false, message: "Company ID and month_year are required" });
        }

        const entries = await db.BidiRollerEntry.findAll({
            where: { company_id, month_year },
            include: [{
                model: db.Employee,
                as: "employee",
                attributes: ["member_id", "name", "uan", "pmrpy"],
                include: [{
                    model: db.Contractor,
                    as: "contractor",
                    attributes: ["name", "pf_code"]
                }]
            }],
            order: [[{ model: db.Employee, as: "employee" }, "name", "ASC"]]
        });

        const reportData = entries.map(entry => {
            const emp = entry.employee;
            const contractorName = emp?.contractor ? `${emp.contractor.name} - ${emp.contractor.pf_code}` : "None";
            
            return {
                id: entry.id,
                employeeCode: emp?.member_id || "",
                name: emp?.name || "Unknown",
                uan: emp?.uan || "",
                contractor: contractorName,
                quantity: parseFloat(entry.unit_1_days || 0) + parseFloat(entry.unit_2_days || 0),
                daysWorked: parseFloat(entry.no_of_days_worked || 0),
                wages: parseFloat(entry.wages || 0).toFixed(2),
                hra: parseFloat(entry.bonus || 0).toFixed(2),
                total: parseFloat(entry.gross_wages || 0).toFixed(2),
                pf: parseFloat(entry.epf_contri_remitted || 0).toFixed(2),
                esic: parseFloat(entry.esic_amount || 0).toFixed(2),
                abry: emp?.pmrpy ? "1" : "0", // Mapping ABRY to pmrpy flag based on UI logic
                netPaid: parseFloat(entry.net_wages || 0).toFixed(2)
            };
        });

        res.status(200).json({
            status: true,
            data: reportData,
            message: "Contractor Salary Sheet fetched successfully"
        });
    } catch (error) {
        console.error("Error generating Contractor Salary Sheet:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};
