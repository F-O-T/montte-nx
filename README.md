# Montte

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Montte** is a modern, open-source finance tracker designed to help you manage your personal and shared expenses with ease. Built on a powerful and scalable monorepo architecture, it features a fast, reactive dashboard and a robust backend.

---

## ✨ Key Features

-   **Smart Transaction Management**:
    -   Log income, expenses, and transfers with ease.
    -   **Split Categorization**: Divide a single transaction amount across multiple categories.
    -   **Attachments**: Upload and store receipts/documents (PDF, Images) securely.
    -   **Transfer Matching**: Intelligent linking of transfers between accounts.
-   **Comprehensive Bill Tracking**:
    -   Manage accounts payable and receivable.
    -   **Installments**: Native support for creating bills with installments (equal or custom amounts).
    -   **Recurrence**: Robust recurrence patterns (monthly, quarterly, semiannual, annual).
    -   **Interest & Penalties**: Configurable templates for calculating fines, daily/monthly interest, and monetary correction on overdue bills.
-   **Bank Accounts & Integration**:
    -   Manage multiple account types (Checking, Savings, Investment).
    -   **OFX Import**: Parse and import bank statements via OFX files.
    -   **BrasilAPI**: Integrated bank list retrieval.
-   **Advanced Budgeting**:
    -   Create budgets targeting Categories, Tags, or Cost Centers.
    -   **Rollover**: Option to carry over unused balances to the next period.
    -   Visual progress tracking and forecasting.
-   **Organization & Taxonomy**:
    -   **Categorization**: Organize via Categories, Tags, and Cost Centers.
    -   **Counterparties**: Manage a directory of Clients and Suppliers.
-   **Collaborative Workspaces**:
    -   Multi-tenant Organization structure.
    -   Team management and Member invites.
    -   Role-based access control (Owner, Admin, Member).
-   **Financial Reports**:
    -   Interactive Cash Flow charts.
    -   Financial Evolution & Planned vs. Actual analysis.
    -   Payment Performance metrics (on-time vs. overdue stats).
-   **Platform & Security**:
    -   **Authentication**: Secure Email/Password and Google OAuth (via Better Auth).
    -   **Session Management**: Monitor and revoke active device sessions.
    -   **Internationalization**: Native support for localization (currently pt-BR).

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

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the Apache-2.0 License. See the [LICENSE.md](LICENSE.md) file for details.
