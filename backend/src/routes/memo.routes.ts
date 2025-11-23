import { FastifyInstance } from 'fastify';
import { MemoService } from '../services/memo.service.js';
import { StorageService } from '../services/storage.service.js';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { addTranscriptionJob } from '../jobs/queue.js';
import { z } from 'zod';

const createMemoSchema = z.object({
  title: z.string().min(1),
  date: z.string().datetime().optional(),
  participants: z.array(z.string()).optional(),
});

const updateMemoSchema = z.object({
  title: z.string().min(1).optional(),
  participants: z.array(z.string()).optional(),
});

const listMemosQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['UPLOADING', 'TRANSCRIBING', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
});

export async function memoRoutes(app: FastifyInstance) {
  const memoService = new MemoService(prisma);
  const storageService = new StorageService();

  // Ensure S3 bucket exists (development only)
  await storageService.ensureBucketExists();

  // Create new memo
  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    const body = createMemoSchema.parse(request.body);

    // Check subscription limits
    const canCreate = await memoService.checkSubscriptionLimits(request.user!.id);
    if (!canCreate) {
      return reply.status(403).send({
        error: {
          code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
          message: 'Monthly minutes limit exceeded. Please upgrade your plan.',
        },
      });
    }

    const memo = await memoService.createMemo(request.user!.id, {
      title: body.title,
      date: body.date ? new Date(body.date) : new Date(),
      participants: body.participants,
    });

    return reply.status(201).send({ memo });
  });

  // Upload audio file for memo
  app.post(
    '/:memoId/audio',
    { preHandler: authenticate },
    async (request, reply) => {
      const { memoId } = request.params as { memoId: string };

      // Verify user owns the memo
      const memo = await memoService.getMemo(memoId, request.user!.id);

      if (memo.status !== 'UPLOADING') {
        return reply.status(400).send({
          error: {
            code: 'INVALID_STATUS',
            message: 'Audio can only be uploaded for memos in UPLOADING status',
          },
        });
      }

      // Get uploaded file
      const data = await request.file({
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB max
        },
      });

      if (!data) {
        return reply.status(400).send({
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded',
          },
        });
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Upload to S3
      const { url, key } = await storageService.uploadAudio(
        buffer,
        memoId,
        data.mimetype
      );

      // Update memo with audio URL
      await memoService.setAudioUrl(memoId, url, key);

      // Trigger transcription job
      await addTranscriptionJob(memoId);

      return reply.send({
        message: 'Audio uploaded successfully. Transcription started.',
        audioUrl: url,
      });
    }
  );

  // Get presigned upload URL for direct client upload
  app.post(
    '/:memoId/audio/upload-url',
    { preHandler: authenticate },
    async (request, reply) => {
      const { memoId } = request.params as { memoId: string };

      // Verify user owns the memo
      await memoService.getMemo(memoId, request.user!.id);

      const { uploadUrl, key } = await storageService.getPresignedUploadUrl(memoId);

      return reply.send({
        uploadUrl,
        key,
        message: 'Use this URL to upload your audio file directly',
      });
    }
  );

  // Get single memo
  app.get('/:memoId', { preHandler: authenticate }, async (request, reply) => {
    const { memoId } = request.params as { memoId: string };

    const memo = await memoService.getMemo(memoId, request.user!.id);

    return reply.send({ memo });
  });

  // List user's memos
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    const query = listMemosQuerySchema.parse(request.query);

    const memos = await memoService.listMemos(request.user!.id, query);

    return reply.send({ memos });
  });

  // Update memo
  app.patch('/:memoId', { preHandler: authenticate }, async (request, reply) => {
    const { memoId } = request.params as { memoId: string };
    const body = updateMemoSchema.parse(request.body);

    const memo = await memoService.updateMemo(memoId, request.user!.id, body);

    return reply.send({ memo });
  });

  // Delete memo
  app.delete('/:memoId', { preHandler: authenticate }, async (request, reply) => {
    const { memoId } = request.params as { memoId: string };

    // Get memo to check for audio file
    const memo = await memoService.getMemo(memoId, request.user!.id);

    // Delete audio from S3 if exists
    if (memo.audioStorageKey) {
      await storageService.deleteAudio(memo.audioStorageKey);
    }

    // Delete memo from database
    await memoService.deleteMemo(memoId, request.user!.id);

    return reply.status(204).send();
  });

  // Get audio download URL
  app.get(
    '/:memoId/audio/download-url',
    { preHandler: authenticate },
    async (request, reply) => {
      const { memoId } = request.params as { memoId: string };

      const memo = await memoService.getMemo(memoId, request.user!.id);

      if (!memo.audioStorageKey) {
        return reply.status(404).send({
          error: {
            code: 'NO_AUDIO',
            message: 'No audio file available for this memo',
          },
        });
      }

      const downloadUrl = await storageService.getPresignedDownloadUrl(
        memo.audioStorageKey
      );

      return reply.send({ downloadUrl });
    }
  );
}
