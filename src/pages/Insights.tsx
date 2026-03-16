import React, { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./Insights.module.scss";
import {
  CubeRegular,
  PeopleRegular,
  ShieldCheckmarkRegular,
  MoneyRegular,
  PulseRegular,
  ArrowSyncRegular,
  ArrowUploadRegular,
  DismissRegular,
  FolderRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";
import { UserMenu } from "../components/UserMenu";
import { useAdminStats, formatBytes } from "../hooks/useAdminStats";
import { useProjects } from "../context/ProjectsContext";
import { getAccessTokenByApp } from "../hooks/useClientCredentialsAuth";
import { appConfig } from "../config/appConfig";
import { sharePointService } from "../services/sharePointService";
import { toast } from "../hooks/use-toast";
import { formatCurrencyDisplay, formatNumberWithCommas } from "../utils/numberFormat";
import type { Project } from "./projectsData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Bell icon for notifications (with red dot)
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

type ProjectStatus = "Not Started" | "Open" | "Completed";

const getProjectStatus = (project: Project, now: Date): ProjectStatus => {
  const start = project.P_StartDate ? new Date(project.P_StartDate) : null;
  const end = project.P_EndDate ? new Date(project.P_EndDate) : null;

  if (end && end < now) return "Completed";
  if (start && start > now) return "Not Started";
  return "Open";
};

/** Status pill class suffix from P_Status (no spaces), to match Directory table. */
const getStatusPillClass = (status: string): string =>
  status.replace(/\s+/g, "");

// ── Component ──────────────────────────────────────────────
const Insights: React.FC = () => {
  const {
    containerCount,
    totalStorageUsedBytes,
    totalStorageTotalBytes,
    containers,
    loading,
    error,
    refetch,
  } = useAdminStats();
  const { projects, reloadProjects } = useProjects();
  const [companiesFromUserDetails, setCompaniesFromUserDetails] = useState<
    string[]
  >([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [deletingOldVendorColumn, setDeletingOldVendorColumn] = useState(false);
  const [deletingAllProjects, setDeletingAllProjects] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [columnAction, setColumnAction] = useState<
    "create" | "delete" | "deleteAllProjects"
  >("create");

  const loadCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const list = await sharePointService.getAllCompaniesFromUserDetails();
      setCompaniesFromUserDetails(list);
    } catch {
      setCompaniesFromUserDetails([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const now = new Date();

  const totalProjects = projects.length;
  /** Sum of all project budgets (P_Budget) for Total Budget card. */
  const totalBudget = useMemo(
    () =>
      projects.reduce((sum, p) => {
        const b = p.P_Budget
          ? parseFloat(String(p.P_Budget).replace(/[^0-9.-]/g, ""))
          : 0;
        return sum + (Number.isNaN(b) ? 0 : b);
      }, 0),
    [projects],
  );
  /** Open count uses P_Status (same as Directory) so the card reflects actual list data. */
  const openProjectsCount = projects.filter(
    (p) => (p.P_Status ?? "Open") === "Open",
  ).length;
  const completedProjectsCount = useMemo(
    () =>
      projects.filter((p) => getProjectStatus(p, new Date()) === "Completed")
        .length,
    [projects],
  );

  const latestUpdates = useMemo(() => {
    const items = projects
      .map((project) => {
        const dateStr =
          project.P_StartDate ||
          project.V_BidSubmissionDate ||
          project.P_EndDate ||
          project.P_VendorSubmissionDueDate ||
          null;
        if (!dateStr) return null;
        return { project, date: new Date(dateStr) };
      })
      .filter((x): x is { project: Project; date: Date } => x !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    return items.slice(0, 3);
  }, [projects]);

  /** Top Vendors: count projects where this company is the finalized vendor (stored in V_BidDescription). */
  const topVendors = useMemo(() => {
    if (!companiesFromUserDetails.length) return [];

    return companiesFromUserDetails
      .map((company) => {
        const normalizedCompany = company.trim().toLowerCase();
        const count = projects.filter((project) => {
          const finalized = (project.V_BidDescription ?? "")
            .toString()
            .trim()
            .toLowerCase();
          return finalized !== "" && finalized === normalizedCompany;
        }).length;

        return { company, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [companiesFromUserDetails, projects]);

  // Format storage for display
  const usedFormatted = formatBytes(totalStorageUsedBytes);
  const totalFormatted = formatBytes(totalStorageTotalBytes);
  const storagePercent =
    totalStorageTotalBytes > 0
      ? Math.round((totalStorageUsedBytes / totalStorageTotalBytes) * 100)
      : 0;

  const handleCreateColumn = async () => {
    if (creatingColumn) return;
    setCreatingColumn(true);
    try {
      const token = await getAccessTokenByApp();
      if (!token) {
        toast({
          title: "Column creation failed",
          variant: "destructive",
        });
        return;
      }
      await sharePointService.CreateColumn(token, appConfig.ContainerID);
      toast({
        title: "Column created",
      });
    } catch (err) {
      toast({
        title: "Column creation failed",
        variant: "destructive",
      });
    } finally {
      setCreatingColumn(false);
    }
  };

  const handleDeleteOldFinilizedVendorColumn = async () => {
    if (deletingOldVendorColumn) return;
    setDeletingOldVendorColumn(true);
    try {
      const token = await getAccessTokenByApp();
      if (!token) {
        toast({
          title: "Column deletion failed",
          variant: "destructive",
        });
        return;
      }

      await sharePointService.deleteColumnByName(
        token,
        appConfig.ContainerID,
        "P_FinilizedVendor",
      );

      toast({
        title: "Column removed",
      });
    } catch (err) {
      toast({
        title: "Column deletion failed",
        variant: "destructive",
      });
    } finally {
      setDeletingOldVendorColumn(false);
    }
  };

  const handleDeleteAllProjectsInContainer = async () => {
    if (deletingAllProjects) return;

    const confirmed = window.confirm(
      "This will permanently delete all projects (top-level folders) in the current SharePoint container. This action cannot be undone. Do you want to continue?",
    );
    if (!confirmed) return;

    setDeletingAllProjects(true);
    try {
      const token = await getAccessTokenByApp();
      if (!token) {
        toast({
          title: "Delete projects failed",
          variant: "destructive",
        });
        return;
      }

      await sharePointService.deleteAllProjectsInContainer(
        token,
        appConfig.ContainerID,
      );
      await reloadProjects();

      toast({
        title: "Projects deleted",
      });
    } catch (err) {
      toast({
        title: "Delete projects failed",
        variant: "destructive",
      });
    } finally {
      setDeletingAllProjects(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Top Navigation ── */}
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <span className={styles.logo}>Insights</span>
        </div>

        <div className={styles.navRight}>
          <button
            type="button"
            style={{ display: "none" }}
            className={styles.logoutBtn}
            onClick={() => setColumnDialogOpen(true)}
            title="Manage vendor columns"
          >
            <span>Manage Columns</span>
          </button>
          <UserMenu />
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className={styles.main}>
        {/* Static: Page Header + Stat Cards */}
        <div className={styles.mainStatic}>
          <div className={styles.pageHeader}>
            <div className={styles.titleGroup}>
              <span className={styles.overline}>NEXUS</span>
              <h1 className={styles.pageTitle}>Insights</h1>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className={styles.statsRow}>
            {/* Total Budget – dark card */}
            <div className={`${styles.card} ${styles.cardDark}`}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconBox} ${styles.iconBoxDark}`}>
                  <MoneyRegular />
                </div>
              </div>
              <div className={styles.cardBottom}>
                <span className={styles.cardLabel}>TOTAL BUDGET</span>
                <h2 className={styles.cardValue}>
                  {formatCurrencyDisplay(totalBudget, { prefix: "₹" })}
                </h2>
                <span className={styles.cardSub}>Projected project budget</span>
              </div>
            </div>

            {/* Total Vendors */}
            <div className={`${styles.card} ${styles.cardLight}`}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                  <PeopleRegular />
                </div>
                {loadingCompanies && (
                  <ArrowSyncRegular
                    style={{
                      color: "#6B47E5",
                      fontSize: 16,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
              </div>
              <div className={styles.cardBottom}>
                <span className={styles.cardLabel}>TOTAL VENDORS</span>
                {loadingCompanies ? (
                  <h2 className={styles.cardValue} style={{ fontSize: 24 }}>
                    …
                  </h2>
                ) : (
                  <>
                    <h2 className={styles.cardValue}>
                      {companiesFromUserDetails.length}
                    </h2>
                    <span className={styles.cardSub}>Vendors</span>
                  </>
                )}
              </div>
            </div>

            {/* Completed Projects */}
            <div className={`${styles.card} ${styles.cardLight}`}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                  <CheckmarkCircleRegular />
                </div>
              </div>
              <div className={styles.cardBottom}>
                <span className={styles.cardLabel}>COMPLETED PROJECTS</span>
                {loading ? (
                  <h2
                    className={`${styles.cardValue} ${styles.cardValuePurple}`}
                    style={{ fontSize: 24 }}
                  >
                    …
                  </h2>
                ) : (
                  <>
                    <h2
                      className={`${styles.cardValue} ${styles.cardValuePurple}`}
                    >
                      {completedProjectsCount}
                    </h2>
                    <span className={styles.cardSub}>Projects completed</span>
                  </>
                )}
              </div>
            </div>

            {/* Open Projects */}
            <div className={`${styles.card} ${styles.cardPurple}`}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconBox} ${styles.iconBoxPurple}`}>
                  <PulseRegular />
                </div>
              </div>
              <div className={styles.cardBottom}>
                <span className={styles.cardLabel}>OPEN PROJECT</span>
                <h2 className={styles.cardValue}>{openProjectsCount}</h2>
                <span className={styles.cardSub}>Currently active</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable: Audit Protocol + Cluster Vitals ── */}
        <div className={styles.mainScroll}>
          {/* ── Bottom Section ── */}
          <div className={styles.bottomSection}>
            {/* Projects - Latest Updates */}
            <div className={styles.auditCard}>
              <div className={styles.auditHeader}>
                <h3 className={styles.auditTitle}>Projects - Latest Updates</h3>
              </div>

              <div className={styles.auditTableWrap}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Project name</th>
                      <th>Date</th>
                      <th>Budget</th>
                      <th>Bid amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestUpdates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.auditEmptyCell}>
                          No recent project updates.
                        </td>
                      </tr>
                    ) : (
                      latestUpdates.map(({ project, date }, idx) => {
                        const status = project.P_Status ?? "Open";
                        const pillClass =
                          (styles as Record<string, string>)[
                            `status${getStatusPillClass(status)}`
                          ] ?? styles.statusOpen;
                        const initial = project.P_Name
                          ? project.P_Name.charAt(0).toUpperCase()
                          : "?";

                        return (
                          <tr key={idx}>
                            <td>
                              <div className={styles.entityCell}>
                                <div className={styles.avatar}>{initial}</div>
                                <div className={styles.entityInfo}>
                                  <span className={styles.entityName}>
                                    {project.P_Name || "—"}
                                  </span>
                                  <span className={styles.entityRole}>
                                    {project.P_Type || "Project"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{date.toLocaleDateString()}</td>
                            <td>
                              {project.P_Budget
                                ? formatCurrencyDisplay(project.P_Budget, {
                                    prefix: "₹",
                                  })
                                : "—"}
                            </td>
                            <td>
                              {project.V_BidAmount != null &&
                              String(project.V_BidAmount).trim() !== ""
                                ? formatCurrencyDisplay(project.V_BidAmount, {
                                    prefix: "₹",
                                  })
                                : "—"}
                            </td>
                            <td>
                              <span
                                className={`${styles.statusPill} ${pillClass}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {error && (
                <p style={{ color: "#e74c3c", fontSize: 12, marginTop: 16 }}>
                  ⚠ Could not load storage data: {error}
                </p>
              )}
            </div>

            {/* Top Vendors (Projects) */}
            <div className={styles.vitalsCard}>
              <div className={styles.vitalsHeader}>
                <h3 className={styles.vitalsTitle}>Top Vendors (Projects)</h3>
                <PulseRegular className={styles.pulseIcon} />
              </div>

              {loadingCompanies ? (
                <p style={{ color: "#b0b5c8", fontSize: 12, marginTop: 8 }}>
                  Loading companies…
                </p>
              ) : topVendors.length === 0 ? (
                <p style={{ color: "#b0b5c8", fontSize: 12, marginTop: 8 }}>
                  No vendor data available yet.
                </p>
              ) : (
                topVendors.map((v, idx) => {
                  const maxCount = Math.max(
                    1,
                    ...topVendors.map((x) => x.count),
                  );
                  const fill =
                    maxCount > 0 ? Math.round((v.count / maxCount) * 100) : 0;
                  const isPrimary = idx < 2;
                  return (
                    <div key={v.company} className={styles.vitalRow}>
                      <div className={styles.vitalMeta}>
                        <span className={styles.vitalLabel}>{v.company}</span>
                        <span
                          className={
                            isPrimary
                              ? styles.vitalValueGreen
                              : styles.vitalValuePurple
                          }
                        >
                          {v.count} project{v.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={
                            isPrimary
                              ? styles.progressBarGreen
                              : styles.progressBarPurple
                          }
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog
        open={columnDialogOpen}
        onOpenChange={(open) => {
          if (
            !creatingColumn &&
            !deletingOldVendorColumn &&
            !deletingAllProjects
          ) {
            setColumnDialogOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vendor column actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Choose what you want to do with the vendor columns in the embedded
              SharePoint container.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="columnAction"
                  value="create"
                  checked={columnAction === "create"}
                  onChange={() => setColumnAction("create")}
                />
                <span>Create new vendor column</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="columnAction"
                  value="deleteAllProjects"
                  checked={columnAction === "deleteAllProjects"}
                  onChange={() => setColumnAction("deleteAllProjects")}
                />
                <span>Delete all projects in container</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="columnAction"
                  value="delete"
                  checked={columnAction === "delete"}
                  onChange={() => setColumnAction("delete")}
                />
                <span>Delete old vendor column</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setColumnDialogOpen(false)}
              disabled={
                creatingColumn || deletingOldVendorColumn || deletingAllProjects
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (columnAction === "create") {
                  await handleCreateColumn();
                } else if (columnAction === "delete") {
                  await handleDeleteOldFinilizedVendorColumn();
                } else {
                  await handleDeleteAllProjectsInContainer();
                }
                setColumnDialogOpen(false);
              }}
              disabled={
                creatingColumn || deletingOldVendorColumn || deletingAllProjects
              }
            >
              {columnAction === "create"
                ? creatingColumn
                  ? "Creating…"
                  : "Create column"
                : columnAction === "delete"
                  ? deletingOldVendorColumn
                    ? "Deleting…"
                    : "Delete column"
                  : deletingAllProjects
                    ? "Deleting…"
                    : "Delete all projects"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Insights;
