import { useState, useEffect } from 'react';
import { Shield, Users, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { api, handleApiResponse } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Report {
  id: string;
  conditionType: string;
  severityLevel: string;
  description: string;
  isActive: boolean;
  isResolved: boolean;
  createdAt: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
  const [loading, setLoading] = useState(true);
  const { user: currentUser, token } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      return;
    }

    fetchData();
  }, [currentUser, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reports
      const reportsResponse = await api.reports.getAll();
      const reportsData = await handleApiResponse(reportsResponse);
      setReports(reportsData.data?.reports || []);
      
      // Mock users data for now
      setUsers([
        { id: '1', username: 'admin', email: 'admin@example.com', firstName: 'Admin', role: 'ADMIN', isActive: true, createdAt: new Date().toISOString() },
        { id: '2', username: 'testuser', email: 'test@example.com', firstName: 'Test', role: 'USER', isActive: true, createdAt: new Date().toISOString() }
      ]);
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: error instanceof Error ? error.message : "Could not fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    totalReports: reports.length,
    activeReports: reports.filter(r => r.isActive && !r.isResolved).length,
    resolvedReports: reports.filter(r => r.isResolved).length,
    criticalReports: reports.filter(r => r.severityLevel === 'CRITICAL' || r.severityLevel === 'HIGH').length
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-6 w-6" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need administrator privileges to access this panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage users, reports, and system settings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">{stats.activeReports} active, {stats.resolvedReports} resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalReports}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Users ({users.length})
        </Button>
        <Button 
          variant={activeTab === 'reports' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reports')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Reports ({reports.length})
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : activeTab === 'users' ? (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.firstName || user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Role: {user.role} | Status: {user.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm" className="text-red-600">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Report Management</CardTitle>
            <CardDescription>Moderate and manage submitted reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{report.conditionType}</p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Severity: {report.severityLevel} | Status: {report.isResolved ? 'Resolved' : 'Active'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm">{report.isResolved ? 'Reopen' : 'Resolve'}</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
