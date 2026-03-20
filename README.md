# ExamEdge — AI-Powered Current Affairs for Indian Exam Aspirants

> UPSC · SSC · Banking · Railways  
> ₹19 subscription · 6 months full access · Razorpay payments

---

## What's Inside

```
examedge/
├── backend/
│   ├── server.js              ← Express API server (entry point)
│   ├── seed.js                ← One-time DB seed with 10 sample articles
│   ├── .env.example           ← Copy to .env and fill your keys
│   ├── package.json
│   ├── config/
│   │   ├── database.js        ← MongoDB connection
│   │   └── redis.js           ← Redis caching (optional)
│   ├── models/
│   │   ├── User.js            ← User + subscription + streak schema
│   │   ├── Article.js         ← News + AI summaries + quizzes schema
│   │   └── QuizAttempt.js     ← Quiz history schema
│   ├── middleware/
│   │   └── auth.js            ← JWT auth + premium guard
│   ├── routes/
│   │   ├── auth.js            ← OTP send/verify, JWT refresh, /me
│   │   ├── articles.js        ← Free headlines + premium feed
│   │   ├── payment.js         ← Razorpay order create + verify + webhook
│   │   ├── quiz.js            ← Submit answers + AI generate + daily drill
│   │   └── user.js            ← Bookmarks + profile
│   └── pipeline/
│       ├── fetchNews.js       ← NewsAPI + GNews fetcher + dedup
│       ├── aiProcess.js       ← Claude Haiku AI: summary + MCQs
│       ├── runPipeline.js     ← Manual pipeline trigger
│       └── cron.js            ← Cron scheduler (6 AM IST daily)
└── frontend/
    └── public/
        └── index.html         ← Complete single-page web app
```

---

## Prerequisites

Install these before you start:

| Tool | Download | Check |
|------|----------|-------|
| Node.js v18+ | https://nodejs.org | `node -v` |
| MongoDB Community | https://www.mongodb.com/try/download/community | `mongod --version` |
| VS Code | https://code.visualstudio.com | — |

---

## Step 1 — Open in VS Code

```bash
# Open VS Code, then open the examedge folder
# File → Open Folder → select examedge/
```

Open the integrated terminal: **Terminal → New Terminal**

---

## Step 2 — Install Dependencies

```bash
cd backend
npm install
```

This installs Express, Mongoose, Razorpay SDK, Anthropic SDK, and all other packages.

---

## Step 3 — Configure Environment

```bash
# In the backend/ folder:
cp .env.example .env
```

Open `.env` in VS Code and fill in your values:

### MongoDB (free local setup)
```
MONGODB_URI=mongodb://localhost:27017/examedge
```
Start MongoDB locally:
- **Windows**: MongoDB runs as a Windows Service automatically after install
- **Mac**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

Or use **MongoDB Atlas** (free cloud):
1. Go to https://cloud.mongodb.com
2. Create free cluster → Connect → Drivers → Copy connection string
3. Replace `MONGODB_URI` with your Atlas URI

### Anthropic API (for AI summaries + MCQs)
1. Go to https://console.anthropic.com
2. Create API key
3. Set `ANTHROPIC_API_KEY=sk-ant-...`
4. Cost: ~₹0.40/day for 25 articles (Claude Haiku)

### Razorpay (for ₹19 payments)
1. Go to https://dashboard.razorpay.com
2. Register → Settings → API Keys → Generate Test Key
3. Set `RAZORPAY_KEY_ID=rzp_test_xxx` and `RAZORPAY_KEY_SECRET=xxx`
4. Test keys start with `rzp_test_` — no real money moves

### NewsAPI (for fetching news)
1. Go to https://newsapi.org/register
2. Get free API key (100 requests/day)
3. Set `NEWSAPI_KEY=your_key`

### JWT Secrets (generate random strings)
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output to `JWT_SECRET`, run again for `JWT_REFRESH_SECRET`.

---

## Step 4 — Seed the Database

Run this once to populate your DB with 10 ready-made articles so the app works immediately:

```bash
# Make sure MongoDB is running first!
node seed.js
```

You should see:
```
✅ Connected to MongoDB
✅ Inserted 10 sample articles
✅ Marked 3 articles as free preview
🚀 Seed complete! Your app is ready to use.
```

---

## Step 5 — Start the Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected
✅ ExamEdge server running on http://localhost:5000
```

Open your browser → **http://localhost:5000**

---

## Step 6 — Test the Full Flow

### Test OTP Login
1. Click **Sign in** on the homepage
2. Enter any phone number (e.g. `9876543210`)
3. Click **Send OTP**
4. The OTP prints in your terminal (look for `📱 OTP for ... : 1234`)
5. Enter that OTP in the boxes
6. You'll see the payment screen

### Test Payment (Test Mode)
The app auto-detects test Razorpay keys and runs in **demo mode** — no real payment needed.
- Click **Pay ₹19 via Razorpay**
- If you have real test keys: use card `4111 1111 1111 1111`, any future date, any CVV
- If demo mode: payment is simulated instantly

### Test Premium Features
After login + payment, you can:
- Browse the full feed with AI summaries
- Answer MCQ quizzes (answers are stored in MongoDB)
- Bookmark articles
- Take the Daily Drill (10 questions)
- Take the Mock Test (16 questions)
- Click **+ AI Generate More** on any article for live AI-generated MCQs

---

## Step 7 — Run the News Pipeline

Once you have your API keys, run the daily pipeline to fetch real news:

```bash
node pipeline/runPipeline.js
```

This will:
1. Fetch ~60 articles from NewsAPI + GNews
2. Deduplicate against what's in the DB
3. Process each with Claude Haiku (summary + key points + 2 MCQs)
4. Mark top 3 as free preview
5. Clear Redis cache

**In production** this runs automatically at 6:00 AM IST via cron.

---

## API Reference

### Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone/email |
| POST | `/api/auth/verify-otp` | Verify OTP, get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/articles/headlines` | Free headlines (3 articles, no auth) |
| GET | `/api/health` | Server health check |

### Protected Endpoints (require Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Get current user + update streak |
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment, activate premium |

### Premium Endpoints (require Bearer token + active subscription)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/articles/feed` | Full article feed with AI content |
| GET | `/api/articles/:id` | Single article detail |
| POST | `/api/quiz/submit` | Submit quiz answer |
| POST | `/api/quiz/generate` | AI-generate extra MCQs |
| GET | `/api/quiz/daily-drill` | 10 questions for daily drill |
| GET | `/api/quiz/stats` | User quiz statistics |
| GET | `/api/user/bookmarks` | Get bookmarked articles |
| POST | `/api/user/bookmarks/:id` | Add bookmark |
| DELETE | `/api/user/bookmarks/:id` | Remove bookmark |

---

## Deployment (Go Live)

### Option A — Railway.app (Recommended, easiest)
1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway auto-builds and deploys

### Option B — DigitalOcean App Platform
1. Create account at https://digitalocean.com
2. Apps → New App → GitHub → select repo
3. Set environment variables
4. Deploy ($12/month)

### Option C — VPS (cheapest)
```bash
# On your server (Ubuntu 22.04)
apt install nodejs npm nginx
git clone your-repo
cd examedge/backend && npm install
# Set up .env
# Use PM2 to keep server running:
npm install -g pm2
pm2 start server.js --name examedge
pm2 save
pm2 startup
```

### MongoDB Atlas (production DB)
- Free M0 cluster for development (512MB)
- Upgrade to M10 ($57/month) for production at 1000+ users

---

## Cost Breakdown (Per Month)

| Item | Cost |
|------|------|
| Server (Railway/DigitalOcean) | ₹1,000–2,000/mo |
| MongoDB Atlas M0 | Free (dev) → ₹4,000/mo (M10 at scale) |
| Claude Haiku API (25 articles/day) | ~₹15/mo |
| NewsAPI | Free (100 req/day) |
| Razorpay | 2% per transaction (~₹0.38 per ₹19 payment) |
| **Total at 0-500 users** | **~₹1,500/mo** |

Break-even: **79 subscribers** cover all monthly costs.

---

## Troubleshooting

**"MongoDB connection error"**
- Make sure `mongod` is running: `sudo systemctl start mongod` (Linux) or check Windows Services
- Or use MongoDB Atlas cloud URI

**"No articles showing in feed"**
- Run `node seed.js` to add sample data
- Or run `node pipeline/runPipeline.js` to fetch real news

**"Premium subscription required" error**
- Complete the payment flow in the app
- Or directly in MongoDB: `db.users.updateOne({email:"your@email.com"},{$set:{role:"premium","subscription.status":"active","subscription.endDate":new Date("2025-12-31")}})`

**"AI generation failed"**
- Check `ANTHROPIC_API_KEY` is set in `.env`
- Verify you have API credits at console.anthropic.com

**Razorpay "Invalid key" error**
- Make sure you're using TEST keys (start with `rzp_test_`) for development
- Copy both Key ID and Key Secret exactly from Razorpay dashboard

---

## Support

Built with ❤️ for Indian exam aspirants.
Questions? Check the code comments — every file is thoroughly commented.
