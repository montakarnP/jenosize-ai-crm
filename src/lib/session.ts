export const SESSION_COOKIE = "crm_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  role: "ADMIN" | "SALES";
  exp: number;
};

function bufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function secretBytes(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function signingKey(usage: "sign" | "verify"): Promise<CryptoKey | null> {
  const secret = secretBytes();
  if (!secret) return null;
  return crypto.subtle.importKey("raw", bufferSource(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export function sessionConfigured(): boolean {
  return secretBytes() !== null;
}

export async function createSessionToken(user: Omit<SessionUser, "exp">): Promise<string | null> {
  const key = await signingKey("sign");
  if (!key) return null;
  const payload: SessionUser = {
    ...user,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, bufferSource(new TextEncoder().encode(body))),
  );
  return `${body}.${toBase64Url(signature)}`;
}

export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const key = await signingKey("verify");
  if (!key) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    bufferSource(fromBase64Url(signature)),
    bufferSource(new TextEncoder().encode(body)),
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionUser;
    if (!payload.uid || !payload.email || !payload.exp || payload.exp < Date.now()) return null;
    if (payload.role !== "ADMIN" && payload.role !== "SALES") return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
