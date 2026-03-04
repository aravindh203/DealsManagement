import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { ProjectFormDialog } from '../components/ProjectFormDialog';
import { Button } from '@/components/ui/button';
import { Project } from './projectsData';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const projectId = Number(id);
    const { getProjectById, updateProject } = useProjects();
    const [editOpen, setEditOpen] = useState(false);

    if (Number.isNaN(projectId)) {
        return <Navigate to="/directory" replace />;
    }

    const project = getProjectById(projectId);

    if (!project) {
        return <Navigate to="/directory" replace />;
    }

    const handleSaveEdit = (data: Omit<Project, 'id'>) => {
        updateProject(projectId, data);
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

            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>{project.name}</h1>
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
                        Location
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.location}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Address
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.address}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Expected
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.expected}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        End Date
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.endDate}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Project Duration
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.duration}</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Status
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.status}</p>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;

