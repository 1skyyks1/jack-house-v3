# 4Key Jack House
<br />
<p align="center">
    <a href="https://www.jackhouse.xyz/">
        <img src="src/assets/pic/jackHouseLight.png" alt="Logo" width="320" height="80">
    </a>
</p>
<div align="center">
    A community for jack players
    <br />
    <br />

**[English](README.md)**
·
**[简体中文](README_zh.md)**
</div>

## Upgrade

`jack-house-v3` is the new Jack House frontend, replacing the legacy `jack-house-web/frontend`.

The project is built with React, TypeScript, and Vite. It keeps the existing backend, database, API contracts, upload flow, and community data, while rebuilding the user experience for forums, packs, events, tournaments, and admin tools.

1. Experience: redesigned visual style, interactions, immersive home page, mobile layout, and bilingual copy.
2. Posts: richer editor capabilities, including image paste support and improved article outline.
3. Packs: improved pack introduction, detail page, download links, comments, and maintenance workflow.
4. Tournaments: added tournament management, team registration, qualifier ranking, bracket display, match details, and referee workbench.
5. Admin: added operation dashboard, rebuilt permissions, and added tournament admin tools.

## Tech Stack

| Before | After | Description |
| --- | --- | --- |
| Vue 3 | React 19 | Frontend framework |
| JavaScript | TypeScript 6 | Development language |
| Vite 7 | Vite 8 | Build tool |
| Vue Router 4 | React Router 7 | Routing |
| Vuex 4 | Zustand + TanStack Query | Client state and server data management |
| Axios | Axios | API requests |
| Element Plus | shadcn/ui + Radix UI | UI component library |
| Tailwind CSS v4 | Tailwind CSS v4 | Styling system |
| Element Plus Icons, lucide-vue-next | Phosphor Icons | Icon library |
| vue-i18n | i18next + react-i18next | Internationalization |
| wangEditor | Tiptap | Rich-text editor |
| Element Plus Form | React Hook Form + Zod | Forms and validation |
| Element Plus Table | TanStack Table + custom admin tables | Table management |
| - | Recharts | Charts |
| Element Plus Message | Sonner | Toast notifications |
| Custom styles | next-themes | Theme switching |
| VueUse, lodash, qss, nprogress | date-fns, clsx, tailwind-merge, DOMPurify | Utilities and content processing |
| - | `@jack-house-analytics/core`, `@jack-house-analytics/react` | Analytics |
| ExcelJS, file-saver | - | File export |
| Swiper | - | Carousel component |

## Project Structure

```text
src/
  app/                 App entry, providers, router, and lazy pages
  assets/              Static images and visual assets
  components/ui/       shadcn/ui and base UI components
  entities/            Domain models, API queries, and types
  features/            Reusable business features such as auth, comments, uploads, rich text, and admin permissions
  pages/               Page-level modules
  shared/              Shared infrastructure such as API, i18n, analytics, and common components
  types/               Global type additions
```

## Local Development

1. Install dependencies

```sh
pnpm install
```

2. Start development server

```sh
pnpm dev --host 127.0.0.1
```

3. Build for production

```sh
pnpm build
```