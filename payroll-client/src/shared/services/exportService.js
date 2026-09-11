import apiClient from './apiClient';
import * as XLSX from 'xlsx';

const exportClientExcel = (title, headers, rows, filename) => {
  const wsData = headers ? [headers, ...rows] : rows;
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  if (headers && headers.length > 0) {
    ws['!cols'] = headers.map((h, colIdx) => {
      let maxLen = String(h || '').length;
      rows.forEach(r => {
        const valStr = String(r[colIdx] ?? '');
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title || "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

const exportClientCsv = (headers, rows, filename) => {
  let csvContent = "\ufeff";
  if (headers) {
    csvContent += headers.map(h => `"${String(h ?? '').replace(/"/g, '""')}"`).join(',') + '\r\n';
  }
  rows.forEach(row => {
    csvContent += row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') + '\r\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportClientPrint = (title, headers, rows) => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${title || 'Export Report'}</title>
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
        </style>
    </head>
    <body>
        <button class="no-print-btn" onclick="window.print()">Print / Save PDF</button>
        <h1>${title || 'Export Report'}</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-GB')}</div>
        <table>
            <thead>
                <tr>
  `;
  
  (headers || []).forEach(h => {
      html += `<th>${h}</th>`;
  });
  
  html += `
                </tr>
            </thead>
            <tbody>
  `;
  
  (rows || []).forEach(row => {
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

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

export const exportModuleData = async (moduleName, format, fallbackData = null) => {
  try {
    const fmt = (format || '').toLowerCase();
    const filename = `${moduleName}_export`;

    // When client-side fallback data (headers and rows) is provided, use client generators
    if (fallbackData && fallbackData.rows && Array.isArray(fallbackData.rows)) {
      if (fmt === 'excel' || fmt === 'xls' || fmt === 'xlsx') {
        exportClientExcel(fallbackData.title || moduleName, fallbackData.headers, fallbackData.rows, filename);
        return;
      }
      if (fmt === 'csv') {
        exportClientCsv(fallbackData.headers, fallbackData.rows, filename);
        return;
      }
      if (fmt === 'pdf' || fmt === 'print') {
        exportClientPrint(fallbackData.title || moduleName, fallbackData.headers, fallbackData.rows);
        return;
      }
    }

    if (fmt === 'pdf' || fmt === 'print') {
      try {
        const response = await apiClient.get(`export/${moduleName}/${fmt}`);
        const htmlContent = response.data;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        }
        return;
      } catch (err) {
        if (fallbackData && fallbackData.rows) {
          console.warn('Server export failed, using client-side export fallback:', err.message);
          exportClientPrint(fallbackData.title || moduleName, fallbackData.headers, fallbackData.rows);
          return;
        }
        throw err;
      }
    }

    // For CSV and Excel via server
    try {
      const response = await apiClient.get(`export/${moduleName}/${fmt}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let downloadFileName = `${filename}.${fmt === 'excel' || fmt === 'xls' ? 'xls' : 'csv'}`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          downloadFileName = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (fallbackData && fallbackData.rows) {
        console.warn('Server export failed, using client-side export fallback:', err.message);
        if (fmt === 'excel' || fmt === 'xls' || fmt === 'xlsx') {
          exportClientExcel(fallbackData.title || moduleName, fallbackData.headers, fallbackData.rows, filename);
        } else {
          exportClientCsv(fallbackData.headers, fallbackData.rows, filename);
        }
        return;
      }
      throw err;
    }
  } catch (err) {
    console.error(`Export failed for ${moduleName} in ${format} format:`, err);
    throw err;
  }
};
