# AGRIghar Backend API

## Setup & Run

### Step 1 — Install MongoDB
Download from https://www.mongodb.com/try/download/community
Install with default settings. MongoDB runs on port 27017.

### Step 2 — Install dependencies
```
cd agrighar/server
npm install
```

### Step 3 — Seed demo data (first time only)
```
node seed.js
```

### Step 4 — Start the server
```
npm run dev
```
Server runs on http://localhost:5000

---

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET  | /api/auth/profile | Get my profile |
| PUT  | /api/auth/profile | Update profile |

### Products
| Method | Route | Description |
|--------|-------|-------------|
| GET  | /api/products | Browse all products |
| GET  | /api/products/:id | Get single product |
| GET  | /api/products/my-listings | Farmer's own products |
| POST | /api/products | Add product (farmer) |
| PUT  | /api/products/:id | Edit product (farmer) |
| DELETE | /api/products/:id | Delete product (farmer) |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/orders | Place order |
| GET  | /api/orders/my-orders | Consumer's orders |
| GET  | /api/orders/farmer-orders | Farmer's orders |
| GET  | /api/orders/:id | Single order |
| PUT  | /api/orders/:id/status | Update status (farmer) |
| PUT  | /api/orders/:id/cancel | Cancel order (consumer) |

### Reviews
| Method | Route | Description |
|--------|-------|-------------|
| GET  | /api/reviews/:productId | Get product reviews |
| POST | /api/reviews | Submit review |
| DELETE | /api/reviews/:id | Delete review |

### Farmers
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/farmers | All farmers |
| GET | /api/farmers/nearby?lat=&lng= | Nearby farmers |
| GET | /api/farmers/:id | Farmer profile |

### AGRI Sahayak AI
Requires `GEMINI_API_KEY` in `.env` — see `.env.example`. Get a free key at [aistudio.google.com](https://aistudio.google.com).

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/ai/analyze-crop | Upload a crop/leaf image (`multipart/form-data`, field `image`) for an AI-based health assessment |
| POST | /api/ai/chat | Chat with the agriculture assistant. Body: `{ message, chatId?, relatedAnalysisId? }` |
| GET  | /api/ai/history | Current user's crop scans + chat conversations |
| GET  | /api/ai/analysis/:id | A single crop scan owned by the current user |

All AI routes require authentication (`Authorization: Bearer <token>`).

---

## Demo Credentials
- Farmer:   farmer@demo.com / demo123
- Consumer: consumer@demo.com / demo123
