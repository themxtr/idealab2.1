import { VercelRequest, VercelResponse } from '@vercel/node';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import fetch from 'cross-fetch';

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
 * Load GLB and compute bounding box and volume
 */
async function analyzeGLB(buffer: Buffer): Promise<{
  boundingBox: { width: number; height: number; depth: number };
  volume: number;
}> {
  // Create a mock loader for GLB
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.parse(new Uint8Array(buffer).buffer, '', (gltf) => {
      try {
        const scene = gltf.scene;

        // Compute bounding box
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());

        // For volume, we need to triangulate all geometries
        let totalVolume = 0;
        scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const geometry = mesh.geometry;

            // Ensure geometry is indexed
            if (!geometry.index) {
              geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
            }

            const positions = geometry.attributes.position.array;
            const index = geometry.index!.array;

            for (let i = 0; i < index.length; i += 3) {
              const a = index[i] * 3;
              const b = index[i + 1] * 3;
              const c = index[i + 2] * 3;

              const v0 = new THREE.Vector3(positions[a], positions[a + 1], positions[a + 2]);
              const v1 = new THREE.Vector3(positions[b], positions[b + 1], positions[b + 2]);
              const v2 = new THREE.Vector3(positions[c], positions[c + 1], positions[c + 2]);

              // Apply mesh transform
              mesh.updateMatrixWorld();
              v0.applyMatrix4(mesh.matrixWorld);
              v1.applyMatrix4(mesh.matrixWorld);
              v2.applyMatrix4(mesh.matrixWorld);

              // Signed volume
              const signedVolume =
                (v0.x * (v1.y * v2.z - v1.z * v2.y) -
                  v0.y * (v1.x * v2.z - v1.z * v2.x) +
                  v0.z * (v1.x * v2.y - v1.y * v2.x)) /
                6.0;

              totalVolume += signedVolume;
            }
          }
        });

        resolve({
          boundingBox: {
            width: size.x,
            height: size.y,
            depth: size.z,
          },
          volume: Math.abs(totalVolume),
        });
      } catch (error) {
        reject(error);
      }
    }, reject);
  });
}

/**
 * Main handler for model analysis
 * Route: /api/models/analyze
 * Method: POST
 * Expected: { fileUrl: string } or { fileName: string }
 * Returns: { dimensions, volume, weightGrams, costStudent, costGuest }
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
    const { fileUrl, fileName } = req.body as { fileUrl?: string; fileName?: string };

    if (!fileUrl && !fileName) {
      res.status(400).json({
        success: false,
        error: 'fileUrl or fileName is required',
      });
      return;
    }

    let buffer: Buffer;
    let fileType = 'unknown';

    if (fileUrl) {
      // Handle data URL
      if (fileUrl.startsWith('data:')) {
        const parts = fileUrl.split(',');
        if (parts.length !== 2) {
          res.status(400).json({
            success: false,
            error: 'Invalid data URL',
          });
          return;
        }
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const base64 = parts[1];
        buffer = Buffer.from(base64, 'base64');

        if (mimeType === 'model/gltf-binary') {
          fileType = 'glb';
        } else if (mimeType === 'model/stl') {
          fileType = 'stl';
        }
      } else {
        // Fetch from URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
          res.status(400).json({
            success: false,
            error: 'Failed to fetch file from URL',
          });
          return;
        }
        buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('gltf-binary')) {
          fileType = 'glb';
        } else if (contentType.includes('stl')) {
          fileType = 'stl';
        }
      }
    } else {
      // For fileName, assume it's a data URL or handle differently
      // Since we don't have persistent storage, this might not be used
      res.status(400).json({
        success: false,
        error: 'fileName not supported without persistent storage',
      });
      return;
    }

    // Determine file type if not set
    if (fileType === 'unknown') {
      if (buffer.length >= 4) {
        const magic = buffer.readUInt32LE(0);
        if (magic === 0x46546C67) {
          fileType = 'glb';
        }
      }
      if (fileType === 'unknown') {
        const header = buffer.slice(0, 5).toString('ascii').toLowerCase();
        if (header === 'solid' || buffer.length >= 84) {
          fileType = 'stl';
        }
      }
    }

    if (fileType === 'unknown') {
      res.status(400).json({
        success: false,
        error: 'Unsupported file format',
      });
      return;
    }

    let dimensions: { width: number; height: number; depth: number };
    let volumeMm3: number;

    if (fileType === 'stl') {
      // Parse STL
      const header = buffer.slice(0, 5).toString('ascii').toLowerCase();
      const isAsciiSTL = header === 'solid';
      const stlData = isAsciiSTL ? parseASCIISTL(buffer) : parseBinarySTL(buffer);

      const boundingBox = calculateBoundingBox(stlData);
      dimensions = {
        width: boundingBox.width,
        height: boundingBox.height,
        depth: boundingBox.depth,
      };
      volumeMm3 = calculateVolume(stlData);
    } else if (fileType === 'glb') {
      const analysis = await analyzeGLB(buffer);
      dimensions = analysis.boundingBox;
      volumeMm3 = analysis.volume;
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported file type',
      });
      return;
    }

    const volumeCm3 = volumeMm3 / 1000;
    const weightGrams = volumeCm3 * 1.24; // PLA density
    const costStudent = weightGrams * 2.5;
    const costGuest = weightGrams * 3.5;

    res.status(200).json({
      success: true,
      dimensions,
      volume: {
        mm3: parseFloat(volumeMm3.toFixed(2)),
        cm3: parseFloat(volumeCm3.toFixed(2)),
      },
      weightGrams: parseFloat(weightGrams.toFixed(2)),
      costStudent: parseFloat(costStudent.toFixed(2)),
      costGuest: parseFloat(costGuest.toFixed(2)),
    });
  } catch (error) {
    console.error('Model analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze model',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
