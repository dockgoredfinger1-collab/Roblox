export default async function handler(req, res) {
    try {
        const keyword = req.query.keyword || "house";
        const limit = req.query.limit || 10;

        const url = `https://apis.roblox.com/toolbox-service/v1/search?keyword=${keyword}&limit=${limit}`;

        const response = await fetch(url);

        // 🔥 cek status dulu
        if (!response.ok) {
            return res.status(500).json({
                error: "API Roblox gagal",
                status: response.status
            });
        }

        const text = await response.text();

        // 🔥 amankan parse JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return res.status(500).json({
                error: "Response bukan JSON",
                raw: text.slice(0, 200)
            });
        }

        const result = (data.data || []).map(item => ({
            id: item.id,
            name: item.name
        }));

        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({
            error: "Server crash",
            detail: err.toString()
        });
    }
}
