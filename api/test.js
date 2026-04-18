export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = (req.query.keyword || "house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 60);
  const cookie = process.env.ROBLOX_COOKIE; // ambil dari env variable

  try {
    const url = `https://apis.roblox.com/toolbox-service/v1/models?` +
  `keyword=${encodeURIComponent(keyword)}` +
  `&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RobloxStudio/WinInet',
        'Accept': 'application/json',
        'Cookie': `.ROBLOSECURITY=${cookie}`, // ← ini yang penting
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

    const results = resultsRaw.map(item => ({
      console.log(item)
      id: item.asset?.id || item.id,
      name: item.asset?.name || item.asset?.Name || item.name || item.Name || item.title || item.Title || "Unknown",
      creator: item.asset?.creatorName || "Unknown",
      thumbnail: `https://thumbnails.roblox.com/v1/assets?assetIds=${item.asset?.id || item.id}&returnPolicy=PlaceHolder&size=150x150&format=Png`,
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
