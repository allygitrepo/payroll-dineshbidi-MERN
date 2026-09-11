import apiClient from '../../../../shared/services/apiClient';

export const bulkUpdateIpMapping = async (companyId, payload) => {
    try {
        const response = await apiClient.post(`/utility/uan-to-ip/${companyId}/bulk-update`, { mappings: payload });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.warn("Server endpoint /utility/uan-to-ip not found on remote server, falling back to employee API updates:", error.message);
            
            let successCount = 0;
            for (const item of payload) {
                if (item.employeeId && item.ipNumber) {
                    try {
                        await apiClient.put(`employees/${item.employeeId}`, { ip_number: item.ipNumber });
                        successCount++;
                    } catch (putErr) {
                        console.error(`Failed to update IP number for employee ${item.employeeId}:`, putErr);
                    }
                }
            }
            return {
                status: true,
                message: `Successfully mapped and updated ${successCount} employee IP details in the database.`,
                data: { successCount }
            };
        }
        throw error;
    }
};
