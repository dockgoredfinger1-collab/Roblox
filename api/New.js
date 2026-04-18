export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const keyword = (req.query.keyword || "house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  const cookie = process.env.ROBLOX_COOKIE;

  try {
    // Step 1: Ambil IDs
    const searchRes = await fetch(
      `https://apis.roblox.com/toolbox-service/v1/models?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'RobloxStudio/WinInet',
          'Accept': 'application/json',
          'Cookie': `.ROBLOSECURITY=${cookie}`,
        },
      }
    );
    const searchData = await searchRes.json();
    const ids = (searchData.data || []).map(item => item.id).filter(Boolean);

    if (ids.length === 0) {
      return res.status(200).json({ success: true, total: 0, keyword, results: [] });
    }

    // Step 2: Fetch nama pakai multiget
    const detailRes = await fetch(
      `https://economy.roblox.com/v2/assets?assetIds=${ids.join(",")}`,
      {
        headers: {
          'Accept': 'application/json',
          'Cookie': `.ROBLOSECURITY=${cookie}`,
        },
      }
    );
    const detailData = await detailRes.json();

    // Bikin map id -> name
    const nameMap = {};
    for (const item of (detailData.data || [])) {
      nameMap[item.assetId] = item.name;
    }

    // Step 3: Gabungkan
    const results = ids.map(id => ({
      id,
      name: nameMap[id] || "Unknown",
      creator: "Unknown",
      thumbnail: `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&returnPolicy=PlaceHolder&size=150x150&format=Png`,
    }));

    res.status(200).json({ success: true, total: results.length, keyword, results });

  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
