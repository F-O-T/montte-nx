    
# Quoto

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Quoto** is a modern, open-source finance tracker designed to help you manage your personal and shared expenses with ease. Built on a powerful and scalable monorepo architecture, it features a fast, reactive dashboard and a robust backend.

---

## ✨ Key Features

-   **Transaction Management**: Easily log your income and expenses with detailed descriptions, amounts, and dates.
-   **Bill Tracking**: Keep track of upcoming payables and receivables, and mark them as complete to automatically generate transactions.
-   **Smart Categorization**: Organize your finances with customizable categories, complete with unique icons and colors for quick identification.
-   **Bank Account Integration**: Link transactions and bills to specific bank accounts for precise tracking.
-   **Organizations & Teams**: Manage finances collaboratively by inviting members to an organization with role-based access control.
-   **Secure Authentication**: Robust authentication system with support for email/password and Google OAuth, including session management.
-   **Modern Tech Stack**: Built with TypeScript, React, ElysiaJS, and Drizzle ORM for a type-safe, performant, and maintainable codebase.

## 🚀 Tech Stack

The Quoto project is a full-stack application built within an Nx monorepo using Bun.

| Category      | Technology                                                                                                  |
| :------------ | :---------------------------------------------------------------------------------------------------------- |
| **Frontend**  | **React**, **Vite**, **TypeScript**, **TanStack Router**, **tRPC**, **shadcn/ui**, **Tailwind CSS**              |
| **Backend**   | **ElysiaJS**, **Bun**, **tRPC**, **Drizzle ORM**, **PostgreSQL**                                              |
| **Auth**      | **Better Auth** (Email/Password, Google OAuth, Organization Management)                                     |
| **Payments**  | **Polar**                                                                                                   |
| **Storage**   | **MinIO** (for file/logo storage)                                                                           |
| **Supporting**| **Astro** (for Blog, Docs, and Landing Page)                                                                  |
| **Tooling**   | **Nx**, **Biome** (Linting/Formatting), **Docker**, **Husky**, **commitlint**                                 |

## 📂 Project Structure

This project is a monorepo managed by Nx. All applications and shared packages are located in their respective directories:

-   `apps/`: Contains the main applications.
    -   `dashboard`: The core finance tracking single-page application.
    -   `server`: The ElysiaJS backend server providing the API.
    -   `landing-page`, `blog`, `docs`: Supporting websites built with Astro.
-   `packages/`: Contains shared libraries used across the applications.
    -   `api`: tRPC router definitions for client-server communication.
    -   `authentication`: Configuration for `better-auth`.
    -   `database`: Drizzle ORM schemas, migrations, and repositories.
    -   `ui`: Shared React components library based on shadcn/ui.
    -   And many more for localization, environment management, etc.

## 🏁 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

-   [Bun](https://bun.sh/) (v1.2.23 or later)
-   [Podman](https://podman.io/) & `podman-compose`
-   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/quoto.git
cd quoto
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Local Services

The project uses podman-compose to run local instances of PostgreSQL and MinIO.

```bash
bun run container-start
```

This will start the required services in the background.

### 4. Configure Environment Variables

Copy the example environment files for the server and dashboard apps.

```bash
cp apps/server/.env.example apps/server/.env
cp apps/dashboard/.env.example apps/dashboard/.env
```

Now, open apps/server/.env and apps/dashboard/.env and fill in the required values. For local development, the defaults for DATABASE_URL and MinIO should work correctly with the podman-compose setup.

### 5. Push Database Schema

Apply the database schema to your local PostgreSQL instance.

```bash
bun run db:push:local
```

You can view the database using Drizzle Studio:

```bash
bun run db:studio:local
```

## 🏃 Running the Application

You can run all applications simultaneously or start them individually.

### Run all apps (Dashboard, Server, Landing Page, etc.):

```bash
bun run dev:all
```

### Run only the Dashboard and Server:

```bash
bun run dev:dashboard
```

- Server will be available at http://localhost:9876
- Dashboard will be available at http://localhost:3000

### Run individual applications:

```bash
# Run only the server
bun run dev:server

# Run only the dashboard
bun run dev:dashboard-only
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please read our CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the Apache-2.0 License. See the LICENSE.md file for details.
