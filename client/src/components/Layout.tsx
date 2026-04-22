import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { 
  Map, 
  FileText, 
  Plus, 
  User, 
  LogOut,
  Menu,
  X,
  Shield,
  Route
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Map', href: '/app', icon: Map },
    { name: 'Trails', href: '/app/trails', icon: Route },
    { name: 'Reports', href: '/app/reports', icon: FileText },
    { name: 'Create Report', href: '/app/reports/create', icon: Plus },
    { name: 'Profile', href: '/app/profile', icon: User },
    ...(user?.role === 'ADMIN' || user?.role === 'MODERATOR' 
      ? [{ name: 'Admin', href: '/app/admin', icon: Shield }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Map className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Trail Safety</span>
            </div>
            
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 pt-8 border-t">
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start mt-2"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-card border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Map className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Trail Safety</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 bg-card p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Map className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">Trail Safety</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start mt-2"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <main className="pb-16">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t">
          <div className="grid grid-cols-4 gap-1">
            {navigation.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center justify-center py-2 text-xs ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
