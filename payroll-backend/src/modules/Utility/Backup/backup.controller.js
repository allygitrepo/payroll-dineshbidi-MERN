const fs = require('fs');
const path = require('path');
const mysqldump = require('mysqldump');
require('dotenv').config();

exports.exportDatabase = async (req, res) => {
    try {
        const dbName = process.env.DB_NAME;
        const now = new Date();
        const dateString = now.getFullYear() +
            '_' + String(now.getMonth() + 1).padStart(2, '0') +
            '_' + String(now.getDate()).padStart(2, '0');
        
        const fileName = `${dbName}_backup_${dateString}.sql`;
        const tempDir = path.join(__dirname, '../../../../tmp');
        
        // Ensure tmp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const dumpPath = path.join(tempDir, fileName);

        // Run mysqldump
        await mysqldump({
            connection: {
                host: process.env.DB_HOST || '127.0.0.1',
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: dbName,
            },
            dumpToFile: dumpPath,
        });

        // Send file to client
        res.download(dumpPath, fileName, (err) => {
            if (err) {
                console.error("Error downloading backup:", err);
            }
            // Cleanup temp file after download
            if (fs.existsSync(dumpPath)) {
                fs.unlinkSync(dumpPath);
            }
        });

    } catch (error) {
        console.error("Database backup error:", error);
        res.status(500).json({
            status: false,
            message: "Failed to generate database backup",
            error: error.message
        });
    }
};
