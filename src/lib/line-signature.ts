import { createHmac, timingSafeEqual } from "crypto";

export function signLineBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64");
}

export function lineSignaturesMatch(body: string, secret: string, header: string | null): boolean {
  if (!header || !secret) return false;
  const expected = Buffer.from(signLineBody(body, secret));
  const received = Buffer.from(header);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
