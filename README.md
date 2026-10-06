# RateGuard

RateGuard is a Redis-backed API rate limiter designed to control excessive API requests and protect servers from overload.

It supports authentication, API keys, plan-based limits, sliding-window rate limiting, request analytics, and Redis failure handling.

## Features

- JWT-based authentication
- API key authentication
- Free and Pro usage plans
- Redis-backed rate limiting
- Sliding Window algorithm
- Atomic Redis Lua script
- HTTP 429 responses for blocked requests
- `Retry-After` header
- Rate-limit headers
- Per-client request isolation
- Request statistics and analytics
- Redis health check
- Redis failure handling with HTTP 503
- Production-style project structure

## Tech Stack

- Node.js
- Express.js
- Redis
- JavaScript
- JWT
- bcrypt
- Lua

## How It Works

```text
Client
  |
  v
JWT Authentication
  |
  v
API Key Validation
  |
  v
Identify Client + Plan
  |
  v
Redis Sliding Window
  |
  +---- Allowed ----> API
  |
  +---- Blocked ----> HTTP 429




  Rate Limiting

RateGuard uses the Sliding Window algorithm.

Redis Sorted Sets store request timestamps.

Important Redis operations:

ZADD
ZREMRANGEBYSCORE
ZCARD

For every request:

Remove expired requests.
Count requests still inside the window.
Compare the count with the client's plan limit.
Allow the request if the limit has not been reached.
Otherwise return HTTP 429.

The rate-limit operation is executed atomically using a Redis Lua script.

Plans
Plan	Requests
Free	5 requests/minute
Pro	100 requests/minute
Rate Limit Headers

Successful requests include:

X-RateLimit-Limit
X-RateLimit-Remaining

Blocked requests include:

X-RateLimit-Limit
X-RateLimit-Remaining
Retry-After

Example:

HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
Retry-After: 12
Analytics

RateGuard tracks:

Total requests
Blocked requests
Allowed requests
Current requests in the sliding window

Example:

{
  "clientId": "client1",
  "plan": "free",
  "limit": 5,
  "total": 36,
  "blocked": 21,
  "allowed": 15,
  "currentRequests": 3
}
API Endpoints
Login
POST /login

Used to authenticate a user and receive a JWT token.

Health Check
GET /health

Checks whether Redis is available.

Successful response:

{
  "status": "ok",
  "redis": "connected"
}
Statistics
GET /stats

Returns request statistics for the authenticated client.

Test API
GET /

Returns:

Hello from RateGuard
Project Structure
rateguard/
│
├── server.js
│
├── config/
│   ├── plans.js
│   └── redis.js
│
├── middleware/
│   ├── auth.js
│   ├── apiKey.js
│   └── rateLimiter.js
│
├── routes/
│   ├── auth.js
│   └── stats.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
Running Locally

Clone the repository:

git clone <your-repository-url>
cd rateguard

Install dependencies:

npm install

Create a .env file:

JWT_SECRET=your-secret-key

Make sure Redis is running.

Then start the server:

node server.js

The server runs on:

http://localhost:5000
Error Handling

RateGuard handles important failure cases:

Too Many Requests
429 Too Many Requests
Redis Unavailable
503 Service Unavailable

Example:

{
  "error": "Rate limiter unavailable"
}
Invalid Authentication
401 Unauthorized
Future Improvements
Redis-based distributed rate limiting across multiple server instances
Persistent user database
Admin dashboard
Rate-limit configuration through an API
Docker deployment
Cloud deployment
More advanced monitoring and metrics
Learning Goals

This project was built to understand:

REST APIs
Express middleware
JWT authentication
Redis
Redis Sorted Sets
Lua scripting
Atomic operations
Sliding Window rate limiting
API security
Distributed systems concepts
Production-style backend architecture