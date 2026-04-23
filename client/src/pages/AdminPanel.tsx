import { useState, useEffect } from 'react';
import { Shield, Users, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <Shield className="h-6 w-6" />
              <h2 className="text-xl font-medium">Access Denied</h2>
            </div>
            <p className="text-gray-600">
              You need administrator privileges to access this panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-normal text-black mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-[#485C11]" />
          Admin Panel
        </h1>
        <p className="text-gray-600">Manage users, reports, and system settings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Total Users</span>
            <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-[#485C11]" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-black">{stats.totalUsers}</div>
          <p className="text-sm text-gray-500 mt-1">{stats.activeUsers} active</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Total Reports</span>
            <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#485C11]" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-black">{stats.totalReports}</div>
          <p className="text-sm text-gray-500 mt-1">{stats.activeReports} active, {stats.resolvedReports} resolved</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Critical Issues</span>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-red-600">{stats.criticalReports}</div>
          <p className="text-sm text-gray-500 mt-1">Require attention</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button 
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 rounded-full ${activeTab === 'users' ? 'bg-[#485C11] hover:bg-[#485C11]/90 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
        >
          <Users className="h-4 w-4" />
          Users ({users.length})
        </Button>
        <Button 
          variant={activeTab === 'reports' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 rounded-full ${activeTab === 'reports' ? 'bg-[#485C11] hover:bg-[#485C11]/90 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
        >
          <FileText className="h-4 w-4" />
          Reports ({reports.length})
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">User Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-black">{user.firstName || user.username}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">Role: {user.role} | Status: {user.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full border-red-300 text-red-600 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">Report Management</h2>
            <p className="text-sm text-gray-600 mt-1">Moderate and manage submitted reports</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-black">{report.conditionType}</p>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <p className="text-xs text-gray-500">
                      Severity: {report.severityLevel} | Status: {report.isResolved ? 'Resolved' : 'Active'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full border-[#485C11]/30 text-[#485C11] hover:bg-[#485C11]/5">
                      {report.isResolved ? 'Reopen' : 'Resolve'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
