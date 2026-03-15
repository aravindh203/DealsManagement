import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidenav.module.scss";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import logoMin from "../assets/logos/n.png";
import logoMax from "../assets/logos/nexus.png";

// Grid / waffle icon for Insights (active state uses blue)
const GridIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={active ? styles.iconActive : ""}
  >
    <path
      d="M3 4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zm0 9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3zm9-9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V4zm0 9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3z"
      fill="currentColor"
    />
  </svg>
);

const BriefcaseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 3a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6zm0 2h8v1H6V5zm-2 3v8h12V8H4z"
      fill="currentColor"
    />
  </svg>
);

const FolderIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 5a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293L10 5.414 8.293 3.707A1 1 0 0 0 7.586 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-5.586a1 1 0 0 1-.707-.293L9.586 3.293A1 1 0 0 0 8.586 3H4z"
      fill="currentColor"
    />
  </svg>
);

const AnalyticsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 14l4-5 4 3 5-8 3 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const IdentityIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12a4 4 0 0 0-4 4v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1a4 4 0 0 0-4-4H4z"
      fill="currentColor"
    />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 2l6 2.5v5.5a5.5 5.5 0 0 1-3.5 5.1L10 17l-2.5-1.9A5.5 5.5 0 0 1 4 10V4.5L10 2zm0 2.2L6 5.3v4.7a3.5 3.5 0 0 0 2.2 3.2L10 14.5l1.8-1.4A3.5 3.5 0 0 0 14 10V5.3L10 4.2zm1.35 4.65L9.5 12.5 8.15 11.15 9 10.3l.5.5 1.85-1.85 1.35 1.35z"
      fill="currentColor"
    />
  </svg>
);

const navItems = [
  { to: "/insights", label: "Insights", Icon: GridIcon },
  { to: "/projects", label: "Projects", Icon: BriefcaseIcon },
  { to: "/repository", label: "Repository", Icon: FolderIcon },
  { to: "/analytics", label: "Analytics", Icon: AnalyticsIcon },
  { to: "/vendor-approvals", label: "Vendor approvals", Icon: IdentityIcon },
];

interface SidenavProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidenav: React.FC<SidenavProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  const { role, loginType } = useAuth();

  const allowedNavItems = navItems.filter(({ to }) => {
    // Vendors: only Project and Repository
    if (loginType === "vendor") {
      return to === "/projects" || to === "/repository";
    }

    if (role === "admin") {
      return true;
    }

    if (role === "manager" || role === "executive") {
      return to === "/projects" || to === "/repository" || to === "/analytics";
    }

    return false;
  });

  const sidebarClassName = `${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`;

  return (
    <aside className={sidebarClassName}>
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <img
            src={collapsed ? logoMin : logoMax}
            alt="Nexus Logo"
            className={styles.logoImage}
          />
        </div>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {allowedNavItems.map(({ to, label, Icon }) => (
          <NavLink
            title={label}
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
            end={to === "/insights"}
          >
            {({ isActive }) => (
              <>
                <span className={styles.navIcon}>
                  <Icon active={isActive} />
                </span>
                {!collapsed && <span className={styles.navLabel}>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
