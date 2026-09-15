import { timingSafeEqual } from 'node:crypto';

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
