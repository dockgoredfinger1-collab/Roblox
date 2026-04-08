import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const assetId = params.id;
  const apiKey = process.env.ROBLOX_API_KEY;

  if (!assetId || !apiKey) {
    return NextResponse.json({ error: 'Asset ID atau API Key kosong' }, { status: 400 });
  }

  try {
    // Step 1: Ambil location URL
    const metaRes = await fetch(`https://apis.roblox.com/asset-delivery-api/v1/assetId/${assetId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Gagal ambil meta data', status: metaRes.status }, { status: metaRes.status });
    }

    const metaData = await metaRes.json();
    const location = metaData.location;

    if (!location) {
      return NextResponse.json({ error: 'Location tidak ditemukan' }, { status: 500 });
    }

    // Step 2: Download binary asset
    const assetRes = await fetch(location);
    if (!assetRes.ok) {
      return NextResponse.json({ error: 'Gagal download asset' }, { status: 500 });
    }

    const buffer = await assetRes.arrayBuffer();

    // Return binary + header biar client bisa download/stream
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': assetRes.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="asset-${assetId}.rbxm"`,
        'Access-Control-Allow-Origin': '*',        // biar CORS aman dari frontend
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
