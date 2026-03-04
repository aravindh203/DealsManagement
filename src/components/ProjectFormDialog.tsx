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
import { Project, ProjectStatus } from '@/pages/projectsData';

const STATUS_OPTIONS: ProjectStatus[] = ['ACTIVE', 'TRIAL', 'PENDING'];

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null; // null = create, otherwise edit
  onSave: (data: Omit<Project, 'id'>) => void;
}

const emptyForm: Omit<Project, 'id'> = {
  name: '',
  location: '',
  address: '',
  expected: '',
  endDate: '',
  duration: '',
  status: 'ACTIVE',
};

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSave,
}) => {
  const [form, setForm] = useState<Omit<Project, 'id'>>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        project
          ? {
              name: project.name,
              location: project.location,
              address: project.address,
              expected: project.expected,
              endDate: project.endDate,
              duration: project.duration,
              status: project.status,
            }
          : { ...emptyForm }
      );
    }
  }, [open, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  const update = (key: keyof Omit<Project, 'id'>, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Head Office Renovation"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. New York, NY"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Full address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected">Expected date</Label>
              <Input
                id="expected"
                value={form.expected}
                onChange={(e) => update('expected', e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Project duration</Label>
            <Input
              id="duration"
              value={form.duration}
              onChange={(e) => update('duration', e.target.value)}
              placeholder="e.g. 6 months"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => update('status', e.target.value as ProjectStatus)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
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
