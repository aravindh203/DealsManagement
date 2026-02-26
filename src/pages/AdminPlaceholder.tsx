import React from 'react';
import styles from './AdminPlaceholder.module.scss';

interface AdminPlaceholderProps {
    title: string;
}

export const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title }) => {
    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.subtitle}>This section is coming soon.</p>
            </div>
        </div>
    );
};
