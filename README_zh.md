<p align="center">
    <a href="https://www.jackhouse.xyz/">
        <img src="src/assets/pic/jackHouseLight.png" alt="Logo" width="320" height="80">
    </a>
</p>
<div align="center">
    <strong>4Key Jack House</strong>
    <br />
    一个为叠键玩家打造的社区
    <br />
    <br />

**[English](README.md)**
·
**[简体中文](README_zh.md)**
</div>

## 升级

`jack-house-v3` 是 Jack House 新版官网前端仓库，替代旧项目 `jack-house-web/frontend`。

项目基于 React、TypeScript 和 Vite 构建，继续复用现有后端、数据库、API 协议、上传流程和社区数据，主要重构账号、论坛、图包、活动、赛事、工具和后台管理体验。

1. 体验：页面视觉和交互全面重做，首页全屏沉浸式展示，移动端和中英文文案重新整理。
2. 账号：登录态升级为更安全的 Cookie 会话，支持密码与 osu! 登录，受限操作可在登录后继续。
3. 论坛：增强富文本编辑和图片上传能力，支持本地草稿、帖子目录以及统一的评论体验。
4. 图包：优化图包介绍、详情页、下载链接、评论和维护流程，并支持选择难度后跳转 OMA 分析。
5. 活动：重做活动详情、阶段、规则、个人成绩、排行榜和倒计时展示。
6. 赛事：新增赛事管理、组队报名、资格赛排名、对阵图、比赛详情和裁判工作台。
7. 工具：新增统一工具中心，集成 OMC、OMA 和段位 ACC 计算器。
8. 后台：新增运营数据看板，重做权限控制，新增赛事后台。

## 许可证

除非另有说明，由 yks1 编写的源代码和文档采用
[GNU Affero General Public License v3.0 only](LICENSE) 开放。

Jack House 名称、Logo、视觉识别及原创媒体素材不属于 AGPL-3.0-only 授权范围。
协议适用范围及保留权利详见 [NOTICE.md](NOTICE.md)。

## 引用及相关项目

- [uzxn/acc](https://github.com/uzxn/acc)：段位预设数据及 ACC 计算
- [LeoBlackMT/osumania_map_analyser](https://github.com/LeoBlackMT/osumania_map_analyser)：谱面分析工具组件
- [2419445078-hash/mania-preview-browser-extension](https://github.com/2419445078-hash/mania-preview-browser-extension)：Mania 谱面预览
- [1skyyks1/osu-mappack-creator-v2](https://github.com/1skyyks1/osu-mappack-creator-v2)：合包工具
