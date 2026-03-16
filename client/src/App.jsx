import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminClients = lazy(() => import('./pages/admin/Clients'));
const AdminClientForm = lazy(() => import('./pages/admin/ClientForm'));
const AdminPackages = lazy(() => import('./pages/admin/Packages'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminCredits = lazy(() => import('./pages/admin/Credits'));
const AdminBank = lazy(() => import('./pages/admin/Bank'));

// Client pages
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));
const Contacts = lazy(() => import('./pages/client/Contacts'));
const Groups = lazy(() => import('./pages/client/Groups'));
const Campaigns = lazy(() => import('./pages/client/Campaigns'));
const CampaignCreate = lazy(() => import('./pages/client/CampaignCreate'));
const Templates = lazy(() => import('./pages/client/Templates'));
const Analytics = lazy(() => import('./pages/client/Analytics'));
const Settings = lazy(() => import('./pages/client/Settings'));
const BuyCredits = lazy(() => import('./pages/client/BuyCredits'));

const Loader = () => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to={user.role === 'super_admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* Super Admin */}
        <Route path="/admin" element={<PrivateRoute adminOnly><AppLayout /></PrivateRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/new" element={<AdminClientForm />} />
          <Route path="clients/:id/edit" element={<AdminClientForm />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="credits" element={<AdminCredits />} />
          <Route path="bank" element={<AdminBank />} />
        </Route>

        {/* Tenant Client */}
        <Route path="/dashboard" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<ClientDashboard />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="groups" element={<Groups />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/new" element={<CampaignCreate />} />
          <Route path="templates" element={<Templates />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="buy-credits" element={<BuyCredits />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={
          <Navigate to={user?.role === 'super_admin' ? '/admin' : '/dashboard'} replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
