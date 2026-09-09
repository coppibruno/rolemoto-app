import {Timestamp} from "firebase-admin/firestore";

/** Converte Timestamp/Date/string do Firestore para ISO (domínio). */
export const toIso = (value: unknown): string => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return new Date().toISOString();
};

/** Converte ISO/Date do domínio para Timestamp do Firestore. */
export const toTimestamp = (value: unknown): Timestamp => {
  if (value instanceof Timestamp) {
    return value;
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  if (typeof value === "string") {
    return Timestamp.fromDate(new Date(value));
  }
  return Timestamp.now();
};
