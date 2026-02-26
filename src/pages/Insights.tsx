import React, { useState } from 'react';
import styles from './Insights.module.scss';
import {
    AddRegular,
    SearchRegular,
    CubeRegular,
    PeopleRegular,
    ShieldCheckmarkRegular,
    MoneyRegular,
    PulseRegular,
    ArrowSyncRegular,
    DismissRegular,
} from '@fluentui/react-icons';
import { useAdminStats, formatBytes } from '../hooks/useAdminStats';
import { CreateContainerForm } from '../components/CreateContainerForm';
import { CreateFolderForm } from '../components/CreateFolderForm';

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

// ── Types ──────────────────────────────────────────────────
interface AuditEntry {
    time: string;
    initial: string;
    name: string;
    role: string;
    status: 'success' | 'active';
}

// ── Static audit data ──────────────────────────────────────
const auditData: AuditEntry[] = [
    { time: '14:41:01', initial: 'M', name: 'Marcus Wright', role: 'Identity Validation', status: 'success' },
    { time: '13:30:12', initial: 'A', name: 'Automated Sync', role: 'Cluster Balancing', status: 'active' },
    { time: '12:15:58', initial: 'S', name: 'Sarah Chen', role: 'Security Overhaul', status: 'success' },
];

const vitals = [
    { label: 'Gateway Latency', value: '12ms', valueClass: 'green', barClass: 'green', fill: 72 },
    { label: 'Storage Yield', value: 'Active', valueClass: 'green', barClass: 'green', fill: 42 },
    { label: 'Security Logic', value: 'Encrypted', valueClass: 'purple', barClass: 'purple', fill: 100 },
];

// ── Component ──────────────────────────────────────────────
const Insights: React.FC = () => {
    const { containerCount, totalStorageUsedBytes, totalStorageTotalBytes, loading, error, refetch } = useAdminStats();
    const [panelOpen, setPanelOpen] = useState(false);
    const [FolderpanelOpen, setFolderPanelOpen] = useState(false);

    const handleCreateSuccess = (_containerId?: string) => {
        setPanelOpen(false);
        refetch();
    };

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
                    <div className={styles.searchBar}>
                        <SearchRegular className={styles.searchIcon} />
                        <input type="text" placeholder="Search resources..." />
                    </div>
                    <button className={styles.navIconBtn} title="Notifications">
                        <span className={styles.bellWrapper}>
                            <BellIcon />
                            <span className={styles.notifDot} />
                        </span>
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
                        <button className={styles.newResourceBtn} onClick={() => setPanelOpen(true)}>
                            <AddRegular />
                            NEW RESOURCE
                        </button>
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

                    {/* Active Sessions */}
                    <div className={`${styles.card} ${styles.cardLight}`}>
                        <div className={styles.cardTop}>
                            <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                                <PeopleRegular />
                            </div>
                        </div>
                        <div className={styles.cardBottom}>
                            <span className={styles.cardLabel}>ACTIVE SESSIONS</span>
                            {loading ? (
                                <h2 className={`${styles.cardValue} ${styles.cardValuePurple}`} style={{ fontSize: 24 }}>…</h2>
                            ) : (
                                <>
                                    <h2 className={`${styles.cardValue} ${styles.cardValuePurple}`}>{containerCount}</h2>
                                    <span className={styles.cardSub}>Live interactions</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Security Score */}
                    <div className={`${styles.card} ${styles.cardPurple}`}>
                        <div className={styles.cardTop}>
                            <div className={`${styles.iconBox} ${styles.iconBoxPurple}`}>
                                <ShieldCheckmarkRegular />
                            </div>
                        </div>
                        <div className={styles.cardBottom}>
                            <span className={styles.cardLabel}>SECURITY SCORE</span>
                            <h2 className={styles.cardValue}>98.4%</h2>
                            <span className={styles.cardSub}>Verified Status</span>
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
                            <h3 className={styles.auditTitle}>Audit Protocol</h3>
                            <a href="#" className={styles.historyLink}>Full History</a>
                        </div>

                        <table className={styles.auditTable}>
                            <thead className={styles.auditTableHead}>
                                <tr>
                                    <th>Time</th>
                                    <th>Entity</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className={styles.auditTableBody}>
                                {auditData.map((entry, idx) => (
                                    <tr key={idx}>
                                        <td className={styles.timeCell}>{entry.time}</td>
                                        <td>
                                            <div className={styles.entityCell}>
                                                <div className={styles.avatar}>{entry.initial}</div>
                                                <div className={styles.entityInfo}>
                                                    <span className={styles.entityName}>{entry.name}</span>
                                                    <span className={styles.entityRole}>{entry.role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.verificationCell}>
                                            <span
                                                className={
                                                    entry.status === 'active'
                                                        ? `${styles.chip} ${styles.chipActive}`
                                                        : `${styles.chip} ${styles.chipSuccess}`
                                                }
                                            >
                                                {entry.status === 'active' ? 'Active' : 'Success'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
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
                                            <th>Quota</th>
                                        </tr>
                                    </thead>
                                    <tbody className={styles.auditTableBody}>
                                        <tr>
                                            <td colSpan={3} style={{ color: '#b0b5c8', fontSize: 12, paddingTop: 16 }}>
                                                {containerCount} container{containerCount !== 1 ? 's' : ''} · Total used: {usedFormatted}
                                                {totalStorageTotalBytes > 0 ? ` of ${totalFormatted} (${storagePercent}%)` : ''}
                                            </td>
                                        </tr>
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

                    {/* Cluster Vitals */}
                    <div className={styles.vitalsCard}>
                        <div className={styles.vitalsHeader}>
                            <h3 className={styles.vitalsTitle}>Cluster Vitals</h3>
                            <PulseRegular className={styles.pulseIcon} />
                        </div>

                        {vitals.map((v, idx) => (
                            <div key={idx} className={styles.vitalRow}>
                                <div className={styles.vitalMeta}>
                                    <span className={styles.vitalLabel}>{v.label}</span>
                                    <span
                                        className={
                                            v.valueClass === 'green' ? styles.vitalValueGreen : styles.vitalValuePurple
                                        }
                                    >
                                        {v.value}
                                    </span>
                                </div>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={
                                            v.barClass === 'green' ? styles.progressBarGreen : styles.progressBarPurple
                                        }
                                        style={{ width: `${v.fill}%` }}
                                    />
                                </div>
                            </div>
                        ))}

                        {!loading && totalStorageTotalBytes > 0 && (
                            <div className={styles.vitalRow}>
                                <div className={styles.vitalMeta}>
                                    <span className={styles.vitalLabel}>Cluster Storage</span>
                                    <span className={styles.vitalValueGreen}>{usedFormatted}</span>
                                </div>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressBarGreen}
                                        style={{ width: `${storagePercent}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <button className={styles.diagnosticsBtn} onClick={refetch}>
                            Execute Diagnostics
                        </button>
                    </div>
                </div>
                </div>
            </main>

            {/* ── Create Container Panel ── */}
            {panelOpen && (
                <>
                    <div className={styles.backdrop} onClick={() => setPanelOpen(false)} />
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h2 className={styles.panelTitle}>New Container</h2>
                            <button className={styles.panelClose} onClick={() => setPanelOpen(false)}>
                                <DismissRegular />
                            </button>
                        </div>
                        <p className={styles.panelSubtitle}>
                            Create a new SharePoint Embedded container with a display name, description, and administrator.
                        </p>
                        <div className={styles.panelBody}>
                            <CreateContainerForm
                                onSuccess={handleCreateSuccess}
                                onCancel={() => setPanelOpen(false)}
                            />
                        </div>
                    </div>
                </>
            )}

            {FolderpanelOpen && (
                <>
                    <div className={styles.backdrop} onClick={() => setFolderPanelOpen(false)} />
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h2 className={styles.panelTitle}>New Container</h2>
                            <button className={styles.panelClose} onClick={() => setFolderPanelOpen(false)}>
                                <DismissRegular />
                            </button>
                        </div>
                        <p className={styles.panelSubtitle}>
                            Create a new SharePoint Embedded container with a display name, description, and administrator.
                        </p>
                        <div className={styles.panelBody}>
                            <CreateFolderForm
                                onSuccess={handleCreateSuccess}
                                onCancel={() => setFolderPanelOpen(false)}
                            />
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default Insights;
