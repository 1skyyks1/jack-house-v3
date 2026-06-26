import { unwrapData } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { PermissionEnvelope } from "@/shared/api/contracts/common"
import type { UserProfile } from "@/entities/user"

export type LoginRequest = {
  identifier: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  username: string
}

export type AuthSessionResponse = {
  message?: string
  token: string
  userId: number
}

export async function login(request: LoginRequest): Promise<AuthSessionResponse> {
  const response = await http.post("/auth/login", request)
  return unwrapData<AuthSessionResponse>(response)
}

export async function register(request: RegisterRequest): Promise<AuthSessionResponse> {
  const response = await http.post("/auth/register", request)
  return unwrapData<AuthSessionResponse>(response)
}

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await http.get("/user/info")
  return unwrapData<UserProfile>(response)
}

export async function getPermissions(): Promise<PermissionEnvelope> {
  const response = await http.get("/permissions")
  return unwrapData<PermissionEnvelope>(response)
}
