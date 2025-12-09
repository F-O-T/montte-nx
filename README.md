# Montte

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Montte** is a modern, open-source finance tracker designed to help you manage your personal and shared expenses with ease. Built on a powerful and scalable monorepo architecture, it features a fast, reactive dashboard and a robust backend.

---

## ✨ Key Features

### 💳 Core Financial Management
-   **Transaction Management**:
    -   Complete CRUD operations for income, expenses, and transfers
    -   **Split Categorization**: Divide single transactions across multiple categories
    -   **File Attachments**: Upload receipts and documents (PDF, Images)
    -   **Bulk Operations**: Bulk delete, categorize, and transfer linking
    -   **Smart Transfer Matching**: Automatic linking of outgoing/incoming transfers
-   **Bank Accounts**:
    -   Manage checking, savings, and investment accounts
    -   **OFX Integration**: Import/export OFX files with deduplication
    -   **BrasilAPI**: Fetch Brazilian bank data automatically
    -   Account archiving without data loss
-   **Bills & Receivables**:
    -   Track payable and receivable bills (Pending, Paid, Overdue)
    -   **Flexible Recurrence**: Monthly, quarterly, semiannual, annual patterns
    -   **Installment Plans**: Equal or custom installment amounts
    -   **Interest & Penalties**: Automated calculation with configurable templates
    -   **Monetary Correction**: Support for IPCA, SELIC, CDI indices

### 📊 Planning & Control
-   **Budget Management**:
    -   Set targets by categories, tags, or cost centers
    -   **Personal vs Business Modes**: Gamified/simple vs strict budgeting
    -   **Budget Rollover**: Carry balances between periods
    -   **Smart Alerts**: Configurable notification thresholds
    -   **Visual Progress**: Progress bars and spending forecasts
-   **Organization Tools**:
    -   Hierarchical categories with custom colors and icons
    -   Flexible tagging system
    -   Cost centers for business expense allocation

### 🤖 Automation & Intelligence
-   **Rules Engine**:
    -   **Visual Builder**: React Flow-based rule creation interface
    -   **Triggers**: Transaction created/updated events
    -   **Complex Conditions**: AND/OR logic groups with multiple criteria
    -   **Automated Actions**: Categorize, tag, set cost centers, modify descriptions
    -   **Notifications**: Send push notifications and emails
    -   **Execution Logs**: Detailed history of automation runs

### 📈 Analytics & Reporting
-   **Dashboard**: Net balance overview, income vs expenses, recent activity
-   **Financial Reports**:
    -   **DRE Gerencial**: Managerial income statements
    -   **DRE Fiscal**: Fiscal statements with planned vs realized analysis
    -   **PDF Export**: Generate downloadable report versions
-   **Interactive Charts**:
    -   Cash flow evolution
    -   Category breakdown (pie/bar charts)
    -   Monthly trends
    -   Payment performance analysis

### 🔐 Administration & Security
-   **Authentication**:
    -   Email/password and Google OAuth via Better Auth
    -   Email verification and password recovery
    -   Magic link authentication
    -   Session management with device tracking
-   **Multi-tenant Architecture**:
    -   Organization workspaces
    -   Team management and member invitations
    -   Role-based access control (Owner, Admin, Member)
-   **Billing Integration**: Stripe-powered subscription management
-   **Settings & Preferences**:
    -   Theme switching (Light/Dark/System)
    -   Language support (pt-BR)
    -   Telemetry opt-in/out (PostHog)
    -   Web push notification controls

## 🚀 Tech Stack

The Montte project is a full-stack application built within an **Nx** monorepo using **Bun**.

| Category      | Technology                                                                                                  |
| :------------ | :---------------------------------------------------------------------------------------------------------- |
| **Frontend**  | **React**, **Vite**, **TypeScript**, **TanStack Router**, **TanStack Query**, **shadcn/ui**, **Tailwind CSS** |
| **Backend**   | **ElysiaJS**, **Bun**, **tRPC**, **Drizzle ORM**, **PostgreSQL**                                              |
| **Auth**      | **Better Auth**                                                                                             |
| **Storage**   | **MinIO** (S3 compatible for file/logo storage)                                                             |
| **Analytics** | **PostHog**                                                                                                 |
| **Email**     | **Resend** (Transactional emails)                                                                           |
| **Documentation**| **Astro** (Starlight)                                                                                      |
| **Tooling**   | **Nx**, **Biome**, **Docker**, **Husky**                                                                    |

## 📂 Project Structure

This project is a monorepo managed by Nx.

### Apps (`apps/`)
The deployable applications and websites.

-   **`dashboard`**: The core finance tracking single-page application (SPA) built with React.
-   **`server`**: The ElysiaJS backend server providing the tRPC API and authentication endpoints.

### Packages (`packages/`)
Shared internal libraries used to modularize the application logic.

-   **`api`**: Defines the tRPC routers, root router, context creation, and client-side API wrappers.
-   **`authentication`**: Centralized configuration for Better Auth, including database adapters and plugins.
-   **`database`**: Drizzle ORM setup, database schemas, repository pattern implementations, and migrations.
-   **`ui`**: Shared React components library (shadcn/ui), hooks, and Tailwind configuration.
-   **`environment`**: Type-safe environment variable validation using Zod. Handles parsing for both client and server environments to ensure runtime safety.
-   **`files`**: Abstraction layer for file storage (MinIO/S3) and image processing (Sharp).
-   **`localization`**: i18n configuration, language detectors, and translation JSON resources.
-   **`transactional`**: React Email templates and Resend client for sending transactional emails.
-   **`utils`**: General utility functions for dates, currency formatting, error handling, and text manipulation.
-   **`posthog`**: Analytics integration setup for both client-side and server-side tracking.
-   **`brasil-api`**: Integration wrapper for BrasilAPI to fetch bank data.
-   **`ofx`**: Utilities for parsing and processing OFX (Open Financial Exchange) bank statement files.

### Libraries (`libraries/`)
Standalone libraries developed within the repo that could potentially be published separately.

-   **`ofx`**: Core logic and types for extracting data from OFX file formats.
-   **`condition-evaluator`**: Rule engine for evaluating complex conditional logic in automation rules.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the Apache-2.0 License. See the [LICENSE.md](LICENSE.md) file for details.
