import { createClient } from '@supabase/supabase-js';
import { getAdminClient } from './auth.js';

const bucket = 'snapcut-images';
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

class ProcessingError extends Error {
  constructor(message, statusCode = 500, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new ProcessingError('Image storage is not configured on the server.');
  }

  return createClient(url, serviceRoleKey);
}

export async function processImage(file, userId) {
  if (!file || !file.buffer) {
    throw new ProcessingError('An image file is required.', 400);
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new ProcessingError('Invalid format. Use JPG, PNG, or WEBP.', 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new ProcessingError('File too large. Max 10MB.', 413);
  }

  if (!userId) {
    throw new ProcessingError('Authentication required.', 401);
  }

  const storage = getStorageClient();
  const admin = getAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('credits_remaining')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.warn('[remove-bg] profile lookup', {
      userId,
      profileFound: Boolean(profile),
      error: profileError?.message || null,
    });
    throw new ProcessingError('User profile is not configured.', 500);
  }

  console.info('[remove-bg] profile found', {
    userId,
    profileFound: true,
    creditsRemaining: profile.credits_remaining,
  });

  if (profile.credits_remaining <= 0) {
    throw new ProcessingError('No credits remaining.', 403, 'INSUFFICIENT_CREDITS');
  }

  const extension = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype.split('/')[1];
  const fileId = crypto.randomUUID();
  const originalPath = `originals/${fileId}.${extension}`;
  const processedPath = `processed/${fileId}.png`;

  const { error: originalError } = await storage.storage
    .from(bucket)
    .upload(originalPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (originalError) {
    throw new ProcessingError('Failed to upload the original image.');
  }

  const removeBgKey = process.env.REMOVE_BG_API_KEY;
  if (!removeBgKey) {
    throw new ProcessingError('Background removal is not configured on the server.');
  }

  let removeBgResponse;
  try {
    const form = new FormData();
    form.append('image_file', new Blob([file.buffer], { type: file.mimetype }), `image.${extension}`);
    form.append('size', 'auto');

    removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': removeBgKey },
      body: form,
    });
  } catch {
    throw new ProcessingError('Could not connect to the background removal service.', 502);
  }

  if (!removeBgResponse.ok) {
    throw new ProcessingError('Background removal service rejected the image.', 502);
  }

  const processedBuffer = Buffer.from(await removeBgResponse.arrayBuffer());
  const { error: processedError } = await storage.storage
    .from(bucket)
    .upload(processedPath, processedBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (processedError) {
    throw new ProcessingError('Failed to upload the processed image.');
  }

  const { data: creditResult, error: creditError } = await admin.rpc('consume_image_credit', {
    p_user_id: userId,
  });
  if (creditError || !creditResult?.[0]) {
    throw new ProcessingError('No credits remaining.', 403, 'INSUFFICIENT_CREDITS');
  }

  const { data: originalData } = storage.storage.from(bucket).getPublicUrl(originalPath);
  const { data: processedData } = storage.storage.from(bucket).getPublicUrl(processedPath);

  return {
    originalUrl: originalData.publicUrl,
    processedUrl: processedData.publicUrl,
    creditsRemaining: creditResult[0].credits_remaining,
    imagesProcessed: creditResult[0].images_processed,
  };
}

export { ProcessingError };