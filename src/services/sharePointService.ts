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
          description: "P_Budget",
          displayName: "P_Budget",
          enforceUniqueValues: false,
          hidden: false,
          indexed: false,
          name: "P_Budget",
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

  async uploadFile(
    token: string,
    containerId: string,
    path: string,
    file: File,
    progressCallback: (progress: number) => void,
  ): Promise<void> {
    try {
      const uploadSession = await this.createUploadSession(
        token,
        containerId,
        path,
        file.name,
      );
      const chunkSize = 320 * 1024; // 320 KB, as recommended by Microsoft
      let start = 0;
      let end = Math.min(chunkSize, file.size);
      let chunkId = 0;

      while (start < file.size) {
        const chunk = file.slice(start, end);
        const contentRange = `bytes ${start}-${end - 1}/${file.size}`;

        await fetch(uploadSession.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Length": `${end - start}`,
            "Content-Range": contentRange,
          },
          body: chunk,
        });

        start = end;
        end = Math.min(start + chunkSize, file.size);
        chunkId++;

        const progress = Math.min(100, Math.round((start / file.size) * 100));
        progressCallback(progress);
      }

      console.log("File uploaded successfully");
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
        "V_SubmittedByEmail",
        "V_BidSubmissionDate",
        "V_BidDescription",
        "V_BidAmount",
        "P_VendorSubmissionDueDate",
        "P_Budget",
      ].join(",");
      const url = `${graphBase}/${containerId}/items/${folderId}/listitem/fields?$select=${selectFields}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const obj: Project = {
        id: folderId,
        P_Name: data.P_Name || null,
        P_Description: data.P_Description || null,
        P_StartDate: data.P_StartDate || null,
        P_EndDate: data.P_EndDate || null,
        P_Type: data.P_Type || null,
        V_SubmittedByEmail: data.V_SubmittedByEmail || null,
        V_BidSubmissionDate: data.V_BidSubmissionDate || null,
        V_BidDescription: data.V_BidDescription || null,
        V_BidAmount: data.V_BidAmount || null,
        P_VendorSubmissionDueDate: data.P_VendorSubmissionDueDate || null,
        P_Budget: data.P_Budget || null,
      };

      return obj;
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  }

  async createCustomDatas(
    token: string,
    containerId: string,
    folderName: string,
    data: Project,
  ): Promise<void> {
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

      await fetch(addUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          P_Name: data?.P_Name ?? "",
          P_Description: data?.P_Description ?? "",
          P_StartDate: data?.P_StartDate ?? "",
          P_EndDate: data?.P_EndDate ?? "",
          P_Type: data?.P_Type ?? "",
          V_SubmittedByEmail: data?.V_SubmittedByEmail ?? "",
          V_BidSubmissionDate: data?.V_BidSubmissionDate ?? "",
          V_BidDescription: data?.V_BidDescription ?? "",
          V_BidAmount: data?.V_BidAmount ?? "",
          P_VendorSubmissionDueDate: data?.P_VendorSubmissionDueDate ?? "",
          P_Budget: data?.P_Budget ?? "",
        }),
      });
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
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
          V_SubmittedByEmail: data?.V_SubmittedByEmail ?? "",
          V_BidSubmissionDate: data?.V_BidSubmissionDate ?? null,
          V_BidDescription: data?.V_BidDescription ?? "",
          V_BidAmount: data?.V_BidAmount ?? "",
          P_VendorSubmissionDueDate: data?.P_VendorSubmissionDueDate ?? null,
          P_Budget: data?.P_Budget ?? "",
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
  ): Promise<void> {
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

      await response.json();
      console.log("Folder created successfully");
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
}

export const sharePointService = new SharePointService();
