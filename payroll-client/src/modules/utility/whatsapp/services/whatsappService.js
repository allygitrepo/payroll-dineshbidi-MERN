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
