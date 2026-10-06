const express = require("express");

require("dotenv").config();

const apiKey = require("./middleware/apiKey");
const auth = require("./middleware/auth");
const rateLimiter = require("./middleware/rateLimiter");
const authRoutes = require("./routes/auth");

const redisClient = require("./config/redis");
const { plans } = require("./config/plans");

const app = express();
const stats = require("./routes/stats");

app.use(express.json());
app.use(authRoutes);


const users = {
    user123: {
        email: "shaina@gmail.com",
        password: "$2b$10$6ThI5meq7U5Lk4H6s9yV7uTePln.5y4c4nhblP6Ejz7Ya08rVWxme",
        plan: "free"
    },

    user456: {
        email: "pro@gmail.com",
        password: "$2b$10$bQucQQi5v4z4zp6cJeDbo.l0fU4n.y/ECFuS7oWZ09/vexKdoyd4G",
        plan: "pro"
    }
};


// LOGIN
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = Object.values(users).find(
        user => user.email === email
    );

    if (!user) {
        return res.status(401).send("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        return res.status(401).send("Invalid credentials");
    }

    const userId = Object.keys(users).find(
        id => users[id].email === email
    );

    const token = jwt.sign(
        { userId: userId },
        process.env.JWT_SECRET
    );

    res.json({ token });
});


// HEALTH CHECK
app.get("/health", async (req, res) => {
    try {
        await redisClient.ping();

        res.json({
            status: "ok",
            redis: "connected"
        });
    } catch {
        res.status(503).json({
            status: "error",
            redis: "disconnected"
        });
    }
});


// JWT AUTHENTICATION
app.use(auth);


// API KEY MIDDLEWARE
app.use(apiKey);

app.use(stats(redisClient));


// STATS ROUTE
app.get("/stats", async (req, res) => {
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


// RATE LIMITER
app.use(rateLimiter(redisClient));


// TEST ROUTE
app.get("/", (req, res) => {
    res.send("Hello from RateGuard");
});


// START SERVER
async function startServer() {

    await redisClient.connect();

    app.listen(5000, () => {
        console.log("Server running on port 5000");
    });
}

startServer();



// const express = require("express");
// const { createClient } = require("redis");
// require("dotenv").config();

// const bcrypt = require("bcrypt");



// const app = express();
// const auth = require("./middleware/auth");
// app.use(express.json());

// const redisClient = createClient();

// const user = {
//     email: "shaina@gmail.com",
//     password: "$2b$10$bQucQQi5v4z4zp6cJeDbo.l0fU4n.y/ECFuS7oWZ09/vexKdoyd4G",
//     userId: "user123"
// };

// redisClient.on("error", (err) => {
//     console.log("Redis error:", err);
// });


// // redisClient.connect();

// // redisClient.set("test", "hello");

// async function startServer() {
//     await redisClient.connect();

//     app.listen(5000, () => {
//         console.log("Server running on port 5000");
//     });
// }

// startServer();


// //let count = 0;
// //let start = Date.now();





// // app.use((req, res, next) => {

// //     console.log("Middleware ran");

// //     if (Date.now() - start >= WINDOW) {
// //         count = 0;
// //         start = Date.now();
// //     }

// //     count++;

// //     console.log(req.url);

// //     if (count > LIMIT) {
// //         res.status(429).send("Too many requests");
// //         return;
// //     }

// //     next();
// // });


// const LIMIT = 3;
// const WINDOW = 60;


// // app.get("/token", (req, res) => {
// //     const token = jwt.sign(
// //         { userId: "user123" },
// //         process.env.JWT_SECRET
// //     );

// //     res.send(token);
// // });
// app.post("/login", async (req, res) => {
//     const { email, password } = req.body;

//     if (email !== user.email) {
//         return res.status(401).send("Invalid credentials");
//     }

//     const valid = await bcrypt.compare(password, user.password);

//     if (!valid) {
//         return res.status(401).send("Invalid credentials");
//     }

//     const token = jwt.sign(
//         { userId: user.userId },
//         process.env.JWT_SECRET
//     );

//     res.json({ token });
// });


// app.use(auth);

// app.use(async (req, res, next) => {
//     const userId = req.userId;
//     const key = `rate:${userId}`;

// const script = `
//     local count = redis.call("GET", KEYS[1])

//     if not count then
//         redis.call("SET", KEYS[1], 1, "EX", ARGV[2])
//         return 1
//     end
//     if tonumber(count) >= tonumber(ARGV[1]) then
//         return 0
//     end
//      return redis.call("INCR", KEYS[1])

// `;

// const result = await redisClient.eval(script, {
//     keys: [key],
//     arguments: [String(LIMIT),String(WINDOW)]
// });

//  if (result === 0) {
//     const ttl = await redisClient.ttl(key);

//     res.set("Retry-After", ttl);
//     res.status(429).send("Too many requests");
//     return;
// }

// const remaining = LIMIT - result;

// res.set("X-RateLimit-Limit", LIMIT);
// res.set("X-RateLimit-Remaining", remaining);

// next();

 
// });




// //     const count = await redisClient.get(key);

// //     console.log("Current count:", count);

// //     if (count === null) {
// //         await redisClient.set(key, 1, {
// //             EX: 60
// //         });

// //         console.log("First request - count set to 1");

// //         next();
// //         return;
// //     }

// //     const currentCount = Number(count);

// //     if (currentCount >= LIMIT) {
// //         res.status(429).send("Too many requests");
// //         return;
// //     }

// //     await redisClient.incr(key);

// //     next();
// // });

// const jwt = require("jsonwebtoken");

// const token = jwt.sign(
    
//     { userId: "user123" },
//     process.env.JWT_SECRET
// );
// const decoded = jwt.verify(token, process.env.JWT_SECRET);

// console.log(decoded);

// console.log(token);

// app.get("/", (req, res) => {
//     res.send("Hello from RateGuard");
// });

