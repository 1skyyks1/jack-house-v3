# 4Key Jack House
<br />
<p align="center">
    <a href="https://www.jackhouse.xyz/">
        <img src="src/assets/pic/jackHouseLight.png" alt="Logo" width="320" height="80">
    </a>
</p>
<div align="center">
    一个为叠键玩家打造的社区
    <br />
    <br />

**[English](README.md)**
·
**[简体中文](README_zh.md)**
</div>

## 升级

`jack-house-v3` 是 Jack House 新版官网前端仓库，替代旧项目 `jack-house-web/frontend`。

项目基于 React、TypeScript 和 Vite 构建，继续复用现有后端、数据库、API 协议、上传流程和社区数据，主要重构论坛、图包、活动、赛事和后台管理体验。

1. 体验：页面视觉和交互全面重做，首页全屏沉浸式展示，移动端和中英文文案重新整理。
2. 发帖：编辑器富文本能力增强，支持粘贴图片，帖子目录体验优化。
3. 图包：优化图包介绍、详情页、下载链接、评论和维护流程。
4. 赛事：新增赛事管理、组队报名、资格赛排名、对阵图、比赛详情和裁判工作台。
5. 后台：新增运营数据看板，重做权限控制，新增赛事后台。

## 技术栈

| Before | After | Description |
| --- | --- | --- |
| Vue 3 | React 19 | 开发框架 |
| JavaScript | TypeScript 6 | 开发语言 |
| Vite 7 | Vite 8 | 构建工具 |
| Vue Router 4 | React Router 7 | 路由管理 |
| Vuex 4 | Zustand + TanStack Query | 客户端状态与服务端数据管理 |
| Axios | Axios | API 请求 |
| Element Plus | shadcn/ui + Radix UI | UI 组件库 |
| Tailwind CSS v4 | Tailwind CSS v4 | 样式系统 |
| Element Plus Icons、lucide-vue-next | Phosphor Icons | 图标库 |
| vue-i18n | i18next + react-i18next | 国际化 |
| wangEditor | Tiptap | 富文本编辑器 |
| Element Plus Form | React Hook Form + Zod | 表单与校验 |
| Element Plus Table | TanStack Table + 自定义后台表格 | 表格管理 |
| - | Recharts | 数据图表 |
| Element Plus Message | Sonner | Toast 轻提示 |
| 自定义样式 | next-themes | 主题切换 |
| VueUse、lodash、qss、nprogress | date-fns、clsx、tailwind-merge、DOMPurify | 工具函数与内容处理 |
| - | `@jack-house-analytics/core`、`@jack-house-analytics/react` | 访问统计 |
| ExcelJS、file-saver | - | 文件导出 |
| Swiper | - | 轮播组件 |

## 项目结构

```text
src/
  app/                 应用入口、Provider、路由和懒加载页面
  assets/              静态图片和视觉素材
  components/ui/       shadcn/ui 与基础 UI 组件
  entities/            领域模型、API 查询和类型定义
  features/            可复用业务能力，如认证、评论、上传、富文本、后台权限
  pages/               页面级模块
  shared/              跨领域共享能力，如 API、i18n、analytics、通用组件
  types/               全局类型补充
```

## 本地开发

1. 安装依赖

```sh
pnpm install
```

2. 启动开发服务

```sh
pnpm dev --host 127.0.0.1
```

3. 生产构建

```sh
pnpm build
```