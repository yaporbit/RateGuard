const { plans } = require("../config/plans");

function rateLimiter(redisClient) {

    const WINDOW = 60;

    async function limiter(req, res, next) {
        const clientId = req.clientId;
        const plan = req.plan;

        const key = `rate:${clientId}`;

        const totalKey = `stats:${clientId}:total`;
        const blockedKey = `stats:${clientId}:blocked`;

        const limit = plans[plan];

        const script = `
            local now = tonumber(ARGV[1])
            local cutoff = now - tonumber(ARGV[2])

            redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, cutoff)

            local count = redis.call("ZCARD", KEYS[1])

            if count >= tonumber(ARGV[3]) then

                local oldest = redis.call(
                    "ZRANGE",
                    KEYS[1],
                    0,
                    0,
                    "WITHSCORES"
                )

                redis.call("INCR", KEYS[2])

                redis.call("INCR", KEYS[3])

                return {0, oldest[2]}
            end

            redis.call("ZADD", KEYS[1], now, ARGV[4])

            redis.call("INCR", KEYS[2])

            return count + 1
        `;

        const now = Date.now();

        const requestId = `${now}-${Math.random()}`;

        let result;

        try {
            result = await redisClient.eval(script, {
                keys: [key, totalKey, blockedKey],

                arguments: [
                    String(now),
                    String(WINDOW * 1000),
                    String(limit),
                    requestId
                ]
            });
        } catch (error) {
            console.log("Rate limiter Redis error:", error.message);

            return res.status(503).json({
                error: "Rate limiter unavailable"
            });
        }

        //console.log("RESULT:", result);

        if (Array.isArray(result) && result[0] === 0) {

            const oldest = Number(result[1]);

            const retryAfter = Math.max(
                1,
                Math.ceil(
                    (oldest + WINDOW * 1000 - now) / 1000
                )
            );

            res.set("X-RateLimit-Limit", limit);
            res.set("X-RateLimit-Remaining", 0);
            res.set("Retry-After", retryAfter);

            return res.status(429).send("Too many requests");
        }

        const remaining = limit - result;

        res.set("X-RateLimit-Limit", limit);
        res.set("X-RateLimit-Remaining", remaining);

        next();
    }

    return limiter;
}

module.exports = rateLimiter;