import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

export function normalizePhone(
  phone: string,
  country: string, // "EC", "MX", "CO", etc
): string | null {
  try {
    const parsed = parsePhoneNumberFromString(phone, country as CountryCode);

    if (!parsed || !parsed.isValid()) {
      return null;
    }

    // Devuelve formato internacional: +593987654321
    return parsed.format("E.164");
  } catch (err) {
    return null;
  }
}
