import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Project } from '@/pages/projectsData';
import {
  Briefcase,
  Calendar,
  DollarSign,
  Paperclip,
  FileText,
  Loader2,
  Plus,
  X,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getFileContent } from '@/services/aiFileService';
import { analyzeProposalDocuments } from '@/services/aiSummary';

export interface ExistingAttachment {
  id: string;
  name: string;
}

export type ProjectDialogMode = 'create' | 'edit' | 'view';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null; // null = create, otherwise edit
  /** 'view' = read-only popup; default derived from project (edit vs create). */
  mode?: ProjectDialogMode;
  /** When true (e.g. vendor viewing), hide Budget and Project Start/End date sections. */
  isVendor?: boolean;
  /** (formData, newFiles?, attachmentIdsToDelete?) – attachmentIdsToDelete are removed when user saves. Not used when mode is 'view'. */
  onSave?: (
    data: Extract<Omit<Project, 'id'>, object>,
    files?: File[] | null,
    attachmentIdsToDelete?: string[],
  ) => void;
  /** When true, show loading state on submit button (parent sets while save is in progress). */
  saving?: boolean;
  /** When editing/viewing, load existing files from the project Attachments folder. */
  onLoadExistingAttachments?: (projectId: string) => Promise<ExistingAttachment[]>;
}

const emptyForm: Omit<Project, 'id'> = {
  P_Name: '',
  P_Description: '',
  P_StartDate: null,
  P_EndDate: null,
  P_Type: '',
  P_Status: 'Open',
  V_SubmittedByEmail: '',
  V_BidSubmissionDate: null,
  V_BidDescription: '',
  V_BidAmount: '',
  P_VendorSubmissionDueDate: null,
  P_Budget: '',
  P_BidStartDate: null,
  P_BidEndDate: null,
  P_Company: null,
};

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  open,
  onOpenChange,
  project,
  mode: modeProp,
  isVendor = false,
  onSave,
  saving = false,
  onLoadExistingAttachments,
}) => {
  const mode: ProjectDialogMode = modeProp ?? (project ? 'edit' : 'create');
  const isView = mode === 'view';

  const [form, setForm] = useState<Omit<Project, 'id'>>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState<string[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  type VerificationStatus = 'idle' | 'processing' | 'accepted' | 'rejected' | 'error';
  interface AttachmentVerificationItem {
    file: File;
    status: VerificationStatus;
    description: string;
    score?: number;
    error?: string;
  }

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationItems, setVerificationItems] = useState<AttachmentVerificationItem[]>([]);
  const [verificationRunning, setVerificationRunning] = useState(false);

  useEffect(() => {
    if (open) {
      if (project) {
        const { id, ...rest } = project;
        setForm(rest);
        setExistingAttachments([]);
        if (onLoadExistingAttachments && id != null) {
          setLoadingAttachments(true);
          onLoadExistingAttachments(String(id))
            .then(setExistingAttachments)
            .catch(() => setExistingAttachments([]))
            .finally(() => setLoadingAttachments(false));
        }
      } else {
        setForm({ ...emptyForm });
        setExistingAttachments([]);
      }
      setFiles([]);
      setAttachmentIdsToDelete([]);
    }
  }, [open, project, onLoadExistingAttachments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView || !onSave || saving) return;
    if (!form.P_Name?.trim()) return;

    // If there are no new files, save immediately without verification
    if (files.length === 0) {
      onSave(
        form,
        null,
        attachmentIdsToDelete.length > 0 ? attachmentIdsToDelete : undefined,
      );
      return;
    }

    // Run AI verification for newly added files before saving
    const initialItems: AttachmentVerificationItem[] = files.map((file) => ({
      file,
      status: 'processing',
      description: '',
    }));
    setVerificationItems(initialItems);
    setVerificationOpen(true);
    setVerificationRunning(true);

    const results: AttachmentVerificationItem[] = [];
    for (const file of files) {
      try {
        const extractedContent = await getFileContent(file, 'PROJECT ATTACHMENT');
        const analysis = await analyzeProposalDocuments(extractedContent, {
          P_Description: form.P_Description || '',
        });
        const score = analysis?.score ?? 0;
        const description = analysis?.aiSuggestion || 'No AI description available.';

        results.push({
          file,
          status: score > 49 ? 'accepted' : 'rejected',
          description,
          score,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Verification failed for this file.';
        results.push({
          file,
          status: 'error',
          description: '',
          error: message,
        });
      }
    }

    setVerificationItems(results);
    setVerificationRunning(false);
  };

  const update = (key: keyof Omit<Project, 'id'>, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key: keyof Omit<Project, 'id'>, value: string) => {
    if (!value) {
      update(key, null);
    } else {
      // Input date provides YYYY-MM-DD
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        update(key, date.toISOString());
      } else {
        update(key, null);
      }
    }
  };

  const formatDateForInput = (isoDate: string | null | undefined) => {
    if (!isoDate) return '';
    try {
      return new Date(isoDate).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleDigitChange = (key: keyof Omit<Project, 'id'>, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    update(key, digitsOnly);
  };

  const handleConfirmVerification = () => {
    if (!onSave || saving) return;

    const accepted = verificationItems.filter((i) => i.status === 'accepted').map((i) => i.file);
    // Only allow accepted files to be persisted; rejected/error files are dropped
    onSave(
      form,
      accepted.length > 0 ? accepted : null,
      attachmentIdsToDelete.length > 0 ? attachmentIdsToDelete : undefined,
    );
    setVerificationOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border shadow-xl bg-[#F8FAFC]">
        <DialogHeader className="shrink-0 px-6 py-5 pb-4 border-b bg-gradient-to-b from-[#EFF4FF] to-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBE4FF] text-[#5a3dd4]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {isView ? 'View Project' : project ? 'Edit Project' : 'New Project'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {isView
                  ? 'Project details (read-only)'
                  : project
                    ? 'Update project details and attachments'
                    : 'Add a new project to the directory'}
              </p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0" noValidate>
          <ScrollArea className="flex-1 min-h-0 overflow-auto">
            <div className="p-6 space-y-6 bg-[#F8FAFC]">
              {/* Project layout */}
              <section className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Project details
                  </div>
                  {!isVendor && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      New project configuration
                    </div>
                  )}
                </div>

                {/* Row 1 & 2: 7 fields in a single grid so widths stay consistent */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="P_Name" className="text-sm font-medium">
                      Project name *
                    </Label>
                    <Input
                      id="P_Name"
                      value={form.P_Name || ''}
                      onChange={(e) => !isView && update('P_Name', e.target.value)}
                      required={!isView}
                      disabled={isView}
                      className="h-10"
                      placeholder="e.g. Head Office Renovation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="P_Type" className="text-sm font-medium">
                      Project type
                    </Label>
                    <Input
                      id="P_Type"
                      value={form.P_Type || ''}
                      onChange={(e) => !isView && update('P_Type', e.target.value)}
                      disabled={isView}
                      className="h-10"
                      placeholder="e.g. Renovation, SPFX"
                    />
                  </div>
                  {!isVendor && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="P_StartDate" className="text-sm font-medium">
                          Start date
                        </Label>
                        <div className="relative flex items-stretch">
                          <Input
                            id="P_StartDate"
                            type="date"
                            value={formatDateForInput(form.P_StartDate)}
                            onChange={(e) => !isView && handleDateChange('P_StartDate', e.target.value)}
                            disabled={isView}
                            className="h-10 pr-0 text-sm rounded-r-none"
                          />
                          <div className="pointer-events-none flex items-center justify-center w-9 rounded-r-md bg-[#5a3dd4] text-white border border-l-0 border-input">
                            <Calendar className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="P_EndDate" className="text-sm font-medium">
                          End date
                        </Label>
                        <div className="relative flex items-stretch">
                          <Input
                            id="P_EndDate"
                            type="date"
                            value={formatDateForInput(form.P_EndDate)}
                            onChange={(e) => !isView && handleDateChange('P_EndDate', e.target.value)}
                            disabled={isView}
                            className="h-10 pr-0 text-sm rounded-r-none"
                          />
                          <div className="pointer-events-none flex items-center justify-center w-9 rounded-r-md bg-[#5a3dd4] text-white border border-l-0 border-input">
                            <Calendar className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {/* Bid start / end / budget */}
                  <div className="space-y-2">
                    <Label htmlFor="P_BidStartDate" className="text-sm font-medium">
                      Bid start date
                    </Label>
                    <div className="relative flex items-stretch">
                      <Input
                        id="P_BidStartDate"
                        type="date"
                        value={formatDateForInput(form.P_BidStartDate)}
                        onChange={(e) => !isView && handleDateChange('P_BidStartDate', e.target.value)}
                        disabled={isView}
                        className="h-10 pr-0 text-sm rounded-r-none"
                      />
                      <div className="pointer-events-none flex items-center justify-center w-9 rounded-r-md bg-[#5a3dd4] text-white border border-l-0 border-input">
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="P_BidEndDate" className="text-sm font-medium">
                      Bid end date
                    </Label>
                    <div className="relative flex items-stretch">
                      <Input
                        id="P_BidEndDate"
                        type="date"
                        value={formatDateForInput(form.P_BidEndDate)}
                        onChange={(e) => !isView && handleDateChange('P_BidEndDate', e.target.value)}
                        disabled={isView}
                        className="h-10 pr-0 text-sm rounded-r-none"
                      />
                      <div className="pointer-events-none flex items-center justify-center w-9 rounded-r-md bg-[#5a3dd4] text-white border border-l-0 border-input">
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  {!isVendor && (
                    <div className="space-y-2">
                      <Label htmlFor="P_Budget" className="text-sm font-medium">
                        Budget
                      </Label>
                      <Input
                        id="P_Budget"
                        value={form.P_Budget || ''}
                        onChange={(e) => !isView && handleDigitChange('P_Budget', e.target.value)}
                        disabled={isView}
                        placeholder="No decimals"
                        className="h-10 w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Row 3: description */}
                <div className="space-y-2">
                  <Label htmlFor="P_Description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="P_Description"
                    value={form.P_Description || ''}
                    onChange={(e) => !isView && update('P_Description', e.target.value)}
                    disabled={isView}
                    rows={3}
                    className="resize-none"
                    placeholder="Brief description of the project"
                  />
                </div>
              </section>

              <Separator />

              {/* Attachments */}
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Attachments
                  </div>
                  {!isView && (
                    <span className="text-[11px] text-muted-foreground">
                      {files.length + existingAttachments.length > 0
                        ? `${files.length + existingAttachments.length} file(s) linked`
                        : 'No files yet'}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                  {project && (
                    <>
                      {loadingAttachments ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading attachments…
                        </div>
                      ) : existingAttachments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Existing files</p>
                          <ul className="space-y-1.5">
                            {(isView ? existingAttachments : existingAttachments.filter((a) => !attachmentIdsToDelete.includes(a.id))).map((a) => (
                              <li
                                key={a.id}
                                className="flex items-center gap-2 rounded-md bg-background/80 px-3 py-2 text-sm border"
                              >
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate flex-1">{a.name}</span>
                                {!isView && (
                                  <button
                                    type="button"
                                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    onClick={() =>
                                      setAttachmentIdsToDelete((prev) => [...prev, a.id])
                                    }
                                    aria-label={`Remove ${a.name} on save`}
                                    title="Remove on save"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                          {!isView && attachmentIdsToDelete.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                Will be removed on save
                              </p>
                              <ul className="space-y-1">
                                {existingAttachments
                                  .filter((a) => attachmentIdsToDelete.includes(a.id))
                                  .map((a) => (
                                    <li
                                      key={a.id}
                                      className="flex items-center gap-2 rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2 text-sm"
                                    >
                                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      <span className="truncate flex-1">{a.name}</span>
                                      <button
                                        type="button"
                                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
                                        onClick={() =>
                                          setAttachmentIdsToDelete((prev) =>
                                            prev.filter((id) => id !== a.id),
                                          )
                                        }
                                        aria-label={`Keep ${a.name}`}
                                        title="Keep file"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </button>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                          {!isView && <p className="text-xs text-muted-foreground pt-1">Add more files below.</p>}
                        </div>
                      ) : !isView && project ? null : existingAttachments.length === 0 && project ? (
                        <p className="text-xs text-muted-foreground py-1">No attachments.</p>
                      ) : null}
                    </>
                  )}
                  {!isView && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="projectFile" className="text-xs font-medium text-muted-foreground">
                          {project ? 'Add more files' : 'Choose files (optional)'}
                        </Label>
                        <label
                          htmlFor="projectFile"
                          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background/50 px-4 py-6 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                        >
                          <Plus className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to browse or drag files here
                          </span>
                          <Input
                            id="projectFile"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const chosen = e.target.files;
                              if (chosen?.length) setFiles((prev) => [...prev, ...Array.from(chosen)]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {files.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">New files to upload</p>
                      <ul className="space-y-1">
                        {files.map((f, i) => (
                          <li
                            key={`${f.name}-${i}`}
                            className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm border"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate flex-1">{f.name}</span>
                            <button
                              type="button"
                              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                              aria-label={`Remove ${f.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
          <Separator className="shrink-0" />
          <DialogFooter className="shrink-0 px-6 py-4 flex-row justify-end gap-2 bg-muted/20">
            {isView ? (
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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
                      {project ? 'Saving…' : 'Creating project…'}
                    </>
                  ) : (
                    project ? 'Save changes' : 'Create project'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
      {/* Hide native date picker icon so only custom button is visible */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            input[type="date"]::-webkit-calendar-picker-indicator {
              opacity: 0;
            }
          `,
        }}
      />

      {/* Attachment AI verification dialog */}
      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col gap-0 rounded-2xl border shadow-2xl bg-white p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b bg-gradient-to-r from-[#F4F3FF] via-white to-[#F4F3FF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#EBE4FF] flex items-center justify-center text-[#5a3dd4]">
                <Paperclip className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Verifying project attachments
                </h2>
                <p className="text-xs text-slate-500">
                  Our AI is reviewing your files and describing their relevance to this project.
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4 space-y-4">
              {verificationItems.map((item, index) => {
                const isAccepted = item.status === 'accepted';
                const isRejected = item.status === 'rejected';
                const isError = item.status === 'error';
                const isProcessing = item.status === 'processing';

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
                          {!verificationRunning && (
                            <span className="text-[11px] text-slate-400">
                              {Math.round((item.file.size || 0) / 1024)} KB
                            </span>
                          )}
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
                              {isError ? 'Error' : 'Not eligible'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isProcessing && (
                      <p className="text-[11px] leading-relaxed text-slate-600 mt-1">
                        {isError
                          ? item.error
                          : item.description || 'No AI description available.'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="px-6 py-3 border-t bg-slate-50 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              {verificationRunning
                ? 'Verifying files…'
                : (() => {
                    const rejectedCount = verificationItems.filter(
                      (i) => i.status === 'rejected',
                    ).length;
                    if (rejectedCount === 0) {
                      return 'All files look relevant. They will be attached to this project.';
                    }
                    return `${rejectedCount} file(s) were rejected (score below 50) and will not be attached.`;
                  })()}
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
                disabled={verificationRunning}
                onClick={handleConfirmVerification}
                className="bg-[#5a3dd4] hover:bg-[#4a30b5]"
              >
                {verificationRunning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Verifying…
                  </>
                ) : (
                  'Confirm & create project'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
