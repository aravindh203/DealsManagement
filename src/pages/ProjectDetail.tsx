import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';
import { ProjectFormDialog } from '../components/ProjectFormDialog';
import { Button } from '@/components/ui/button';
import { Project } from './projectsData';
import { getAccessTokenByApp } from '../hooks/useClientCredentialsAuth';
import { appConfig } from '../config/appConfig';
import { sharePointService } from '../services/sharePointService';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getProjectById, updateProject } = useProjects();
    const { loginType, vendorUser } = useAuth();
    const isVendor = loginType === 'vendor';
    const [editOpen, setEditOpen] = useState(false);
    const [companyBidAmount, setCompanyBidAmount] = useState<string | null>(null);

    const project = id ? getProjectById(id) : undefined;

    useEffect(() => {
        if (!isVendor || !vendorUser?.username || !project?.id) {
            setCompanyBidAmount(null);
            return;
        }
        let cancelled = false;
        (async () => {
            const company = await sharePointService.getVendorCompanyFromUserDetails(vendorUser.username);
            const companyName = company ?? vendorUser.username;
            const token = await getAccessTokenByApp();
            if (!token || cancelled) return;
            const amount = await sharePointService.getCompanyFolderBidAmount(
                token,
                appConfig.ContainerID,
                String(project.id),
                companyName,
            );
            if (!cancelled) setCompanyBidAmount(amount);
        })();
        return () => { cancelled = true; };
    }, [isVendor, vendorUser?.username, project?.id]);

    if (!id) {
        return <Navigate to="/projects" replace />;
    }

    if (!project) {
        return <Navigate to="/projects" replace />;
    }

    const handleSaveEdit = (data: Omit<Project, 'id'>, files?: File[] | null, attachmentIdsToDelete?: string[]) => {
        updateProject(project.id!, data);
        setEditOpen(false);
    };

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <Link to="/projects" style={{ color: '#2563eb', fontWeight: 600 }}>
                    &larr; Back to Project
                </Link>
                {!isVendor && (
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                        Edit project
                    </Button>
                )}
            </div>

            {!isVendor && (
                <ProjectFormDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    project={project}
                    onSave={handleSaveEdit}
                />
            )}

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

                {isVendor ? (
                    <>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>Bid Start Date</h2>
                            <p style={{ fontSize: '14px' }}>{project.P_BidStartDate ? new Date(project.P_BidStartDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>Bid End Date</h2>
                            <p style={{ fontSize: '14px' }}>{project.P_BidEndDate ? new Date(project.P_BidEndDate).toLocaleDateString() : '-'}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>Start Date</h2>
                            <p style={{ fontSize: '14px' }}>{project.P_StartDate ? new Date(project.P_StartDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>End Date</h2>
                            <p style={{ fontSize: '14px' }}>{project.P_EndDate ? new Date(project.P_EndDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>Budget</h2>
                            <p style={{ fontSize: '14px' }}>{project.P_Budget ? `$${project.P_Budget}` : '-'}</p>
                        </div>
                    </>
                )}

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                        Company
                    </h2>
                    <p style={{ fontSize: '14px' }}>{project.P_Company ?? '-'}</p>
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

                {isVendor && (
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                            Your company bid amount
                        </h2>
                        <p style={{ fontSize: '14px' }}>{companyBidAmount != null ? (companyBidAmount ? `$${companyBidAmount}` : '-') : '…'}</p>
                    </div>
                )}

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

