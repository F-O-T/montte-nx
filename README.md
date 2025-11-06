# Quoto

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](./LICENSE.md)
[![GitHub Stars](https://img.shields.io/github/stars/F-O-T/contentagen-nx?style=social)](https://github.com/F-O-T/contentagen-nx)

**Quoto** is an open-source personal finance tracker that helps you manage your money with ease. Take control of your financial life with comprehensive transaction tracking, categorization, and insightful analytics.

Perfect for individuals who want full control over their financial data without expensive subscriptions.

## ✨ Key Features

- 💰 **Transaction Tracking**: Record and categorize income and expenses with detailed descriptions
- 📊 **Category Management**: Organize your finances with custom categories and color coding
- 🌍 **Multi-Currency Support**: Track finances in different currencies with user preferences
- 🔐 **Secure Authentication**: User accounts with secure sign-in and profile management
- 📱 **Responsive Dashboard**: Clean, modern interface that works on all devices
- 📈 **Financial Insights**: View your spending patterns and financial health at a glance

## 🛠️ Tech Stack

- **Monorepo**: [Nx](https://nx.dev/) + [Bun](https://bun.sh/)
- **Backend**: [ElysiaJS](https://elysiajs.com/) & [tRPC](https://trpc.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Dashboard**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [TanStack Router](https://tanstack.com/router), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Formatting & Linting**: [Biome](https://biomejs.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/F-O-T/contentagen-nx.git
cd finance-nx
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/server/.env.example apps/server/.env
# Edit the .env files with your configuration
```

4. Set up the database:
```bash
bun run db:push
```

5. Start the development servers:
```bash
bun run dev:dashboard
```

## 🤝 Contributing

We welcome contributions from the community! Please read our Contribution Guidelines to get started.

## 📜 License

This project is licensed under the Apache-2.0 License. See the LICENSE.md file for details.
