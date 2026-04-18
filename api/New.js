export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = (req.query.keyword || "house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  const cookie = process.env.ROBLOX_COOKIE;

  try {
    // 1. Fetch dari Toolbox API
    const url = `https://apis.roblox.com/toolbox-service/v1/marketplace?` +
      `assetType=Model&keyword=${encodeURIComponent(keyword)}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RobloxStudio/WinInet',
        'Accept': 'application/json',
        'Cookie': `.ROBLOSECURITY=${cookie}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Toolbox error (${response.status})`, detail: text });
    }

    const data = await response.json();
    const raw = data.data || [];

    if (raw.length === 0) {
      return res.status(200).json({ success: true, total: 0, results: [] });
    }

    // 2. Kumpulkan semua asset ID
    const ids = raw.map(item => item.asset?.id || item.id).filter(Boolean);

    // 3. Fetch thumbnail batch dari Roblox
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${ids.join(",")}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`
    );
    const thumbData = thumbRes.ok ? await thumbRes.json() : { data: [] };
    const thumbMap = {};
    for (const t of (thumbData.data || [])) {
      thumbMap[t.targetId] = t.imageUrl;
    }

    // 4. Gabungkan data
    const results = raw.map(item => {
      const id = item.asset?.id || item.id;
      return {
        id: id,
        name: item.asset?.name || item.name || "Unknown",
        creator: item.asset?.creatorName || "Unknown",
        thumbnail: thumbMap[id] || `https://www.roblox.com/asset-thumbnail/image?assetId=${id}&width=150&height=150&format=png`,
      };
    });

    res.status(200).json({ success: true, total: results.length, keyword, results });

  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
