export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = (req.query.keyword || "simple house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const category = req.query.category || "Model";

  const apiKey = process.env.ROBLOX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ROBLOX_API_KEY belum diatur di Vercel' });
  }

  try {
    const url = `https://apis.roblox.com/toolbox-service/v2/assets:search?keyword=${encodeURIComponent(keyword)}&searchCategoryType=${encodeURIComponent(category)}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'RobloxAssetProxy/1.0',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Search failed ${response.status}: ${errText}`);
      return res.status(response.status).json({ error: `Roblox error ${response.status}` });
    }

    const data = await response.json();
    const resultsRaw = data.data || data.results || [];

    const results = resultsRaw.map(item => ({
      id: item.id || item.assetId,
      name: item.name || "No Name",
      type: item.assetType || category,
      creator: item.creator?.name || "Unknown",
      thumbnail: item.thumbnailUrl || null
    }));

    res.status(200).json({
      success: true,
      total: results.length,
      keyword,
      category,
      results,
      note: results.length === 0 ? "Coba keyword lebih spesifik seperti: modern house, small house, building, furniture" : ""
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
}
