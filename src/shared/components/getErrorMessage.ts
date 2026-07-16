import { i18n } from "@/shared/i18n/client"
import { ApiError } from "@/shared/api/errors"

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && isGenericTransportMessage(error.message)) {
    if (error.kind === "auth") return i18n.t("common.loginRequired")
    if (error.kind === "forbidden") return i18n.t("common.permissionDenied")
    if (error.kind === "not-found") return i18n.t("common.resourceNotFound")
    if (error.kind === "network") return i18n.t("common.networkError")
    if (error.kind === "server") return i18n.t("common.serviceUnavailable")
  }
  return error instanceof Error ? error.message : i18n.t("common.unknownError")
}

function isGenericTransportMessage(message: string) {
  return /^(?:Request failed with status code \d+|Network Error|timeout of \d+ms exceeded)$/i.test(message)
}
