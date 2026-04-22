import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { MapView, Report } from '@/components/MapView';
import { AlertBanner } from '@/components/AlertBanner';
import { UpvoteButton } from '@/components/UpvoteButton';
import { Comments } from '@/components/Comments';

const Dashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const { token, user } = useAuthStore();
  const { toast } = useToast();

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trail Safety Dashboard</h1>
        <p className="text-muted-foreground">Monitor trail conditions and safety reports</p>
      </div>

      {/* Alert Banner */}
      <div className="mb-6">
        <AlertBanner />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">Total reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(reports.map(r => r.user?.id)).size}</div>
            <p className="text-xs text-muted-foreground">Unique reporters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hazards Resolved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter(r => r.isResolved).length}</div>
            <p className="text-xs text-muted-foreground">Resolved reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter(r => r.severityLevel === 'HIGH' || r.severityLevel === 'CRITICAL').length}</div>
            <p className="text-xs text-muted-foreground">Critical/Hazards</p>
          </CardContent>
        </Card>
      </div>

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
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No reports yet. Be the first to report a hazard!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <div className="flex gap-2">
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
                        onClick={() => {
                          setSelectedReport(report);
                          setDetailsOpen(true);
                        }}
                      >
                        View Details
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] shadow-xl relative z-[10000] flex flex-col">
            <div className="flex justify-between items-start mb-4 p-6 pb-0">
              <h2 className="text-xl font-bold">Report Details</h2>
              <button 
                onClick={() => setDetailsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 p-6 pt-0 overflow-y-auto">
              <div>
                <p className="text-sm text-gray-500">Condition</p>
                <p className="font-medium">{selectedReport.conditionType?.replace('_', ' ').toUpperCase()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Severity</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  selectedReport.severityLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                  selectedReport.severityLevel === 'CRITICAL' ? 'bg-red-200 text-red-900' :
                  selectedReport.severityLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedReport.severityLevel}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm">{selectedReport.description}</p>
              </div>
              
              {/* Photos Section */}
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Photos ({selectedReport.photos.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.photos.map((photo, index) => (
                      <img 
                        key={index}
                        src={photo.url || photo.thumbnailUrl}
                        alt={`Report photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-sm font-mono">
                  {selectedReport.location?.coordinates?.[1]?.toFixed(4)}°, {selectedReport.location?.coordinates?.[0]?.toFixed(4)}°
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Reported By</p>
                <p className="text-sm">{selectedReport.user?.firstName || selectedReport.user?.username || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  selectedReport.isResolved ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
