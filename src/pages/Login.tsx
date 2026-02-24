
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '../config/appConfig';
import {
  makeStyles,
  shorthands,
  Button,
  Text,
  tokens,
  Title1,
  Subtitle2,
  Body1,
  Caption1,
} from "@fluentui/react-components";
import {
  ShieldCheckmarkRegular,
  ChevronRightRegular,
  PeopleRegular,
  HeartPulseRegular
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f8f9fc',
    ...shorthands.padding('20px'),
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'white',
    ...shorthands.borderRadius('32px'),
    ...shorthands.padding('48px'),
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconBox: {
    width: '80px',
    height: '80px',
    backgroundColor: '#5c5ce0',
    ...shorthands.borderRadius('20px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
    boxShadow: '0 12px 20px rgba(92, 92, 224, 0.25)',
  },
  icon: {
    fontSize: '40px',
    color: 'white',
  },
  tagline: {
    color: '#5c5ce0',
    fontWeight: '700',
    letterSpacing: '2px',
    fontSize: '11px',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '42px',
    fontWeight: '900',
    marginBottom: '16px',
    color: '#000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  description: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '40px',
    maxWidth: '320px',
  },
  ssoButton: {
    width: '100%',
    height: '56px',
    backgroundColor: '#5c5ce0',
    color: 'white',
    ...shorthands.borderRadius('18px'),
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: '8px',
    // borderStyle: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#4a4ae0',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(92, 92, 224, 0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    }
  },
  manageButton: {
    width: '100%',
    height: '56px',
    ...shorthands.borderRadius('18px'),
    ...shorthands.border('1px', 'solid', '#eee'),
    backgroundColor: 'transparent',
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '48px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f9f9f9',
      ...shorthands.border('1px', 'solid', '#ddd'),
    },
  },
  dividerSection: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    columnGap: '16px',
    marginBottom: '32px',
  },
  line: {
    height: '1px',
    flexGrow: 1,
    backgroundColor: '#edf0f5',
  },
  dividerText: {
    fontSize: '10px',
    color: '#adb5bd',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    width: '100%',
  },
  infoCard: {
    backgroundColor: '#fff',
    ...shorthands.border('1px', 'solid', '#f1f3f5'),
    ...shorthands.borderRadius('20px'),
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.03)',
      ...shorthands.borderColor('#e9ecef'),
    }
  },
  infoIcon: {
    fontSize: '24px',
    color: '#5c5ce0',
    marginBottom: '12px',
  },
  infoTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: '0.5px',
  },
  errorAlert: {
    backgroundColor: '#fff5f5',
    ...shorthands.border('1px', 'solid', '#feb2b2'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('12px'),
    marginBottom: '16px',
    width: '100%',
    color: '#c53030',
    fontSize: '13px',
  }
});

const Login = () => {
  const styles = useStyles();
  const { isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login();
      toast({
        title: "Login successful",
        description: "You have been successfully authenticated.",
      });
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      toast({
        title: "Login failed",
        description: "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const isConfigured = appConfig.clientId && appConfig.tenantId && appConfig.containerTypeId;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBox}>
          <ShieldCheckmarkRegular className={styles.icon} />
        </div>

        <Text className={styles.tagline}>Enterprise Core</Text>
        <Text className={styles.title}>Nexus.</Text>

        <Text className={styles.description}>
          Identity-first workspace security for the next generation of cloud clusters.
        </Text>

        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}

        {!isConfigured && (
          <div className={`${styles.errorAlert} !bg-blue-50 !border-blue-200 !text-blue-700`}>
            Missing configuration: CLIENT_ID, TENANT_ID, or CONTAINER_TYPE_ID.
          </div>
        )}

        <button
          className={styles.ssoButton}
          onClick={handleLogin}
          disabled={loading || !isConfigured}
        >
          {loading ? 'Signing in...' : (
            <>
              Sign in with Microsoft 365
              <ChevronRightRegular />
            </>
          )}
        </button>

        <button className={styles.manageButton}>
          Manage Global Identity
        </button>

        <div className={styles.dividerSection}>
          <div className={styles.line} />
          <Text className={styles.dividerText}>Authorized Access Only</Text>
          <div className={styles.line} />
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.infoCard}>
            <PeopleRegular className={styles.infoIcon} />
            <Text className={styles.infoTitle}>SSO SYNC</Text>
          </div>
          <div className={styles.infoCard}>
            <HeartPulseRegular className={styles.infoIcon} />
            <Text className={styles.infoTitle}>LIVE GUARD</Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
