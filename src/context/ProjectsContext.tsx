import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Project, initialProjects } from '../pages/projectsData';
import { sharePointService } from '../services/sharePointService';
import { getAccessTokenByApp } from '../hooks/useClientCredentialsAuth';
import { appConfig } from '../config/appConfig';

interface ProjectsContextType {
  projects: Project[];
  addProject: (data: Omit<Project, 'id'>) => void;
  updateProject: (id: number, data: Partial<Omit<Project, 'id'>>) => void;
  deleteProject: (id: number) => void;
  getProjectById: (id: number) => Project | undefined;
  reloadProjects: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

function getNextId(projects: Project[]): number {
  if (projects.length === 0) return 1;
  return Math.max(...projects.map((p) => p.id), 0) + 1;
}

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const reloadProjects = useCallback(async () => {
    try {
      const token = await getAccessTokenByApp();
      if (!token) {
        console.error('Failed to acquire app token for projects reload');
        return;
      }

      const containers = await sharePointService.getAllContainers(token, appConfig.containerTypeId);

      const mapped: Project[] = containers.map((c, index) => {
        const created = c.createdDateTime ? new Date(c.createdDateTime) : new Date();
        const end = new Date(created.getTime() + 90 * 24 * 60 * 60 * 1000);

        return {
          id: index + 1,
          P_Name: c.name || 'Project',
          P_Description: c.webUrl || '',
          P_StartDate: created.toISOString(),
          P_EndDate: end.toISOString(),
          P_Type: 'SharePoint Container',
          V_SubmittedByEmail: '',
          V_BidSubmissionDate: null,
          V_BidDescription: '',
          V_BidAmount: '',
          P_VendorSubmissionDueDate: null,
          P_Budget: '',
        };
      });

      setProjects(mapped);
    } catch (error) {
      console.error('Error reloading projects from SharePoint:', error);
    }
  }, []);

  useEffect(() => {
    // Replace static demo data with live containers when available
    reloadProjects();
  }, [reloadProjects]);

  const addProject = useCallback(async (data: Omit<Project, 'id'>) => {
    debugger;
    const accessToken: string | null = await getAccessTokenByApp();
    const containerId: string = appConfig.ContainerID;
    await sharePointService.createFolder(accessToken, containerId, "", data.P_Name, data);
    setProjects((prev) => {
      const id = getNextId(prev);
      return [...prev, { ...data, id }];
    });
  }, []);

  const updateProject = useCallback((id: number, data: Partial<Omit<Project, 'id'>>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }, []);

  const deleteProject = useCallback((id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getProjectById = useCallback(
    (id: number) => projects.find((p) => p.id === id),
    [projects]
  );

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        addProject,
        updateProject,
        deleteProject,
        getProjectById,
        reloadProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export function useProjects(): ProjectsContextType {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
