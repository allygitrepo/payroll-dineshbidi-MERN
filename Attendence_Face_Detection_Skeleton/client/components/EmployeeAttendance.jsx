import React, { useEffect, useMemo, useState, useRef } from "react";
import { attendanceService } from "../services/attendanceService";
import faceService from "../services/faceService";

// Standard icon replacements if lucide-react is not present
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: "middle" }}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

/**
 * EmployeeAttendance Dashboard Component
 * Displays the current day's log status, allows face-based check-in/out, logs geolocation,
 * schedules auto sign-out alarms at 6 PM local, and renders a past attendance records table.
 * 
 * @param {Object} props
 * @param {Object} props.currentUser - Logged-in user session data (name, email, id)
 */
const EmployeeAttendance = ({ currentUser = { name: "Employee User", id: 1 } }) => {
  const [today, setToday] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [onLeaveToday, setOnLeaveToday] = useState(false);
  const autoSignOutTimerRef = useRef(null);
  const checkIntervalRef = useRef(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const [t, list] = await Promise.all([
        attendanceService.getToday(),
        attendanceService.listMine(),
      ]);
      setToday(t);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  };

  const refreshTodayWithRetry = async () => {
    try {
      const t1 = await attendanceService.getToday();
      if (t1) {
        setToday(t1);
        return t1;
      }
      await new Promise((r) => setTimeout(r, 600));
      const t2 = await attendanceService.getToday();
      setToday(t2);
      return t2;
    } catch (err) {
      console.error("Retry today query fail:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Calculations for 6 PM local trigger
  const getMillisecondsUntil6PM = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(18, 0, 0, 0); 
    if (now >= target) return null;
    return target - now;
  };

  const performAutoSignOut = async () => {
    console.log("⏰ 6:00 PM auto sign-out threshold triggered.");
    try {
      const res = await attendanceService.signOut();
      const rec = res?.id ? res : null;
      if (rec) {
        setToday(rec);
        setItems((prev) => {
          const arr = [...prev];
          const idx = arr.findIndex((r) => r.id === rec.id);
          if (idx >= 0) arr[idx] = rec;
          else arr.unshift(rec);
          return arr;
        });
        setSuccess("Auto-sign out registered at 6:00 PM.");
      } else {
        await refreshTodayWithRetry();
        const list = await attendanceService.listMine();
        setItems(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("Auto sign-out process failed:", e);
      setError("Auto-sign out limit reached, please register checkout manually.");
    }
  };

  // Schedule auto signout trigger
  useEffect(() => {
    if (autoSignOutTimerRef.current) clearTimeout(autoSignOutTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    if (today?.sign_in_time && !today?.sign_out_time) {
      const msUntil6PM = getMillisecondsUntil6PM();
      if (msUntil6PM !== null && msUntil6PM > 0) {
        autoSignOutTimerRef.current = setTimeout(performAutoSignOut, msUntil6PM);
        
        // Backup timer check runs every minute
        checkIntervalRef.current = setInterval(() => {
          const now = new Date();
          if (now.getHours() >= 18 && today?.sign_in_time && !today?.sign_out_time) {
            performAutoSignOut();
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
          }
        }, 60000);
      }
    }

    return () => {
      if (autoSignOutTimerRef.current) clearTimeout(autoSignOutTimerRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [today?.sign_in_time, today?.sign_out_time]);

  // SignIn flow combining Face Verify, Location and API submissions
  const signIn = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      let recognizedName = null;
      let locationStr = null;
      let photoDataUrl = null;

      // 1. Trigger webcam recognition modal
      try {
        setSuccess("📸 Initializing webcam face match...");
        const recognitionResult = await faceService.recognizeUsingCamera();
        photoDataUrl = recognitionResult?.photo || null;

        if (!recognitionResult || !recognitionResult.matched) {
          setError("❌ Facial bio-signature matching failed. Please try again.");
          setSaving(false);
          return;
        }
        setSuccess("✓ Face matched! Resolving coordinates...");

        // Safety match check: make sure scanned profile maps to the logged-in user session
        recognizedName = (recognitionResult.name || "").trim();
        const sessionName = (currentUser?.name || "").trim();
        if (recognizedName && sessionName && recognizedName.toLowerCase() !== sessionName.toLowerCase()) {
          setError(`❌ Scan mismatch: Face recognized as ${recognizedName}, which does not match active session.`);
          setSaving(false);
          return;
        }

        // 2. Fetch coordinates (HTML5 Geolocation API)
        const getCoords = () => new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => resolve(null),
            { enableHighAccuracy: true, timeout: 6000 }
          );
        });

        const pos = await getCoords();
        if (pos && pos.coords) {
          locationStr = `lat:${pos.coords.latitude.toFixed(6)}, lon:${pos.coords.longitude.toFixed(6)}`;
        } else {
          locationStr = "Location unavailable";
        }
      } catch (err) {
        console.error("Camera verification error:", err);
        setError("❌ Webcam verification sequence failed. Please try again.");
        setSaving(false);
        return;
      }

      // 3. Post to Server sign-in route
      setSuccess("⏳ Saving sign-in record...");
      const savedRecord = await attendanceService.signIn(locationStr, photoDataUrl);

      if (savedRecord && savedRecord.id) {
        setToday(savedRecord);
        setItems((prev) => {
          const arr = [...prev];
          const idx = arr.findIndex((r) => r.id === savedRecord.id);
          if (idx >= 0) arr[idx] = savedRecord;
          else arr.unshift(savedRecord);
          return arr;
        });
        setSuccess(`✓ Checked in successfully as ${recognizedName || currentUser.name} (${locationStr})`);
      } else {
        await refreshTodayWithRetry();
        const list = await attendanceService.listMine();
        setItems(Array.isArray(list) ? list : []);
        setSuccess("✓ Checked in successfully.");
      }
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to mark sign-in";
      setError(`❌ ${msg}`);
      if (typeof msg === "string" && msg.toLowerCase().includes("leave")) {
        setOnLeaveToday(true);
      }
    } finally {
      setSaving(false);
    }
  };

  // SignOut flow capturing ending coords and web snapshot
  const signOut = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      let locationStr = null;
      let photoDataUrl = null;

      try {
        setSuccess("📸 Capture checkout snapshot...");
        const coordsPromise = new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => resolve(null),
            { enableHighAccuracy: true, timeout: 4000 }
          );
        });

        const pos = await coordsPromise;
        if (pos && pos.coords) {
          locationStr = `lat:${pos.coords.latitude.toFixed(6)}, lon:${pos.coords.longitude.toFixed(6)}`;
        }

        // Camera snapshot
        const cameraResult = await faceService.recognizeUsingCamera();
        photoDataUrl = cameraResult?.photo || null;
        setSuccess("✓ Snapshot acquired! Logging check-out...");
      } catch (e) {
        console.warn("Signout webcam/coord gathering error:", e);
        setSuccess("⏳ Logging check-out...");
      }

      const res = await attendanceService.signOut(locationStr, photoDataUrl);
      if (res && res.id) {
        setToday(res);
        setItems((prev) => {
          const arr = [...prev];
          const idx = arr.findIndex((r) => r.id === res.id);
          if (idx >= 0) arr[idx] = res;
          else arr.unshift(res);
          return arr;
        });
        setSuccess("✓ Checked out successfully");
      } else {
        await refreshTodayWithRetry();
        const list = await attendanceService.listMine();
        setItems(Array.isArray(list) ? list : []);
        setSuccess("✓ Checked out successfully");
      }
    } catch (e) {
      setError(`❌ ${e?.response?.data?.message || "Failed to log check-out"}`);
    } finally {
      setSaving(false);
    }
  };

  // Helpers for log dates formatting
  const formatTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso).slice(0, 10);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatDuration = (startIso, endIso) => {
    if (!startIso || !endIso) return "-";
    const a = new Date(startIso);
    const b = new Date(endIso);
    if (isNaN(a) || isNaN(b) || b < a) return "-";
    const mins = Math.floor((b - a) / 60000);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const sortedItems = useMemo(() => {
    const list = [...items];
    return list.sort((a, b) => new Date(b.date || b.attendance_date) - new Date(a.date || a.attendance_date));
  }, [items]);

  const state = useMemo(() => ({
    signedIn: !!today?.sign_in_time,
    signedOut: !!today?.sign_out_time,
    signInAt: today?.sign_in_time,
    signOutAt: today?.sign_out_time,
  }), [today]);

  return (
    <div className="attendance-module-container" style={styles.container}>
      {/* Styles Injection */}
      <style>{embeddedCSS}</style>
      
      <div className="header-bar" style={styles.headerBar}>
        <div>
          <h2 style={{ margin: 0, fontSize: "24px", color: "#1e293b" }}>Attendance Dashboard</h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
            Real-Time Face Match Auth System
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          {!state.signedIn ? (
            <button
              onClick={signIn}
              disabled={saving || loading || onLeaveToday}
              className="action-btn signin-btn"
              style={styles.signInBtn}
            >
              {saving ? "Processing..." : "Sign In (Camera)"}
            </button>
          ) : (
            <button
              onClick={signOut}
              disabled={saving || loading || state.signedOut}
              className="action-btn signout-btn"
              style={state.signedOut ? styles.disabledBtn : styles.signOutBtn}
            >
              {saving ? "Processing..." : state.signedOut ? "Signed Out" : "Sign Out (Camera)"}
            </button>
          )}
          
          <button 
            onClick={fetchAll} 
            disabled={loading} 
            className="action-btn refresh-btn"
            style={styles.refreshBtn}
          >
            {loading ? "Loading..." : "Refresh Logs"}
          </button>
        </div>
      </div>

      {error && <div className="alert-box error-alert">{error}</div>}
      {success && <div className="alert-box success-alert">{success}</div>}
      {onLeaveToday && (
        <div className="alert-box warning-alert">Approved leave is active today. Logins are locked.</div>
      )}

      {state.signedIn && !state.signedOut && (
        <div className="alert-box info-alert">
          <ClockIcon />
          <span>You will be automatically checked out at 18:00 (6:00 PM) if not marked manually.</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>TODAY CHECK-IN</div>
          <div style={styles.cardVal}>{state.signedIn ? formatTime(state.signInAt) : "—"}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>TODAY CHECK-OUT</div>
          <div style={styles.cardVal}>{state.signedOut ? formatTime(state.signOutAt) : "—"}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>WORKING DURATION</div>
          <div style={styles.cardVal}>
            {state.signedIn && state.signedOut 
              ? formatDuration(state.signInAt, state.signOutAt) 
              : state.signedIn ? "Active session" : "—"}
          </div>
        </div>
      </div>

      {/* Log History */}
      <div className="table-card" style={styles.tableCard}>
        <div className="table-header" style={styles.tableHeader}>
          <strong>Historical Sign Logs</strong>
          <span style={{ fontSize: "13px", color: "#64748b" }}>Total Logs: {items.length}</span>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Sr No</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Check-In Time</th>
                <th style={styles.th}>Check-In Location</th>
                <th style={styles.th}>Check-Out Time</th>
                <th style={styles.th}>Check-Out Location</th>
                <th style={styles.th}>Total Duration</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    Loading data logs...
                  </td>
                </tr>
              ) : sortedItems.length ? (
                sortedItems.map((row, idx) => (
                  <tr key={row.id || idx} style={styles.tr}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}>{formatDate(row.date || row.attendance_date)}</td>
                    <td style={styles.td}>{formatTime(row.sign_in_time)}</td>
                    <td style={styles.td} title={row.location || ""}>
                      {row.location ? String(row.location).slice(0, 30) : "-"}
                    </td>
                    <td style={styles.td}>
                      <span style={row.is_auto_signout ? { color: "#ef4444", fontWeight: 500 } : {}}>
                        {formatTime(row.sign_out_time)}
                        {row.is_auto_signout && " ⏱️"}
                      </span>
                    </td>
                    <td style={styles.td} title={row.sign_out_location || ""}>
                      {row.is_auto_signout ? "Auto Checked-out" : (row.sign_out_location ? String(row.sign_out_location).slice(0, 30) : "-")}
                    </td>
                    <td style={styles.td}>{formatDuration(row.sign_in_time, row.sign_out_time)}</td>
                    <td style={styles.td}>
                      <span className={`status-badge ${row.is_auto_signout ? "auto-out" : row.sign_out_time ? "present" : "active"}`}>
                        {row.is_auto_signout ? "Auto Check-out" : row.sign_out_time ? "Present" : "Active Now"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },
  signInBtn: {
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background-color 0.2s",
  },
  signOutBtn: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background-color 0.2s",
  },
  disabledBtn: {
    backgroundColor: "#cbd5e1",
    color: "#64748b",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontWeight: "600",
    fontSize: "14px",
  },
  refreshBtn: {
    backgroundColor: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background-color 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: "0.05em",
    marginBottom: "8px",
  },
  cardVal: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
  },
  tableCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  tableHeader: {
    padding: "15px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  thRow: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "12px 20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "14px 20px",
    fontSize: "14px",
    color: "#334155",
  },
};

const embeddedCSS = `
  .attendance-module-container .alert-box {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 500;
  }
  .attendance-module-container .error-alert {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  .attendance-module-container .success-alert {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }
  .attendance-module-container .warning-alert {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fde047;
  }
  .attendance-module-container .info-alert {
    background-color: #e0f2fe;
    color: #075985;
    border: 1px solid #7dd3fc;
    display: flex;
    align-items: center;
  }
  .attendance-module-container .status-badge {
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
  }
  .attendance-module-container .status-badge.present {
    background-color: #dcfce7;
    color: #15803d;
  }
  .attendance-module-container .status-badge.active {
    background-color: #e0e7ff;
    color: #4338ca;
  }
  .attendance-module-container .status-badge.auto-out {
    background-color: #fef3c7;
    color: #b45309;
  }
  .attendance-module-container tr:hover {
    background-color: #f8fafc;
  }
  .attendance-module-container .action-btn:hover {
    opacity: 0.9;
  }
  @media (max-width: 768px) {
    .header-bar {
      flex-direction: column;
      align-items: stretch !important;
    }
  }
`;

export default EmployeeAttendance;
