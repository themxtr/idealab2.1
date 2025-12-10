import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import fetch from 'cross-fetch';

const MICROSOFT_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

/**
 * Handler for GET requests
 * Route: /api/auth/microsoft
 * Returns the Microsoft OAuth2 login URL
 */
async function handleGetRequest(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/auth/microsoft/callback';
    
    if (!clientId) {
      throw new Error('MICROSOFT_CLIENT_ID is not configured');
    }

    const scopes = [
      'user.read',
      'email',
    ];

    const authUrl = new URL(`${MICROSOFT_ENDPOINT}/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append('state', Buffer.from(JSON.stringify({ nonce: Date.now() })).toString('base64'));

    return res.status(200).json({
      success: true,
      url: authUrl.toString(),
    });
  } catch (error) {
    console.error('Microsoft auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Microsoft login URL',
    });
  }
}

/**
 * Handler for POST requests (callback)
 * Route: /api/auth/microsoft/callback
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

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/auth/microsoft/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Microsoft credentials are not configured');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${MICROSOFT_ENDPOINT}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'user.read email',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    // Get user profile information from Microsoft Graph
    const profileResponse = await fetch(GRAPH_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Microsoft profile');
    }

    const profile = await profileResponse.json() as {
      id: string;
      displayName?: string;
      mail?: string;
      userPrincipalName?: string;
      jobTitle?: string;
      mobilePhone?: string;
    };

    // Extract user information
    const userId = profile.id;
    const email = profile.mail || profile.userPrincipalName || 'unknown@microsoft.com';
    const name = profile.displayName || 'Microsoft User';

    const user = {
      id: userId,
      email,
      name,
      picture: `https://graph.microsoft.com/v1.0/me/photo/$value`,
      provider: 'microsoft',
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
    console.error('Microsoft callback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to authenticate with Microsoft',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Main handler for Microsoft OAuth2 endpoint
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
