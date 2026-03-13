import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sparkles, CheckCircle, Globe, Zap, FileText, DollarSign, ChevronRight, X, ShieldCheck, TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { appConfig } from '../../config/appConfig';
import { sharePointService, FileItem } from '../../services/sharePointService';
import { getAccessTokenByApp } from '../../hooks/useClientCredentialsAuth';
import { getFileContent } from '../../services/aiFileService';
import { analyzeVendorDocuments } from '../../services/aiSummary';
import { toast } from '@/hooks/use-toast';
import { useProjects } from '../../context/ProjectsContext';

interface DocumentScore {
  name: string;
  score: number;
}

interface VendorDetails {
  name: string;
  matchPercentage: number;
  location: string;
  website: string;
  bidAmount?: string | number;
  confidence: "High" | "Medium" | "Low";
  documentScores: DocumentScore[];
  reasonsForMatch: string[];
}

export interface AiSummarizeProps {
  isOpen: boolean;
  onClose: () => void;
  vendorsData?: VendorDetails[];
  project?: any;
}

const AiSummarize: React.FC<AiSummarizeProps> = ({ isOpen, onClose, vendorsData, project }) => {
  // Loading state
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progressValue, setProgressValue] = useState(0);
  const [analyzedVendors, setAnalyzedVendors] = useState<VendorDetails[]>([]);
  const [processingStatus, setProcessingStatus] = useState("Initializing AI Engine...");
  const [pendingVendor, setPendingVendor] = useState<VendorDetails | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assigningVendor, setAssigningVendor] = useState(false);
  const { reloadProjects } = useProjects();

  const vendors = vendorsData || analyzedVendors;

  const handleSelectVendor = async (vendor: VendorDetails): Promise<boolean> => {
    if (!project) {
      toast({
        title: 'Unable to select vendor',
        description: 'Missing project context. Please reopen this project and try again.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const token = await getAccessTokenByApp();
      if (!token) {
        toast({
          title: 'Unable to select vendor',
          description: 'Could not get access token.',
          variant: 'destructive',
        });
        return false;
      }

      await sharePointService.patchListItemFields(
        token,
        appConfig.ContainerID,
        String(project),
        {
          // Reuse V_BidDescription column to store finalized vendor company name
          V_BidDescription: vendor.name,
          P_Status: 'Yet to start',
          V_BidAmount: vendor.bidAmount?.toString() || "",
        },
      );

      await reloadProjects();

      toast({
        title: 'Vendor selected',
        description: `${vendor.name} has been set as the finalized vendor for this project.`,
      });

      onClose();
      return true;
    } catch (err) {
      console.error('Error updating finalized vendor:', err);
      toast({
        title: 'Vendor selection failed',
        description: 'Could not update the project in SharePoint. Please check the console for details.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleRequestSelectVendor = (vendor: VendorDetails) => {
    setPendingVendor(vendor);
    setConfirmOpen(true);
  };

  const handleExportReport = () => {
    if (!vendors || vendors.length === 0) return;

    const rows = vendors.slice(0, 3).map((v) => ({
      Vendor: v.name,
      MatchPercentage: v.matchPercentage,
      Location: v.location,
      Website: v.website,
      BidAmount: typeof v.bidAmount === "number" ? v.bidAmount : v.bidAmount ?? "",
      Confidence: v.confidence,
      DocumentScores: v.documentScores.map((d) => `${d.name}: ${d.score}%`).join("; "),
      Reasons: v.reasonsForMatch.join(" | "),
    }));

    const header = Object.keys(rows[0]).join(",");
    const csvLines = rows.map((r) =>
      Object.values(r)
        .map((value) => {
          const str = String(value ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    );

    const csvContent = [header, ...csvLines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-vendor-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger loading and analysis when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAnalyzing(true);
      setProgressValue(0);

      const fetchVendorData = async () => {
        if (!project) return;
        try {
          const token = await getAccessTokenByApp();
          if (!token) return;
          const containerId = appConfig.ContainerID;

          const vendorFolderId = await sharePointService.getVendorFolderId(token, containerId, String(project));
          if (!vendorFolderId) {
            setIsAnalyzing(false);
            return;
          }

          setProcessingStatus("Fetching Full Project Details...");
          const projectDetails = await sharePointService.fetchCustomDatas(token, containerId, String(project));

          setProcessingStatus("Reading Vendor Folders...");
          const companyFolders = await sharePointService.listFiles(token, containerId, vendorFolderId);

          const allVendors: any[] = [];

          for (const company of companyFolders) {
            if (company.folder) {
              const vendorObj: any = {
                vendorName: company.name,
                documents: {}
              };

              const subfolders = await sharePointService.listFiles(token, containerId, company.id);
              for (const sub of subfolders) {
                if (sub.folder) {
                  const files = await sharePointService.listFiles(token, containerId, sub.id);
                  for (const f of files) {
                    if (!f.folder) {
                      try {
                        const buffer = await sharePointService.getFileBuffer(token, containerId, f.id);
                        const fileBlob = new Blob([buffer], { type: f.file?.mimeType || 'application/octet-stream' });

                        setProcessingStatus(`Extracting text from ${f.name}...`);
                        const extractedContent = await getFileContent(fileBlob as any as File, f.name);

                        const docObj = { file: fileBlob, meta: f, extractedContent };
                        const folderName = sub.name.toLowerCase();
                        if (folderName.includes("proposal")) {
                          vendorObj.documents.ProposalDocument = docObj;
                        } else if (folderName.includes("cost")) {
                          vendorObj.documents.CostEstimation = docObj;
                        } else if (folderName.includes("support")) {
                          vendorObj.documents.SupportingDocuments = vendorObj.documents.SupportingDocuments || [];
                          vendorObj.documents.SupportingDocuments.push(docObj);
                        } else if (folderName.includes("policy")) {
                          vendorObj.documents.PolicyDocuments = vendorObj.documents.PolicyDocuments || [];
                          vendorObj.documents.PolicyDocuments.push(docObj);
                        } else if (folderName.includes("approval")) {
                          vendorObj.documents.ApprovalDocuments = vendorObj.documents.ApprovalDocuments || [];
                          vendorObj.documents.ApprovalDocuments.push(docObj);
                        } else {
                          vendorObj.documents.Other = vendorObj.documents.Other || [];
                          vendorObj.documents.Other.push({ type: sub.name, ...docObj });
                        }
                      } catch (err) {
                        console.error(`Failed to download content for file ${f.name}:`, err);
                      }
                    }
                  }
                }
              }
              allVendors.push(vendorObj);
            }
          }

          const finalScoredVendors: VendorDetails[] = [];
          for (const vendor of allVendors) {
            try {
              setProcessingStatus(`Analyzing ${vendor.vendorName}...`);
              const openAiResult = await analyzeVendorDocuments(vendor, projectDetails || project);

              finalScoredVendors.push({
                name: vendor.vendorName,
                matchPercentage: openAiResult.matchPercentage || 0,
                location: openAiResult.location || "Unknown",
                website: openAiResult.website || "",
                bidAmount: openAiResult.bidAmount || "N/A",
                confidence: openAiResult.confidence || "Medium",
                documentScores: openAiResult.documentScores || [],
                reasonsForMatch: openAiResult.reasonsForMatch || []
              });
            } catch (err) {
              console.error(`Error scoring vendor ${vendor.vendorName}:`, err);
            }
          }

          const sortedVendors = [...finalScoredVendors].sort((a, b) => b.matchPercentage - a.matchPercentage);
          setAnalyzedVendors(sortedVendors);
          setIsAnalyzing(false);

        } catch (error) {
          console.error("Error fetching vendor files:", error);
          setIsAnalyzing(false);
        }
      };

      fetchVendorData();

      const interval = setInterval(() => {
        setProgressValue((prev) => (prev >= 95 ? 95 : prev + 5));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isOpen, project]);

  const docScoreColors = ['bg-[#5b45ff]', 'bg-[#00c875]', 'bg-[#ff9900]'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[1000px] bg-[#f4f5f7] border-0 text-slate-800 shadow-2xl overflow-hidden p-0 rounded-3xl font-[Inter,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] [&>button]:hidden gap-0"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >

        <div className="px-8 pt-4 pb-2 bg-[#f4f5f7]">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-between items-start gap-0">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#5b45ff] rounded-xl text-white shadow-sm flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-[22px] font-bold tracking-tight text-[#1a1b25]">
                  AI Suggested Vendors
                </h2>
              </div>
              <p className="text-[#6b7280] text-[13px] leading-relaxed ml-[44px]">
                Our intelligence engine analyzed your documents to find your perfect project matches.
              </p>
            </div>

            {!isAnalyzing && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm mt-1">
                <span className="text-[10px] font-[800] text-[#6b7280] pr-1 uppercase tracking-wide">
                  {vendors.length} Vendors Uploaded
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60" />

        <div className="px-8 py-4 bg-[#eaecf0] min-h-[400px] flex flex-col justify-start">

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto py-12">
              <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                <div className="absolute inset-0 rounded-full border-4 border-[#5b45ff] border-t-transparent animate-spin" />
                <Sparkles className="w-8 h-8 text-[#5b45ff] animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1b25] mb-2">Analyzing documents...</h3>
              <p className="text-[13px] text-gray-500 mb-6 text-center">
                Reviewing proposals, estimating costs, and checking policy alignment against your project criteria.
              </p>

              <div className="w-full relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-medium text-[#5b45ff] animate-pulse">
                    {processingStatus}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {Math.round(progressValue)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5b45ff] transition-all duration-100 ease-out rounded-full"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vendors.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 font-medium bg-white rounded-3xl">
                  No vendors found or matched for this project.
                </div>
              ) : (
                vendors.slice(0, 3).map((vendor, vIndex) => (
                  <div
                    key={vIndex}
                    className={`flex flex-col bg-white rounded-[24px] overflow-hidden relative shadow-sm transition-all duration-300
                      ${vIndex === 0 ? 'ring-2 ring-[#5b45ff] shadow-[0_8px_30px_rgba(91,69,255,0.12)] scale-[1.02] z-10' : 'border border-gray-100'}`}
                  >
                    {vIndex === 0 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#5b45ff] text-white text-[9px] font-[800] px-4 py-1.5 rounded-b-xl flex items-center gap-1.5 uppercase tracking-widest shadow-md">
                        <Sparkles className="w-3 h-3" />
                        AI Top Pick
                      </div>
                    )}

                    <div className="p-4 pt-6 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="pt-0.5">
                          <h3 className="text-[17px] font-bold text-[#1a1b25] leading-tight flex items-center gap-1.5">
                            {vendor.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-gray-400">
                            <Globe className="w-3 h-3" />
                            <span className="truncate max-w-[140px] hover:text-gray-600 transition-colors cursor-pointer">{vendor.website}</span>
                          </div>
                        </div>

                        <div className="relative w-[44px] h-[44px] flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8"
                              strokeDasharray={`${vendor.matchPercentage * 2.76} 276`}
                              strokeLinecap="round"
                              className={vIndex === 0 ? "text-[#5b45ff]" : "text-[#00c875]"}
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-[13px] font-[900] text-[#1a1b25]">{vendor.matchPercentage}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 bg-[#f8f9fc] rounded-xl flex items-center">
                        <div className="flex-1 p-2 px-3">
                          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bid Amount</div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span className="text-[14px] font-[900] text-[#1a1b25] tracking-tight">{typeof vendor.bidAmount === 'number' ? `$${vendor.bidAmount.toLocaleString()}` : vendor.bidAmount}</span>
                          </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="flex-1 p-2 px-3">
                          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Confidence</div>
                          <span className="text-[12px] font-[900] text-[#00c875]">{vendor.confidence}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 flex-1 flex flex-col">
                      <div className="py-3">
                        <h4 className="flex items-center gap-1.5 text-[9px] font-bold text-[#1a1b25] uppercase tracking-widest mb-2.5">
                          <FileText className="w-3 h-3 text-[#5b45ff]" />
                          Document Scores
                        </h4>
                        <div className="space-y-2.5">
                          {vendor.documentScores.slice(0, 3).map((doc, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wide">
                                <span className="text-gray-500">{doc.name}</span>
                                <span className="text-gray-400">{doc.score}%</span>
                              </div>
                              <div className="h-[2px] w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${docScoreColors[index % docScoreColors.length]}`}
                                  style={{ width: `${doc.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="h-px w-full bg-gray-100 my-1" />

                      <div className="py-3 flex flex-col flex-1">
                        <h4 className="flex items-center gap-1.5 text-[9px] font-bold text-[#1a1b25] uppercase tracking-widest mb-2">
                          <Zap className="w-3 h-3 text-[#5b45ff]" />
                          AI Insights
                        </h4>
                        <ul className="space-y-1.5 mb-4 flex-1">
                          {vendor.reasonsForMatch.map((reason, index) => (
                            <li key={index} className="flex gap-1.5 text-[11px] text-gray-600 items-center font-medium">
                              <CheckCircle className="w-3 h-3 text-[#00c875] shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          onClick={() => handleRequestSelectVendor(vendor)}
                          className={`w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors
                          ${vIndex === 0
                              ? 'bg-[#5b45ff] hover:bg-[#4a35ea] text-white shadow-md'
                              : 'bg-[#f4f5f7] hover:bg-[#e2e4e9] text-[#1a1b25]'}`}
                        >
                          Select Vendor
                          {/* <ChevronRight className={`w-3.5 h-3.5 ${vIndex === 0 ? 'text-white' : 'text-gray-400'}`} /> */}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        <div className="bg-white px-8 py-3.5 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-[10px] font-[800] text-[#00c875] uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Data
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportReport}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white text-[12px] font-[700] px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              Export Report
            </button>
          </div>
        </div>

        <AlertDialog
          open={confirmOpen && !!pendingVendor}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmOpen(false);
              setPendingVendor(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Assign this vendor to the project?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingVendor
                  ? `You are about to finalize "${pendingVendor.name}" as the selected vendor for this project. This will update the project status and store this vendor as the finalized choice.`
                  : "You are about to finalize this vendor for the project."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={assigningVendor}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={assigningVendor}
                onClick={async (event) => {
                  event.preventDefault();
                  if (!pendingVendor) return;
                  setAssigningVendor(true);
                  try {
                    const ok = await handleSelectVendor(pendingVendor);
                    if (ok) {
                      setConfirmOpen(false);
                      setPendingVendor(null);
                    }
                  } finally {
                    setAssigningVendor(false);
                  }
                }}
              >
                {assigningVendor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Assigning vendor…
                  </>
                ) : (
                  'Confirm vendor assignment'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </DialogContent>
    </Dialog>
  );
};

export default AiSummarize;
