import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Repository.module.scss";
import { AddRegular, ArrowLeftRegular, FolderAddRegular } from "@fluentui/react-icons";
import { LogOut, Download, Trash2, Eye, Share2, Globe2, Building2, Users2, Edit2 } from "lucide-react";
import { useProjects } from "@/context/ProjectsContext";
import { useAuth } from "@/context/AuthContext";
import { getAccessTokenByApp } from "@/hooks/useClientCredentialsAuth";
import { appConfig } from "@/config/appConfig";
import { sharePointService, type FileItem } from "@/services/sharePointService";
import type { Project } from "./projectsData";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const FolderIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2 5a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293L10 5.414 8.293 3.707A1 1 0 0 0 7.586 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-5.586a1 1 0 0 1-.707-.293L9.586 3.293A1 1 0 0 0 8.586 3H4z"
      fill="currentColor"
    />
  </svg>
);

const DocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5zm0 2h4.586L15 8.414V16H5V4z"
      fill="#60a5fa"
    />
  </svg>
);

function getFileIcon(name: string) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (["pdf"].includes(ext)) return <path d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5z" fill="#ef4444" />;
  if (["xlsx", "xls"].includes(ext)) return <path d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5z" fill="#22c55e" />;
  return <path d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5z" fill="#60a5fa" />;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

type NavItem = { id: string; name: string };

const Repository: React.FC = () => {
  const { projects, refetch } = useProjects();
  const { loginType, vendorUser, logout } = useAuth();
  const navigate = useNavigate();
  const [navStack, setNavStack] = useState<NavItem[]>([]);
  const [folderItems, setFolderItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [itemCreatedByMap, setItemCreatedByMap] = useState<Record<string, string>>({});
  const [currentFolderCreatedBy, setCurrentFolderCreatedBy] = useState<string | null>(null);
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const [vendorCompanyName, setVendorCompanyName] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [sharingItem, setSharingItem] = useState<FileItem | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareScope, setShareScope] = useState<"anonymous" | "organization" | "users">("organization");
  const [shareRole, setShareRole] = useState<"read" | "write">("read");
  const [shareEmails, setShareEmails] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareNotify, setShareNotify] = useState(true);
  const [shareRetain, setShareRetain] = useState(true);
  const [shareLinkResult, setShareLinkResult] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (loginType !== "vendor" || !vendorUser?.username) {
      setVendorCompanyName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const company = await sharePointService.getVendorCompanyFromUserDetails(vendorUser.username);
      if (!cancelled) setVendorCompanyName(company ?? vendorUser.username);
    })();
    return () => { cancelled = true; };
  }, [loginType, vendorUser?.username]);

  const loadFolderContents = useCallback(async (folderId: string) => {
    const token = await getAccessTokenByApp();
    if (!token) {
      setFolderItems([]);
      return;
    }
    setLoading(true);
    try {
      const items = await sharePointService.listFiles(
        token,
        appConfig.ContainerID,
        folderId
      );
      setFolderItems(items || []);
    } catch (err) {
      console.error("Repository: load folder contents failed", err);
      setFolderItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navStack.length === 0) {
      setFolderItems([]);
      return;
    }
    const current = navStack[navStack.length - 1];
    loadFolderContents(current.id);
  }, [navStack, loadFolderContents]);

  const handleNavigateTo = (index: number) => {
    if (index < 0) {
      setNavStack([]);
      return;
    }
    setNavStack((prev) => prev.slice(0, index + 1));
  };

  const handleProjectClick = (project: Project) => {
    if (project.id == null) return;
    setNavStack([{ id: String(project.id), name: project.P_Name || "Project" }]);
  };

  const handleFolderItemClick = (item: FileItem) => {
    if (!item.folder) return;
    setNavStack((prev) => [...prev, { id: item.id, name: item.name }]);
  };

  const currentFolderId = navStack.length > 0 ? navStack[navStack.length - 1].id : null;

  const refreshCurrentFolder = useCallback(() => {
    if (currentFolderId) loadFolderContents(currentFolderId);
  }, [currentFolderId, loadFolderContents]);

  /**
   * Repository permissions (simplified plan):
   * - First level (project): Create folder = 365 only. Upload = neither.
   * - 365: Folder creation at 1st level only. View all. Upload in Project subfolder (and 365-owned e.g. Invoices).
   * - Vendor: No create folder anywhere. At first level see only Project + Vendor; inside Vendor see only their company subfolder; upload in their company subfolder (via Directory submission flow).
   */
  const isInsideSubfolder = navStack.length >= 2;
  const currentFolderName = navStack.length > 0 ? navStack[navStack.length - 1].name : "";
  const parentFolderName = navStack.length >= 2 ? navStack[navStack.length - 2].name : "";
  const isVendor = loginType === "vendor";
  const isProjectLevel = navStack.length === 1;
  const isInsideProjectSubfolder = currentFolderName.trim().toLowerCase() === "project";
  const isInsideVendorFolder = (currentFolderName || "").trim() === "Vendor";
  const vendorCompanyFolderName = (vendorCompanyName ?? vendorUser?.username ?? "").trim();
  const isInsideVendorOwnSubfolder =
    isVendor &&
    navStack.length >= 2 &&
    parentFolderName === "Vendor" &&
    (currentFolderName || "").trim() === vendorCompanyFolderName;

  const M365_OWNED_SUBFOLDER_NAMES = ["Invoices"];
  const isInsideM365OwnedFolder = M365_OWNED_SUBFOLDER_NAMES.some(
    (n) => n.toLowerCase() === (currentFolderName || "").trim().toLowerCase(),
  );

  const showNewFolderOption = isProjectLevel && !isVendor;
  const showUploadOption =
    isInsideSubfolder &&
    !isVendor &&
    (isInsideProjectSubfolder || isInsideM365OwnedFolder);

  useEffect(() => {
    if (!isVendor || !isInsideVendorFolder || !folderItems.length) {
      setItemCreatedByMap({});
      return;
    }
    setItemCreatedByMap({});
  }, [isVendor, isInsideVendorFolder, folderItems]);

  useEffect(() => {
    if (
      !isVendor ||
      navStack.length < 2 ||
      parentFolderName !== "Vendor" ||
      !currentFolderId
    ) {
      setCurrentFolderCreatedBy(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await getAccessTokenByApp();
      if (!token || cancelled) return;
      const createdBy = await sharePointService.getListItemCreatedBy(
        token,
        appConfig.ContainerID,
        currentFolderId
      );
      if (!cancelled) setCurrentFolderCreatedBy(createdBy ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [isVendor, navStack.length, parentFolderName, currentFolderId]);

  const handleCreateFolderSubmit = async () => {
    const name = (newFolderName || "").trim();
    if (!name || !currentFolderId) return;
    const token = await getAccessTokenByApp();
    if (!token) {
      toast({ title: "Error", description: "Could not get access token.", variant: "destructive" });
      return;
    }
    setCreatingFolder(true);
    try {
      const folderId = await sharePointService.createFolder(
        token,
        appConfig.ContainerID,
        currentFolderId,
        name
      );
      if (isVendor && vendorUser?.username && folderId) {
        await sharePointService.patchListItemCreatedBy(
          token,
          appConfig.ContainerID,
          folderId,
          vendorUser.username
        );
      }
      toast({ title: "Folder created", description: `"${name}" was created.` });
      setCreateFolderOpen(false);
      setNewFolderName("");
      refreshCurrentFolder();
    } catch (err) {
      console.error("Create folder failed:", err);
      toast({
        title: "Create folder failed",
        description: err instanceof Error ? err.message : "Could not create folder.",
        variant: "destructive",
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUploadClick = () => {
    setSelectedFiles([]);
    setUploadDialogOpen(true);
  };

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownloadFile = async (item: FileItem) => {
    if (item.folder) return;
    const token = await getAccessTokenByApp();
    if (!token) {
      toast({ title: "Error", description: "Could not get access token.", variant: "destructive" });
      return;
    }
    setActionItemId(item.id);
    try {
      const buffer = await sharePointService.getFileBuffer(
        token,
        appConfig.ContainerID,
        item.id
      );
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name || "download";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: `"${item.name}" is downloading.` });
    } catch (err) {
      console.error("Download failed:", err);
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Could not download file.",
        variant: "destructive",
      });
    } finally {
      setActionItemId(null);
    }
  };

  const handleDeleteFile = async (item: FileItem) => {
    if (item.folder) return;
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const token = await getAccessTokenByApp();
    if (!token) {
      toast({ title: "Error", description: "Could not get access token.", variant: "destructive" });
      return;
    }
    setActionItemId(item.id);
    try {
      await sharePointService.deleteFile(token, appConfig.ContainerID, item.id);
      toast({ title: "File deleted", description: `"${item.name}" was removed.` });
      refreshCurrentFolder();
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete file.",
        variant: "destructive",
      });
    } finally {
      setActionItemId(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFiles.length || !currentFolderId) return;
    const token = await getAccessTokenByApp();
    if (!token) {
      toast({ title: "Error", description: "Could not get access token.", variant: "destructive" });
      return;
    }
    setUploading(true);
    let uploaded = 0;
    let failed = 0;
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        try {
          await sharePointService.uploadFile(
            token,
            appConfig.ContainerID,
            currentFolderId,
            selectedFiles[i],
            () => { }
          );
          uploaded++;
        } catch {
          failed++;
        }
      }
      if (uploaded > 0) {
        toast({ title: "Upload complete", description: `${uploaded} file(s) uploaded.` });
        refreshCurrentFolder();
      }
      if (failed > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failed} file(s) could not be uploaded.`,
          variant: "destructive",
        });
      }
      setUploadDialogOpen(false);
      setSelectedFiles([]);
    } finally {
      setUploading(false);
    }
  };

  const handleViewFile = async (item: FileItem) => {
    const token = await getAccessTokenByApp();
    if (!token) return;
    setActionItemId(item.id);
    setPreviewItem(item);
    try {
      const url = await sharePointService.getFilePreview(token, appConfig.ContainerID, item.id);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Preview failed:", err);
      toast({ 
        title: "Preview failed", 
        description: "Could not load file preview.", 
        variant: "destructive" 
      });
    } finally {
      setActionItemId(null);
    }
  };

  const handleOpenShare = (item: FileItem) => {
    setSharingItem(item);
    setShareScope("organization");
    setShareRole("read");
    setShareEmails("");
    setShareMessage("");
    setShareNotify(true);
    setShareRetain(true);
    setShareLinkResult(null);
    setIsShareOpen(true);
  };

  const handleShareSubmitAdvanced = async () => {
    if (!sharingItem) return;
    if (shareScope === "users" && !shareEmails.trim()) {
       toast({ title: "Email required", description: "Please enter at least one email address for Specific people.", variant: "destructive" });
       return;
    }
    const token = await getAccessTokenByApp();
    if (!token) return;
    setSharing(true);
    try {
      const recipients = shareEmails.split(",").map(e => e.trim()).filter(e => e);
      const result = await sharePointService.createAdvancedSharingLink(
        token,
        appConfig.ContainerID,
        sharingItem.id,
        {
          scope: shareScope,
          role: shareRole,
          recipients: shareScope === "users" ? recipients : undefined,
          message: shareMessage,
          sendInvitation: shareNotify,
          retainInheritedPermissions: shareRetain,
        }
      );
      setShareLinkResult(result);
      if (shareScope === "users") {
          toast({ title: "Shared successfully", description: "Invitation sent." });
      } else {
          toast({ title: "Link created", description: "Share link is ready to copy." });
      }
    } catch (err) {
      console.error("Sharing failed:", err);
      toast({ title: "Sharing failed", description: "Could not share the file or generate link.", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  const isRoot = navStack.length === 0;
  const PROJECT_SUBFOLDER_NAME = "Project";
  const VENDOR_FOLDER_NAME = "Vendor";

  const itemsToShow = isRoot
    ? []
    : (() => {
      let list = [...folderItems];
      if (isProjectLevel && isVendor) {
        list = list.filter(
          (item) =>
            item.name === PROJECT_SUBFOLDER_NAME ||
            item.name === VENDOR_FOLDER_NAME,
        );
      } else if (isVendor && isInsideVendorFolder && vendorCompanyFolderName) {
        list = list.filter(
          (item) =>
            item.folder && (item.name || "").trim() === vendorCompanyFolderName
        );
      }
      return list.sort((a, b) => {
        const aFolder = a.folder ? 1 : 0;
        const bFolder = b.folder ? 1 : 0;
        if (bFolder !== aFolder) return aFolder - bFolder;
        return (a.name || "").localeCompare(b.name || "");
      });
    })();

  return (
    <div className={styles.page}>
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <span className={styles.logo}>Repository</span>
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
              <span className={styles.overline}>ENCRYPTED STORAGE</span>
              <h1 className={styles.pageTitle}>Asset Repository</h1>
            </div>
            {!isRoot && (
              <div className={styles.headerActions}>
                {showNewFolderOption && (
                  <button
                    className={styles.newFolderBtn}
                    type="button"
                    onClick={() => setCreateFolderOpen(true)}
                    disabled={creatingFolder}
                  >
                    <FolderAddRegular />
                    NEW FOLDER
                  </button>
                )}
                {showUploadOption && (
                  <button
                    className={styles.uploadBtn}
                    type="button"
                    onClick={handleUploadClick}
                    disabled={uploading}
                  >
                    <AddRegular />
                    UPLOAD
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <button
              type="button"
              className={styles.breadcrumbItem}
              onClick={() => handleNavigateTo(-1)}
            >
              <ArrowLeftRegular className={styles.breadcrumbBackIcon} />
              Asset Repository
            </button>
            {navStack.map((item, idx) => (
              <React.Fragment key={item.id}>
                <span className={styles.breadcrumbSep}>/</span>
                <button
                  type="button"
                  className={styles.breadcrumbItem}
                  onClick={() => handleNavigateTo(idx)}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className={styles.mainScroll}>
          <div className={styles.tableFullWidth}>
            <div className={styles.registryHeader}>
              <span className={styles.registryTitle}>STORAGE REGISTRY</span>
              <span className={styles.isolatedTag}>ISOLATED CONTAINER</span>
            </div>
            <div className={styles.assetList}>
              {isRoot ? (
                <table className={styles.assetTable}>
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>TYPE</th>
                      <th>MODIFIED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={styles.emptyCell}>
                          No projects in directory. Create projects from the Directory screen.
                        </td>
                      </tr>
                    ) : (
                      projects.map((project) => (
                        <tr
                          key={project.id}
                          className={styles.clickableRow}
                          onClick={() => handleProjectClick(project)}
                        >
                          <td>
                            <div className={styles.resourceCell}>
                              <span className={styles.iconFolder}>
                                <FolderIcon />
                              </span>
                              <span className={styles.assetName}>
                                {project.P_Name || project.id}
                              </span>
                            </div>
                          </td>
                          <td className={styles.modCell}>Folder</td>
                          <td className={styles.modCell}>
                            {project.P_StartDate
                              ? formatDate(project.P_StartDate)
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className={styles.assetTable}>
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>TYPE</th>
                      <th>SIZE</th>
                      <th>MODIFIED</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                          Loading…
                        </td>
                      </tr>
                    ) : itemsToShow.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                          This folder is empty.
                        </td>
                      </tr>
                    ) : (
                      itemsToShow.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            item.folder ? styles.clickableRow : undefined
                          }
                          onClick={() =>
                            item.folder && handleFolderItemClick(item)
                          }
                        >
                          <td>
                            <div className={styles.resourceCell}>
                              {item.folder ? (
                                <span className={styles.iconFolder}>
                                  <FolderIcon />
                                </span>
                              ) : (
                                <span className={styles.iconFile}>
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    {getFileIcon(item.name)}
                                  </svg>
                                </span>
                              )}
                              <div>
                                <span className={styles.assetName}>
                                  {item.name}
                                </span>
                                <span className={styles.assetMeta}>
                                  {item.folder
                                    ? "Folder"
                                    : item.file?.mimeType || "File"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.modCell}>
                            {item.folder ? "Folder" : "File"}
                          </td>
                          <td className={styles.modCell}>
                            {item.folder
                              ? "—"
                              : formatSize(item.size ?? 0)}
                          </td>
                          <td className={styles.modCell}>
                            {formatDate(item.lastModifiedDateTime || "")}
                          </td>
                          <td
                            className={styles.actionsCell}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!item.folder ? (
                              <div className={styles.fileActions}>
                                {!isVendor && (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.fileActionBtn}
                                      title="View"
                                      disabled={actionItemId === item.id}
                                      onClick={() => handleViewFile(item)}
                                    >
                                      <Eye size={16} />
                                      <span>View</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.fileActionBtn}
                                      title="Share"
                                      onClick={() => handleOpenShare(item)}
                                    >
                                      <Share2 size={16} />
                                      <span>Share</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  className={styles.fileActionBtn}
                                  title="Download"
                                  disabled={actionItemId === item.id}
                                  onClick={() => handleDownloadFile(item)}
                                >
                                  <Download size={16} />
                                  <span>Download</span>
                                </button>
                                {!isVendor && showUploadOption && (
                                  <button
                                    type="button"
                                    className={`${styles.fileActionBtn} ${styles.fileActionBtnDanger}`}
                                    title="Delete"
                                    disabled={actionItemId === item.id}
                                    onClick={() => handleDeleteFile(item)}
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className={styles.hiddenFileInput}
        onChange={handleFileInputChange}
      />

      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolderSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateFolderSubmit}
              disabled={!newFolderName.trim() || creatingFolder}
            >
              {creatingFolder ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { setUploadDialogOpen(open); if (!open) setSelectedFiles([]); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectFilesClick}
              disabled={uploading}
              className={styles.selectFilesBtn}
            >
              <AddRegular />
              Select files
            </Button>
            {selectedFiles.length > 0 ? (
              <div className={styles.uploadFileList}>
                <span className={styles.uploadFileListLabel}>
                  {selectedFiles.length} file(s) selected
                </span>
                <ScrollArea className={styles.uploadScrollArea}>
                  <ul className={styles.uploadFileItems}>
                    {selectedFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`} className={styles.uploadFileItem}>
                        <span className={styles.uploadFileName} title={file.name}>
                          {file.name}
                        </span>
                        <span className={styles.uploadFileSize}>
                          {formatSize(file.size)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={styles.uploadFileRemove}
                          onClick={() => removeSelectedFile(index)}
                          disabled={uploading}
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            ) : (
              <p className={styles.uploadEmptyHint}>No files selected. Click &quot;Select files&quot; to add files.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setUploadDialogOpen(false); setSelectedFiles([]); }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUploadSubmit}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? "Uploading…" : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => { setIsPreviewOpen(open); if (!open) { setPreviewUrl(null); setPreviewItem(null); } }}>
        <DialogContent className="sm:max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-0 border-none">
            <div className="bg-[#6B47E5] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Eye className="text-white" size={20} />
                </div>
                <div className="flex flex-col">
                  <DialogTitle className="text-lg font-semibold text-white">Document Preview</DialogTitle>
                  {previewItem && <span className="text-xs text-purple-100 opacity-90">{previewItem.name}</span>}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10" 
                onClick={() => setIsPreviewOpen(false)}
              >
                <LogOut size={18} className="rotate-90" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-white relative">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-none shadow-inner"
                title="Document Viewer"
                allow="autoplay; camera; microphone; fullscreen"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B47E5]"></div>
                  <span className="text-slate-500 font-medium">Preparing document...</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-[600px] gap-0 p-6">
          <DialogHeader className="mb-6 space-y-1">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Share2 size={24} className="text-[#6B47E5]" strokeWidth={2} /> Share
            </DialogTitle>
            {sharingItem && (
               <div className="text-sm text-muted-foreground ml-[28px] truncate">
                 {sharingItem.name}
               </div>
            )}
          </DialogHeader>
          
          <div className="flex flex-col gap-6">
            {/* Scope Selection */}
            <div className="space-y-3">
               <Label className="text-[15px] font-semibold text-slate-900">Scope</Label>
               <div className="grid grid-cols-3 gap-4">
                  <button 
                    type="button"
                    onClick={() => { setShareScope("anonymous"); setShareLinkResult(null); }}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${shareScope === "anonymous" ? "border-[#6B47E5] bg-[#F4F0FF] text-[#6B47E5] shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"}`}
                  >
                     <Globe2 className="mb-2" size={24} strokeWidth={1.5} />
                     <span className="font-semibold text-[13px] mb-0.5">Anyone</span>
                     <span className="text-[11px] opacity-70">Anyone with the link</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShareScope("organization"); setShareLinkResult(null); }}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${shareScope === "organization" ? "border-[#6B47E5] bg-[#F4F0FF] text-[#6B47E5] shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"}`}
                  >
                     <Building2 className="mb-2" size={24} strokeWidth={1.5} />
                     <span className="font-semibold text-[13px] mb-0.5">Organization</span>
                     <span className="text-[11px] opacity-70">People in your org</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShareScope("users"); setShareLinkResult(null); }}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${shareScope === "users" ? "border-[#6B47E5] bg-[#F4F0FF] text-[#6B47E5] shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"}`}
                  >
                     <Users2 className="mb-2" size={24} strokeWidth={1.5} />
                     <span className="font-semibold text-[13px] mb-0.5">Specific people</span>
                     <span className="text-[11px] opacity-70">Only recipients</span>
                  </button>
               </div>
            </div>

            {/* Permission Selection */}
            <div className="space-y-3">
               <Label className="text-[15px] font-semibold text-slate-900">Permission</Label>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => { setShareRole("read"); setShareLinkResult(null); }}
                    className={`flex items-center px-4 py-3 border rounded-xl transition-all ${shareRole === "read" ? "border-[#6B47E5] bg-[#F4F0FF] text-[#6B47E5] shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"}`}
                  >
                     <Eye className="mr-3" size={20} strokeWidth={1.5} />
                     <div className="flex flex-col text-left">
                       <span className="font-semibold text-[13px]">View</span>
                       <span className="text-[11px] opacity-70">Can view only</span>
                     </div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShareRole("write"); setShareLinkResult(null); }}
                    className={`flex items-center px-4 py-3 border rounded-xl transition-all ${shareRole === "write" ? "border-[#6B47E5] bg-[#F4F0FF] text-[#6B47E5] shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"}`}
                  >
                     <Edit2 className="mr-3" size={20} strokeWidth={1.5} />
                     <div className="flex flex-col text-left">
                       <span className="font-semibold text-[13px]">Edit</span>
                       <span className="text-[11px] opacity-70">Can view & edit</span>
                     </div>
                  </button>
               </div>
            </div>

            {/* Users Input (only for Specific people) */}
            {shareScope === "users" && (
                <div className="space-y-3">
                   <Label htmlFor="share-emails" className="text-[15px] font-semibold text-slate-900">Recipients (comma separated)</Label>
                   <Input
                      id="share-emails"
                      type="text"
                      value={shareEmails}
                      onChange={(e) => setShareEmails(e.target.value)}
                      placeholder="Add people via email..."
                      className="rounded-lg border-slate-200"
                   />
                </div>
            )}

            {/* Toggles removed per user request */}

            {/* Result Area */}
            {shareLinkResult && shareScope !== "users" && (
               <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-2">
                 <Label className="text-[13px] text-green-800 font-semibold mb-2 block">Link Generated Successfully:</Label>
                 <div className="flex items-center gap-2">
                    <Input readOnly value={shareLinkResult} className="h-9 text-xs bg-white border-green-200 focus-visible:ring-green-500" />
                    <Button size="sm" variant="outline" className="h-9 px-4 border-green-200 text-green-700 hover:bg-green-100" onClick={() => { navigator.clipboard.writeText(shareLinkResult); toast({title:"Copied", description:"Link copied to clipboard."}) }}>Copy</Button>
                 </div>
               </div>
            )}
          </div>

          <DialogFooter className="mt-8 flex justify-end gap-3 sm:justify-end">
             <Button 
               variant="outline" 
               className="rounded-lg px-6 font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200" 
               onClick={() => setIsShareOpen(false)}
             >
               Cancel
             </Button>
             <Button 
               onClick={handleShareSubmitAdvanced} 
               disabled={sharing || (shareScope === "users" && !shareEmails.trim())}
               className="bg-[#6B47E5] hover:bg-[#5A3DD4] text-white rounded-lg px-6 font-medium border border-transparent shadow-sm"
             >
               {sharing ? "Processing..." : shareScope === "users" ? "Send" : "Create Link"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Repository;
