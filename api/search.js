export default async function handler(req, res) {
    try {
        const keyword = req.query.keyword || "house";
        const limit = req.query.limit || 10;

        const url = `https://apis.roblox.com/toolbox-service/v1/search?keyword=${keyword}&limit=${limit}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Roblox-Toolbox"
            }
        });

        const data = await response.json();

        // rapihin data biar gampang dipakai di Roblox
        const result = (data.data || []).map(item => ({
            id: item.id,
            name: item.name
        }));

        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({
            error: "Gagal fetch API",
            detail: err.toString()
        });
    }
}
