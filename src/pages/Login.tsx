
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '../config/appConfig';
import { Input } from '@/components/ui/input';
import {
  makeStyles,
  shorthands,
  Text,
} from "@fluentui/react-components";
import {
  ShieldCheckmarkRegular,
  ChevronRightRegular,
  PersonRegular,
  ArrowLeftRegular,
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
  errorAlert: {
    backgroundColor: '#fff5f5',
    ...shorthands.border('1px', 'solid', '#feb2b2'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('12px'),
    marginBottom: '16px',
    width: '100%',
    color: '#c53030',
    fontSize: '13px',
  },
  vendorButton: {
    width: '100%',
    height: '56px',
    ...shorthands.borderRadius('18px'),
    ...shorthands.border('2px', 'solid', '#5c5ce0'),
    backgroundColor: 'transparent',
    color: '#5c5ce0',
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0efff',
    },
  },
  vendorForm: {
    width: '100%',
    marginTop: '8px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '16px',
  },
  inputWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    height: '48px',
    ...shorthands.padding('0', '16px'),
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    ...shorthands.borderRadius('12px'),
    fontSize: '15px',
    boxSizing: 'border-box',
    ':focus': {
      outline: 'none',
      ...shorthands.border('2px', 'solid', '#5c5ce0'),
    },
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '6px',
    fontSize: '13px',
    color: '#5c5ce0',
    cursor: 'pointer',
    marginTop: '8px',
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    ':hover': { textDecoration: 'underline' },
  },
  // Vendor login specific
  vendorCard: {
    borderLeft: '4px solid #5c5ce0',
    textAlign: 'left' as const,
    alignItems: 'stretch',
  },
  vendorHeader: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    marginBottom: '28px',
  },
  vendorIconBox: {
    width: '48px',
    height: '48px',
    backgroundColor: '#f0efff',
    ...shorthands.borderRadius('12px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorIcon: {
    fontSize: '24px',
    color: '#5c5ce0',
  },
  vendorTitleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  vendorTagline: {
    color: '#5c5ce0',
    fontWeight: '700',
    letterSpacing: '1.5px',
    fontSize: '10px',
    textTransform: 'uppercase',
  },
  vendorTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1a1a2e',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  vendorDescription: {
    color: '#64748b',
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  vendorSignInBtn: {
    width: '100%',
    height: '52px',
    backgroundColor: '#5c5ce0',
    color: 'white',
    ...shorthands.borderRadius('14px'),
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '8px',
    marginBottom: '0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: '10px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(92, 92, 224, 0.35)',
    ':hover': {
      backgroundColor: '#4a4ae0',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(92, 92, 224, 0.4)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    ':disabled': {
      backgroundColor: '#a5b4fc',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  vendorBackLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '8px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    marginTop: '24px',
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px 0',
    transition: 'color 0.2s ease',
    ':hover': {
      color: '#5c5ce0',
      textDecoration: 'none',
    },
  },
  vendorInput: {
    width: '100%',
    height: '48px',
    ...shorthands.padding('0', '16px'),
    ...shorthands.border('1px', 'solid', '#e2e8f0'),
    ...shorthands.borderRadius('12px'),
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ':focus': {
      outline: 'none',
      ...shorthands.border('2px', 'solid', '#5c5ce0'),
      boxShadow: '0 0 0 3px rgba(92, 92, 224, 0.15)',
    },
    '::placeholder': {
      color: '#94a3b8',
    },
  },
});

const Login = () => {
  const styles = useStyles();
  const { isAuthenticated, login, loginVendor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorUsername, setVendorUsername] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login();
      toast({
        title: "Login successful",
        description: "You have been successfully authenticated.",
      });
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      toast({
        title: "Login failed",
        description: "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVendorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setVendorLoading(true);
      setVendorError(null);
      await loginVendor(vendorUsername, vendorPassword);
      toast({
        title: "Login successful",
        description: "You have been signed in as a vendor.",
      });
    } catch (err) {
      console.error('Vendor login failed:', err);
      setVendorError(err instanceof Error ? err.message : 'Invalid username or password.');
      toast({
        title: "Vendor login failed",
        description: "Please check your username and password.",
        variant: "destructive",
      });
    } finally {
      setVendorLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/insights" replace />;
  }

  const isConfigured = appConfig.clientId && appConfig.tenantId && appConfig.containerTypeId;

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${showVendorForm ? styles.vendorCard : ''}`}>
        {!showVendorForm ? (
          <>
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

            <button
              type="button"
              className={styles.vendorButton}
              onClick={() => {
                setShowVendorForm(true);
                setError(null);
                setVendorError(null);
              }}
            >
              <PersonRegular />
              Vendor login
              <ChevronRightRegular />
            </button>
          </>
        ) : (
          <>
            <div className={styles.vendorHeader}>
              <div className={styles.vendorIconBox}>
                <PersonRegular className={styles.vendorIcon} />
              </div>
              <div className={styles.vendorTitleBlock}>
                <Text className={styles.vendorTagline}>Partner access</Text>
                <Text className={styles.vendorTitle}>Vendor sign in</Text>
              </div>
            </div>
            <Text className={styles.vendorDescription}>
              Sign in with your vendor credentials to access Directory and Repository.
            </Text>

            {vendorError && (
              <div className={styles.errorAlert}>
                {vendorError}
              </div>
            )}

            <form className={styles.vendorForm} onSubmit={handleVendorLogin}>
              <div className={styles.inputWrap}>
                <label className={styles.inputLabel} htmlFor="vendor-username">
                  Username
                </label>
                <Input
                  id="vendor-username"
                  type="text"
                  className={styles.vendorInput}
                  placeholder="Enter your username"
                  value={vendorUsername}
                  onChange={(e) => setVendorUsername(e.target.value)}
                  autoComplete="username"
                  disabled={vendorLoading}
                />
              </div>
              <div className={styles.inputWrap}>
                <label className={styles.inputLabel} htmlFor="vendor-password">
                  Password
                </label>
                <Input
                  id="vendor-password"
                  type="password"
                  className={styles.vendorInput}
                  placeholder="Enter your password"
                  value={vendorPassword}
                  onChange={(e) => setVendorPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={vendorLoading}
                />
              </div>
              <button
                type="submit"
                className={styles.vendorSignInBtn}
                disabled={vendorLoading || !vendorUsername.trim() || !vendorPassword}
              >
                {vendorLoading ? 'Signing in...' : (
                  <>
                    Sign in
                    <ChevronRightRegular />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              className={styles.vendorBackLink}
              onClick={() => {
                setShowVendorForm(false);
                setVendorUsername('');
                setVendorPassword('');
                setVendorError(null);
              }}
            >
              <ArrowLeftRegular size={16} />
              Back to login options
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
