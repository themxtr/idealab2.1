import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

/**
 * Handler for STL file uploads
 * Route: /api/stl/upload
 * Method: POST
 * Expected: multipart/form-data with file field containing STL file
 * Returns: { success: true, filename, size, buffer (base64) }
 * 
 * Note: Vercel has limitations on execution time and file handling.
 * For production, consider using S3, Azure Blob Storage, or similar.
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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get the raw body as buffer
    let buffer: Buffer;

    if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    } else if (typeof req.body === 'string') {
      buffer = Buffer.from(req.body, 'binary');
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid file format',
      });
      return;
    }

    // Validate STL file signature
    if (buffer.length < 84) {
      res.status(400).json({
        success: false,
        error: 'File is too small to be a valid STL',
      });
      return;
    }

    // Check for ASCII STL header or binary STL header
    const header = buffer.slice(0, 5).toString('ascii').toLowerCase();
    const isAsciiSTL = header === 'solid';

    if (!isAsciiSTL) {
      // Check for binary STL (80-byte header + 4-byte triangle count)
      if (buffer.length < 84) {
        res.status(400).json({
          success: false,
          error: 'Invalid STL file format',
        });
        return;
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `stl_${timestamp}.stl`;
    const fileId = `stl_${timestamp}`;

    // Create temporary reference (in production, upload to S3/Azure)
    const fileReference = {
      id: fileId,
      filename,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      buffer: buffer.toString('base64'), // Store base64 encoded for transmission
    };

    res.status(200).json({
      success: true,
      message: 'STL file uploaded successfully',
      fileReference,
      fileId,
    });
  } catch (error) {
    console.error('STL upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload STL file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
