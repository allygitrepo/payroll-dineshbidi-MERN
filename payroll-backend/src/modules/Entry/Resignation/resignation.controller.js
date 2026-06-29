const db = require("../../../database/models/index");
const { Resignation, Employee } = db;
const { saveResignationSchema } = require("./resignation.validator");

exports.getResignations = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;

        if (!company_id) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        const entries = await Resignation.findAll({
            where: { company_id },
            order: [["created_at", "DESC"]],
            raw: true
        });

        const employees = await Employee.findAll({
            where: { company_id },
            attributes: ['member_id', 'uan', 'name', 'father_or_husband_name'],
            raw: true
        });

        const empMap = {};
        employees.forEach(emp => {
            if (emp.member_id) {
                empMap[emp.member_id] = emp;
            }
        });

        const data = entries.map(entry => ({
            ...entry,
            uan: entry.account_no ? (empMap[entry.account_no]?.uan || '') : '',
            name_of_member: entry.account_no ? (empMap[entry.account_no]?.name || '') : '',
            name_of_parents: entry.account_no ? (empMap[entry.account_no]?.father_or_husband_name || '') : ''
        }));

        return res.status(200).json({
            status: true,
            data: data,
        });
    } catch (error) {
        console.error("Error fetching resignations:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

exports.saveResignation = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.body.company_id;

        if (!company_id) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        const payload = { ...req.body, company_id };

        // Validate
        const { error, value } = saveResignationSchema.validate(payload, { abortEarly: false });
        if (error) {
            const errors = error.details.map((err) => ({
                field: err.context.key,
                message: err.message,
            }));
            return res.status(400).json({ status: false, message: "Validation failed", errors });
        }

        let entry;
        if (value.id) {
            entry = await Resignation.findByPk(value.id);
            if (!entry) {
                return res.status(404).json({ status: false, message: "Resignation not found" });
            }
            if (entry.company_id !== company_id) {
                return res.status(403).json({ status: false, message: "Unauthorized to update this record" });
            }
            await entry.update(value);
        } else {
            entry = await Resignation.create(value);
        }

        return res.status(200).json({
            status: true,
            message: value.id ? "Resignation updated successfully" : "Resignation created successfully",
            data: entry,
        });
    } catch (error) {
        console.error("Error saving resignation:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

exports.deleteResignation = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
        const { id } = req.params;

        if (!company_id) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        const entry = await Resignation.findByPk(id);
        if (!entry) {
            return res.status(404).json({ status: false, message: "Resignation not found" });
        }

        if (entry.company_id !== company_id) {
            return res.status(403).json({ status: false, message: "Unauthorized to delete this record" });
        }

        await entry.destroy();

        return res.status(200).json({
            status: true,
            message: "Resignation deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting resignation:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

exports.getEmployeeByUan = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
        const { uan } = req.params;

        if (!company_id) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        const employee = await Employee.findOne({
            where: { company_id, uan, status: true },
            attributes: ['uan', 'name', 'father_or_husband_name', 'member_id']
        });

        if (!employee) {
            return res.status(404).json({ status: false, message: "Employee not found with this UAN" });
        }

        return res.status(200).json({
            status: true,
            data: {
                uan: employee.uan,
                name_of_member: employee.name,
                name_of_parents: employee.father_or_husband_name,
                account_no: employee.member_id
            }
        });

    } catch (error) {
        console.error("Error fetching employee by UAN:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};
