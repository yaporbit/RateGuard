const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();

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

router.post("/login", async (req, res) => {
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

module.exports = router;