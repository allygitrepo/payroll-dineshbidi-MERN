const Employee = require('../../Masters/Employee/employee.model');
const { Op } = require('sequelize');

exports.bulkUpdateIp = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { mappings } = req.body;

        if (!mappings || !Array.isArray(mappings)) {
            return res.status(400).json({ status: false, message: "Invalid payload: 'mappings' array is required" });
        }

        let successCount = 0;

        // Perform bulk update sequentially.
        // For larger arrays, Promise.all could be used, but sequential ensures DB connection isn't overwhelmed.
        for (const mapping of mappings) {
            if (!mapping.uan || !mapping.ipNumber) continue;

            const [updatedRowsCount] = await Employee.update(
                { ip_number: mapping.ipNumber },
                { 
                    where: { 
                        company_id: companyId,
                        uan: mapping.uan
                    } 
                }
            );

            if (updatedRowsCount > 0) {
                successCount++;
            }
        }

        res.status(200).json({
            status: true,
            message: `Successfully mapped and updated ${successCount} employee IP details in the database.`,
            data: { successCount }
        });

    } catch (error) {
        console.error("Bulk IP update error:", error);
        res.status(500).json({ status: false, message: "Failed to perform bulk update", error: error.message });
    }
};
