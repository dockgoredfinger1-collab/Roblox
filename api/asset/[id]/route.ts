import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const assetId = params.id?.trim();

  if (!assetId || isNaN(Number(assetId))) {
    return NextResponse.json({ error: 'Asset ID tidak valid' }, { status: 400 });
  }

  const apiKey = process.env.ROBLOX_API_KEY;
  if (!apiKey) {
    console.error('ROBLOX_API_KEY tidak ditemukan');
    return NextResponse.json({ error: 'API Key belum diatur di Vercel' }, { status: 500 });
  }

  try {
    const metaRes = await fetch(`https://apis.roblox.com/asset-delivery-api/v1/assetId/${assetId}`, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'RobloxAssetProxy/1.0',
      },
    });

    if (!metaRes.ok) {
      console.error(`Meta error: ${metaRes.status}`);
      return NextResponse.json({ error: 'Gagal ambil metadata' }, { status: metaRes.status });
    }

    const metaData = await metaRes.json();
    const location = metaData?.location;

    if (!location) {
      return NextResponse.json({ error: 'Location tidak ditemukan' }, { status: 502 });
    }

    const assetRes = await fetch(location);
    if (!assetRes.ok) {
      return NextResponse.json({ error: 'Gagal download asset' }, { status: 502 });
    }

    const buffer = await assetRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': assetRes.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="asset-${assetId}.rbxm"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error('Proxy error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
