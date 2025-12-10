import { VercelRequest, VercelResponse } from '@vercel/node';
import optionsData from './options.json' assert { type: 'json' };

/**
 * Interface for PCB specification
 */
interface PCBSpecification {
  width: number;
  height: number;
  thickness?: number;
  layerCount: number;
  color: string;
  copperThickness: string;
  drillSizes?: string[];
  surfaceFinish?: string;
  silkscreen?: {
    top: boolean;
    bottom: boolean;
  };
}

/**
 * Validate PCB specifications against options
 */
function validateSpecification(
  spec: PCBSpecification
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate dimensions
  if (spec.width < 10 || spec.width > 500) {
    errors.push('Width must be between 10mm and 500mm');
  }

  if (spec.height < 10 || spec.height > 500) {
    errors.push('Height must be between 10mm and 500mm');
  }

  // Validate layer count
  const validLayerCounts = optionsData.layerCount.map((l) => l.value);
  if (!validLayerCounts.includes(spec.layerCount)) {
    errors.push(
      `Layer count must be one of: ${validLayerCounts.join(', ')}`
    );
  }

  // Validate color
  const validColors = optionsData.colors.map((c) => c.id);
  if (!validColors.includes(spec.color)) {
    errors.push(`Color must be one of: ${validColors.join(', ')}`);
  }

  // Validate copper thickness
  const validCopperThickness = optionsData.copperThickness.map((c) => c.id);
  if (!validCopperThickness.includes(spec.copperThickness)) {
    errors.push(
      `Copper thickness must be one of: ${validCopperThickness.join(', ')}`
    );
  }

  // Validate surface finish
  if (spec.surfaceFinish) {
    const validSurfaceFinish = optionsData.surfaceFinish.map((s) => s.id);
    if (!validSurfaceFinish.includes(spec.surfaceFinish)) {
      errors.push(
        `Surface finish must be one of: ${validSurfaceFinish.join(', ')}`
      );
    }
  }

  // Validate drill sizes if provided
  if (spec.drillSizes && spec.drillSizes.length > 0) {
    const validDrillSizes = optionsData.drillSizes.map((d) => d.id);
    for (const drillSize of spec.drillSizes) {
      if (!validDrillSizes.includes(drillSize)) {
        errors.push(
          `Drill size must be one of: ${validDrillSizes.join(', ')}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate board area in cm²
 */
function calculateBoardArea(width: number, height: number): number {
  return (width / 10) * (height / 10); // Convert mm to cm
}

/**
 * Calculate copper usage in grams
 * Formula: area (mm²) × thickness (mm) × copper density (8.96 g/cm³) / 1000
 */
function calculateCopperUsage(
  width: number,
  height: number,
  copperThicknessId: string,
  layerCount: number
): number {
  const copperOption = optionsData.copperThickness.find(
    (c) => c.id === copperThicknessId
  );
  if (!copperOption) return 0;

  const area = width * height; // mm²
  const thickness = copperOption.micrometers / 1000; // mm
  const copperDensity = 8.96; // g/cm³
  const copperPerLayer = (area * thickness * copperDensity) / 1000; // grams

  return parseFloat((copperPerLayer * layerCount).toFixed(2));
}

/**
 * Calculate base price for PCB
 */
function calculateBasePrice(
  boardArea: number,
  spec: PCBSpecification
): number {
  // Base price per cm²
  const basePricePerCm2 = 15; // ₹15 per cm²

  // Get price multipliers
  const colorOption = optionsData.colors.find((c) => c.id === spec.color);
  const copperOption = optionsData.copperThickness.find(
    (c) => c.id === spec.copperThickness
  );
  const layerOption = optionsData.layerCount.find(
    (l) => l.value === spec.layerCount
  );
  const surfaceOption = optionsData.surfaceFinish.find(
    (s) => s.id === (spec.surfaceFinish || 'hasl')
  );

  const colorMultiplier = colorOption?.priceMultiplier || 1;
  const copperMultiplier = copperOption?.priceMultiplier || 1;
  const layerMultiplier = layerOption?.priceMultiplier || 1;
  const surfaceMultiplier = surfaceOption?.priceMultiplier || 1;

  const totalMultiplier =
    colorMultiplier *
    copperMultiplier *
    layerMultiplier *
    surfaceMultiplier;

  return boardArea * basePricePerCm2 * totalMultiplier;
}

/**
 * Generate Gerber metadata
 */
function generateGerberMetadata(
  spec: PCBSpecification,
  copperUsage: number
): Record<string, unknown> {
  return {
    format: 'GerberX2',
    version: '2021.05',
    layers: {
      topCopper: `F.Cu (layer ${spec.layerCount > 2 ? '1' : '1'})`,
      bottomCopper: `B.Cu (layer ${spec.layerCount > 2 ? spec.layerCount : '2'})`,
      silkscreenTop: `F.SilkS`,
      silkscreenBottom: `B.SilkS`,
      solderMaskTop: `F.Mask`,
      solderMaskBottom: `B.Mask`,
      drillFile: `NC_Excellon`,
    },
    specifications: {
      boardThickness: spec.thickness || 1.6,
      layerCount: spec.layerCount,
      copperThickness: spec.copperThickness,
      copperUsageGrams: copperUsage,
      solderMaskColor: spec.color,
      surfaceFinish: spec.surfaceFinish || 'HASL',
    },
    manufacturingNotes: [
      `Layer count: ${spec.layerCount}`,
      `Board dimensions: ${spec.width}mm × ${spec.height}mm`,
      `Copper thickness: ${spec.copperThickness}`,
      `Surface finish: ${spec.surfaceFinish || 'HASL'}`,
    ],
  };
}

/**
 * Main handler for PCB builder
 * Route: /api/pcb/builder
 * Method: POST
 * Expected: {
 *   width: number,
 *   height: number,
 *   layerCount: number,
 *   color: string,
 *   copperThickness: string,
 *   drillSizes?: string[],
 *   surfaceFinish?: string
 * }
 * Returns: { success, specification, calculations, gerberMetadata }
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
    // Return available options for the frontend
    res.status(200).json({
      success: true,
      options: optionsData,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as Partial<PCBSpecification>;

    // Validate required fields
    if (!body.width || !body.height || !body.layerCount || !body.color || !body.copperThickness) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: width, height, layerCount, color, copperThickness',
      });
      return;
    }

    const specification: PCBSpecification = {
      width: body.width,
      height: body.height,
      thickness: body.thickness || 1.6,
      layerCount: body.layerCount,
      color: body.color,
      copperThickness: body.copperThickness,
      drillSizes: body.drillSizes || ['0.3mm', '0.4mm'],
      surfaceFinish: body.surfaceFinish || 'hasl',
      silkscreen: body.silkscreen || { top: true, bottom: false },
    };

    // Validate specification
    const validation = validateSpecification(specification);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: 'Invalid specification',
        errors: validation.errors,
      });
      return;
    }

    // Calculate metrics
    const boardArea = calculateBoardArea(specification.width, specification.height);
    const copperUsage = calculateCopperUsage(
      specification.width,
      specification.height,
      specification.copperThickness,
      specification.layerCount
    );
    const basePrice = calculateBasePrice(boardArea, specification);

    // Generate Gerber metadata
    const gerberMetadata = generateGerberMetadata(specification, copperUsage);

    res.status(200).json({
      success: true,
      specification,
      calculations: {
        boardAreaCm2: parseFloat(boardArea.toFixed(2)),
        boardAreaMm2: parseFloat((boardArea * 100).toFixed(2)),
        copperUsageGrams: copperUsage,
        estimatedPriceINR: Math.round(basePrice),
        priceBreakdown: {
          basePrice: parseFloat(basePrice.toFixed(2)),
          sgst: parseFloat((basePrice * 0.09).toFixed(2)),
          cgst: parseFloat((basePrice * 0.09).toFixed(2)),
          totalWithGST: parseFloat(
            (basePrice + basePrice * 0.18).toFixed(2)
          ),
        },
      },
      gerberMetadata,
      message: 'PCB specification created successfully',
    });
  } catch (error) {
    console.error('PCB builder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build PCB specification',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
