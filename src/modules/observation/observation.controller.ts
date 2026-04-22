import { Response } from 'express';
import { observationService } from './observation.service';
import { PrismaClient } from '@prisma/client';
import { updateCommunityConsensus } from './community.service';
import { uploadBuffer } from '../../utils/cloudinary';
import { predictSpecies } from '../ai/ai.service';
import { validateScientific } from '../validation/scientific.validator';
import { AuthRequest } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const getObservations = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    const observations = await observationService.getAllObservations(
      lat ? parseFloat(lat as string) : undefined,
      lng ? parseFloat(lng as string) : undefined,
      radius ? parseFloat(radius as string) : undefined,
    );

    res.json(observations);
  } catch (error) {
    console.error('Error fetching observations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createObservation = async (req: AuthRequest, res: Response) => {
  try {
    const { taxonId, latitude, longitude, description, observedAt, behavior } = req.body;
    const authorId = req.user!.userId;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // ── 1. Upload photo + run AI prediction ───────────────────────────────────
    let mediaUrls: string[] = [];
    let aiPrediction = null;

    if (req.file) {
      const [cloudinaryUrl, prediction] = await Promise.allSettled([
        uploadBuffer(req.file.buffer, req.file.mimetype),
        predictSpecies(req.file.buffer, req.file.mimetype),
      ]);

      if (cloudinaryUrl.status === 'fulfilled') mediaUrls = [cloudinaryUrl.value];
      else console.error('Cloudinary upload error:', cloudinaryUrl.reason);

      if (prediction.status === 'fulfilled') aiPrediction = prediction.value;
      else console.error('iNaturalist Vision error:', prediction.reason?.message);
    }

    // ── 2. Taxon lookup (name needed for scientific validation) ───────────────
    let taxon = null;
    if (taxonId) {
      taxon = await prisma.taxon.findUnique({ where: { id: parseInt(taxonId, 10) } });
    }

    // ── 3. Scientific validation (only when a taxon is identified) ───────────
    let validationResult = null;
    if (taxon) {
      validationResult = await validateScientific(
        taxon.name,
        behavior ?? '',
        1,
        lat,
        lng,
        aiPrediction,
      );

      if (validationResult.status === 'rejected') {
        return res.status(400).json({
          error: validationResult.issues[0],
          issues: validationResult.issues,
          validationStatus: 'rejected',
        });
      }
    }

    // ── 4. Persist (skipped entirely for rejected observations) ───────────────
    const observation = await observationService.createObservation({
      authorId,
      taxonId: taxon ? taxon.id : undefined,
      latitude: lat,
      longitude: lng,
      description,
      behavior,
      aiConfidence: aiPrediction?.confidence,
      observedAt: new Date(observedAt || Date.now()),
      mediaUrls,
    });

    res.status(201).json({ ...observation, aiPrediction, validationResult });
  } catch (error) {
    console.error('Error creating observation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addIdentification = async (req: AuthRequest, res: Response) => {
  try {
    const observationId = parseInt(req.params.observationId, 10);
    const userId = req.user!.userId;
    const { taxonId, body } = req.body;

    if (!taxonId) {
      return res.status(400).json({ error: 'Taxon ID is required' });
    }

    const identification = await prisma.identification.create({
      data: {
        observationId,
        userId,
        taxonId: parseInt(taxonId, 10),
        body,
      },
      include: { taxon: true, user: true },
    });

    const consensusResult = await updateCommunityConsensus(observationId);

    res.status(201).json({
      success: true,
      identification,
      consensusStatus: consensusResult?.newStatus,
      consensusTaxon: consensusResult?.consensusTaxonId,
    });
  } catch (error) {
    console.error('Error adding identification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const observationId = parseInt(req.params.observationId, 10);
    const userId = req.user!.userId;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    const comment = await prisma.comment.create({
      data: { observationId, userId, body },
      include: { user: true },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getObservationById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.observationId, 10);
    const obs = await observationService.getObservationById(id);
    if (!obs) return res.status(404).json({ error: 'Not found' });
    res.json(obs);
  } catch (error) {
    console.error('Error fetching observation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTaxa = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    const whereClause = query
      ? {
          OR: [
            { name: { contains: query as string, mode: 'insensitive' as const } },
            { commonName: { contains: query as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const taxa = await prisma.taxon.findMany({ where: whereClause, take: 20 });
    res.json(taxa);
  } catch (error) {
    console.error('Error fetching taxa:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
