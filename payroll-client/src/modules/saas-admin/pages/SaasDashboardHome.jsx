import React, { useState, useEffect } from 'react';
import { Users, Building, UsersRound, Loader } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import styles from './SaasDashboardHome.module.css';
import { getDashboardStats } from '../services/saasService';

const SaasDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--primary)' }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={styles.dashboardContainer} style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>SaaS Overview</h2> */}

      {/* Top Metrics Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.blue}`}>
            <Building size={28} />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Clients (Tenants)</h3>
            <p>{stats.totalClients}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.green}`}>
            <Users size={28} />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Companies</h3>
            <p>{stats.totalCompanies}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.purple}`}>
            <UsersRound size={28} />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Employees Managed</h3>
            <p>{stats.totalEmployees}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsGrid}>

        {/* Growth Area Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Client Growth (Last 6 Months)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <AreaChart data={stats.growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="clients" stroke="#0284c7" fillOpacity={1} fill="url(#colorClients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies Bar Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top 5 Companies by Size</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={stats.topCompanies} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="employees" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SaasDashboardHome;
