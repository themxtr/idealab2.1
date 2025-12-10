import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import crypto from 'crypto';

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

/**
 * Handler for GET requests
 * Route: /api/auth/google
 * Redirects to Google OAuth2 login URL
 */
async function handleGetRequest(req: VercelRequest, res: VercelResponse) {
  try {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI;
    const state = crypto.randomUUID();

    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id,
        redirect_uri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
        state
      }).toString();

    return res.redirect(authUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Google login URL',
    });
  }
}

/**
 * Handler for POST requests (callback)
 * Route: /api/auth/google/callback
 * Expects: { code: string } in body
 * Returns: { success: true, token, user }
 */
async function handlePostRequest(req: VercelRequest, res: VercelResponse) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user profile info
    const people = google.people({
      version: 'v1',
      auth: oauth2Client,
    });

    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos',
    });

    // Extract user information
    const email =
      profile.data.emailAddresses?.[0]?.value || 'unknown@google.com';
    const name = profile.data.names?.[0]?.displayName || 'Google User';
    const picture = profile.data.photos?.[0]?.url || '';

    const user = {
      id: profile.data.resourceName?.split('/')[1] || email,
      email,
      name,
      picture,
      provider: 'google',
      createdAt: new Date().toISOString(),
    };

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(user, jwtSecret, {
      expiresIn: '30d',
      algorithm: 'HS256',
    });

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Google callback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to authenticate with Google',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Main handler for Google OAuth2 endpoint
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
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    await handleGetRequest(req, res);
  } else if (req.method === 'POST') {
    await handlePostRequest(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
