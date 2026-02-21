# DevPortal Backend — OAuth 2.0 Identity Provider

A secure **Node.js / Express** backend that acts as an **Identity Provider (IdP)** implementing the **OAuth 2.0 Authorization Code flow with PKCE**. Applications register on the portal, and their users authenticate against this service to receive JWT access tokens.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [API Reference](#api-reference)
  - [Auth Routes](#auth-routes)
  - [Application Routes](#application-routes)
  - [Access Request Routes](#access-request-routes)
  - [OAuth 2.0 Routes](#oauth-20-routes)
- [OAuth 2.0 Flow](#oauth-20-flow)
- [Security](#security)
- [Deployment (Render)](#deployment-render)

---

## Features

- 🔐 **JWT Authentication** — registration, login, protected routes
- 🏢 **Application Management** — register OAuth clients with `clientId` / `clientSecret` + redirect URI
- 👥 **User Access Control** — per-app role-based access granted by app admins
- 🔄 **OAuth 2.0 PKCE Flow** — `validate → authorize → token` endpoints
- ⚡ **SSO Session Bypass** — auto-redirect if a valid DevPortal session already exists
- 🌐 **Dynamic CORS** — `/api/oauth/*` open to all origins; all other routes restricted to the DevPortal frontend
- 🛡️ **Helmet + Rate Limiting** — security headers and 100 req/15 min limit

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Auth | jsonwebtoken, bcryptjs |
| Security | helmet, cors, express-rate-limit |
| Dev | nodemon, dotenv |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js            # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register / Login / Me
│   │   ├── applicationController.js # CRUD for OAuth clients
│   │   ├── accessRequestController.js # Access request management
│   │   ├── oauthController.js     # validate / authorize / token / SSO
│   │   └── documentationController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT verification middleware
│   │   └── oauthCors.js           # Dynamic CORS for OAuth routes (legacy)
│   ├── models/
│   │   ├── User.js                # username, email, password, appAccess[]
│   │   ├── Application.js         # clientId, clientSecret, redirectUri, roles[], admins[]
│   │   ├── AccessRequest.js       # pending access requests
│   │   └── AuthorizationCode.js   # short-lived PKCE auth codes
│   ├── routes/
│   │   ├── auth.js
│   │   ├── applications.js
│   │   ├── accessRequests.js
│   │   ├── documentation.js
│   │   └── oauth.js
│   └── server.js                  # Express app entry point
├── .env                           # Environment variables (never commit)
└── package.json
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devportal
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
NODE_ENV=development

# Production only
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Running Locally

```bash
cd backend
npm install
npm run dev        # starts with nodemon on http://localhost:5000
```

For production:
```bash
npm start          # node src/server.js
```

---

## API Reference

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Auth Routes
`/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ❌ | Create a new DevPortal user |
| POST | `/login` | ❌ | Login and receive a JWT |
| GET | `/me` | ✅ | Get the current logged-in user |

**POST /api/auth/register**
```json
{ "username": "alice", "email": "alice@example.com", "password": "Password@123" }
```

**POST /api/auth/login**
```json
{ "email": "alice@example.com", "password": "Password@123" }
```
Returns: `{ token, user }`

---

### Application Routes
`/api/applications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✅ | List all apps the user owns or has access to |
| GET | `/stats` | ✅ | Dashboard stats (total, active, pending) |
| GET | `/:id` | ✅ | Get a single application |
| POST | `/` | ✅ | Create a new OAuth client app |
| PUT | `/:id` | ✅ admin | Update an application |
| DELETE | `/:id` | ✅ admin | Delete an application |
| GET | `/:id/users` | ✅ admin | List users with access to this app |
| DELETE | `/:id/users/:userId` | ✅ admin | Revoke a user's access |

**POST /api/applications** — creator is automatically granted `admin` access
```json
{
  "name": "My App",
  "redirectUri": "https://myapp.com/callback",
  "roles": ["viewer", "editor"]
}
```
Returns first-and-only-time: `{ application: { clientId, clientSecret, ... } }`

> ⚠️ **Save `clientSecret` immediately — it is never shown again.**

---

### Access Request Routes
`/api/access-requests`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✅ admin | List pending requests for apps you admin |
| POST | `/` | ✅ | Request access to an application |
| PUT | `/:id/approve` | ✅ admin | Approve a request (assign role) |
| PUT | `/:id/deny` | ✅ admin | Deny a request |

---

### OAuth 2.0 Routes
`/api/oauth` — **No authentication required. Open CORS (all origins).**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/validate` | Validate OAuth parameters before showing login UI |
| POST | `/authorize` | Authenticate with email + password and get an auth code |
| POST | `/authorize-with-token` | SSO — exchange an existing DevPortal JWT for an auth code |
| POST | `/token` | Exchange auth code + PKCE verifier for an access token |

---

## OAuth 2.0 Flow

This server implements the **Authorization Code flow with PKCE (S256)**.

### Step 1 — Validate
```
GET /api/oauth/validate?clientId=app_xxx&redirectUrl=https://myapp.com/callback
    &code_challenge=BASE64URL(SHA256(verifier))&code_challenge_method=s256
```
Response: `{ application: { name, clientId } }`

### Step 2 — Authorize (user logs in)
```
POST /api/oauth/authorize
{
  "email": "user@example.com",
  "password": "...",
  "clientId": "app_xxx",
  "redirectUrl": "https://myapp.com/callback",
  "code_challenge": "...",
  "code_challenge_method": "s256"
}
```
Response: `{ code: "auth_code_hex" }`
→ Frontend redirects to: `https://myapp.com/callback?code=auth_code_hex`

### Step 2 (alternative) — SSO Bypass
If the user already has a valid DevPortal session:
```
POST /api/oauth/authorize-with-token
{
  "token": "<devportal_jwt>",
  "clientId": "app_xxx",
  "redirectUrl": "https://myapp.com/callback",
  "code_challenge": "...",
  "code_challenge_method": "s256"
}
```

### Step 3 — Token Exchange (from your app's backend or frontend)
```
POST /api/oauth/token
{
  "code": "auth_code_hex",
  "code_verifier": "original_random_string",
  "clientId": "app_xxx"
}
```
Response:
```json
{
  "access_token": "JWT...",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "user": { "id", "username", "email" },
  "role": "admin"
}
```

### PKCE Code Challenge Generation (S256)
```js
// In your client app
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
```

---

## Security

| Mechanism | Detail |
|---|---|
| Password hashing | bcryptjs, 10 salt rounds |
| JWT | Signed with `JWT_SECRET`, expires in `JWT_EXPIRE` |
| PKCE | S256 — code verifier hashed server-side before comparison |
| Auth codes | Single-use, expire in 10 minutes, deleted after exchange |
| Rate limiting | 100 requests per 15 minutes per IP |
| Helmet | Secure HTTP headers on all routes |
| CORS | `/api/oauth/*` open to all; all other routes restricted to `FRONTEND_URL` |
| Access control | Only app admins can manage users, approve requests, update/delete apps |

---

## Deployment (Render)

1. Push backend to GitHub
2. Create a new **Web Service** on Render pointing to the `backend/` directory
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRE=30d
FRONTEND_URL=https://your-app.vercel.app
```

---

## License

© 2024 DevPortal. All rights reserved.
