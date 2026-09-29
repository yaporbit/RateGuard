const express = require("express");
const { createClient } = require("redis");

const app = express();


const redisClient = createClient();

redisClient.on("error", (err) => {
    console.log("Redis error:", err);
});


// redisClient.connect();

// redisClient.set("test", "hello");

async function startServer() {
    await redisClient.connect();

    app.listen(5000, () => {
        console.log("Server running on port 5000");
    });
}

startServer();


let count = 0;
let start = Date.now();

const LIMIT = 5;
const WINDOW = 60000;



// app.use((req, res, next) => {

//     console.log("Middleware ran");

//     if (Date.now() - start >= WINDOW) {
//         count = 0;
//         start = Date.now();
//     }

//     count++;

//     console.log(req.url);

//     if (count > LIMIT) {
//         res.status(429).send("Too many requests");
//         return;
//     }

//     next();
// });


app.use(async (req, res, next) => {
  // const key = "user123"; 

  const userId = "user456";
const key = `rate:${userId}`;

    const count = await redisClient.get(key);

    console.log("Current count:", count);

    if (count === null) {
        await redisClient.set(key, 1, {
            EX: 60
        });

        console.log("First request - count set to 1");

        next();
        return;
    }

    const currentCount = Number(count);

    if (currentCount >= LIMIT) {
        res.status(429).send("Too many requests");
        return;
    }

    await redisClient.incr(key);

    next();
});



app.get("/", (req, res) => {
    res.send("Hello from RateGuard");
});

