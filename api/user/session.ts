import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Interface for user object
 */
export interface UserPayload extends JwtPayload {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
  createdAt: string;
}

/**
 * Interface for session response
 */
interface SessionResponse {
  success: boolean;
  token?: string;
  user?: UserPayload;
  error?: string;
  details?: string;
}

/**
 * Create a JWT session token for a user
 * @param user User object to encode
 * @param expiresIn Token expiration time (default: 30 days)
 * @returns JWT token
 */
export function createSession(
  user: UserPayload,
  expiresIn: string = '30d'
): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  return jwt.sign(user as jwt.JwtPayload, jwtSecret, {
    expiresIn,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

/**
 * Verify a JWT session token
 * @param token JWT token to verify
 * @returns Decoded user payload or null if invalid
 */
export function verifySession(token: string): UserPayload | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    }) as UserPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader Authorization header value
 * @returns Token or null
 */
function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Handler for session management
 * Route: /api/user/session
 * 
 * GET - Verify current session
 *   Header: Authorization: Bearer <token>
 *   Returns: { success: true, user } or { success: false, error }
 * 
 * POST - Create new session (expects user data in body)
 *   Body: { id, email, name, picture?, provider }
 *   Returns: { success: true, token, user }
 * 
 * DELETE - Invalidate session (client-side, for logout)
 *   Header: Authorization: Bearer <token>
 *   Returns: { success: true, message: "Session invalidated" }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Verify session
    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Authorization token is required',
        } as SessionResponse);
        return;
      }

      const user = verifySession(token);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        } as SessionResponse);
        return;
      }

      res.status(200).json({
        success: true,
        user,
      } as SessionResponse);
      return;
    }

    // POST - Create new session
    if (req.method === 'POST') {
      const { id, email, name, picture, provider } = req.body as Partial<UserPayload>;

      // Validate required fields
      if (!id || !email || !name || !provider) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: id, email, name, provider',
        } as SessionResponse);
        return;
      }

      const user: UserPayload = {
        id,
        email,
        name,
        picture: picture || '',
        provider,
        createdAt: new Date().toISOString(),
      };

      try {
        const token = createSession(user);

        res.status(200).json({
          success: true,
          token,
          user,
        } as SessionResponse);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to create session',
          details: error instanceof Error ? error.message : 'Unknown error',
        } as SessionResponse);
      }
      return;
    }

    // DELETE - Logout (invalidate session)
    if (req.method === 'DELETE') {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Authorization token is required',
        } as SessionResponse);
        return;
      }

      // Verify token is valid before invalidating
      const user = verifySession(token);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        } as SessionResponse);
        return;
      }

      // Session invalidation is handled client-side by removing the token
      // This endpoint just acknowledges the logout request
      res.status(200).json({
        success: true,
        message: 'Session invalidated. Please remove the token from client storage.',
      } as SessionResponse & { message: string });
    }

    // Method not allowed
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
    } as SessionResponse);
  } catch (error) {
    console.error('Session handler error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    } as SessionResponse);
  }
}
