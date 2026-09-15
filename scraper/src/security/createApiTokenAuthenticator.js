import { timingSafeEqual } from 'node:crypto';

/**
 * Creates an API token authenticator middleware for Express.js.
 * The middleware checks the Authorization header for a Bearer token and compares it with the expected API token using a timing-safe comparison.
 * If the token is invalid or missing, it responds with a 401 Unauthorized status.
 */
export function createApiTokenAuthenticator(apiToken) {
  const expectedToken = Buffer.from(apiToken, 'utf8');

  return (req, res, next) => {
    const authorization = req.get('Authorization') || '';
    const token = /^Bearer\s+(.+)$/.exec(authorization)?.[1];
    const providedToken = token ? Buffer.from(token, 'utf8') : null;

    if (!providedToken
      || providedToken.length !== expectedToken.length
      || !timingSafeEqual(expectedToken, providedToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  };
}
