import React, { useState } from 'react';
import styles from './Analytics.module.scss';
import { SearchRegular } from '@fluentui/react-icons';

const LineGraphIcon = () => (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.badgeChartIcon}>
        <path d="M1 8L4 5L6 6L9 2L13 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a4.5 4.5 0 0 1 4.5 4.5v2.09a3 3 0 0 0 .66 1.87l.9 1.2a.75.75 0 0 1-.6 1.2H4.54a.75.75 0 0 1-.6-1.2l.9-1.2a3 3 0 0 0 .66-1.87V6.5A4.5 4.5 0 0 1 10 2zm3 12.5a3 3 0 1 1-6 0h6z" fill="currentColor" />
    </svg>
);

const DollarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.reportCardIcon}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BriefcaseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.reportCardIcon}>
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zm0 0V6a2 2 0 0 1 2-2h2v2H4zm8-4v2h4V4a2 2 0 0 0-2-2h-2zM8 4v2H4V6a2 2 0 0 1 2-2h2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PeopleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.reportCardIcon}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.reportCardIcon}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const DocumentIcon = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.histDocIcon}>
        <path d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const reportCards = [
    { id: 'revenue', title: 'Revenue Report', desc: 'Monthly breakdown', Icon: DollarIcon },
    { id: 'customer', title: 'Customer Activity', desc: 'Engagement metrics', Icon: BriefcaseIcon },
    { id: 'team', title: 'Team Performance', desc: 'Broker efficiency', Icon: PeopleIcon },
    { id: 'audit', title: 'Document Audit', desc: 'Security compliance', Icon: ShieldCheckIcon },
];

interface HistoricalReport {
    id: string;
    name: string;
    generatedBy: string;
    timestamp: string;
}

const historicalReports: HistoricalReport[] = [
    { id: '1', name: 'Q1_Financial_Summary.pdf', generatedBy: 'Alex Mercer', timestamp: 'Feb 20, 2026' },
    { id: '2', name: 'Team_North_Performance.xlsx', generatedBy: 'Sarah Jenkins', timestamp: 'Feb 18, 2026' },
    { id: '3', name: 'Compliance_Audit_Log.csv', generatedBy: 'System', timestamp: 'Feb 15, 2026' },
];

const Analytics: React.FC = () => {
    const [reportType, setReportType] = useState('Revenue Analysis');
    const [temporalRange, setTemporalRange] = useState('Last 30 Days');
    const [aggregation, setAggregation] = useState('By Broker');

    return (
        <div className={styles.page}>
            <nav className={styles.topNav}>
                <div className={styles.navLeft}>
                    <span className={styles.logo}>Analytics</span>
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

            <main className={styles.main}>
                <div className={styles.mainStatic}>
                    <div className={styles.titleGroup}>
                        <span className={styles.overline}>ANALYTICS ENGINE</span>
                        <h1 className={styles.pageTitle}>Reports & Intelligence</h1>
                    </div>
                </div>

                <div className={styles.mainScroll}>
                    <section className={styles.reportsOverview}>
                        <div className={styles.reportGrid}>
                            {reportCards.map(({ id, title, desc, Icon }) => (
                                <div key={id} className={styles.reportCard}>
                                    <div className={styles.reportCardIconWrap}>
                                        <Icon />
                                    </div>
                                    <h3 className={styles.reportCardTitle}>{title}</h3>
                                    <p className={styles.reportCardDesc}>{desc}</p>
                                    <button type="button" className={styles.generateLink}>GENERATE</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.customQuery}>
                        <h2 className={styles.sectionTitle}>Custom Intelligence Query</h2>
                        <div className={styles.queryRow}>
                            <div className={styles.queryField}>
                                <label>REPORT TYPE</label>
                                <input
                                    type="text"
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                />
                            </div>
                            <div className={styles.queryField}>
                                <label>TEMPORAL RANGE</label>
                                <input
                                    type="text"
                                    value={temporalRange}
                                    onChange={(e) => setTemporalRange(e.target.value)}
                                />
                            </div>
                            <div className={styles.queryField}>
                                <label>AGGREGATION</label>
                                <input
                                    type="text"
                                    value={aggregation}
                                    onChange={(e) => setAggregation(e.target.value)}
                                />
                            </div>
                            <button type="button" className={styles.executeBtn}>EXECUTE QUERY</button>
                        </div>
                    </section>

                    <section className={styles.historicalSection}>
                        <h2 className={styles.sectionTitle}>HISTORICAL OUTPUT</h2>
                        <div className={styles.historicalTableWrap}>
                            <table className={styles.historicalTable}>
                                <thead>
                                    <tr>
                                        <th>REPORT IDENTIFIER</th>
                                        <th>GENERATED BY</th>
                                        <th>TIMESTAMP</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicalReports.map((r) => (
                                        <tr key={r.id}>
                                            <td>
                                                <span className={styles.reportIdentifier}>
                                                    <DocumentIcon />
                                                    {r.name}
                                                </span>
                                            </td>
                                            <td>{r.generatedBy}</td>
                                            <td>{r.timestamp}</td>
                                            <td>
                                                <button type="button" className={styles.actionDownload}>DOWNLOAD</button>
                                                <button type="button" className={styles.actionPurge}>PURGE</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Analytics;
