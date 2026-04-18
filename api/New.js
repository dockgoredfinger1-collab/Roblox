export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const keyword = (req.query.keyword || "house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  const cookie = process.env.ROBLOX_COOKIE;

  try {
    // ✅ URL sudah benar
    const url = `https://apis.roblox.com/toolbox-service/v1/marketplace?assetType=Model&keyword=${encodeURIComponent(keyword)}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RobloxStudio/WinInet',
        'Accept': 'application/json',
        'Cookie': `.ROBLOSECURITY=${cookie}`,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Toolbox error (${response.status})`,
        detail: text
      });
    }

    const data = JSON.parse(text);
    const resultsRaw = data.data || [];
    
    // Debug - lihat struktur aslinya
    console.log("RAW ITEM 0:", JSON.stringify(resultsRaw[0], null, 2));

    const results = resultsRaw.map(item => ({
      id: item.asset?.id || item.id,
      name: item.asset?.name || item.name || "Unknown",
      creator: item.asset?.creatorName || "Unknown",
      thumbnail: `https://www.roblox.com/asset-thumbnail/image?assetId=${item.asset?.id || item.id}&width=150&height=150&format=png`,
    }));

    res.status(200).json({
      success: true,
      total: results.length,
      keyword,
      results,
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
