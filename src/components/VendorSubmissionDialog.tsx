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
  Paperclip,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
  const [bidError, setBidError] = useState<string | null>(null);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  type VerificationStatus = "idle" | "processing" | "accepted" | "rejected" | "error";
  interface VendorVerificationItem {
    file: File;
    category: string;
    status: VerificationStatus;
    description: string;
    score?: number;
    error?: string;
  }

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationItems, setVerificationItems] = useState<VendorVerificationItem[]>([]);
  const [verificationRunning, setVerificationRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setBidAmount("");
      setFilesByCategory({ ...emptyFiles });
      setBidError(null);
      setAttachmentsError(null);
    }
  }, [open]);

  const handleFileChange = (
    key: keyof VendorFilesByCategory,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    const newFiles = Array.from(chosen);

    setFilesByCategory((prev) => {
      const updated = {
        ...prev,
        [key]: [...(prev[key] ?? []), ...newFiles],
      };
      return updated;
    });

    e.target.value = "";
  };

  const removeFile = (key: keyof VendorFilesByCategory, index: number) => {
    setFilesByCategory((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleConfirmVerification = async () => {
    if (saving) return;

    const acceptedItems = verificationItems.filter((i) => i.status === "accepted");
    // Build filtered category map with only accepted files
    const filtered: VendorFilesByCategory = {
      proposalDocument: [],
      supportingDocuments: [],
      costEstimation: [],
      policyDocuments: [],
      approvalDocuments: [],
    };
    acceptedItems.forEach((item) => {
      const match = CATEGORY_LABELS.find((c) => c.label === item.category);
      if (!match) return;
      filtered[match.key] = [...(filtered[match.key] ?? []), item.file];
    });

    // Close the verification popup immediately when user confirms.
    setVerificationOpen(false);

    setSaving(true);
    try {
      await onSave(bidAmount.trim(), filtered);
      // Also close the main dialog after save completes.
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Require bid amount and at least one file in any category.
    const trimmedBid = bidAmount.trim();
    const totalFiles = Object.values(filesByCategory).reduce(
      (sum, arr) => sum + (arr?.length || 0),
      0,
    );
    if (!trimmedBid) {
      setBidError("Bid amount is mandatory.");
      return;
    } else {
      setBidError(null);
    }
    if (totalFiles === 0) {
      setAttachmentsError("Please upload at least one attachment.");
      return;
    } else {
      setAttachmentsError(null);
    }

    // Flatten new files for verification
    const allFiles: VendorVerificationItem[] = [];
    CATEGORY_LABELS.forEach(({ key, label }) => {
      (filesByCategory[key] ?? []).forEach((file) => {
        allFiles.push({
          file,
          category: label,
          status: "processing",
          description: "",
        });
      });
    });

    if (allFiles.length === 0) {
      // No files to verify, save immediately
      setSaving(true);
      try {
        await onSave(trimmedBid, filesByCategory);
        onOpenChange(false);
      } finally {
        setSaving(false);
      }
      return;
    }

    setVerificationItems(allFiles);
    setVerificationOpen(true);
    setVerificationRunning(true);

    const projectDescription = project?.P_Description || "";
    const verified: VendorVerificationItem[] = [];

    for (const item of allFiles) {
      try {
        const extractedContent = await getFileContent(item.file, item.category);
        const analysis = await analyzeProposalDocuments(extractedContent, {
          P_Description: projectDescription,
        });
        const score = analysis?.score ?? 0;
        const description = analysis?.aiSuggestion || "No AI description available.";

        verified.push({
          ...item,
          status: score > 49 ? "accepted" : "rejected",
          description,
          score,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Verification failed for this file.";
        verified.push({
          ...item,
          status: "error",
          description: "",
          error: message,
        });
      }
    }

    setVerificationItems(verified);
    setVerificationRunning(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border shadow-xl bg-[#F8FAFC]"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader className="shrink-0 px-6 py-5 pb-4 border-b bg-gradient-to-b from-[#EFF4FF] to-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBE4FF] text-[#5a3dd4]">
                <Paperclip className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Vendor submission — {project.P_Name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Upload documents and enter your bid amount. A folder for <strong>{vendorCompanyName}</strong> will be created under this project&apos;s Vendor folder.
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0 overflow-auto">
              <div className="space-y-5 px-6 py-5">
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
                    className={`h-10 ${bidError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {bidError && (
                    <p className="mt-1 text-xs text-red-500">{bidError}</p>
                  )}
                </div>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Attachments (upload by category)
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {Object.values(filesByCategory).reduce((sum, arr) => sum + (arr?.length || 0), 0)} file(s) selected
                    </span>
                  </div>
                  <ScrollArea
                    className={`max-h-[340px] overflow-y-auto rounded-lg border bg-muted/10 p-3 ${
                      attachmentsError ? "border-red-500" : ""
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {CATEGORY_LABELS.map(({ key, label }) => (
                        <div
                          key={key}
                          className="rounded-xl bg-white border border-slate-100 px-3 py-3 flex flex-col gap-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-semibold text-slate-700">
                              {label}
                            </Label>
                            <span className="text-[10px] text-slate-400">
                              {(filesByCategory[key] ?? []).length || 0} file(s)
                            </span>
                          </div>
                          <label className="inline-flex items-center justify-center h-8 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 cursor-pointer hover:border-[#5a3dd4]/50 hover:bg-[#F4F3FF] transition-colors">
                            <span className="px-2">Choose files</span>
                            <Input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => handleFileChange(key, e)}
                              disabled={saving}
                            />
                          </label>
                          {(filesByCategory[key] ?? []).length > 0 && (
                            <ul className="space-y-1 list-none text-[11px] w-full">
                              {(filesByCategory[key] ?? []).map((file, idx) => (
                                <li
                                  key={`${file.name}-${idx}`}
                                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 border border-slate-100"
                                >
                                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate flex-1">{file.name}</span>
                                  <button
                                    type="button"
                                    className="text-[12px] text-destructive hover:underline shrink-0"
                                    onClick={() => removeFile(key, idx)}
                                    disabled={saving}
                                    aria-label={`Remove ${file.name}`}
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {attachmentsError && (
                    <p className="mt-1 text-xs text-red-500">{attachmentsError}</p>
                  )}
                </section>
              </div>
            </ScrollArea>
            <DialogFooter className="shrink-0 px-6 py-4 flex-row justify-end gap-2 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#5a3dd4] hover:bg-[#4a30b5]"
              >
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

      {/* Vendor attachment verification dialog (same style as project attachments) */}
      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent
          className="sm:max-w-[720px] max-h-[90vh] flex flex-col gap-0 rounded-2xl border shadow-2xl bg-white p-0 overflow-hidden"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <div className="px-6 pt-5 pb-3 border-b bg-gradient-to-r from-[#F4F3FF] via-white to-[#F4F3FF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#EBE4FF] flex items-center justify-center text-[#5a3dd4]">
                <Paperclip className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Verifying vendor documents
                </h2>
                <p className="text-xs text-slate-500">
                  Our AI is reviewing your uploaded documents and describing how well they support this bid.
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 max-h-[60vh] overflow-hidden">
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {verificationItems.map((item, index) => {
                const isAccepted = item.status === "accepted";
                const isRejected = item.status === "rejected";
                const isError = item.status === "error";
                const isProcessing = item.status === "processing";

                return (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="rounded-xl border bg-slate-50/60 px-4 py-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-100">
                          <FileText className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 truncate max-w-[260px]">
                            {item.file.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.category} · {Math.round((item.file.size || 0) / 1024)} KB
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isProcessing && (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-[#5a3dd4]" />
                            <span className="text-[11px] font-medium text-slate-500">
                              Analyzing…
                            </span>
                          </>
                        )}
                        {isAccepted && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[11px] font-medium text-emerald-700">
                              Accepted
                            </span>
                          </div>
                        )}
                        {(isRejected || isError) && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5">
                            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-[11px] font-medium text-red-700">
                              {isError ? "Error" : "Not eligible"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isProcessing && (
                      <div className="mt-1 rounded-lg bg-[#F3F6FF] px-3 py-2">
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          {isError
                            ? item.error
                            : item.description || "No AI description available."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="px-6 py-3 border-t bg-slate-50 flex items-center justify-between gap-3">
            {(() => {
              const acceptedCount = verificationItems.filter(
                (i) => i.status === "accepted",
              ).length;
              const rejectedCount = verificationItems.filter(
                (i) => i.status === "rejected",
              ).length;
              const hasAccepted = acceptedCount > 0;

              return (
                <>
                  <div className="text-[11px] text-slate-500">
                    {verificationRunning
                      ? "Verifying files…"
                      : hasAccepted
                        ? rejectedCount === 0
                          ? "All documents look relevant. They will be attached to this submission."
                          : `${acceptedCount} accepted, ${rejectedCount} rejected (score below 50). Only accepted documents will be attached.`
                        : "No documents were accepted. Please go back and adjust your files."}
                  </div>
                  <div className="flex items-center gap-2">
                    {!verificationRunning && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVerificationOpen(false)}
                      >
                        Back and change files
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      disabled={verificationRunning || !hasAccepted}
                      onClick={handleConfirmVerification}
                      className="bg-[#5a3dd4] hover:bg-[#4a30b5] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {verificationRunning ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Verifying…
                        </>
                      ) : (
                        "Confirm & save submission"
                      )}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
