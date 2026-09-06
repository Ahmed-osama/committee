import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// TODO(human): replace with a real object storage vendor (S3/R2/Cloudinary/etc.)
// before deploying — this writes to local disk under apps/web/.data/uploads, which
// does not survive a serverless deploy or multiple instances. It exists so the KYC
// (COM-18) and listing-photo (COM-17) upload flows are real, working, testable code
// today rather than stubs that return a fake URL.
//
// Split into 'public'/'private' buckets because the two callers have opposite
// visibility needs: listing photos are browsable with no login (see
// docs/projects/groundtruth.md — browsing never requires auth), while KYC documents
// and selfies must never be reachable without an authenticated session. Served back by
// src/app/photos/[filename]/route.ts (public, no auth) and
// src/app/uploads/[filename]/route.ts (private, requires a session) respectively.
const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOAD_DIRS = {
  public: path.join(DATA_DIR, 'uploads', 'public'),
  private: path.join(DATA_DIR, 'uploads', 'private'),
} as const;

export type UploadVisibility = keyof typeof UPLOAD_DIRS;

export type StoredFile = {
  url: string;
};

export async function saveUploadedFile(
  bytes: Uint8Array,
  originalName: string,
  visibility: UploadVisibility,
): Promise<StoredFile> {
  const dir = UPLOAD_DIRS[visibility];
  await mkdir(dir, { recursive: true });
  const extension = path.extname(originalName).slice(0, 10);
  const filename = `${randomUUID()}${extension}`;
  await writeFile(path.join(dir, filename), bytes);
  const routePrefix = visibility === 'public' ? 'photos' : 'uploads';
  return { url: `/${routePrefix}/${filename}` };
}

// Rejects anything that isn't a bare filename (no path separators or "..") before
// joining, so a crafted `filename` can't escape the upload directory.
export function resolveUploadPath(filename: string, visibility: UploadVisibility): string | null {
  if (filename !== path.basename(filename) || filename.includes('..')) {
    return null;
  }
  return path.join(UPLOAD_DIRS[visibility], filename);
}
