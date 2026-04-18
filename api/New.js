export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const keyword = (req.query.keyword || "house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  const cookie = process.env.ROBLOX_COOKIE;

  try {
    // Step 1: Ambil list ID dari toolbox
    const searchUrl = `https://apis.roblox.com/toolbox-service/v1/models?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'RobloxStudio/WinInet',
        'Accept': 'application/json',
        'Cookie': `.ROBLOSECURITY=${cookie}`,
      },
    });

    const searchData = await searchRes.json();
    const ids = (searchData.data || []).map(item => item.id).filter(Boolean);

    if (ids.length === 0) {
      return res.status(200).json({ success: true, total: 0, keyword, results: [] });
    }

    // Step 2: Fetch nama + thumbnail sekaligus pakai batch endpoint
    const detailUrl = `https://catalog.roblox.com/v1/catalog/items/details`;
    const detailRes = await fetch(detailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': `.ROBLOSECURITY=${cookie}`,
      },
      body: JSON.stringify({
        items: ids.map(id => ({ itemType: "Asset", id }))
      }),
    });

    const detailData = await detailRes.json();
    const detailMap = {};
    for (const item of (detailData.data || [])) {
      detailMap[item.id] = item;
    }

    // Step 3: Gabungkan hasil
    const results = ids.map(id => {
      const detail = detailMap[id] || {};
      return {
        id,
        name: detail.name || "Unknown",
        creator: detail.creatorName || "Unknown",
        thumbnail: `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&returnPolicy=PlaceHolder&size=150x150&format=Png`,
      };
    });

    res.status(200).json({ success: true, total: results.length, keyword, results });

  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
