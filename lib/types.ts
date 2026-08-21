/**
 * Wire types for the Beautys admin API.
 *
 * These mirror `server/src/schemas/*` and the shapes `server/src/admin/*`
 * returns. The core entity types are deliberately identical to the mobile
 * client's `mobile/lib/types.ts` so the two front-ends describe the same API
 * the same way; the `Admin*` types below cover the joined, aggregated shapes
 * only the dashboard sees.
 */

export type Role = "SUBSCRIBER" | "PROVIDER" | "ADMIN"

export interface User {
  _id: string
  id: string
  mobile: string
  username: string
  email: string
  role: Role
  isSuspended?: boolean
  paystackAuthorizationLast4?: string | null
  paystackAuthorizationBank?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse extends User {
  accessToken: string
  refreshToken?: string
}

// ---- Catalog ----

export interface ServiceCategory {
  _id: string
  name: string
  description?: string
  icon?: string | null
  isActive: boolean
  createdAt?: string
}

/** `GET /admin/categories` — includes soft-deleted rows and usage counts. */
export interface AdminCategory extends ServiceCategory {
  providerCount: number
}

// ---- Provider profile ----

export type VerificationStatus =
  | "UNSUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"

export interface ProviderServiceItem {
  _id: string
  name: string
  categoryId: string
  description?: string
  price: number
  durationMinutes: number
  isActive: boolean
}

export interface PortfolioItem {
  _id: string
  url: string
  caption?: string
  uploadedAt: string
}

export interface ProviderVerification {
  idDocumentUrl?: string | null
  licenseDocumentUrl?: string | null
  licenseNumber?: string | null
  status: VerificationStatus
  rejectionReason?: string | null
  reviewedAt?: string | null
}

export interface GeoPoint {
  type: "Point"
  /** `[lng, lat]` — GeoJSON order. */
  coordinates: number[]
}

export interface ProviderProfile {
  _id: string
  /** The provider's *user* id — what bookings and the public API key off. */
  userId: string
  businessName?: string
  bio?: string
  categories: string[]
  services: ProviderServiceItem[]
  portfolio: PortfolioItem[]
  verification: ProviderVerification
  location: GeoPoint
  isOnline: boolean
  avgRating: number
  reviewCount: number
  payoutChannel?: "bank" | "mobile_money" | null
  payoutAccountNumber?: string | null
  payoutAccountName?: string | null
  payoutVerified: boolean
  createdAt?: string
  updatedAt?: string
}

// ---- Bookings ----

export type BookingStatus =
  | "AWAITING_PAYMENT"
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export type PaymentStatus = "PENDING" | "PAID" | "FAILED"
export type SettlementStatus = "NONE" | "PENDING" | "SUCCEEDED" | "FAILED"
export type PaymentChannel = "mobile_money" | "card"
export type MomoProvider = "mtn" | "vod" | "atl"
export type ActorType = "CLIENT" | "PROVIDER" | "ADMIN" | "SYSTEM"

export interface BookingStatusHistoryEntry {
  status: BookingStatus
  changedAt: string
  changedBy?: string | null
  actorType: ActorType
  note?: string | null
}

export interface Booking {
  _id: string
  clientId: string
  providerId: string
  serviceId: string
  serviceName: string
  price: number
  durationMinutes: number
  status: BookingStatus
  scheduledAt: string
  isScheduled: boolean
  clientAddress: string
  clientLocation: GeoPoint
  eta?: { minutes?: number | null; calculatedAt?: string | null }
  statusHistory: BookingStatusHistoryEntry[]
  cancellation?: {
    reason?: string | null
    cancelledBy?: string | null
    cancelledAt?: string | null
  } | null
  paymentChannel: PaymentChannel
  momoProvider?: MomoProvider | null
  momoPhone?: string | null
  paymentStatus: PaymentStatus
  paymentReconciliationNeeded?: boolean
  refundStatus: SettlementStatus
  refundAmount: number
  payoutStatus: SettlementStatus
  payoutAmount: number
  createdAt?: string
  updatedAt?: string
}

export interface Transaction {
  _id: string
  bookingId: string
  clientId: string
  providerId: string
  amount: number
  currency: string
  channel: PaymentChannel
  momoProvider?: MomoProvider | null
  paystackReference?: string | null
  status: "PENDING" | "SUCCEEDED" | "FAILED"
  refundStatus: SettlementStatus
  refundAmount: number
  payoutStatus: SettlementStatus
  payoutAmount: number
  createdAt?: string
}

export interface Review {
  _id: string
  bookingId: string
  clientId: string
  providerId: string
  rating: number
  comment?: string
  createdAt?: string
}

// ---- Admin list rows (entity + the joins the dashboard renders) ----

export interface AdminUserRow extends User {
  bookingCount: number
  completedCount: number
  lifetimeValue: number
  lastBookingAt: string | null
}

export interface AdminProviderRow {
  _id: string
  userId: string
  businessName?: string
  bio?: string
  isOnline: boolean
  avgRating: number
  reviewCount: number
  payoutVerified: boolean
  verification: ProviderVerification
  services: ProviderServiceItem[]
  categories: string[]
  activeServices: number
  minPrice: number | null
  username: string
  email: string
  mobile: string
  isSuspended: boolean
  bookingCount: number
  completedCount: number
  grossRevenue: number
  createdAt?: string
}

export interface AdminBookingRow
  extends Omit<Booking, "statusHistory" | "clientLocation"> {
  clientName: string
  clientMobile: string
  providerName: string
  providerMobile: string
}

export interface AdminTransactionRow extends Transaction {
  clientName: string
  providerName: string
  serviceName: string
  bookingStatus: BookingStatus | null
}

export interface AdminReviewRow extends Review {
  clientName: string
  providerName: string
  serviceName: string
}

export interface AdminBroadcastRow {
  title: string
  body: string
  sentAt: string
  recipients: number
  readCount: number
}

export interface AdminActivityRow {
  bookingId: string
  serviceName: string
  status: BookingStatus
  changedAt: string
  note: string | null
  adminName: string
}

// ---- Admin detail payloads ----

export interface AdminUserDetail {
  user: User
  profile: ProviderProfile | null
  stats: {
    bookings: number
    completed: number
    cancelled: number
    value: number
    payout: number
    refunded: number
    reviewCount: number
    avgRating: number
    unreadNotifications: number
  }
  recentBookings: (Booking & { counterpartyName: string })[]
}

export interface AdminProviderDetail {
  profile: ProviderProfile
  user: User | null
  categories: ServiceCategory[]
  stats: {
    bookings: number
    completed: number
    cancelled: number
    gross: number
    payout: number
    pendingPayout: number
  }
  recentBookings: (Booking & { clientName: string })[]
  reviews: (Review & { clientName: string })[]
}

export interface AdminBookingDetail {
  booking: Booking
  client: User | null
  provider: User | null
  transaction: Transaction | null
  review: Review | null
  statusHistory: (BookingStatusHistoryEntry & { actorName: string })[]
}

// ---- Analytics ----

export interface WindowMetrics {
  gmv: number
  platformRevenue: number
  payouts: number
  refunds: number
  transactionCount: number
  bookings: number
  completedBookings: number
  failedBookings: number
  bookingValue: number
  avgBookingValue: number
  completionRate: number
  newUsers: number
  newClients: number
  newProviders: number
}

export interface StandingTotals {
  totalUsers: number
  totalClients: number
  totalProviders: number
  totalAdmins: number
  suspendedUsers: number
  providerProfiles: number
  onlineProviders: number
  approvedProviders: number
  pendingVerifications: number
  rejectedProviders: number
  unsubmittedProviders: number
  payoutReadyProviders: number
  activeBookings: number
  totalReviews: number
  avgRating: number
  paymentsNeedingAttention: number
}

export interface AnalyticsOverview {
  range: {
    from: string
    to: string
    previousFrom: string
    previousTo: string
  }
  current: WindowMetrics
  previous: WindowMetrics
  /** Percentage change vs the previous window; null when there is no baseline. */
  deltas: Partial<Record<keyof WindowMetrics, number | null>>
  totals: StandingTotals
}

export interface SeriesPoint {
  date: string
  gmv: number
  platformRevenue: number
  payouts: number
  refunds: number
  transactions: number
  bookings: number
  completed: number
  cancelled: number
  newClients: number
  newProviders: number
}

export interface AnalyticsTimeseries {
  range: { from: string; to: string }
  series: SeriesPoint[]
}

export interface AnalyticsBreakdown {
  range: { from: string; to: string }
  statusBreakdown: { status: BookingStatus; count: number; value: number }[]
  channelBreakdown: {
    channel: PaymentChannel
    momoProvider: MomoProvider | null
    count: number
    amount: number
  }[]
  categoryBreakdown: {
    categoryId: string | null
    name: string
    bookings: number
    revenue: number
  }[]
  topServices: { name: string; bookings: number; revenue: number }[]
  hourlyDemand: { hour: number; bookings: number }[]
}

export interface TopProviderRow {
  providerId: string
  username: string
  businessName: string
  completedJobs: number
  totalBookings: number
  cancelled: number
  gross: number
  payout: number
  avgRating: number
  reviewCount: number
  isOnline: boolean
  verificationStatus: VerificationStatus
}

export interface TopClientRow {
  clientId: string
  username: string
  mobile: string
  bookings: number
  completed: number
  spend: number
  lastBookingAt: string
  isSuspended: boolean
}

// ---- Shared ----

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface TransactionPage extends Paginated<AdminTransactionRow> {
  summary: {
    amount: number
    refunded: number
    paidOut: number
    net: number
  }
}
