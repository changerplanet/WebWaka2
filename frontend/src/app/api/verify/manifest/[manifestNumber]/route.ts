import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ManifestVerificationResult {
  valid: boolean;
  tampered: boolean;
  revoked: boolean;
  sourceType: string;
  verifiedAt: string;
  manifestNumber?: string;
  status?: string;
  routeName?: string;
  origin?: string;
  destination?: string;
  scheduledDeparture?: string;
  bookedSeats?: number;
  totalSeats?: number;
  parkName?: string;
  isDemo?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ manifestNumber: string }> }
) {
  try {
    const { manifestNumber } = await params;
    const url = new URL(request.url);
    const verificationCode = url.searchParams.get('v');

    const manifest = await prisma.park_manifest.findFirst({
      where: { manifestNumber: decodeURIComponent(manifestNumber) },
      select: {
        manifestNumber: true,
        routeName: true,
        origin: true,
        destination: true,
        scheduledDeparture: true,
        status: true,
        isDemo: true,
        bookedSeats: true,
        totalSeats: true,
        parkName: true,
        verificationHash: true,
      },
    });

    if (!manifest) {
      return NextResponse.json<ManifestVerificationResult>(
        {
          valid: false,
          tampered: false,
          revoked: false,
          sourceType: 'PARK_MANIFEST',
          verifiedAt: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    let hashValid = true;
    if (verificationCode && manifest.verificationHash) {
      hashValid = verificationCode === manifest.verificationHash.substring(0, 12);
    }

    const isVoided = manifest.status === 'VOIDED';
    const isValid = hashValid && !isVoided;

    return NextResponse.json<ManifestVerificationResult>({
      valid: isValid,
      tampered: !hashValid,
      revoked: isVoided,
      sourceType: 'PARK_MANIFEST',
      verifiedAt: new Date().toISOString(),
      manifestNumber: manifest.manifestNumber,
      status: manifest.status,
      routeName: manifest.routeName,
      origin: manifest.origin,
      destination: manifest.destination,
      scheduledDeparture: manifest.scheduledDeparture?.toISOString(),
      bookedSeats: manifest.bookedSeats,
      totalSeats: manifest.totalSeats,
      parkName: manifest.parkName || undefined,
      isDemo: manifest.isDemo,
    });
  } catch (error) {
    console.error('[Manifest Verify API] Error:', error);
    return NextResponse.json(
      { error: 'Unable to verify manifest' },
      { status: 500 }
    );
  }
}
