import apiClient from '../../../../shared/services/apiClient';

export const bulkUpdateMemberIdMapping = async (companyId, payload) => {
    try {
        const response = await apiClient.post(`/utility/uan-member-id/${companyId}/bulk-update`, { mappings: payload });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.warn("Server endpoint /utility/uan-member-id not found on remote server, falling back to employee API updates:", error.message);
            
            let successCount = 0;
            for (const item of payload) {
                if (item.employeeId && item.memberId) {
                    try {
                        await apiClient.put(`employees/${item.employeeId}`, { member_id: item.memberId });
                        successCount++;
                    } catch (putErr) {
                        console.error(`Failed to update Member ID for employee ${item.employeeId}:`, putErr);
                    }
                }
            }
            return {
                status: true,
                message: `Successfully mapped and updated ${successCount} employee Member ID details in the database.`,
                data: { successCount }
            };
        }
        throw error;
    }
};
