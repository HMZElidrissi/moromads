import bcrypt from "bcryptjs";

const SESSION_TTL_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const BCRYPT_COST = 12;

// ── Crypto helpers ─────────────────────────────────────────────────────────────

function hexEncode(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return hexEncode(buf);
}

export function generateToken(): string {
  return hexEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

// ── Password helpers ───────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Admin user types ───────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  email: string;
  passwordHash: string;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
};

type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  failed_login_count: number;
  locked_until: string | null;
  last_login_at: string | null;
};

function rowToAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    failedLoginCount: row.failed_login_count,
    lockedUntil: row.locked_until,
    lastLoginAt: row.last_login_at,
  };
}

// ── First-run setup ────────────────────────────────────────────────────────────

export async function hasAnyAdminUser(db: D1Database): Promise<boolean> {
  const row = await db.prepare("SELECT 1 FROM admin_users LIMIT 1").first();
  return !!row;
}

export async function createAdminUser(
  db: D1Database,
  email: string,
  password: string,
): Promise<AdminUser> {
  const hash = await hashPassword(password);
  const row = await db
    .prepare(
      `INSERT INTO admin_users (email, password_hash)
       VALUES (?, ?)
       RETURNING *`,
    )
    .bind(email.trim().toLowerCase(), hash)
    .first<AdminUserRow>();
  if (!row) throw new Error("Failed to create admin user");
  return rowToAdminUser(row);
}

// ── Login ─────────────────────────────────────────────────────────────────────

type LoginResult = { ok: true; user: AdminUser } | { ok: false; error: string };

export async function loginAdmin(
  db: D1Database,
  email: string,
  password: string,
): Promise<LoginResult> {
  const row = await db
    .prepare("SELECT * FROM admin_users WHERE email = ?")
    .bind(email.trim().toLowerCase())
    .first<AdminUserRow>();

  if (!row) {
    // Run a dummy bcrypt to avoid timing leak on unknown emails
    await bcrypt.compare(
      password,
      "$2a$12$invalidhashpaddingthatisignored00000000000000000000000000",
    );
    return { ok: false, error: "Invalid email or password." };
  }

  const user = rowToAdminUser(row);

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remaining = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60_000);
    return { ok: false, error: `Too many failed attempts. Try again in ${remaining} min.` };
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const count = user.failedLoginCount + 1;
    const shouldLock = count >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
      : null;
    await db
      .prepare(
        `UPDATE admin_users
         SET failed_login_count = ?, locked_until = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(shouldLock ? 0 : count, lockedUntil, user.id)
      .run();
    return { ok: false, error: "Invalid email or password." };
  }

  // Success — reset counters
  await db
    .prepare(
      `UPDATE admin_users
       SET failed_login_count = 0, locked_until = NULL, last_login_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(user.id)
    .run();

  return { ok: true, user };
}

// ── Session management ─────────────────────────────────────────────────────────

export async function createDbSession(
  db: D1Database,
  userId: string,
  request: Request,
): Promise<string> {
  const rawToken = generateToken();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString();
  const ip =
    request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For") ?? null;
  const ua = request.headers.get("User-Agent") ?? null;

  await db
    .prepare(
      `INSERT INTO admin_sessions (token_hash, user_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(tokenHash, userId, ip, ua, expiresAt)
    .run();

  return rawToken;
}

export async function getSessionUser(db: D1Database, rawToken: string): Promise<AdminUser | null> {
  const tokenHash = await hashToken(rawToken);
  const row = await db
    .prepare(
      `SELECT u.*
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND s.revoked_at IS NULL
         AND s.expires_at > datetime('now')`,
    )
    .bind(tokenHash)
    .first<AdminUserRow>();

  return row ? rowToAdminUser(row) : null;
}

export async function revokeSession(db: D1Database, rawToken: string): Promise<void> {
  const tokenHash = await hashToken(rawToken);
  await db
    .prepare(`UPDATE admin_sessions SET revoked_at = datetime('now') WHERE token_hash = ?`)
    .bind(tokenHash)
    .run();
}
