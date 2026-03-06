import React, { useEffect, useState } from "react";
import styles from "./Repository.module.scss";
import { AddRegular, SearchRegular } from "@fluentui/react-icons";
import { useProjects } from "@/context/ProjectsContext";

const LineGraphIcon = () => (
  <svg
    width="14"
    height="10"
    viewBox="0 0 14 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.badgeChartIcon}
  >
    <path
      d="M1 8L4 5L6 6L9 2L13 4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 2a4.5 4.5 0 0 1 4.5 4.5v2.09a3 3 0 0 0 .66 1.87l.9 1.2a.75.75 0 0 1-.6 1.2H4.54a.75.75 0 0 1-.6-1.2l.9-1.2a3 3 0 0 0 .66-1.87V6.5A4.5 4.5 0 0 1 10 2zm3 12.5a3 3 0 1 1-6 0h6z"
      fill="currentColor"
    />
  </svg>
);

const ChevronDown = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2 5a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293L10 5.414 8.293 3.707A1 1 0 0 0 7.586 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-5.586a1 1 0 0 1-.707-.293L9.586 3.293A1 1 0 0 0 8.586 3H4z"
      fill="currentColor"
    />
  </svg>
);

const DocIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5zm0 2h4.586L15 8.414V16H5V4z"
      fill="#60a5fa"
    />
  </svg>
);

const XlsxIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5zm0 2h4.586L15 8.414V16H5V4z"
      fill="#22c55e"
    />
  </svg>
);

const PdfIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5zm0 2h4.586L15 8.414V16H5V4z"
      fill="#ef4444"
    />
  </svg>
);

const ZipIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414L11.586 2.586A2 2 0 0 0 10.414 2H5zm0 2h4.586L15 8.414V16H5V4z"
      fill="#60a5fa"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 3v10m0 0l-4-4m4 4l4-4M3 15h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0zM14 10l-2 2-2-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 6v4l3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

type AssetType = "folder" | "docx" | "xlsx" | "pdf" | "zip";

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  sizeInfo: string;
  modification: string;
  ownership: string;
  ownershipExternal?: boolean;
}

const assets: Asset[] = [
  {
    id: "1",
    name: "Legal Contracts",
    type: "folder",
    sizeInfo: "-- FOLDER",
    modification: "Oct 24, 2023",
    ownership: "INTERNAL ENTITY",
  },
  {
    id: "2",
    name: "Acme Project Alpha Proposal.docx",
    type: "docx",
    sizeInfo: "2.4 MB • DOCX",
    modification: "Just now",
    ownership: "ACME CORP",
    ownershipExternal: true,
  },
  {
    id: "3",
    name: "Global Tech Q3 Financial Review.xlsx",
    type: "xlsx",
    sizeInfo: "1.1 MB • XLSX",
    modification: "2 hrs ago",
    ownership: "GLOBAL TECH",
    ownershipExternal: true,
  },
  {
    id: "4",
    name: "Stark Compliance_v2.pdf",
    type: "pdf",
    sizeInfo: "4.8 MB • PDF",
    modification: "Yesterday",
    ownership: "STARK INDUSTRIES",
    ownershipExternal: true,
  },
  {
    id: "5",
    name: "Shared Handbook.pdf",
    type: "pdf",
    sizeInfo: "3.2 MB • PDF",
    modification: "Oct 20, 2023",
    ownership: "INTERNAL ENTITY",
  },
  {
    id: "6",
    name: "Acme Assets.zip",
    type: "zip",
    sizeInfo: "15 MB • ZIP",
    modification: "Oct 20, 2023",
    ownership: "ACME CORP",
    ownershipExternal: true,
  },
];

function getAssetIcon(type: AssetType, className?: string) {
  switch (type) {
    case "folder":
      return <FolderIcon className={className} />;
    case "docx":
      return <DocIcon />;
    case "xlsx":
      return <XlsxIcon />;
    case "pdf":
      return <PdfIcon />;
    case "zip":
      return <ZipIcon />;
  }
}

const Repository: React.FC = () => {
  const { refetch } = useProjects();

  const [selectedId, setSelectedId] = useState<string>(assets[0].id);
  const [repoScope, setRepoScope] = useState("Global Repository");

  const selected = assets.find((a) => a.id === selectedId) ?? assets[0];

  useEffect(() => {
    (async () => {
      await refetch();
    })();
  }, []);

  return (
    <div className={styles.page}>
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <span className={styles.logo}>Repository</span>
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
              <span className={styles.overline}>ENCRYPTED STORAGE</span>
              <h1 className={styles.pageTitle}>Asset Repository</h1>
            </div>
            <div className={styles.headerActions}>
              <select
                className={styles.repoSelect}
                value={repoScope}
                onChange={(e) => setRepoScope(e.target.value)}
              >
                <option>Global Repository</option>
                <option>Legal Repository</option>
                <option>Project Repository</option>
              </select>
              <button className={styles.uploadBtn} type="button">
                <AddRegular />
                UPLOAD ASSET
              </button>
            </div>
          </div>
        </div>

        <div className={styles.mainScroll}>
          <div className={styles.twoCol}>
            <div className={styles.registryPanel}>
              <div className={styles.registryHeader}>
                <span className={styles.registryTitle}>STORAGE REGISTRY</span>
                <span className={styles.isolatedTag}>ISOLATED CONTAINER</span>
              </div>
              <div className={styles.assetList}>
                <table className={styles.assetTable}>
                  <thead>
                    <tr>
                      <th>IDENTITY / RESOURCE</th>
                      <th>MODIFICATION</th>
                      <th>OWNERSHIP</th>
                      <th>VERIFICATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => (
                      <tr
                        key={a.id}
                        className={
                          selectedId === a.id ? styles.rowSelected : ""
                        }
                        onClick={() => setSelectedId(a.id)}
                      >
                        <td>
                          <div className={styles.resourceCell}>
                            <span
                              className={
                                a.type === "folder"
                                  ? styles.iconFolder
                                  : styles.iconFile
                              }
                            >
                              {getAssetIcon(a.type)}
                            </span>
                            <div>
                              <span className={styles.assetName}>{a.name}</span>
                              <span className={styles.assetMeta}>
                                {a.sizeInfo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.modCell}>{a.modification}</td>
                        <td>
                          <span
                            className={
                              a.ownershipExternal
                                ? styles.ownerExternal
                                : styles.ownerInternal
                            }
                          >
                            {a.ownershipExternal && (
                              <span className={styles.ownerDot} />
                            )}
                            {a.ownership}
                          </span>
                        </td>
                        <td>
                          <span className={styles.verificationBadge}>
                            <span className={styles.verificationCheck}>✓</span>{" "}
                            AES-256
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.detailPanel}>
              <div className={styles.detailIconWrap}>
                {selected.type === "folder" ? (
                  <FolderIcon className={styles.detailIcon} />
                ) : (
                  getAssetIcon(selected.type)
                )}
              </div>
              <h2 className={styles.detailName}>{selected.name}</h2>
              <div className={styles.detailTags}>
                <span className={styles.tagIdentity}>IDENTITY ASSET</span>
                <span className={styles.tagVerified}>CHECKSUM VERIFIED</span>
              </div>
              <dl className={styles.detailProps}>
                <dt>RESOURCE TYPE</dt>
                <dd>
                  {selected.type === "folder"
                    ? "FOLDER"
                    : selected.type.toUpperCase()}
                </dd>
                <dt>ALLOCATION SIZE</dt>
                <dd>
                  {selected.type === "folder"
                    ? "—"
                    : selected.sizeInfo.split(" • ")[0]}
                </dd>
                <dt>LAST INTEGRITY AUDIT</dt>
                <dd className={styles.auditDate}>{selected.modification}</dd>
              </dl>
              <div className={styles.protocolSection}>
                <span className={styles.protocolTitle}>PROTOCOL ACTIONS</span>
                <button type="button" className={styles.btnDownload}>
                  <DownloadIcon />
                  DOWNLOAD SECURE COPY
                </button>
                <button type="button" className={styles.btnRevalidate}>
                  <RefreshIcon />
                  RE-VALIDATE INTEGRITY
                </button>
              </div>
              <div className={styles.ownershipProxy}>
                <ClockIcon />
                <span>OWNERSHIP PROXY</span>
                <span className={styles.proxySub}>Authored by System</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Repository;
