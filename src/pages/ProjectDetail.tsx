import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { ProjectFormDialog } from '../components/ProjectFormDialog';
import { Button } from '@/components/ui/button';
import { Project } from './projectsData';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getProjectById, updateProject } = useProjects();
    const [editOpen, setEditOpen] = useState(false);

    if (!id) {
        return <Navigate to="/directory" replace />;
    }

    const project = getProjectById(id);

    if (!project) {
        return <Navigate to="/directory" replace />;
    }

    const handleSaveEdit = (data: Omit<Project, 'id'>, files?: File[] | null, attachmentIdsToDelete?: string[]) => {
        updateProject(project.id!, data);
        setEditOpen(false);
    };

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <Link to="/directory" style={{ color: '#2563eb', fontWeight: 600 }}>
                    &larr; Back to Project Directory
                </Link>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                    Edit project
                </Button>
            </div>

            <ProjectFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                project={project}
                onSave={handleSaveEdit}
            />

            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>{project.P_Name}</h1>
            <p style={{ marginBottom: '24px', color: '#4b5563' }}>Detailed information for this project.</p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    maxWidth: '960px',
                }}
            >
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Type
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.P_Type || '-'}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Start Date
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.P_StartDate ? new Date(project.P_StartDate).toLocaleDateString() : '-'}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        End Date
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.P_EndDate ? new Date(project.P_EndDate).toLocaleDateString() : '-'}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Budget
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.P_Budget ? `$${project.P_Budget}` : '-'}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Used Budget
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.P_UsedBudget ? `$${project.P_UsedBudget}` : '-'}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Vendor Email
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.V_SubmittedByEmail || '-'}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Bid Amount
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.V_BidAmount ? `$${project.V_BidAmount}` : '-'}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Bid Submission
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.V_BidSubmissionDate ? new Date(project.V_BidSubmissionDate).toLocaleDateString() : '-'}</p>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;

