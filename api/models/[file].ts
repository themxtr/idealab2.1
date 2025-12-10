import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Handler for serving 3D model files
 * Route: /api/models/[file]
 * Method: GET
 * Note: Since Vercel serverless functions don't support persistent file storage,
 * this endpoint returns 404. In production, use S3, Azure Blob, or Vercel Blob.
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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Since we don't have persistent storage, return 404
  res.status(404).json({
    error: 'File not found. Use data URLs for model viewing.',
  });
}
