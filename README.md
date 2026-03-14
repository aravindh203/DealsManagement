# Deals Management & Vendor Analysis Platform

A premium, AI-driven project management and document collaboration platform powered by **SharePoint Embedded** and **Azure OpenAI**.

## 🚀 Key Features

### 🧠 AI-Powered Intelligence
- **AI Suggested Vendors**: Automatically analyzes proposal, cost, and policy documents to score vendors based on project criteria.
- **Contextual ChatBot**: A persistent AI assistant that helps users query project data, create projects, and surface insights instantly.
- **Smart Summarization**: Generates intelligence reports from complex vendor submissions.

### 📄 Advanced Document Collaboration
- **Office Online Integration**: Seamlessly view and edit Word, Excel, and PowerPoint files directly within the application.
- **Premium Document Viewer**: A high-fidelity, in-app preview system with support for diverse file types (PDF, Images, Office Docs).
- **Advanced Sharing**: A unified sharing workflow supporting:
  - **Anyone** (Anonymous links)
  - **Organization-wide** access
  - **Specific People** (Via Graph API invitations)
  - Granular **View/Edit** permission controls.

### ✨ Premium User Experience
- **Modern Dashboard**: Visually rich interface with glassmorphism, dynamic animations, and a tailored purple theme.
- **Responsive Design**: Fully optimized for diverse screen sizes.
- **Intelligent Notifications**: Custom-built, non-intrusive toast system positioned for optimal visibility.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons, Radix UI (shadcn/ui)
- **Authentication**: MSAL (Microsoft Authentication Library) for Azure AD
- **Backend Services**: Microsoft Graph API (File & Sharing operations)
- **AI Engine**: Azure OpenAI (GPT-4) for document analysis and chat

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Azure AD App Registration** with appropriate Graph API permissions:
  - `Files.ReadWrite.All`
  - `Sites.Read.All`
  - `User.Read`
  - `FileStorageContainer.Selected` (for SPE)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd DealsManagement
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the application:
   Update `src/config/appConfig.ts` with your Azure and SharePoint Embedded details:
   ```typescript
   export const appConfig = {
     clientId: "YOUR_CLIENT_ID",
     tenantId: "YOUR_TENANT_ID",
     containerTypeId: "YOUR_CONTAINER_TYPE_ID",
     sharePointHostname: "https://your-tenant.sharepoint.com",
     // ... other settings
   };
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/components`: Reusable UI components (Modals, Chat, Forms).
- `src/pages`: Main application views (Dashboard, Repository, Directory).
- `src/services`: Core logic for API interactions (SharePoint, AI).
- `src/context`: React Context for global state management (Auth, Projects).
- `src/hooks`: Custom hooks for common logic and API calls.

## 📄 License

Internal Project - All Rights Reserved.
