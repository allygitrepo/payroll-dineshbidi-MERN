const db = require("../../../database/models/index");
const { BidiRollerEntry, Employee, BidiRollerWage, ChallanSetup, ProfessionalTax } = db;
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

        // 1. Fetch active BIDI MAKER employees joined before or on the last day of the month
        const employees = await Employee.findAll({
            where: {
                company_id,
                employee_type: "BIDI MAKER",
                date_of_joining: { [Op.lte]: lastDayOfMonthStr },
                status: true,
            },
            attributes: ["id", "name", "uan", "member_id", "gender", "status", "date_of_joining", "contractor_id"]
        });

        if (!employees.length) {
            return res.status(200).json({ status: true, data: [] });
        }

        const employeeIds = employees.map(emp => emp.id);

        // 2. Fetch existing entries for the given month_year
        const existingEntries = await BidiRollerEntry.findAll({
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

        // 3. Fetch Bidi Roller Wages (Rates and Bonuses) for the month
        const bidiRollerWage = await BidiRollerWage.findOne({
            where: {
                company_id,
                start_date: { [Op.lte]: firstDayOfMonthStr }
            },
            order: [["start_date", "DESC"]]
        });

        const rate1 = bidiRollerWage ? parseFloat(bidiRollerWage.rate_1) : 0;
        const rate2 = bidiRollerWage ? parseFloat(bidiRollerWage.rate_2) : 0;
        const bonus1 = bidiRollerWage ? parseFloat(bidiRollerWage.bonus_1) : 0;
        const bonus2 = bidiRollerWage ? parseFloat(bidiRollerWage.bonus_2) : 0;

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
                    contractorId: emp.contractor_id,
                    daysWorked: existing.no_of_days_worked,
                    leaveWithPay: existing.leave_with_pay,
                    unit1: existing.unit_1_days,
                    unit2: existing.unit_2_days,
                    wages: existing.wages,
                    bonus: existing.bonus,
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
                contractorId: emp.contractor_id,
                daysWorked: "",
                leaveWithPay: "",
                unit1: "",
                unit2: "",
                wages: 0,
                bonus: 0,
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
                bonus1,
                bonus2,
                ptSlabs: ptSlabs.map(s => ({ from: s.from, to: s.to, taxRate: s.tax_rate })),
                pfRateMale: challanSetup ? parseFloat(challanSetup.ac1_ee_male) / 100 : 0.12,
                pfRateFemale: challanSetup ? parseFloat(challanSetup.ac1_ee_female) / 100 : 0.12,
                esicShare: challanSetup ? parseFloat(challanSetup.employee_share) / 100 : 0.0075,
                esicWageLimit: challanSetup ? parseFloat(challanSetup.esic_wages) : 176
            }
        });
    } catch (error) {
        console.error("Error fetching bidi roller entries:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

exports.saveEntries = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const company_id = req.user?.company_id || req.body.company_id;
        const { month_year, entries } = req.body; // array of objects

        if (!company_id || !month_year || !Array.isArray(entries)) {
            return res.status(400).json({ status: false, message: "Invalid payload" });
        }

        for (const row of entries) {
            const employee_id = row.employeeId;
            const no_of_days_worked = parseFloat(row.daysWorked) || 0;
            const leave_with_pay = parseFloat(row.leaveWithPay) || 0;
            const unit_1_days = parseFloat(row.unit1) || 0;
            const unit_2_days = parseFloat(row.unit2) || 0;
            const wages = parseFloat(row.wages) || 0;
            const bonus = parseFloat(row.bonus) || 0;
            const gross_wages = parseFloat(row.gross) || 0;
            // epf_wages is calculated as gross without bonus (or just piece wages + leave wages)
            const epf_wages = wages;
            const epf_contri_remitted = parseFloat(row.pf) || 0;
            const pt_amount = parseFloat(row.pt) || 0;
            const esic_amount = parseFloat(row.esic) || 0;
            const net_wages = parseFloat(row.netWages) || 0;

            if (row.id) {
                // Update existing
                await BidiRollerEntry.update(
                    {
                        no_of_days_worked,
                        leave_with_pay,
                        unit_1_days,
                        unit_2_days,
                        wages,
                        bonus,
                        gross_wages,
                        epf_wages,
                        epf_contri_remitted,
                        pt_amount,
                        esic_amount,
                        net_wages,
                    },
                    { where: { id: row.id, company_id }, transaction }
                );
            } else {
                // Ignore empty rows
                if (no_of_days_worked > 0 || unit_1_days > 0 || unit_2_days > 0) {
                    await BidiRollerEntry.create(
                        {
                            company_id,
                            employee_id,
                            month_year,
                            no_of_days_worked,
                            leave_with_pay,
                            unit_1_days,
                            unit_2_days,
                            wages,
                            bonus,
                            gross_wages,
                            epf_wages,
                            epf_contri_remitted,
                            pt_amount,
                            esic_amount,
                            net_wages,
                        },
                        { transaction }
                    );
                }
            }
        }

        await transaction.commit();
        res.status(200).json({ status: true, message: "Entries saved successfully" });
    } catch (error) {
        await transaction.rollback();
        console.error("Error saving bidi roller entries:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};
