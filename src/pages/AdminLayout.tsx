import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidenav } from '../components/Sidenav';
import styles from './AdminLayout.module.scss';

export const AdminLayout: React.FC = () => {
    return (
        <div className={styles.layout}>
            <Sidenav />
            <div className={styles.outlet}>
                <Outlet />
            </div>
        </div>
    );
};
