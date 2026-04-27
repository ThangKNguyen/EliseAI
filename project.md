ORIGINAL ASSIGNMENT

Assignment: Automating/Augmenting the
Inbound Lead Process with Public APIs
Context
At EliseAI, we want to accelerate how our sales team handles inbound leads. When a new lead
comes in, it usually has only basic info:
● Person (the contact): Name, Email Address, Company
● Building (the building they manage): Property Address, City, State, Country
An SDR then spends time manually researching, prioritizing, and drafting outreach. Your task is to
build a tool to automate/augment the top-of-funnel process using public (free) APIs.
Your Task
A) Build a tool that:
1. Takes lead inputs
2. Enriches the lead by calling at least two different publicly available APIs
3. Generates useful outputs for sales reps, such as:
○ Lead Scoring: feel free to make reasonable assumptions (document them) for
what you think may be good leads for EliseAI.
○ Draft Outreach Email: use enriched data to generate a personalized intro
message
○ Sales Insights: key data points a rep may want to know
4. Automates the process so it runs on:
○ A schedule (e.g., daily at 9am), OR
○ A trigger (e.g., a button or when a new row is added to the sheet).
B) Create a project plan for rolling this out in the sales org.
● How would you test and roll this out in a sales org?
● Think through:
○ Testing your MVP
○ Process to roll it out
○ Timelines
○ What stakeholders you would work with
Suggested Public Free APIs
(You may use others, but here are some to get you started):
● Demographics & Economics
○ U.S. Census API
○ DataUSA API
○ FRED Federal Reserve Economic Data
● Local Context
○ OpenWeather API
○ WalkScore API
● News & Events
○ NewsAPI – free tier
○ Wikipedia API
Deliverables
● A working tool with:
○ Input: lead list (name, email, company, city, state, property address).
○ Output: enriched + scored + outreach-ready leads.
● Your script/code.
● A 5–15 min video explaining:
○ Which public APIs you used and why
○ How your workflow enriches, scores, and outputs leads
○ Any assumptions made and logic behind them
○ How your scoring/outreach approach would help a sales rep
○ Explain your project plan and roll out process


DETAILED PLAN

EliseAI GTM Engineer Take-Home: Lead Enrichment Platform
Project Overview
An AI-powered inbound lead enrichment and prioritization platform for EliseAI's sales team. When a new lead comes in (property manager name, email, company, address), the platform automatically researches the lead using public APIs, scores them, generates sales insights, and drafts a personalized outreach email — so SDRs know exactly who to prioritize and what to say.

Tech Stack
Backend

Python with FastAPI
PostgreSQL for data persistence
SQLAlchemy as ORM
APScheduler for scheduled runs (future)
JWT for authentication (via python-jose + passlib)

Frontend

React (Vite)
Tailwind CSS
React Router for page navigation
Axios for API calls

AI & APIs

Gemini API (google-genai SDK) — insights, email drafting, talk track
Tavily API — web search for company info and market news
U.S. Census API — rental units, population, renter ratio
FRED API — unemployment rate, GDP, economic health
WalkScore API — walkability, transit, bike score of property
NewsAPI (free tier) — recent news articles about company and city rental market
Wikipedia API (no key required) — qualitative city overview: economy, demographics, housing narrative
HUD Fair Market Rents API (free, no key) — average 1BR/2BR/3BR rent prices by metro area
OpenCorporates API (free tier) — company incorporation date, status, type, jurisdiction


⚠️ Note: All API keys need to be set up manually in a .env file. See Environment Variables section below.


Features
Authentication

Any user can register with email + password
Login returns a JWT token stored in localStorage
Protected routes — must be logged in to access anything
Each SDR has their own account and their own "Working On" list

Main Dashboard (/dashboard)

Table of all leads with basic info:

Name, Company, City, State, Score, Status, Date Added


Status types:

pending — not yet processed
processed — enrichment complete
in_progress — SDR is actively working this lead
completed — SDR has finished with this lead


Filter by status (All / Pending / Processed / In Progress / Completed)
Sort by date added or lead score
"Add New Lead" button → opens popup form
"Run All Pending Leads" button → triggers enrichment pipeline for all pending leads, shows toast notification when done
Click any lead row → navigates to lead detail page

Add Lead Popup Form

Fields:

First Name, Last Name
Email
Company Name
Property Address, City, State


Submit → creates lead with pending status
Simple validation (required fields, valid email format)

Lead Detail Page (/leads/:id)

Shows all enriched output for that lead:

Score badge (0-100 with priority label)
Market Overview — rental units, population growth, renter ratio
Economic Health — unemployment, GDP growth, housing price trend
Property Context — walk score, transit score, bike score
Company Signals — what Tavily found about the company
Market News — recent news about the city's rental market
SDR Talk Track — 3 bullet points on best angle to take
Draft Outreach Email — editable text area, copy button


"Add to Working On" button → assigns lead to logged-in SDR, status → in_progress
Back button → returns to dashboard

Working On Page (/working-on)

Shows only leads assigned to the currently logged-in SDR with status in_progress
Same basic info as dashboard table
"Mark as Complete" button per lead → status → completed, removed from this page
Click lead → goes to detail page

Completed Page (/completed)

Shows all leads the logged-in SDR has marked as complete
Read-only view


Data Models
User
id          UUID (primary key)
email       String (unique)
password    String (hashed)
first_name  String
last_name   String
created_at  DateTime
Lead
id               UUID (primary key)
first_name       String
last_name        String
email            String
company          String
property_address String
city             String
state            String
status           Enum (pending, processed, in_progress, completed)
assigned_to      UUID (foreign key → User, nullable)
score            Integer (nullable until processed)
created_at       DateTime
updated_at       DateTime
LeadEnrichment
id                    UUID (primary key)
lead_id               UUID (foreign key → Lead)

-- Census Data
total_rental_units    Integer
population            Integer
population_growth_5yr Float
median_income         Integer
renter_ratio          Float

-- FRED Data
unemployment_rate     Float
gdp_growth_rate       Float
housing_price_trend   String

-- WalkScore Data
walk_score            Integer
transit_score         Integer
bike_score            Integer

-- Tavily Data
company_summary       Text
market_news           Text

-- NewsAPI Data
company_news_headlines  Text   ← JSON array of top 3 recent articles (title, source, date, url)
city_rental_news        Text   ← JSON array of top 3 recent rental market articles

-- Wikipedia Data
city_overview           Text   ← qualitative city/economy/housing narrative paragraph

-- HUD Data
fmr_one_br            Float  ← fair market rent for 1-bedroom unit in metro
fmr_two_br            Float  ← fair market rent for 2-bedroom unit in metro
fmr_three_br          Float  ← fair market rent for 3-bedroom unit in metro

-- OpenCorporates Data
company_status        String ← active / dissolved / unknown
company_incorporated  String ← incorporation date (year)
company_jurisdiction  String ← state/country of incorporation
company_type          String ← LLC, Corp, etc.

-- Gemini Generated
sales_insights        JSON
talk_track            Text
draft_email           Text

created_at            DateTime

API Endpoints
Auth
POST /auth/register     → create new user account
POST /auth/login        → returns JWT token
Leads
GET    /leads                  → get all leads (with filters + sorting)
POST   /leads                  → create new lead
GET    /leads/:id              → get single lead with enrichment data
PATCH  /leads/:id/status       → update lead status
PATCH  /leads/:id/assign       → assign lead to logged-in SDR
PATCH  /leads/:id/email        → update draft email (after SDR edits it)
POST   /leads/run-pipeline     → run enrichment on all pending leads

Enrichment Pipeline
When triggered (button click), for each pending lead:
1. Call Census API
   → total rental units in city
   → population + growth rate
   → median household income
   → renter vs owner ratio

2. Call FRED API
   → local unemployment rate
   → GDP growth
   → housing price index trend

3. Call WalkScore API
   → walk score for property address
   → transit score
   → bike score

4. Call Tavily
   → search "[Company Name] property management"
     → extract: portfolio size, recent news, hiring signals
   → search "[City] rental market 2024"
     → extract: demand trends, market conditions

4b. Call NewsAPI (free tier)
   → search "[Company Name] property management" (sort by publishedAt)
     → extract: top 3 headlines with source + date → company_news_headlines
   → search "[City] [State] rental housing market" (sort by publishedAt)
     → extract: top 3 headlines with source + date → city_rental_news
   → Scoring boost: if any company article < 30 days old → signals active/newsworthy company

4c. Call Wikipedia API (no key needed)
   → search city name → fetch intro section + Economy/Demographics sections if present
     → extract: city_overview paragraph
   → Adds qualitative narrative context Gemini uses to write more specific emails
   → Fallback gracefully if city has no Wikipedia page

4d. Call HUD Fair Market Rents API (no key needed)
   → lookup metro area by city/state → fetch FMR for 1BR, 2BR, 3BR
     → extract: fmr_one_br, fmr_two_br, fmr_three_br
   → Scoring input: high FMR metro = higher property revenue per unit = more valuable customer

4e. Call OpenCorporates API (free tier, best-effort)
   → search company name → fetch top result
     → extract: status, incorporation date, jurisdiction, company type
   → Gracefully skip if not found or rate-limited
   → Scoring input: dissolved company = disqualify; newer company = lower signals

5. Calculate Score (Python logic — not Gemini)
   → Rental market size    30% weight
   → Population growth     20% weight
   → Economic health       20% weight
   → Renter ratio          15% weight
   → Company signals       15% weight
   → Final score: 0-100

6. Call Gemini
   → Input: all raw data from steps 1-4 + score
   → Output:
     - Sales insights card (human readable sentences)
     - SDR talk track (3 bullet points)
     - Draft outreach email (personalized using real data)

7. Save everything to LeadEnrichment table
8. Update lead status → "processed"

Scoring Logic & Assumptions

These assumptions should be documented in the video presentation.

FactorWeightLogicRental market size30%>200k units = 30pts, 100-200k = 22pts, 50-100k = 15pts, <50k = 5ptsPopulation growth20%>10% = 20pts, 5-10% = 15pts, 0-5% = 8pts, negative = 0ptsEconomic health20%Unemployment <4% = 20pts, 4-6% = 13pts, >6% = 5ptsRenter ratio15%>50% renters = 15pts, 40-50% = 10pts, <40% = 5ptsCompany signals15%Large portfolio + growth signals = 15pts, medium = 10pts, small/unknown = 3pts. NewsAPI boost: +3 bonus pts (capped at 15) if company has a recent news article < 30 days old — signals an active, growing company worth contacting now. OpenCorporates: dissolved company → score capped at 20 (not worth pursuing).

Bonus modifiers (applied after base score):
HUD FMR: 2BR FMR >$2,000 → +5pts (premium market); <$900 → -5pts (low-value market)
OpenCorporates: company active + incorporated >5 years → +3pts (established operator)
Priority Labels:

80-100 → 🔴 High Priority
60-79 → 🟡 Medium Priority
0-59 → 🟢 Low Priority


Gemini Prompt Structure
System: You are a sales intelligence assistant for EliseAI, 
a company that sells AI agents to property management companies. 
Your job is to analyze market data and generate actionable 
sales insights for SDRs.

User: Here is enriched data for a lead:

Company: {company}
City: {city}, {state}
Lead Score: {score}/100

MARKET DATA:
- Total rental units: {rental_units}
- Population: {population} (grew {growth}% over 5 years)
- Renter ratio: {renter_ratio}%
- Unemployment: {unemployment}%
- GDP growth: {gdp_growth}%

COMPANY SIGNALS:
{tavily_company_summary}

RECENT COMPANY NEWS:
{company_news_headlines}

CITY OVERVIEW:
{city_overview}

MARKET NEWS (Tavily):
{tavily_market_news}

RECENT RENTAL MARKET NEWS:
{city_rental_news}

Generate:
1. A sales insights card with 5 sections 
   (Market Overview, Economic Health, Property Context, 
   Company Signals, Market News) — write in plain, 
   punchy sentences an SDR can quickly scan.
2. A 3-bullet SDR talk track — what angle should they lead with?
3. A personalized outreach email with subject line — 
   use specific data points, sound human, not salesy.

Return as JSON:
{
  "insights": { ... },
  "talk_track": [...],
  "email_subject": "...",
  "email_body": "..."
}

Project Structure
elise-gtm/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   │   ├── user.py
│   │   └── lead.py
│   ├── routers/
│   │   ├── auth.py
│   │   └── leads.py
│   ├── services/
│   │   ├── pipeline.py         ← main enrichment pipeline
│   │   ├── census_service.py
│   │   ├── fred_service.py
│   │   ├── walkscore_service.py
│   │   ├── tavily_service.py
│   │   ├── news_service.py        ← NewsAPI: company + city rental news headlines
│   │   ├── wikipedia_service.py   ← Wikipedia API: city overview narrative
│   │   ├── hud_service.py         ← HUD FMR API: fair market rents by metro
│   │   ├── opencorporates_service.py ← OpenCorporates: company registration data
│   │   └── gemini_service.py
│   ├── scoring.py              ← scoring logic
│   ├── schemas.py              ← Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LeadDetail.jsx
│   │   │   ├── WorkingOn.jsx
│   │   │   └── Completed.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── AddLeadModal.jsx
│   │   │   ├── LeadTable.jsx
│   │   │   ├── ScoreBadge.jsx
│   │   │   └── Toast.jsx
│   │   ├── api/
│   │   │   └── client.js       ← axios instance with JWT
│   │   └── App.jsx
│   └── package.json
├── .env
└── docker-compose.yml          ← postgres + backend + frontend

Environment Variables
Create a .env file in the root:
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/elise_gtm

# Auth
JWT_SECRET_KEY=your_secret_key_here

# APIs (set these up yourself)
CENSUS_API_KEY=
FRED_API_KEY=
WALKSCORE_API_KEY=
TAVILY_API_KEY=
GEMINI_API_KEY=
NEWS_API_KEY=           ← get free key at newsapi.org (100 req/day free tier)

# API URLs
CENSUS_BASE_URL=https://api.census.gov/data
FRED_BASE_URL=https://api.stlouisfed.org/fred
WALKSCORE_BASE_URL=https://api.walkscore.com/score

Build Order
Build in this exact order to avoid blockers:
Phase 1 — Backend Foundation (Day 1 Morning)
  1. Set up FastAPI project + PostgreSQL + SQLAlchemy
  2. Create data models (User, Lead, LeadEnrichment)
  3. Set up auth (register, login, JWT)
  4. Basic leads CRUD endpoints

Phase 2 — Enrichment Pipeline (Day 1 Afternoon)
  5. Census service
  6. FRED service
  7. WalkScore service
  8. Tavily service
  9. Scoring logic
  10. Gemini service
  11. Wire everything together in pipeline.py
  12. POST /leads/run-pipeline endpoint

Phase 3 — Frontend (Day 2 Morning)
  13. Vite + React + Tailwind setup
  14. Auth pages (Login, Register)
  15. Dashboard page + lead table + filters
  16. Add Lead modal
  17. Lead Detail page
  18. Working On page
  19. Completed page
  20. Toast notification for pipeline run

Phase 4 — Polish (Day 2 Afternoon)
  21. Connect all frontend pages to real backend
  22. Error handling
  23. Loading states
  24. Test full flow end to end
  25. Record video

Project Plan (Part B)
Testing the MVP

Internal testing first — run 5-10 real leads through the pipeline manually, verify scores make sense and emails sound human
Pilot with 2-3 SDRs — pick early adopters who are open to new tools
Collect feedback after 1 week — is the score accurate? Is the email useful? What's missing?
Iterate — fix issues before broader rollout

Rollout Process

Week 1-2 → Build + internal QA
Week 3 → Pilot with 2-3 SDRs, shadow their workflow
Week 4 → Gather feedback, fix issues, refine scoring logic
Week 5-6 → Full rollout to entire sales team + training session
Week 7+ → Monitor adoption, track ROI (time saved per lead, conversion rate of high-score leads)

Stakeholders

SDRs → primary users, most important feedback source
Sales Manager → approves rollout, defines what "good lead" means
RevOps → owns CRM integration, data hygiene
CEO → EliseAI mentioned CEO collaboration in JD, keep them looped on impact metrics

Success Metrics

Time saved per lead (baseline: 30 mins manual research → target: <1 min)
SDR adoption rate (target: 80%+ using it daily within 4 weeks)
Conversion rate of high-score leads vs low-score leads
SDR feedback score (monthly survey)


Future Enhancements (Note in Video)

Batch lead upload via CSV
Google Sheets trigger via Zapier — new row → auto-run pipeline
CRM integration — push enriched leads directly to Salesforce/HubSpot
Scheduled runs via APScheduler — process all pending leads every morning at 9am
Multiple leads submission at once via form
Email tracking — did the SDR send the draft email? Did the prospect reply?