import { createMiddleware } from 'hono/factory';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';

const COOKIE_NAME = 'lexatech_session';
const SESSION_SECONDS = 60 * 60 * 8;

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    orgId: string;
  }
}

type SessionPayload = {
  sub: string;
  orgId: string;
  exp: number;
  iat: number;
};

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters.');
  }
  return secret;
}

export async function setSessionCookie(
  c: Parameters<typeof setCookie>[0],
  userId: string,
  orgId: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: userId, orgId, iat: now, exp: now + SESSION_SECONDS },
    sessionSecret(),
    'HS256',
  );

  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export function clearSessionCookie(c: Parameters<typeof deleteCookie>[0]) {
  deleteCookie(c, COOKIE_NAME, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
}

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return c.json({ success: false, error: 'Authentication required.' }, 401);

  try {
    const payload = await verify(token, sessionSecret(), 'HS256') as SessionPayload;
    if (!payload.sub || !payload.orgId) throw new Error('Invalid session payload');
    c.set('userId', payload.sub);
    c.set('orgId', payload.orgId);
    await next();
  } catch {
    clearSessionCookie(c);
    return c.json({ success: false, error: 'Your session has expired. Please sign in again.' }, 401);
  }
});
