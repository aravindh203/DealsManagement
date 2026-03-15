
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PublicClientApplication,
  AuthenticationResult,
  AccountInfo,
  InteractionRequiredAuthError
} from '@azure/msal-browser';
import { appConfig } from '../config/appConfig';
import { sharePointService } from '../services/sharePointService';

export type AppRole = 'admin' | 'manager' | 'executive';

export type LoginType = 'm365' | 'vendor';

const VENDOR_SESSION_KEY = 'nexus_vendor_session';

// Azure AD security group object IDs (from Entra ID)
// Replace these with your actual group object IDs if they differ.
const DEALS_MGMT_MANAGER_GROUP_ID = '50595f9b-6355-4db0-b90b-bdb3ec800caa';
const DEALS_MGMT_ADMIN_GROUP_ID = '10b10632-bcef-4029-8af2-1fb1521e6255';
const DEALS_MGMT_EXEC_GROUP_ID = 'f0620cab-6faa-4510-93cb-4a9ff11e4c2d';

export interface VendorUser {
  username: string;
  loginType: 'vendor';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  vendorUser: VendorUser | null;
  loginType: LoginType | null;
  role: AppRole;
  login: () => Promise<void>;
  loginVendor: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: (resource?: string) => Promise<string | null>;
  getSharePointToken: (hostname: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const deriveRoleFromAccount = (account: AccountInfo | null): AppRole => {
  if (!account || !account.idTokenClaims) {
    return 'admin';
  }

  const claims = account.idTokenClaims as unknown as { [key: string]: any };

  // 1) Prefer Azure AD security group membership (groups claim)
  const groups: string[] = claims.groups || claims['groups'] || [];
  if (Array.isArray(groups) && groups.length > 0) {
    if (groups.includes(DEALS_MGMT_ADMIN_GROUP_ID)) return 'admin';
    if (groups.includes(DEALS_MGMT_MANAGER_GROUP_ID)) return 'manager';
    if (groups.includes(DEALS_MGMT_EXEC_GROUP_ID)) return 'executive';
  }

  // 2) Fallback to app roles (roles claim) if configured that way
  const roles: string[] = claims.roles || claims['roles'] || [];
  if (Array.isArray(roles)) {
    if (roles.includes('DealsManagementAdmin')) return 'admin';
    if (roles.includes('DealsManagementManager')) return 'manager';
    if (roles.includes('DealsManagementExecutive')) return 'executive';
  }

  // 3) Safe default
  return 'admin';
};

// Update authority with actual tenant ID
const msalConfig = {
  ...appConfig.msalConfig,
  auth: {
    ...appConfig.msalConfig.auth,
    authority: `https://login.microsoftonline.com/${appConfig.tenantId}`,
    redirectUri: window.location.origin, // Ensure this matches what's in Azure AD
    postLogoutRedirectUri: window.location.origin
  }
};

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Make sure the instance is properly initialized
(async () => {
  await msalInstance.initialize();
})();

const getStoredVendorSession = (): VendorUser | null => {
  try {
    const raw = sessionStorage.getItem(VENDOR_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { username: string };
    return { username: data.username, loginType: 'vendor' };
  } catch {
    return null;
  }
};

const setStoredVendorSession = (vendorUser: VendorUser | null): void => {
  if (vendorUser) {
    sessionStorage.setItem(VENDOR_SESSION_KEY, JSON.stringify({ username: vendorUser.username }));
  } else {
    sessionStorage.removeItem(VENDOR_SESSION_KEY);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [vendorUser, setVendorUser] = useState<VendorUser | null>(null);
  const [loginType, setLoginType] = useState<LoginType | null>(null);
  const [role, setRole] = useState<AppRole>('admin');

  useEffect(() => {
    const vendor = getStoredVendorSession();
    if (vendor) {
      setIsAuthenticated(true);
      setVendorUser(vendor);
      setLoginType('vendor');
      setRole('admin'); // default role for vendor users
      return;
    }
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      setIsAuthenticated(true);
      setUser(accounts[0]);
      setLoginType('m365');
      msalInstance.setActiveAccount(accounts[0]);
      setRole(deriveRoleFromAccount(accounts[0]));
    }
  }, []);

  const login = async (): Promise<void> => {
    try {
      // Ensure MSAL is initialized
      await msalInstance.initialize();
      
      // Using empty scopes for login as instructed
      const loginRequest = {
        scopes: []
      };
      
      // Log relevant information for debugging
      
      // Login with popup
      const response: AuthenticationResult = await msalInstance.loginPopup(loginRequest);
      
      if (response) {
        setVendorUser(null);
        setStoredVendorSession(null);
        setIsAuthenticated(true);
        setUser(response.account);
        setLoginType('m365');
        setRole(deriveRoleFromAccount(response.account));
        msalInstance.setActiveAccount(response.account);
      }
    } catch (error) {
      throw error;
    }
  };

  const loginVendor = async (username: string, password: string): Promise<void> => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      throw new Error('Username and password are required.');
    }

    // Validate credentials against the SharePoint UserDetails list
    const isValid = await sharePointService.validateVendorCredentials(trimmedUsername, password);
    if (!isValid) {
      throw new Error('Invalid username or password.');
    }

    const vendor: VendorUser = { username: trimmedUsername, loginType: 'vendor' };
    setUser(null);
    setStoredVendorSession(vendor);
    setIsAuthenticated(true);
    setVendorUser(vendor);
    setLoginType('vendor');
    setRole('admin');
  };

  const logout = (): void => {
    const isVendor = loginType === 'vendor';
    if (isVendor) {
      setVendorUser(null);
      setLoginType(null);
      setStoredVendorSession(null);
      setIsAuthenticated(false);
      setUser(null);
      sessionStorage.clear();
      localStorage.removeItem('preferExternalChat');
      localStorage.removeItem('lastChatError');
    } else {
      msalInstance.logoutPopup().then(() => {
        setIsAuthenticated(false);
        setUser(null);
        setLoginType(null);
        setVendorUser(null);
        sessionStorage.clear();
        localStorage.removeItem('preferExternalChat');
        localStorage.removeItem('lastChatError');
      }).catch(error => {
      });
    }
  };

  const getAccessToken = async (resource?: string): Promise<string | null> => {
    if (loginType === 'vendor') {
      return null; // Vendor users do not have MSAL tokens
    }
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return null;
      }

      // Default to Graph API if no resource specified
      const tokenScopes = resource 
        ? [`${resource}/.default`]
        : ["https://graph.microsoft.com/.default"];
      
      // Request token with specific scopes for the requested resource
      const tokenRequest = {
        scopes: tokenScopes,
        account: accounts[0]
      };

      const tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
      
      return tokenResponse.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        
        try {
          // If silent acquisition fails, try popup
          const tokenScopes = resource 
            ? [`${resource}/.default`]
            : ["https://graph.microsoft.com/.default"];
            
          const tokenResponse = await msalInstance.acquireTokenPopup({
            scopes: tokenScopes
          });
          return tokenResponse.accessToken;
        } catch (fallbackError) {
          return null;
        }
      } else {
        return null;
      }
    }
  };
  
  // Get a token specifically for SharePoint
  const getSharePointToken = async (hostname: string): Promise<string | null> => {
    try {
      // Extract the hostname without protocol
      const domain = hostname.replace(/^https?:\/\//, '');
      
      // Use the SharePoint Online scope format with the specific domain
      return await getAccessToken(`https://${domain}`);
    } catch (error) {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      vendorUser,
      loginType,
      role,
      login, 
      loginVendor,
      logout, 
      getAccessToken,
      getSharePointToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

