import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { Project, initialProjects } from "../pages/projectsData";
import { sharePointService } from "../services/sharePointService";
import { getAccessTokenByApp } from "../hooks/useClientCredentialsAuth";
import { appConfig } from "../config/appConfig";

interface ProjectsContextType {
  projects: Project[];
  addProject: (data: Project) => Promise<void>;
  updateProject: (id: string | number, data: Project) => Promise<void>;
  deleteProject: (id: string | number) => Promise<void>;
  getProjectById: (id: string | number) => Project | undefined;
  reloadProjects: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined,
);

function getNextId(projects: Project[]): number {
  if (projects.length === 0) return 1;
  return Math.max(...projects.map((p) => Number(p.id)), 0) + 1;
}

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const reloadProjects = useCallback(async () => {
    try {
      const token: string | null = await getAccessTokenByApp();
      const containerId: string = appConfig.ContainerID;

      if (!token) {
        console.error("Failed to acquire app token for projects reload");
        return;
      }

      const containers = await sharePointService.getAllContainers(
        token,
        appConfig.containerTypeId,
      );

      const folderRes: any[] = await sharePointService.fetchRootFolders(
        token,
        containerId,
      );
      const resData: Project[] = await Promise.all(
        folderRes?.map(async (data: any) => {
          return await sharePointService.fetchCustomDatas(
            token,
            containerId,
            data?.id,
          );
        }) ?? [],
      );

      setProjects(resData);
    } catch (error) {
      console.error("Error reloading projects from SharePoint:", error);
    }
  }, []);

  useEffect(() => {
    // Replace static demo data with live containers when available
    reloadProjects();
  }, [reloadProjects]);

  const addProject = useCallback(async (data: Project) => {
    const accessToken: string | null = await getAccessTokenByApp();
    const containerId: string = appConfig.ContainerID;
    await sharePointService.createCustomDatas(
      accessToken,
      containerId,
      data?.P_Name,
      data,
    );
    await reloadProjects();
  }, []);

  const updateProject = useCallback(async (id: string, data: Project) => {
    const accessToken: string | null = await getAccessTokenByApp();
    const containerId: string = appConfig.ContainerID;
    await sharePointService.updateCustomColumn(
      accessToken,
      containerId,
      id,
      data?.P_Name,
      data,
    );
    await reloadProjects();
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const accessToken: string | null = await getAccessTokenByApp();
    const containerId: string = appConfig.ContainerID;
    await sharePointService.deleteFolderAndItem(accessToken, containerId, id);
    await reloadProjects();
  }, []);

  const getProjectById = useCallback(
    (id: string | number) => projects.find((p) => p.id === id),
    [projects],
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
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
