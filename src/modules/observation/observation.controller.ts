import { Request, Response } from 'express';
import { createObservation, getObservations } from './observation.service';
import { createObservationSchema } from './observation.schema';

export const createObservationHandler = async (req: Request, res: Response) => {
  try {
    // Validasyon
    const result = createObservationSchema.safeParse(req);

    if (!result.success) {
      // CLEANUP: If validation failed but file was uploaded, delete it.
      if (req.file) {
        const fs = await import('fs');
        const path = await import('path');
        try {
          fs.unlinkSync(path.join(process.cwd(), 'frontend/public/uploads', req.file.filename));
        } catch (e) { }
      }
      return res.status(400).json({
        success: false,
        errors: result.error.errors
      });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    // @ts-ignore - user comes from auth middleware, type definition needs update
    const userId = Number(req.user.userId);

    // AI Prediction & SECURITY BLOCK
    let aiPrediction = null;
    let verificationStatus = 'PENDING';
    let aiConfidence = null;

    if (imagePath) {
      try {
        const { predictSpecies } = await import('../ai/ai.service');
        aiPrediction = await predictSpecies(imagePath);

        if (aiPrediction) {
          aiConfidence = aiPrediction.confidence;

          // Normalize (TR -> EN) for AI check
          const { normalizeSpecies } = await import('../validation/scientific.validator');
          const userSpeciesRaw = result.data.body.species.toLowerCase().trim();
          const userSpecies = normalizeSpecies(userSpeciesRaw);
          const aiSpecies = aiPrediction.species.toLowerCase();

          // FUZZY MATCHING LOGIC
          // Check if one string is contained in the other (e.g. "Gray Wolf" contains "wolf")
          const isMatch = userSpecies.includes(aiSpecies) || aiSpecies.includes(userSpecies);

          // STRICT BLOCKING LOGIC
          // If AI is confident (>80%) and it's NOT a match, BLOCK IT.
          if (aiPrediction.confidence > 0.8 && !isMatch) {
            // Delete the uploaded file to clean up
            const fs = await import('fs');
            const path = await import('path');
            try {
              fs.unlinkSync(path.join(process.cwd(), 'frontend/public', imagePath));
            } catch (e) { console.error('Failed to delete blocked file', e); }

            return res.status(400).json({
              success: false,
              message: `Security Block: AI identified this as '${aiPrediction.species}' (${Math.round(aiPrediction.confidence * 100)}%). Your input '${result.data.body.species}' does not match.`,
              errors: [{ message: "Irrelevant or incorrect image content detected." }]
            });
          }

          if (aiPrediction.confidence > 0.8 && isMatch) {
            verificationStatus = 'VERIFIED';
          }
        }
      } catch (err) {
        console.error('AI Service Error:', err);
        // FAIL CLOSED - If AI fails, we should probably warn or block in a high-security context.
        // For now, we'll allow it but log it as PENDING.
      }
    }

    // LOGICAL SANITY CHECKS & CLEANUP
    const cleanupFile = async () => {
      if (imagePath) {
        const fs = await import('fs');
        const path = await import('path');
        try {
          const fullPath = path.join(process.cwd(), 'frontend/public', imagePath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        } catch (e) { console.error('Failed to delete blocked file', e); }
      }
    };

    // 1. Coordinate Validity
    if (result.data.body.latitude < -90 || result.data.body.latitude > 90 ||
      result.data.body.longitude < -180 || result.data.body.longitude > 180) {
      await cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'Logical Error: Coordinates are out of planetary bounds.',
        errors: [{ message: "Latitude must be -90 to 90, Longitude -180 to 180." }]
      });
    }

    // 2. Count limit
    if (result.data.body.count > 100) {
      await cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'Logical Error: Excessive count. Please report large herds securely.',
        errors: [{ message: "Count exceeds reliable limit (100)." }]
      });
    }

    // 3. Behavior vs Species Sanity (Expanded)
    const species = result.data.body.species.toLowerCase();
    const behavior = result.data.body.behavior?.toLowerCase() || '';

    // 3. Scientific Biological Validation (Engine)
    // 3. SCIENTIFIC & BIOLOGICAL VALIDATION ENGINE
    // This engine now handles Species, Behavior, Count, AND Photo Consistency rules.
    try {
      const { validateScientific } = await import('../validation/scientific.validator');

      const validation = validateScientific(
        species,
        behavior,
        result.data.body.count,
        aiPrediction
      );

      // STRICT REJECTION if overall invalid
      if (!validation.overall_valid) {
        await cleanupFile();
        return res.status(400).json({
          success: false,
          message: `Scientific Validation Failed: ${validation.issues[0] || 'Invalid observation'}`,
          errors: validation.issues.map(msg => ({ message: msg })),
          scientificResult: validation
        });
      }

      // If suspicious but not invalid (soft fail), we FLAG it.
      if (validation.status === 'suspicious') {
        verificationStatus = 'FLAGGED';
      } else if (validation.status === 'valid' && aiPrediction && validation.photo_consistent) {
        verificationStatus = 'VERIFIED';
      }

    } catch (e) {
      console.error('Validation Engine Error', e);
      // Fail closed? Or allow pending? Let's generic error.
      return res.status(500).json({
        success: false,
        message: 'Validation Engine Crash'
      });
    }

    const observation = await createObservation(result.data.body, userId, imagePath);

    // Update verification status if valid or flagged
    if (verificationStatus !== 'PENDING' || aiConfidence) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.observation.update({
        where: { id: observation.id },
        data: {
          verificationStatus,
          aiConfidence: aiConfidence || null
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: { ...observation, verificationStatus, aiConfidence },
      aiPrediction,
      message: verificationStatus === 'FLAGGED'
        ? `Warning: AI detected a mismatch! Flagged for review.`
        : 'Observation saved successfully.'
    });

  } catch (error) {
    console.error('Observation create error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gözlem kaydedilirken bir hata oluştu'
    });
  }
};

export const getObservationsHandler = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    let centerLat: number | undefined;
    let centerLng: number | undefined;
    let radiusKm: number | undefined;

    if (lat && lng && radius) {
      centerLat = parseFloat(lat as string);
      centerLng = parseFloat(lng as string);
      radiusKm = parseFloat(radius as string);
    }

    const observations = await getObservations(centerLat, centerLng, radiusKm);

    return res.status(200).json({
      success: true,
      data: observations
    });
  } catch (error) {
    console.error('Error fetching observations:', error);
    return res.status(500).json({
      success: false,
      message: 'Gözlemler getirilirken hata oluştu'
    });
  }
};

export const getStatsHandler = async (req: Request, res: Response) => {
  try {
    const { getStats } = await import('./observation.service');
    const stats = await getStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu'
    });
  }
};