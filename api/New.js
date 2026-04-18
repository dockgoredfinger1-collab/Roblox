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

    // Step 2: Fetch nama dari economy API (no auth needed)
    const nameRes = await fetch(
      `https://economy.roblox.com/v2/assets?assetIds=${ids.join(",")}`,
      { headers: { 'Accept': 'application/json' } }
    );
    const nameData = nameRes.ok ? await nameRes.json() : { data: [] };
    console.log("NAME ITEM 0:", JSON.stringify((nameData.data || [])[0], null, 2));

    const nameMap = {};
    for (const item of (nameData.data || [])) {
      nameMap[item.assetId] = item.name;
    }

    // Step 3: Fetch thumbnail batch
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${ids.join(",")}&returnPolicy=PlaceHolder&size=150x150&format=Png`
    );
    const thumbData = thumbRes.ok ? await thumbRes.json() : { data: [] };
    const thumbMap = {};
    for (const t of (thumbData.data || [])) {
      thumbMap[t.targetId] = t.imageUrl;
    }

    // Step 4: Gabungkan
    const results = ids.map(id => ({
      id,
      name: nameMap[id] || "Unknown",
      creator: "Unknown",
      thumbnail: thumbMap[id] || `https://www.roblox.com/asset-thumbnail/image?assetId=${id}&width=150&height=150&format=png`,
    }));

    res.status(200).json({ success: true, total: results.length, keyword, results });

  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
