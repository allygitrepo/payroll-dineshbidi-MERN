const { DataTypes } = require("sequelize");

const BaseModel = {
    // Unique identifier automatically initialized as a UUID v4
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },

    // Audit field tracking the creator of the record
    created_at: {
        type: DataTypes.UUID,
        allowNull: true,
    },

    // Audit field tracking the user who last modified the record
    updated_at: {
        type: DataTypes.UUID,
        allowNull: true,
    },

    // Status flag indicating if the record is soft-deleted (soft deletes retain history in DB)
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}

module.exports = BaseModel;