import apiClient from '../../../../shared/services/apiClient';

export const bulkUpdateIpMapping = async (companyId, payload) => {
    try {
        const response = await apiClient.post(`/utility/uan-to-ip/${companyId}/bulk-update`, { mappings: payload });
        return response.data;
    } catch (error) {
        throw error;
    }
};
