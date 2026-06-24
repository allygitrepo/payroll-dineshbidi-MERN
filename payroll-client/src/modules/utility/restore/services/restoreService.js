import apiClient from '../../../../shared/services/apiClient';

export const uploadForPreview = async (file) => {
    try {
        const formData = new FormData();
        formData.append('sqlFile', file);

        const response = await apiClient.post('/utility/restore/preview', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const executeRestore = async (tempFilename) => {
    try {
        const response = await apiClient.post('/utility/restore/execute', {
            tempFilename
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
