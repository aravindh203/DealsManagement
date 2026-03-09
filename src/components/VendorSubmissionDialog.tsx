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
import { DollarSign, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setBidAmount("");
      setFilesByCategory({ ...emptyFiles });
    }
  }, [open]);

  const handleFileChange = (
    key: keyof VendorFilesByCategory,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    setFilesByCategory((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), ...Array.from(chosen)],
    }));
    e.target.value = "";
  };

  const removeFile = (key: keyof VendorFilesByCategory, index: number) => {
    setFilesByCategory((prev) => ({
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
                      <ul className="flex flex-wrap gap-1.5 list-none text-xs">
                        {(filesByCategory[key] ?? []).map((file, idx) => (
                          <li
                            key={`${file.name}-${idx}`}
                            className="flex items-center gap-1 rounded bg-muted px-2 py-1"
                          >
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
                          </li>
                        ))}
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
  );
};
