import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Users, TrendingUp, Cloud, Thermometer, Wind, FileText, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { MapView, Report } from '@/components/MapView';
import { AlertBanner } from '@/components/AlertBanner';
import { UpvoteButton } from '@/components/UpvoteButton';
import { Comments } from '@/components/Comments';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useSocket } from '@/hooks/useSocket';

const Dashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const { joinReports, joinUser, onReportCreated, onReportUpdated, onReportDeleted, onVoteUpdated, onNotification } = useSocket();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Real-time socket listeners
  useEffect(() => {
    if (!token || !user) return;

    // Join reports room for updates
    joinReports();
    
    // Join user room for notifications
    joinUser(user.id);

    // Listen for new reports
    const unsubscribeCreated = onReportCreated((newReport) => {
      console.log('🆕 Real-time: New report created', newReport);
      setReports(prev => [newReport, ...prev]);
      toast({
        title: "🚨 New Report",
        description: `${newReport.conditionType} reported by ${newReport.user?.firstName || 'someone'}`,
      });
    });

    // Listen for report updates
    const unsubscribeUpdated = onReportUpdated((updatedReport) => {
      console.log('🔄 Real-time: Report updated', updatedReport);
      setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
      if (selectedReport?.id === updatedReport.id) {
        setSelectedReport(updatedReport);
      }
    });

    // Listen for report deletions
    const unsubscribeDeleted = onReportDeleted(({ id }) => {
      console.log('🗑️ Real-time: Report deleted', id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setDetailsOpen(false);
      }
    });

    // Listen for vote updates
    const unsubscribeVote = onVoteUpdated(({ reportId, voteCount }) => {
      console.log('👍 Real-time: Vote updated', reportId, voteCount);
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, _count: { ...r._count, votes: voteCount } } : r
      ));
    });

    // Listen for real-time notifications
    const unsubscribeNotification = onNotification((notification) => {
      console.log('🔔 Real-time notification:', notification);
      setUnreadNotifications(prev => prev + 1);
      toast({
        title: `🔔 ${notification.title}`,
        description: notification.message,
      });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeVote();
      unsubscribeNotification();
    };
  }, [token, user, joinReports, joinUser, onReportCreated, onReportUpdated, onReportDeleted, onVoteUpdated, onNotification, toast, selectedReport]);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          console.log('Dashboard: Got user location:', latitude, longitude);
        },
        (error) => {
          console.log('Dashboard: Could not get location, using default');
          // Keep null to use default center
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Fetch weather when user location is available
  useEffect(() => {
    if (userLocation) {
      setLoadingWeather(true);
      api.weather.getWeather(userLocation.lat, userLocation.lng)
        .then(handleApiResponse)
        .then(res => {
          if (res.success) {
            setWeather(res.data);
          }
        })
        .catch(error => {
          console.log('Weather fetch failed (non-critical):', error);
        })
        .finally(() => {
          setLoadingWeather(false);
        });
    }
  }, [userLocation]);

  useEffect(() => {
    console.log('Dashboard: Token check:', token ? 'Token exists' : 'No token');
    
    const fetchReports = async () => {
      try {
        console.log('Dashboard: Fetching reports...');
        const response = await api.reports.getAll();
        console.log('Dashboard: Response status:', response.status);
        console.log('Dashboard: Response ok:', response.ok);
        const responseText = await response.text();
        console.log('Dashboard: Raw response:', responseText);
        const data = JSON.parse(responseText);
        console.log('Dashboard: Parsed data:', data);
        console.log('Dashboard: Reports array:', data.data?.reports);
        console.log('Dashboard: Reports count:', data.data?.reports?.length || 0);
        
        const loadedReports = data.data?.reports || [];
        setReports(loadedReports);
        
        // Check which reports the current user has upvoted
        // For now, we'll check if the user ID appears in votes (simplified)
        // This assumes the API returns vote info with user IDs
        const votedReportIds = new Set<string>();
        loadedReports.forEach((report: Report) => {
          // Check if current user has upvoted this report
          // This is a simplified check - in production, the API should tell us
          if (user && report._count?.votes && report._count.votes > 0) {
            // We need to store user's votes separately or include in report response
            // For now, we'll use localStorage to track votes client-side
            const hasVoted = localStorage.getItem(`vote_${report.id}_${user.id}`);
            if (hasVoted) {
              votedReportIds.add(report.id);
            }
          }
        });
        setUserVotes(votedReportIds);
      } catch (error) {
        console.error('Dashboard: Error fetching reports:', error);
        toast({
          title: "Failed to load reports",
          description: error instanceof Error ? error.message : "Could not fetch reports",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      console.log('Dashboard: Token found, fetching reports...');
      fetchReports();
    } else {
      console.log('Dashboard: No token, skipping fetch');
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trail Safety Dashboard</h1>
          <p className="text-muted-foreground">Monitor trail conditions and safety reports</p>
        </div>
        <div className="relative">
          <Bell className="h-6 w-6 text-muted-foreground" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      <div className="mb-6">
        <AlertBanner />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          // Skeleton loaders for stats
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in zoom-in-95" style={{ animationDelay: '0ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground">Total reports</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in zoom-in-95" style={{ animationDelay: '50ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(reports.map(r => r.user?.id)).size}</div>
                <p className="text-xs text-muted-foreground">Unique reporters</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in zoom-in-95" style={{ animationDelay: '100ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hazards Resolved</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.filter(r => r.isResolved).length}</div>
                <p className="text-xs text-muted-foreground">Resolved reports</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in zoom-in-95" style={{ animationDelay: '150ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.filter(r => r.severityLevel === 'HIGH' || r.severityLevel === 'CRITICAL').length}</div>
                <p className="text-xs text-muted-foreground">Critical/Hazards</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Weather Card */}
      {weather && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Weather Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{Math.round(weather.current.temperature)}°C</p>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{Math.round(weather.current.windSpeed)} km/h</p>
                    <p className="text-xs text-muted-foreground">Wind Speed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold">{weather.current.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${weather.current.hazardRecommendation.includes('Warning') ? 'text-red-500' : 'text-green-500'}`} />
                  <div>
                    <p className="text-sm font-semibold">{weather.current.weatherDescription}</p>
                    <p className="text-xs text-muted-foreground">{weather.current.hazardRecommendation}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map and Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map View */}
        <MapView 
          reports={reports}
          userLocation={userLocation}
          onReportClick={(report) => {
            setSelectedReport(report);
            setDetailsOpen(true);
          }}
        />

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Latest trail condition reports from the community</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-48 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports yet"
                description="Be the first to report a hazard and help keep the community safe!"
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {reports.slice(0, 5).map((report, index) => (
                  <div 
                    key={report.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                      setSelectedReport(report);
                      setDetailsOpen(true);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        report.severityLevel === 'HIGH' ? 'bg-red-500' :
                        report.severityLevel === 'CRITICAL' ? 'bg-red-700' :
                        report.severityLevel === 'MEDIUM' ? 'bg-yellow-500' :
                        report.severityLevel === 'LOW' ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">{report.conditionType?.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Reported {new Date(report.createdAt).toLocaleDateString()}
                          {' • '}
                          <span className="text-primary">
                            {report._count?.votes || 0} verifications
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <UpvoteButton 
                        reportId={report.id} 
                        initialCount={report._count?.votes || 0} 
                        hasVoted={userVotes.has(report.id)}
                        onVoteChange={(hasVoted) => {
                          setUserVotes(prev => {
                            const newSet = new Set(prev);
                            if (hasVoted) {
                              newSet.add(report.id);
                            } else {
                              newSet.delete(report.id);
                            }
                            return newSet;
                          });
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Details Dialog */}
      {detailsOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] shadow-xl relative z-[10000] flex flex-col border">
            <div className="flex justify-between items-start mb-4 p-6 pb-0">
              <h2 className="text-xl font-bold">Report Details</h2>
              <button 
                onClick={() => setDetailsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 p-6 pt-0 overflow-y-auto">
              <div>
                <p className="text-sm text-muted-foreground">Condition</p>
                <p className="font-medium">{selectedReport.conditionType?.replace('_', ' ').toUpperCase()}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Severity</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  selectedReport.severityLevel === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' :
                  selectedReport.severityLevel === 'CRITICAL' ? 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200' :
                  selectedReport.severityLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                  'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                }`}>
                  {selectedReport.severityLevel}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{selectedReport.description}</p>
              </div>
              
              {/* Photos Section */}
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Photos ({selectedReport.photos.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.photos.map((photo, index) => {
                      // Use relative URLs for Vite proxy
                      const photoUrl = photo.url || photo.thumbnailUrl;
                      
                      return photoUrl ? (
                        <img 
                          key={index}
                          src={photoUrl}
                          alt={`Report photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm font-mono">
                  {selectedReport.location?.coordinates?.[1]?.toFixed(4)}°, {selectedReport.location?.coordinates?.[0]?.toFixed(4)}°
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Reported By</p>
                <p className="text-sm">{selectedReport.user?.firstName || selectedReport.user?.username || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  selectedReport.isResolved ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                }`}>
                  {selectedReport.isResolved ? 'Resolved' : 'Active'}
                </span>
              </div>
            </div>
            
            {/* Comments Section */}
            {selectedReport && (
              <Comments 
                reportId={selectedReport.id} 
                commentCount={selectedReport._count?.comments || 0}
              />
            )}
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
