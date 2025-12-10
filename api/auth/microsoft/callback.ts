import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Server-side redirect handler for Microsoft OAuth callback
 * Receives the authorization code from Microsoft and redirects to frontend
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      // Redirect to login with error
      return res.redirect(
        `${getOrigin(req)}/#/login?error=${encodeURIComponent(error as string)}`
      );
    }

    if (!code) {
      return res.redirect(`${getOrigin(req)}/#/login?error=no_code`);
    }

    // Redirect to frontend callback handler with code
    return res.redirect(
      `${getOrigin(req)}/#/auth/microsoft/callback?code=${encodeURIComponent(code as string)}${state ? `&state=${encodeURIComponent(state as string)}` : ''}`
    );
  } catch (error) {
    console.error('Redirect error:', error);
    return res.redirect(`${getOrigin(req)}/#/login?error=server_error`);
  }
}

function getOrigin(req: VercelRequest): string {
  const host = req.headers.host || 'localhost:3001';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  return `${protocol}://${host}`;
}
