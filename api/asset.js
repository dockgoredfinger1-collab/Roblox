export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const assetId = req.query.id || req.query.assetId;

  if (!assetId || isNaN(Number(assetId))) {
    return res.status(400).json({ 
      error: 'Asset ID tidak valid. Contoh: ?id=1818' 
    });
  }

  const apiKey = process.env.ROBLOX_API_KEY;
  if (!apiKey) {
    console.error('ROBLOX_API_KEY belum diatur di Vercel');
    return res.status(500).json({ error: 'API Key belum diatur di Vercel' });
  }

  try {
    console.log(`Downloading asset ID: ${assetId}`);

    // Step 1: Ambil temporary download link
    const metaRes = await fetch(`https://apis.roblox.com/asset-delivery-api/v1/assetId/${assetId}`, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'RobloxAssetProxy/1.0'
      }
    });

    if (!metaRes.ok) {
      const errText = await metaRes.text().catch(() => '');
      console.error(`Meta error ${metaRes.status}: ${errText}`);
      return res.status(metaRes.status).json({ 
        error: `Gagal ambil link download (${metaRes.status})` 
      });
    }

    const meta = await metaRes.json();
    const downloadUrl = meta?.location;

    if (!downloadUrl) {
      return res.status(502).json({ error: 'Download link tidak ditemukan dari Roblox' });
    }

    // Step 2: Download file binary
    const assetRes = await fetch(downloadUrl);

    if (!assetRes.ok) {
      return res.status(502).json({ error: 'Gagal download file asset' });
    }

    const buffer = await assetRes.arrayBuffer();

    // Kirim file ke browser/user
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="roblox-asset-${assetId}.rbxm"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.status(200).send(Buffer.from(buffer));

  } catch (err) {
    console.error('Download proxy error:', err.message);
    res.status(500).json({ error: 'Terjadi error di server proxy' });
  }
}
