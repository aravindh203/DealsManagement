import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Insights.module.scss';
import {
    CubeRegular,
    PeopleRegular,
    ShieldCheckmarkRegular,
    MoneyRegular,
    PulseRegular,
    ArrowSyncRegular,
    ArrowUploadRegular,
    DismissRegular,
} from '@fluentui/react-icons';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdminStats, formatBytes } from '../hooks/useAdminStats';
import { useProjects } from '../context/ProjectsContext';
import { getAccessTokenByApp } from '../hooks/useClientCredentialsAuth';
import { appConfig } from '../config/appConfig';
import { sharePointService } from '../services/sharePointService';
import { toast } from '../hooks/use-toast';
import type { Project } from './projectsData';

// Line graph icon for REAL-TIME ACTIVE badge (matches design)
const LineGraphIcon = () => (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.badgeChartIcon}>
        <path d="M1 8L4 5L6 6L9 2L13 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Bell icon for notifications (with red dot)
const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a4.5 4.5 0 0 1 4.5 4.5v2.09a3 3 0 0 0 .66 1.87l.9 1.2a.75.75 0 0 1-.6 1.2H4.54a.75.75 0 0 1-.6-1.2l.9-1.2a3 3 0 0 0 .66-1.87V6.5A4.5 4.5 0 0 1 10 2zm3 12.5a3 3 0 1 1-6 0h6z" fill="currentColor" />
    </svg>
);

type ProjectStatus = 'Not Started' | 'Open' | 'Completed';

const getProjectStatus = (project: Project, now: Date): ProjectStatus => {
    const start = project.P_StartDate ? new Date(project.P_StartDate) : null;
    const end = project.P_EndDate ? new Date(project.P_EndDate) : null;

    if (end && end < now) return 'Completed';
    if (start && start > now) return 'Not Started';
    return 'Open';
};

// ── Component ──────────────────────────────────────────────
const Insights: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const {
        containerCount,
        totalStorageUsedBytes,
        totalStorageTotalBytes,
        containers,
        loading,
        error,
        refetch,
    } = useAdminStats();
    const { projects } = useProjects();
    const [companiesFromUserDetails, setCompaniesFromUserDetails] = useState<string[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);

    const loadCompanies = useCallback(async () => {
        setLoadingCompanies(true);
        try {
            const list = await sharePointService.getAllCompaniesFromUserDetails();
            setCompaniesFromUserDetails(list);
        } catch {
            setCompaniesFromUserDetails([]);
        } finally {
            setLoadingCompanies(false);
        }
    }, []);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const now = new Date();

    const totalProjects = projects.length;
    /** Open count uses P_Status (same as Directory) so the card reflects actual list data. */
    const openProjectsCount = projects.filter((p) => (p.P_Status ?? 'Open') === 'Open').length;

    const latestUpdates = useMemo(
        () => {
            const items = projects
                .map((project) => {
                    const dateStr =
                        project.P_StartDate ||
                        project.V_BidSubmissionDate ||
                        project.P_EndDate ||
                        project.P_VendorSubmissionDueDate ||
                        null;
                    if (!dateStr) return null;
                    return { project, date: new Date(dateStr) };
                })
                .filter(
                    (x): x is { project: Project; date: Date } =>
                        x !== null
                )
                .sort((a, b) => b.date.getTime() - a.date.getTime());
            return items.slice(0, 5);
        },
        [projects]
    );

    /** Top Vendors: companies from UserDetails; project count static (0) for now, will be dynamic later. */
    const topVendors = useMemo(
        () =>
            companiesFromUserDetails.map((company) => ({
                company,
                count: 0,
            })),
        [companiesFromUserDetails]
    );

    // Format storage for display
    const usedFormatted = formatBytes(totalStorageUsedBytes);
    const totalFormatted = formatBytes(totalStorageTotalBytes);
    const storagePercent = totalStorageTotalBytes > 0
        ? Math.round((totalStorageUsedBytes / totalStorageTotalBytes) * 100)
        : 0;

    return (
        <div className={styles.page}>
            {/* ── Top Navigation ── */}
            <nav className={styles.topNav}>
                <div className={styles.navLeft}>
                    <span className={styles.logo}>Insights</span>
                    <div className={styles.badge}>
                        <LineGraphIcon />
                        <span>REAL-TIME ACTIVE</span>
                    </div>
                </div>

                <div className={styles.navRight}>
                    <button className={styles.navIconBtn} onClick={refetch} title="Refresh stats">
                        <ArrowUploadRegular />
                    </button>
                    <button
                        type="button"
                        className={styles.logoutBtn}
                        onClick={() => { logout(); navigate('/login'); }}
                        title="Logout"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            {/* ── Main Content ── */}
            <main className={styles.main}>
                {/* Static: Page Header + Stat Cards */}
                <div className={styles.mainStatic}>
                    <div className={styles.pageHeader}>
                        <div className={styles.titleGroup}>
                            <span className={styles.overline}>OPERATIONS MANAGEMENT</span>
                            <h1 className={styles.pageTitle}>Workspace Alpha</h1>
                        </div>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className={styles.statsRow}>
                        {/* Fiscal Revenue – dark card */}
                        <div className={`${styles.card} ${styles.cardDark}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxDark}`}>
                                    <MoneyRegular />
                                </div>
                                <span className={styles.trendChip}>+12.5%</span>
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>FISCAL REVENUE</span>
                                <h2 className={styles.cardValue}>$1.24M</h2>
                            </div>
                        </div>

                        {/* Cluster Storage – LIVE DATA */}
                        <div className={`${styles.card} ${styles.cardLight}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                                    <CubeRegular />
                                </div>
                                {loading && (
                                    <ArrowSyncRegular
                                        style={{ color: '#6B47E5', fontSize: 16, animation: 'spin 1s linear infinite' }}
                                    />
                                )}
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>CLUSTER STORAGE</span>
                                {error ? (
                                    <h2 className={styles.cardValue} style={{ fontSize: 20, color: '#e74c3c' }}>Error</h2>
                                ) : loading ? (
                                    <h2 className={styles.cardValue} style={{ fontSize: 24 }}>Loading…</h2>
                                ) : (
                                    <>
                                        <h2 className={styles.cardValue}>{usedFormatted}</h2>
                                        <span className={styles.cardSub}>
                                            of 2 TB limit
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Total Projects */}
                        <div className={`${styles.card} ${styles.cardLight}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                                    <PeopleRegular />
                                </div>
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>TOTAL PROJECTS</span>
                                {loading ? (
                                    <h2 className={`${styles.cardValue} ${styles.cardValuePurple}`} style={{ fontSize: 24 }}>…</h2>
                                ) : (
                                    <>
                                        <h2 className={`${styles.cardValue} ${styles.cardValuePurple}`}>{totalProjects}</h2>
                                        <span className={styles.cardSub}>Projects in directory</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Open Projects */}
                        <div className={`${styles.card} ${styles.cardPurple}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxPurple}`}>
                                    <ShieldCheckmarkRegular />
                                </div>
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>OPEN PROJECT</span>
                                <h2 className={styles.cardValue}>{openProjectsCount}</h2>
                                <span className={styles.cardSub}>Currently active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Scrollable: Audit Protocol + Cluster Vitals ── */}
                <div className={styles.mainScroll}>
                    {/* ── Bottom Section ── */}
                    <div className={styles.bottomSection}>
                        {/* Audit Protocol */}
                        <div className={styles.auditCard}>
                            <div className={styles.auditHeader}>
                                <h3 className={styles.auditTitle}>Audit Protocol - Latest Updates</h3>
                                <a href="#" className={styles.historyLink}>Full History</a>
                            </div>

                            <table className={styles.auditTable}>
                                <thead className={styles.auditTableHead}>
                                    <tr>
                                        <th>Project name</th>
                                        <th>Date</th>
                                        <th>Budget</th>
                                        <th>Bid amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody className={styles.auditTableBody}>
                                    {latestUpdates.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ color: '#b0b5c8', fontSize: 12, paddingTop: 16 }}>
                                                No recent project updates.
                                            </td>
                                        </tr>
                                    ) : (
                                        latestUpdates.map(({ project, date }, idx) => {
                                            const status = project.P_Status ?? 'Open';
                                            const statusClass =
                                                status === 'Open'
                                                    ? `${styles.chip} ${styles.chipActive}`
                                                    : status === 'Completed'
                                                        ? `${styles.chip} ${styles.chipSuccess}`
                                                        : styles.chip;
                                            const initial = project.P_Name ? project.P_Name.charAt(0).toUpperCase() : '?';

                                            return (
                                                <tr key={idx}>
                                                    <td>
                                                        <div className={styles.entityCell}>
                                                            <div className={styles.avatar}>{initial}</div>
                                                            <div className={styles.entityInfo}>
                                                                <span className={styles.entityName}>{project.P_Name || '—'}</span>
                                                                <span className={styles.entityRole}>{project.P_Type || 'Project'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={styles.timeCell}>{date.toLocaleDateString()}</td>
                                                    <td>{project.P_Budget ? `$${project.P_Budget}` : '—'}</td>
                                                    <td>{project.V_BidAmount != null && String(project.V_BidAmount).trim() !== '' ? `$${project.V_BidAmount}` : '—'}</td>
                                                    <td className={styles.verificationCell}>
                                                        <span className={statusClass}>{status}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

                            {/* Container Details Table */}
                            {!loading && !error && containerCount > 0 && (
                                <div className={styles.containerSection}>
                                    <div className={styles.containerSectionHeader}>
                                        <span className={styles.containerSectionTitle}>Container Storage Breakdown</span>
                                        <button className={styles.refetchBtn} onClick={refetch}>
                                            <ArrowSyncRegular /> Refresh
                                        </button>
                                    </div>
                                    <table className={styles.auditTable} style={{ marginTop: 8 }}>
                                        <thead className={styles.auditTableHead}>
                                            <tr>
                                                <th>Container</th>
                                                <th>Storage Used</th>
                                                <th>Quota (Available)</th>
                                            </tr>
                                        </thead>
                                        <tbody className={styles.auditTableBody}>
                                            {containers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} style={{ color: '#b0b5c8', fontSize: 12, paddingTop: 16 }}>
                                                        No containers found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                <>
                                                    {containers.map((c) => {
                                                        const availableBytes = Math.max(c.totalBytes - c.usedBytes, 0);
                                                        return (
                                                            <tr key={c.id}>
                                                                <td>{c.name}</td>
                                                                <td>{formatBytes(c.usedBytes)}</td>
                                                                <td>{formatBytes(availableBytes)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr>
                                                        <td colSpan={3} style={{ color: '#b0b5c8', fontSize: 12, paddingTop: 16 }}>
                                                            {containerCount} container{containerCount !== 1 ? 's' : ''} · Total used: {usedFormatted}
                                                            {totalStorageTotalBytes > 0 ? ` of ${totalFormatted} (${storagePercent}%)` : ''}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {error && (
                                <p style={{ color: '#e74c3c', fontSize: 12, marginTop: 16 }}>
                                    ⚠ Could not load storage data: {error}
                                </p>
                            )}
                        </div>

                        {/* Top Vendors (Projects) */}
                        <div className={styles.vitalsCard}>
                            <div className={styles.vitalsHeader}>
                                <h3 className={styles.vitalsTitle}>Top Vendors (Projects)</h3>
                                <PulseRegular className={styles.pulseIcon} />
                            </div>

                            {loadingCompanies ? (
                                <p style={{ color: '#b0b5c8', fontSize: 12, marginTop: 8 }}>
                                    Loading companies…
                                </p>
                            ) : topVendors.length === 0 ? (
                                <p style={{ color: '#b0b5c8', fontSize: 12, marginTop: 8 }}>
                                    No vendor data available yet.
                                </p>
                            ) : (
                                topVendors.map((v, idx) => {
                                    const maxCount = Math.max(1, ...topVendors.map((x) => x.count));
                                    const fill = maxCount > 0 ? Math.round((v.count / maxCount) * 100) : 0;
                                    const isPrimary = idx < 2;
                                    return (
                                        <div key={v.company} className={styles.vitalRow}>
                                            <div className={styles.vitalMeta}>
                                                <span className={styles.vitalLabel}>{v.company}</span>
                                                <span
                                                    className={
                                                        isPrimary ? styles.vitalValueGreen : styles.vitalValuePurple
                                                    }
                                                >
                                                    {v.count} project{v.count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className={styles.progressTrack}>
                                                <div
                                                    className={
                                                        isPrimary ? styles.progressBarGreen : styles.progressBarPurple
                                                    }
                                                    style={{ width: `${fill}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
};

export default Insights;
