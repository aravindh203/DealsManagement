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
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

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

/** Tab for 365: all, open (unsubmitted), assignVendor (unassigned with submissions), assigned (vendor assigned). */
export type DirectoryTab365 = "all" | "open" | "assignVendor" | "assigned";
/** Tab for vendor: open (not submitted), myRequest (submitted), myAssigned (assigned to this vendor). */
export type DirectoryTabVendor = "open" | "myRequest" | "myAssigned";

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
    const [directoryTab365, setDirectoryTab365] = useState<DirectoryTab365>("all");
    const [directoryTabVendor, setDirectoryTabVendor] = useState<DirectoryTabVendor>("open");
    const [formOpen, setFormOpen] = useState(false);
    const [aiCreateOpen, setAiCreateOpen] = useState(false);
    const [newProjectModeOpen, setNewProjectModeOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<ProjectDialogMode>("create");
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<
        string | number | null
    >(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [vendorCompanyName, setVendorCompanyName] = useState<string | null>(null);
    const [projectHasVendorSubmission, setProjectHasVendorSubmission] = useState<Record<string, boolean>>({});
    const [projectVendorBidAmountMap, setProjectVendorBidAmountMap] = useState<Record<string, string | null>>({});
    const [projectHasAnyVendorSubmission, setProjectHasAnyVendorSubmission] = useState<Record<string, boolean>>({});
    const [vendorSubmissionOpen, setVendorSubmissionOpen] = useState(false);
    const [vendorSubmissionProject, setVendorSubmissionProject] = useState<Project | null>(null);
    const [aiSummarizeOpen, setAiSummarizeOpen] = useState(false);
    const [aiSummarizeProject, setAiSummarizeProject] = useState<string | null>("");
    const [projectFormError, setProjectFormError] = useState<string | null>(null);

    const totalProjects = projects.length;

    const openProjectsCount = useMemo(
        () => projects.filter((p) => getProjectStatus(p) === "Open").length,
        [projects],
    );

    const thisMonthProjectsCount = useMemo(
        () => projects.filter((p) => isInCurrentMonth(p.P_StartDate)).length,
        [projects],
    );

    /** Project is "assigned" when V_BidDescription (finalized vendor) is set. */
    const isProjectAssigned = useCallback((project: Project) => {
        const assigned = (project.V_BidDescription ?? "").toString().trim();
        return assigned !== "";
    }, []);

    /** True when this project is assigned to the logged-in vendor (V_BidDescription matches vendor company). */
    const isProjectAssignedToCurrentVendor = useCallback(
        (project: Project) => {
            if (!vendorCompanyName) return false;
            const assigned = (project.V_BidDescription ?? "").toString().trim().toLowerCase();
            const company = vendorCompanyName.trim().toLowerCase();
            return assigned !== "" && assigned === company;
        },
        [vendorCompanyName],
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
        if (isVendor) {
            const tab = directoryTabVendor;
            if (tab === "open") {
                list = list.filter((p) => getProjectStatus(p) === "Open" && !projectHasVendorSubmission[String(p.id)]);
            } else if (tab === "myRequest") {
                list = list.filter(
                    (p) => getProjectStatus(p) === "Open" && projectHasVendorSubmission[String(p.id)],
                );
            } else {
                list = list.filter((p) => isProjectAssignedToCurrentVendor(p));
            }
        } else {
            const tab = directoryTab365;
            if (tab === "all") {
                // no extra filter; show all projects
            } else if (tab === "open") {
                list = list.filter(
                    (p) => getProjectStatus(p) === "Open" && !projectHasAnyVendorSubmission[String(p.id)],
                );
            } else if (tab === "assignVendor") {
                list = list.filter(
                    (p) =>
                        getProjectStatus(p) === "Open" &&
                        projectHasAnyVendorSubmission[String(p.id)] &&
                        !isProjectAssigned(p),
                );
            } else {
                list = list.filter((p) => isProjectAssigned(p));
            }
        }
        return list;
    }, [
        projects,
        searchProjects,
        isVendor,
        directoryTab365,
        directoryTabVendor,
        projectHasVendorSubmission,
        projectHasAnyVendorSubmission,
        isProjectAssigned,
        isProjectAssignedToCurrentVendor,
    ]);

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
    }, [searchProjects, isVendor ? directoryTabVendor : directoryTab365]);

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

    useEffect(() => {
        if (isVendor || !projects.length) {
            setProjectHasAnyVendorSubmission({});
            return;
        }
        let cancelled = false;
        (async () => {
            const token = await getAccessTokenByApp();
            if (!token || cancelled) return;
            const containerId = appConfig.ContainerID;
            const map: Record<string, boolean> = {};
            for (const project of projects) {
                if (cancelled) break;
                const pid = String(project.id);
                try {
                    map[pid] = await sharePointService.hasAnyVendorSubmission(
                        token,
                        containerId,
                        pid,
                    );
                } catch {
                    map[pid] = false;
                }
            }
            if (!cancelled) setProjectHasAnyVendorSubmission(map);
        })();
        return () => { cancelled = true; };
    }, [isVendor, projects]);

    const handleRefresh = () => {
        setSearchProjects("");
        setCurrentPage(1);
        reloadProjects();
    };

    const handleOpenCreate = () => {
        setEditingProject(null);
        setDialogMode("create");
        setProjectFormError(null);
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
        setProjectFormError(null);
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
        let shouldClose = false;
        try {
            setProjectFormError(null);
            const trimmedName = data.P_Name?.trim().toLowerCase() || "";
            if (!trimmedName) {
                setProjectFormError("Please fill all required fields: Project name. Attachments are optional.");
                return;
            }

            const hasDuplicate = projects.some((p) => {
                if (!p.P_Name) return false;
                const sameName = p.P_Name.trim().toLowerCase() === trimmedName;
                if (!editingProject) {
                    return sameName;
                }
                return sameName && String(p.id) !== String(editingProject.id);
            });

            if (hasDuplicate) {
                setProjectFormError("A project with this name already exists. Please choose a different project name.");
                return;
            }

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
            shouldClose = true;

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
            if (shouldClose) {
                setFormOpen(false);
                setEditingProject(null);
                setProjectFormError(null);
            }
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
                projectId,
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
                            <button
                                className={styles.registerBtn}
                                type="button"
                                onClick={() => setNewProjectModeOpen(true)}
                            >
                                <AddRegular />
                                NEW PROJECT
                            </button>
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
                        <div className={styles.tabsRow}>
                            {isVendor ? (
                                <>
                                    <button
                                        type="button"
                                        className={directoryTabVendor === "open" ? styles.tabActive : styles.tab}
                                        onClick={() => setDirectoryTabVendor("open")}
                                    >
                                        Open
                                    </button>
                                    <button
                                        type="button"
                                        className={directoryTabVendor === "myRequest" ? styles.tabActive : styles.tab}
                                        onClick={() => setDirectoryTabVendor("myRequest")}
                                    >
                                        My Submitted
                                    </button>
                                    <button
                                        type="button"
                                        className={directoryTabVendor === "myAssigned" ? styles.tabActive : styles.tab}
                                        onClick={() => setDirectoryTabVendor("myAssigned")}
                                    >
                                        My Assigned
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className={directoryTab365 === "all" ? styles.tabActive : styles.tab}
                                        onClick={() => setDirectoryTab365("all")}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        className={directoryTab365 === "assigned" ? styles.tabActive : styles.tab}
                                        onClick={() => setDirectoryTab365("assigned")}
                                    >
                                        Assigned
                                    </button>
                                    <button
                                        type="button"
                                        className={directoryTab365 === "assignVendor" ? styles.tabActive : styles.tab}
                                        onClick={() => setDirectoryTab365("assignVendor")}
                                    >
                                        Un Assigned
                                    </button>
                                    <button
                                        type="button"
                                        className={directoryTab365 === "open" ? styles.tabActive : styles.tab}
                                        onClick={() => setDirectoryTab365("open")}
                                    >
                                        Un Submitted
                                    </button>
                                </>
                            )}
                        </div>
                        <div className={styles.filterGroup}>
                            <div className={styles.searchCustomers}>
                                <SearchRegular className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchProjects}
                                    onChange={(e) => setSearchProjects(e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                className={styles.refreshBtn}
                                onClick={handleRefresh}
                                title="Refresh"
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
                                            {directoryTab365 === "assigned" && <th>VENDOR</th>}
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
                                                    {directoryTab365 === "assigned" && (
                                                        <td>{project.V_BidDescription || "-"}</td>
                                                    )}
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
                                                    {!isVendor && directoryTab365 === "assignVendor" && (
                                                        <button
                                                            type="button"
                                                            className={styles.actionBtn}
                                                            onClick={() => handleOpenAiSummarize(project)}
                                                            title="AI Suggested Vendor"
                                                        >
                                                            <Sparkles size={16} className="text-emerald-500" />
                                                        </button>
                                                    )}
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
                                                            {!((directoryTab365 === "assigned" || directoryTab365 === "all") && getProjectStatus(project) === "Completed") && (
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
                        showStatusField={!isVendor && directoryTab365 === "assigned"}
                        onSave={handleSaveProject}
                        saving={savingProject}
                        onLoadExistingAttachments={loadExistingAttachments}
                        externalError={projectFormError}
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

                    {!isVendor && (
                        <UiDialog open={newProjectModeOpen} onOpenChange={setNewProjectModeOpen}>
                            <UiDialogContent className="sm:max-w-[680px] border-0 shadow-2xl p-0 bg-transparent">
                                <div className="rounded-3xl bg-white shadow-xl overflow-hidden">
                                    <div className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-[#F4F3FF] via-white to-[#F4F3FF] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-[#5a3dd4]/10 flex items-center justify-center text-[#5a3dd4]">
                                                <AddRegular />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-semibold text-slate-900">
                                                    How would you like to create this project?
                                                </h2>
                                                <p className="text-xs text-slate-500">
                                                    Choose a creation mode that best fits your workflow.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-5 bg-[#F8FAFC]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewProjectModeOpen(false);
                                                    handleOpenCreate();
                                                }}
                                                className="group text-left rounded-2xl border border-slate-200 bg-white px-4 py-4 flex flex-col gap-3 hover:border-[#5a3dd4] hover:shadow-[0_10px_30px_rgba(90,61,212,0.18)] transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#5a3dd4] group-hover:text-white transition-colors">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            Start from scratch
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            Manually configure all project details and timelines.
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-400">
                                                    Best when you already know the full scope and requirements.
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewProjectModeOpen(false);
                                                    setAiCreateOpen(true);
                                                }}
                                                className="group text-left rounded-2xl border border-[#5a3dd4]/40 bg-gradient-to-br from-[#F4F3FF] via-white to-[#F4F3FF] px-4 py-4 flex flex-col gap-3 hover:border-[#5a3dd4] hover:shadow-[0_12px_35px_rgba(90,61,212,0.25)] transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-[#5a3dd4] flex items-center justify-center text-white shadow-md">
                                                        <Sparkles className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            Create with AI
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            Describe your idea and let AI draft the project for you.
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-[11px] font-medium text-[#4b3ac9]">
                                                    Ideal for quick setup, suggestions and discovering missing details.
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </UiDialogContent>
                        </UiDialog>
                    )}

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
            {!isVendor && (
                <ChatBot onCreateProjectClick={() => setAiCreateOpen(true)} />
            )}
        </div>
    );
};

export default Directory;
