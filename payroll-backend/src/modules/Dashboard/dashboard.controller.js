const { Op, literal } = require('sequelize');
const OfficeStaffEntry = require('../Entry/OfficeStaffEntry/officeStaffEntry.model');
const PackersEntry = require('../Entry/PackersEntry/packersEntry.model');
const BidiRollerEntry = require('../Entry/BidiRollerEntry/bidiRollerEntry.model');
const ChallanDateEntry = require('../Entry/ChallanDateEntry/challanDateEntry.model');
const Note = require('../Todo List/Note/note.model');
const Employee = require('../Masters/Employee/employee.model');
const Contractor = require('../Masters/Contractor/contractor.model');
const Attendance = require('../Attendance/attendance.model');
const sequelize = require('../../config/database');

exports.getSummary = async (req, res) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        // 1. Compute "Last Month" strings
        const date = new Date();
        date.setMonth(date.getMonth() - 1);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        const lastMonthYyyyMm = `${year}-${month}`; // for entry models
        const lastMonthMmYyyy = `${month}/${year}`; // for challan model
        const displayMonthStr = date.toLocaleString('default', { month: 'short' }) + '-' + year;

        // 2. Aggregate Wages
        // Office Staff
        const officeStats = await OfficeStaffEntry.findOne({
            where: { company_id: companyId, month_year: lastMonthYyyyMm },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'nos'],
                [sequelize.fn('SUM', sequelize.col('gross_wages')), 'amount']
            ]
        });

        // Packers
        const packersStats = await PackersEntry.findOne({
            where: { company_id: companyId, month_year: lastMonthYyyyMm },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'nos'],
                [sequelize.fn('SUM', sequelize.col('gross_wages')), 'amount']
            ]
        });

        // Bidi Rollers
        const bidiStats = await BidiRollerEntry.findOne({
            where: { company_id: companyId, month_year: lastMonthYyyyMm },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'nos'],
                [sequelize.fn('SUM', sequelize.col('gross_wages')), 'amount']
            ]
        });

        const staffData = [
            {
                type: 'Office Staff',
                month: displayMonthStr,
                nos: parseInt(officeStats?.getDataValue('nos') || 0, 10),
                amount: parseFloat(officeStats?.getDataValue('amount') || 0)
            },
            {
                type: 'Packing Staff',
                month: displayMonthStr,
                nos: parseInt(packersStats?.getDataValue('nos') || 0, 10),
                amount: parseFloat(packersStats?.getDataValue('amount') || 0)
            },
            {
                type: 'Bidi Roller',
                month: displayMonthStr,
                nos: parseInt(bidiStats?.getDataValue('nos') || 0, 10),
                amount: parseFloat(bidiStats?.getDataValue('amount') || 0)
            }
        ];

        // 3. Compliance Status
        const challan = await ChallanDateEntry.findOne({
            where: { company_id: companyId, wage_month: lastMonthMmYyyy }
        });

        const formatChallanDate = (d) => {
            if (!d || d === '0000-00-00') return { status: 'Pending', date: '-' };
            // Optional format DD-MMM-YYYY
            const parsed = new Date(d);
            const formatted = `${String(parsed.getDate()).padStart(2, '0')}-${parsed.toLocaleString('default', { month: 'short' })}-${parsed.getFullYear()}`;
            return { status: 'Completed', date: formatted };
        };

        const pfChallanDateInfo = formatChallanDate(challan?.challan_date);
        const pfReturnDateInfo = formatChallanDate(challan?.return_date);

        // Assuming ESIC Challan logic follows the same challan_date currently
        // If ESIC date is different, it needs to be mapped to appropriate DB column.
        const esicChallanDateInfo = formatChallanDate(challan?.challan_date);

        const challanStatus = [
            { type: 'PF Challan', month: displayMonthStr, status: pfChallanDateInfo.status, date: pfChallanDateInfo.date },
            { type: 'PF Return', month: displayMonthStr, status: pfReturnDateInfo.status, date: pfReturnDateInfo.date },
            { type: 'ESIC Challan', month: displayMonthStr, status: esicChallanDateInfo.status, date: esicChallanDateInfo.date }
        ];

        // 4. Fetch Notes
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const notesData = await Note.findAll({
            where: {
                company_id: companyId,
                date: {
                    [Op.between]: [today.toISOString().split('T')[0], nextMonth.toISOString().split('T')[0]]
                }
            },
            order: [['date', 'ASC']]
        });

        // 5. Fetch Retiring Employees (Age >= 58)
        const retireData = await Employee.findAll({
            where: {
                company_id: companyId,
                status: true,
                dob: {
                    [Op.ne]: null
                },
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('TIMESTAMPDIFF', sequelize.literal('YEAR'), sequelize.col('dob'), sequelize.fn('CURDATE')),
                        '>=',
                        58
                    )
                ]
            },
            include: [{
                model: Contractor,
                as: 'contractor',
                attributes: ['name']
            }],
            order: [['name', 'ASC']]
        });

        const retireList = retireData.map(emp => {
            const parsedDob = emp.dob ? new Date(emp.dob) : null;
            const formattedDob = parsedDob ? `${String(parsedDob.getDate()).padStart(2, '0')}/${String(parsedDob.getMonth()+1).padStart(2, '0')}/${parsedDob.getFullYear()}` : '-';
            return {
                name: emp.name,
                acNo: emp.member_id || '-',
                uan: emp.uan || '-',
                dob: formattedDob,
                contractor: emp.contractor ? emp.contractor.name : '-'
            };
        });

        // 6. Fetch 3-Month Absent List (No Attendance in last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const absentData = await Employee.findAll({
            where: {
                company_id: companyId,
                status: true,
                id: {
                    [Op.notIn]: sequelize.literal(`(SELECT employee_id FROM attendance WHERE date >= '${ninetyDaysAgo.toISOString().split('T')[0]}')`)
                }
            },
            include: [{
                model: Contractor,
                as: 'contractor',
                attributes: ['name']
            }],
            limit: 50, // Limit to prevent massive payload if attendance is unused
            order: [['name', 'ASC']]
        });

        const absentList = absentData.map(emp => ({
            name: emp.name,
            acNo: emp.member_id || '-',
            uan: emp.uan || '-',
            contractor: emp.contractor ? emp.contractor.name : '-'
        }));

        let notesText = "No upcoming notes found.";
        if (notesData && notesData.length > 0) {
            notesText = notesData.map((n, idx) => `${idx + 1}. ${n.content}`).join('\n');
        }

        res.status(200).json({
            status: true,
            data: {
                staffData,
                challanStatus,
                notesText,
                retireList,
                absentList
            }
        });

    } catch (error) {
        console.error("Dashboard Summary Error:", error);
        res.status(500).json({ status: false, message: "Failed to fetch dashboard summary", error: error.message });
    }
};
