const apiKeys = {
    "rg_free123": {
        clientId: "client1",
        plan: "free"
    },

    "rg_pro123": {
        clientId: "client2",
        plan: "pro"
    }
};

function apiKey(req, res, next) {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
        return res.status(401).send("API key required");
    }

    const client = apiKeys[apiKey];

    if (!client) {
        return res.status(401).send("Invalid API key");
    }

    req.clientId = client.clientId;
    req.plan = client.plan;

    next();
}

module.exports = apiKey;