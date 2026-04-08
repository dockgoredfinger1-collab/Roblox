export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = (req.query.keyword || "house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  const cookie = process.env.ROBLOX_COOKIE; // .ROBLOSECURITY kamu

  try {
    console.log(`Toolbox Search: keyword="${keyword}", limit=${limit}`);

    const url = `https://apis.roblox.com/toolbox-service/v1/marketplace/items?` +
      `assetType=Model` +
      `&keyword=${encodeURIComponent(keyword)}` +
      `&limit=${limit}` +
      `&sortOrder=Relevance`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RobloxStudio/WinInet',
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Toolbox API error ${response.status}: ${errText}`);
      return res.status(response.status).json({ error: `Toolbox error (${response.status})` });
    }

    const data = await response.json();
    const resultsRaw = data.data || [];

    console.log(`Ditemukan ${resultsRaw.length} model`);

    const results = resultsRaw.map(item => ({
      id: item.asset?.id || item.id,
      name: item.asset?.name || item.name || "Untitled",
      type: "Model",
      creator: item.asset?.creatorName || item.creator?.name || "Unknown",
      thumbnail: `https://thumbnails.roblox.com/v1/assets?assetIds=${item.asset?.id || item.id}&returnPolicy=PlaceHolder&size=150x150&format=Png`,
    }));

    res.status(200).json({
      success: true,
      total: results.length,
      keyword: keyword,
      results: results,
    });

  } catch (err) {
    console.error('Toolbox proxy error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
