
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
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { ApiCallsProvider } from "./context/ApiCallsContext";
import { SidebarProvider } from "./components/ui/sidebar";
import Layout from "./components/Layout";
import LayoutWithSearch from "./components/LayoutWithSearch";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Files from "./pages/Files";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";
import React, { Suspense } from 'react';


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
    console.error('Query cache error:', event.query.state.error);
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
import { AdminLayout } from "./pages/AdminLayout";

const App = () => {
  console.log('App component rendering');

  return (
    <FluentProvider theme={webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <ConfigProvider>
                <ApiCallsProvider>
                  <Suspense fallback={<LoadingFallback />}>
                    <Toaster />
                    <Sonner />
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/admin" element={<Navigate to="/insights" replace />} />
                      <Route path="/admin/directory" element={<Navigate to="/directory" replace />} />
                      <Route path="/admin/repository" element={<Navigate to="/repository" replace />} />
                      <Route path="/admin/analytics" element={<Navigate to="/analytics" replace />} />
                      <Route path="/admin/identity" element={<Navigate to="/identity" replace />} />
                      <Route path="/" element={<ProtectedRouteStandalone><AdminLayout /></ProtectedRouteStandalone>}>
                        <Route index element={<Navigate to="/insights" replace />} />
                        <Route path="insights" element={<Insights />} />
                        <Route path="directory" element={<Directory />} />
                        <Route path="repository" element={<Repository />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="identity" element={<Identity />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ApiCallsProvider>
              </ConfigProvider>
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

// Standalone protected route without standard layout
const ProtectedRouteStandalone = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default App;
