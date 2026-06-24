const Note = require("./note.model");

class NoteService {
    static async createNote(data) {
        return await Note.create(data);
    }

    static async getAllNotes(companyId) {
        return await Note.findAll({
            where: { company_id: companyId, status: true },
            order: [["createdAt", "DESC"]],
        });
    }

    static async getNoteById(id, companyId) {
        const note = await Note.findOne({
            where: { id, company_id: companyId, status: true },
        });

        if (!note) {
            const error = new Error("Note not found");
            error.statusCode = 404;
            error.errorCode = "NOT_FOUND";
            throw error;
        }
        return note;
    }

    static async updateNote(id, companyId, data) {
        const note = await this.getNoteById(id, companyId);
        return await note.update(data);
    }

    static async deleteNote(id, companyId) {
        const note = await this.getNoteById(id, companyId);
        // Soft delete or hard delete depending on requirement
        // Here we'll soft delete by setting status to false, or hard delete. 
        // For notes, let's hard delete
        return await note.destroy();
    }
}

module.exports = NoteService;
