"use client";
import { SPORTS, COUNTRIES, CURRENCIES, TIMEZONES } from "@/lib/sports";

import { usePreferences } from "@/app/preferences";
export function SportSelect({
  name = "sport",
  value,
  defaultValue,
  required = true,
  onChange,
  allowBlank = false,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onChange?: (s: string) => void;
  allowBlank?: boolean;
}) {
  const { locale, t } = usePreferences();
  return (
    <select
      name={name}
      value={value}
      defaultValue={defaultValue}
      required={required}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">{allowBlank ? "—" : t("Choose a sport")}</option>
      {defaultValue &&
        !SPORTS.some((s) => s[0] === defaultValue || s[1] === defaultValue) && (
          <option value={defaultValue}>{defaultValue}</option>
        )}
      {SPORTS.map(([id, en]) => (
        <option key={id} value={id}>
          {locale === "id" ? id : en}
        </option>
      ))}
    </select>
  );
}
export function CountrySelect({
  name = "country",
  defaultValue = "ID",
  value,
  onChange,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (s: string) => void;
}) {
  const { locale } = usePreferences();
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return (
    <select
      name={name}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {COUNTRIES.map((code) => ({ code, name: names.of(code) || code }))
        .sort((a, b) => a.name.localeCompare(b.name, locale))
        .map((c) => (
          <option value={c.code} key={c.code}>
            {c.name} ({c.code})
          </option>
        ))}
    </select>
  );
}
export function ZoneSelect({
  name = "timezone",
  defaultValue = "Asia/Jakarta",
}: {
  name?: string;
  defaultValue?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue}>
      {Array.from(new Set([defaultValue, ...TIMEZONES, "UTC"]))
        .sort()
        .map((z) => (
          <option value={z} key={z}>
            {z.replaceAll("_", " ")}
          </option>
        ))}
    </select>
  );
}
export function CurrencySelect({
  defaultValue = "IDR",
}: {
  defaultValue?: string;
}) {
  const { locale } = usePreferences();
  const names = new Intl.DisplayNames([locale], { type: "currency" });
  return (
    <select name="currency" defaultValue={defaultValue}>
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c} · {names.of(c)}
        </option>
      ))}
    </select>
  );
}
