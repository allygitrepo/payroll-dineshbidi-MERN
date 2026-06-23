const db = require("../../../database/models/index");
const { PackersEntry, Employee, PackingWage, ChallanSetup, ProfessionalTax } = db;
const { Op } = require("sequelize");

exports.getEntries = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
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
        const firstDayOfMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;

        // 1. Fetch active BIDI PACKER employees joined before or on the last day of the month
        const employees = await Employee.findAll({
            where: {
                company_id,
                employee_type: "BIDI PACKER",
                date_of_joining: { [Op.lte]: lastDayOfMonthStr },
                status: true,
            },
            attributes: ["id", "name", "uan", "member_id", "gender", "status", "date_of_joining"]
        });

        if (!employees.length) {
            return res.status(200).json({ status: true, data: [] });
        }

        const employeeIds = employees.map(emp => emp.id);

        // 2. Fetch existing entries for the given month_year
        const existingEntries = await PackersEntry.findAll({
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

        // 3. Fetch Packing Wages (Rates) for the month
        const packingWage = await PackingWage.findOne({
            where: {
                company_id,
                start_date: { [Op.lte]: firstDayOfMonthStr },
                end_date: { [Op.gte]: firstDayOfMonthStr }
            },
            order: [["start_date", "DESC"]]
        });

        const rate1 = packingWage ? parseFloat(packingWage.rate_1) : 0;
        const rate2 = packingWage ? parseFloat(packingWage.rate_2) : 0;
        const rate3 = packingWage ? parseFloat(packingWage.rate_3) : 0;
        const rate4 = packingWage ? parseFloat(packingWage.rate_4) : 0;

        // 4. Fetch ChallanSetup for ESIC & PF rates
        const challanSetup = await ChallanSetup.findOne({
            where: { company_id },
            order: [["createdAt", "DESC"]]
        });

        // 5. Fetch ProfessionalTax slabs for the company
        const ptSlabs = await ProfessionalTax.findAll({
            where: { company_id }
        });

        // Build the final array
        const responseData = employees.map(emp => {
            const existing = existingMap[emp.id];
            
            const uan = emp.uan || "";
            const empCode = emp.member_id || "";
            const employeeName = emp.name;

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
                    unit1: existing.unit_1,
                    unit2: existing.unit_2,
                    unit3: existing.unit_3,
                    unit4: existing.unit_4,
                    wages: existing.wages,
                    weeklyLeave: existing.weekly_leave,
                    addition: existing.addition_if_any,
                    gross: existing.gross_wages,
                    pf: existing.epf_contri_remitted,
                    pt: existing.pt_amount,
                    esic: existing.esic_amount,
                    netWages: existing.net_wages,
                };
            }

            // For new records, no default data.
            return {
                id: null,
                employeeId: emp.id,
                employeeName,
                employeeCode: empCode,
                uan,
                gender: emp.gender,
                daysWorked: "",
                unit1: "",
                unit2: "",
                unit3: "",
                unit4: "",
                wages: 0,
                weeklyLeave: 0,
                addition: "",
                gross: 0,
                pf: 0,
                pt: 0,
                esic: 0,
                netWages: 0,
            };
        });

        // Send configuration data for frontend recalculations
        res.status(200).json({
            status: true,
            data: responseData,
            config: {
                rate1,
                rate2,
                rate3,
                rate4,
                ptSlabs: ptSlabs.map(s => ({ from: s.from, to: s.to, taxRate: s.tax_rate })),
                pfRateMale: challanSetup ? parseFloat(challanSetup.ac1_ee_male) / 100 : 0.12,
                pfRateFemale: challanSetup ? parseFloat(challanSetup.ac1_ee_female) / 100 : 0.12,
                esicShare: challanSetup ? parseFloat(challanSetup.employee_share) / 100 : 0.0075,
                esicWageLimit: challanSetup ? parseFloat(challanSetup.esic_wages) : 176
            }
        });
    } catch (error) {
        console.error("PackersEntry getEntries error:", error);
        res.status(500).json({ status: false, message: "Internal server error", error: error.message });
    }
};

exports.saveEntries = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.body.company_id;
        const { month_year, entries } = req.body;

        if (!company_id || !month_year || !entries || !Array.isArray(entries)) {
            return res.status(400).json({ status: false, message: "Invalid payload" });
        }

        // We will process updates or inserts
        for (const entry of entries) {
            const payload = {
                company_id,
                employee_id: entry.employeeId,
                month_year,
                no_of_days_worked: parseFloat(entry.daysWorked) || 0,
                unit_1: parseInt(entry.unit1, 10) || 0,
                unit_2: parseInt(entry.unit2, 10) || 0,
                unit_3: parseInt(entry.unit3, 10) || 0,
                unit_4: parseInt(entry.unit4, 10) || 0,
                wages: parseFloat(entry.wages) || 0,
                weekly_leave: parseFloat(entry.weeklyLeave) || 0,
                addition_if_any: parseFloat(entry.addition) || 0,
                gross_wages: parseFloat(entry.gross) || 0,
                epf_wages: parseFloat(entry.gross) || 0, // Using gross as per instructions
                epf_contri_remitted: parseFloat(entry.pf) || 0,
                pt_amount: parseFloat(entry.pt) || 0,
                esic_amount: parseFloat(entry.esic) || 0,
                net_wages: parseFloat(entry.netWages) || 0,
            };

            if (entry.id) {
                // Update
                await PackersEntry.update(payload, { where: { id: entry.id } });
            } else {
                // Insert
                await PackersEntry.create(payload);
            }
        }

        res.status(200).json({ status: true, message: "Records saved successfully" });
    } catch (error) {
        console.error("PackersEntry saveEntries error:", error);
        res.status(500).json({ status: false, message: "Internal server error", error: error.message });
    }
};
