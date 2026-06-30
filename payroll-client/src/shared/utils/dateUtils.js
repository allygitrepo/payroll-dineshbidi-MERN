export const parseExcelDate = (val) => {
  if (!val) return '';
  if (val instanceof Date) {
    // xlsx constructs the Date such that its LOCAL time represents midnight of the Excel date.
    // However, due to historical JS Date timezone bugs (e.g. 5:30 to 5:53 offsets before 1900),
    // it can sometimes result in 23:59:50 of the *previous* day.
    // Adding 12 hours safely pushes the time to ~12:00 PM, guaranteeing we extract the correct calendar day.
    const safeDate = new Date(val.getTime() + 12 * 60 * 60 * 1000);
    const yyyy = safeDate.getFullYear();
    const mm = String(safeDate.getMonth() + 1).padStart(2, '0');
    const dd = String(safeDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  if (typeof val === 'number') {
    // Fallback if cellDates: true was not used (raw Excel date serial)
    // Excel dates represent days since Dec 30, 1899
    const days = Math.round(val);
    const date = new Date(Date.UTC(1899, 11, 30 + days));
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  
  if (typeof val === 'string') {
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // If it's DD/MM/YYYY or D/M/YY
    const parts = val.split(/[\/\-]/);
    if (parts.length === 3) {
      const p2 = parts[2];
      const p1 = String(parts[1]).padStart(2, '0');
      const p0 = String(parts[0]).padStart(2, '0');
      if (p2.length === 4) {
        // Assume DD/MM/YYYY
        return `${p2}-${p1}-${p0}`;
      } else if (p2.length === 2) {
        // Assume DD/MM/YY
        return `20${p2}-${p1}-${p0}`;
      }
    }
    return val;
  }
  return '';
};
