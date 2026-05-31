import { describe, expect, it } from "vitest";
import { inferFieldType } from "./field-types.js";

describe("inferFieldType", () => {
  it.each([
    ["42", "int"],
    ["3.14", "float"],
    ["192.168.0.1", "ipv4"],
    ["true", "bool"],
    ["user@example.com", "email"],
    ["https://x.com", "uri"],
    ["aa:bb:cc:dd:ee:ff", "mac"],
    ["550e8400-e29b-41d4-a716-446655440000", "uuid"],
    ["2023-10-10", "date"],
    ["2023-10-10T12:00:00", "datetime"],
    ["hello", "string"],
  ])("classifies %s as %s", (value, type) => {
    expect(inferFieldType(value)).toBe(type);
  });
});
