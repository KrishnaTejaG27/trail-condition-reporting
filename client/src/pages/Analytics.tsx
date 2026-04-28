import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [reportsBySeverity, setReportsBySeverity] = useState<any>(null);
  const [reportsByCondition, setReportsByCondition] = useState<any>(null);
  const [reportsOverTime, setReportsOverTime] = useState<any>(null);
  const [topContributors, setTopContributors] = useState<any>(null);
  const [parkStatistics, setParkStatistics] = useState<any>(null);

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      toast({
        title: "Access Denied",
        description: "Only admins and moderators can view analytics",
        variant: "destructive",
      });
      return;
    }

    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    console.log('Analytics: Starting fetch');
    
    try {
      const token = useAuthStore.getState().token;
      console.log('Analytics: Token exists:', !!token);
      
      // Try to fetch data, but don't fail if it doesn't work
      try {
        const [
          dashboardRes,
          severityRes,
          conditionRes,
          timeRes,
          contributorsRes,
          parkRes
        ] = await Promise.all([
          fetch('/api/analytics/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(e => null),
          fetch('/api/analytics/reports-by-severity', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(e => null),
          fetch('/api/analytics/reports-by-condition', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(e => null),
          fetch('/api/analytics/reports-over-time', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(e => null),
          fetch('/api/analytics/top-contributors', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(e => null),
          fetch('/api/analytics/park-statistics', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(e => null)
        ]);

        console.log('Analytics: Fetch responses received');
        console.log('Analytics: dashboardRes:', dashboardRes?.status, dashboardRes?.ok);
        console.log('Analytics: severityRes:', severityRes?.status, severityRes?.ok);

        const dashboardData = dashboardRes?.ok ? await dashboardRes.json().catch(() => ({})) : {};
        const severityData = severityRes?.ok ? await severityRes.json().catch(() => ({})) : {};
        const conditionData = conditionRes?.ok ? await conditionRes.json().catch(() => ({})) : {};
        const timeData = timeRes?.ok ? await timeRes.json().catch(() => ({})) : {};
        const contributorsData = contributorsRes?.ok ? await contributorsRes.json().catch(() => ([])) : [];
        const parkData = parkRes?.ok ? await parkRes.json().catch(() => ([])) : [];

        console.log('Analytics: Data parsed');
        console.log('Analytics: dashboardData:', dashboardData);

        setDashboardStats(dashboardData);
        setReportsBySeverity(severityData);
        setReportsByCondition(conditionData);
        setReportsOverTime(timeData);
        setTopContributors(contributorsData);
        setParkStatistics(parkData);
      } catch (apiError) {
        console.error('Analytics: API error:', apiError);
        // Set empty data on error
        setDashboardStats({});
        setReportsBySeverity({});
        setReportsByCondition({});
        setReportsOverTime({});
        setTopContributors([]);
        setParkStatistics([]);
      }
    } catch (error) {
      console.error('Analytics: Unexpected error:', error);
      // Set empty data on error
      setDashboardStats({});
      setReportsBySeverity({});
      setReportsByCondition({});
      setReportsOverTime({});
      setTopContributors([]);
      setParkStatistics([]);
    } finally {
      console.log('Analytics: Setting loading to false');
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  // Use empty data as fallback - backend now provides dynamic mock data
  const stats = dashboardStats || { totalUsers: 0, totalReports: 0, activeReports: 0, resolutionRate: '0' };
  const severity = reportsBySeverity || { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const condition = reportsByCondition || {};
  const time = reportsOverTime || {};
  const contributors = topContributors || [];
  const parks = parkStatistics || [];

  // Transform reports over time data for chart
  const timeChartData = Object.entries(time || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    reports: count
  }));

  // Transform severity data for pie chart
  const severityChartData = severity ? [
    { name: 'LOW', value: severity.LOW || 0 },
    { name: 'MEDIUM', value: severity.MEDIUM || 0 },
    { name: 'HIGH', value: severity.HIGH || 0 },
    { name: 'CRITICAL', value: severity.CRITICAL || 0 },
  ] : [];

  // Transform condition data for bar chart
  const conditionChartData = condition ? Object.entries(condition).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  })) : [];

  // Check if there's any real data
  const hasData = stats.totalUsers > 0 || stats.totalReports > 0 || Object.keys(time).length > 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Overview of trail condition reports and platform metrics</p>
      </div>

      {!hasData && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No analytics data available. This could be because the database is not connected or there are no reports yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {hasData && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReports || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolutionRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Reports Over Time (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {timeChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-muted-foreground text-sm">No reports in the last 30 days</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reports" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Reports by Severity */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reports by Condition Type */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by Condition Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conditionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Users with highest reputation points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contributors?.slice(0, 5).map((contributor: any, index: number) => (
                <div key={contributor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{contributor.username}</p>
                      <p className="text-sm text-muted-foreground">{contributor._count?.reports || 0} reports</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{contributor.reputationPoints || 0}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}

      {/* Park Statistics */}
      {parks && parks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Park Statistics</CardTitle>
            <CardDescription>Report distribution across parks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parks.map((park: any) => (
                <div key={park.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{park.name}</p>
                    <p className="text-sm text-muted-foreground">{park.trailCount} trails</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{park.totalReports}</p>
                    <p className="text-xs text-muted-foreground">reports</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
