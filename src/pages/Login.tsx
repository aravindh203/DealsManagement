
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
import { sharePointService } from '../services/sharePointService';

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
  vendorToggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  vendorToggleButton: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textDecoration: 'underline',
    ':hover': {
      color: '#5c5ce0',
    },
  },
  vendorHelperText: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  vendorSignupButton: {
    width: '100%',
    height: '52px',
    backgroundColor: '#0f172a',
    color: 'white',
    ...shorthands.borderRadius('14px'),
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: '10px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.35)',
    ':hover': {
      backgroundColor: '#020617',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(15, 23, 42, 0.45)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    ':disabled': {
      backgroundColor: '#1e293b',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  },
});

const Login = () => {
  const styles = useStyles();
  const { isAuthenticated, login, loginVendor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showVendorSignup, setShowVendorSignup] = useState(false);
  const [vendorUsername, setVendorUsername] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [signupCompany, setSignupCompany] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

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

  const handleVendorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSignupLoading(true);
      setSignupError(null);

      if (!signupUsername.trim() || !signupPassword.trim() || !signupCompany.trim()) {
        setSignupError('Username, password and company are required.');
        return;
      }

      await sharePointService.createVendorSignupRequest({
        username: signupUsername.trim(),
        password: signupPassword.trim(),
        company: signupCompany.trim(),
        firstName: signupFirstName.trim() || undefined,
        lastName: signupLastName.trim() || undefined,
        email: signupEmail.trim() || undefined,
        mobileNumber: signupMobile.trim() || undefined,
      });

      toast({
        title: "Request submitted",
        description: "Your vendor signup request has been sent for approval. You will be able to sign in after an Office 365 admin approves you.",
      });

      // Reset signup form and switch back to sign-in
      setSignupCompany('');
      setSignupFirstName('');
      setSignupLastName('');
      setSignupEmail('');
      setSignupMobile('');
      setSignupUsername('');
      setSignupPassword('');
      setShowVendorSignup(false);
    } catch (err) {
      console.error('Vendor signup failed:', err);
      setSignupError(err instanceof Error ? err.message : 'Could not submit signup request.');
      toast({
        title: "Vendor signup failed",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSignupLoading(false);
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
              {showVendorSignup
                ? 'Request access as a new vendor. Your account will be activated after an Office 365 admin approves it.'
                : 'Sign in with your vendor credentials to access Directory and Repository.'}
            </Text>

            {(!showVendorSignup && vendorError) && (
              <div className={styles.errorAlert}>
                {vendorError}
              </div>
            )}

            {(showVendorSignup && signupError) && (
              <div className={styles.errorAlert}>
                {signupError}
              </div>
            )}

            {!showVendorSignup ? (
              <>
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
                  <div className={styles.vendorToggleRow}>
                    <span className={styles.vendorHelperText}>
                      Only approved vendors can sign in.
                    </span>
                    <button
                      type="button"
                      className={styles.vendorToggleButton}
                      onClick={() => {
                        setShowVendorSignup(true);
                        setSignupError(null);
                      }}
                    >
                      Request vendor access
                    </button>
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
              </>
            ) : (
              <>
                <form className={styles.vendorForm} onSubmit={handleVendorSignup}>
                  <div className={styles.inputWrap}>
                    <label className={styles.inputLabel} htmlFor="signup-company">
                      Company name
                    </label>
                    <Input
                      id="signup-company"
                      type="text"
                      className={styles.vendorInput}
                      placeholder="Your company"
                      value={signupCompany}
                      onChange={(e) => setSignupCompany(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>
                  <div className={styles.inputWrap}>
                    <label className={styles.inputLabel} htmlFor="signup-firstname">
                      First name
                    </label>
                    <Input
                      id="signup-firstname"
                      type="text"
                      className={styles.vendorInput}
                      placeholder="Optional"
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>
                  <div className={styles.inputWrap}>
                    <label className={styles.inputLabel} htmlFor="signup-lastname">
                      Last name
                    </label>
                    <Input
                      id="signup-lastname"
                      type="text"
                      className={styles.vendorInput}
                      placeholder="Optional"
                      value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>
                  <div className={styles.inputWrap}>
                    <label className={styles.inputLabel} htmlFor="signup-email">
                      Email
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      className={styles.vendorInput}
                      placeholder="name@company.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>
                  <div className={styles.inputWrap}>
                    <label className={styles.inputLabel} htmlFor="signup-mobile">
                      Mobile number
                    </label>
                    <Input
                      id="signup-mobile"
                      type="tel"
                      className={styles.vendorInput}
                      placeholder="Optional"
                      value={signupMobile}
                      onChange={(e) => setSignupMobile(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>
                  <div className={styles.inputWrap}>
                    <label className={styles.inputLabel} htmlFor="signup-username">
                      Desired username
                    </label>
                    <Input
                      id="signup-username"
                      type="text"
                      className={styles.vendorInput}
                      placeholder="Usually your email"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>
                  <div className={styles.inputWrap}>
                    <label className={styles.inputLabel} htmlFor="signup-password">
                      Password
                    </label>
                    <Input
                      id="signup-password"
                      type="password"
                      className={styles.vendorInput}
                      placeholder="Choose a password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    className={styles.vendorSignupButton}
                    disabled={
                      signupLoading ||
                      !signupUsername.trim() ||
                      !signupPassword.trim() ||
                      !signupCompany.trim()
                    }
                  >
                    {signupLoading ? 'Submitting…' : 'Submit for approval'}
                  </button>
                  <button
                    type="button"
                    className={styles.vendorToggleButton}
                    style={{ marginTop: '8px' }}
                    onClick={() => {
                      setShowVendorSignup(false);
                      setSignupError(null);
                    }}
                  >
                    Back to vendor sign in
                  </button>
                </form>
              </>
            )}

            <button
              type="button"
              className={styles.vendorBackLink}
              onClick={() => {
                setShowVendorForm(false);
                setShowVendorSignup(false);
                setVendorUsername('');
                setVendorPassword('');
                setVendorError(null);
              }}
            >
              <ArrowLeftRegular style={{ fontSize: 16 }} />
              Back to login options
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
