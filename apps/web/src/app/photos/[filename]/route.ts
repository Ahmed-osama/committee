import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { resolveUploadPath } from '@/lib/storage/local-file-storage';

// Public listing-photo serving, no auth — browsing listings never requires login (see
// docs/projects/groundtruth.md). Contrast with src/app/uploads/[filename]/route.ts,
// which serves the private KYC bucket and does require a session.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }): Promise<NextResponse> {
  const { filename } = await params;
  const filePath = resolveUploadPath(filename, 'public');
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
