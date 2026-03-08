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
} from 'lucide-react';

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
  onLoadExistingAttachments,
}) => {
  const mode: ProjectDialogMode = modeProp ?? (project ? 'edit' : 'create');
  const isView = mode === 'view';

  const [form, setForm] = useState<Omit<Project, 'id'>>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState<string[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isView || !onSave) return;
    if (!form.P_Name?.trim()) return;
    onSave(
      form,
      files.length > 0 ? files : null,
      attachmentIdsToDelete.length > 0 ? attachmentIdsToDelete : undefined,
    );
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl border shadow-xl">
        <DialogHeader className="shrink-0 px-6 py-5 pb-4 border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
            <div className="p-6 space-y-6">
              {/* Project details */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Project details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="P_Name" className="text-sm font-medium">Project name *</Label>
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
                    <Label htmlFor="P_Type" className="text-sm font-medium">Project type</Label>
                    <Input
                      id="P_Type"
                      value={form.P_Type || ''}
                      onChange={(e) => !isView && update('P_Type', e.target.value)}
                      disabled={isView}
                      className="h-10"
                      placeholder="e.g. Renovation, SPFX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="P_Description" className="text-sm font-medium">Description</Label>
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

              {!isVendor && (
                <>
                  {/* Schedule */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Schedule
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="P_StartDate" className="text-sm font-medium">Start date</Label>
                        <Input
                          id="P_StartDate"
                          type="date"
                          value={formatDateForInput(form.P_StartDate)}
                          onChange={(e) => !isView && handleDateChange("P_StartDate", e.target.value)}
                          disabled={isView}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="P_EndDate" className="text-sm font-medium">End date</Label>
                        <Input
                          id="P_EndDate"
                          type="date"
                          value={formatDateForInput(form.P_EndDate)}
                          onChange={(e) => !isView && handleDateChange("P_EndDate", e.target.value)}
                          disabled={isView}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </section>
                  <Separator />
                </>
              )}

              {/* Bid window */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Bid start / end date
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="P_BidStartDate" className="text-sm font-medium">Bid start date</Label>
                    <Input
                      id="P_BidStartDate"
                      type="date"
                      value={formatDateForInput(form.P_BidStartDate)}
                      onChange={(e) => !isView && handleDateChange("P_BidStartDate", e.target.value)}
                      disabled={isView}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="P_BidEndDate" className="text-sm font-medium">Bid end date</Label>
                    <Input
                      id="P_BidEndDate"
                      type="date"
                      value={formatDateForInput(form.P_BidEndDate)}
                      onChange={(e) => !isView && handleDateChange("P_BidEndDate", e.target.value)}
                      disabled={isView}
                      className="h-10"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {!isVendor && (
                <>
                  {/* Budget */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Budget
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="P_Budget" className="text-sm font-medium">Budget</Label>
                        <Input
                          id="P_Budget"
                          value={form.P_Budget || ""}
                          onChange={(e) => !isView && handleDigitChange("P_Budget", e.target.value)}
                          disabled={isView}
                          placeholder="No decimals"
                          className="h-10 w-full"
                        />
                      </div>
                    </div>
                  </section>
                  <Separator />
                </>
              )}

              {/* Attachments */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Attachments
                </div>
                <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
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
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {project ? 'Save changes' : 'Create project'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
