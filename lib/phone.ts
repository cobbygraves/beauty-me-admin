/**
 * Mobile numbers, country codes and the canonical storage format.
 *
 * Every number this platform stores is E.164: a `+`, the country calling code,
 * then the national significant number, with no spaces or punctuation
 * (`+233241234567`). That is the only format the database holds and the only
 * one compared against, so a number entered as `024 123 4567` in Accra and
 * `+233 24 123 4567` from abroad are the same account.
 *
 * Ghana is the default: a number typed with no country context is read as
 * Ghanaian, which keeps every existing client working unchanged.
 *
 * KEEP IN SYNC with `server/src/utils/phone.ts` and
 * `mobile/lib/phone.ts`. The three packages
 * have no shared module, so the country table and parsing rules are mirrored by
 * hand — change one, change all three. The server copy is the reference: it
 * additionally wraps `parseMobile` for request validation.
 */

export interface Country {
  /** ISO 3166-1 alpha-2, and the value stored on the user record. */
  iso2: string
  name: string
  /** Country calling code, digits only, no `+`. */
  dialCode: string
  /**
   * Digit dropped from a number dialled domestically — Ghana's `0` in
   * `024...`. Absent where local and international forms share their digits.
   */
  trunkPrefix?: string
  /** Bounds on the national significant number, used to reject typos. */
  nsnMin: number
  nsnMax: number
  /** Local-format sample, used for input placeholders. */
  example: string
  flag: string
}

/**
 * Countries the platform will accept a number from.
 *
 * Adding a market is one row here (and the same row in the two client copies).
 * Note that SMS delivery is a separate question: see the notification module's
 * SMS providers, where mNotify covers Ghana only.
 */
// prettier-ignore
export const COUNTRIES: Country[] = [
  // Ghana first — it is the default and the launch market.
  { iso2: 'GH', name: 'Ghana', dialCode: '233', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '024 123 4567', flag: '🇬🇭' },
  { iso2: 'NG', name: 'Nigeria', dialCode: '234', trunkPrefix: '0', nsnMin: 8, nsnMax: 10, example: '0801 234 5678', flag: '🇳🇬' },
  { iso2: 'CI', name: "Côte d'Ivoire", dialCode: '225', nsnMin: 8, nsnMax: 10, example: '01 23 45 67 89', flag: '🇨🇮' },
  { iso2: 'TG', name: 'Togo', dialCode: '228', nsnMin: 8, nsnMax: 8, example: '90 12 34 56', flag: '🇹🇬' },
  { iso2: 'BJ', name: 'Benin', dialCode: '229', nsnMin: 8, nsnMax: 10, example: '01 90 12 34 56', flag: '🇧🇯' },
  { iso2: 'BF', name: 'Burkina Faso', dialCode: '226', nsnMin: 8, nsnMax: 8, example: '70 12 34 56', flag: '🇧🇫' },
  { iso2: 'SN', name: 'Senegal', dialCode: '221', nsnMin: 9, nsnMax: 9, example: '77 123 45 67', flag: '🇸🇳' },
  { iso2: 'ML', name: 'Mali', dialCode: '223', nsnMin: 8, nsnMax: 8, example: '70 12 34 56', flag: '🇲🇱' },
  { iso2: 'GM', name: 'Gambia', dialCode: '220', nsnMin: 7, nsnMax: 7, example: '301 2345', flag: '🇬🇲' },
  { iso2: 'SL', name: 'Sierra Leone', dialCode: '232', trunkPrefix: '0', nsnMin: 8, nsnMax: 8, example: '025 123456', flag: '🇸🇱' },
  { iso2: 'LR', name: 'Liberia', dialCode: '231', trunkPrefix: '0', nsnMin: 7, nsnMax: 9, example: '077 123 456', flag: '🇱🇷' },
  { iso2: 'CM', name: 'Cameroon', dialCode: '237', nsnMin: 9, nsnMax: 9, example: '6 71 23 45 67', flag: '🇨🇲' },
  { iso2: 'KE', name: 'Kenya', dialCode: '254', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '0712 345678', flag: '🇰🇪' },
  { iso2: 'UG', name: 'Uganda', dialCode: '256', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '0712 345678', flag: '🇺🇬' },
  { iso2: 'TZ', name: 'Tanzania', dialCode: '255', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '0712 345678', flag: '🇹🇿' },
  { iso2: 'RW', name: 'Rwanda', dialCode: '250', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '0788 123456', flag: '🇷🇼' },
  { iso2: 'ZM', name: 'Zambia', dialCode: '260', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '0955 123456', flag: '🇿🇲' },
  { iso2: 'ZA', name: 'South Africa', dialCode: '27', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '071 234 5678', flag: '🇿🇦' },
  { iso2: 'EG', name: 'Egypt', dialCode: '20', trunkPrefix: '0', nsnMin: 9, nsnMax: 10, example: '010 1234 5678', flag: '🇪🇬' },
  { iso2: 'MA', name: 'Morocco', dialCode: '212', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '0612 345678', flag: '🇲🇦' },
  { iso2: 'GB', name: 'United Kingdom', dialCode: '44', trunkPrefix: '0', nsnMin: 9, nsnMax: 10, example: '07400 123456', flag: '🇬🇧' },
  { iso2: 'US', name: 'United States', dialCode: '1', trunkPrefix: '1', nsnMin: 10, nsnMax: 10, example: '(202) 555 0123', flag: '🇺🇸' },
  { iso2: 'CA', name: 'Canada', dialCode: '1', trunkPrefix: '1', nsnMin: 10, nsnMax: 10, example: '(416) 555 0123', flag: '🇨🇦' },
  { iso2: 'AE', name: 'United Arab Emirates', dialCode: '971', trunkPrefix: '0', nsnMin: 9, nsnMax: 9, example: '050 123 4567', flag: '🇦🇪' },
]

/** The market the platform launched in, and the fallback for any bare number. */
export const DEFAULT_COUNTRY_ISO = "GH"

/**
 * Dial codes longest-first, so `+233` is matched before `+23` would be. Shared
 * dial codes (US and Canada both use `1`) resolve to whichever country appears
 * first in `COUNTRIES`; that only affects the stored country label, never the
 * number itself.
 */
const BY_DIAL_CODE_LENGTH = [...COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
)

export interface NormalizedMobile {
  /** Canonical storage form, e.g. `+233241234567`. */
  e164: string
  countryIso: string
  dialCode: string
  /** The number without its country code, e.g. `241234567`. */
  nationalNumber: string
}

export type ParseResult =
  { ok: true; value: NormalizedMobile } | { ok: false; reason: string }

export function findCountry(iso2: string | null | undefined): Country | null {
  if (!iso2) return null
  const upper = iso2.trim().toUpperCase()
  return COUNTRIES.find((country) => country.iso2 === upper) ?? null
}

export function isSupportedCountry(iso2: string | null | undefined): boolean {
  return findCountry(iso2) !== null
}

function fits(country: Country, nsnLength: number): boolean {
  return nsnLength >= country.nsnMin && nsnLength <= country.nsnMax
}

function build(country: Country, nsn: string): NormalizedMobile {
  return {
    e164: `+${country.dialCode}${nsn}`,
    countryIso: country.iso2,
    dialCode: country.dialCode,
    nationalNumber: nsn,
  }
}

/** Reads a number already carrying its country code. */
function parseInternational(digits: string): ParseResult {
  for (const country of BY_DIAL_CODE_LENGTH) {
    if (!digits.startsWith(country.dialCode)) continue

    const nsn = digits.slice(country.dialCode.length)
    if (fits(country, nsn.length))
      return { ok: true, value: build(country, nsn) }
  }

  return {
    ok: false,
    reason:
      "That international number is not one we recognise. Check the country code and the number.",
  }
}

/**
 * Turns anything a person might type into E.164.
 *
 * Accepts three shapes, so no caller has to pre-format:
 *  - `+233241234567` — already international, the country argument is ignored
 *  - `233241234567` — international without the plus
 *  - `024 123 4567` / `241234567` — local to `countryIso`
 */
export function parseMobile(
  raw: string | null | undefined,
  countryIso: string = DEFAULT_COUNTRY_ISO
): ParseResult {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return { ok: false, reason: "Enter a mobile number." }

  const digits = trimmed.replace(/\D/g, "")
  if (!digits) return { ok: false, reason: "Enter a mobile number." }

  // An explicit `+` is the user telling us the country code is already there.
  if (trimmed.startsWith("+")) return parseInternational(digits)

  const country = findCountry(countryIso)
  if (!country) {
    return { ok: false, reason: "Choose a country for this mobile number." }
  }

  // `233241234567` — the country code is present, the plus just wasn't typed.
  // Only treated that way when the remainder is a plausible national number,
  // so a local number that happens to start with its own dial code still works.
  if (digits.startsWith(country.dialCode)) {
    const withoutDialCode = digits.slice(country.dialCode.length)
    if (fits(country, withoutDialCode.length)) {
      return { ok: true, value: build(country, withoutDialCode) }
    }
  }

  // Local form: drop the trunk prefix if dropping it leaves a valid number.
  let nsn = digits
  if (country.trunkPrefix && nsn.startsWith(country.trunkPrefix)) {
    const withoutTrunk = nsn.slice(country.trunkPrefix.length)
    if (fits(country, withoutTrunk.length)) nsn = withoutTrunk
  }

  if (!fits(country, nsn.length)) {
    const expected =
      country.nsnMin === country.nsnMax
        ? `${country.nsnMin} digits`
        : `${country.nsnMin} to ${country.nsnMax} digits`
    return {
      ok: false,
      reason: `That does not look like a ${country.name} mobile number — expected ${expected} after the country code.`,
    }
  }

  return { ok: true, value: build(country, nsn) }
}

/** The country a stored E.164 number belongs to, or null if unrecognised. */
export function countryOfE164(e164: string): Country | null {
  const digits = (e164 ?? "").replace(/\D/g, "")
  for (const country of BY_DIAL_CODE_LENGTH) {
    if (!digits.startsWith(country.dialCode)) continue
    if (fits(country, digits.length - country.dialCode.length)) return country
  }
  return null
}

/**
 * The number without its country code, which is what most national carriers
 * and payment rails expect. Falls back to the digits as given.
 */
export function nationalNumberOf(e164: string): string {
  const digits = (e164 ?? "").replace(/\D/g, "")
  const country = countryOfE164(e164)
  return country ? digits.slice(country.dialCode.length) : digits
}

/**
 * The number as it would be dialled inside its own country — `+233241234567`
 * becomes `0241234567`.
 *
 * This is the format single-country providers want: mNotify for SMS, Paystack
 * for Ghanaian mobile money. Nothing is stored this way; it exists only at the
 * edge where a canonical number meets a service that has never heard of E.164.
 */
export function toLocalFormat(e164: string): string {
  const country = countryOfE164(e164)
  const nsn = nationalNumberOf(e164)
  if (!country) return nsn
  return `${country.trunkPrefix ?? ""}${nsn}`
}

/** Readable form for the UI: `+233 24 123 4567`. */
export function formatMobile(e164: string): string {
  const country = countryOfE164(e164)
  if (!country) return e164

  const nsn = nationalNumberOf(e164)
  // Grouped from the right in threes, with the leading 2-3 digits kept whole,
  // which reads correctly for the operator-prefix layout most markets use.
  const head = nsn.length % 3 === 1 ? nsn.slice(0, 4) : nsn.slice(0, 3)
  const rest = nsn.slice(head.length)
  const groups = rest.match(/.{1,3}/g) ?? []

  return `+${country.dialCode} ${[head, ...groups].join(" ")}`.trim()
}

/**
 * `+233241234567` becomes `+233 24****567` — enough for the account holder to
 * recognise their own number without disclosing it to whoever is looking.
 */
export function maskMobile(e164: string): string {
  const country = countryOfE164(e164)
  if (!country) {
    // Unknown shape: mask the middle of whatever we were given.
    if (e164.length <= 6) return e164
    return `${e164.slice(0, 3)}${"*".repeat(e164.length - 6)}${e164.slice(-3)}`
  }

  const nsn = nationalNumberOf(e164)
  if (nsn.length <= 5) return `+${country.dialCode} ${nsn}`

  const masked = `${nsn.slice(0, 2)}${"*".repeat(nsn.length - 5)}${nsn.slice(-3)}`
  return `+${country.dialCode} ${masked}`
}
