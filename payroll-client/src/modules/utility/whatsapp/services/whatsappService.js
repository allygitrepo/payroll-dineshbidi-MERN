import api from '../../../../shared/services/apiClient';

/**
 * Initiates or refreshes the WhatsApp connection
 * @returns {Promise} The API response with instance details and QR
 */
export const initiateWhatsApp = async () => {
    try {
        const response = await api.post('/whatsapp/initiate');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Gets the live status of the WhatsApp connection
 * @returns {Promise} The API response with connection status
 */
export const getWhatsAppStatus = async () => {
    try {
        const response = await api.get('/whatsapp/status');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Disconnects and deletes the WhatsApp instance
 * @returns {Promise}
 */
export const disconnectWhatsApp = async () => {
    try {
        const response = await api.delete('/whatsapp/disconnect');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// --- Templates ---

export const getTemplates = async () => {
    try {
        const response = await api.get('/whatsapp/templates');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createTemplate = async (data) => {
    try {
        const response = await api.post('/whatsapp/templates', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateTemplate = async (id, data) => {
    try {
        const response = await api.put(`/whatsapp/templates/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteTemplate = async (id) => {
    try {
        const response = await api.delete(`/whatsapp/templates/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const sendBulkMessage = async (payload) => {
    try {
        const response = await api.post('/whatsapp/send-bulk', payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
