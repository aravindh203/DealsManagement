import { appConfig } from '../config/appConfig';
import { FileItem, sharePointService } from './sharePointService';

export interface SearchResult {
  id: string;
  title: string;
  createdBy: string;
  createdDateTime: string;
  preview: string;
  driveId: string;
  itemId: string;
  webUrl?: string;
  editUrl?: string;
  parentReference?: {
    siteId?: string;
    sharepointIds?: {
      listItemUniqueId?: string;
    };
  };
}

// Extended FileItem interface to include driveId for search results
export interface SearchFileItem extends FileItem {
  driveId?: string;
  isFolder?: boolean;
  createdByName?: string;
}

export class SearchService {
  async searchFiles(
    token: string,
    searchTerm: string,
    containerId?: string
  ): Promise<SearchResult[]> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/search/query`;
      
      // Build query string for searching files/driveItems
      let queryString = '';
      if (containerId) {
        // Search within a specific container for files
        queryString = `${searchTerm}`;
      } else {
        // Search for files across all containers with the specified container type
        queryString = `${searchTerm} AND ContainerTypeId:${appConfig.containerTypeId}`;
      }
      
      const requestBody = {
        requests: [
          {
            entityTypes: ["driveItem"], // Changed from "drive" to "driveItem"
            query: {
              queryString
            },
            from: 0,
            size: 25,
            fields: [
              "name",
              "parentReference", 
              "file",
              "folder",
              "webUrl",
              "createdDateTime",
              "lastModifiedDateTime",
              "size",
              "createdBy",
              "lastModifiedBy",
              "id"
            ]
          }
        ]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      const searchResults: SearchResult[] = [];
      
      if (data.value && 
          data.value.length > 0 && 
          data.value[0].hitsContainers && 
          data.value[0].hitsContainers.length > 0) {
        
        const hits = data.value[0].hitsContainers[0].hits || [];
        
        for (const hit of hits) {
          
          const resource = hit.resource;
          if (resource && resource['@odata.type'] === '#microsoft.graph.driveItem') {
            // Extract the drive ID and item ID
            const driveId = resource.parentReference?.driveId || '';
            const itemId = resource.id || '';
            
            // Skip folders if we're looking for files
            if (resource.folder && !resource.file) {
              continue;
            }
            
            // Extract created by information
            let createdBy = 'Unknown';
            if (resource.createdBy && resource.createdBy.user && resource.createdBy.user.displayName) {
              createdBy = resource.createdBy.user.displayName;
            }
            
            // Extract creation/modification date
            const createdDateTime = resource.createdDateTime || 
                                  resource.lastModifiedDateTime ||
                                  new Date().toISOString();
            
            // Extract file name
            const title = resource.name || 'Unnamed File';
            
            // Add the search result
            searchResults.push({
              id: itemId,
              title: title,
              createdBy: createdBy,
              createdDateTime: createdDateTime,
              preview: hit.summary || 'No preview available',
              driveId: driveId,
              itemId: itemId,
              webUrl: resource.webUrl
            });
          } else {
          }
        }
      }
      return searchResults;
    } catch (error) {
      throw error;
    }
  }

  async getFileDetails(token: string, driveId: string, itemId: string): Promise<{ webUrl: string }> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${driveId}/items/${itemId}?$expand=listItem($expand=fields)`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get file details: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      return { 
        webUrl: data.webUrl || ''
      };
    } catch (error) {
      throw error;
    }
  }

  async getFilePreviewUrl(token: string, driveId: string, itemId: string): Promise<string> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${driveId}/items/${itemId}/preview`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get file preview URL: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Add &nb=true parameter as specified
      const previewUrl = data.getUrl + "&nb=true";
      return previewUrl;
    } catch (error) {
      throw error;
    }
  }

  convertToFileItem(result: SearchResult): SearchFileItem {
    return {
      id: result.itemId,
      name: result.title,
      size: 0,
      lastModifiedDateTime: result.createdDateTime,
      createdDateTime: result.createdDateTime,
      webUrl: result.webUrl || '',
      isFolder: false,
      createdByName: result.createdBy,
      driveId: result.driveId,
      eTag: '',
      folder: undefined,
      file: {
        mimeType: 'application/octet-stream',
        hashes: {
          quickXorHash: '',
          sha1Hash: ''
        }
      }
    };
  }
}

export const searchService = new SearchService();

