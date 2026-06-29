const AddressService = require("./address.service");
const { createAddressSchema, updateAddressSchema } = require("./address.validators");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Formats Joi validation error messages to be user-friendly by removing double quotes
 * and converting snake_case keys to clean Title Case labels.
 */
const formatJoiMessage = (message) => {
    if (!message) return "";
    let clean = message.replace(/"/g, "");

    const mapping = {
        company_id: "Company ID",
        address: "Address",
        post_office: "Post Office",
        district: "District",
        pincode: "Pincode",
        status: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class AddressController {
    /**
     * Creates a new address.
     */
    static async create(req, res) {
        const { error, value } = createAddressSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    error.details[0].message,
                    friendlyMessage,
                    error.details
                )
            );
        }

        try {
            const newAddress = await AddressService.createAddress(value, req.user);

            return res.status(201).json(
                successResponse(
                    "ADDRESS_CREATED",
                    "Address created successfully.",
                    "Address created successfully.",
                    newAddress
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create address."
                )
            );
        }
    }

    /**
     * Gets all active addresses for a specific company.
     */
    static async getAll(req, res) {
        const { companyId } = req.params;
        if (!companyId) {
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    "Company ID is required.",
                    "Company ID is required."
                )
            );
        }

        try {
            const addresses = await AddressService.getAllAddresses(companyId, req.user);

            return res.status(200).json(
                successResponse(
                    "ADDRESSES_RETRIEVED",
                    "Addresses retrieved successfully.",
                    "Addresses retrieved successfully.",
                    addresses
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "ADDRESSES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve addresses."
                )
            );
        }
    }

    /**
     * Gets a single address by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const address = await AddressService.getAddressById(id, req.user);

            return res.status(200).json(
                successResponse(
                    "ADDRESS_RETRIEVED",
                    "Address retrieved successfully.",
                    "Address retrieved successfully.",
                    address
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "ADDRESS_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve address."
                )
            );
        }
    }

    /**
     * Updates an address.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateAddressSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    error.details[0].message,
                    friendlyMessage,
                    error.details
                )
            );
        }

        try {
            const updatedAddress = await AddressService.updateAddress(id, req.user, value);

            return res.status(200).json(
                successResponse(
                    "ADDRESS_UPDATED",
                    "Address updated successfully.",
                    "Address updated successfully.",
                    updatedAddress
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update address."
                )
            );
        }
    }

    /**
     * Deletes an address.
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await AddressService.deleteAddress(id, req.user);

            return res.status(200).json(
                successResponse(
                    "ADDRESS_DELETED",
                    "Address deleted successfully.",
                    "Address deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete address."
                )
            );
        }
    }
}

module.exports = AddressController;
