import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  FileText, 
  ThumbsUp, 
  Ban, 
  Shield,
  Loader2,
  MapPin,
  Activity
} from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

interface UserDetails {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  reputationPoints: number;
  profileImageUrl?: string;
}

interface UserReport {
  id: string;
  conditionType: string;
  severityLevel: string;
  description: string;
  isResolved: boolean;
  status: string;
  createdAt: string;
  locationDescription: string;
  _count: {
    votes: number;
    comments: number;
  };
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuthStore();
  const { toast } = useToast();
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if current user is admin/moderator
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR';

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      navigate('/app/dashboard');
      return;
    }

    if (id && token) {
      fetchUserData();
    }
  }, [id, token, isAdmin, navigate, toast]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user details
      const userRes = await api.admin?.getUserDetails(id!, token);
      if (userRes) {
        const userData = await handleApiResponse(userRes);
        if (userData.success) {
          setUser(userData.data.user);
        }
      }

      // Fetch user's reports
      const reportsRes = await api.admin?.getUserReports(id!, token);
      if (reportsRes) {
        const reportsData = await handleApiResponse(reportsRes);
        if (reportsData.success) {
          setReports(reportsData.data.reports);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Failed to load user",
        description: error instanceof Error ? error.message : "Could not fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!user) return;
    
    try {
      const res = await api.admin?.banUser(user.id, token);
      if (res) {
        await handleApiResponse(res);
        toast({ 
          title: "User banned",
          description: `@${user.username} has been banned.`
        });
        fetchUserData();
      }
    } catch (error) {
      toast({
        title: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-700';
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getConditionLabel = (condition: string) => {
    return condition?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
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

  if (!user) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => navigate('/app/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVotes = reports.reduce((sum, r) => sum + (r._count?.votes || 0), 0);
  const resolvedReports = reports.filter(r => r.isResolved).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/app/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">User Profile</h1>
        </div>
        
        {user.role !== 'ADMIN' && user.isActive !== false && (
          <Button variant="destructive" onClick={handleBanUser}>
            <Ban className="h-4 w-4 mr-2" />
            Ban User
          </Button>
        )}
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-primary" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">@{user.username}</h2>
                <Badge variant={user.role === 'ADMIN' ? "default" : "outline"}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
                {user.isActive === false && (
                  <Badge variant="destructive">
                    <Ban className="h-3 w-3 mr-1" />
                    BANNED
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">
                    Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">{user.reputationPoints || 0} reputation</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resolvedReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Votes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reports.length > 0 ? Math.round((resolvedReports / reports.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>
                All reports submitted by @{user.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No reports submitted yet
                </p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(report.severityLevel)}>
                            {report.severityLevel}
                          </Badge>
                          <span className="font-medium">
                            {getConditionLabel(report.conditionType)}
                          </span>
                          {report.isResolved && (
                            <Badge variant="default">Resolved</Badge>
                          )}
                          {report.status === 'flagged' && (
                            <Badge variant="destructive">Flagged</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {report.description?.substring(0, 100)}
                          {report.description?.length > 100 && '...'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {report.locationDescription || 'No location'}
                          </span>
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {report._count?.votes || 0} votes
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/app/reports/${report.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Recent activity by @{user.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border-l-2 border-primary bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {user.lastLogin && (
                  <div className="flex items-start gap-4 p-4 border-l-2 border-green-500 bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Last Login</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.lastLogin).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {reports.slice(0, 5).map((report, index) => (
                  <div 
                    key={report.id}
                    className="flex items-start gap-4 p-4 border-l-2 border-blue-500 bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        Submitted Report: {getConditionLabel(report.conditionType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
