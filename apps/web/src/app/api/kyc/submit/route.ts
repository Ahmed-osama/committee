import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import { InvalidNationalIdError, submitKyc } from '@/lib/auth/kyc-flow';
import { saveUploadedFile } from '@/lib/storage/local-file-storage';

// multipart/form-data: `document` and `selfie` files, `nationalIdNumber` text field.
// Requires an authenticated session — COM-17's listing creation depends on a
// completed KYC submission existing for the seller, not on approval status alone
// (see apps/web/CLAUDE.md).
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const form = await request.formData();
  const document = form.get('document');
  const selfie = form.get('selfie');
  const nationalIdNumber = form.get('nationalIdNumber');

  if (!(document instanceof File) || !(selfie instanceof File) || typeof nationalIdNumber !== 'string') {
    return NextResponse.json({ error: 'document, selfie, and nationalIdNumber are required' }, { status: 400 });
  }

  const [storedDocument, storedSelfie] = await Promise.all([
    saveUploadedFile(new Uint8Array(await document.arrayBuffer()), document.name),
    saveUploadedFile(new Uint8Array(await selfie.arrayBuffer()), selfie.name),
  ]);

  try {
    const verification = await submitKyc({
      userId: session.userId,
      documentUrl: storedDocument.url,
      selfieUrl: storedSelfie.url,
      nationalIdNumber,
    });
    return NextResponse.json(verification);
  } catch (error) {
    if (error instanceof InvalidNationalIdError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
