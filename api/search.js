export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyword = (req.query.keyword || "house").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 60); // max aman 60

  const apiKey = process.env.ROBLOX_API_KEY; // masih dipakai kalau mau mix dengan download nanti

  try {
    console.log(`Search Catalog: keyword="${keyword}", limit=${limit}`);

    // Catalog API public (v2) - paling stabil untuk search asset
    const url = `https://catalog.roblox.com/v2/search/items/details?` +
      `keyword=${encodeURIComponent(keyword)}` +
      `&limit=${limit}` +
      `&categoryFilter=CommunityCreations`;   // ini yang penting biar dapet model rumah dll

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RobloxAssetProxy/1.0',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Catalog API error ${response.status}: ${errText}`);
      return res.status(response.status).json({ error: `Catalog error (${response.status})` });
    }

    const data = await response.json();
    const resultsRaw = data.data || [];

    console.log(`Ditemukan ${resultsRaw.length} asset`);

    // Rapihkan data + tambah thumbnail URL (ukuran sedang)
    const results = resultsRaw.map(item => ({
      id: item.id,
      name: item.name || "Untitled",
      type: item.assetType || "Model",
      creator: item.creator?.name || "Unknown",
      thumbnail: `https://thumbnails.roblox.com/v1/assets?assetIds=${item.id}&returnPolicy=PlaceHolder&size=150x150&format=Png`,
      created: item.created || null
    }));

    res.status(200).json({
      success: true,
      total: results.length,
      keyword: keyword,
      results: results,
      note: results.length === 0 
        ? "Coba keyword lebih spesifik (modern house, small house, furniture, building, car, etc)" 
        : "Data siap dipakai di Studio Lite"
    });

  } catch (err) {
    console.error('Search proxy error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
