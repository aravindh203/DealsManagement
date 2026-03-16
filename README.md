# Deals Management & Vendor Analysis Platform

An AI-powered enterprise platform for managing project deals, vendor submissions, and ROI analysis, integrated with SharePoint Embedded for secure document storage.

## Features

- **Project Lifecycle Management**: Full CRUD operations for projects with custom metadata and folder structures.
- **AI-Powered Workflows**:
  - **Auto-Project Creation**: Generate project structures from high-level descriptions.
  - **Proposal Analysis**: AI scoring (0-100) of vendor documents against project requirements.
  - **ROI Insights**: Automatic summary of bid amounts and vendor capabilities.
- **Secure Document Storage**: Leveraging SharePoint Embedded (Microsoft Graph API) for enterprise-grade security and compliance.
- **Identity & Access Governance**: Integrated M365 authentication and dedicated vendor portal.

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS.
- **UI Components**: Radix UI, Fluent UI (Microsoft), Lucide Icons.
- **Authentication**: MSAL (Microsoft Authentication Library).
- **Backend Services**: Microsoft Graph API, Azure OpenAI (GPT-3.5 Turbo).
- **Deployment**: Netlify (with Edge Functions for CORS/Proxy).

## Prerequisites

- **Node.js**: v22.22.0 (Recommended)
- **Azure Tenant**: With SharePoint Embedded and Azure OpenAI enabled.
- **Environment Variables**: Configure `clientId`, `tenantId`, and `containerTypeId` in `src/config/appConfig.ts`.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run locally**:
   ```bash
   npm run dev
   ```
3. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

- `src/config/`: Application configuration and MSAL setup.
- `src/context/`: Auth, Projects, and API state management.
- `src/services/`:
  - `sharePointService.ts`: Microsoft Graph API integration.
  - `aiSummary.ts`: Azure OpenAI service calls.
- `src/pages/`:
  - `Insights`: Dashboard with AI-driven analytics.
  - `Projects`: Main project sites rollup and management.
  - `Repository`: File explorer for project documents.
  - `Identity`: Access governance and user role management.
  - `VendorApprovals`: Admin workflow for onboarding new vendors.

## Authentication & Security

The platform uses a dual-authentication system handled via `src/context/AuthContext.tsx`:

1. **M365 / Entra ID Login**: For internal users (Admin, Broker, Executive) authenticated via MSAL.
2. **Vendor Portal Login**: Dedicated login for partners, validated against a secure SharePoint user registry.
