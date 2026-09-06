import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import { addListingPhoto, NotListingOwnerError } from '@/lib/listings/listings';
import { saveUploadedFile } from '@/lib/storage/local-file-storage';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const { id: listingId } = await params;
  const form = await request.formData();
  const photo = form.get('photo');
  const sortOrder = Number(form.get('sortOrder') ?? 0);

  if (!(photo instanceof File)) {
    return NextResponse.json({ error: 'photo file is required' }, { status: 400 });
  }

  const stored = await saveUploadedFile(new Uint8Array(await photo.arrayBuffer()), photo.name, 'public');

  try {
    const row = await addListingPhoto(listingId, session.userId, stored.url, Number.isFinite(sortOrder) ? sortOrder : 0);
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    if (error instanceof NotListingOwnerError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
