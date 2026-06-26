import { i18n } from "@/shared/i18n/client"

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : i18n.t("common.unknownError")
}
