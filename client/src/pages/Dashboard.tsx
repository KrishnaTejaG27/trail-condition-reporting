import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { MapView, Report } from '@/components/MapView';
import { AlertBanner } from '@/components/AlertBanner';

const Dashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.reports.getAll();
        const data = await handleApiResponse(response);
        setReports(data.data.reports || []);
      } catch (error) {
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
      fetchReports();
    }
  }, [token]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-normal text-black mb-2">Dashboard</h1>
        <p className="text-gray-600">Monitor trail conditions and safety reports</p>
      </div>

      {/* Alert Banner */}
      <div className="mb-8">
        <AlertBanner />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Active Reports</span>
            <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-[#485C11]" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-black">{reports.length}</div>
          <p className="text-sm text-gray-500 mt-1">Total reports</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Total Users</span>
            <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-[#485C11]" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-black">1,234</div>
          <p className="text-sm text-gray-500 mt-1">+12% from last month</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Hazards Resolved</span>
            <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#485C11]" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-black">{reports.filter(r => r.isResolved).length}</div>
          <p className="text-sm text-gray-500 mt-1">Resolved reports</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Avg Response</span>
            <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-[#485C11]" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-black">2.3h</div>
          <p className="text-sm text-gray-500 mt-1">-30min improvement</p>
        </div>
      </div>

      {/* Map and Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map View */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">Trail Map</h2>
            <p className="text-sm text-gray-600 mt-1">Live hazard locations</p>
          </div>
          <div className="h-[400px]">
            <MapView 
              reports={reports} 
              onReportClick={(report) => {
                toast({
                  title: report.conditionType?.replace('_', ' '),
                  description: report.description,
                });
              }}
            />
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">Recent Reports</h2>
            <p className="text-sm text-gray-600 mt-1">Latest trail condition reports from the community</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reports yet. Be the first to report a hazard!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        report.severityLevel === 'HIGH' ? 'bg-red-500' :
                        report.severityLevel === 'CRITICAL' ? 'bg-red-700' :
                        report.severityLevel === 'MEDIUM' ? 'bg-yellow-500' :
                        report.severityLevel === 'LOW' ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-black">{report.conditionType?.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        <p className="text-xs text-gray-500">
                          Reported {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
