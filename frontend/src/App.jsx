import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import PlotList from './pages/PlotList';
import PlotDetail from './pages/PlotDetail';
import Alerts from './pages/Alerts';
import FarmForm from './pages/FarmForm';
import FarmList from './pages/FarmList';
import FarmDetail from './pages/FarmDetail';
import PlotForm from './pages/PlotForm';
import SensorReadings from './pages/SensorReadings';
import Recommendations from './pages/Recommendations';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="farms" element={<FarmList />} />
          <Route path="farms/new" element={<FarmForm />} />
          <Route path="farms/:id" element={<FarmDetail />} />
          <Route path="farms/:id/edit" element={<FarmForm />} />
          <Route path="plots" element={<PlotList />} />
          <Route path="plots/:id" element={<PlotDetail />} />
          <Route path="plots/new" element={<PlotForm />} />
          <Route path="plots/:id/edit" element={<PlotForm />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="sensor-readings" element={<SensorReadings />} />
          <Route path="recommendations" element={<Recommendations />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;