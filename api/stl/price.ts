import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Handler for 3D printing price calculation
 * Route: /api/stl/price
 * Method: POST
 * Expected: { grams: number, userType: 'student' | 'guest' | 'faculty' }
 * Returns: { success: true, costRupees, breakdown }
 * 
 * Pricing tiers:
 * - Student: ₹2.50 per gram
 * - Faculty: ₹2.00 per gram (10% discount)
 * - Guest: ₹3.50 per gram
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
    const { grams, userType } = req.body as {
      grams?: number;
      userType?: string;
    };

    // Validate inputs
    if (grams === undefined || grams === null) {
      res.status(400).json({
        success: false,
        error: 'grams parameter is required',
      });
      return;
    }

    if (typeof grams !== 'number' || grams < 0) {
      res.status(400).json({
        success: false,
        error: 'grams must be a positive number',
      });
      return;
    }

    // Validate user type
    const validUserTypes = ['student', 'faculty', 'guest'];
    const normalizedUserType = (userType || 'guest').toLowerCase();

    if (!validUserTypes.includes(normalizedUserType)) {
      res.status(400).json({
        success: false,
        error: `userType must be one of: ${validUserTypes.join(', ')}`,
      });
      return;
    }

    // Calculate price based on user type
    let costPerGram = 0;
    let discount = 0;

    switch (normalizedUserType) {
      case 'student':
        costPerGram = 2.5;
        break;
      case 'faculty':
        costPerGram = 2.0;
        discount = 20; // 20% discount
        break;
      case 'guest':
        costPerGram = 3.5;
        break;
      default:
        costPerGram = 3.5;
    }

    // Calculate total cost
    const materialCost = grams * costPerGram;
    
    // Add support material waste cost (estimated at 10% of material cost)
    const supportMaterialCost = materialCost * 0.1;
    
    // Add service charge (5%)
    const serviceCharge = (materialCost + supportMaterialCost) * 0.05;
    
    // Calculate total before discount
    const totalBeforeDiscount = materialCost + supportMaterialCost + serviceCharge;
    
    // Apply discount if applicable
    const discountAmount = (totalBeforeDiscount * discount) / 100;
    const finalCost = totalBeforeDiscount - discountAmount;

    // Round to nearest rupee
    const costRupees = Math.round(finalCost);

    res.status(200).json({
      success: true,
      costRupees,
      breakdown: {
        grams: parseFloat(grams.toFixed(2)),
        userType: normalizedUserType,
        costPerGram,
        materialCost: parseFloat(materialCost.toFixed(2)),
        supportMaterialCost: parseFloat(supportMaterialCost.toFixed(2)),
        serviceCharge: parseFloat(serviceCharge.toFixed(2)),
        subtotal: parseFloat(totalBeforeDiscount.toFixed(2)),
        discountPercentage: discount,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalCost: parseFloat(finalCost.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Price calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate price',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
