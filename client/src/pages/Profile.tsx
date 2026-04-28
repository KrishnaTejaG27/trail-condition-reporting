import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Award, Settings, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api, handleApiResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PushNotificationSettings } from '@/components/PushNotificationSettings';

interface Report {
  id: string;
  userId: string;
  conditionType: string;
  severityLevel: string;
  createdAt: string;
  _count?: {
    votes: number;
    comments: number;
  };
}

interface UserStats {
  reports: number;
  verifications: number;
  comments: number;
  resolved: number;
  reputation: number;
}

const Profile = () => {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<UserStats>({ reports: 0, verifications: 0, comments: 0, resolved: 0, reputation: 0 });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Fetch user data and stats
  const fetchUserData = async () => {
    if (!token || !user) return;
    
    try {
      // Fetch reports
      const response = await api.reports.getAll();
      const data = await handleApiResponse(response);
      const allReports = data.data?.reports || [];
      // Filter reports by current user
      const userReports = allReports.filter((r: Report) => r.userId === user.id);
      setReports(userReports);
      
      // Fetch real stats from API
      const statsRes = await api.userStats.getStats(token);
      const statsData = await handleApiResponse(statsRes);
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token, user]);

  // Update form fields when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!token) return;
    
    setIsSaving(true);
    try {
      const response = await api.users.updateProfile({
        firstName,
        lastName,
        bio,
      }, token);
      
      const data = await handleApiResponse(response);
      
      if (data.success) {
        // Update auth store with new user data
        useAuthStore.getState().setUser({
          ...user!,
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName,
          bio: data.data.user.bio,
        });
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Use real stats from API (includes comments made on any report, not just user's reports)
  const reportCount = stats.reports;
  const reputationPoints = stats.reputation;
  const verificationCount = stats.verifications;
  const commentCount = stats.comments;

  // Get initials for avatar
  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-muted-foreground">@{user?.username}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2" disabled>
                      Change Photo (Coming Soon)
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your experience and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates about your reports</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Get alerts for nearby hazards</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Location Sharing</p>
                    <p className="text-sm text-muted-foreground">Share your location with reports</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <PushNotificationSettings />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Reports</span>
                    <Badge>{reportCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Verifications</span>
                    <Badge>{verificationCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Comments Made</span>
                    <Badge>{commentCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Resolved</span>
                    <Badge variant="outline">{stats.resolved}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Reputation</span>
                    <Badge variant="default">{reputationPoints} points</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet. Start reporting hazards!</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{report.conditionType?.replace('_', ' ')}</span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
