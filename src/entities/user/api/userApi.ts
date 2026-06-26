import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { UserProfile } from "../model/types"

export type GetUserListParams = {
  page: number
  pageSize: number
  search?: string
}

export type CreateUserRequest = Pick<UserProfile, "avatar" | "role" | "status" | "user_name"> & {
  password: string
}

export type UpdateUserRequest = Partial<Pick<UserProfile, "avatar" | "discord" | "email" | "osu_uid" | "qq" | "status" | "user_name">> & {
  password?: string
  role?: number
}

export async function getUserList(params: GetUserListParams): Promise<PaginatedEnvelope<UserProfile>> {
  const response = await http.get("/user", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
    },
  })

  return unwrapPagination<UserProfile>(response)
}

export async function getUserById(userId: string): Promise<UserProfile> {
  const response = await http.get(`/user/${userId}`)
  return unwrapData<UserProfile>(response)
}

export async function createUser(request: CreateUserRequest): Promise<void> {
  await http.post("/user", request)
}

export async function updateUser(userId: string, request: UpdateUserRequest): Promise<void> {
  await http.put(`/user/${userId}`, request)
}

export async function deleteUser(userId: number): Promise<void> {
  await http.delete(`/user/${userId}`)
}
