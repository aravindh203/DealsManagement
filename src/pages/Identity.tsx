import React, { useState } from 'react';
import styles from './Identity.module.scss';
import { AddRegular, SearchRegular, PeopleRegular } from '@fluentui/react-icons';
import { UserMenu } from '../components/UserMenu';

const MoreVerticalIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="4" r="1.25" fill="currentColor" />
        <circle cx="8" cy="8" r="1.25" fill="currentColor" />
        <circle cx="8" cy="12" r="1.25" fill="currentColor" />
    </svg>
);

type Tab = 'USERS' | 'TEAMS' | 'DELEGATIONS';
type ProtocolRole = 'ADMIN' | 'MANAGER' | 'BROKER';

interface AccessUser {
    id: string;
    initial: string;
    name: string;
    email: string;
    role: ProtocolRole;
    teamManager: string;
}

const accessUsers: AccessUser[] = [
    { id: '1', initial: 'A', name: 'Alex Mercer', email: 'ALEX@TECHNORUCS.COM', role: 'ADMIN', teamManager: 'Global Architect' },
    { id: '2', initial: 'S', name: 'Sarah Jenkins', email: 'S.JENKINS@TECHNORUCS.COM', role: 'MANAGER', teamManager: 'Global Architect' },
    { id: '3', initial: 'L', name: 'Lisa Johnson', email: 'LISA@TECHNORUCS.COM', role: 'BROKER', teamManager: 'Reports to Sarah Jenkins' },
];

interface TeamSummary {
    id: string;
    name: string;
    manager: string;
    members: number;
    customers: number;
    revenue: string;
}

const teamsData: TeamSummary[] = [
    { id: '1', name: 'Sales Team North', manager: 'Sarah Jenkins', members: 8, customers: 45, revenue: '$320K' },
    { id: '2', name: 'Enterprise West', manager: 'Alex Mercer', members: 5, customers: 22, revenue: '$1.2M' },
    { id: '3', name: 'Strategic Accounts', manager: 'Lisa Johnson', members: 3, customers: 12, revenue: '$2.5M' },
];

interface DelegationRow {
    id: string;
    fromBroker: string;
    toBroker: string;
    customers: number;
    status: 'COMPLETE' | 'PENDING' | 'IN_PROGRESS';
}

const delegationsData: DelegationRow[] = [
    { id: '1', fromBroker: 'Lisa Johnson', toBroker: 'Robert Davis', customers: 12, status: 'COMPLETE' },
];

const Identity: React.FC = () => {
    const [tab, setTab] = useState<Tab>('USERS');
    const [searchUsers, setSearchUsers] = useState('');
    const [fromBroker, setFromBroker] = useState('Lisa Johnson');
    const [toBroker, setToBroker] = useState('Robert Davis');
    const [scope, setScope] = useState('All Accounts (12)');

    return (
        <div className={styles.page}>
            <nav className={styles.topNav}>
                <div className={styles.navLeft}>
                    <span className={styles.logo}>Identity</span>
                </div>
                <div className={styles.navRight}>
                    <UserMenu />
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.mainStatic}>
                    <div className={styles.pageHeader}>
                        <div className={styles.titleGroup}>
                            <span className={styles.overline}>ACCESS GOVERNANCE</span>
                            <h1 className={styles.pageTitle}>Identity Management</h1>
                        </div>
                        <button className={styles.authorizeBtn} type="button">
                            <AddRegular />
                            AUTHORIZE USER
                        </button>
                    </div>

                    <div className={styles.tabs}>
                        {(['USERS', 'TEAMS', 'DELEGATIONS'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                className={tab === t ? styles.tabActive : styles.tab}
                                onClick={() => setTab(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.mainScroll}>
                    {tab === 'USERS' ? (
                        <>
                            <div className={styles.metricCards}>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>TOTAL USERS</span>
                                    <span className={styles.metricValue}>5</span>
                                    <span className={styles.metricSub}>Authorized seats</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>ACTIVE</span>
                                    <span className={styles.metricValueGreen}>4</span>
                                    <span className={styles.metricSub}>Live sessions</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>PENDING INVITES</span>
                                    <span className={styles.metricValueOrange}>1</span>
                                    <span className={styles.metricSub}>Awaiting validation</span>
                                </div>
                            </div>
                            <section className={styles.accessRegistry}>
                                <div className={styles.registryHeader}>
                                    <h2 className={styles.registryTitle}>ACCESS REGISTRY</h2>
                                    <div className={styles.searchUsers}>
                                        <SearchRegular className={styles.searchIcon} />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchUsers}
                                            onChange={(e) => setSearchUsers(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.accessTable}>
                                        <thead>
                                            <tr>
                                                <th>VALIDATED IDENTITY</th>
                                                <th>PROTOCOL ROLE</th>
                                                <th>TEAM / MANAGER</th>
                                                <th>HEALTH PULSE</th>
                                                <th>EXECUTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accessUsers.map((u) => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div className={styles.identityCell}>
                                                            <span className={styles.identityAvatar}>{u.initial}</span>
                                                            <div>
                                                                <span className={styles.identityName}>{u.name}</span>
                                                                <span className={styles.identityEmail}>{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.rolePill} ${styles[`role${u.role}`]}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className={styles.teamCell}>{u.teamManager}</td>
                                                    <td>
                                                        <span className={styles.healthActive}>
                                                            <span className={styles.healthDot} />
                                                            ACTIVE
                                                        </span>
                                                    </td>
                                                    <td className={styles.executionCell} />
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    ) : tab === 'TEAMS' ? (
                        <div className={styles.teamsGrid}>
                            {teamsData.map((team) => (
                                <div key={team.id} className={styles.teamCard}>
                                    <div className={styles.teamCardHeader}>
                                        <span className={styles.teamCardIcon}>
                                            <PeopleRegular />
                                        </span>
                                        <button type="button" className={styles.teamCardMenu} title="Options">
                                            <MoreVerticalIcon />
                                        </button>
                                    </div>
                                    <h3 className={styles.teamCardName}>{team.name}</h3>
                                    <div className={styles.teamCardMetrics}>
                                        <div className={styles.teamMetric}>
                                            <span className={styles.teamMetricLabel}>MANAGER</span>
                                            <span className={styles.teamMetricValue}>{team.manager}</span>
                                        </div>
                                        <div className={styles.teamMetric}>
                                            <span className={styles.teamMetricLabel}>MEMBERS</span>
                                            <span className={styles.teamMetricValue}>{team.members} Seats</span>
                                        </div>
                                        <div className={styles.teamMetric}>
                                            <span className={styles.teamMetricLabel}>CUSTOMERS</span>
                                            <span className={styles.teamMetricValue}>{team.customers} Accounts</span>
                                        </div>
                                        <div className={styles.teamMetric}>
                                            <span className={styles.teamMetricLabel}>REVENUE</span>
                                            <span className={styles.teamMetricValueGreen}>{team.revenue}</span>
                                        </div>
                                    </div>
                                    <button type="button" className={styles.teamCardCta}>VIEW DETAILS</button>
                                </div>
                            ))}
                            <button type="button" className={styles.teamCardNew}>
                                <AddRegular className={styles.teamCardNewIcon} />
                                <span className={styles.teamCardNewLabel}>INITIALIZE NEW TEAM</span>
                            </button>
                        </div>
                    ) : (
                        <div className={styles.delegationsPanels}>
                            <section className={styles.delegationsActive}>
                                <h2 className={styles.delegationsPanelTitle}>ACTIVE DELEGATIONS</h2>
                                <div className={styles.delegationsTableWrap}>
                                    <table className={styles.delegationsTable}>
                                        <thead>
                                            <tr>
                                                <th>FROM BROKER</th>
                                                <th>TO BROKER</th>
                                                <th>CUSTOMERS</th>
                                                <th>STATUS</th>
                                                <th>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {delegationsData.map((d) => (
                                                <tr key={d.id}>
                                                    <td>{d.fromBroker}</td>
                                                    <td>{d.toBroker}</td>
                                                    <td>
                                                        <button type="button" className={styles.delegationsLink}>
                                                            {d.customers} Accounts
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.delegationsStatus} ${styles[`status${d.status}`]}`}>
                                                            {d.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button type="button" className={styles.delegationsLink}>
                                                            VIEW LOG
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                            <section className={styles.delegationsReassign}>
                                <h2 className={styles.delegationsPanelTitle}>REASSIGN CUSTOMERS</h2>
                                <div className={styles.delegationsForm}>
                                    <div className={styles.delegationsField}>
                                        <label>FROM BROKER</label>
                                        <input
                                            type="text"
                                            value={fromBroker}
                                            onChange={(e) => setFromBroker(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.delegationsField}>
                                        <label>TO BROKER</label>
                                        <input
                                            type="text"
                                            value={toBroker}
                                            onChange={(e) => setToBroker(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.delegationsField}>
                                        <label>SCOPE</label>
                                        <input
                                            type="text"
                                            value={scope}
                                            onChange={(e) => setScope(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.delegationsInfo}>
                                        This will reassign 12 customers from Lisa to Robert. Audit logs will be generated for each asset transition.
                                    </div>
                                    <button type="button" className={styles.delegationsExecute}>
                                        EXECUTE DELEGATION
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Identity;
