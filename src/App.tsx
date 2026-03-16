
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, AppRole } from "./context/AuthContext";
import { ProjectsProvider } from "./context/ProjectsContext";
import { ConfigProvider } from "./context/ConfigContext";
import { ApiCallsProvider } from "./context/ApiCallsContext";
import { SidebarProvider } from "./components/ui/sidebar";
import Layout from "./components/Layout";
import LayoutWithSearch from "./components/LayoutWithSearch";
import Index from "./pages/Index";
import Login from "./pages/Login";

import Files from "./pages/Files";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";
import React, { Suspense } from 'react';
// import './App.css';


// Initialize QueryClient with default options and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Log global query errors - using the correct listener format for TanStack Query v5
queryClient.getQueryCache().subscribe((event) => {
  // Check if the event has an error using the updated syntax for v5
  if (event.type === 'updated' && event.query.state.status === 'error') {
  }
});

// Simple fallback for loading states
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import Insights from "./pages/Insights";
import Directory from "./pages/Directory";
import Repository from "./pages/Repository";
import Analytics from "./pages/Analytics";
import Identity from "./pages/Identity";
import VendorApprovals from "./pages/VendorApprovals";
import { AdminLayout } from "./pages/AdminLayout";
import ChatBot from "./components/AI/ChatBot";

// Chat button is only shown to M365 users, not vendor users
const ChatBotForM365 = () => {
  const { loginType } = useAuth();
  if (loginType !== 'm365') return null;
  return <ChatBot />;
};

const App = () => {

  return (
    <FluentProvider theme={webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <ProjectsProvider>
                <ConfigProvider>
                  <ApiCallsProvider>
                    <Suspense fallback={<LoadingFallback />}>
                      <Toaster />
                      <Sonner />
                      <ChatBotForM365 />
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin" element={<Navigate to="/insights" replace />} />
                        <Route path="/admin/directory" element={<Navigate to="/projects" replace />} />
                        <Route path="/directory" element={<Navigate to="/projects" replace />} />
                        <Route path="/admin/repository" element={<Navigate to="/repository" replace />} />
                        <Route path="/admin/analytics" element={<Navigate to="/analytics" replace />} />
                        <Route path="/admin/identity" element={<Navigate to="/identity" replace />} />
                        <Route path="/" element={<ProtectedRouteStandalone><AdminLayout /></ProtectedRouteStandalone>}>
                          <Route index element={<DefaultRedirect />} />
                          <Route
                            path="insights"
                            element={(
                              <ModuleGuard allowedRoles={['admin']}>
                                <Insights />
                              </ModuleGuard>
                            )}
                          />
                          <Route
                            path="projects"
                            element={(
                              <ModuleGuard allowedRoles={['admin', 'manager', 'executive']} allowVendor>
                                <Directory />
                              </ModuleGuard>
                            )}
                          />

                          <Route
                            path="repository"
                            element={(
                              <ModuleGuard allowedRoles={['admin', 'manager', 'executive']} allowVendor>
                                <Repository />
                              </ModuleGuard>
                            )}
                          />
                          <Route
                            path="analytics"
                            element={(
                              <ModuleGuard allowedRoles={['admin', 'manager', 'executive']}>
                                <Analytics />
                              </ModuleGuard>
                            )}
                          />
                          <Route
                            path="vendor-approvals"
                            element={(
                              <ModuleGuard allowedRoles={['admin']}>
                                <VendorApprovals />
                              </ModuleGuard>
                            )}
                          />
                          <Route
                            path="identity"
                            element={(
                              <ModuleGuard allowedRoles={['admin']}>
                                <Identity />
                              </ModuleGuard>
                            )}
                          />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ApiCallsProvider>
                </ConfigProvider>
              </ProjectsProvider>
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </FluentProvider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// New protected route that includes the search header
const ProtectedRouteWithSearch = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <LayoutWithSearch>{children}</LayoutWithSearch>;
};

// Redirect to default screen: vendors go to Project, others to Insights
const DefaultRedirect = () => {
  const { loginType } = useAuth();
  return <Navigate to={loginType === 'vendor' ? '/projects' : '/insights'} replace />;
};

// Standalone protected route without standard layout
const ProtectedRouteStandalone = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const ModuleGuard = ({
  allowedRoles,
  allowVendor = false,
  children,
}: {
  allowedRoles: AppRole[];
  allowVendor?: boolean;
  children: React.ReactNode;
}) => {
  const { role, loginType } = useAuth();

  // Vendors may only access Project and Repository (and project detail from Project)
  if (loginType === 'vendor' && !allowVendor) {
    return <Navigate to="/projects" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};

export default App;

