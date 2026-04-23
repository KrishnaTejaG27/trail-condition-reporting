import { Button } from '@/components/ui/button';
import { User, MapPin, Award, Settings } from 'lucide-react';

const Profile = () => {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-normal text-black mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and view your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Card */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-[#485C11]" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-black">Profile Information</h2>
                  <p className="text-sm text-gray-600">Update your personal information and preferences</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-[#485C11] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    JD
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-black">John Doe</h3>
                    <p className="text-gray-600">@johndoe</p>
                    <Button variant="outline" size="sm" className="mt-2 rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                      Change Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#485C11]/20 focus:border-[#485C11] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#485C11]/20 focus:border-[#485C11] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    defaultValue="Love exploring trails and helping keep our community safe!"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#485C11]/20 focus:border-[#485C11] transition-colors"
                    rows={3}
                  />
                </div>

                <Button className="bg-[#485C11] hover:bg-[#485C11]/90 text-white rounded-full px-6">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-[#485C11]" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-black">Preferences</h2>
                  <p className="text-sm text-gray-600">Customize your experience and notification settings</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-black">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates about your reports</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#485C11] focus:ring-[#485C11]" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-black">Push Notifications</p>
                    <p className="text-sm text-gray-600">Get alerts for nearby hazards</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#485C11] focus:ring-[#485C11]" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-black">Location Sharing</p>
                    <p className="text-sm text-gray-600">Share your location with reports</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-[#485C11] focus:ring-[#485C11]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics Card */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-[#485C11]" />
                </div>
                <h2 className="text-xl font-medium text-black">Statistics</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reports</span>
                  <span className="px-3 py-1 bg-[#485C11]/10 text-[#485C11] rounded-full text-sm font-medium">45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verifications</span>
                  <span className="px-3 py-1 bg-[#485C11]/10 text-[#485C11] rounded-full text-sm font-medium">128</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Comments</span>
                  <span className="px-3 py-1 bg-[#485C11]/10 text-[#485C11] rounded-full text-sm font-medium">67</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reputation</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">250 points</span>
                </div>
              </div>
            </div>
          </div>

          {/* Favorite Trails Card */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-[#485C11]" />
                </div>
                <h2 className="text-xl font-medium text-black">Favorite Trails</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Trail A</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">12 reports</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Mountain Loop</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">8 reports</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">River Trail</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">5 reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
