export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = (req.query.keyword || "house").trim();
  let limit = parseInt(req.query.limit) || 10;
  if (limit > 50) limit = 50; // Roblox biasanya batasi max ~50

  const category = req.query.category || "Model";

  const apiKey = process.env.ROBLOX_API_KEY;

  if (!apiKey) {
    console.error('ROBLOX_API_KEY belum diatur');
    return res.status(500).json({ error: 'API Key belum diatur di Vercel' });
  }

  try {
    console.log(`Search request: keyword="${keyword}", category="${category}", limit=${limit}`);

    const url = `https://apis.roblox.com/toolbox-service/v2/assets:search?` +
      `keyword=${encodeURIComponent(keyword)}` +
      `&searchCategoryType=${encodeURIComponent(category)}` +
      `&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'RobloxAssetProxy/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`Roblox API Error ${response.status}: ${errorText}`);
      return res.status(response.status).json({
        error: `Roblox API error (${response.status})`,
        detail: errorText
      });
    }

    const data = await response.json();

    // Ambil hasil dari berbagai kemungkinan struktur response
    const resultsRaw = data.data || data.results || data.assets || [];

    const results = resultsRaw.map(item => ({
      id: item.id || item.assetId,
      name: item.name || "Untitled",
      type: item.assetType || item.assetTypeDisplayName || category,
      creator: item.creator?.name || item.creatorName || "Unknown",
      thumbnail: item.thumbnailUrl || item.imageUrl || null,
      description: item.description || null
    }));

    console.log(`Found ${results.length} results for "${keyword}"`);

    res.status(200).json({
      success: true,
      total: results.length,
      keyword: keyword,
      category: category,
      results: results,
      note: results.length === 0 ? "Coba keyword lebih spesifik atau ganti category" : null
    });

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({
      error: "Gagal fetch dari Roblox",
      detail: err.toString()
    });
  }
}
