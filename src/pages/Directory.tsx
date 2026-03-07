import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Directory.module.scss";
import {
  AddRegular,
  SearchRegular,
  ArrowSyncRegular,
  EditRegular,
  DeleteRegular,
} from "@fluentui/react-icons";
import { useProjects } from "../context/ProjectsContext";
import { ProjectFormDialog } from "../components/ProjectFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Project } from "./projectsData";
import { getAccessTokenByApp } from "../hooks/useClientCredentialsAuth";
import { appConfig } from "../config/appConfig";
import { sharePointService } from "../services/sharePointService";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;

const LineGraphIcon = () => (
  <svg
    width="14"
    height="10"
    viewBox="0 0 14 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.badgeChartIcon}
  >
    <path
      d="M1 8L4 5L6 6L9 2L13 4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 2a4.5 4.5 0 0 1 4.5 4.5v2.09a3 3 0 0 0 .66 1.87l.9 1.2a.75.75 0 0 1-.6 1.2H4.54a.75.75 0 0 1-.6-1.2l.9-1.2a3 3 0 0 0 .66-1.87V6.5A4.5 4.5 0 0 1 10 2zm3 12.5a3 3 0 1 1-6 0h6z"
      fill="currentColor"
    />
  </svg>
);

const ChartIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 14l4-5 4 3 5-8 3 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const BriefcaseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 3a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6zm0 2h8v1H6V5zm-2 3v8h12V8H4z"
      fill="currentColor"
    />
  </svg>
);

type ProjectStatus = "Not Started" | "Open" | "Completed";

const getProjectStatus = (project: Project, now: Date): ProjectStatus => {
  const start = project.P_StartDate ? new Date(project.P_StartDate) : null;
  const end = project.P_EndDate ? new Date(project.P_EndDate) : null;

  if (end && end < now) return "Completed";
  if (start && start > now) return "Not Started";
  return "Open";
};

const isInCurrentMonth = (dateStr?: string | null): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

const Directory: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, reloadProjects } =
    useProjects();

  const [searchProjects, setSearchProjects] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<
    string | number | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const now = useMemo(() => new Date(), []);

  const totalProjects = projects.length;

  const openProjectsCount = useMemo(
    () => projects.filter((p) => getProjectStatus(p, now) === "Open").length,
    [projects, now],
  );

  const thisMonthProjectsCount = useMemo(
    () => projects.filter((p) => isInCurrentMonth(p.P_StartDate)).length,
    [projects],
  );

  const filteredProjects = useMemo(() => {
    let list = projects;
    const q = searchProjects.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          (p.P_Name && p.P_Name.toLowerCase().includes(q)) ||
          (p.P_Type && p.P_Type.toLowerCase().includes(q)) ||
          (p.P_Description && p.P_Description.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [projects, searchProjects]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / PAGE_SIZE),
  );
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchProjects]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleRefresh = () => {
    setSearchProjects("");
    setCurrentPage(1);
    // Reload projects from SharePoint containers
    reloadProjects();
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleSaveProject = async (
    data: Omit<Project, "id">,
    file?: File | null,
  ) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, data);
      } else {
        await addProject(data);
      }

      if (file) {
        try {
          const token = await getAccessTokenByApp();
          if (!token) {
            toast({
              title: "Upload failed",
              description: "Could not get access token for file upload.",
              variant: "destructive",
            });
          } else {
            const containerId = appConfig.ContainerID;
            await sharePointService.uploadFile(
              token,
              containerId,
              "root",
              file,
              () => {},
            );
            toast({
              title: "File uploaded",
              description: `File ${file.name} uploaded successfully.`,
            });
          }
        } catch (err) {
          console.error("Error uploading file from project dialog:", err);
          toast({
            title: "Upload failed",
            description: "File could not be uploaded.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Error saving project:", err);
      toast({
        title: "Save failed",
        description: "Project could not be saved.",
        variant: "destructive",
      });
    } finally {
      setFormOpen(false);
      setEditingProject(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId !== null) {
      deleteProject(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <span className={styles.logo}>Directory</span>
          <div className={styles.badge}>
            <LineGraphIcon />
            <span>REAL-TIME ACTIVE</span>
          </div>
        </div>
        <div className={styles.navRight}>
          <div className={styles.searchBar}>
            <SearchRegular className={styles.searchIcon} />
            <input type="text" placeholder="Search resources..." />
          </div>
          <button className={styles.navIconBtn} title="Notifications">
            <span className={styles.bellWrapper}>
              <BellIcon />
              <span className={styles.notifDot} />
            </span>
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.mainStatic}>
          <div className={styles.pageHeader}>
            <div className={styles.titleGroup}>
              <span className={styles.overline}>RESOURCE DIRECTORY</span>
              <h1 className={styles.pageTitle}>Project</h1>
            </div>
            <button
              className={styles.registerBtn}
              type="button"
              onClick={handleOpenCreate}
            >
              <AddRegular />
              NEW PROJECT
            </button>
          </div>

          <div className={styles.cardsRow}>
            <div className={styles.dirCard}>
              <div className={styles.dirCardIcon}>
                <BriefcaseIcon />
              </div>
              <span className={styles.dirCardLabel}>TOTAL PROJECTS</span>
              <span className={styles.dirCardValue}>{totalProjects}</span>
              <span className={styles.dirCardSub}>Projects in directory</span>
            </div>
            <div className={styles.dirCard}>
              <div className={styles.dirCardIcon}>
                <AddRegular />
              </div>
              <span className={styles.dirCardBadge}>
                {thisMonthProjectsCount}
              </span>
              <span className={styles.dirCardLabel}>THIS MONTH PROJECTS</span>
              <span className={styles.dirCardValue}>
                {thisMonthProjectsCount}
              </span>
              <span className={styles.dirCardSub}>
                Starting in the current month
              </span>
            </div>
            <div className={styles.dirCard}>
              <div className={styles.dirCardIcon}>
                <ChartIcon />
              </div>
              <span className={styles.dirCardLabel}>OPEN PROJECTS</span>
              <span className={styles.dirCardValueOrange}>
                {openProjectsCount}
              </span>
              <span className={styles.dirCardSub}>Currently active</span>
            </div>
          </div>
        </div>

        <div className={styles.mainScroll}>
          <div className={styles.filtersRow}>
            <div className={styles.searchCustomers}>
              <SearchRegular className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchProjects}
                onChange={(e) => setSearchProjects(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={handleRefresh}
                title="Refresh filters"
              >
                <ArrowSyncRegular className={styles.refreshIcon} />
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>PROJECT NAME</th>
                  <th>STATUS</th>
                  <th>START DATE</th>
                  <th>END DATE</th>
                  <th>BUDGET</th>
                  <th>BID AMOUNT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link to={`/project/${project.id}`}>
                        <strong>{project.P_Name}</strong>
                      </Link>
                      <span className={styles.idHint}> (ID: {project.id})</span>
                    </td>
                    <td>{getProjectStatus(project, now)}</td>
                    <td>
                      {project.P_StartDate
                        ? new Date(project.P_StartDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {project.P_EndDate
                        ? new Date(project.P_EndDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{project.P_Budget ? `$${project.P_Budget}` : "-"}</td>
                    <td>
                      {project.V_BidAmount ? `$${project.V_BidAmount}` : "-"}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleOpenEdit(project)}
                          title="Edit"
                        >
                          <EditRegular />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtnDanger}
                          onClick={() => setDeleteConfirmId(project.id)}
                          title="Delete"
                        >
                          <DeleteRegular />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ProjectFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            project={editingProject}
            onSave={handleSaveProject}
          />

          <AlertDialog
            open={deleteConfirmId !== null}
            onOpenChange={(open) => !open && setDeleteConfirmId(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The project will be removed from
                  the list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className={styles.paginationRow}>
            <span className={styles.entriesCount}>
              Showing{" "}
              {filteredProjects.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
              –{Math.min(currentPage * PAGE_SIZE, filteredProjects.length)} of{" "}
              {filteredProjects.length} entries
            </span>
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                aria-label="Previous"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === currentPage
                        ? styles.pageBtnActive
                        : styles.pageBtn
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                type="button"
                className={styles.pageBtn}
                aria-label="Next"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Directory;
