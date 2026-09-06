import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// TODO(human): replace with a real object storage vendor (S3/R2/Cloudinary/etc.)
// before deploying — this writes to local disk under apps/web/.data/uploads, which
// does not survive a serverless deploy or multiple instances. It exists so the KYC
// upload flow (COM-18) is real, working, testable code today rather than a stub that
// returns a fake URL.
const UPLOAD_DIR = path.resolve(process.cwd(), '.data', 'uploads');

export type StoredFile = {
  url: string;
};

export async function saveUploadedFile(bytes: Uint8Array, originalName: string): Promise<StoredFile> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const extension = path.extname(originalName).slice(0, 10);
  const filename = `${randomUUID()}${extension}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return { url: `/uploads/${filename}` };
}

// Rejects anything that isn't a bare filename (no path separators or "..") before
// joining, so a crafted `filename` can't escape UPLOAD_DIR.
export function resolveUploadPath(filename: string): string | null {
  if (filename !== path.basename(filename) || filename.includes('..')) {
    return null;
  }
  return path.join(UPLOAD_DIR, filename);
}
