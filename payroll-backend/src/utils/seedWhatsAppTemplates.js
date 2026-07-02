const db = require("../database/models");



async function seedWhatsAppTemplates() {
    try {
        const companies = await db.Company.findAll({ where: { cstatus: true } });

        for (const company of companies) {
            const template = await db.WhatsAppTemplate.findOne({
                where: {
                    company_id: company.id,
                    name: 'Contractor Login Credentials'
                }
            });

            const templateContent = `Hello {{name}},
Your login ID and password are as follows for 
 ${company.company_name}
Url: payroll.allysoftsolutions.com
Username: {{username}}
Password: {{password}}`;

            if (!template) {
                await db.WhatsAppTemplate.create({
                    company_id: company.id,
                    name: 'Contractor Login Credentials',
                    content: templateContent,
                    status: true
                });
                console.log(`Default WhatsApp template created for company ${company.company_name}`);
            }
        }
    } catch (error) {
        console.error("Failed to seed WhatsApp templates:", error);
    }
}

module.exports = seedWhatsAppTemplates;
