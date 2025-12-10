import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Interface for STL vertices and facets
 */
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Facet {
  normal: Vector3;
  vertices: Vector3[];
}

interface STLData {
  facets: Facet[];
}

/**
 * Parse binary STL file
 */
function parseBinarySTL(buffer: Buffer): STLData {
  const facets: Facet[] = [];

  // Skip 80-byte header
  let offset = 80;

  // Read number of triangles (4 bytes, little-endian)
  const triangleCount = buffer.readUInt32LE(offset);
  offset += 4;

  // Read each triangle (50 bytes each: 3 floats for normal, 3x3 floats for vertices, 2 bytes padding)
  for (let i = 0; i < triangleCount; i++) {
    const normal: Vector3 = {
      x: buffer.readFloatLE(offset),
      y: buffer.readFloatLE(offset + 4),
      z: buffer.readFloatLE(offset + 8),
    };
    offset += 12;

    const vertices: Vector3[] = [];
    for (let j = 0; j < 3; j++) {
      vertices.push({
        x: buffer.readFloatLE(offset),
        y: buffer.readFloatLE(offset + 4),
        z: buffer.readFloatLE(offset + 8),
      });
      offset += 12;
    }

    // Skip attribute byte count
    offset += 2;

    facets.push({ normal, vertices });
  }

  return { facets };
}

/**
 * Parse ASCII STL file
 */
function parseASCIISTL(buffer: Buffer): STLData {
  const content = buffer.toString('ascii');
  const facets: Facet[] = [];

  // Match facet blocks
  const facetRegex =
    /facet\s+normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+outer\s+loop\s+((?:vertex\s+[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s+[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s+[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s+)+)endloop\s+endfacet/gi;

  let match;
  while ((match = facetRegex.exec(content)) !== null) {
    const normal: Vector3 = {
      x: parseFloat(match[1]),
      y: parseFloat(match[3]),
      z: parseFloat(match[5]),
    };

    const vertexText = match[8];
    const vertices: Vector3[] = [];
    const vertexRegex =
      /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;

    let vertexMatch;
    while ((vertexMatch = vertexRegex.exec(vertexText)) !== null) {
      vertices.push({
        x: parseFloat(vertexMatch[1]),
        y: parseFloat(vertexMatch[3]),
        z: parseFloat(vertexMatch[5]),
      });
    }

    if (vertices.length === 3) {
      facets.push({ normal, vertices });
    }
  }

  return { facets };
}

/**
 * Calculate bounding box
 */
function calculateBoundingBox(stlData: STLData): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  width: number;
  height: number;
  depth: number;
} {
  if (stlData.facets.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      minZ: 0,
      maxZ: 0,
      width: 0,
      height: 0,
      depth: 0,
    };
  }

  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  for (const facet of stlData.facets) {
    for (const vertex of facet.vertices) {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
      minZ = Math.min(minZ, vertex.z);
      maxZ = Math.max(maxZ, vertex.z);
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    width: maxX - minX,
    height: maxY - minY,
    depth: maxZ - minZ,
  };
}

/**
 * Calculate volume using divergence theorem
 */
function calculateVolume(stlData: STLData): number {
  let volume = 0;

  for (const facet of stlData.facets) {
    const v0 = facet.vertices[0];
    const v1 = facet.vertices[1];
    const v2 = facet.vertices[2];

    // Signed volume of tetrahedron formed by origin and triangle
    const signedVolume =
      (v0.x * (v1.y * v2.z - v1.z * v2.y) -
        v0.y * (v1.x * v2.z - v1.z * v2.x) +
        v0.z * (v1.x * v2.y - v1.y * v2.x)) /
      6.0;

    volume += signedVolume;
  }

  return Math.abs(volume);
}

/**
 * Estimate print time in hours (basic formula)
 * Assumes ~1 mm/s print speed with acceleration
 */
function estimatePrintTime(
  volumeMm3: number,
  heightMm: number,
  layerHeight: number = 0.2
): number {
  if (volumeMm3 === 0 || heightMm === 0) return 0;

  // Estimate perimeter area (conservative)
  const estimatedLength = volumeMm3 / (heightMm * 10);
  const printSpeed = 40; // mm/min
  const timeMinutes = estimatedLength / printSpeed;

  // Add overhead for layer changes and travel
  return timeMinutes / 60 + 0.5;
}

/**
 * Estimate support material waste as percentage
 */
function estimateSupportWaste(
  boundingBox: ReturnType<typeof calculateBoundingBox>
): number {
  // Complex heuristic: taller objects typically need more support
  const heightToWidthRatio = boundingBox.depth / Math.max(boundingBox.width, boundingBox.height);
  
  // Base support percentage
  let supportPercentage = 5;

  if (heightToWidthRatio > 2) {
    supportPercentage = 15;
  } else if (heightToWidthRatio > 1.5) {
    supportPercentage = 10;
  }

  return supportPercentage;
}

/**
 * Main handler for STL analysis
 * Route: /api/stl/analyze
 * Method: POST
 * Expected: { fileBuffer: string (base64) } or { fileBuffer: Buffer }
 * Returns: { success, analysis }
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
    const { fileBuffer } = req.body as { fileBuffer?: string };

    if (!fileBuffer) {
      res.status(400).json({
        success: false,
        error: 'File buffer is required',
      });
      return;
    }

    // Convert base64 to buffer if needed
    let buffer: Buffer;
    if (typeof fileBuffer === 'string') {
      buffer = Buffer.from(fileBuffer, 'base64');
    } else {
      buffer = Buffer.from(fileBuffer);
    }

    // Determine if ASCII or binary STL and parse
    const header = buffer.slice(0, 5).toString('ascii').toLowerCase();
    const isAsciiSTL = header === 'solid';

    let stlData: STLData;
    if (isAsciiSTL) {
      stlData = parseASCIISTL(buffer);
    } else {
      stlData = parseBinarySTL(buffer);
    }

    // Calculate metrics
    const boundingBox = calculateBoundingBox(stlData);
    const volumeMm3 = calculateVolume(stlData);
    const volumeCm3 = volumeMm3 / 1000;
    
    // PLA density: 1.24 g/cm³
    const plaWeight = volumeCm3 * 1.24;
    
    const printTimeHours = estimatePrintTime(volumeMm3, boundingBox.depth);
    const supportWastePercentage = estimateSupportWaste(boundingBox);

    const analysis = {
      boundingBox: {
        widthMm: parseFloat(boundingBox.width.toFixed(2)),
        heightMm: parseFloat(boundingBox.height.toFixed(2)),
        depthMm: parseFloat(boundingBox.depth.toFixed(2)),
      },
      volume: {
        mm3: parseFloat(volumeMm3.toFixed(2)),
        cm3: parseFloat(volumeCm3.toFixed(2)),
      },
      material: {
        plaWeightGrams: parseFloat(plaWeight.toFixed(2)),
        estimatedCostINR: parseFloat((plaWeight * 2.5).toFixed(2)), // Student rate
      },
      printing: {
        estimatedPrintTimeHours: parseFloat(printTimeHours.toFixed(2)),
        estimatedPrintTimeMinutes: parseFloat((printTimeHours * 60).toFixed(0)),
        estimatedSupportWastePercentage: supportWastePercentage,
        supportWeightGrams: parseFloat((plaWeight * (supportWastePercentage / 100)).toFixed(2)),
      },
      metadata: {
        fileFormat: isAsciiSTL ? 'ASCII' : 'Binary',
        facetCount: stlData.facets.length,
      },
    };

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('STL analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze STL file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
