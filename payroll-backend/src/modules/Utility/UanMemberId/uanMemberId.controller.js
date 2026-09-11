const Employee = require('../../Masters/Employee/employee.model');

exports.bulkUpdateMemberId = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { mappings } = req.body;

        if (!mappings || !Array.isArray(mappings)) {
            return res.status(400).json({ status: false, message: "Invalid payload: 'mappings' array is required" });
        }

        let successCount = 0;

        for (const mapping of mappings) {
            if (!mapping.uan || !mapping.memberId) continue;

            const [updatedRowsCount] = await Employee.update(
                { member_id: mapping.memberId },
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
            message: `Successfully mapped and updated ${successCount} employee Member ID details in the database.`,
            data: { successCount }
        });

    } catch (error) {
        console.error("Bulk Member ID update error:", error);
        res.status(500).json({ status: false, message: "Failed to perform bulk update", error: error.message });
    }
};
