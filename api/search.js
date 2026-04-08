export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = (req.query.keyword || "simple house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const category = req.query.category || "Model";

  const apiKey = process.env.ROBLOX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key belum diatur' });
  }

  try {
    const url = `https://apis.roblox.com/toolbox-service/v2/assets:search?` +
      `keyword=${encodeURIComponent(keyword)}` +
      `&searchCategoryType=${encodeURIComponent(category)}` +
      `&limit=${limit}`;

    console.log(`Search URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'RobloxAssetProxy/1.0',
      },
    });

    console.log(`Roblox response status: ${response.status}`);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Error body: ${errText}`);
      return res.status(response.status).json({ 
        error: `Roblox search gagal (${response.status})`,
        detail: errText 
      });
    }

    const data = await response.json();
    console.log(`Raw data keys:`, Object.keys(data));

    const resultsRaw = data.data || data.results || data.assets || [];
    console.log(`Jumlah hasil raw: ${resultsRaw.length}`);

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
      keyword: keyword,
      category: category,
      results: results,
      note: results.length === 0 
        ? "Search Roblox sering kosong via proxy. Coba keyword sangat spesifik (contoh: modern small house, wooden cabin) atau gunakan endpoint download langsung." 
        : ""
    });

  } catch (err) {
    console.error('Search proxy error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
