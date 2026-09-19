"use client"

import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { COUNTRIES, DEFAULT_COUNTRY_ISO, findCountry } from "@/lib/phone"
import { cn } from "@/lib/utils"

/**
 * Country-code picker for a mobile number field.
 *
 * A plain `<select>` rather than the Radix one used elsewhere in the console:
 * these forms post to Server Actions as `FormData`, and a native control
 * submits its value with no client JavaScript involved. Ghana is preselected.
 *
 * The closed control shows only the dial code. That is all that matters once a
 * country is chosen, and it avoids the flag emoji, which Windows has no glyph
 * for and falls back to rendering as the bare country initials. A native
 * `<select>` paints the selected option's own text in the closed control, so
 * that text is hidden with `text-transparent` and the dial code drawn over it
 * instead; the options keep their full names for the dropdown, where there is
 * room for them. The flag is gone from the options too — it renders as those
 * same initials on Windows, which is noise beside the name spelled out next to
 * it.
 *
 * Width comes from that drawn dial code — it is the only child in normal flow,
 * so the wrapper shrink-wraps it and the overlaid `<select>` stretches to
 * match. The field is therefore exactly as wide as `+233` plus its padding,
 * and the number input beside it takes everything else.
 */
export function CountrySelect({
  name = "country",
  defaultValue = DEFAULT_COUNTRY_ISO,
  className,
  "aria-label": ariaLabel = "Country code",
}: {
  name?: string
  defaultValue?: string
  className?: string
  "aria-label"?: string
}) {
  const [iso2, setIso2] = useState(defaultValue)
  const selected = findCountry(iso2) ?? COUNTRIES[0]

  return (
    <div
      className={cn(
        "relative inline-flex h-9 shrink-0 items-center",
        className
      )}
    >
      <select
        name={name}
        value={iso2}
        onChange={(event) => setIso2(event.target.value)}
        aria-label={ariaLabel}
        className={cn(
          // Mirrors Input's height, radius, border and fill so the pair reads
          // as one control split in two. `appearance-none` drops the platform
          // arrow in favour of the chevron below, matching the Radix select.
          "absolute inset-0 appearance-none rounded-4xl border border-input bg-input/30 pr-6 pl-3 text-base text-transparent transition-colors outline-none md:text-sm",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {COUNTRIES.map((country) => (
          // The dropdown is drawn by the OS and inherits neither the
          // translucent fill nor the transparent text above. Without an opaque
          // colour pair the names render light on light in dark mode.
          <option
            key={country.iso2}
            value={country.iso2}
            className="bg-background text-foreground"
          >
            +{country.dialCode} {country.name}
          </option>
        ))}
      </select>

      {/* In normal flow so it sets the width, and hidden from assistive tech:
          the select above already announces the country and the field label.
          Its padding must match the select's for the two to line up. */}
      <span
        aria-hidden
        className="pointer-events-none pr-6 pl-3 text-base md:text-sm"
      >
        +{selected.dialCode}
      </span>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
