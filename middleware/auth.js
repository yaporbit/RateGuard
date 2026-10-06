const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send("No token");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.userId;

        next();
    } catch {
        res.status(401).send("Invalid token");
    }
}

module.exports = auth;