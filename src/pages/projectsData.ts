/** Allowed values for P_Status column. Default is "Open". */
export type ProjectStatusValue = "Open" | "Yet to start" | "Pending" | "Completed";

export interface Project {
  id?: string | number;
  P_Name: string;
  P_Description?: string;
  P_StartDate?: string | null;
  P_EndDate?: string | null;
  P_Type?: string;
  P_Status?: ProjectStatusValue;
  V_SubmittedByEmail?: string;
  V_BidSubmissionDate?: string | null;
  V_BidDescription?: string | null;
  V_BidAmount?: string;
  P_VendorSubmissionDueDate?: string | null;
  P_Budget?: string;
  /** Bid window: start and end date for the bid. */
  P_BidStartDate?: string | null;
  P_BidEndDate?: string | null;
  /** "Admin" when folder created by M365 user; vendor's Company from UserDetails when created by vendor. */
  P_Company?: string | null;
  /** Email or username of the user who created the project (M365: email, vendor: username). */
  P_CreatedUserEmail?: string;
}

export const initialProjects: Project[] = [
  {
    id: 1,
    P_Name: "Head Office Renovation",
    P_Description: "Complete overhaul of the head office.",
    P_StartDate: "2026-04-01T00:00:00.000Z",
    P_EndDate: "2026-09-30T00:00:00.000Z",
    P_Type: "Renovation",
    V_SubmittedByEmail: "vendor1@example.com",
    V_BidSubmissionDate: "2026-03-15T00:00:00.000Z",
    V_BidDescription: "Cost-effective renovation plan.",
    V_BidAmount: "500000",
    P_VendorSubmissionDueDate: "2026-03-20T00:00:00.000Z",
    P_Budget: "600000",
    P_BidStartDate: "2026-03-01T00:00:00.000Z",
    P_BidEndDate: "2026-03-25T00:00:00.000Z",
    P_Company: "Admin",
  },
  {
    id: 2,
    P_Name: "Retail Expansion Phase II",
    P_Description: "Expanding retail footprint in the midwest.",
    P_StartDate: "2026-05-15T00:00:00.000Z",
    P_EndDate: "2026-12-15T00:00:00.000Z",
    P_Type: "Expansion",
    V_SubmittedByEmail: "retail_vendor@example.com",
    V_BidSubmissionDate: "2026-04-01T00:00:00.000Z",
    V_BidDescription: "Phase II expansion strategy.",
    V_BidAmount: "1200000",
    P_VendorSubmissionDueDate: "2026-04-10T00:00:00.000Z",
    P_Budget: "1500000",
    P_BidStartDate: "2026-03-15T00:00:00.000Z",
    P_BidEndDate: "2026-04-05T00:00:00.000Z",
    P_Company: "Admin",
  },
  {
    id: 3,
    P_Name: "Logistics Hub Upgrade",
    P_Description: "Upgrading software and hardware at main logistics hub.",
    P_StartDate: "2026-03-01T00:00:00.000Z",
    P_EndDate: "2026-08-31T00:00:00.000Z",
    P_Type: "Infrastructure",
    V_SubmittedByEmail: "tech_logistics@example.com",
    V_BidSubmissionDate: "2026-02-15T00:00:00.000Z",
    V_BidDescription: "Full system upgrade proposal.",
    V_BidAmount: "850000",
    P_VendorSubmissionDueDate: "2026-02-28T00:00:00.000Z",
    P_Budget: "900000",
    P_BidStartDate: "2026-02-01T00:00:00.000Z",
    P_BidEndDate: "2026-02-25T00:00:00.000Z",
    P_Company: "Acme Logistics",
  },
  {
    id: 4,
    P_Name: "Data Center Migration",
    P_Description: "Migrating on-prem data center to the cloud.",
    P_StartDate: "2026-04-10T00:00:00.000Z",
    P_EndDate: "2026-10-10T00:00:00.000Z",
    P_Type: "Migration",
    V_SubmittedByEmail: "cloud_experts@example.com",
    V_BidSubmissionDate: "2026-03-20T00:00:00.000Z",
    V_BidDescription: "Secure migration plan with zero downtime.",
    V_BidAmount: "2000000",
    P_VendorSubmissionDueDate: "2026-03-25T00:00:00.000Z",
    P_Budget: "2500000",
    P_BidStartDate: "2026-03-10T00:00:00.000Z",
    P_BidEndDate: "2026-03-30T00:00:00.000Z",
    P_Company: "Admin",
  },
];
