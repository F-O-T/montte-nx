# Montte Landing Page Migration Plan

## Overview

Transform the ContentaGen landing page into a Montte finance tracker landing page.

- **Language:** Portuguese (pt-BR) only
- **Domain:** `montte.co` / `app.montte.co`
- **GitHub:** `F-O-T/montte-nx`
- **Removed:** SDK, Pricing, Discord, Testimonials, LogoCloud, docs/blog links, contact email

---

## Phase 1: Configuration & Cleanup

- [x] 1.1 Update `astro.config.mjs` (site URL to montte.co, pt-BR only)
- [x] 1.2 Update `src/i18n/config.ts` (pt-BR only)
- [x] 1.3 Update `src/i18n/utils.ts` (pt-BR only)
- [x] 1.4 Update `src/services/github.ts` (F-O-T/montte-nx)
- [x] 1.5 Update `src/data/menu-items.ts` (new sections, remove old links)
- [x] 1.6 Delete unused sections: SDK.astro, Pricing.astro, Community.astro, SocialProof.astro, LogoCloud.astro

---

## Phase 2: Layout & Main Page

- [x] 2.1 Update `src/layouts/Landing.astro` (meta tags, use brand from localization)
- [x] 2.2 Update `src/pages/[...locale]/index.astro` (remove deleted sections, add renamed ones, pt-BR only)

---

## Phase 3: Navigation Components

- [x] 3.1 Update `src/components/StickyNavbar.astro` (Montte branding, app.montte.co)
- [x] 3.2 Update `src/components/nav-menu.tsx` (new sections, remove SDK/pricing/docs/blog)
- [x] 3.3 Update `src/components/mobile-menu.tsx` (same changes)
- [x] 3.4 Update `src/sections/Navbar.astro` (Montte branding, app.montte.co)
- [x] 3.5 Delete `src/components/LanguageToggler.tsx` (pt-BR only)

---

## Phase 4: Rename & Rewrite Sections

- [ ] 4.1 Rename `BrandLearning.astro` → `BankAccounts.astro` & rewrite content
- [ ] 4.2 Rename `CompetitorIntelligence.astro` → `Transactions.astro` & rewrite content
- [ ] 4.3 Rename `ContentWorkflow.astro` → `FinancialWorkflow.astro` & rewrite content
- [ ] 4.4 Rewrite `Hero.astro` for finance
- [ ] 4.5 Rewrite `HowItWorks.astro` for finance
- [ ] 4.6 Improve & rewrite `OpenSource.astro`
- [ ] 4.7 Rewrite `FAQ.astro` with finance questions (pt-BR)
- [ ] 4.8 Rewrite `CTA.astro`
- [ ] 4.9 Rewrite `Footer.astro` (remove discord, docs, blog, email)

---

## Phase 5: Translations

- [ ] 5.1 Create `packages/localization/src/locales/pt-BR/pages/landing.json`
- [ ] 5.2 Update `packages/localization/src/locales/pt-BR/index.ts` to include landing translations

---

## Phase 6: Legal Pages (Portuguese)

- [ ] 6.1 Rewrite `privacy-policy.astro` in Portuguese for Montte
- [ ] 6.2 Rewrite `terms-of-service.astro` in Portuguese for Montte

---

## Phase 7: Cleanup & Verification

- [ ] 7.1 Delete unused assets (licitei-logo, testimonial images, team logos)
- [ ] 7.2 Run typecheck and fix any errors
- [ ] 7.3 Run format to ensure code style

---

## New Page Structure

```
Hero
  ↓
BankAccounts (Gestão de Contas)
  ↓
Transactions (Controle de Transações)
  ↓
FinancialWorkflow (Fluxo Financeiro)
  ↓
HowItWorks (Como Funciona)
  ↓
OpenSource (Open Source)
  ↓
FAQ (Perguntas Frequentes)
  ↓
CTA (Call to Action)
  ↓
Footer
```

---

## Files Summary

### Files to DELETE
- `apps/landing-page/src/sections/SDK.astro`
- `apps/landing-page/src/sections/Pricing.astro`
- `apps/landing-page/src/sections/Community.astro`
- `apps/landing-page/src/sections/SocialProof.astro`
- `apps/landing-page/src/sections/LogoCloud.astro`
- `apps/landing-page/src/assets/teams/licitei-logo.svg`
- `apps/landing-page/src/assets/teams/duome-logo.webp`
- `apps/landing-page/src/assets/teams/enduro-logo.webp`
- `apps/landing-page/src/assets/testimonials/hugo.webp`

### Files to RENAME
- `BrandLearning.astro` → `BankAccounts.astro`
- `CompetitorIntelligence.astro` → `Transactions.astro`
- `ContentWorkflow.astro` → `FinancialWorkflow.astro`

### Files to CREATE
- `packages/localization/src/locales/pt-BR/pages/landing.json`

### Files to MODIFY
- `apps/landing-page/astro.config.mjs`
- `apps/landing-page/src/i18n/config.ts`
- `apps/landing-page/src/i18n/utils.ts`
- `apps/landing-page/src/services/github.ts`
- `apps/landing-page/src/data/menu-items.ts`
- `apps/landing-page/src/layouts/Landing.astro`
- `apps/landing-page/src/pages/[...locale]/index.astro`
- `apps/landing-page/src/pages/privacy-policy.astro`
- `apps/landing-page/src/pages/terms-of-service.astro`
- `apps/landing-page/src/components/StickyNavbar.astro`
- `apps/landing-page/src/components/nav-menu.tsx`
- `apps/landing-page/src/components/mobile-menu.tsx`
- `apps/landing-page/src/sections/Navbar.astro`
- `apps/landing-page/src/sections/Hero.astro`
- `apps/landing-page/src/sections/HowItWorks.astro`
- `apps/landing-page/src/sections/OpenSource.astro`
- `apps/landing-page/src/sections/FAQ.astro`
- `apps/landing-page/src/sections/CTA.astro`
- `apps/landing-page/src/sections/Footer.astro`
- `packages/localization/src/locales/pt-BR/index.ts`
