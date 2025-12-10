import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

/**
 * Handler for 3D model file uploads (STL or GLB)
 * Route: /api/models/upload
 * Method: POST
 * Expected: multipart/form-data with file field containing STL or GLB file
 * Returns: { fileName, fileUrl }
 *
 * Note: Vercel has limitations on file storage. In production, use S3, Azure Blob, or Vercel Blob.
 * Here, we return a data URL for the file.
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

    // Validate file size
    if (buffer.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Empty file',
      });
      return;
    }

    // Determine file type
    let fileType = 'unknown';
    let mimeType = 'application/octet-stream';

    // Check for GLB (glTF binary)
    if (buffer.length >= 4) {
      const magic = buffer.readUInt32LE(0);
      if (magic === 0x46546C67) { // 'glTF' in little-endian
        fileType = 'glb';
        mimeType = 'model/gltf-binary';
      }
    }

    // Check for STL (ASCII or binary)
    if (fileType === 'unknown') {
      const header = buffer.slice(0, 5).toString('ascii').toLowerCase();
      const isAsciiSTL = header === 'solid';
      if (isAsciiSTL || buffer.length >= 84) {
        fileType = 'stl';
        mimeType = 'model/stl';
      }
    }

    if (fileType === 'unknown') {
      res.status(400).json({
        success: false,
        error: 'Unsupported file format. Only STL and GLB are supported.',
      });
      return;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = fileType === 'glb' ? 'glb' : 'stl';
    const fileName = `model_${timestamp}.${extension}`;

    // Create data URL
    const base64 = buffer.toString('base64');
    const fileUrl = `data:${mimeType};base64,${base64}`;

    res.status(200).json({
      success: true,
      message: `${fileType.toUpperCase()} file uploaded successfully`,
      fileName,
      fileUrl,
    });
  } catch (error) {
    console.error('Model upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload model file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
