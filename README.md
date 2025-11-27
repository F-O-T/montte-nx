# Montte

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Montte** is a modern, open-source finance tracker designed to help you manage your personal and shared expenses with ease. Built on a powerful and scalable monorepo architecture, it features a fast, reactive dashboard and a robust backend.

---

## ✨ Key Features

-   **Transaction Management**: Log income, expenses, and transfers. Support for **split categories** within a single transaction.
-   **Bill Tracking**: Manage accounts payable and receivable with recurrence patterns (monthly, quarterly, annual) and overdue tracking.
-   **Bank Accounts & OFX**: Manage multiple bank accounts and import transactions directly using **OFX file upload**.
-   **Advanced Categorization**: Organize finances with **Categories**, **Tags**, and **Cost Centers**.
-   **Organizations & Teams**: Multi-tenant architecture allowing you to invite members, create teams, assign roles (Owner, Admin, Member), and manage finances collaboratively.
-   **Financial Insights**: Dashboard with cash flow charts, monthly trends, category breakdowns, and planned vs. actual reports.
-   **Secure Authentication**: Powered by **Better Auth** with support for Email/Password and Google OAuth, including session management and device tracking.
-   **Internationalization**: Built-in support for localization (currently optimized for pt-BR).

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
-   **`docs`**: Documentation site built with Astro Starlight.
-   **`landing-page`**: Public landing page built with Astro.
-   **`blog`**: Blog site built with Astro.

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
