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
import { Project } from '@/pages/projectsData';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null; // null = create, otherwise edit
  onSave: (data: Extract<Omit<Project, 'id'>, object>, file?: File | null) => void;
}

const emptyForm: Omit<Project, 'id'> = {
  P_Name: '',
  P_Description: '',
  P_StartDate: null,
  P_EndDate: null,
  P_Type: '',
  V_SubmittedByEmail: '',
  V_BidSubmissionDate: null,
  V_BidDescription: '',
  V_BidAmount: '',
  P_VendorSubmissionDueDate: null,
  P_Budget: '',
};

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSave,
}) => {
  const [form, setForm] = useState<Omit<Project, 'id'>>(emptyForm);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      if (project) {
        // Strip out id so we're strictly editing form fields
        const { id, ...rest } = project;
        setForm(rest);
      } else {
        setForm({ ...emptyForm });
      }
    }
  }, [open, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.P_Name?.trim()) return;
    onSave(form, file);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="P_Name">Project Name *</Label>
                <Input
                  id="P_Name"
                  value={form.P_Name || ''}
                  onChange={(e) => update('P_Name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="P_Type">Project Type</Label>
                <Input
                  id="P_Type"
                  value={form.P_Type || ''}
                  onChange={(e) => update('P_Type', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="P_Description">Project Description</Label>
              <Textarea
                id="P_Description"
                value={form.P_Description || ''}
                onChange={(e) => update('P_Description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="P_StartDate">Start Date</Label>
                <Input
                  id="P_StartDate"
                  type="date"
                  value={formatDateForInput(form.P_StartDate)}
                  onChange={(e) =>
                    handleDateChange("P_StartDate", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="P_EndDate">End Date</Label>
                <Input
                  id="P_EndDate"
                  type="date"
                  value={formatDateForInput(form.P_EndDate)}
                  onChange={(e) =>
                    handleDateChange("P_EndDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="P_Budget">Budget</Label>
                <Input
                  id="P_Budget"
                  value={form.P_Budget || ""}
                  onChange={(e) =>
                    handleDigitChange("P_Budget", e.target.value)
                  }
                  placeholder="No decimals allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectFile">Attachment (optional)</Label>
                <Input
                  id="projectFile"
                  type="file"
                  onChange={(e) =>
                    setFile(e.target.files && e.target.files[0]
                      ? e.target.files[0]
                      : null)
                  }
                />
                {file && (
                  <p className="text-xs text-muted-foreground truncate">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>

          </div>
          <DialogFooter className="px-6 py-4 border-t mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{project ? 'Save changes' : 'Create project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
