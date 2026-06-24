const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

exports.previewRestore = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: false, message: "No SQL file uploaded" });
        }

        const filePath = req.file.path;
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Extract tables and count insert statements for a preview
        const createTableRegex = /CREATE TABLE `([^`]+)`/g;
        const insertRegex = /INSERT INTO `([^`]+)`/g;

        const tables = [];
        let match;

        // Find all tables
        while ((match = createTableRegex.exec(sqlContent)) !== null) {
            tables.push({ tableName: match[1], rowsCount: 0 });
        }

        // Count rows per table
        while ((match = insertRegex.exec(sqlContent)) !== null) {
            const tName = match[1];
            const tObj = tables.find(t => t.tableName === tName);
            if (tObj) {
                tObj.rowsCount++;
            }
        }

        // Summary stats for the frontend
        const summary = {
            tablesFound: tables.length,
            totalRows: tables.reduce((acc, t) => acc + t.rowsCount, 0)
        };

        res.status(200).json({
            status: true,
            message: "File analyzed successfully",
            data: {
                tempFilename: req.file.filename,
                tables,
                summary
            }
        });
    } catch (error) {
        console.error("Preview error:", error);
        res.status(500).json({ status: false, message: "Failed to parse backup file", error: error.message });
    }
};

exports.executeRestore = async (req, res) => {
    try {
        const { tempFilename } = req.body;
        if (!tempFilename) {
            return res.status(400).json({ status: false, message: "Temporary filename is required" });
        }

        const filePath = path.join(__dirname, '../../../../tmp/uploads', tempFilename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ status: false, message: "Backup file not found or expired" });
        }

        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Establish raw mysql2 connection with multipleStatements allowed to execute dump safely
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true // VERY IMPORTANT for executing .sql dumps
        });

        // Execute full dump
        await connection.query(sqlContent);
        await connection.end();

        // Cleanup
        fs.unlinkSync(filePath);

        res.status(200).json({
            status: true,
            message: "Database restored successfully."
        });
    } catch (error) {
        console.error("Restore execution error:", error);
        res.status(500).json({ status: false, message: "Failed to execute database restore", error: error.message });
    }
};
