export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = req.query.keyword || "house";
  const limit = parseInt(req.query.limit) || 10;
  const category = req.query.category || "Model";   // Model, Audio, Decal, Mesh, dll

  const apiKey = process.env.ROBLOX_API_KEY;

  if (!apiKey) {
    console.error('ROBLOX_API_KEY belum diatur di Vercel');
    return res.status(500).json({ 
      error: 'Server error: API Key belum diatur di Vercel' 
    });
  }

  try {
    console.log(`Search keyword: ${keyword} | category: ${category} | limit: ${limit}`);

    // Endpoint baru Roblox 2026 (Toolbox v2)
    const url = `https://apis.roblox.com/toolbox-service/v2/assets:search?` +
      `keyword=${encodeURIComponent(keyword)}` +
      `&limit=${limit}` +
      `&searchCategoryType=${category}`;

    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'RobloxAssetProxy/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`Search API error ${response.status}: ${errorText}`);
      return res.status(response.status).json({ 
        error: `Gagal mengambil data dari Roblox (${response.status})`,
        detail: errorText 
      });
    }

    const data = await response.json();

    // Rapihkan hasil supaya mudah dipakai di Roblox Studio / game kamu
    const result = (data.data || data.results || []).map(item => ({
      id: item.id || item.assetId,
      name: item.name,
      type: item.assetType || item.assetTypeDisplayName,
      creator: item.creator?.name || "Unknown",
      thumbnail: item.thumbnailUrl || null
    }));

    res.status(200).json({
      success: true,
      total: result.length,
      keyword: keyword,
      category: category,
      results: result
    });

  } catch (err) {
    console.error('Proxy search error:', err.message);
    res.status(500).json({
      error: "Gagal fetch API Roblox",
      detail: err.toString()
    });
  }
}
