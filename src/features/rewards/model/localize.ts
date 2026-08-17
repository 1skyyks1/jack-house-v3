import type { RedemptionOrderItem, RewardItem } from "./types"

export function localizeRewardItem(item: RewardItem, language: string) {
  const preferEnglish = language.toLowerCase().startsWith("en")
  return {
    name: pick(preferEnglish, item.name_en, item.name_zh, item.name),
    description: pick(preferEnglish, item.description_en, item.description_zh, item.description),
    idLabel: pick(preferEnglish, item.id_label_en, item.id_label_zh, item.id_label),
    idPlaceholder: pick(preferEnglish, item.id_placeholder_en, item.id_placeholder_zh, item.id_placeholder),
  }
}

export function localizeRedemptionItemName(item: RedemptionOrderItem, language: string) {
  return pick(language.toLowerCase().startsWith("en"), item.item_name_en, item.item_name_zh, item.item_name)
}

function pick(preferEnglish: boolean, english?: string | null, chinese?: string | null, legacy?: string | null) {
  const values = preferEnglish ? [english, chinese, legacy] : [chinese, english, legacy]
  return values.find((value) => typeof value === "string" && value.trim())?.trim() ?? ""
}
