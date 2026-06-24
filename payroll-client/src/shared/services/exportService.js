import apiClient from './apiClient';

export const exportModuleData = async (moduleName, format) => {
  try {
    if (format === 'pdf' || format === 'print') {
      // For PDF and Print, we fetch the HTML and display it in a new window/tab to trigger printing
      const response = await apiClient.get(`export/${moduleName}/${format}`);
      const htmlContent = response.data;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
      return;
    }

    // For CSV and Excel, we download it as a binary blob
    const response = await apiClient.get(`export/${moduleName}/${format}`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Parse filename from Content-Disposition header if available
    let filename = `${moduleName}_export_${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(`Export failed for ${moduleName} in ${format} format:`, err);
    throw err;
  }
};
