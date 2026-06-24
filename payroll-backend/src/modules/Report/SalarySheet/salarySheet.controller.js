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
