const Role = require("./roles.model");

exports.createRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;
        const created_by = req.user ? req.user.id : null;
        
        const existingRole = await Role.findOne({ where: { name, created_by } });
        if (existingRole) {
            return res.status(400).json({ status: false, message: "Role with this name already exists" });
        }

        const role = await Role.create({ name, permissions, created_by });
        res.status(201).json({ status: true, message: "Role created successfully", data: role });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error creating role", error: error.message });
    }
};

exports.getAllRoles = async (req, res) => {
    try {
        const whereClause = {};
        if (req.user) {
            if (req.user.role_name === 'OWNER') {
                const { Op } = require('sequelize');
                whereClause.created_by = { [Op.or]: [null, req.user.id] };
            } else {
                whereClause.created_by = req.user.id;
            }
        }
        const roles = await Role.findAll({ where: whereClause });
        res.status(200).json({ status: true, data: roles });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error fetching roles", error: error.message });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions, status } = req.body;
        const created_by = req.user ? req.user.id : null;

        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ status: false, message: "Role not found" });
        }
        
        // Ensure uniqueness for the user
        const existingRole = await Role.findOne({ where: { name, created_by } });
        if (existingRole && existingRole.id !== role.id) {
            return res.status(400).json({ status: false, message: "Role with this name already exists" });
        }

        await role.update({ name, permissions, status });
        res.status(200).json({ status: true, message: "Role updated successfully", data: role });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error updating role", error: error.message });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        
        if (!role) {
            return res.status(404).json({ status: false, message: "Role not found" });
        }

        await role.destroy();
        res.status(200).json({ status: true, message: "Role deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error deleting role", error: error.message });
    }
};
