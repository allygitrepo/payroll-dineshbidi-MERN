const db = require("../../../database/models/index");
const { ChallanDateEntry } = db;
const { saveChallanDateEntrySchema } = require("./challanDateEntry.validator");

exports.getEntries = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;

        if (!company_id) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        const entries = await ChallanDateEntry.findAll({
            where: { company_id },
            order: [["wage_month", "DESC"]], // Or maybe order by creation date
        });

        return res.status(200).json({
            status: true,
            data: entries,
        });
    } catch (error) {
        console.error("Error fetching challan date entries:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

exports.saveEntry = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.body.company_id;
        
        if (!company_id) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        const payload = { ...req.body, company_id };

        // Validate
        const { error, value } = saveChallanDateEntrySchema.validate(payload, { abortEarly: false });
        if (error) {
            const errors = error.details.map((err) => ({
                field: err.context.key,
                message: err.message,
            }));
            return res.status(400).json({ status: false, message: "Validation failed", errors });
        }

        let entry;
        if (value.id) {
            entry = await ChallanDateEntry.findByPk(value.id);
            if (!entry) {
                return res.status(404).json({ status: false, message: "Entry not found" });
            }
            // Ensure company_id matches
            if (entry.company_id !== company_id) {
                return res.status(403).json({ status: false, message: "Unauthorized to update this entry" });
            }
            await entry.update(value);
        } else {
            entry = await ChallanDateEntry.create(value);
        }

        return res.status(200).json({
            status: true,
            message: value.id ? "EPF Challan updated successfully" : "EPF Challan created successfully",
            data: entry,
        });
    } catch (error) {
        console.error("Error saving challan date entry:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const company_id = req.user?.company_id || req.query.company_id;
        const { id } = req.params;

        if (!company_id) {
            return res.status(400).json({ status: false, message: "Company ID is required" });
        }

        const entry = await ChallanDateEntry.findByPk(id);
        if (!entry) {
            return res.status(404).json({ status: false, message: "Entry not found" });
        }

        if (entry.company_id !== company_id) {
            return res.status(403).json({ status: false, message: "Unauthorized to delete this entry" });
        }

        await entry.destroy();

        return res.status(200).json({
            status: true,
            message: "EPF Challan deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting challan date entry:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};
