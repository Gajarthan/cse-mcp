const moneyFormatter = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const integerFormatter = new Intl.NumberFormat("en-LK", {
  maximumFractionDigits: 0
});

const decimalFormatter = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function asInteger(value: unknown): number | null {
  const numberValue = asNumber(value);
  return numberValue === null ? null : Math.trunc(numberValue);
}

export function toIsoTimestamp(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string") {
    const asNumberValue = Number(value);
    if (Number.isFinite(asNumberValue)) {
      return new Date(asNumberValue).toISOString();
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  return null;
}

export function formatCurrencyLkr(value: number | null): string | null {
  return value === null ? null : `LKR ${moneyFormatter.format(value)}`;
}

export function formatSignedNumber(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${moneyFormatter.format(value)}`;
}

export function formatSignedPercent(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${moneyFormatter.format(value)}%`;
}

export function formatInteger(value: number | null): string | null {
  return value === null ? null : integerFormatter.format(value);
}

export function formatDecimal(value: number | null): string | null {
  return value === null ? null : decimalFormatter.format(value);
}

export function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeSearchText(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function compactSymbol(value: string): string {
  return normalizeSymbol(value).replace(/[^A-Z0-9]/g, "");
}

export function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
