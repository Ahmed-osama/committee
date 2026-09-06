import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import { resolveUploadPath } from '@/lib/storage/local-file-storage';

// Local-disk upload serving (see lib/storage/local-file-storage's TODO on replacing
// this with real object storage). Gated behind any authenticated session — KYC
// documents/selfies are sensitive, and filenames are unguessable UUIDs, but this is
// not a substitute for per-owner authorization; a real storage vendor's signed URLs
// would replace this route entirely.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const { filename } = await params;
  const filePath = resolveUploadPath(filename, 'private');
  if (!filePath) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 });
  }

  try {
    const bytes = await readFile(filePath);
    return new NextResponse(new Uint8Array(bytes));
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
