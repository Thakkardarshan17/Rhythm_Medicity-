import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Compresses an image file to Base64 (max dimension 1200px, JPEG quality 0.85)
 * For ultra-fast and reliable storage fallback when Supabase bucket is missing or restricted.
 */
export async function fileToBase64Optimized(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(readerEvent.target?.result as string);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Attempts Supabase storage upload, falling back gracefully to optimized base64
 * if bucket is missing, RLS policy fails, or storage is not configured.
 */
export async function uploadImageWithFallback(
  bucket: string,
  filePath: string,
  file: File
): Promise<string> {
  // Validate MIME type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.');
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB limit.');
  }

  if (isSupabaseConfigured()) {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      } else {
        console.warn(`Supabase storage upload to bucket "${bucket}" encountered an issue:`, uploadError.message);
      }
    } catch (err: any) {
      console.warn(`Supabase storage error for "${bucket}":`, err?.message || err);
    }
  }

  // Graceful fallback: convert to optimized base64 so admin upload NEVER fails
  return fileToBase64Optimized(file);
}
