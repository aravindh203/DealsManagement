import React, { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Project } from "@/pages/projectsData";
import {
  DollarSign,
  FileText,
  Loader2,
  Search,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFileContent } from "@/services/aiFileService";
import { analyzeProposalDocuments } from "@/services/aiSummary";

export interface VendorFilesByCategory {
  proposalDocument: File[];
  supportingDocuments: File[];
  costEstimation: File[];
  policyDocuments: File[];
  approvalDocuments: File[];
}

const CATEGORY_LABELS: { key: keyof VendorFilesByCategory; label: string }[] = [
  { key: "proposalDocument", label: "Proposal Document" },
  { key: "supportingDocuments", label: "Supporting Documents" },
  { key: "costEstimation", label: "Cost Estimation" },
  { key: "policyDocuments", label: "Policy Documents" },
  { key: "approvalDocuments", label: "Approval Documents" },
];

const emptyFiles: VendorFilesByCategory = {
  proposalDocument: [],
  supportingDocuments: [],
  costEstimation: [],
  policyDocuments: [],
  approvalDocuments: [],
};

type VerificationStatus = "idle" | "processing" | "success" | "error";

interface FileVerificationResult {
  status: VerificationStatus;
  score?: number;
  aiSuggestion?: string;
  error?: string;
  fileName?: string;
  categoryKey?: keyof VendorFilesByCategory;
  fileIndex?: number;
}

type VerificationByCategory = {
  [K in keyof VendorFilesByCategory]: FileVerificationResult[];
};

const emptyVerification: VerificationByCategory = {
  proposalDocument: [],
  supportingDocuments: [],
  costEstimation: [],
  policyDocuments: [],
  approvalDocuments: [],
};

interface VendorSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  vendorCompanyName: string;
  onSave: (
    bidAmount: string,
    filesByCategory: VendorFilesByCategory,
  ) => Promise<void>;
}

export const VendorSubmissionDialog: React.FC<VendorSubmissionDialogProps> = ({
  open,
  onOpenChange,
  project,
  vendorCompanyName,
  onSave,
}) => {
  const [bidAmount, setBidAmount] = useState("");
  const [filesByCategory, setFilesByCategory] =
    useState<VendorFilesByCategory>(emptyFiles);
  const [saving, setSaving] = useState(false);
  const [verificationByCategory, setVerificationByCategory] =
    useState<VerificationByCategory>(emptyVerification);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [activeVerification, setActiveVerification] = useState<FileVerificationResult | null>(null);
  const navigate = useNavigate();

  const steps = [
    {
      label: "Scanning Document Structure",
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      completedAt: 25,
    },
    {
      label: "OCR Data Extraction",
      icon: <Search className="w-5 h-5 text-emerald-600" />,
      completedAt: 50,
    },
    {
      label: "Signature Authenticity Check",
      icon: <FileCheck className="w-5 h-5 text-emerald-600" />,
      completedAt: 75,
    },
    {
      label: "Legal Compliance Verification",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      completedAt: 100,
    },
  ];

  useEffect(() => {
    if (open) {
      setBidAmount("");
      setFilesByCategory({ ...emptyFiles });
      setVerificationByCategory({ ...emptyVerification });
    }
  }, [open]);

  const handleFileChange = (
    key: keyof VendorFilesByCategory,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    const newFiles = Array.from(chosen);

    // Track starting index for these new files in this category
    let baseIndex = 0;

    setFilesByCategory((prev) => {
      const updated = {
        ...prev,
        [key]: [...(prev[key] ?? []), ...newFiles],
      };
      return updated;
    });

    // Initialize verification entries for all new files
    setVerificationByCategory((prev) => {
      const existing = prev[key] ?? [];
      baseIndex = existing.length;
      const extended: FileVerificationResult[] = [
        ...existing,
        ...newFiles.map((file) => ({
          status: "processing" as VerificationStatus,
          fileName: file.name,
        })),
      ];
      return { ...prev, [key]: extended };
    });

    // Run AI verification for each newly added file and show in the rich popup
    const projectDescription = project?.P_Description || "";

    newFiles.forEach((file, localIndex) => {
      const globalIndex = baseIndex + localIndex;

      // Choose a friendly label for logging/diagnostics
      const analysisCategoryLabel =
        key === "proposalDocument" ? "PROPOSAL QUALITY" : String(key);

      // Open / update the rich popup for this file
      setActiveVerification({
        status: "processing",
        fileName: file.name,
        categoryKey: key,
        fileIndex: globalIndex,
      });
      setVerificationDialogOpen(true);

      (async () => {
        try {
          const extractedContent = await getFileContent(
            file,
            analysisCategoryLabel,
          );
          const analysis = await analyzeProposalDocuments(extractedContent, {
            P_Description: projectDescription,
          });

          const score = analysis?.score ?? 0;
          const aiSuggestion = analysis?.aiSuggestion ?? "";

          // If score is too low, do not keep the file in the list
          if (score <= 50) {
            setFilesByCategory((prev) => {
              const copy = { ...prev };
              const list = [...(copy[key] ?? [])];
              copy[key] = list.filter((_, i) => i !== globalIndex);
              return copy;
            });
            setVerificationByCategory((prev) => {
              const copy = { ...prev };
              const list = [...(copy[key] ?? [])];
              copy[key] = list.filter((_, i) => i !== globalIndex);
              return copy as VerificationByCategory;
            });

            setActiveVerification({
              status: "error",
              fileName: file.name,
              error: `This document scored ${Math.round(
                score,
              )}%, which is below the minimum required score of 50%. It was not added to the submission.`,
              categoryKey: key,
              fileIndex: globalIndex,
            });
            return;
          }

          // Update inline state for this specific file
          setVerificationByCategory((prev) => {
            const copy = { ...prev };
            const list = [...(copy[key] ?? [])];
            if (!list[globalIndex]) {
              list[globalIndex] = { status: "success", fileName: file.name };
            }
            list[globalIndex] = {
              status: "success",
              score,
              aiSuggestion,
              fileName: file.name,
              categoryKey: key,
              fileIndex: globalIndex,
            };
            copy[key] = list;
            return copy as VerificationByCategory;
          });

          // Update popup view
          setActiveVerification({
            status: "success",
            score,
            aiSuggestion,
            fileName: file.name,
            categoryKey: key,
            fileIndex: globalIndex,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Verification failed.";

          setVerificationByCategory((prev) => {
            const copy = { ...prev };
            const list = [...(copy[key] ?? [])];
            if (!list[globalIndex]) {
              list[globalIndex] = {
                status: "error",
                error: message,
                fileName: file.name,
              };
            } else {
              list[globalIndex] = {
                ...list[globalIndex],
                status: "error",
                error: message,
              };
            }
            copy[key] = list;
            return copy as VerificationByCategory;
          });

          setActiveVerification({
            status: "error",
            error: message,
            fileName: file.name,
            categoryKey: key,
            fileIndex: globalIndex,
          });
        }
      })();
    });

    e.target.value = "";
  };

  const removeFile = (key: keyof VendorFilesByCategory, index: number) => {
    setFilesByCategory((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((_, i) => i !== index),
    }));
    setVerificationByCategory((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(bidAmount.trim(), filesByCategory);
      onOpenChange(false);
      navigate('/aianalyzie');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vendor submission — {project.P_Name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Upload documents and enter your bid amount. A folder for{" "}
          <strong>{vendorCompanyName}</strong> will be created under this
          project&apos;s Vendor folder.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-bid-amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Bid amount
              </Label>
              <Input
                id="vendor-bid-amount"
                type="text"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="h-10"
              />
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Attachments (upload by category)
            </div>
            <ScrollArea className="max-h-[320px] overflow-y-auto rounded-lg border p-3 space-y-4">
              {CATEGORY_LABELS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {label}
                  </Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      type="file"
                      multiple
                      className="h-9 text-sm max-w-[200px]"
                      onChange={(e) => handleFileChange(key, e)}
                      disabled={saving}
                    />
                    {(filesByCategory[key] ?? []).length > 0 && (
                      <ul className="flex flex-col gap-1.5 list-none text-xs w-full">
                        {(filesByCategory[key] ?? []).map((file, idx) => {
                          const verification = verificationByCategory[key]?.[idx];
                          return (
                            <li
                              key={`${file.name}-${idx}`}
                              className="flex flex-col gap-1 rounded bg-muted px-2 py-1"
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate max-w-[120px]">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  className="text-destructive hover:underline"
                                  onClick={() => removeFile(key, idx)}
                                  disabled={saving}
                                  aria-label={`Remove ${file.name}`}
                                >
                                  ×
                                </button>
                              </div>
                              {/* Inline AI verification status for this file */}
                              {verification && (
                                <div className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                                  {verification.status === "processing" && (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>
                                        AI document verification in progress…
                                      </span>
                                    </>
                                  )}
                                  {verification.status === "success" && (
                                    <span className="text-emerald-600">
                                      Score:{" "}
                                      <strong>
                                        {Math.round(
                                          verification.score ?? 0,
                                        )}
                                        %
                                      </strong>
                                      {verification.aiSuggestion && (
                                        <>
                                          {" "}
                                          —{" "}
                                          {verification.aiSuggestion.length >
                                          120
                                            ? `${verification.aiSuggestion.slice(
                                                0,
                                                120,
                                              )}…`
                                            : verification.aiSuggestion}
                                        </>
                                      )}
                                    </span>
                                  )}
                                  {verification.status === "error" && (
                                    <span className="text-destructive">
                                      Verification failed.
                                    </span>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save submission"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Rich document verification popup */}
    <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
      <DialogContent
        className="max-w-[100vw] sm:max-w-[100vw] w-[100vw] h-[100vh] bg-[#F8FAFC] border-0 shadow-2xl rounded-none p-0 overflow-hidden [&>button]:hidden"
      >
        <div
          className="w-full h-full flex flex-col items-center justify-start px-4 pt-5 pb-10 md:px-8 md:pt-6 md:pb-12 font-sans"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        >
          {/* Top pill */}
          <div className="mb-3">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100/50">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse relative">
                <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-75"></div>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-violet-600 uppercase">
                Nexus AI Intelligence
              </span>
            </div>
          </div>

          {/* Hero titles */}
          <div className="text-center mb-4 px-4">
            <h1 className="text-3xl md:text-[2.3rem] font-extrabold tracking-tight text-[#0F172A] mb-1.5">
              Document{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-[#7C3AED]">
                Validation
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium leading-relaxed">
              Our neural engine is analyzing{" "}
              {activeVerification?.fileName ? (
                <span className="font-semibold text-slate-700">
                  {activeVerification.fileName}
                </span>
              ) : (
                "your file"
              )}{" "}
              for authenticity, compliance, and structural integrity.
            </p>
          </div>

          {/* Main card */}
          <div className="w-full max-w-lg bg-white rounded-[2rem] p-6 shadow-2xl shadow-indigo-500/5 border border-white/60 relative overflow-hidden mb-6">
            {/* Header row */}
            <div className="flex justify-between items-end mb-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold tracking-[0.25em] text-violet-500 uppercase">
                  Document Verification
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  AI Validation Progress
                </h2>
              </div>
              <div className="text-2xl font-light text-violet-600 mb-[-2px]">
                {Math.min(
                  100,
                  activeVerification?.status === "processing"
                    ? 79
                    : Math.max(5, Math.round(activeVerification?.score ?? 100))
                )}
                %
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full mb-6 overflow-hidden shadow-inner relative">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-[#7C3AED] rounded-full transition-all duration-200 ease-out relative"
                style={{
                  width: `${Math.min(
                    100,
                    activeVerification?.status === "processing"
                      ? 79
                      : Math.max(5, Math.round(activeVerification?.score ?? 100))
                  )}%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[progress-shimmer_1.5s_infinite]"></div>
              </div>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-2.5 mb-4">
              {steps.map((step, index) => {
                const progressValue =
                  activeVerification?.status === "processing"
                    ? 79
                    : Math.min(100, Math.round(activeVerification?.score ?? 100));

                const isCompleted = progressValue >= step.completedAt;
                const prevThreshold = index === 0 ? 0 : steps[index - 1].completedAt;
                const isCurrent =
                  progressValue < step.completedAt && progressValue >= prevThreshold;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between transition-all duration-500 ease-out"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                          isCompleted || isCurrent
                            ? "bg-emerald-50/80 shadow-sm"
                            : "bg-slate-50 grayscale opacity-50"
                        }`}
                      >
                        {step.icon}
                      </div>
                      <span
                        className={`text-[11px] font-semibold transition-colors duration-500 ${
                          isCompleted
                            ? "text-slate-700"
                            : isCurrent
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    <div className="w-8 flex items-center justify-end">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-violet-500 animate-spin opacity-80" strokeWidth={2.5} />
                      ) : (
                        <CircleDot className="w-4 h-4 text-slate-200" strokeWidth={2} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-slate-100 mb-2.5" />

            {/* Footer & status row */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      activeVerification?.status === "processing"
                        ? "animate-ping bg-emerald-400"
                        : "bg-violet-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      activeVerification?.status === "processing"
                        ? "bg-emerald-500"
                        : "bg-violet-500"
                    }`}
                  ></span>
                </span>
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase ${
                    activeVerification?.status === "processing"
                      ? "text-slate-400"
                      : activeVerification?.status === "error"
                      ? "text-red-500"
                      : "text-violet-500"
                  }`}
                >
                  {activeVerification?.status === "processing"
                    ? "AI Engine Active"
                    : activeVerification?.status === "error"
                    ? "Validation Failed"
                    : "Validation Complete"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                ID: DOC-VAL-2024
              </span>
            </div>

            {/* Detailed AI explanation block */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                  Summary
                </span>
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.16em]">
                  Details
                </span>
              </div>

              <div
                className={`rounded-xl px-3 py-2.5 text-[11px] leading-relaxed overflow-y-auto ${
                  activeVerification?.status === "error"
                    ? "bg-red-50"
                    : "bg-slate-50"
                }`}
                style={{ maxHeight: "3.6rem" }}  /* ~3 lines before scroll */
              >
                {activeVerification?.status === "processing" && (
                  <p className="text-slate-700">
                    Our AI is reading the document, extracting key sections and comparing them to
                    the project description to compute a relevance score.
                  </p>
                )}
                {activeVerification?.status === "success" &&
                  activeVerification.aiSuggestion && (
                    <p className="text-slate-700">
                      {activeVerification.aiSuggestion}
                    </p>
                  )}
                {activeVerification?.status === "error" && (
                  <p className="text-red-600">
                    We could not verify this document: {activeVerification.error}
                  </p>
                )}
              </div>

              {/* Close / back button inside popup */}
              <div className="mt-3.5 pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setVerificationDialogOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-[#0F172A] text-white text-[11px] font-semibold px-4 py-1.5 shadow-sm hover:bg-[#111827] transition-colors"
                >
                  Back to document upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
