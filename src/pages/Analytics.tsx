import React, { useMemo } from 'react';
import styles from './Analytics.module.scss';
import { Folder, CircleDollarSign, DollarSign, FolderOpen } from 'lucide-react';
import { UserMenu } from '../components/UserMenu';
import { useProjects } from '../context/ProjectsContext';
import type { Project } from './projectsData';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from 'recharts';

const Analytics: React.FC = () => {
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

    const budgetTimeline = useMemo(() => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const buckets: { month: string; allocated: number; actual: number }[] = monthNames.map((m) => ({
            month: m,
            allocated: 0,
            actual: 0,
        }));

        projects.forEach((p) => {
            if (!p.P_StartDate) return;
            const d = new Date(p.P_StartDate);
            const monthIndex = d.getMonth();
            if (monthIndex < 0 || monthIndex > 11) return;
            const budget = Number(p.P_Budget ?? 0);
            const bid = Number(p.V_BidAmount ?? 0);
            if (!Number.isNaN(budget)) buckets[monthIndex].allocated += budget;
            if (!Number.isNaN(bid)) buckets[monthIndex].actual += bid;
        });

        const nonZero = buckets.filter((b) => b.allocated > 0 || b.actual > 0);
        const series = nonZero.length > 0 ? nonZero : buckets.slice(0, 6);
        const maxValue = Math.max(
            0,
            ...series.map((b) => Math.max(b.allocated, b.actual)),
        );

        return { series, maxValue };
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
                    <UserMenu />
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.mainStatic}>
                    <div className={styles.pageHeader}>
                        <div className={styles.titleGroup}>
                            <span className={styles.overline}>Deals &amp; projects analytics</span>
                            <h1 className={styles.pageTitle}>Deal pipeline overview</h1>
                        </div>
                    </div>

                    {/* Stat cards – deals/project business */}
                    <div className={styles.statsRow}>
                        <div className={`${styles.card} ${styles.cardDark}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxDark}`}>
                                    <Folder size={20} />
                                </div>
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>Total projects</span>
                                <h2 className={styles.cardValue}>{totalProjects}</h2>
                                <span className={styles.cardSub}>In pipeline</span>
                            </div>
                        </div>
                        <div className={`${styles.card} ${styles.cardLight}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>Total budget</span>
                                <h2 className={styles.cardValue}>
                                    {budgetVsBid.totalBudget.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        maximumFractionDigits: 0,
                                    })}
                                </h2>
                                <span className={`${styles.cardSub} ${styles.cardSubGreen}`}>
                                    {budgetVsBid.totalBudget > 0 && budgetVsBid.totalBid > 0
                                        ? `${Math.round((budgetVsBid.totalBid / budgetVsBid.totalBudget) * 100)}% committed`
                                        : '0% committed'}
                                </span>
                            </div>
                        </div>
                        <div className={`${styles.card} ${styles.cardLight}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxLight}`}>
                                    <CircleDollarSign size={20} />
                                </div>
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>Total bid amount</span>
                                <h2 className={styles.cardValue}>
                                    {budgetVsBid.totalBid.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        maximumFractionDigits: 0,
                                    })}
                                </h2>
                                <span className={styles.cardSub}>Sum of all vendor bids</span>
                            </div>
                        </div>
                        <div className={`${styles.card} ${styles.cardPurple}`}>
                            <div className={styles.cardTop}>
                                <div className={`${styles.iconBox} ${styles.iconBoxPurple}`}>
                                    <FolderOpen size={20} />
                                </div>
                            </div>
                            <div className={styles.cardBottom}>
                                <span className={styles.cardLabel}>Open projects</span>
                                <h2 className={styles.cardValue}>{statusBuckets['Open'] ?? 0}</h2>
                                <span className={styles.cardSub}>Currently active</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.mainScroll}>

                    <section className={styles.middleRow}>
                        <div className={styles.statusCard}>
                            <h2 className={styles.sectionTitle}>Budget Trends</h2>
                            <p className={styles.sectionSubtitle}>Monthly budget allocation and spending</p>
                            <div className={styles.budgetLegend}>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendSwatchPrimary} />
                                    <span>Budget</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendSwatchSecondary} />
                                    <span>Actual</span>
                                </div>
                            </div>
                            <div className={styles.statusChart}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={budgetTimeline.series}
                                        margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                                    >
                                        <CartesianGrid stroke="#e5e7eb" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value: number) =>
                                                value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value: number, key) => [
                                                value.toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    maximumFractionDigits: 0,
                                                }),
                                                key === 'allocated' ? 'Budget' : 'Actual',
                                            ]}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="allocated"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="actual"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.vendorCard}>
                            <h2 className={styles.sectionTitle}>Vendor Distribution</h2>
                            <p className={styles.sectionSubtitle}>Projects by vendor</p>
                            {vendorShare.total === 0 ? (
                                <p className={styles.reportCardDesc}>
                                    No finalized vendors yet. Assign vendors from the Project screen to see this chart.
                                </p>
                            ) : (
                                <div className={styles.vendorPieStack}>
                                    <div className={styles.vendorPieChart}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Tooltip
                                                    formatter={(value: number, _name, entry) => [
                                                        `${value} projects`,
                                                        (entry.payload as any).vendor,
                                                    ]}
                                                />
                                                <Pie
                                                    data={vendorShare.entries.map(([vendor, count]) => ({
                                                        vendor,
                                                        value: count,
                                                    }))}
                                                    dataKey="value"
                                                    nameKey="vendor"
                                                    innerRadius="60%"
                                                    outerRadius="85%"
                                                    paddingAngle={3}
                                                >
                                                    {vendorShare.entries.map((_, idx) => (
                                                        <Cell
                                                            key={idx}
                                                            fill={
                                                                ['#4F46E5', '#8B5CF6', '#6366F1', '#A855F7', '#E5E7EB'][
                                                                idx % 5
                                                                ]
                                                            }
                                                        />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className={styles.vendorPieLegend}>
                                        {vendorShare.entries.map(([vendor, count], idx) => {
                                            const pct = Math.round((count / vendorShare.total) * 100);
                                            const color =
                                                ['#4F46E5', '#8B5CF6', '#6366F1', '#A855F7', '#E5E7EB'][idx % 5];
                                            return (
                                                <div key={vendor} className={styles.vendorLegendItem}>
                                                    <div className={styles.vendorLegendLeft}>
                                                        <span
                                                            className={styles.vendorLegendSwatch}
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span className={styles.vendorLegendLabel}>{vendor}</span>
                                                    </div>
                                                    <div className={styles.vendorLegendRight}>
                                                        <span className={styles.vendorProjects}>
                                                            {count} projects
                                                        </span>
                                                        <span className={styles.vendorLegendValue}>{pct}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className={styles.bottomRow}>
                        <div className={styles.statusCard}>
                            <h2 className={styles.sectionTitle}>Project Status Trends</h2>
                            <p className={styles.sectionSubtitle}>Monthly project status distribution</p>
                            <div className={styles.statusChart}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={Object.entries(statusBuckets).map(([status, count]) => ({
                                            status,
                                            count,
                                        }))}
                                        margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                                    >
                                        <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="status"
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(249, 115, 22, 0.06)' }}
                                            formatter={(value: number) => [`${value} projects`, 'Count']}
                                        />
                                        <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#f59e0b" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.projectTypesCard}>
                            <h2 className={styles.sectionTitle}>Project Types Breakdown</h2>
                            <p className={styles.sectionSubtitle}>Distribution by project category</p>
                            <div className={styles.projectTypesList}>
                                {(() => {
                                    const typeCounts: Record<string, number> = {};
                                    projects.forEach((p) => {
                                        const type = (p.P_Type ?? 'Other').toString();
                                        typeCounts[type] = (typeCounts[type] ?? 0) + 1;
                                    });
                                    const entries = Object.entries(typeCounts).sort(
                                        (a, b) => b[1] - a[1],
                                    );
                                    const max = Math.max(0, ...entries.map(([, v]) => v));
                                    return entries.map(([type, count]) => {
                                        const width = max > 0 ? Math.round((count / max) * 100) : 0;
                                        return (
                                            <div key={type} className={styles.projectTypeItem}>
                                                <div className={styles.projectTypeHeader}>
                                                    <span className={styles.projectTypeLabel}>{type}</span>
                                                    <span className={styles.projectTypeValue}>{count}</span>
                                                </div>
                                                <div className={styles.projectTypeTrack}>
                                                    <div
                                                        className={styles.projectTypeFill}
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Analytics;
