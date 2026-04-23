import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, ThumbsUp, MessageSquare, Share } from 'lucide-react';

const ReportDetail = () => {
  const { id } = useParams();
  console.log('Report ID:', id); // Temporary usage to avoid unused warning

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4 text-gray-600 hover:text-black -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <h1 className="text-3xl md:text-4xl font-serif font-normal text-black mb-2">Report Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Info */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-medium text-black">Fallen Tree</h2>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">High Priority</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  2 hours ago
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Reported by @johndoe on Trail A
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-black mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Large oak tree fell across the trail after yesterday's storm. 
                    Tree is about 2 feet in diameter and completely blocks the path. 
                    Difficult to bypass due to steep slope.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-2">Location</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-[#485C11]" />
                    Trail A, 0.5 miles from north entrance
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-2">Photos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-gray-100 rounded-xl"></div>
                    <div className="aspect-square bg-gray-100 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-black">Actions</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Confirm (3)
                </Button>
                <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </Button>
                <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-black">Comments (2)</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-[#485C11] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    S
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-black">@sarahh</span>
                      <span className="text-sm text-gray-500">1 hour ago</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Just came through here, definitely need to avoid this section. 
                      Trail maintenance notified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">Reporter</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#485C11] rounded-full flex items-center justify-center text-white font-medium">
                  J
                </div>
                <div>
                  <p className="font-medium text-black">@johndoe</p>
                  <p className="text-sm text-gray-600">John Doe</p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    250 reputation points
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Status */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">Status</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verification</span>
                  <span className="px-3 py-1 bg-[#485C11]/10 text-[#485C11] rounded-full text-sm font-medium">Verified (3)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Resolution</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Pending</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Severity</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
