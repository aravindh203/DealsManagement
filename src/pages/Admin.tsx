import React, { useState } from 'react';
import styles from './Admin.module.scss';
import {
    AddRegular,
    SearchRegular,
    ArrowUploadRegular,
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
const Admin: React.FC = () => {
    const { containerCount, totalStorageUsedBytes, totalStorageTotalBytes, loading, error, refetch } = useAdminStats();
    const [panelOpen, setPanelOpen] = useState(false);

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
                        <div className={styles.badgeDot} />
                        Real-time Active
                    </div>
                </div>

                <div className={styles.navRight}>
                    <div className={styles.searchBar}>
                        <SearchRegular className={styles.searchIcon} />
                        <input type="text" placeholder="Search resources..." />
                    </div>
                    <button className={styles.navIconBtn} onClick={refetch} title="Refresh stats">
                        <ArrowUploadRegular />
                    </button>
                </div>
            </nav>

            {/* ── Main Content ── */}
            <main className={styles.main}>
                {/* Page Header */}
                <div className={styles.pageHeader}>
                    <div className={styles.titleGroup}>
                        <span className={styles.overline}>Operations Management</span>
                        <h1 className={styles.pageTitle}>Workspace Alpha</h1>
                    </div>
                    <button className={styles.newResourceBtn} onClick={() => setPanelOpen(true)}>
                        <AddRegular />
                        + New Resource
                    </button>
                </div>

                {/* ── Stat Cards ── */}
                <div className={styles.statsRow}>
                    {/* Revenue */}
                    <div className={`${styles.card} ${styles.cardDark}`}>
                        <div className={styles.cardTop}>
                            <div className={`${styles.iconBox} ${styles.iconBoxDark}`}>
                                <MoneyRegular />
                            </div>
                            <span className={styles.trendChip}>+0.5%</span>
                        </div>
                        <div className={styles.cardBottom}>
                            <span className={styles.cardLabel}>Fiscal Revenue</span>
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
                                    style={{ color: '#6558f5', fontSize: 16, animation: 'spin 1s linear infinite' }}
                                />
                            )}
                        </div>
                        <div className={styles.cardBottom}>
                            <span className={styles.cardLabel}>Container  Usage</span>
                            {error ? (
                                <h2 className={styles.cardValue} style={{ fontSize: 20, color: '#e74c3c' }}>Error</h2>
                            ) : loading ? (
                                <h2 className={styles.cardValue} style={{ fontSize: 24 }}>Loading…</h2>
                            ) : (
                                <>
                                    <h2 className={styles.cardValue}>{usedFormatted}</h2>
                                    <span className={styles.cardSub}>
                                        {/* {totalStorageTotalBytes > 0
                                            ? `${storagePercent}% of ${totalFormatted}`
                                            : `${containerCount} container${containerCount !== 1 ? 's' : ''}`} */}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Active Sessions – container count as live proxy */}
                    <div className={`${styles.card} ${styles.cardLight}`}>
                        <div className={styles.cardTop}>
                            <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                                <PeopleRegular />
                            </div>
                        </div>
                        <div className={styles.cardBottom}>
                            <span className={styles.cardLabel}>Active Containers</span>
                            {loading ? (
                                <h2 className={styles.cardValue} style={{ fontSize: 24 }}>…</h2>
                            ) : (
                                <>
                                    <h2 className={styles.cardValue}>{containerCount}</h2>
                                    <span className={styles.cardSub}>SharePoint Embedded</span>
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
                            <span className={styles.cardLabel}>Security Score</span>
                            <h2 className={styles.cardValue}>98.4%</h2>
                            <span className={styles.cardSub}>Verified Status</span>
                        </div>
                    </div>
                </div>

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
                                        {/* We re-use the hook data via context — displayed rows come from useAdminStats containers */}
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

                        {/* Storage vital – live */}
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
            </main>

            {/* ── Create Container Panel ── */}
            {panelOpen && (
                <>
                    {/* Backdrop */}
                    <div className={styles.backdrop} onClick={() => setPanelOpen(false)} />

                    {/* Slide-over panel */}
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
        </div>
    );
};

export default Admin;
