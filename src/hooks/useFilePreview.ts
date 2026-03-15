
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService, FileItem } from '@/services/sharePointService';
import { searchService } from '@/services/searchService';
import { toast } from '@/hooks/use-toast';

export const useFilePreview = (containerId: string | undefined) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const handleViewFile = async (file: FileItem) => {
    try {
      setPreviewLoading(true);
      setIsPreviewOpen(true);
      setPreviewUrl(null);
      
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "File preview authentication error",
          variant: "destructive",
        });
        setIsPreviewOpen(false);
        return;
      }
      
      const fileWithIds = file as FileItem & { driveId?: string };
      
      let url: string;
      if (fileWithIds.driveId) {
        url = await searchService.getFilePreviewUrl(token, fileWithIds.driveId, file.id);
      } else if (containerId) {
        url = await sharePointService.getFilePreview(token, containerId, file.id);
      } else {
        toast({
          title: "File preview location error",
          variant: "destructive",
        });
        setIsPreviewOpen(false);
        return;
      }
      
      setPreviewUrl(url);
    } catch {
      toast({
        title: "File preview error",
        variant: "destructive",
      });
      setIsPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  return {
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl,
    previewLoading,
    handleViewFile
  };
};
