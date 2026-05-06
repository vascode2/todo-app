import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function getRedirectUri(req: Request) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}/auth/google/callback`;
}

function setAuthCookie(res: Response, userId: string) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000,
    });
}

// Legacy: GIS popup credential flow (kept for backward compatibility)
router.post('/google', async (req: Request, res: Response) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

              try {
                    const ticket = await client.verifyIdToken({
                            idToken: credential,
                            audience: process.env.GOOGLE_CLIENT_ID,
                    });
                    const payload = ticket.getPayload();
                    if (!payload || !payload.sub) return res.status(400).json({ error: 'Invalid token' });

      const user = await prisma.user.upsert({
              where: { googleId: payload.sub },
              update: { name: payload.name || '', avatar: payload.picture },
              create: {
                        googleId: payload.sub,
                        email: payload.email || '',
                        name: payload.name || '',
                        avatar: payload.picture,
              },
      });

      setAuthCookie(res, user.id);
                    res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
              } catch (err) {
                    console.error(err);
                    res.status(401).json({ error: 'Authentication failed' });
              }
});

// Step 1: redirect user to Google's consent screen
router.get('/google/start', (req: Request, res: Response) => {
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'openid email profile',
          access_type: 'online',
          prompt: 'select_account',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// Step 2: Google redirects back with ?code=...
router.get('/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    if (!code) return res.status(400).send('Missing code');

             try {
                   const redirectUri = getRedirectUri(req);
                   const oauth = new OAuth2Client(
                           process.env.GOOGLE_CLIENT_ID,
                           process.env.GOOGLE_CLIENT_SECRET,
                           redirectUri
                         );
                   const { tokens } = await oauth.getToken(code);
                   if (!tokens.id_token) return res.status(400).send('No id_token');

      const ticket = await oauth.verifyIdToken({
              idToken: tokens.id_token,
              audience: process.env.GOOGLE_CLIENT_ID,
      });
                   const payload = ticket.getPayload();
                   if (!payload || !payload.sub) return res.status(400).send('Invalid token');

      const user = await prisma.user.upsert({
              where: { googleId: payload.sub },
              update: { name: payload.name || '', avatar: payload.picture },
              create: {
                        googleId: payload.sub,
                        email: payload.email || '',
                        name: payload.name || '',
                        avatar: payload.picture,
              },
      });

      setAuthCookie(res, user.id);
                   res.redirect(process.env.CLIENT_URL || '/');
             } catch (err) {
                   console.error(err);
                   res.redirect(`${process.env.CLIENT_URL || ''}/?auth_error=1`);
             }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
});

router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ ok: true });
});

export default router;
