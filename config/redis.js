const { createClient } = require("redis");

const redisClient = createClient();

redisClient.on("error", (err) => {
    console.log("Redis error:", err);
});

module.exports = redisClient;