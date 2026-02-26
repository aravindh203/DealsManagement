import React, { useState } from 'react';
import styles from './Directory.module.scss';
import {
    AddRegular,
    SearchRegular,
    PersonRegular,
} from '@fluentui/react-icons';

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

const ChartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 14l4-5 4 3 5-8 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const BriefcaseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 3a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6zm0 2h8v1H6V5zm-2 3v8h12V8H4z" fill="currentColor" />
    </svg>
);

type CustomerStatus = 'ACTIVE' | 'TRIAL' | 'PENDING';
type Role = 'Manager' | 'Broker' | 'Admin';

interface Customer {
    id: number;
    name: string;
    industry: string;
    status: CustomerStatus;
    assignedBroker: string;
    lastActivity: string;
    revenue: string;
}

const customers: Customer[] = [
    { id: 1, name: 'Acme Corp', industry: 'Manufacturing', status: 'ACTIVE', assignedBroker: 'Lisa Johnson', lastActivity: '2 hours ago', revenue: '$45,200' },
    { id: 2, name: 'Global Tech', industry: 'Technology', status: 'ACTIVE', assignedBroker: 'Robert Davis', lastActivity: 'Yesterday', revenue: '$120,000' },
    { id: 3, name: 'Stark Industries', industry: 'Defense', status: 'TRIAL', assignedBroker: 'Lisa Johnson', lastActivity: '3 days ago', revenue: '$850,000' },
    { id: 4, name: 'Cyberdyne Systems', industry: 'Technology', status: 'PENDING', assignedBroker: 'Unassigned', lastActivity: '5 hours ago', revenue: '$0' },
];

const Directory: React.FC = () => {
    const [role, setRole] = useState<Role>('Admin');
    const [searchCustomers, setSearchCustomers] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [industryFilter, setIndustryFilter] = useState('All Industries');

    const clearFilters = () => {
        setSearchCustomers('');
        setStatusFilter('All Status');
        setIndustryFilter('All Industries');
    };

    return (
        <div className={styles.page}>
            <nav className={styles.topNav}>
                <div className={styles.navLeft}>
                    <span className={styles.logo}>Directory</span>
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
                    <div className={styles.pageHeader}>
                        <div className={styles.titleGroup}>
                            <span className={styles.overline}>RESOURCE DIRECTORY</span>
                            <h1 className={styles.pageTitle}>Client Registry</h1>
                        </div>
                        <button className={styles.registerBtn} type="button">
                            <AddRegular />
                            REGISTER CLIENT
                        </button>
                    </div>

                    <div className={styles.roleRow}>
                        <span className={styles.currentRole}>
                            <PersonRegular className={styles.roleIcon} />
                            Current Role: <strong>ADMIN</strong>
                        </span>
                        <span className={styles.switchLabel}>Switch to:</span>
                        <div className={styles.roleTabs}>
                            {(['Manager', 'Broker', 'Admin'] as const).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    className={role === r ? styles.roleTabActive : styles.roleTab}
                                    onClick={() => setRole(r)}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.cardsRow}>
                        <div className={styles.dirCard}>
                            <div className={styles.dirCardIcon}>
                                <BriefcaseIcon />
                            </div>
                            <span className={styles.dirCardLabel}>TOTAL CUSTOMERS</span>
                            <span className={styles.dirCardValue}>156</span>
                            <span className={styles.dirCardSub}>Active accounts</span>
                        </div>
                        <div className={styles.dirCard}>
                            <div className={styles.dirCardIcon}>
                                <AddRegular />
                            </div>
                            <span className={styles.dirCardBadge}>+8</span>
                            <span className={styles.dirCardLabel}>THIS MONTH</span>
                            <span className={styles.dirCardValue}>+8</span>
                            <span className={styles.dirCardSub}>New customers</span>
                        </div>
                        <div className={styles.dirCard}>
                            <div className={styles.dirCardIcon}>
                                <ChartIcon />
                            </div>
                            <span className={styles.dirCardLabel}>UNASSIGNED</span>
                            <span className={styles.dirCardValueOrange}>3</span>
                            <span className={styles.dirCardSub}>Awaiting assignment</span>
                        </div>
                    </div>
                </div>

                <div className={styles.mainScroll}>
                    <div className={styles.filtersRow}>
                        <div className={styles.searchCustomers}>
                            <SearchRegular className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchCustomers}
                                onChange={(e) => setSearchCustomers(e.target.value)}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <select
                                className={styles.filterSelect}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Trial</option>
                                <option>Pending</option>
                            </select>
                            <select
                                className={styles.filterSelect}
                                value={industryFilter}
                                onChange={(e) => setIndustryFilter(e.target.value)}
                            >
                                <option>All Industries</option>
                                <option>Technology</option>
                                <option>Manufacturing</option>
                                <option>Defense</option>
                            </select>
                            <button type="button" className={styles.clearFiltersBtn} onClick={clearFilters}>
                                CLEAR FILTERS
                            </button>
                        </div>
                    </div>

                    <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>CUSTOMER NAME</th>
                                    <th>INDUSTRY</th>
                                    <th>STATUS</th>
                                    <th>ASSIGNED BROKER</th>
                                    <th>LAST ACTIVITY</th>
                                    <th>REVENUE</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <strong>{c.name}</strong>
                                            <span className={styles.idHint}> (ID: {c.id})</span>
                                        </td>
                                        <td>{c.industry}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[`status${c.status}`]}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td>{c.assignedBroker}</td>
                                        <td>{c.lastActivity}</td>
                                        <td className={styles.revenueCell}><strong>{c.revenue}</strong></td>
                                        <td>
                                            <button type="button" className={styles.actionLink}>VIEW</button>
                                            <button type="button" className={styles.actionLinkMuted}>EDIT</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.paginationRow}>
                        <span className={styles.entriesCount}>Showing {customers.length} of {customers.length} entries</span>
                        <div className={styles.pagination}>
                            <button type="button" className={styles.pageBtn} aria-label="Previous">&laquo;</button>
                            <button type="button" className={styles.pageBtnActive}>1</button>
                            <button type="button" className={styles.pageBtn}>2</button>
                            <button type="button" className={styles.pageBtn} aria-label="Next">&raquo;</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Directory;
