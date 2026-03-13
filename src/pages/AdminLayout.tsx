import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidenav } from '../components/Sidenav';
import styles from './AdminLayout.module.scss';

export const AdminLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className={styles.layout}>
            <Sidenav
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            />
            <div className={styles.outlet}>
                <Outlet />
            </div>
        </div>
    );
};
