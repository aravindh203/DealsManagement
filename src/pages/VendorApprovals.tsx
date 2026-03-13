import React, { useEffect, useMemo, useState } from "react";
import styles from "./VendorApprovals.module.scss";
import directoryStyles from "./Directory.module.scss";
import { sharePointService } from "../services/sharePointService";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { EditRegular, SearchRegular, ArrowSyncRegular } from "@fluentui/react-icons";
import { useAuth } from "../context/AuthContext";

type VendorStatusFilter = "all" | "pending" | "approved" | "rejected";

interface VendorUserItem {
  id: string;
  username: string;
  company?: string;
  email?: string;
  mobileNumber?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  createdDateTime?: string;
}

const VendorApprovals: React.FC = () => {
  const [vendors, setVendors] = useState<VendorUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<VendorStatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorUserItem | null>(
    null,
  );
  const { getAccessToken } = useAuth();

  const PAGE_SIZE = 10;

  const loadVendors = async () => {
    try {
      setLoading(true);
      const list = await sharePointService.listVendorUsers();
      setVendors(list);
    } catch (err) {
      console.error("Failed to load vendor users:", err);
      toast({
        title: "Could not load vendors",
        description: "Please try again or check the UserDetails list permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleChangeStatus = async (
    itemId: string,
    status: "Approved" | "Rejected" | "Pending",
  ) => {
    try {
      setUpdatingId(itemId);
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "No access token",
          description:
            "Could not get Graph access token for the current user. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      await sharePointService.updateVendorStatus(token, itemId, status);
      setVendors((prev) =>
        prev.map((v) =>
          v.id === itemId
            ? {
              ...v,
              status,
            }
            : v,
        ),
      );
      toast({
        title: "Status updated",
        description: `Vendor has been marked as ${status}.`,
      });
    } catch (err) {
      console.error("Failed to update vendor status:", err);
      toast({
        title: "Update failed",
        description: "Could not update vendor status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredVendors = useMemo(() => {
    let list = vendors;

    if (filter !== "all") {
      list = list.filter((v) => {
        const st = (v.status ?? "").toLowerCase();
        if (!st && filter === "pending") return true;
        return st === filter;
      });
    }

    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter((v) => {
        return (
          v.username.toLowerCase().includes(q) ||
          (v.firstName && v.firstName.toLowerCase().includes(q)) ||
          (v.lastName && v.lastName.toLowerCase().includes(q)) ||
          (v.company && v.company.toLowerCase().includes(q)) ||
          (v.email && v.email.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [vendors, filter, searchText]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVendors.length / PAGE_SIZE),
  );

  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVendors.slice(start, start + PAGE_SIZE);
  }, [filteredVendors, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchText]);

  const openDetails = (vendor: VendorUserItem) => {
    setSelectedVendor(vendor);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedVendor(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.overline}>VENDOR ACCESS</div>
          <h1 className={styles.title}>Vendor approvals</h1>
          <p className={styles.subtitle}>
            Review vendor signup requests from the UserDetails list. Only Approved vendors
            can sign in to Directory and Repository.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={loadVendors}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <main className={styles.main}>
        <div>
          <div className={directoryStyles.filtersRow}>
            <div className={directoryStyles.tabsRow}>
              {(["all", "pending", "approved", "rejected"] as VendorStatusFilter[]).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    className={
                      filter === key ? directoryStyles.tabActive : directoryStyles.tab
                    }
                    onClick={() => setFilter(key)}
                  >
                    {key === "all"
                      ? "All"
                      : key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ),
              )}
            </div>
            <div className={directoryStyles.filterGroup}>
              <div className={directoryStyles.searchCustomers}>
                <SearchRegular className={directoryStyles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={directoryStyles.refreshBtn}
                onClick={loadVendors}
                title="Refresh"
                disabled={loading}
              >
                <ArrowSyncRegular className={directoryStyles.refreshIcon} />
              </button>
            </div>
          </div>

          <div className={directoryStyles.tableWrap}>
            <table className={directoryStyles.dataTable}>
              <thead>
                <tr>
                  <th>VENDOR</th>
                  <th>COMPANY</th>
                  <th>EMAIL</th>
                  <th>MOBILE</th>
                  <th>CREATED</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      Loading vendors…
                    </td>
                  </tr>
                ) : paginatedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No vendors found for this filter.
                    </td>
                  </tr>
                ) : (
                  paginatedVendors.map((v) => {
                    const initials =
                      (v.firstName?.charAt(0) || v.username?.charAt(0) || "?").toUpperCase();
                    const status = (v.status ?? "Pending") as
                      | "Pending"
                      | "Approved"
                      | "Rejected";
                    return (
                      <tr key={v.id}>
                        <td>
                          <div className={styles.vendorCell}>
                            <div className={styles.avatar}>{initials}</div>
                            <div className={styles.vendorInfo}>
                              <div className={styles.vendorName}>
                                {v.firstName || v.lastName
                                  ? `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim()
                                  : v.username}
                              </div>
                              <div className={styles.vendorUsername}>{v.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>{v.company || "—"}</td>
                        <td>{v.email || "—"}</td>
                        <td>{v.mobileNumber || "—"}</td>
                        <td>
                          {v.createdDateTime
                            ? new Date(v.createdDateTime).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <span
                            className={`${directoryStyles.statusPill} ${status === "Approved"
                              ? styles.statusApproved
                              : status === "Rejected"
                                ? styles.statusRejected
                                : styles.statusPending
                              }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          {status === "Pending" ? (
                            <button
                              type="button"
                              className={directoryStyles.actionBtn}
                              onClick={() => openDetails(v)}
                              title="Review / edit vendor"
                            >
                              <EditRegular />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={directoryStyles.actionBtn}
                              onClick={() => openDetails(v)}
                              title="View vendor details"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={directoryStyles.paginationRow}>
            <span className={directoryStyles.entriesCount}>
              Showing{" "}
              {filteredVendors.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
              –
              {Math.min(currentPage * PAGE_SIZE, filteredVendors.length)} of{" "}
              {filteredVendors.length} entries
            </span>
            <div className={directoryStyles.pagination}>
              <button
                type="button"
                className={directoryStyles.pageBtn}
                aria-label="Previous"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    page === currentPage
                      ? directoryStyles.pageBtnActive
                      : directoryStyles.pageBtn
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className={directoryStyles.pageBtn}
                aria-label="Next"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={detailsOpen} onOpenChange={(open) => (open ? setDetailsOpen(true) : closeDetails())}>
        <DialogContent className={styles.dialogContent}>
          {selectedVendor && (
            <>
              <DialogHeader>
                <DialogTitle className={styles.dialogTitle}>
                  <span className={styles.dialogAvatar}>
                    {(selectedVendor.firstName?.charAt(0) ||
                      selectedVendor.username?.charAt(0) ||
                      "?"
                    ).toUpperCase()}
                  </span>
                  <div className={styles.dialogTitleText}>
                    <span className={styles.dialogName}>
                      {selectedVendor.firstName || selectedVendor.lastName
                        ? `${selectedVendor.firstName ?? ""} ${selectedVendor.lastName ?? ""
                          }`.trim()
                        : selectedVendor.username}
                    </span>
                    <span className={styles.dialogUsername}>
                      {selectedVendor.username}
                    </span>
                  </div>
                  <span
                    className={`${styles.statusPill} ${(selectedVendor.status ?? "Pending") === "Approved"
                      ? styles.statusApproved
                      : (selectedVendor.status ?? "Pending") === "Rejected"
                        ? styles.statusRejected
                        : styles.statusPending
                      }`}
                  >
                    {selectedVendor.status ?? "Pending"}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className={styles.dialogBody}>
                <div className={styles.dialogSection}>
                  <div className={styles.dialogLabel}>Company</div>
                  <div className={styles.dialogValue}>
                    {selectedVendor.company || "—"}
                  </div>
                </div>
                <div className={styles.dialogSection}>
                  <div className={styles.dialogLabel}>Email</div>
                  <div className={styles.dialogValue}>
                    {selectedVendor.email || "—"}
                  </div>
                </div>
                <div className={styles.dialogSection}>
                  <div className={styles.dialogLabel}>Mobile</div>
                  <div className={styles.dialogValue}>
                    {selectedVendor.mobileNumber || "—"}
                  </div>
                </div>
                <div className={styles.dialogSection}>
                  <div className={styles.dialogLabel}>First name</div>
                  <div className={styles.dialogValue}>
                    {selectedVendor.firstName || "—"}
                  </div>
                </div>
                <div className={styles.dialogSection}>
                  <div className={styles.dialogLabel}>Last name</div>
                  <div className={styles.dialogValue}>
                    {selectedVendor.lastName || "—"}
                  </div>
                </div>
                <div className={styles.dialogSection}>
                  <div className={styles.dialogLabel}>Created</div>
                  <div className={styles.dialogValue}>
                    {selectedVendor.createdDateTime
                      ? new Date(
                        selectedVendor.createdDateTime,
                      ).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </div>
              <DialogFooter className={styles.dialogFooter}>
                {(selectedVendor.status ?? "Pending") === "Pending" && (
                  <div className={styles.dialogFooterLeft}>
                    <span className={styles.dialogHint}>
                      Approve to allow this vendor to sign in. Reject to block access.
                    </span>
                  </div>
                )}
                <div className={styles.dialogFooterActions}>
                  <Button
                    type="button"
                    variant="outline"
                    className={styles.dialogCloseButton}
                    onClick={closeDetails}
                  >
                    Close
                  </Button>
                  {(selectedVendor.status ?? "Pending") === "Pending" && (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={updatingId === selectedVendor.id}
                        onClick={async () => {
                          await handleChangeStatus(selectedVendor.id, "Rejected");
                          closeDetails();
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        disabled={updatingId === selectedVendor.id}
                        onClick={async () => {
                          await handleChangeStatus(selectedVendor.id, "Approved");
                          closeDetails();
                        }}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorApprovals;

