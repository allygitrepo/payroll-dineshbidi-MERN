const NoteService = require("./note.service");
const { createNoteSchema, updateNoteSchema } = require("./note.validators");
const { successResponse, errorResponse } = require("../../../utils/response");

const formatJoiMessage = (message) => {
    if (!message) return "";
    let clean = message.replace(/"/g, "");
    const mapping = {
        company_id: "Company ID",
        date: "Date",
        content: "Note content",
    };
    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }
    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class NoteController {
    static async create(req, res) {
        const { error, value } = createNoteSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", error.details[0].message, friendlyMessage, error.details)
            );
        }

        try {
            const newNote = await NoteService.createNote(value);
            return res.status(201).json(
                successResponse("NOTE_CREATED", "Note created successfully.", "Note created successfully.", newNote)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to create note.")
            );
        }
    }

    static async getAll(req, res) {
        const { companyId } = req.params;
        if (!companyId) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required."));
        }

        try {
            const notes = await NoteService.getAllNotes(companyId);
            return res.status(200).json(
                successResponse("NOTES_RETRIEVED", "Notes retrieved successfully.", "Notes retrieved successfully.", notes)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "NOTES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to retrieve notes.")
            );
        }
    }

    static async update(req, res) {
        const { id } = req.params;
        // In this implementation, the frontend usually passes companyId in body or headers
        // Since we want company context to verify, let's assume it is in req.body
        const companyId = req.body.company_id || req.headers['company-id'];

        if (!companyId) {
             return res.status(400).json(errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required."));
        }

        const { error, value } = updateNoteSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", error.details[0].message, friendlyMessage, error.details)
            );
        }

        try {
            const updatedNote = await NoteService.updateNote(id, companyId, value);
            return res.status(200).json(
                successResponse("NOTE_UPDATED", "Note updated successfully.", "Note updated successfully.", updatedNote)
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to update note.")
            );
        }
    }

    static async delete(req, res) {
        const { id } = req.params;
        const companyId = req.headers['company-id'];

        if (!companyId) {
             return res.status(400).json(errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required."));
        }

        try {
            await NoteService.deleteNote(id, companyId);
            return res.status(200).json(
                successResponse("NOTE_DELETED", "Note deleted successfully.", "Note deleted successfully.")
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(errorCode, err.message, err.messageToShow || "Failed to delete note.")
            );
        }
    }
}

module.exports = NoteController;
