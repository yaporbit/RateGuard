const express = require("express");
const { plans } = require("../config/plans");

function stats(redisClient) {

    const router = express.Router();

    router.get("/stats", async (req, res) => {

        const clientId = req.clientId;
        const plan = req.plan;

        const limit = plans[plan];

        const total = Number(
            await redisClient.get(`stats:${clientId}:total`) || 0
        );

        const blocked = Number(
            await redisClient.get(`stats:${clientId}:blocked`) || 0
        );

        const currentRequests = await redisClient.zCard(
            `rate:${clientId}`
        );

        const allowed = total - blocked;

        res.json({
            clientId,
            plan,
            limit,
            total,
            blocked,
            allowed,
            currentRequests
        });
    });

    return router;
}

module.exports = stats;