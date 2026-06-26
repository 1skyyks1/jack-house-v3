import { http } from "@/shared/api/http"
import type { DashboardCounts } from "../model/types"

export async function getDashboardCounts(): Promise<DashboardCounts> {
  return await http.get("/dashboard/home")
}
