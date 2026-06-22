const PackingWageService = require("../Setup/PackingWage/packingWage.service");
const BidiRollerWageService = require("../Setup/BidiRollerWage/bidiRollerWage.service");
const ChallanSetupService = require("../Setup/ChallanSetup/challanSetup.service");
const ProfessionalTaxService = require("../Setup/ProfessionalTax/professionalTax.service");
const OfficeStaffSalaryService = require("../Setup/OfficeStaffSalary/officeStaffSalary.service");
const EmployeeService = require("../Masters/Employee/employee.service");
const ContractorService = require("../Masters/Contractor/contractor.service");
const CompanyService = require("../Masters/Company/company.service");

// Date formatting helper
const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
};

// CSV escaping helper
const escapeCSV = (val) => {
    if (val === null || val === undefined) return "";
    let str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

// Excel HTML table generator
const generateExcelHtml = (title, headers, rows) => {
    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta http-equiv="Content-type" content="text/html;charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>${title}</x:Name>
                        <x:WorksheetOptions>
                            <x:DisplayGridlines/>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
            table { border-collapse: collapse; }
            th { background-color: #4CAF50; color: white; font-weight: bold; border: 1px solid #ddd; padding: 8px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; text-align: left; mso-number-format:"\\@"; }
            .title-row { font-size: 16px; font-weight: bold; text-align: center; height: 40px; background-color: #2e7d32; }
        </style>
    </head>
    <body>
        <table>
            <tr><th colspan="${headers.length}" class="title-row">${title}</th></tr>
            <tr></tr>
            <tr>
    `;
    
    headers.forEach(h => {
        html += `<th>${h}</th>`;
    });
    
    html += `</tr>`;
    
    rows.forEach(row => {
        html += `<tr>`;
        row.forEach(cell => {
            html += `<td>${cell === null || cell === undefined ? "" : cell}</td>`;
        });
        html += `</tr>`;
    });
    
    html += `
        </table>
    </body>
    </html>
    `;
    return html;
};

// Print / PDF HTML table generator
const generatePrintHtml = (title, headers, rows) => {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; margin: 30px; }
            h1 { text-align: center; color: #2e7d32; margin-bottom: 5px; font-size: 24px; }
            .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f1f3f4; color: #202124; font-weight: 600; border: 1px solid #dadce0; padding: 10px 8px; text-align: left; }
            td { border: 1px solid #dadce0; padding: 8px; text-align: left; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            @media print {
                body { margin: 0; }
                button { display: none; }
            }
            .no-print-btn {
                background-color: #2e7d32;
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 14px;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 20px;
                float: right;
            }
            .no-print-btn:hover {
                background-color: #1b5e20;
            }
        </style>
    </head>
    <body>
        <button class="no-print-btn" onclick="window.print()">Print / Save PDF</button>
        <h1>${title}</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-GB')}</div>
        <table>
            <thead>
                <tr>
    `;
    
    headers.forEach(h => {
        html += `<th>${h}</th>`;
    });
    
    html += `
                </tr>
            </thead>
            <tbody>
    `;
    
    rows.forEach(row => {
        html += `<tr>`;
        row.forEach(cell => {
            html += `<td>${cell === null || cell === undefined ? "" : cell}</td>`;
        });
        html += `</tr>`;
    });
    
    html += `
            </tbody>
        </table>
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            };
        </script>
    </body>
    </html>
    `;
    return html;
};

// Module configuration mappings
const moduleMappings = {
    "packing-wages": {
        title: "Packing Wages Report",
        headers: ["Sr. No.", "Start Date", "End Date", "Rate 1", "Rate 2", "Rate 3", "Rate 4", "Bonus"],
        fetch: (companyId, userId) => PackingWageService.getAllPackingWages(companyId, userId),
        map: (row, idx) => [
            idx + 1,
            formatDate(row.start_date),
            formatDate(row.end_date),
            row.rate_1 || "0.00",
            row.rate_2 || "0.00",
            row.rate_3 || "0.00",
            row.rate_4 || "0.00",
            row.bonus || "0.00"
        ]
    },
    "bidi-roller-wages": {
        title: "Bidi Roller Wages Report",
        headers: ["Sr. No.", "Start Date", "End Date", "Rate 1", "HRA 1", "Bonus 1", "Rate 2", "HRA 2"],
        fetch: (companyId, userId) => BidiRollerWageService.getAllBidiRollerWages(companyId, userId),
        map: (row, idx) => [
            idx + 1,
            formatDate(row.start_date),
            formatDate(row.end_date),
            row.rate_1 || "0.00",
            row.hra_1 || "0.00",
            row.bonus_1 || "0.00",
            row.rate_2 || "0.00",
            row.hra_2 || "0.00"
        ]
    },
    "challan-setups": {
        title: "Challan Setup Report",
        headers: [
            "Sr. No.", "Start Date", "End Date", "Salary Limit", "EDLI Wages", 
            "A/c No.1 EE (Male)", "A/c No.1 EE (Female)", "A/c No.1 ER", "A/c No.2", "A/c No.10", 
            "A/c No.21", "A/c No.22", "A/c No.2 Min", "A/c No.22 Min", "PMRPY", 
            "ESIC Wages", "Employee Share (%)", "Employer Share"
        ],
        fetch: (companyId, userId) => ChallanSetupService.getAllChallanSetups(companyId, userId),
        map: (row, idx) => [
            idx + 1,
            formatDate(row.start_date),
            formatDate(row.end_date),
            row.salary_limit || "0.00",
            row.edli_wages || "0.00",
            row.ac1_ee_male || "0.00",
            row.ac1_ee_female || "0.00",
            row.ac1_er || "0.00",
            row.ac2 || "0.00",
            row.ac10 || "0.00",
            row.ac21 || "0.00",
            row.ac22 || "0.00",
            row.ac2_min || "0.00",
            row.ac22_min || "0.00",
            row.pmrpy || "0.00",
            row.esic_wages || "0.00",
            row.employee_share || "0.00",
            row.employer_share || "0.00"
        ]
    },
    "professional-taxes": {
        title: "Professional Tax Report",
        headers: ["Sr. No.", "Start Date", "End Date", "From Amount", "To Amount", "Tax Rate"],
        fetch: (companyId, userId) => ProfessionalTaxService.getAllProfessionalTaxes(companyId, userId),
        map: (row, idx) => [
            idx + 1,
            formatDate(row.start_date),
            formatDate(row.end_date),
            row.from_amount || "0.00",
            row.to_amount || "0.00",
            row.tax_rate || "0.00"
        ]
    },
    "office-staff-salaries": {
        title: "Office Staff Salary Report",
        headers: ["Sr. No.", "Employee Name", "Start Date", "End Date", "Salary", "Standard Bonus", "Additional Bonus"],
        fetch: (companyId, userId) => OfficeStaffSalaryService.getAllOfficeStaffSalaries(companyId, userId),
        map: (row, idx) => [
            idx + 1,
            row.employee ? row.employee.name : "Unknown",
            formatDate(row.start_date),
            formatDate(row.end_date),
            row.salary || "0.00",
            row.standard_bonus || "0.00",
            row.additional_bonus || "0.00"
        ]
    },
    "employees": {
        title: "Employee Master Report",
        headers: [
            "Sr. No.", "ABRY Applicable", "UAN", "IP Number", "Member ID", 
            "Member Name", "Date Of Birth", "Date of Joining", "Gender", "Father/Husband Name"
        ],
        fetch: (companyId, userId) => EmployeeService.getAllEmployees(companyId, userId),
        map: (row, idx) => [
            idx + 1,
            row.abry_applicable ? "Yes" : "No",
            row.uan || "-",
            row.ip_number || "-",
            row.member_id || "-",
            row.name || "-",
            formatDate(row.dob),
            formatDate(row.date_of_joining),
            row.gender || "-",
            row.father_or_husband_name || "-"
        ]
    },
    "contractors": {
        title: "Contractor Master Report",
        headers: [
            "Sr. No.", "Ccode", "Name", "Address", "Post Office", "District", 
            "Pincode", "PF Code", "Date of Joining", "PAN", "Aadhaar", 
            "GST No.", "Bank A/c", "Bank Name", "IFSC", "Status"
        ],
        fetch: (companyId, userId) => ContractorService.getAllContractors(companyId, userId),
        map: (row, idx) => [
            idx + 1,
            row.ccode || "-",
            row.name || "-",
            row.address?.address || "-",
            row.address?.post_office || "-",
            row.address?.district || "-",
            row.address?.pincode || "-",
            row.pf_code || "-",
            formatDate(row.date_of_joining),
            row.pan || "-",
            row.aadhar || "-",
            row.gst_no || "-",
            row.bank_ac || "-",
            row.bank_name || "-",
            row.ifsc || "-",
            row.status ? "Active" : "Inactive"
        ]
    },
    "companies": {
        title: "Company Master Report",
        headers: [
            "Sr. No.", "Estb ID", "Establishment Name", "Establishment Type", 
            "Under EPFO Office", "LIN No.", "ESIC ID", "Address", 
            "Post Office", "District", "Pincode", "PAN"
        ],
        fetch: (companyId, userId) => CompanyService.getAllCompanies(userId),
        map: (row, idx) => [
            idx + 1,
            row.establishment_id || "-",
            row.company_name || "-",
            row.company_type || "-",
            row.epfo_office || "-",
            row.lin_number || "-",
            row.esic_id || "-",
            row.address_line || "-",
            row.post_office || "-",
            row.district || "-",
            row.pincode || "-",
            row.pan || "-"
        ]
    }
};

class ExportController {
    static async exportData(req, res) {
        const { module: moduleName, format } = req.params;
        const companyId = req.companyId; // Bound by auth.middleware.js

        const config = moduleMappings[moduleName];
        if (!config) {
            return res.status(404).json({
                success: false,
                code: "MODULE_NOT_FOUND",
                message: `Export config not found for module: ${moduleName}`
            });
        }

        try {
            // Fetch records from database
            const data = await config.fetch(companyId, req.user.id);
            const mappedRows = data.map((row, idx) => config.map(row, idx));

            if (format === "csv") {
                // Generate CSV
                let csvContent = "\ufeff"; // Add BOM for excel utf-8 compat
                // Headers row
                csvContent += config.headers.map(h => escapeCSV(h)).join(",") + "\r\n";
                // Data rows
                mappedRows.forEach(row => {
                    csvContent += row.map(cell => escapeCSV(cell)).join(",") + "\r\n";
                });

                res.setHeader("Content-Type", "text/csv; charset=utf-8");
                res.setHeader("Content-Disposition", `attachment; filename="${moduleName}_export_${Date.now()}.csv"`);
                return res.status(200).send(csvContent);

            } else if (format === "excel" || format === "xls") {
                // Generate styled Excel HTML
                const excelContent = generateExcelHtml(config.title, config.headers, mappedRows);

                res.setHeader("Content-Type", "application/vnd.ms-excel");
                res.setHeader("Content-Disposition", `attachment; filename="${moduleName}_export_${Date.now()}.xls"`);
                return res.status(200).send(excelContent);

            } else if (format === "pdf" || format === "print") {
                // Generate beautiful Print HTML view
                const printContent = generatePrintHtml(config.title, config.headers, mappedRows);

                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(200).send(printContent);

            } else {
                return res.status(400).json({
                    success: false,
                    code: "UNSUPPORTED_FORMAT",
                    message: `Export format not supported: ${format}`
                });
            }

        } catch (err) {
            console.error("Export Error:", err);
            return res.status(err.statusCode || 500).json({
                success: false,
                code: err.errorCode || "EXPORT_FAILED",
                message: err.message || "Failed to generate export file."
            });
        }
    }
}

module.exports = ExportController;
