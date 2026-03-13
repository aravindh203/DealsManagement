import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Analytics.module.scss';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectsContext';
import type { Project } from './projectsData';

const Analytics: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { projects } = useProjects();

    const totalProjects = projects.length;

    const statusBuckets = useMemo(() => {
        const buckets: Record<string, number> = {
            Open: 0,
            'Yet to start': 0,
            Pending: 0,
            Completed: 0,
        };
        projects.forEach((p) => {
            const key = p.P_Status ?? 'Open';
            if (buckets[key] !== undefined) buckets[key] += 1;
        });
        return buckets;
    }, [projects]);

    const budgetVsBid = useMemo(() => {
        let totalBudget = 0;
        let totalBid = 0;
        projects.forEach((p) => {
            const b = Number(p.P_Budget ?? 0);
            const bid = Number(p.V_BidAmount ?? 0);
            if (!Number.isNaN(b)) totalBudget += b;
            if (!Number.isNaN(bid)) totalBid += bid;
        });
        return { totalBudget, totalBid };
    }, [projects]);

    const vendorShare = useMemo(() => {
        const counts: Record<string, number> = {};
        projects.forEach((p) => {
            const v = (p.V_BidDescription ?? '').toString().trim();
            if (!v) return;
            counts[v] = (counts[v] ?? 0) + 1;
        });
        const entries = Object.entries(counts);
        const total = entries.reduce((acc, [, v]) => acc + v, 0);
        return { entries, total };
    }, [projects]);

    return (
        <div className={styles.page}>
            <nav className={styles.topNav}>
                <div className={styles.navLeft}>
                    <span className={styles.logo}>Analytics</span>
                </div>
                <div className={styles.navRight}>
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

            <main className={styles.main}>
                <div className={styles.mainScroll}>
                    {/* Bar chart: projects by status */}
                    <section className={styles.reportsOverview}>
                        <div className={styles.reportGrid}>
                            {Object.entries(statusBuckets).map(([status, count]) => {
                                const max = Math.max(...Object.values(statusBuckets));
                                const width = max > 0 ? Math.round((count / max) * 100) : 0;
                                return (
                                    <div key={status} className={styles.reportCard}>
                                        <h3 className={styles.reportCardTitle}>{status}</h3>
                                        <p className={styles.reportCardDesc}>
                                            {count} project{count !== 1 ? 's' : ''}
                                        </p>
                                        <div className={styles.progressTrack}>
                                            <div
                                                className={styles.progressBarPrimary}
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Wave / line style: budget vs bid */}
                    <section className={styles.customQuery}>
                        <h2 className={styles.sectionTitle}>Budget vs. vendor bids</h2>
                        <div className={styles.waveRow}>
                            <div className={styles.waveLabelGroup}>
                                <span className={styles.waveLabel}>Total budget</span>
                                <span className={styles.waveValue}>
                                    {budgetVsBid.totalBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className={styles.waveChart}>
                                <div className={styles.waveTrack}>
                                    <div
                                        className={styles.waveFillBudget}
                                        style={{
                                            width: '100%',
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={styles.waveLabelGroup}>
                                <span className={styles.waveLabel}>Total bids</span>
                                <span className={styles.waveValue}>
                                    {budgetVsBid.totalBid.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className={styles.waveChart}>
                                <div className={styles.waveTrack}>
                                    <div
                                        className={styles.waveFillBid}
                                        style={{
                                            width:
                                                budgetVsBid.totalBudget > 0
                                                    ? `${Math.min(
                                                        100,
                                                        Math.round(
                                                            (budgetVsBid.totalBid / budgetVsBid.totalBudget) * 100,
                                                        ),
                                                    )}%`
                                                    : '0%',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pie-style breakdown: finalized vendors share */}
                    <section className={styles.historicalSection}>
                        <h2 className={styles.sectionTitle}>Assigned vendor mix</h2>
                        {vendorShare.total === 0 ? (
                            <p className={styles.reportCardDesc}>
                                No finalized vendors yet. Assign vendors from the Directory to see this chart.
                            </p>
                        ) : (
                            <div className={styles.vendorPieRow}>
                                <div className={styles.vendorPieLegend}>
                                    {vendorShare.entries.map(([vendor, count], idx) => {
                                        const pct = Math.round((count / vendorShare.total) * 100);
                                        return (
                                            <div key={vendor} className={styles.vendorLegendItem}>
                                                <span
                                                    className={styles.vendorLegendSwatch}
                                                    style={{
                                                        backgroundColor:
                                                            ['#4F46E5', '#EC4899', '#10B981', '#F97316'][idx % 4],
                                                    }}
                                                />
                                                <span className={styles.vendorLegendLabel}>{vendor}</span>
                                                <span className={styles.vendorLegendValue}>
                                                    {count} ({pct}%)
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <svg
                                    viewBox="0 0 32 32"
                                    className={styles.vendorPieChart}
                                    aria-hidden="true"
                                >
                                    {(() => {
                                        let cumulative = 0;
                                        return vendorShare.entries.map(([_, count], idx) => {
                                            const fraction = count / vendorShare.total;
                                            const start = cumulative;
                                            cumulative += fraction;
                                            const largeArc = fraction > 0.5 ? 1 : 0;
                                            const radius = 16;
                                            const cx = 16;
                                            const cy = 16;
                                            const startAngle = 2 * Math.PI * start;
                                            const endAngle = 2 * Math.PI * (start + fraction);
                                            const x1 = cx + radius * Math.cos(startAngle);
                                            const y1 = cy + radius * Math.sin(startAngle);
                                            const x2 = cx + radius * Math.cos(endAngle);
                                            const y2 = cy + radius * Math.sin(endAngle);
                                            const d = `
                                                M ${cx} ${cy}
                                                L ${x1} ${y1}
                                                A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                                                Z
                                            `;
                                            const color = ['#4F46E5', '#EC4899', '#10B981', '#F97316'][idx % 4];
                                            return <path key={idx} d={d} fill={color} />;
                                        });
                                    })()}
                                </svg>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Analytics;
