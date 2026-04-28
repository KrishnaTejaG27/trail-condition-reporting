import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Ban,
  Flag,
  Eye,
  Check,
  Upload,
  Download
} from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalReports: number;
  totalUsers: number;
  totalTrails: number;
  activeReports: number;
  resolvedReports: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  resolutionRate: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  reports_count: number;
}

interface Report {
  id: string;
  conditionType: string;
  severityLevel: string;
  isResolved: boolean;
  status: string;
  createdAt: string;
  user: {
    username: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
      toast({
        title: "Access denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      navigate('/app/dashboard');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await api.admin?.getStats(token);
      if (statsRes) {
        const statsData = await handleApiResponse(statsRes);
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Fetch users
      const usersRes = await api.admin?.getUsers(token);
      if (usersRes) {
        const usersData = await handleApiResponse(usersRes);
        if (usersData.success) {
          setUsers(usersData.data?.users || []);
        }
      }

      // Fetch all reports
      const reportsRes = await api.admin?.getAllReports(token);
      if (reportsRes) {
        const reportsData = await handleApiResponse(reportsRes);
        if (reportsData.success) {
          // Sort by newest first
          const sortedReports = (reportsData.data?.reports || []).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setReports(sortedReports);
          processChartData(sortedReports);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Failed to load dashboard",
        description: error instanceof Error ? error.message : "Could not fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (reportsData: Report[]) => {
    // Severity distribution
    const severityCount: Record<string, number> = {};
    reportsData.forEach(report => {
      severityCount[report.severityLevel] = (severityCount[report.severityLevel] || 0) + 1;
    });
    setSeverityData(
      Object.entries(severityCount).map(([name, value]) => ({ name, value }))
    );

    // Weekly trend - based on actual report dates
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    
    const trend = last7Days.map(date => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayReports = reportsData.filter(r => {
        const rDate = new Date(r.createdAt);
        return rDate >= dayStart && rDate <= dayEnd;
      });
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        reports: dayReports.length,
        resolved: dayReports.filter(r => r.isResolved).length,
      };
    });
    
    setTrendData(trend);
  };

  const handleBanUser = async (userId: string) => {
    try {
      const res = await api.admin?.banUser(userId, token!);
      if (res) {
        await handleApiResponse(res);
        toast({ title: "User banned successfully" });
        fetchDashboardData();
      }
    } catch (error) {
      toast({
        title: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleFlagReport = async (reportId: string) => {
    try {
      const res = await api.admin?.flagReport(reportId, token!);
      if (res) {
        await handleApiResponse(res);
        toast({ title: "Report flagged for review" });
        fetchDashboardData();
      }
    } catch (error) {
      toast({
        title: "Failed to flag report",
        variant: "destructive",
      });
    }
  };

  const handleRemoveReport = async (reportId: string) => {
    try {
      const res = await api.admin?.removeReport(reportId, token!);
      if (res) {
        await handleApiResponse(res);
        toast({ title: "Report removed" });
        fetchDashboardData();
      }
    } catch (error) {
      toast({ title: "Failed to remove report", variant: "destructive" });
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await api.admin?.resolveReport(reportId, token!);
      if (res) {
        await handleApiResponse(res);
        toast({ title: "Report marked as resolved" });
        fetchDashboardData();
      }
    } catch (error) {
      toast({ title: "Failed to resolve report", variant: "destructive" });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, reports, and view analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.reportsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all trails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.resolutionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.resolvedReports || 0} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Trends</CardTitle>
            <CardDescription>Reports submitted vs resolved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reports" stroke="#8884d8" name="New Reports" />
                <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Breakdown by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users, Reports, and Trail Import */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="trails">Trail Import</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Manage and moderate user reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports found
                  </div>
                ) : (
                  currentReports.map((report) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">
                            {report.conditionType?.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by @{report.user?.username} • {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={report.isResolved ? "default" : "outline"}>
                          {report.isResolved ? 'Resolved' : 'Pending'}
                        </Badge>
                        <Badge 
                          className={
                            report.severityLevel === 'CRITICAL' ? 'bg-red-700' :
                            report.severityLevel === 'HIGH' ? 'bg-red-500' :
                            report.severityLevel === 'MEDIUM' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }
                        >
                          {report.severityLevel}
                        </Badge>
                        {report.status === 'flagged' && (
                          <Badge variant="destructive">Flagged</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/app/reports/${report.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!report.isResolved && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleResolveReport(report.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleFlagReport(report.id)}
                          disabled={report.status === 'flagged'}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRemoveReport(report.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, reports.length)} of {reports.length} reports
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((u) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">@{u.username}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant={u.role === 'ADMIN' ? "default" : "outline"}>
                        {u.role}
                      </Badge>
                      {u.isActive === false && (
                        <Badge variant="destructive">BANNED</Badge>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {u.reports_count || 0} reports • Joined {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/app/users/${u.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {u.role !== 'ADMIN' && u.isActive !== false && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleBanUser(u.id)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Ban
                        </Button>
                      )}
                      {u.isActive === false && (
                        <Badge variant="destructive" className="h-9 px-4">
                          <Ban className="h-4 w-4 mr-2" />
                          Banned
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trails">
          <TrailImportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Trail Import Tab Component
function TrailImportTab() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleLoadSample = async () => {
    try {
      const res = await api.trailImport.getSample(token);
      const data = await handleApiResponse(res);
      if (data.success) {
        setImportData(JSON.stringify(data.data.trails, null, 2));
        setPreview(data.data.trails);
        toast({ title: "Sample data loaded" });
      }
    } catch (error) {
      toast({ title: "Failed to load sample", variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast({ title: "Please enter trail data", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const trails = JSON.parse(importData);
      const res = await api.trailImport.importCSV(trails, token);
      const data = await handleApiResponse(res);
      
      if (data.success) {
        toast({ 
          title: "Import successful!", 
          description: `Imported ${data.data.imported} trails` 
        });
        setImportData('');
        setPreview([]);
      }
    } catch (error) {
      toast({ 
        title: "Import failed", 
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive" 
      });
    } finally {
      setImporting(false);
    }
  };

  const handlePreview = () => {
    try {
      const trails = JSON.parse(importData);
      setPreview(trails);
    } catch (error) {
      toast({ title: "Invalid JSON format", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Trails
        </CardTitle>
        <CardDescription>
          Import trails from JSON data or CSV. Click "Load Sample" to see the format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLoadSample}>
              <Download className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
            <Button variant="outline" onClick={handlePreview} disabled={!importData}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Trail Data (JSON format)
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full h-64 p-3 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={`[\n  {\n    "name": "Trail Name",\n    "description": "Trail description",\n    "difficulty": "EASY|MODERATE|HARD",\n    "length": 5.0,\n    "location": "Park Name",\n    "elevationGain": 300,\n    "estimatedTime": "2-3 hours",\n    "features": ["Views", "Waterfall"],\n    "surfaceTypes": ["Dirt", "Rock"]\n  }\n]`}
            />
          </div>

          {preview.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Preview ({preview.length} trails)</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {preview.map((trail, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="font-medium">{trail.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {trail.length} miles • {trail.difficulty} • {trail.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={importing || !importData}
            className="w-full"
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Import Trails</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
