import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, Users, AlertTriangle, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Minimal: just logo and auth buttons */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo only */}
            <Link to="/" className="text-xl font-semibold tracking-tight text-black">
              Trail Watch
            </Link>

            {/* Auth buttons only */}
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-black text-sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#485C11] hover:bg-[#485C11]/90 text-white rounded-full px-5 py-2 text-sm font-medium">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Large serif headline like Area */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-serif font-normal text-black leading-[1.1] tracking-tight">
              Stay safe on every trail.
            </h1>
          </div>
        </div>
      </section>

      {/* Dashboard Section with Map */}
      <section className="px-6 lg:px-8 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Green Box with Photo Gallery */}
          <div className="bg-[#8E9C78] rounded-2xl p-4 h-[500px]">
            <div className="grid grid-cols-3 gap-3 h-full">
              {/* Left column - 2 stacked images */}
              <div className="flex flex-col gap-3 h-full overflow-hidden">
                <div className="flex-1 overflow-hidden rounded-xl">
                  <img
                    src="/photos/rockslide.jpg"
                    alt="Rockslide on trail"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                  />
                </div>
                <div className="flex-1 overflow-hidden rounded-xl">
                  <img
                    src="/photos/broken%20bridge%20trail.jpg"
                    alt="Broken bridge trail"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Middle column - 1 tall image */}
              <div className="h-full overflow-hidden rounded-xl">
                <img
                  src="/photos/closed area.jpeg"
                  alt="Closed area warning"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                />
              </div>

              {/* Right column - 2 stacked images */}
              <div className="flex flex-col gap-3 h-full overflow-hidden">
                <div className="flex-1 overflow-hidden rounded-xl">
                  <img
                    src="/photos/flooding.jpeg"
                    alt="Flooded trail"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                  />
                </div>
                <div className="flex-1 overflow-hidden rounded-xl">
                  <img
                    src="/photos/fallen%20tree.jpg"
                    alt="Fallen tree on trail"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - All 4 features, minimal style */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: Live Updates */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#485C11]" />
              </div>
              <h3 className="text-xl font-medium text-black">Live Updates</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Real-time hazard reporting from the community keeps you informed about current trail conditions.
              </p>
            </div>

            {/* Feature 2: Community Verified */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#485C11]" />
              </div>
              <h3 className="text-xl font-medium text-black">Community Verified</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Reports are confirmed by other users, ensuring accurate and reliable trail information.
              </p>
            </div>

            {/* Feature 3: Safety Alerts */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#485C11]" />
              </div>
              <h3 className="text-xl font-medium text-black">Safety Alerts</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Get instant notifications about critical hazards and trail closures in your area.
              </p>
            </div>

            {/* Feature 4: Interactive Maps */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#485C11]/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#485C11]" />
              </div>
              <h3 className="text-xl font-medium text-black">Interactive Maps</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Easy-to-use maps showing all reported conditions with filtering and search capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-[#485C11]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">
            Ready to explore safely?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of hikers, runners, and outdoor enthusiasts who are making trails safer for everyone.
          </p>
          <Link to="/register">
            <Button className="bg-white text-[#485C11] hover:bg-white/90 rounded-full px-8 py-6 text-base font-medium inline-flex items-center gap-2">
              Start Your Journey
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-lg font-semibold text-black">Trail Watch</span>
            <p className="text-sm text-gray-500">
              &copy; 2024 Trail Watch Platform. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-black transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-black transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-black transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
