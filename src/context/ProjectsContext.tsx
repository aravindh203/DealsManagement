import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Project, initialProjects } from '../pages/projectsData';

interface ProjectsContextType {
  projects: Project[];
  addProject: (data: Omit<Project, 'id'>) => void;
  updateProject: (id: number, data: Partial<Omit<Project, 'id'>>) => void;
  deleteProject: (id: number) => void;
  getProjectById: (id: number) => Project | undefined;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

function getNextId(projects: Project[]): number {
  if (projects.length === 0) return 1;
  return Math.max(...projects.map((p) => p.id), 0) + 1;
}

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const addProject = useCallback((data: Omit<Project, 'id'>) => {
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
