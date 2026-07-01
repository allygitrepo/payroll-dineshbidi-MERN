const axios = require('axios');
const { WhatsAppInstance, Company } = require("../../../database/models");

const WA_MITRA_API_URL = "https://silverapi.allysoftsolutions.com/wa-mitra/api/v1";
const MASTER_TOKEN = process.env.WA_MITRA_MASTER_TOKEN;

class WhatsAppService {
    static getHeaders() {
        if (!MASTER_TOKEN) throw new Error("WA_MITRA_MASTER_TOKEN is not defined in environment variables");
        return {
            'Authorization': `Bearer ${MASTER_TOKEN}`,
            'Content-Type': 'application/json'
        };
    }

    static logApiCall(method, url, payload, responseData, error = null) {
        console.log("==========================================");
        console.log(`[WA-Mitra API Request]`);
        console.log(`Method: ${method.toUpperCase()}`);
        console.log(`URL: ${url}`);
        if (payload) {
            console.log(`Payload:`, JSON.stringify(payload, null, 2));
        }
        if (responseData) {
            console.log(`[WA-Mitra API Response]`);
            console.log(`Data:`, JSON.stringify(responseData, null, 2));
        }
        if (error) {
            console.log(`[WA-Mitra API Error]`);
            console.log(`Message:`, error.message);
            if (error.response?.data) {
                console.log(`Error Response:`, JSON.stringify(error.response.data, null, 2));
            }
        }
        console.log("==========================================");
    }

    /**
     * Initiate or refresh a WhatsApp instance for a specific company
     */
    static async initiateOrRefreshInstance(companyId) {
        try {
            // Find existing instance in our DB
            let instance = await WhatsAppInstance.findOne({ where: { company_id: companyId } });
            
            // Fetch company details for naming
            const company = await Company.findByPk(companyId);
            const companyName = company && company.company_name ? company.company_name : companyId;

            let requestBody = {};
            if (instance && instance.instance_key) {
                // Refresh existing instance
                requestBody = { instanceKey: instance.instance_key };
            } else {
                // Initialize new instance for this company
                requestBody = { name: `Payroll_${companyName}` };
            }

            let response;
            try {
                response = await axios.post(`${WA_MITRA_API_URL}/instance/initiate`, requestBody, {
                    headers: this.getHeaders()
                });
                this.logApiCall('POST', `${WA_MITRA_API_URL}/instance/initiate`, requestBody, response.data);
            } catch (err) {
                this.logApiCall('POST', `${WA_MITRA_API_URL}/instance/initiate`, requestBody, null, err);
                // If it fails because instance was not found on the server (deleted, expired), create a new one
                if (err.response && err.response.status === 404 && err.response.data?.message === "Instance not found") {
                    // We can also clear the stale key from the request body
                    requestBody = { name: `Payroll_${companyName}` };
                    response = await axios.post(`${WA_MITRA_API_URL}/instance/initiate`, requestBody, {
                        headers: this.getHeaders()
                    });
                    this.logApiCall('POST', `${WA_MITRA_API_URL}/instance/initiate`, requestBody, response.data);
                } else {
                    throw err; // Re-throw other errors
                }
            }

            const data = response.data;
            
            if (!data.success) {
                console.error(`[WA-Mitra] Initiation failed from API:`, data);
                throw new Error("Failed to initiate WA-Mitra instance");
            }

            if (!instance) {
                // Create new DB record
                instance = await WhatsAppInstance.create({
                    company_id: companyId,
                    instance_key: data.instanceKey,
                    status: data.status,
                    valid_in_seconds: data.validinsecond || 40
                });
            } else {
                // Update existing record with the possibly new instance_key
                await instance.update({
                    instance_key: data.instanceKey,
                    status: data.status,
                    profile_image: data.profileImage || instance.profile_image,
                    name: data.name || instance.name,
                    phone: data.phone || instance.phone,
                    valid_in_seconds: data.validinsecond || 40
                });
            }

            return {
                success: true,
                status: data.status,
                qr: data.qr || null, // Base64 string
                instanceKey: data.instanceKey,
                validInSeconds: data.validinsecond || 40,
                message: data.message || "",
                profileImage: data.profileImage || null,
                name: data.name || null,
                phone: data.phone || null
            };

        } catch (error) {
            console.error(`[WA-Mitra] Request Failed:`, error.message);
            if (error.response) {
                console.error(`[WA-Mitra] Response Status:`, error.response.status);
                console.error(`[WA-Mitra] Response Data:`, JSON.stringify(error.response.data));
            }
            throw new Error(error.response?.data?.message || "Failed to initiate WhatsApp connection");
        }
    }

    /**
     * Get live status of an instance without generating a new QR
     */
    static async getInstanceStatus(companyId) {
        try {
            const instance = await WhatsAppInstance.findOne({ where: { company_id: companyId } });
            if (!instance || !instance.instance_key) {
                return { success: false, status: 'unlinked', message: 'No WhatsApp instance linked to this company' };
            }

            let response;
            try {
                response = await axios.get(`${WA_MITRA_API_URL}/instance/status?instanceKey=${instance.instance_key}`, {
                    headers: this.getHeaders()
                });
                this.logApiCall('GET', `${WA_MITRA_API_URL}/instance/status?instanceKey=${instance.instance_key}`, null, response.data);
            } catch (err) {
                this.logApiCall('GET', `${WA_MITRA_API_URL}/instance/status?instanceKey=${instance.instance_key}`, null, null, err);
                throw err;
            }

            const data = response.data;
            if (data.success) {
                await instance.update({
                    status: data.status,
                    phone: data.phone || instance.phone,
                    name: data.name || instance.name
                });
            }

            return data;
        } catch (error) {
            console.error("WhatsApp Status Error:", error.response?.data || error.message);
            if (error.response && error.response.status === 404 && error.response.data?.message === "Instance not found") {
                // If instance is deleted on server, mark as unlinked here
                return { success: false, status: 'unlinked', message: 'Instance not found on server' };
            }
            throw new Error("Failed to check WhatsApp status");
        }
    }

    /**
     * Delete instance from WA-Mitra and our database
     */
    static async deleteInstance(companyId) {
        try {
            const instance = await WhatsAppInstance.findOne({ where: { company_id: companyId } });
            if (!instance || !instance.instance_key) {
                return { success: true, message: "No active instance found to delete." };
            }

            let response;
            try {
                response = await axios.delete(`${WA_MITRA_API_URL}/instance/delete?instanceKey=${instance.instance_key}`, {
                    headers: this.getHeaders()
                });
                this.logApiCall('DELETE', `${WA_MITRA_API_URL}/instance/delete?instanceKey=${instance.instance_key}`, null, response.data);
            } catch (err) {
                this.logApiCall('DELETE', `${WA_MITRA_API_URL}/instance/delete?instanceKey=${instance.instance_key}`, null, null, err);
                throw err;
            }

            if (response.data.success) {
                await instance.destroy();
                return { success: true, message: "WhatsApp instance disconnected successfully" };
            }

            throw new Error("Failed to delete instance on WA-Mitra");
        } catch (error) {
            console.error("WhatsApp Delete Error:", error.response?.data || error.message);
            throw new Error("Failed to disconnect WhatsApp");
        }
    }

    /**
     * Send a single text message
     */
    static async sendTextMessage(companyId, number, message) {
        const payload = {};
        try {
            const instance = await WhatsAppInstance.findOne({ where: { company_id: companyId } });
            if (!instance || instance.status !== 'connected') {
                throw new Error("WhatsApp is not connected for this company");
            }

            payload.instanceKey = instance.instance_key;
            payload.number = number;
            payload.message = message;

            let response;
            try {
                response = await axios.post(`${WA_MITRA_API_URL}/messages/send`, payload, {
                    headers: this.getHeaders()
                });
                this.logApiCall('POST', `${WA_MITRA_API_URL}/messages/send`, payload, response.data);
            } catch (err) {
                this.logApiCall('POST', `${WA_MITRA_API_URL}/messages/send`, payload, null, err);
                throw err;
            }

            return response.data;
        } catch (error) {
            console.error("WhatsApp Send Error:", error.response?.data || error.message);
            throw new Error("Failed to send WhatsApp message");
        }
    }

    /**
     * Send bulk messages
     */
    static async sendBulkMessages(companyId, messages) {
        const payload = {};
        try {
            const instance = await WhatsAppInstance.findOne({ where: { company_id: companyId } });
            if (!instance || instance.status !== 'connected') {
                throw new Error("WhatsApp is not connected for this company");
            }

            payload.instanceKey = instance.instance_key;
            payload.messages = messages;

            let response;
            try {
                response = await axios.post(`${WA_MITRA_API_URL}/messages/bulk`, payload, {
                    headers: this.getHeaders()
                });
                this.logApiCall('POST', `${WA_MITRA_API_URL}/messages/bulk`, payload, response.data);
            } catch (err) {
                this.logApiCall('POST', `${WA_MITRA_API_URL}/messages/bulk`, payload, null, err);
                throw err;
            }

            return response.data;
        } catch (error) {
            console.error("WhatsApp Bulk Send Error:", error.response?.data || error.message);
            throw new Error("Failed to send bulk messages");
        }
    }
}

module.exports = WhatsAppService;
