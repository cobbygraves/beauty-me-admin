import "server-only"

import { apiFetch } from "@/lib/api"
import type {
  AdminActivityRow,
  AdminBookingDetail,
  AdminBookingRow,
  AdminBroadcastRow,
  AdminCategory,
  AdminProviderDetail,
  AdminProviderRow,
  AdminReviewRow,
  AdminUserDetail,
  AdminUserRow,
  AnalyticsBreakdown,
  AnalyticsOverview,
  AnalyticsTimeseries,
  Paginated,
  ServiceCategory,
  TopClientRow,
  TopProviderRow,
  TransactionPage,
  User,
} from "@/lib/types"

/**
 * Typed surface over `server/src/admin/*`.
 *
 * Every function here is a thin, named binding to one endpoint — pages import
 * these rather than hand-assembling URLs, so a route rename is a single edit
 * and every caller gets the right response type.
 */

export type ListParams = Record<
  string,
  string | number | boolean | undefined | null
>

// ---- Analytics ----

export function getAnalyticsOverview(params: ListParams = {}) {
  return apiFetch<AnalyticsOverview>("/admin/analytics/overview", {
    query: params,
  })
}

export function getAnalyticsTimeseries(params: ListParams = {}) {
  return apiFetch<AnalyticsTimeseries>("/admin/analytics/timeseries", {
    query: params,
  })
}

export function getAnalyticsBreakdown(params: ListParams = {}) {
  return apiFetch<AnalyticsBreakdown>("/admin/analytics/breakdown", {
    query: params,
  })
}

export function getTopProviders(params: ListParams = {}) {
  return apiFetch<TopProviderRow[]>("/admin/analytics/top-providers", {
    query: params,
  })
}

export function getTopClients(params: ListParams = {}) {
  return apiFetch<TopClientRow[]>("/admin/analytics/top-clients", {
    query: params,
  })
}

export function getAdminActivity() {
  return apiFetch<AdminActivityRow[]>("/admin/activity")
}

export interface QueueCounts {
  pendingVerifications: number
  paymentsNeedingAttention: number
  openDisputes: number
  activeBookings: number
}

export function getQueueCounts() {
  return apiFetch<QueueCounts>("/admin/queue")
}

// ---- Users ----

export function listUsers(params: ListParams = {}) {
  return apiFetch<Paginated<AdminUserRow>>("/admin/users", { query: params })
}

export function getUserDetail(id: string) {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`)
}

export function listAdmins() {
  return apiFetch<User[]>("/admin/admins")
}

// ---- Providers ----

export function listProviders(params: ListParams = {}) {
  return apiFetch<Paginated<AdminProviderRow>>("/admin/providers", {
    query: params,
  })
}

export function getProviderDetail(id: string) {
  return apiFetch<AdminProviderDetail>(`/admin/providers/${id}`)
}

// ---- Bookings ----

export function listBookings(params: ListParams = {}) {
  return apiFetch<Paginated<AdminBookingRow>>("/admin/bookings", {
    query: params,
  })
}

/**
 * Payouts frozen by a client dispute and still awaiting a ruling.
 *
 * A thin preset over `listBookings` rather than its own endpoint, so the queue
 * inherits the same search, pagination and name enrichment. Sorted oldest
 * first: the wait that matters is how long a provider's money has been frozen.
 */
export function listDisputes(params: ListParams = {}) {
  return listBookings({ ...params, disputed: "true", sort: "payoutDisputedAt" })
}

export function getBookingAudit(id: string) {
  return apiFetch<AdminBookingDetail>(`/admin/bookings/${id}/audit`)
}

// ---- Money ----

export function listTransactions(params: ListParams = {}) {
  return apiFetch<TransactionPage>("/admin/transactions", { query: params })
}

// ---- Moderation ----

export function listReviews(params: ListParams = {}) {
  return apiFetch<Paginated<AdminReviewRow>>("/admin/reviews", {
    query: params,
  })
}

// ---- Catalog ----

export function listCategories() {
  return apiFetch<AdminCategory[]>("/admin/categories")
}

/** The public, active-only list — used to populate category pickers. */
export function listActiveCategories() {
  return apiFetch<ServiceCategory[]>("/catalog/categories")
}

// ---- Broadcasts ----

export function listBroadcasts(params: ListParams = {}) {
  return apiFetch<Paginated<AdminBroadcastRow>>("/admin/broadcasts", {
    query: params,
  })
}
