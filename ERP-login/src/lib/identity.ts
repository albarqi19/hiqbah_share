// Pure identity classification + normalization for the "smart identity field"
// described in the Login & Access Portal tech doc (Section 11.3 / 16.2).
// No server-only dependency. Currently called only from the login route for
// input validation; the deterministic type priority below is groundwork for a
// future unified identity field (national ID / email / phone / username).

export type IdentityType = "EMAIL" | "PHONE" | "NATIONAL_ID" | "USERNAME";

export type NormalizedIdentity = {
  type: IdentityType;
  value: string;
};

export const MAX_IDENTITY_LENGTH = 100;

export class InvalidIdentityError extends Error {}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Saudi national ID / Iqama: exactly 10 digits, starting with 1 or 2.
const NATIONAL_ID_PATTERN = /^[12][0-9]{9}$/;
// Local mobile (05XXXXXXXX) or a leading-"+" international number.
// Full E.164 parsing/validation is a future improvement (doc Section 16.2).
const PHONE_PATTERN = /^(\+[0-9]{8,15}|0[0-9]{9,10})$/;

// Priority order is deterministic and fixed: EMAIL > NATIONAL_ID > PHONE > USERNAME.
// Callers must never reveal which type matched in client-facing errors (doc R18).
export function normalizeIdentity(raw: string): NormalizedIdentity {
  if (typeof raw !== "string") {
    throw new InvalidIdentityError("Identity is required");
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new InvalidIdentityError("Identity is required");
  }
  if (trimmed.length > MAX_IDENTITY_LENGTH) {
    throw new InvalidIdentityError("Identity exceeds maximum length");
  }

  if (EMAIL_PATTERN.test(trimmed)) {
    return { type: "EMAIL", value: trimmed.toLowerCase() };
  }
  if (NATIONAL_ID_PATTERN.test(trimmed)) {
    return { type: "NATIONAL_ID", value: trimmed };
  }
  if (PHONE_PATTERN.test(trimmed)) {
    return { type: "PHONE", value: trimmed.replace(/[\s-()]/g, "") };
  }
  return { type: "USERNAME", value: trimmed.toLowerCase() };
}
