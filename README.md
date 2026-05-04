# EliseAI GTM Lead Enrichment Platform

**Live demo**: https://elise-ai-jade.vercel.app/ — use `test@test.com` / `password123` to log in.

A full-stack tool that automates the inbound lead process for sales teams. Paste in a lead's basic contact info, and the platform automatically enriches it with real market data, scores it, and generates personalized outreach — replacing 20–30 minutes of manual SDR research with a single click. In this demo, it is a **shared** dashboard between all SDRs. Each SDR can see who is working on which lead.

**Presentation video**: https://www.youtube.com/watch?v=rPMZCpOIqjo

**Demo video**: https://www.youtube.com/watch?v=PVk8olu4dtQ

**Project Plan**: https://docs.google.com/document/d/11IDMz2ijoi90tgvNWJ6cEvrToZJGROP5fus4xL8mW3Y/edit?usp=sharing

**Presentation Slides**: https://docs.google.com/presentation/d/1BYnk59MUmmtOzam41e9zDzLuHWJ73Jfg_A3bCXrxz18/edit?usp=sharing


Presentation Slides
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Axios, Vite |
| Backend | FastAPI (Python 3.11), SQLAlchemy ORM, Pydantic v2 |
| Database | PostgreSQL 15 |
| AI | Google Gemini 2.5 Flash (`google-genai`) |
| Auth | JWT via `python-jose`, bcrypt via `passlib` |
| Container | Docker + Docker Compose |

---

## Features

- **Lead ingestion** — add leads manually or bulk import via CSV/TXT
- **Automated enrichment** — 8 data sources called per lead on trigger
- **Lead scoring** — rule-based 0–100 score with full breakdown
- **AI outreach generation** — draft email, talk track, sales insights via Gemini
- **On-demand AI SDR Assessment** — written fit recommendation grounded in local market data
- **Pipeline management** — Working On, Completed, and per-SDR assignment tracking
- **View filters** — Key Info / Market Data / All views on each lead detail page

---

## Data Sources & API Usage

### U.S. Census Bureau API
- **Endpoint:** `https://api.census.gov/data/2022/acs/acs5`
- **Pulls:** total rental units, population (2017 and 2022 for growth calc), renter ratio, median income
- **Used for:** Rental Market Size score (30 pts), Population Growth score (20 pts), Renter Ratio score (15 pts)
- **Key:** Required — free at https://api.census.gov/data/key_signup.html

### FRED — Federal Reserve Economic Data
- **Endpoint:** `https://api.stlouisfed.org/fred`
- **Pulls:** state-level unemployment rate, GDP growth rate
- **Used for:** Economic Health score (20 pts), market stability signals in insights
- **Key:** Required — free at https://fred.stlouisfed.org/docs/api/api_key.html

### HUD Fair Market Rents API
- **Endpoint:** `https://www.huduser.gov/hudapi/public/fmr`
- **Pulls:** 1BR, 2BR, 3BR fair market rent for the lead's metro area
- **Used for:** Market Insights card (2BR FMR display), market tier classification
- **Key:** Required — free at https://www.huduser.gov/portal/dataset/fmr-api.html
- **Note:** Small Area FMR metros nest data differently — handled in `hud_service.py`

### NewsAPI
- **Endpoint:** `https://newsapi.org/v2`
- **Pulls:** Recent headlines about the company, recent rental market news for the city
- **Used for:** Company Signals news items, Market News card
- **Key:** Required — free tier at https://newsapi.org/register (100 requests/day)

### Wikipedia API
- **Endpoint:** `https://en.wikipedia.org/api/rest_v1`
- **Pulls:** Introductory paragraph for the lead's city
- **Used for:** City Overview card on lead detail page
- **Key:** None required — public API

### OpenCorporates API
- **Endpoint:** `https://api.opencorporates.com/v0.4`
- **Pulls:** Company registration status, incorporation year, jurisdiction, entity type
- **Used for:** Company Signals (legitimacy verification), Company Signals score
- **Key:** None required for basic usage — public API

### Tavily (AI-powered web search)
- **SDK:** `tavily-python`
- **Pulls:** Company summary from web, Walk Score for the property address, supplemental market news
- **Used for:** Company Signals summary text, Walk Score display, market news fallback
- **Key:** Required — at https://app.tavily.com

### Google Gemini 2.5 Flash
- **SDK:** `google-genai`
- **Model:** `gemini-2.5-flash-lite`
- **Key:** Required — at https://aistudio.google.com/app/apikey

---

## Gemini AI — Prompts & Usage

Gemini is called in **two places** during the enrichment pipeline.

### 1. `generate_insights()` — called during enrichment run

A single Gemini call that returns all four AI-generated outputs at once as a JSON object.

**System instruction:**
```
You are a senior B2B sales intelligence analyst specializing in property management software.
```

**Prompt structure:**
```
You are analyzing a lead for EliseAI's sales team. EliseAI sells AI-powered property management software.

LEAD: company, location, score
MARKET DATA: rental units, population, population growth, renter ratio, unemployment, GDP, 2BR FMR
COMPANY: summary, status, incorporated, recent news
CITY: overview, market news, rental news

Return ONLY a JSON object:
{
  "sales_insights": {
    "Market Overview": "2-3 sentences on the rental market opportunity",
    "Economic Health": "2-3 sentences on economic indicators",
    "Property Context": "2-3 sentences on the property management landscape",
    "Company Signals": "2-3 sentences on portfolio scale, recent activity, and pain points",
    "Market News": "2-3 sentences summarizing relevant recent news"
  },
  "talk_track": [
    "Opening hook referencing a specific local market stat",
    "Value proposition tied to their market context",
    "Call to action with urgency driver"
  ],
  "email_subject": "Compelling subject line under 60 chars",
  "draft_email": "Professional 3-paragraph cold email..."
}
```

**Outputs produced:**
- `sales_insights` → displayed across the Market Data view cards
- `talk_track` → SDR Talk Track card (Key Info view)
- `email_subject` + `draft_email` → Draft Outreach Email card (Key Info view)

### 2. `generate_ai_summary()` — on-demand, triggered by SDR clicking "AI Summary"

A separate Gemini call that writes a personalized SDR fit assessment grounded in local market data.

**Prompt structure:**
```
You are a senior SDR at EliseAI...

Your analysis must be grounded in the specific market data for {city}, {state} — not just
the company's national reputation. If the company is large but this location's market data
is weak, say so plainly and reflect it in your prioritization recommendation.

LEAD DATA: company, market, score, rental units (local, not portfolio), population growth,
renter ratio, unemployment, 2BR FMR, company info, recent news, AI insights

Cover in order:
1. Brief note on the company's scale
2. Honest assessment of the local market using the data above
3. Whether this location is a strong or secondary outreach target
4. Clear prioritization recommendation

Return plain text only, no bullet points, no headers.
```

**Output:** AI SDR Assessment card (Key Info view), persisted to the database.

**Important:** The numeric lead score (0–100) is entirely rule-based. Gemini is used for text generation only — no AI involvement in scoring.

---

## Running Locally with Docker (Recommended)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone the repo

```bash
git clone <repo-url>
cd elise-gtm
```

### 2. Set up your environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys. See the [API Keys](#getting-api-keys) section below. The `DATABASE_URL` line can be left as-is — Docker sets it automatically.

Also set a JWT secret:
```bash
# Run this to generate a secure secret and paste it into .env
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Start everything

```bash
docker-compose up --build
```

This starts three containers:
- **PostgreSQL** on port `5432` — database, auto-creates tables on first run
- **Backend** on port `8000` — FastAPI server
- **Frontend** on port `5173` — React app served by nginx

### 4. Open the app

```
http://localhost:5173
```

Register an account and start adding leads.

### 5. Stopping

```bash
docker-compose down          # stop containers, keep database
docker-compose down -v       # stop containers + wipe database
```

---

## Running Locally Without Docker

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ running locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example .env       # fill in your API keys and DATABASE_URL
```

Create the database in PostgreSQL:
```sql
CREATE DATABASE eliseai;
```

Start the server (tables are created automatically on startup):
```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Getting API Keys

| Service | Free? | Link |
|---|---|---|
| Google Gemini | Yes (generous free tier) | https://aistudio.google.com/app/apikey |
| U.S. Census | Yes | https://api.census.gov/data/key_signup.html |
| FRED | Yes | https://fred.stlouisfed.org/docs/api/api_key.html |
| HUD | Yes | https://www.huduser.gov/portal/dataset/fmr-api.html |
| NewsAPI | Yes (100 req/day free) | https://newsapi.org/register |
| Tavily | Yes (small free tier) | https://app.tavily.com |
| Wikipedia | No key needed | — |
| OpenCorporates | No key needed | — |

---

## Project Structure

```
elise-gtm/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── database.py              # SQLAlchemy engine + session
│   ├── schemas.py               # Pydantic request/response models
│   ├── scoring.py               # Rule-based lead scoring logic
│   ├── models/
│   │   ├── lead.py              # Lead + LeadEnrichment ORM models
│   │   └── user.py              # User ORM model
│   ├── routers/
│   │   ├── auth.py              # Register, login, JWT auth dependency
│   │   └── leads.py            # All lead CRUD + enrichment endpoints
│   └── services/
│       ├── pipeline.py          # Orchestrates all enrichment services per lead
│       ├── gemini_service.py    # Gemini AI — insights, email, talk track, summary
│       ├── census_service.py    # U.S. Census ACS data
│       ├── fred_service.py      # FRED economic data
│       ├── hud_service.py       # HUD Fair Market Rents
│       ├── news_service.py      # NewsAPI headlines
│       ├── tavily_service.py    # Tavily web search + company summary
│       ├── walkscore_service.py # Walk Score via Tavily
│       └── opencorporates_service.py  # Company registration data
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Axios instance with JWT interceptor
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main lead list, pipeline trigger
│   │   │   ├── LeadDetail.jsx   # Enriched lead profile + AI outputs
│   │   │   ├── WorkingOn.jsx    # In-progress leads
│   │   │   ├── Completed.jsx    # Completed leads
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── components/
│   │       ├── Sidebar.jsx
│   │       ├── StatusBadge.jsx
│   │       ├── ScoreBadge.jsx
│   │       ├── AddLeadModal.jsx
│   │       ├── ConfirmModal.jsx
│   │       └── Toast.jsx
│   ├── Dockerfile
│   └── nginx.conf
├── backend/Dockerfile
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Lead Scoring Logic

Scores are calculated in `backend/scoring.py` using only rule-based logic — no AI.

| Category | Max | Source | Tiers |
|---|---|---|---|
| Rental Market Size | 30 | Census | 200k+ → 30, 100k+ → 22, 50k+ → 15, else → 5 |
| Population Growth (5yr) | 20 | Census | 10%+ → 20, 5%+ → 15, 0%+ → 8, declining → 0 |
| Economic Health | 20 | FRED | <4% unemployment → 20, 4–6% → 13, >6% → 5 |
| Renter Ratio | 15 | Census | 50%+ → 15, 40–50% → 10, <40% → 5 |
| Company Signals | 15 | Tavily + News + OpenCorporates | Signals found → 13, none → 5 |

**Priority tiers:** 80–100 = High · 60–79 = Medium · 0–59 = Low

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/leads` | List all leads |
| POST | `/leads` | Create a lead |
| GET | `/leads/{id}` | Get lead + enrichment detail |
| PATCH | `/leads/{id}/status` | Update SDR status |
| PATCH | `/leads/{id}/assign` | Assign lead to current SDR |
| PATCH | `/leads/{id}/email` | Save edited draft email |
| POST | `/leads/{id}/analyze` | Run enrichment on a single lead |
| POST | `/leads/{id}/ai-summary` | Generate on-demand AI SDR assessment |
| DELETE | `/leads/{id}` | Delete lead and all enrichment data |

Interactive API docs available at `http://localhost:8000/docs` when the backend is running.
