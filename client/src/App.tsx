import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import ReportDetail from './pages/ReportDetail'
import CreateReport from './pages/CreateReport'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import Trails from './pages/Trails';
import TrailDetail from './pages/TrailDetail';
import Analytics from './pages/Analytics';

// Components
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Styles
import '@/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/:id" element={<ReportDetail />} />
              <Route path="reports/create" element={<CreateReport />} />
              <Route path="trails" element={<Trails />} />
              <Route path="trails/:trailId" element={<TrailDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/panel" element={<AdminPanel />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="users/:id" element={<UserProfile />} />
            </Route>
          </Routes>
          <Toaster />
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
