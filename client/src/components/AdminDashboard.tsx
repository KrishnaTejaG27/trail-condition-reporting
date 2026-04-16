import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  totalTrails: number;
  totalParks: number;
  activeReports: number;
  resolvedReports: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  resolutionRate: string;
}

interface SeverityStats {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

interface ConditionStats {
  [key: string]: number;
}

interface Contributor {
  id: string;
  username: string;
  email: string;
  reputationPoints: number;
  _count: {
    reports: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [severityStats, setSeverityStats] = useState<SeverityStats | null>(null);
  const [conditionStats, setConditionStats] = useState<ConditionStats | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsRes, severityRes, conditionRes, contributorsRes] = await Promise.all([
        fetch('/api/analytics/dashboard', { headers }),
        fetch('/api/analytics/reports-by-severity', { headers }),
        fetch('/api/analytics/reports-by-condition', { headers }),
        fetch('/api/analytics/top-contributors', { headers })
      ]);

      if (!statsRes.ok || !severityRes.ok || !conditionRes.ok || !contributorsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [statsData, severityData, conditionData, contributorsData] = await Promise.all([
        statsRes.json(),
        severityRes.json(),
        conditionRes.json(),
        contributorsRes.json()
      ]);

      setStats(statsData);
      setSeverityStats(severityData);
      setConditionStats(conditionData);
      setContributors(contributorsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Admin Dashboard</h2>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold dark:text-white mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Reports</h3>
            <p className="text-3xl font-bold dark:text-white mt-2">{stats.totalReports}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Reports</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.activeReports}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Resolution Rate</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolutionRate}%</p>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Reports This Week</h3>
            <p className="text-2xl font-bold dark:text-white mt-2">{stats.reportsThisWeek}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Reports This Month</h3>
            <p className="text-2xl font-bold dark:text-white mt-2">{stats.reportsThisMonth}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Trails</h3>
            <p className="text-2xl font-bold dark:text-white mt-2">{stats.totalTrails}</p>
          </div>
        </div>
      )}

      {/* Severity Stats */}
      {severityStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Reports by Severity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-4">
              <p className="text-sm text-green-600 dark:text-green-400">Low</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{severityStats.LOW}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Medium</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{severityStats.MEDIUM}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-4">
              <p className="text-sm text-orange-600 dark:text-orange-400">High</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{severityStats.HIGH}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-4">
              <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{severityStats.CRITICAL}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Contributors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Top Contributors</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 px-4 dark:text-gray-300">Username</th>
                <th className="text-left py-2 px-4 dark:text-gray-300">Email</th>
                <th className="text-left py-2 px-4 dark:text-gray-300">Reports</th>
                <th className="text-left py-2 px-4 dark:text-gray-300">Reputation</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((contributor) => (
                <tr key={contributor.id} className="border-b dark:border-gray-700">
                  <td className="py-2 px-4 dark:text-white">{contributor.username}</td>
                  <td className="py-2 px-4 dark:text-gray-300">{contributor.email}</td>
                  <td className="py-2 px-4 dark:text-white">{contributor._count.reports}</td>
                  <td className="py-2 px-4 dark:text-white">{contributor.reputationPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
