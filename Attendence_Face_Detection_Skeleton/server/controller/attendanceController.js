// Require database models - replace with actual paths to your project models
const Attendance = require("../model/attendance");
const Employee = require("./employee_placeholder"); // Replace with Employee/User model import
const { Op } = require("sequelize");

const attendanceController = {
  /**
   * Log today's check-in for the authenticated user
   */
  signInToday: async (req, res) => {
    try {
      const { location, photo } = req.body || {};
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      // Check if user already checked in today
      let record = await Attendance.findOne({ where: { employee_id: userId, date: todayStr } });
      
      if (!record) {
        // If checking in late, e.g., after 6 PM local, auto checkout is set to 6 PM
        const workEnd = new Date(`${todayStr}T18:00:00`);
        const createPayload = {
          employee_id: userId,
          date: todayStr,
          sign_in_time: now,
          status: true,
          location: location || null,
          sign_in_photo: photo || null,
        };
        
        if (!isNaN(workEnd) && now >= workEnd) {
          createPayload.sign_out_time = workEnd;
          createPayload.is_auto_signout = true;
        }
        
        record = await Attendance.create(createPayload);
        const fresh = await Attendance.findByPk(record.id);
        return res.status(201).json({ status: true, message: 'Signed in successfully', data: fresh });
      }

      if (record.sign_in_time) {
        // If checked in earlier but check-out is missing and it's past 6 PM, check out automatically
        const workEnd = new Date(`${todayStr}T18:00:00`);
        if (!record.sign_out_time && !isNaN(workEnd) && now >= workEnd) {
          await record.update({ sign_out_time: workEnd, is_auto_signout: true });
        }
        const fresh = await Attendance.findByPk(record.id);
        return res.status(200).json({ status: true, message: 'Already signed in', data: fresh });
      }

      // Update check-in record
      const updatePayload = { sign_in_time: now, status: true };
      if (location) updatePayload.location = location;
      if (photo) updatePayload.sign_in_photo = photo;
      
      await record.update(updatePayload);
      
      // Auto-check out check
      const workEnd = new Date(`${todayStr}T18:00:00`);
      if (!record.sign_out_time && !isNaN(workEnd) && now >= workEnd) {
        await record.update({ sign_out_time: workEnd, is_auto_signout: true });
      }
      
      const fresh = await Attendance.findByPk(record.id);
      return res.status(200).json({ status: true, message: 'Signed in successfully', data: fresh });
    } catch (err) {
      console.error('signInToday server exception:', err);
      res.status(500).json({ status: false, message: err.message });
    }
  },

  /**
   * Log today's check-out for the authenticated user
   */
  signOutToday: async (req, res) => {
    try {
      const { location, photo } = req.body || {};
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const record = await Attendance.findOne({ where: { employee_id: userId, date: todayStr } });
      if (!record) {
        return res.status(400).json({ status: false, message: 'You must check-in before checking out' });
      }
      if (record.sign_out_time) {
        const fresh = await Attendance.findByPk(record.id);
        return res.status(200).json({ status: true, message: 'Already checked out', data: fresh });
      }

      // If check-out is registered after 6 PM local, lock/cap check-out time to 18:00
      const workEnd = new Date(`${todayStr}T18:00:00`);
      const signOutAt = (!isNaN(workEnd) && now >= workEnd) ? workEnd : now;
      
      const updatePayload = { sign_out_time: signOutAt };
      if (location) updatePayload.sign_out_location = location;
      if (photo) updatePayload.sign_out_photo = photo;
      
      await record.update(updatePayload);
      const fresh = await Attendance.findByPk(record.id);
      return res.status(200).json({ status: true, message: 'Checked out successfully', data: fresh });
    } catch (err) {
      console.error('signOutToday server exception:', err);
      res.status(500).json({ status: false, message: err.message });
    }
  },

  /**
   * Fetch attendance logs belonging to current employee session
   */
  getMyAttendance: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const records = await Attendance.findAll({
        where: { employee_id: userId },
        order: [["date", "DESC"]],
      });
      res.status(200).json({ status: true, message: 'Fetched log records', data: records });
    } catch (err) {
      console.error('getMyAttendance server exception:', err);
      res.status(500).json({ status: false, message: err.message });
    }
  },

  /**
   * Fetch today's current check-in log status for user session
   */
  getMyToday: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      let record = await Attendance.findOne({ where: { employee_id: userId, date: todayStr } });
      
      // Auto-closing check
      const workEnd = new Date(`${todayStr}T18:00:00`);
      if (record && record.sign_in_time && !record.sign_out_time && !isNaN(workEnd) && today >= workEnd) {
        await record.update({ sign_out_time: workEnd, is_auto_signout: true });
        record = await Attendance.findByPk(record.id);
      }
      
      res.status(200).json({ status: true, message: 'Today fetched', data: record });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  /**
   * CRUD & Report logic (Admin protected endpoints)
   */
  createAttendance: async (req, res) => {
    try {
      const { employee_id, date, sign_in_time, sign_out_time, status, location, sign_out_location } = req.body;
      if (!employee_id || !date) {
        return res.status(400).json({ status: false, message: "Employee ID and Date are required" });
      }
      
      const formattedSignIn = sign_in_time ? new Date(`${date}T${sign_in_time}`) : null;
      const formattedSignOut = sign_out_time ? new Date(`${date}T${sign_out_time}`) : null;

      const newRecord = await Attendance.create({
        employee_id,
        date,
        sign_in_time: formattedSignIn,
        sign_out_time: formattedSignOut,
        status: status !== undefined ? status : true,
        location: location || null,
        sign_out_location: sign_out_location || null,
      });

      res.status(201).json({ status: true, message: "Created successfully", data: newRecord });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  getAllAttendance: async (req, res) => {
    try {
      const { month, year } = req.query;
      let where = {};
      if (month && year) {
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);
        if (!isNaN(m) && !isNaN(y) && m >= 1 && m <= 12) {
          const start = `${y}-${String(m).padStart(2, '0')}-01`;
          const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
          const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          where.date = { [Op.between]: [start, end] };
        }
      }

      const records = await Attendance.findAll({
        where,
        order: [["date", "DESC"]],
      });
      res.status(200).json({ status: true, data: records });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  getAttendanceById: async (req, res) => {
    try {
      const record = await Attendance.findByPk(req.params.id);
      if (!record) return res.status(404).json({ status: false, message: "Record not found" });
      res.status(200).json({ status: true, data: record });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  updateAttendance: async (req, res) => {
    try {
      const record = await Attendance.findByPk(req.params.id);
      if (!record) return res.status(404).json({ status: false, message: "Record not found" });
      
      const { date, sign_in_time, sign_out_time, status, location, sign_out_location } = req.body;
      const formattedSignIn = sign_in_time ? new Date(`${date}T${sign_in_time}`) : null;
      const formattedSignOut = sign_out_time ? new Date(`${date}T${sign_out_time}`) : null;

      await record.update({
        date: date || record.date,
        sign_in_time: sign_in_time ? formattedSignIn : record.sign_in_time,
        sign_out_time: sign_out_time ? formattedSignOut : record.sign_out_time,
        status: status !== undefined ? status : record.status,
        location: location || record.location,
        sign_out_location: sign_out_location || record.sign_out_location,
      });

      res.status(200).json({ status: true, message: "Updated successfully", data: record });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteAttendance: async (req, res) => {
    try {
      const record = await Attendance.findByPk(req.params.id);
      if (!record) return res.status(404).json({ status: false, message: "Record not found" });
      await record.destroy();
      res.status(200).json({ status: true, message: "Deleted successfully" });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  report: async (req, res) => {
    try {
      const { start, end, employee_id: employeeId, format } = req.query;
      if (!start || !end) {
        return res.status(400).json({ status: false, message: 'start and end dates are required (YYYY-MM-DD)' });
      }

      const where = { date: { [Op.between]: [start, end] } };
      if (employeeId) where.employee_id = employeeId;

      const records = await Attendance.findAll({ where, order: [['date', 'ASC']] });

      const fmt = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      };

      if (!format || format === 'json') {
        return res.status(200).json({ status: true, data: records });
      }

      if (format === 'csv') {
        const header = ['employee_id', 'date', 'sign_in', 'sign_out', 'status', 'sign_in_location', 'sign_out_location'];
        const rows = records.map(r => ({
          employee_id: r.employee_id || '',
          date: r.date || '',
          sign_in: fmt(r.sign_in_time),
          sign_out: fmt(r.sign_out_time),
          status: r.status ? 'Present' : 'Absent',
          sign_in_location: r.location || '',
          sign_out_location: r.sign_out_location || ''
        }));

        const csv = [header.join(',')].concat(rows.map(obj => header.map(h => `"${String(obj[h]||'').replace(/"/g,'""')}"`).join(','))).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${start}_${end}.csv`);
        return res.send(csv);
      }

      return res.status(400).json({ status: false, message: 'Format not supported in skeleton.' });
    } catch (err) {
      console.error('Report endpoint error:', err);
      res.status(500).json({ status: false, message: err.message });
    }
  }
};

module.exports = attendanceController;
