export const TOOL_CATALOG = [
  {
    access: "authenticated",
    descriptionKey: "tools.aiImageDescription",
    icon: "sparkle",
    id: "ai-image",
    titleKey: "tools.aiImageTitle",
    to: "/tool/aimg",
  },
  {
    access: "public",
    descriptionKey: "tools.accDescription",
    icon: "calculator",
    id: "accuracy-calculator",
    titleKey: "tools.accTitle",
    to: "/tool/acc",
  },
  {
    access: "authenticated",
    descriptionKey: "tools.maniaDescription",
    icon: "analysis",
    id: "mania-analyser",
    titleKey: "tools.maniaTitle",
    to: "/tool/oma",
  },
  {
    access: "public",
    descriptionKey: "tools.mappackDescription",
    icon: "package",
    id: "mappack-creator",
    titleKey: "tools.mappackTitle",
    to: "/tool/omc",
  },
] as const

export type ToolDefinition = (typeof TOOL_CATALOG)[number]
