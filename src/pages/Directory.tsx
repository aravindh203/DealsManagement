import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Directory.module.scss";
import {
    AddRegular,
    SearchRegular,
    ArrowSyncRegular,
    EditRegular,
    DeleteRegular,
} from "@fluentui/react-icons";
import { Eye, LogOut, Sparkles } from "lucide-react";
import AiSummarize from "../components/AI/AiSummarize";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectsContext";
import { ProjectFormDialog, type ProjectDialogMode } from "../components/ProjectFormDialog";
import { AiProjectCreationForm } from "../components/AiProjectCreationForm";
import ChatBot from "../components/AI/ChatBot";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog as UiDialog, DialogContent as UiDialogContent } from "@/components/ui/dialog";
import { FileText, Mic } from "lucide-react";
import { VendorSubmissionDialog } from "../components/VendorSubmissionDialog";
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
import { Project, type ProjectStatusValue } from "./projectsData";
import { getAccessTokenByApp } from "../hooks/useClientCredentialsAuth";
import { appConfig } from "../config/appConfig";
import { sharePointService } from "../services/sharePointService";
import { toast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

/** Status from P_Status column; fallback to "Open" for older items. */
const getProjectStatus = (project: Project): ProjectStatusValue => {
    return project.P_Status ?? "Open";
};

const PROJECT_STATUS_OPTIONS: { value: ProjectStatusValue | "all"; label: string }[] = [
    { value: "all", label: "All statuses" },
    { value: "Open", label: "Open" },
    { value: "Yet to start", label: "Yet to start" },
    { value: "Pending", label: "Pending" },
    { value: "Completed", label: "Completed" },
];

/** CSS class suffix from P_Status (no spaces). */
const getStatusPillClass = (status: ProjectStatusValue): string => {
    return status.replace(/\s+/g, "");
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
    const { loginType, logout, vendorUser } = useAuth();
    const navigate = useNavigate();
    const isVendor = loginType === "vendor";

    const { projects, projectsLoading, addProject, updateProject, deleteProject, reloadProjects } =
        useProjects();

    const [searchProjects, setSearchProjects] = useState("");
    const [statusFilter, setStatusFilter] = useState<ProjectStatusValue | "all">("all");
    const [formOpen, setFormOpen] = useState(false);
    const [aiCreateOpen, setAiCreateOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<ProjectDialogMode>("create");
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<
        string | number | null
    >(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [vendorCompanyName, setVendorCompanyName] = useState<string | null>(null);
    const [projectHasVendorSubmission, setProjectHasVendorSubmission] = useState<Record<string, boolean>>({});
    const [projectVendorBidAmountMap, setProjectVendorBidAmountMap] = useState<Record<string, string | null>>({});
    const [vendorSubmissionOpen, setVendorSubmissionOpen] = useState(false);
    const [vendorSubmissionProject, setVendorSubmissionProject] = useState<Project | null>(null);
    const [aiSummarizeOpen, setAiSummarizeOpen] = useState(false);
    const [aiSummarizeProject, setAiSummarizeProject] = useState<string | null>("");

    const totalProjects = projects.length;

    const openProjectsCount = useMemo(
        () => projects.filter((p) => getProjectStatus(p) === "Open").length,
        [projects],
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
        if (statusFilter !== "all") {
            list = list.filter((p) => getProjectStatus(p) === statusFilter);
        }
        return list;
    }, [projects, searchProjects, statusFilter]);

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
    }, [searchProjects, statusFilter]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    useEffect(() => {
        if (!isVendor || !vendorUser?.username) {
            setVendorCompanyName(null);
            setProjectHasVendorSubmission({});
            setProjectVendorBidAmountMap({});
            return;
        }
        let cancelled = false;
        (async () => {
            const company = await sharePointService.getVendorCompanyFromUserDetails(vendorUser.username);
            if (cancelled) return;
            setVendorCompanyName(company ?? vendorUser.username);
            if (!projects.length) {
                setProjectHasVendorSubmission({});
                setProjectVendorBidAmountMap({});
                return;
            }
            const token = await getAccessTokenByApp();
            if (!token || cancelled) return;
            const containerId = appConfig.ContainerID;
            const companyName = company ?? vendorUser.username;
            const map: Record<string, boolean> = {};
            const bidMap: Record<string, string | null> = {};
            for (const project of projects) {
                if (cancelled) break;
                const pid = String(project.id);
                try {
                    const vendorFolderId = await sharePointService.getVendorFolderId(
                        token,
                        containerId,
                        pid,
                    );
                    if (!vendorFolderId) {
                        map[pid] = false;
                        bidMap[pid] = null;
                        continue;
                    }
                    const has = await sharePointService.hasCompanyFolderUnderVendor(
                        token,
                        containerId,
                        vendorFolderId,
                        companyName,
                    );
                    map[pid] = has;
                    if (has) {
                        const amount = await sharePointService.getCompanyFolderBidAmount(
                            token,
                            containerId,
                            pid,
                            companyName,
                        );
                        bidMap[pid] = amount;
                    } else {
                        bidMap[pid] = null;
                    }
                } catch {
                    map[pid] = false;
                    bidMap[pid] = null;
                }
            }
            if (!cancelled) {
                setProjectHasVendorSubmission(map);
                setProjectVendorBidAmountMap(bidMap);
            }
        })();
        return () => { cancelled = true; };
    }, [isVendor, vendorUser?.username, projects]);

    const handleRefresh = () => {
        setSearchProjects("");
        setStatusFilter("all");
        setCurrentPage(1);
        reloadProjects();
    };

    const handleOpenCreate = () => {
        setEditingProject(null);
        setDialogMode("create");
        setFormOpen(true);
    };

    const handleOpenView = (project: Project) => {
        setEditingProject(project);
        setDialogMode("view");
        setFormOpen(true);
    };

    const handleOpenEdit = (project: Project) => {
        setEditingProject(project);
        setDialogMode("edit");
        setFormOpen(true);
    };

    const loadExistingAttachments = useCallback(
        async (projectId: string) => {
            const token = await getAccessTokenByApp();
            if (!token) return [];
            try {
                const folderId =
                    await sharePointService.getOrCreateProjectAttachmentsFolderId(
                        token,
                        appConfig.ContainerID,
                        projectId,
                    );
                const items = await sharePointService.getFiles(
                    token,
                    appConfig.ContainerID,
                    folderId,
                );
                return items
                    .filter((i) => !i.folder)
                    .map((i) => ({ id: i.id, name: i.name }));
            } catch {
                return [];
            }
        },
        [],
    );

    const [savingProject, setSavingProject] = useState(false);

    const handleSaveProject = async (
        data: Omit<Project, "id">,
        files?: File[] | null,
        attachmentIdsToDelete?: string[],
    ) => {
        setSavingProject(true);
        try {
            let attachmentsFolderId: string | null = null;

            if (editingProject) {
                await updateProject(editingProject.id, data);
                if (attachmentIdsToDelete?.length) {
                    const token = await getAccessTokenByApp();
                    if (token) {
                        const containerId = appConfig.ContainerID;
                        let deleted = 0;
                        for (const fileId of attachmentIdsToDelete) {
                            try {
                                await sharePointService.deleteFile(
                                    token,
                                    containerId,
                                    fileId,
                                );
                                deleted++;
                            } catch (err) {
                                console.error("Error deleting attachment:", fileId, err);
                            }
                        }
                        if (deleted > 0) {
                            toast({
                                title: "Attachments updated",
                                description: `${deleted} file(s) removed from the project.`,
                            });
                        }
                    }
                }
                if (files?.length) {
                    const token = await getAccessTokenByApp();
                    if (token) {
                        attachmentsFolderId =
                            await sharePointService.getOrCreateProjectAttachmentsFolderId(
                                token,
                                appConfig.ContainerID,
                                String(editingProject.id),
                            );
                    }
                }
            } else {
                const result = await addProject(data);
                if (files?.length) attachmentsFolderId = result.attachmentsFolderId;
            }

            if (files?.length && attachmentsFolderId) {
                const token = await getAccessTokenByApp();
                if (!token) {
                    toast({
                        title: "Upload failed",
                        description: "Could not get access token for file upload.",
                        variant: "destructive",
                    });
                } else {
                    const containerId = appConfig.ContainerID;
                    let uploaded = 0;
                    let failed = 0;
                    for (const file of files) {
                        try {
                            await sharePointService.uploadFile(
                                token,
                                containerId,
                                attachmentsFolderId,
                                file,
                                () => { },
                            );
                            uploaded++;
                        } catch (err) {
                            console.error("Error uploading file:", file.name, err);
                            failed++;
                        }
                    }
                    if (uploaded > 0) {
                        toast({
                            title: "Attachments uploaded",
                            description:
                                failed > 0
                                    ? `${uploaded} file(s) uploaded; ${failed} failed.`
                                    : `${uploaded} file(s) uploaded to project Attachments.`,
                        });
                    }
                    if (failed > 0 && uploaded === 0) {
                        toast({
                            title: "Upload failed",
                            description: "Files could not be uploaded.",
                            variant: "destructive",
                        });
                    }
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
            setSavingProject(false);
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

    const handleOpenAiSummarize = (project: Project) => {
        setAiSummarizeProject(String(project.id));
        setAiSummarizeOpen(true);
    };

    const handleOpenVendorSubmission = (project: Project) => {
        setVendorSubmissionProject(project);
        setVendorSubmissionOpen(true);
    };

    const handleVendorSubmissionSave = async (
        bidAmount: string,
        filesByCategory: {
            proposalDocument: File[];
            supportingDocuments: File[];
            costEstimation: File[];
            policyDocuments: File[];
            approvalDocuments: File[];
        },
    ) => {
        if (!vendorSubmissionProject || !vendorCompanyName) return;
        const projectId = String(vendorSubmissionProject.id);
        try {
            const token = await getAccessTokenByApp();
            if (!token) {
                toast({ title: "Error", description: "Could not get access token.", variant: "destructive" });
                return;
            }
            const containerId = appConfig.ContainerID;

            const vendorFolderId = await sharePointService.getVendorFolderId(
                token,
                containerId,
                projectId,
            );
            if (!vendorFolderId) {
                toast({ title: "Error", description: "Vendor folder not found for this project. The project may need to have a Vendor folder created first.", variant: "destructive" });
                return;
            }
            await sharePointService.createCompanySubmission(
                token,
                containerId,
                vendorFolderId,
                vendorCompanyName,
                bidAmount,
                filesByCategory,
            );
            toast({ title: "Submission saved", description: "Your company folder and documents have been created." });
            setVendorSubmissionOpen(false);
            setVendorSubmissionProject(null);
            await reloadProjects();
            setProjectHasVendorSubmission((prev) => ({ ...prev, [projectId]: true }));
            setProjectVendorBidAmountMap((prev) => ({ ...prev, [projectId]: bidAmount.trim() || null }));
        } catch (err) {
            console.error("Vendor submission failed:", err);
            const message = err instanceof Error ? err.message : "Submission failed. Check the console for details.";
            toast({
                title: "Submission failed",
                description: message,
                variant: "destructive",
            });
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
                    <button
                        type="button"
                        className={styles.logoutBtn}
                        onClick={() => { logout(); navigate("/login"); }}
                        title="Logout"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
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
                        {!isVendor && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={styles.registerBtn} type="button">
                                        <AddRegular />
                                        NEW PROJECT
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem onClick={handleOpenCreate} className="cursor-pointer">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Start from scratch
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setAiCreateOpen(true)} className="cursor-pointer text-[#5a3dd4] focus:text-[#4a30b5] focus:bg-[#5a3dd4]/10">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Create with AI
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
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
                            <Select
                                value={statusFilter}
                                onValueChange={(v) => setStatusFilter(v as ProjectStatusValue | "all")}
                            >
                                <SelectTrigger className="w-[180px] h-9 border-input bg-background">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    <th>PROJECT TYPE</th>
                                    {isVendor ? (
                                        <>
                                            <th>BID START DATE</th>
                                            <th>BID END DATE</th>
                                            <th>YOUR BID AMOUNT</th>
                                        </>
                                    ) : (
                                        <>
                                            <th>START DATE</th>
                                            <th>END DATE</th>
                                            <th>BUDGET</th>
                                        </>
                                    )}
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectsLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={`skeleton-${i}`}>
                                            <td><Skeleton className={styles.skeletonCellName} /></td>
                                            <td><Skeleton className={styles.skeletonCell} /></td>
                                            <td><Skeleton className={styles.skeletonCell} /></td>
                                            <td><Skeleton className={styles.skeletonCell} /></td>
                                            <td><Skeleton className={styles.skeletonCell} /></td>
                                            <td><Skeleton className={styles.skeletonCellPill} /></td>
                                            <td><Skeleton className={styles.skeletonCellActions} /></td>
                                        </tr>
                                    ))
                                ) : (
                                paginatedProjects.map((project) => (
                                    <tr key={project.id}>
                                        <td>
                                            <Link to={`/project/${project.id}`}>
                                                <strong>{project.P_Name}</strong>
                                            </Link>
                                            <span className={styles.idHint}> (ID: {project.id})</span>
                                        </td>
                                        <td>{project.P_Type || "-"}</td>
                                        {isVendor ? (
                                            <>
                                                <td>
                                                    {project.P_BidStartDate
                                                        ? new Date(project.P_BidStartDate).toLocaleDateString()
                                                        : "-"}
                                                </td>
                                                <td>
                                                    {project.P_BidEndDate
                                                        ? new Date(project.P_BidEndDate).toLocaleDateString()
                                                        : "-"}
                                                </td>
                                                <td>
                                                    {(() => {
                                                        const amount = projectVendorBidAmountMap[String(project.id)];
                                                        return amount != null && amount !== "" ? `$${amount}` : "-";
                                                    })()}
                                                </td>
                                            </>
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                        <td>
                                            <span
                                                className={`${styles.statusPill} ${styles[`status${getStatusPillClass(getProjectStatus(project))}`]}`}
                                            >
                                                {getProjectStatus(project)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actionsCell}>
                                                <button
                                                    type="button"
                                                    className={styles.actionBtn}
                                                    onClick={() => handleOpenView(project)}
                                                    title="View"
                                                    aria-label={`View ${project.P_Name || "project"}`}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.actionBtn}
                                                    onClick={() => handleOpenAiSummarize(project)}
                                                    title="AI Suggested Vendor"
                                                >
                                                    <Sparkles size={16} className="text-emerald-500" />
                                                </button>
                                                {isVendor ? (
                                                    !projectHasVendorSubmission[String(project.id)] && (
                                                        <button
                                                            type="button"
                                                            className={styles.actionBtn}
                                                            onClick={() => handleOpenVendorSubmission(project)}
                                                            title="Submit (create company folder and upload documents)"
                                                        >
                                                            <EditRegular />
                                                        </button>
                                                    )
                                                ) : (
                                                    <>
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
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <ProjectFormDialog
                        open={formOpen}
                        onOpenChange={setFormOpen}
                        project={editingProject}
                        mode={dialogMode}
                        isVendor={isVendor}
                        onSave={handleSaveProject}
                        saving={savingProject}
                        onLoadExistingAttachments={loadExistingAttachments}
                    />

                    {isVendor && vendorSubmissionProject && (
                        <VendorSubmissionDialog
                            open={vendorSubmissionOpen}
                            onOpenChange={(open) => {
                                setVendorSubmissionOpen(open);
                                if (!open) setVendorSubmissionProject(null);
                            }}
                            project={vendorSubmissionProject}
                            vendorCompanyName={vendorCompanyName ?? vendorUser?.username ?? ""}
                            onSave={handleVendorSubmissionSave}
                        />
                    )}
                    <AiSummarize
                        isOpen={aiSummarizeOpen}
                        onClose={() => {
                            setAiSummarizeOpen(false);
                            setAiSummarizeProject(null);
                        }}
                        project={aiSummarizeProject}
                    />

                    <UiDialog open={aiCreateOpen} onOpenChange={setAiCreateOpen}>
                        <UiDialogContent className="sm:max-w-[700px] p-0 bg-transparent border-0 shadow-none">
                            <AiProjectCreationForm
                                onGenerated={(project) => {
                                    setAiCreateOpen(false);
                                    setDialogMode("create");
                                    setEditingProject(project);
                                    setFormOpen(true);
                                }}
                            />
                        </UiDialogContent>
                    </UiDialog>

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
            <ChatBot onCreateProjectClick={() => setAiCreateOpen(true)} />
        </div>
    );
};

export default Directory;
