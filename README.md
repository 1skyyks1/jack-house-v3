# 4Key Jack House
<br />
<p align="center">
    <a href="https://www.jackhouse.xyz/">
        <img src="src/assets/pic/jackHouseLight.png" alt="Logo" width="320" height="80">
    </a>
</p>
<div align="center">
    A community built for jack players
    <br />
    <br />

**[English](README.md)**
·
**[简体中文](README_zh.md)**
</div>

## Upgrade

`jack-house-v3` is the frontend repository for the new Jack House website,
replacing the legacy `jack-house-web/frontend` project.

Built with React, TypeScript, and Vite, the project continues to use the
existing backend, database, API contracts, upload flow, and community data. It
primarily rebuilds the experience for the forum, mappacks, events,
tournaments, and admin panel.

1. Experience: redesigned visuals and interactions, an immersive full-screen home page, and refreshed mobile layouts and bilingual copy.
2. Posting: enhanced rich-text editing, image paste support, and an improved post outline experience.
3. Mappacks: improved introductions, detail pages, download links, comments, and maintenance workflows.
4. Tournaments: added tournament management, team registration, qualifier rankings, brackets, match details, and a referee workbench.
5. Admin: added an operations dashboard, rebuilt permission controls, and introduced tournament administration tools.

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

## License

Unless otherwise stated, source code and documentation written by yks1 are
made available under the [MIT License](LICENSE).

The Jack House name, logos, visual identity, and original media assets are
outside the scope of the MIT License. See [NOTICE.md](NOTICE.md) for the exact
license scope and reserved rights.

## References and related projects

- [uzxn/acc](https://github.com/uzxn/acc): dan preset and ACC calculation
- [LeoBlackMT/osumania_map_analyser](https://github.com/LeoBlackMT/osumania_map_analyser): beatmap analysis tool components
- [1skyyks1/osu-mappack-creator-v2](https://github.com/1skyyks1/osu-mappack-creator-v2): map pack creator
