// Sistema de autenticação próprio: bcrypt + JWT (expiração de 7 dias).
// Este módulo é server-only (nunca entra no bundle do navegador).
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const TOKEN_EXPIRATION = "7d";
const BCRYPT_ROUNDS = 10;

export type AppRole = "admin" | "gerente" | "vendedor" | "tecnico";

export type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: AppRole;
  /** Emissão do token (segundos), usada para invalidar tokens antigos. */
  iat?: number;
};

export type DbUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AppRole;
  active: boolean;
  created_at: string;
  updated_at?: string | null;
  password_changed_at?: string | null;
  last_login: string | null;
};

function getSecret(): Uint8Array {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

/** Gera o hash bcrypt de uma senha em texto puro. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Compara uma senha em texto puro com o hash armazenado. */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Gera um token JWT assinado com expiração de 7 dias. */
export async function generateToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(getSecret());
}

/** Verifica um token JWT e devolve o payload, ou null se inválido/expirado. */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload["email"] ?? ""),
      name: String(payload["name"] ?? ""),
      role: (payload["role"] as AppRole) ?? "vendedor",
      iat: typeof payload.iat === "number" ? payload.iat : undefined,
    };
  } catch {
    return null;
  }
}

function extractToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? request.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!value || scheme.toLowerCase() !== "bearer") return null;
  return value.trim();
}

/**
 * Autentica a requisição a partir do header Authorization: Bearer <token>.
 * Revalida o usuário no banco (garante que continua existindo e ativo).
 */
export async function authenticateRequest(
  request: Request,
): Promise<{ payload: TokenPayload; user: DbUser } | null> {
  const token = extractToken(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", payload.sub)
    .maybeSingle();

  const user = data as DbUser | null;
  if (!user || !user.active) return null;

  // Token emitido antes da última troca de senha deixa de valer.
  if (user.password_changed_at && payload.iat) {
    const changed = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
    if (payload.iat < changed) return null;
  }

  return { payload, user };
}

export function unauthorized(message = "Não autenticado") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Acesso restrito a administradores") {
  return Response.json({ error: message }, { status: 403 });
}

/** Autentica e exige o papel admin. Devolve uma Response de erro quando falhar. */
export async function requireAdmin(
  request: Request,
): Promise<{ user: DbUser } | { response: Response }> {
  const auth = await authenticateRequest(request);
  if (!auth) return { response: unauthorized() };
  if (auth.user.role !== "admin") return { response: forbidden() };
  return { user: auth.user };
}

export function publicUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    createdAt: user.created_at,
    lastLogin: user.last_login,
  };
}

const DATA_SESSION_EMAIL = "sistema@epsolucoes.local";

/**
 * Emite um token de uso único para o navegador abrir a sessão técnica de dados
 * (necessária para as leituras/gravações protegidas por RLS). A senha da conta
 * técnica nunca sai do servidor.
 */
export async function issueDataSessionToken(): Promise<string | null> {
  const password = process.env["APP_SESSION_PASSWORD"];
  if (!password) return null;
  try {
    const link = async () =>
      supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: DATA_SESSION_EMAIL });

    let { data, error } = await link();
    if (error) {
      await supabaseAdmin.auth.admin.createUser({
        email: DATA_SESSION_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { name: "Sessão do sistema" },
      });
      ({ data, error } = await link());
    }
    if (error || !data?.properties?.hashed_token) return null;
    return data.properties.hashed_token;
  } catch (err) {
    console.error("[auth] falha ao emitir sessão de dados", err);
    return null;
  }
}
