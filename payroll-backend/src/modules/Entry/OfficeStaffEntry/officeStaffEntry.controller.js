const db = require("../../../database/models/index");
const { OfficeStaffEntry, Employee, Calender, OfficeStaffSalary, ChallanSetup, ProfessionalTax } = db;
const { Op } = require("sequelize");

// Helper function to calculate PT based on slabs
const calculatePTAmount = (grossSalary, slabs) => {
    if (!slabs || slabs.length === 0) return 0;
    
    // Find the matching slab
    const applicableSlab = slabs.find(slab => {
        return grossSalary >= parseFloat(slab.from) && grossSalary <= parseFloat(slab.to);
    });

    return applicableSlab ? parseFloat(applicableSlab.tax_rate) : 0;
};

exports.getEntries = async (req, res) => {
    try {
        const company_id = req.query.company_id || req.user?.company_id;
        const { month_year } = req.query; // format: "YYYY-MM"

        if (!company_id || !month_year) {
            return res.status(400).json({ status: false, message: "Company ID and month_year are required" });
        }

        const [yearStr, monthStr] = month_year.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        
        // Calculate the last day of the month
        const lastDayOfMonth = new Date(year, month, 0);
        const lastDayOfMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth.getDate()).padStart(2, "0")}`;

        // 1. Fetch active Office Staff employees joined before or on the last day of the month
        const employees = await Employee.findAll({
            where: {
                company_id,
                employee_type: "OFFICE STAFF",
                date_of_joining: { [Op.lte]: lastDayOfMonthStr },
                status: true, // Assuming status true means not resigned, as we don't have Resignation model yet
            },
            attributes: ["id", "name", "uan", "member_id", "gender", "status", "date_of_joining"]
        });

        if (!employees.length) {
            return res.status(200).json({ status: true, data: [] });
        }

        const employeeIds = employees.map(emp => emp.id);

        // 2. Fetch existing entries for the given month_year
        const existingEntries = await OfficeStaffEntry.findAll({
            where: {
                company_id,
                month_year,
                employee_id: { [Op.in]: employeeIds }
            }
        });
        const existingMap = {};
        existingEntries.forEach(entry => {
            existingMap[entry.employee_id] = entry;
        });

        // 3. Fetch Calendar for the year to calculate Leave with Pay
        const calenders = await Calender.findAll({
            where: {
                company_id,
                year,
            }
        });

        // Calculate Leave With Pay
        let leaveWithPayCount = 0;
        // Count weekly holidays in the month
        const weeklyHoliday = calenders.find(c => c.holiday_type === "WEEKLY");
        if (weeklyHoliday && weeklyHoliday.week_day) {
            const dayName = weeklyHoliday.week_day.toUpperCase();
            const daysMap = { "SUNDAY": 0, "MONDAY": 1, "TUESDAY": 2, "WEDNESDAY": 3, "THURSDAY": 4, "FRIDAY": 5, "SATURDAY": 6 };
            const targetDay = daysMap[dayName];
            
            if (targetDay !== undefined) {
                for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
                    const currentDate = new Date(year, month - 1, d);
                    if (currentDate.getDay() === targetDay) {
                        leaveWithPayCount++;
                    }
                }
            }
        }
        
        // Count other holidays in the month
        const otherHolidays = calenders.filter(c => c.holiday_type !== "WEEKLY" && c.holiday_date);
        otherHolidays.forEach(h => {
            const d = new Date(h.holiday_date);
            if (d.getFullYear() === year && d.getMonth() === month - 1) {
                // Check if it's not falling on the weekly holiday
                const dayName = weeklyHoliday?.week_day?.toUpperCase();
                const daysMap = { "SUNDAY": 0, "MONDAY": 1, "TUESDAY": 2, "WEDNESDAY": 3, "THURSDAY": 4, "FRIDAY": 5, "SATURDAY": 6 };
                if (dayName && d.getDay() !== daysMap[dayName]) {
                    leaveWithPayCount++;
                } else if (!dayName) {
                    leaveWithPayCount++;
                }
            }
        });

        // 4. Fetch OfficeStaffSalary for the month
        const salaries = await OfficeStaffSalary.findAll({
            where: {
                company_id,
                employee_id: { [Op.in]: employeeIds },
                start_date: { [Op.lte]: lastDayOfMonthStr },
                end_date: { [Op.gte]: `${year}-${String(month).padStart(2, "0")}-01` }
            },
            order: [["start_date", "DESC"]]
        });
        const salaryMap = {};
        salaries.forEach(s => {
            if (!salaryMap[s.employee_id]) {
                salaryMap[s.employee_id] = s.salary;
            }
        });

        // 5. Fetch ChallanSetup for ESIC & PF rates
        const challanSetup = await ChallanSetup.findOne({
            where: { company_id },
            order: [["createdAt", "DESC"]]
        });

        // 6. Fetch ProfessionalTax slabs for the company
        const ptSlabs = await ProfessionalTax.findAll({
            where: { company_id }
        });

        const totalDaysInMonth = lastDayOfMonth.getDate();

        // Build the final array
        const responseData = employees.map(emp => {
            const existing = existingMap[emp.id];
            
            // Basic values
            const basicSalary = parseFloat(salaryMap[emp.id]) || 0;
            const uan = emp.uan || "";
            const empCode = emp.member_id || "";
            const employeeName = emp.name;
            const lwp = leaveWithPayCount;

            if (existing) {
                // Return existing formatted for frontend
                return {
                    id: existing.id, // For update reference
                    employeeId: emp.id,
                    employeeName,
                    employeeCode: empCode,
                    uan,
                    gender: emp.gender,
                    daysWorked: existing.no_of_days_worked,
                    leaveWithPay: existing.leave_with_pay,
                    leaveWithoutPay: existing.ncp_days,
                    addition: existing.addition_if_any,
                    basicSalary: existing.basic_salary,
                    gross: existing.gross_wages,
                    pf: existing.epf_contri_remitted,
                    pt: existing.pt_amount,
                    esic: existing.esic_amount,
                    netWages: existing.net_wages,
                };
            }

            // For new records, no default days should be pre-filled.
            // When the user inputs the days, the frontend will automatically calculate the rest.
            return {
                id: null,
                employeeId: emp.id,
                employeeName,
                employeeCode: empCode,
                uan,
                gender: emp.gender,
                daysWorked: "",
                leaveWithPay: lwp,
                leaveWithoutPay: 0,
                addition: 0,
                basicSalary,
                gross: 0,
                pf: 0,
                pt: 0,
                esic: 0,
                netWages: 0,
            };
        });

        // Also send configuration data for frontend recalculations
        res.status(200).json({
            status: true,
            data: responseData,
            config: {
                totalDaysInMonth,
                ptSlabs: ptSlabs.map(s => ({ from: s.from, to: s.to, taxRate: s.tax_rate })),
                pfRateMale: challanSetup ? parseFloat(challanSetup.ac1_ee_male) / 100 : 0.12,
                pfRateFemale: challanSetup ? parseFloat(challanSetup.ac1_ee_female) / 100 : 0.12,
                esicShare: challanSetup ? parseFloat(challanSetup.employee_share) / 100 : 0.0075,
                esicWageLimit: challanSetup ? parseFloat(challanSetup.esic_wages) : 21000,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.saveEntries = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { company_id: bodyCompanyId, month_year, entries } = req.body;
        const company_id = bodyCompanyId || req.user?.company_id;

        if (!company_id || !month_year || !Array.isArray(entries)) {
            return res.status(400).json({ status: false, message: "Invalid payload" });
        }

        const upsertPromises = entries.map(async (row) => {
            const dataToSave = {
                company_id,
                employee_id: row.employeeId,
                month_year,
                no_of_days_worked: row.daysWorked || 0,
                leave_with_pay: row.leaveWithPay || 0,
                ncp_days: row.leaveWithoutPay || 0,
                addition_if_any: row.addition || 0,
                basic_salary: row.basicSalary || 0,
                gross_wages: row.gross || 0,
                epf_wages: row.basicSalary || 0, // Assuming basic salary is the epf wage base
                epf_contri_remitted: row.pf || 0,
                pt_amount: row.pt || 0,
                esic_amount: row.esic || 0,
                net_wages: row.netWages || 0,
            };

            const existing = await OfficeStaffEntry.findOne({
                where: { company_id, month_year, employee_id: row.employeeId },
                transaction: t
            });

            if (existing) {
                return existing.update(dataToSave, { transaction: t });
            } else {
                return OfficeStaffEntry.create(dataToSave, { transaction: t });
            }
        });

        await Promise.all(upsertPromises);
        await t.commit();

        res.status(200).json({ status: true, message: "Entries saved successfully" });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.deleteEntries = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
        const { month_year } = req.query;

        if (!company_id || !month_year) {
            return res.status(400).json({ status: false, message: "Company ID and month_year are required" });
        }

        const deletedCount = await OfficeStaffEntry.destroy({
            where: { company_id, month_year }
        });

        res.status(200).json({ 
            status: true, 
            message: `Deleted ${deletedCount} Office Staff entries for ${month_year}`,
            deletedCount
        });
    } catch (error) {
        console.error("Delete Entries Error:", error);
        res.status(500).json({ status: false, message: "Failed to delete entries." });
    }
};
