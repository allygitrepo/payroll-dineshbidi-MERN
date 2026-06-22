// Custom Axios API instance - replace or implement to point to your backend API base URL
import api from './api'; 

export const attendanceService = {
  /**
   * Log employee sign-in
   * @param {string} location - Geolocation string (e.g. 'lat:X, lon:Y')
   * @param {string} photo - Base64 encoded snapshot string
   */
  signIn: async (location, photo) => {
    const payload = {};
    if (location) payload.location = location;
    if (photo) payload.photo = photo;
    const res = await api.post('/attendance/sign-in', payload);
    return res.data?.data || null;
  },

  /**
   * Log employee sign-out
   * @param {string} location - Geolocation string (e.g. 'lat:X, lon:Y')
   * @param {string} photo - Base64 encoded snapshot string
   */
  signOut: async (location, photo) => {
    const payload = {};
    if (location) payload.location = location;
    if (photo) payload.photo = photo;
    const res = await api.post('/attendance/sign-out', payload);
    return res.data?.data || null;
  },

  /**
   * Get attendance logs for the currently authenticated employee
   */
  listMine: async () => {
    const res = await api.get('/attendance/my');
    return res.data?.data || [];
  },

  /**
   * Fetch today's current sign-in/sign-out state for the user
   */
  getToday: async () => {
    const res = await api.get('/attendance/my/today');
    return res.data?.data || null;
  },

  /**
   * Get attendance logs across all users (Requires Admin roles)
   * @param {Object} params - optional filters
   * @param {number} params.month - 1-12
   * @param {number} params.year - YYYY
   */
  listAll: async (params = {}) => {
    const search = new URLSearchParams();
    if (params.month) search.set('month', String(params.month));
    if (params.year) search.set('year', String(params.year));
    const qs = search.toString();
    const url = `/attendance${qs ? `?${qs}` : ''}`;
    const res = await api.get(url);
    return res.data?.data || [];
  },

  /**
   * Fetch detailed report dataset
   */
  report: async ({ start, end, employee_id } = {}) => {
    const search = new URLSearchParams();
    if (start) search.set('start', start);
    if (end) search.set('end', end);
    if (employee_id) search.set('employee_id', String(employee_id));
    const res = await api.get(`/attendance/report?${search.toString()}`);
    return res.data?.data || [];
  },

  /**
   * Download CSV or PDF reports in browser
   * @param {string} start - 'YYYY-MM-DD'
   * @param {string} end - 'YYYY-MM-DD'
   * @param {string|number} employee_id
   * @param {string} format - 'csv' or 'pdf'
   */
  downloadReport: async ({ start, end, employee_id, format = 'csv' } = {}) => {
    const search = new URLSearchParams();
    if (start) search.set('start', start);
    if (end) search.set('end', end);
    if (employee_id) search.set('employee_id', String(employee_id));
    search.set('format', format);
    
    const res = await api.get(`/attendance/report?${search.toString()}`, { responseType: 'blob' });
    const contentDisposition = res.headers['content-disposition'] || '';
    let filename = `attendance_report_${start}_${end}.${format}`;
    const m = /filename=([^;]+)/i.exec(contentDisposition);
    if (m) filename = m[1].replace(/"/g,'');
    
    const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};
