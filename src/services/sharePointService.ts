import { log } from "console";
import { appConfig } from "../config/appConfig";
import { getAccessTokenByApp } from "../hooks/useClientCredentialsAuth";
import { Project } from "@/pages/projectsData";

export interface FileItem {
  createdDateTime: string;
  eTag: string;
  id: string;
  lastModifiedDateTime: string;
  name: string;
  size: number;
  webUrl: string;
  isFolder?: boolean;
  createdByName?: string;
  childCount?: number;
  createdBy?: {
    user: {
      displayName: string;
    };
  };
  lastModifiedBy?: {
    user: {
      displayName: string;
    };
  };
  file?: {
    mimeType: string;
    hashes: {
      quickXorHash: string;
      sha1Hash: string;
    };
  };
  folder?: {
    childCount: number;
  };
}

export class SharePointService {
  async getFiles(
    token: string,
    containerId: string,
    path: string = "root",
  ): Promise<FileItem[]> {
    try {
      let url: string;
      if (path === "root" || path === "") {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/root/children`;
      } else {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${path}/children`;
      }
      console.log("Fetching files from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching files:", errorText);
        throw new Error(
          `Failed to fetch files: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Files data:", data);

      return data.value || [];
    } catch (error) {
      console.error("Error getting files:", error);
      throw error;
    }
  }

  // Create item inside a fileStorage container
  async CreateItem(
    token: string,
    containerId: string,
    fields: any,
  ): Promise<any> {
    try {
      const url = `https://graph.microsoft.com/v1.0/storage/fileStorage/containers/${containerId}/items`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error creating item:", data);
        throw new Error(
          `Failed to create item: ${response.status} ${response.statusText}`,
        );
      }

      console.log("Item created successfully:", data);

      return data;
    } catch (error) {
      console.error("CreateItem error:", error);
      throw error;
    }
  }

  // --- Project metadata CRUD on fileStorage container items -----------------

  /** List all metadata items for a project container (expands fields). */
  async listProjectMetadata(
    token: string,
    containerId: string,
  ): Promise<any[]> {
    try {
      const url = `https://graph.microsoft.com/v1.0/storage/fileStorage/containers/${containerId}/items?$expand=fields`;

      console.log("Listing project metadata items:", { url, containerId });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error listing project metadata:", data);
        throw new Error(
          `Failed to list project metadata: ${response.status} ${response.statusText}`,
        );
      }

      return Array.isArray(data.value) ? data.value : [];
    } catch (error) {
      console.error("listProjectMetadata error:", error);
      throw error;
    }
  }

  /** Read a single metadata item (by itemId) for a project container. */
  async getProjectMetadata(
    token: string,
    containerId: string,
    itemId: string,
  ): Promise<any> {
    try {
      const url = `https://graph.microsoft.com/v1.0/storage/fileStorage/containers/${containerId}/items/${itemId}?$expand=fields`;

      console.log("Getting project metadata item:", {
        url,
        containerId,
        itemId,
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error getting project metadata:", data);
        throw new Error(
          `Failed to get project metadata: ${response.status} ${response.statusText}`,
        );
      }

      return data;
    } catch (error) {
      console.error("getProjectMetadata error:", error);
      throw error;
    }
  }

  /** Update metadata fields for a project container item. */
  async updateProjectMetadata(
    token: string,
    containerId: string,
    itemId: string,
    fields: any,
  ): Promise<any> {
    try {
      const url = `https://graph.microsoft.com/v1.0/storage/fileStorage/containers/${containerId}/items/${itemId}`;

      console.log("Updating project metadata item:", {
        url,
        containerId,
        itemId,
      });

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error updating project metadata:", data);
        throw new Error(
          `Failed to update project metadata: ${response.status} ${response.statusText}`,
        );
      }

      return data;
    } catch (error) {
      console.error("updateProjectMetadata error:", error);
      throw error;
    }
  }

  /** Delete a metadata item from a project container. */
  async deleteProjectMetadata(
    token: string,
    containerId: string,
    itemId: string,
  ): Promise<void> {
    try {
      const url = `https://graph.microsoft.com/v1.0/storage/fileStorage/containers/${containerId}/items/${itemId}`;

      console.log("Deleting project metadata item:", {
        url,
        containerId,
        itemId,
      });

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error("Error deleting project metadata:", errorText);
        throw new Error(
          `Failed to delete project metadata: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      console.error("deleteProjectMetadata error:", error);
      throw error;
    }
  }

  // Create custom column on a fileStorage container
  async CreateColumn(token: string, containerId: string): Promise<any> {
    try {
      const url = `https://graph.microsoft.com/beta/storage/fileStorage/containers/${containerId}/columns`;

      console.log("Creating column at:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: "V_CompanyBidAmount ",
          displayName: "V_CompanyBidAmount ",
          enforceUniqueValues: false,
          hidden: false,
          indexed: false,
          name: "V_CompanyBidAmount ",
          text: {
            allowMultipleLines: false,
            appendChangesToExistingText: false,
            linesForEditing: 0,
            maxLength: 255,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating column:", errorText);
        throw new Error(
          `Failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Column created:", data);

      return data;
    } catch (error) {
      console.error("Error creating column:", error);
      throw error;
    }
  }

  async listFiles(
    token: string,
    containerId: string,
    path: string = "root",
  ): Promise<FileItem[]> {
    try {
      let url: string;
      if (path === "root" || path === "") {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/root/children`;
      } else {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${path}/children`;
      }
      console.log("Fetching files from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching files:", errorText);
        throw new Error(
          `Failed to fetch files: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Files data:", data);

      // Transform the response to include the required properties
      const files = (data.value || []).map((item: any) => ({
        ...item,
        isFolder: !!item.folder,
        createdByName: item.createdBy?.user?.displayName || "Unknown",
        childCount: item.folder?.childCount || 0,
      }));

      return files;
    } catch (error) {
      console.error("Error getting files:", error);
      throw error;
    }
  }

  async getContainerDetails(
    token: string,
    containerId: string,
  ): Promise<{ webUrl: string; name: string }> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}`;
      console.log("Fetching container details:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching container details:", errorText);
        throw new Error(
          `Failed to get container details: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Container details data:", data);

      return {
        webUrl: data.webUrl || "",
        name: data.name || "Project Container",
      };
    } catch (error) {
      console.error("Error getting container details:", error);
      throw error;
    }
  }

  /** Max size (bytes) for simple PUT upload. Larger files use resumable upload. */
  private static readonly SIMPLE_UPLOAD_MAX_SIZE = 4 * 1024 * 1024; // 4 MB

  /**
   * Simple upload (single PUT) for small files. More reliable and faster than resumable for vendor submission docs.
   */
  private async uploadFileSimple(
    token: string,
    containerId: string,
    parentFolderId: string,
    file: File,
  ): Promise<void> {
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${parentFolderId}:/${encodeURIComponent(file.name)}:/content`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: file,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Simple upload failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }
  }

  async uploadFile(
    token: string,
    containerId: string,
    path: string,
    file: File,
    progressCallback: (progress: number) => void,
  ): Promise<void> {
    try {
      if (file.size <= SharePointService.SIMPLE_UPLOAD_MAX_SIZE) {
        await this.uploadFileSimple(token, containerId, path, file);
        progressCallback(100);
        return;
      }

      const uploadSession = await this.createUploadSession(
        token,
        containerId,
        path,
        file.name,
      );
      const chunkSize = 320 * 1024; // 320 KB
      let start = 0;
      let end = Math.min(chunkSize, file.size);

      while (start < file.size) {
        const chunk = file.slice(start, end);
        const contentRange = `bytes ${start}-${end - 1}/${file.size}`;

        const response = await fetch(uploadSession.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Length": `${end - start}`,
            "Content-Range": contentRange,
          },
          body: chunk,
        });

        const responseText = await response.text();
        if (response.status === 200 || response.status === 201) {
          progressCallback(100);
          return;
        }
        if (response.status !== 202) {
          throw new Error(
            `Upload chunk failed: ${response.status} ${response.statusText} - ${responseText}`,
          );
        }

        start = end;
        end = Math.min(start + chunkSize, file.size);
        progressCallback(
          Math.min(100, Math.round((start / file.size) * 100)),
        );
      }

      progressCallback(100);
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  }

  private async createUploadSession(
    token: string,
    containerId: string,
    path: string,
    fileName: string,
  ): Promise<{ uploadUrl: string }> {
    try {
      let url: string;
      if (path === "root" || path === "") {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/root:/${fileName}:/createUploadSession`;
      } else {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${path}:/${fileName}:/createUploadSession`;
      }
      console.log("Creating upload session:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: {
            "@odata.conflictBehavior": "replace",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating upload session:", errorText);
        throw new Error(
          `Failed to create upload session: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Upload session data:", data);

      return { uploadUrl: data.uploadUrl };
    } catch (error) {
      console.error("Error creating upload session:", error);
      throw error;
    }
  }

  async fetchRootFolders(token: string, containerId: string): Promise<any[]> {
    const url: string = `https://graph.microsoft.com/v1.0/drives/${containerId}/root/children`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      await Promise.all(
        (data?.value ?? [])?.sort(
          (a: any, b: any) =>
            new Date(b.createdDateTime).getTime() -
            new Date(a.createdDateTime).getTime(),
        ),
      );

      return data?.value ?? [];
    } catch (error) {
      console.error("Error creating item:", error);
      return [];
    }
  }

  async fetchSubFolders(
    token: string,
    containerId: string,
    folderName: string,
  ): Promise<any[]> {
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/root:/${folderName}:/children`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error fetching sub folder:", errorText);
        throw new Error(
          `Failed to fetch sub folder: ${res.status} ${res.statusText} - ${errorText}`,
        );
      }

      const data = await res.json();
      const preparedData: any[] = await Promise.all(
        (data?.value ?? [])?.map(async (item: any) => {
          return {
            subFolderId: item.id ?? "",
            subFolderName: item.name ?? "",
            subFolderPath: item.parentReference?.path ?? "",
          };
        }),
      );
      debugger;

      return preparedData ?? [];
    } catch (error) {
      console.error("Error fetching subfolders:", error);
      return [];
    }
  }

  async fetchCustomDatas(
    token: string,
    containerId: string,
    folderId: string,
  ): Promise<Project | null> {
    const graphBase = "https://graph.microsoft.com/beta/drives";

    try {
      const selectFields = [
        "id",
        "P_Name",
        "P_Description",
        "P_StartDate",
        "P_EndDate",
        "P_Type",
        "P_Status",
        "V_SubmittedByEmail",
        "V_BidSubmissionDate",
        "V_BidDescription",
        "V_BidAmount",
        "P_VendorSubmissionDueDate",
        "P_Budget",
        "P_BidStartDate",
        "P_BidEndDate",
        "P_Company",
        "P_CreatedUserEmail",
      ].join(",");
      const url = `${graphBase}/${containerId}/items/${folderId}/listitem/fields?$select=${selectFields}`;
      //const url = `${graphBase}/${containerId}/items/${folderId}/listitem/fields`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Data:", data);
      const obj: Project = {
        id: folderId,
        P_Name: data.P_Name || null,
        P_Description: data.P_Description || null,
        P_StartDate: data.P_StartDate || null,
        P_EndDate: data.P_EndDate || null,
        P_Type: data.P_Type || null,
        P_Status: data.P_Status || "Open",
        V_SubmittedByEmail: data.V_SubmittedByEmail || null,
        V_BidSubmissionDate: data.V_BidSubmissionDate || null,
        V_BidDescription: data.V_BidDescription || null,
        V_BidAmount: data.V_BidAmount || null,
        P_VendorSubmissionDueDate: data.P_VendorSubmissionDueDate || null,
        P_Budget: data.P_Budget || null,
        P_BidStartDate: data.P_BidStartDate || null,
        P_BidEndDate: data.P_BidEndDate || null,
        P_Company: data.P_Company ?? null,
        P_CreatedUserEmail: data.P_CreatedUserEmail || null,
      };

      return obj;
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  }

  /**
   * Returns P_CreatedUserEmail for a drive item (from list item fields). Returns null if not found or no list item.
   */
  async getListItemCreatedBy(
    token: string,
    containerId: string,
    itemId: string,
  ): Promise<string | null> {
    const graphBase = "https://graph.microsoft.com/beta/drives";
    const url = `${graphBase}/${containerId}/items/${itemId}/listitem/fields?$select=P_CreatedUserEmail`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const value = data.P_CreatedUserEmail;
      return value != null && value !== "" ? String(value).trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Sets P_CreatedUserEmail on a drive item's list item (e.g. when a vendor creates a folder).
   */
  async patchListItemCreatedBy(
    token: string,
    containerId: string,
    itemId: string,
    createdBy: string,
  ): Promise<void> {
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${itemId}/listitem/fields`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ P_CreatedUserEmail: createdBy || "" }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error patching P_CreatedUserEmail:", errorText);
      throw new Error(
        `Failed to set created by: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }
  }

  /** Name of the subfolder used for project attachments. */
  static readonly PROJECT_ATTACHMENTS_FOLDER_NAME = "Project";
  /** Name of the subfolder used for vendor files. */
  static readonly PROJECT_VENDOR_FOLDER_NAME = "Vendor";

  /** Subfolder names under a vendor company folder for submission documents. */
  static readonly VENDOR_SUBFOLDER_NAMES = [
    "Proposal Document",
    "Supporting Documents",
    "Cost Estimation",
    "Policy Documents",
    "Approval Documents",
  ] as const;

  /**
   * Get the Vendor folder id under a project folder. Returns null if not found.
   */
  async getVendorFolderId(
    token: string,
    containerId: string,
    projectFolderId: string,
  ): Promise<string | null> {
    const children = await this.listFiles(token, containerId, projectFolderId);
    const vendor = children.find(
      (item) =>
        item.folder &&
        item.name === SharePointService.PROJECT_VENDOR_FOLDER_NAME,
    );
    return vendor?.id ?? null;
  }

  /**
   * Get V_BidAmount from the company folder (under Vendor) for the given company name. Returns null if not found.
   */
  async getCompanyFolderBidAmount(
    token: string,
    containerId: string,
    projectFolderId: string,
    companyName: string,
  ): Promise<string | null> {
    const trimmed = (companyName ?? "").trim();
    if (!trimmed) return null;
    const vendorFolderId = await this.getVendorFolderId(
      token,
      containerId,
      projectFolderId,
    );
    if (!vendorFolderId) return null;
    const children = await this.listFiles(token, containerId, vendorFolderId);
    const companyFolder = children.find(
      (item) => item.folder && item.name.trim() === trimmed,
    );
    if (!companyFolder?.id) return null;
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${companyFolder.id}/listitem/fields?$select=V_BidAmount`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const val = data.V_BidAmount;
      return val != null && String(val).trim() !== ""
        ? String(val).trim()
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Returns true if the Vendor folder already contains a subfolder with the given company name.
   */
  async hasCompanyFolderUnderVendor(
    token: string,
    containerId: string,
    vendorFolderId: string,
    companyName: string,
  ): Promise<boolean> {
    const trimmed = (companyName ?? "").trim();
    if (!trimmed) return false;
    const children = await this.listFiles(token, containerId, vendorFolderId);
    return children.some((item) => item.folder && item.name.trim() === trimmed);
  }

  /**
   * Patch list item fields on a drive item (e.g. set V_BidAmount on company folder).
   */
  async patchListItemFields(
    token: string,
    containerId: string,
    itemId: string,
    fields: Record<string, string | number | null>,
  ): Promise<void> {
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${itemId}/listitem/fields`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error patching list item fields:", errorText);
      throw new Error(
        `Failed to set list item fields: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }
  }

  /**
   * Create company folder under Vendor, create 5 subfolders, upload files to each, set bid amount on company folder.
   * filesByCategory keys must match VENDOR_SUBFOLDER_NAMES order: proposalDocument, supportingDocuments, costEstimation, policyDocuments, approvalDocuments.
   */
  async createCompanySubmission(
    token: string,
    containerId: string,
    vendorFolderId: string,
    companyName: string,
    bidAmount: string,
    filesByCategory: {
      proposalDocument: File[];
      supportingDocuments: File[];
      costEstimation: File[];
      policyDocuments: File[];
      approvalDocuments: File[];
    },
  ): Promise<void> {
    const raw = (companyName ?? "").trim();
    if (!raw)
      throw new Error("Company name is required for vendor submission.");
    const name = raw.replace(/[/\\:*?"<>|]/g, "_");

    const companyFolderId = await this.createFolder(
      token,
      containerId,
      vendorFolderId,
      name,
    );

    const subfolderIds: string[] = [];
    for (const subName of SharePointService.VENDOR_SUBFOLDER_NAMES) {
      const id = await this.createFolder(
        token,
        containerId,
        companyFolderId,
        subName,
      );
      subfolderIds.push(id);
    }

    const noop = () => {};
    const categories: (keyof typeof filesByCategory)[] = [
      "proposalDocument",
      "supportingDocuments",
      "costEstimation",
      "policyDocuments",
      "approvalDocuments",
    ];
    for (let i = 0; i < categories.length; i++) {
      const files = filesByCategory[categories[i]] ?? [];
      const folderId = subfolderIds[i];
      for (const file of files) {
        await this.uploadFile(token, containerId, folderId, file, noop);
      }
    }

    try {
      await this.patchListItemFields(token, containerId, companyFolderId, {
        V_BidAmount: (bidAmount ?? "").trim() || "",
      });
    } catch (err) {
      console.warn(
        "Could not set V_BidAmount on company folder (column may not exist):",
        err,
      );
    }
  }

  async createCustomDatas(
    token: string,
    containerId: string,
    folderName: string,
    data: Project,
  ): Promise<{ folderId: string; attachmentsFolderId: string }> {
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/root:/${folderName}:`;

    try {
      const res: any = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          "@odata.conflictBehavior": "replace",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error creating folder:", errorText);
        throw new Error(
          `Failed to create folder: ${res.status} ${res.statusText} - ${errorText}`,
        );
      }

      const resData = await res.json();
      const folderId = resData.id ?? "";
      const addUrl = `https://graph.microsoft.com/beta/drives/${containerId}/items/${folderId}/listitem/fields`;

      const patchRes = await fetch(addUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          P_Name: data?.P_Name ?? "",
          P_Description: data?.P_Description ?? "",
          P_StartDate: data?.P_StartDate ?? null,
          P_EndDate: data?.P_EndDate ?? null,
          P_Type: data?.P_Type ?? "",
          P_Status: data?.P_Status ?? "Open",
          V_SubmittedByEmail: data?.V_SubmittedByEmail ?? "",
          V_BidSubmissionDate: data?.V_BidSubmissionDate ?? null,
          V_BidDescription: data?.V_BidDescription ?? "",
          V_BidAmount: data?.V_BidAmount ?? "",
          P_VendorSubmissionDueDate: data?.P_VendorSubmissionDueDate ?? null,
          P_Budget: data?.P_Budget ?? "",
          P_BidStartDate: data?.P_BidStartDate ?? null,
          P_BidEndDate: data?.P_BidEndDate ?? null,
          P_Company: data?.P_Company ?? "",
          P_CreatedUserEmail: data?.P_CreatedUserEmail ?? "",
        }),
      });

      if (!patchRes.ok) {
        const errorText = await patchRes.text();
        console.error("Error PATCH listItem fields:", errorText);
        throw new Error(
          `Failed to set folder metadata: ${patchRes.status} ${patchRes.statusText} - ${errorText}`,
        );
      }

      const attachmentsFolderId = await this.createProjectAttachmentsSubfolder(
        token,
        containerId,
        folderId,
      );
      await this.createProjectVendorSubfolder(token, containerId, folderId);

      return { folderId, attachmentsFolderId };
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  /**
   * Creates the "Attachments" subfolder inside a project folder. Returns the new folder id.
   */
  private async createProjectAttachmentsSubfolder(
    token: string,
    containerId: string,
    projectFolderId: string,
  ): Promise<string> {
    const name = SharePointService.PROJECT_ATTACHMENTS_FOLDER_NAME;
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${projectFolderId}:/${name}:`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        folder: {},
        "@odata.conflictBehavior": "replace",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error creating Attachments subfolder:", errorText);
      throw new Error(
        `Failed to create Attachments folder: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const data = await res.json();
    return data.id ?? "";
  }

  /**
   * Creates the "Vendor" subfolder inside a project folder. Returns the new folder id.
   */
  private async createProjectVendorSubfolder(
    token: string,
    containerId: string,
    projectFolderId: string,
  ): Promise<string> {
    const name = SharePointService.PROJECT_VENDOR_FOLDER_NAME;
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${projectFolderId}:/${name}:`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        folder: {},
        "@odata.conflictBehavior": "replace",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error creating Vendor subfolder:", errorText);
      throw new Error(
        `Failed to create Vendor folder: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const data = await res.json();
    return data.id ?? "";
  }

  /**
   * Returns the drive item id of the "Attachments" subfolder for a project. Creates the folder if it does not exist (e.g. for older projects).
   */
  async getOrCreateProjectAttachmentsFolderId(
    token: string,
    containerId: string,
    projectFolderId: string,
  ): Promise<string> {
    const name = SharePointService.PROJECT_ATTACHMENTS_FOLDER_NAME;
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${projectFolderId}/children`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error listing project children:", errorText);
      throw new Error(
        `Failed to list project folder: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const data = await res.json();
    const children = data.value ?? [];
    const existing = children.find(
      (item: any) => item.folder && item.name === name,
    );
    if (existing?.id) return existing.id;

    return this.createProjectAttachmentsSubfolder(
      token,
      containerId,
      projectFolderId,
    );
  }

  async updateCustomColumn(
    token: string,
    containerId: string,
    folderId: string,
    folderName: string,
    data: Project,
  ): Promise<void> {
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${folderId}`;

    try {
      const res: any = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error updating folder name:", errorText);
        throw new Error(
          `Failed to update folder name: ${res.status} ${res.statusText} - ${errorText}`,
        );
      }

      const updateUrl = `https://graph.microsoft.com/beta/drives/${containerId}/items/${folderId}/listitem/fields`;

      const itemRes: any = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          P_Name: data?.P_Name ?? "",
          P_Description: data?.P_Description ?? "",
          P_StartDate: data?.P_StartDate ?? null,
          P_EndDate: data?.P_EndDate ?? null,
          P_Type: data?.P_Type ?? "",
          P_Status: data?.P_Status ?? "Open",
          V_SubmittedByEmail: data?.V_SubmittedByEmail ?? "",
          V_BidSubmissionDate: data?.V_BidSubmissionDate ?? null,
          V_BidDescription: data?.V_BidDescription ?? "",
          V_BidAmount: data?.V_BidAmount ?? "",
          P_VendorSubmissionDueDate: data?.P_VendorSubmissionDueDate ?? null,
          P_Budget: data?.P_Budget ?? "",
          P_BidStartDate: data?.P_BidStartDate ?? null,
          P_BidEndDate: data?.P_BidEndDate ?? null,
          P_Company: data?.P_Company ?? "",
          P_CreatedUserEmail: data?.P_CreatedUserEmail ?? "",
        }),
      });

      if (!itemRes.ok) {
        const errorText = await itemRes.text();
        console.error("Error updating item:", errorText);
        throw new Error(
          `Failed to update item: ${itemRes.status} ${itemRes.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  async deleteFolderAndItem(
    token: string,
    containerId: string,
    folderId: string,
  ): Promise<void> {
    const deleteUrl = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${folderId}`;

    try {
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error deleting folder:", errorText);

        throw new Error(
          `Failed to delete folder: ${res.status} ${res.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  }

  async getColumns(token: string): Promise<ArrayBuffer> {
    try {
      debugger;
      // const url = `https://graph.microsoft.com/beta/storage/fileStorage/containers/b!q-fcBJA8zE6Af0BM2Nw6xtTONTR4hJ9CufdHAYe_x0y3nP3LqEnASJ6COdc9ZIcQ/columns`
      // const url = `https://graph.microsoft.com/beta/drives//b!q-fcBJA8zE6Af0BM2Nw6xtTONTR4hJ9CufdHAYe_x0y3nP3LqEnASJ6COdc9ZIcQ/root/children`
      // const url = `https://graph.microsoft.com/beta/drives/b!q-fcBJA8zE6Af0BM2Nw6xtTONTR4hJ9CufdHAYe_x0y3nP3LqEnASJ6COdc9ZIcQ/items/01R2P44ADQAX4IFHRZLND3XS4FTYQOZUS2/listitem/fields$expand=listitem($expand=fields)`
      const url = `https://graph.microsoft.com/beta/drives/b!q-fcBJA8zE6Af0BM2Nw6xtTONTR4hJ9CufdHAYe_x0y3nP3LqEnASJ6COdc9ZIcQ/items/01R2P44ADQAX4IFHRZLND3XS4FTYQOZUS2?$expand=listItem($expand=fields)`;
      console.log("Fetching file content:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching file content:", errorText);
        throw new Error(
          `Failed to fetch file content: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.arrayBuffer();
      console.log("File content fetched successfully");

      return data;
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw error;
    }
  }

  async createFolder(
    token: string,
    containerId: string,
    path: string,
    folderName: string,
  ): Promise<string> {
    let url: string = "";

    try {
      if (path === "root" || path === "") {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/root:/${folderName}:`;
      } else {
        url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${path}:/${folderName}:`;
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          "@odata.conflictBehavior": "replace",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Error creating folder:", errorText);
        throw new Error(
          `Failed to create folder: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
      const resData = await response.json();
      const folderId = resData.id ?? "";
      return folderId;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async deleteFile(
    token: string,
    containerId: string,
    itemId: string,
  ): Promise<void> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${itemId}`;
      console.log("Deleting file:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error("Error deleting file:", errorText);
        throw new Error(
          `Failed to delete file: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      console.log("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  async getFileBuffer(
    token: string,
    driveId: string,
    itemId: string,
  ): Promise<ArrayBuffer> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${driveId}/items/${itemId}/content`;
      console.log("Fetching file content:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching file content:", errorText);
        throw new Error(
          `Failed to fetch file content: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error getting file content:", error);
      throw error;
    }
  }

  async createOfficeFile(
    token: string,
    containerId: string,
    path: string,
    fileName: string,
    fileType: string,
  ): Promise<void> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${path}:/${fileName}.${fileType}:/content`;
      console.log("Creating Office file:", url);

      // Determine the content type based on the file type
      let contentType = "application/octet-stream"; // Default
      switch (fileType) {
        case "docx":
          contentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          break;
        case "xlsx":
          contentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          break;
        case "pptx":
          contentType =
            "application/vnd.openxmlformats-officedocument.presentationml.presentation";
          break;
        default:
          console.warn("Unknown file type, using default octet-stream");
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType,
        },
        body: new ArrayBuffer(0), // Create an empty file
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating Office file:", errorText);
        throw new Error(
          `Failed to create Office file: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      console.log("Office file created successfully");
    } catch (error) {
      console.error("Error creating Office file:", error);
      throw error;
    }
  }

  async getSiteDetails(
    token: string,
    siteId: string,
  ): Promise<{ displayName?: string; name: string; webUrl: string }> {
    try {
      // Normalize site ID format for Graph API
      let normalizedSiteId = siteId;
      if (!normalizedSiteId.startsWith("b!")) {
        normalizedSiteId = `b!${normalizedSiteId}`;
      }

      const url = `${appConfig.endpoints.graphBaseUrl}/sites/${normalizedSiteId}`;

      console.log("Fetching site details:", { url, siteId: normalizedSiteId });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching site details:", errorText);
        throw new Error(
          `Failed to get site details: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Site details data:", data);

      return {
        displayName: data.displayName,
        name: data.name || "Site",
        webUrl: data.webUrl || "",
      };
    } catch (error) {
      console.error("Error getting site details:", error);
      throw error;
    }
  }
  //Used new fucntion
  async createContainer(
    token: string,
    displayName: string,
    description: string,
  ): Promise<{ id: string }> {
    try {
      // Use the SharePoint Embedded containers endpoint
      const url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers`;
      debugger;
      console.log("Creating container:", { displayName, description });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName,
          description: description,
          containerTypeId: appConfig.containerTypeId,
        }),
      });
      debugger;
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating container:", errorText);
        throw new Error(
          `Failed to create container: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Container created:", data);

      return { id: data.id };
    } catch (error) {
      console.error("Error creating container:", error);
      throw error;
    }
  }

  async shareFile(
    token: string,
    containerId: string,
    itemId: string,
    recipients: string[],
    role: "read" | "write",
    message?: string,
  ): Promise<void> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${itemId}/invite`;

      console.log("Sharing file:", { containerId, itemId, recipients, role });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: recipients.map((email) => ({ email })),
          message: message || "",
          requireSignIn: true,
          sendInvitation: true,
          roles: [role],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error sharing file:", errorText);
        throw new Error(
          `Failed to share file: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      console.log("File shared successfully");
    } catch (error) {
      console.error("Error sharing file:", error);
      throw error;
    }
  }

  async getFilePreview(
    token: string,
    containerId: string,
    itemId: string,
  ): Promise<string> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/items/${itemId}/preview`;

      console.log("Fetching file preview:", { url });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching file preview:", errorText);
        throw new Error(
          `Failed to get file preview: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("File preview response:", data);

      return data.getUrl + "&nb=true";
    } catch (error) {
      console.error("Error getting file preview:", error);
      throw error;
    }
  }

  // async listContainersUsingSearch(token: string): Promise<Array<{ id: string; name: string; webUrl?: string; createdDateTime?: string; description?: string; containerTypeId?: string }>> {
  //   debugger

  //   try {
  //     const url = `${appConfig.endpoints.graphBaseUrl}/search/query`;

  //     const requestBody = {
  //       requests: [
  //         {
  //           entityTypes: ["drive"],
  //           query: {
  //             queryString: `ContainerTypeId:${appConfig.containerTypeId}`
  //           },
  //           sharePointOneDriveOptions: {
  //             includeHiddenContent: true
  //           },
  //           fields: [
  //             "name",
  //             "description",
  //             "createdDateTime",
  //             "lastModifiedDateTime",
  //             "webUrl",
  //             "parentReference"
  //           ]
  //         }
  //       ]
  //     };

  //     console.log('Searching for containers:', { url, body: requestBody });

  //     const response = await fetch(url, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(requestBody)
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error('Error searching containers:', errorText);
  //       throw new Error(`Failed to search containers: ${response.status} ${response.statusText} - ${errorText}`);
  //     }

  //     const data = await response.json();
  //     console.log('Container search response:', data);

  //     const containers: Array<{ id: string; name: string; webUrl?: string; createdDateTime?: string; description?: string; containerTypeId?: string }> = [];

  //     if (data.value &&
  //       data.value.length > 0 &&
  //       data.value[0].hitsContainers &&
  //       data.value[0].hitsContainers.length > 0) {

  //       const hits = data.value[0].hitsContainers[0].hits || [];

  //       for (const hit of hits) {
  //         const resource = hit.resource;
  //         if (resource && resource['@odata.type'] === '#microsoft.graph.drive') {
  //           containers.push({
  //             id: hit.hitId,
  //             name: resource.name || 'Project Container',
  //             webUrl: resource.webUrl,
  //             createdDateTime: resource.createdDateTime || resource.lastModifiedDateTime || new Date().toISOString(),
  //             description: resource.description || '',
  //             containerTypeId: appConfig.containerTypeId
  //           });
  //         }
  //       }
  //     }

  //     return containers;
  //   } catch (error) {
  //     console.error('Error listing containers:', error);
  //     throw error;
  //   }
  // }

  async getAllContainers(
    token: string,
    containerTypeId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      webUrl?: string;
      createdDateTime?: string;
      description?: string;
      containerTypeId?: string;
    }>
  > {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers?$filter=containerTypeId eq ${containerTypeId}`;

      console.log("Fetching all containers:", { url, containerTypeId });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching all containers:", errorText);
        throw new Error(
          `Failed to get containers: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("All containers response:", data);

      // Assuming the API returns { value: [ ...containers ] }
      return data.value.map((container: any) => ({
        id: container.id,
        name: container.name || "Project Container",
        webUrl: container.webUrl,
        createdDateTime:
          container.createdDateTime ||
          container.lastModifiedDateTime ||
          new Date().toISOString(),
        description: container.description || "",
        containerTypeId: container.containerTypeId || containerTypeId,
      }));
    } catch (error) {
      console.error("Error getting all containers:", error);
      throw error;
    }
  }

  async getContainer(
    token: string,
    containerId: string,
  ): Promise<{
    id: string;
    name: string;
    webUrl?: string;
    createdDateTime?: string;
    description?: string;
    containerTypeId?: string;
  }> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}`;

      console.log("Fetching container:", { url, containerId });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Container response:", url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching container:", errorText);
        throw new Error(
          `Failed to get container: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Container response:", data);

      return {
        id: data.id,
        name: data.name || "Project Container",
        webUrl: data.webUrl,
        createdDateTime:
          data.createdDateTime ||
          data.lastModifiedDateTime ||
          new Date().toISOString(),
        description: data.description || "",
        containerTypeId: appConfig.containerTypeId,
      };
    } catch (error) {
      console.error("Error getting container:", error);
      throw error;
    }
  }

  /** Fetch quota (used / total bytes) for a single drive (container). */
  async getDriveQuota(
    token: string,
    driveId: string,
  ): Promise<{ used: number; total: number; remaining: number }> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${driveId}?$select=quota`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`getDriveQuota failed: ${response.status} - ${text}`);
      }

      const data = await response.json();
      const quota = data.quota || {};
      return {
        used: quota.used ?? 0,
        total: quota.total ?? 0,
        remaining: quota.remaining ?? 0,
      };
    } catch (error) {
      console.error("Error fetching drive quota:", error);
      return { used: 0, total: 0, remaining: 0 };
    }
  }

  /**
   * Validate vendor username/password against the SharePoint UserDetails list.
   * Returns true when a matching list item exists, otherwise false.
   */
  async validateVendorCredentials(
    username: string,
    password: string,
  ): Promise<boolean> {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      return false;
    }

    const token = await getAccessTokenByApp();
    if (!token) {
      throw new Error("Unable to acquire app token for SharePoint validation.");
    }

    const host = appConfig.sharePointHostname.replace(/^https?:\/\//, "");
    const sitePath = "/sites/HackerthonDealsManagement";

    const url = `${appConfig.endpoints.graphBaseUrl}/sites/${host}:${sitePath}:/lists/UserDetails/items?$expand=fields($select=UserName,Password)`;

    console.log("Fetching all UserDetails list items for vendor validation:", {
      url,
      username: trimmedUsername,
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Response:", response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error validating vendor credentials:", errorText);
      throw new Error(
        `Failed to validate vendor credentials: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const items = Array.isArray(data.value) ? data.value : [];

    console.log("UserDetails list items:", items);

    const match = items.find((item: any) => {
      const fields = item.fields || {};
      return (
        fields.UserName === trimmedUsername && fields.Password === password
      );
    });

    return !!match;
  }

  /**
   * Get all distinct company names from the UserDetails SharePoint list (Company column).
   * Used e.g. for Top Vendors section; project counts can be merged later.
   */
  async getAllCompaniesFromUserDetails(): Promise<string[]> {
    const token = await getAccessTokenByApp();
    if (!token) return [];

    const host = appConfig.sharePointHostname.replace(/^https?:\/\//, "");
    const sitePath = "/sites/HackerthonDealsManagement";
    const url = `${appConfig.endpoints.graphBaseUrl}/sites/${host}:${sitePath}:/lists/UserDetails/items?$expand=fields($select=Company)`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      const items = Array.isArray(data.value) ? data.value : [];
      const companies = new Set<string>();
      items.forEach((item: any) => {
        const company = item.fields?.Company;
        if (company != null && String(company).trim() !== "") {
          companies.add(String(company).trim());
        }
      });
      return Array.from(companies).sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
  }

  /**
   * Get the Company (single-line text) for a vendor from the UserDetails SharePoint list by UserName.
   * Returns null if not found or no token.
   */
  async getVendorCompanyFromUserDetails(
    username: string,
  ): Promise<string | null> {
    const trimmed = username?.trim();
    if (!trimmed) return null;

    const token = await getAccessTokenByApp();
    if (!token) return null;

    const host = appConfig.sharePointHostname.replace(/^https?:\/\//, "");
    const sitePath = "/sites/HackerthonDealsManagement";
    const url = `${appConfig.endpoints.graphBaseUrl}/sites/${host}:${sitePath}:/lists/UserDetails/items?$expand=fields($select=UserName,Company)`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      const items = Array.isArray(data.value) ? data.value : [];
      const match = items.find((item: any) => {
        const fields = item.fields || {};
        return fields.UserName === trimmed;
      });
      if (!match?.fields) return null;
      const company = match.fields.Company;
      return company != null && String(company).trim() !== ""
        ? String(company).trim()
        : null;
    } catch {
      return null;
    }
  }
}

export const sharePointService = new SharePointService();
