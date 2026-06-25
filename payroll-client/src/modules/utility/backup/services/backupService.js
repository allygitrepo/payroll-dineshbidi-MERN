import apiClient from '../../../../shared/services/apiClient';

export const exportDatabase = async () => {
    try {
        const response = await apiClient.get('/utility/backup', {
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
