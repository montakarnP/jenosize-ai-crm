import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionConfigured } from "@/lib/session";

const DUMMY_PASSWORD_HASH = "$2b$10$At8CNPqyl/3hBA4yCaqImeRKxRYhz0G.S2jDdbXHhEuAsQJZD7pv6";

export type SignedInUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SALES";
  title: string;
  token: string;
};

export async function signIn(
  emailInput: string,
  password: string,
): Promise<{ ok: true; user: SignedInUser } | { ok: false; code: "invalid" | "config" }> {
  if (!sessionConfigured()) return { ok: false, code: "config" };

  const email = emailInput.trim().toLowerCase();
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !matches) return { ok: false, code: "invalid" };

  const token = await createSessionToken({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  if (!token) return { ok: false, code: "config" };

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, title: user.title, token },
  };
}
