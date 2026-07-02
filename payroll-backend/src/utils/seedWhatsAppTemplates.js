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
Company name: {{company_name}}
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
            } else {
                // Update old templates to use {{company_name}} if they had hardcoded names
                if (template.content.includes('Payroll management system') || !template.content.includes('{{company_name}}')) {
                    await template.update({ content: templateContent });
                    console.log(`WhatsApp template updated for company ${company.company_name}`);
                }
            }
        }
    } catch (error) {
        console.error("Failed to seed WhatsApp templates:", error);
    }
}

module.exports = seedWhatsAppTemplates;
