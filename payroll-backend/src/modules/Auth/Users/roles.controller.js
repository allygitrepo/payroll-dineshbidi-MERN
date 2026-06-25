const Role = require("./roles.model");

exports.createRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;
        
        const existingRole = await Role.findOne({ where: { name } });
        if (existingRole) {
            return res.status(400).json({ status: false, message: "Role with this name already exists" });
        }

        const role = await Role.create({ name, permissions });
        res.status(201).json({ status: true, message: "Role created successfully", data: role });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error creating role", error: error.message });
    }
};

exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.status(200).json({ status: true, data: roles });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error fetching roles", error: error.message });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions, status } = req.body;

        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ status: false, message: "Role not found" });
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
