const sequelize = require('./src/config/database');

async function migrate() {
    try {
        await sequelize.query('ALTER TABLE Contractors ADD COLUMN whatsapp_number VARCHAR(15) NULL;');
        console.log('Column added successfully');
    } catch (e) {
        if (e.message.includes('Duplicate column')) {
            console.log('Column already exists');
        } else {
            console.error('Error:', e.message);
        }
    } finally {
        process.exit();
    }
}
migrate();
