
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { sharePointService } from '@/services/sharePointService';
import { RollupDashboard } from '@/components/dashboard/RollupDashboard';
import { useApiCalls } from '../context/ApiCallsContext';

const Index = () => {
  const { getAccessToken, user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const { addApiCall } = useApiCalls();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        setPermissionError(false);
        
        const token = await getAccessToken();
        if (!token) {
          setError("Failed to get access token. Please try logging in again.");
          return;
        }

        const apiCallData = {
          method: 'GET',
          url: '/search/query',
          request: { query: 'containers using search method' }
        };

        try {
          const projectsList = await sharePointService.listContainersUsingSearch(token);
          setProjects(projectsList);
          
          addApiCall({
            ...apiCallData,
            response: projectsList,
            status: 200
          });
        } catch (error: any) {
          addApiCall({
            ...apiCallData,
            response: { error: error.message },
            status: error.status || 500
          });
          
          // Check if it's a permissions error (403)
          if (error.message && error.message.includes('403')) {
            setPermissionError(true);
          } else {
            throw error; // Re-throw if it's not a permissions error
          }
        }
      } catch (error: any) {
        setError(error.message || "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [getAccessToken, addApiCall]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900/70 px-6 py-8 space-y-8">
      <RollupDashboard />
      
      <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
        <Card className="border-amber-200/20 bg-slate-950/70 backdrop-blur-2xl shadow-[0_18px_55px_rgba(0,0,0,0.9)] text-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-50">Welcome to SharePoint Embedded Demo</CardTitle>
            <CardDescription>
              This is a simple demo application that demonstrates the SharePoint Embedded functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              SharePoint Embedded is a cloud storage platform that provides file storage and sharing capabilities that can be embedded in your applications.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              variant="outline"
              className="border-amber-300/60 bg-amber-400/10 text-amber-100 hover:bg-amber-300/20 hover:text-amber-50 hover:border-amber-200"
            >
              <Link to="/projects">View Projects</Link>
            </Button>
          </CardFooter>
        </Card>

        {permissionError && (
          <Card className="border-red-400/60 bg-red-900/40 backdrop-blur-xl text-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-700">Permission Error</CardTitle>
              </div>
              <CardDescription className="text-red-600">
                Limited access detected for {user?.username || 'guest account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                Your account does not have sufficient permissions to access projects. This is common for guest accounts.
              </p>
              <p className="mt-2 text-sm text-red-600">
                Please contact your administrator for the required permissions.
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error && !permissionError ? (
          <Card className="border-red-400/60 bg-red-900/40 backdrop-blur-xl text-red-50">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200/20 bg-slate-950/70 backdrop-blur-2xl shadow-[0_18px_55px_rgba(0,0,0,0.9)] text-slate-100">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                You have {projects.length} project{projects.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {permissionError ? 
                    "Permission denied: You don't have access to view projects." : 
                    "No projects found. Create a new project to get started."
                  }
                </p>
              ) : (
                <ul className="space-y-2">
                  {projects.slice(0, 5).map((project) => (
                    <li key={project.id} className="text-sm hover:underline">
                      <Link to={`/files/${project.id}`}>
                        {project.displayName || project.name || 'Unnamed Project'}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter>
              <Button
                asChild
                variant="outline"
                className="border-amber-300/60 bg-amber-400/10 text-amber-100 hover:bg-amber-300/20 hover:text-amber-50 hover:border-amber-200"
              >
                <Link to="/projects">View All Projects</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
