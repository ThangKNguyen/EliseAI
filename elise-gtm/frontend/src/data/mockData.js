export const mockUser = {
  id: 'user-1',
  first_name: 'Sarah',
  last_name: 'Chen',
  email: 'sarah@eliseai.com',
};

export const mockLeads = [
  {
    id: 'lead-1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@acmerealty.com',
    company: 'Acme Realty Group',
    property_address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    status: 'processed',
    assigned_to: null,
    score: 90,
    created_at: '2026-04-25T10:00:00Z',
    updated_at: '2026-04-25T11:00:00Z',
  },
  {
    id: 'lead-2',
    first_name: 'Maria',
    last_name: 'Rodriguez',
    email: 'maria@sunbeltprops.com',
    company: 'Sunbelt Properties',
    property_address: '450 Desert Sky Blvd',
    city: 'Phoenix',
    state: 'AZ',
    status: 'in_progress',
    assigned_to: 'user-1',
    score: 84,
    created_at: '2026-04-24T09:00:00Z',
    updated_at: '2026-04-24T14:00:00Z',
  },
  {
    id: 'lead-3',
    first_name: 'David',
    last_name: 'Park',
    email: 'dpark@metroliving.com',
    company: 'Metro Living LLC',
    property_address: '88 Cherry Creek Dr',
    city: 'Denver',
    state: 'CO',
    status: 'processed',
    assigned_to: null,
    score: 76,
    created_at: '2026-04-24T08:00:00Z',
    updated_at: '2026-04-24T09:30:00Z',
  },
  {
    id: 'lead-4',
    first_name: 'Lisa',
    last_name: 'Thompson',
    email: 'lisa@coastalpm.com',
    company: 'Coastal Property Mgmt',
    property_address: '900 Bayshore Dr',
    city: 'Tampa',
    state: 'FL',
    status: 'in_progress',
    assigned_to: 'user-1',
    score: 71,
    created_at: '2026-04-23T11:00:00Z',
    updated_at: '2026-04-23T15:00:00Z',
  },
  {
    id: 'lead-5',
    first_name: 'Kevin',
    last_name: 'Wu',
    email: 'kwu@harborview.com',
    company: 'Harbor View Realty',
    property_address: '200 Pike St',
    city: 'Seattle',
    state: 'WA',
    status: 'processed',
    assigned_to: null,
    score: 68,
    created_at: '2026-04-22T14:00:00Z',
    updated_at: '2026-04-22T16:00:00Z',
  },
  {
    id: 'lead-6',
    first_name: 'Emily',
    last_name: 'Chen',
    email: 'emily@pacificcoastpm.com',
    company: 'Pacific Coast PM',
    property_address: '500 Market St',
    city: 'San Francisco',
    state: 'CA',
    status: 'in_progress',
    assigned_to: 'user-1',
    score: 88,
    created_at: '2026-04-22T08:00:00Z',
    updated_at: '2026-04-22T10:00:00Z',
  },
  {
    id: 'lead-7',
    first_name: 'Amy',
    last_name: 'Johnson',
    email: 'ajohnson@greenvalley.com',
    company: 'Green Valley Homes',
    property_address: '1200 Overland Ave',
    city: 'Boise',
    state: 'ID',
    status: 'pending',
    assigned_to: null,
    score: null,
    created_at: '2026-04-22T07:00:00Z',
    updated_at: '2026-04-22T07:00:00Z',
  },
  {
    id: 'lead-8',
    first_name: 'Robert',
    last_name: 'Kim',
    email: 'rkim@pinnacleprops.com',
    company: 'Pinnacle Properties',
    property_address: '300 Broadway Ave',
    city: 'Nashville',
    state: 'TN',
    status: 'pending',
    assigned_to: null,
    score: null,
    created_at: '2026-04-21T16:00:00Z',
    updated_at: '2026-04-21T16:00:00Z',
  },
  {
    id: 'lead-9',
    first_name: 'Sandra',
    last_name: 'Lee',
    email: 'slee@riverbend.com',
    company: 'Riverbend Management',
    property_address: '45 Broad St',
    city: 'Columbus',
    state: 'OH',
    status: 'completed',
    assigned_to: 'user-1',
    score: 42,
    created_at: '2026-04-20T09:00:00Z',
    updated_at: '2026-04-21T11:00:00Z',
  },
];

export const mockEnrichment = {
  'lead-1': {
    // Census
    total_rental_units: 180000,
    population: 978908,
    population_growth_5yr: 12.4,
    median_income: 75200,
    renter_ratio: 0.52,
    // FRED
    unemployment_rate: 3.1,
    gdp_growth_rate: 2.8,
    housing_price_trend: '+8% YoY',
    // WalkScore
    walk_score: 72,
    transit_score: 48,
    bike_score: 61,
    // Tavily
    company_summary: 'Acme Realty Group manages approximately 3,200 units across the Austin metro area. The company recently expanded its portfolio by 400 units in Q1 2026 and is currently hiring 3 leasing consultants to handle increased demand.',
    market_news: 'Austin rental demand is surging with occupancy rates above 95%.',
    // NewsAPI
    company_news_headlines: JSON.stringify([
      { title: 'Acme Realty Expands Austin Portfolio by 400 Units in Q1', source: 'Austin Business Journal', publishedAt: '2026-04-10' },
      { title: 'Top Austin Property Managers Ramp Up Hiring Amid Leasing Surge', source: 'Real Estate Weekly', publishedAt: '2026-04-05' },
    ]),
    city_rental_news: JSON.stringify([
      { title: 'Austin rental demand surges 15% YoY as tech relocation wave continues into 2026', source: 'Austin American-Statesman', publishedAt: '2026-04-20' },
      { title: 'Texas apartment operators report record leasing volume with staffing shortages emerging', source: 'Multifamily Executive', publishedAt: '2026-04-15' },
      { title: 'New apartment supply in Austin still lagging demand — occupancy rates hold above 95%', source: 'Austin Business Journal', publishedAt: '2026-04-12' },
    ]),
    // Wikipedia
    city_overview: 'Austin is the capital of Texas and a fast-growing tech hub. Its economy is driven by technology, government, education, and tourism. The city has seen explosive population growth over the past decade, attracting major employers including Apple, Tesla, and Google.',
    // HUD
    fmr_one_br: 1620,
    fmr_two_br: 2080,
    fmr_three_br: 2750,
    // OpenCorporates
    company_status: 'active',
    company_incorporated: '2011-03-14',
    company_jurisdiction: 'TX',
    company_type: 'LLC',
    // Gemini
    sales_insights: JSON.stringify({
      market_overview: 'Austin has 180,000 rental units with 52% renter ratio — a large, renter-dominated market. Population grew 12.4% over 5 years, fueling demand.',
      economic_health: 'Unemployment at 3.1% signals a healthy, high-employment economy. GDP growth at 2.8% and housing prices rising 8% YoY.',
      property_context: 'Walk score 72, transit 48, bike 61. Well-connected urban property with solid amenity access.',
      company_signals: 'Acme Realty manages ~3,200 units and is actively expanding. Currently hiring leasing staff — a clear sign of manual workload strain.',
      market_news: 'Rental demand up 15% YoY in Austin. Occupancy above 95%. Staffing shortages emerging as top pain point for operators.',
    }),
    talk_track: JSON.stringify([
      "Lead with their recent expansion — they added 400 units and are clearly in growth mode, which means operational strain is imminent.",
      "They're actively hiring leasing staff — frame EliseAI as the smarter alternative to over-hiring headcount they'll struggle to manage.",
      "Austin rental demand is up 15% YoY — use this to show urgency. They need to handle more volume without proportionally more cost.",
    ]),
    email_subject: 'Automating leasing at Acme Realty as you scale in Austin',
    draft_email: `Hi John,

I noticed Acme Realty recently expanded your Austin portfolio by 400 units — congratulations on the growth.

With 3,200+ units in one of the hottest rental markets in the country, I imagine your leasing team is handling an enormous volume of inquiries, tour requests, and maintenance tickets every single day. The fact that you're actively hiring leasing consultants tells me the manual workload is real.

That's exactly the problem EliseAI solves. We automate the entire resident journey — from the first leasing inquiry all the way through renewals — so your team can focus on higher-value work instead of answering the same questions repeatedly.

We already work with 75% of the top 50 property managers in the country. Worth a 15-minute call this week?

Best,
Sarah Chen
EliseAI`,
  },
  'lead-2': {
    total_rental_units: 210000,
    population: 1608139,
    population_growth_5yr: 9.2,
    median_income: 62400,
    renter_ratio: 0.48,
    unemployment_rate: 3.8,
    gdp_growth_rate: 2.4,
    housing_price_trend: '+6% YoY',
    walk_score: 45,
    transit_score: 38,
    bike_score: 52,
    company_summary: 'Sunbelt Properties is a Phoenix-based property management firm overseeing 1,800 residential units across the metro. Known for rapid acquisitions in the Sun Belt expansion wave.',
    market_news: 'Phoenix remains a top-10 market for multifamily investment.',
    company_news_headlines: JSON.stringify([
      { title: 'Sunbelt Properties Acquires 3 Communities in Chandler', source: 'Phoenix Business Journal', publishedAt: '2026-04-18' },
    ]),
    city_rental_news: JSON.stringify([
      { title: 'Phoenix multifamily market stays hot with strong in-migration', source: 'AZ Central', publishedAt: '2026-04-14' },
      { title: 'Sun Belt rental demand shows no signs of cooling in Q1 2026', source: 'Multifamily Dive', publishedAt: '2026-04-08' },
    ]),
    city_overview: 'Phoenix is the capital of Arizona and the fifth-largest city in the United States. Its economy is anchored by real estate, finance, healthcare, and technology.',
    fmr_one_br: 1380,
    fmr_two_br: 1720,
    fmr_three_br: 2290,
    company_status: 'active',
    company_incorporated: '2015-07-22',
    company_jurisdiction: 'AZ',
    company_type: 'LLC',
    sales_insights: JSON.stringify({
      market_overview: 'Phoenix has 210,000 rental units — the largest market in the Southwest. Population growing at 9.2%, one of the fastest in the nation.',
      economic_health: 'Unemployment at 3.8%, slightly elevated but stable. Housing prices rising 6% YoY.',
      property_context: 'Walk score 45 — car-dependent market. Typical for Sun Belt suburban properties.',
      company_signals: 'Sunbelt recently acquired 3 communities in Chandler. Active acquirer in growth mode.',
      market_news: 'Phoenix remains a top-10 multifamily investment market with strong in-migration.',
    }),
    talk_track: JSON.stringify([
      "Lead with their recent acquisitions — new communities mean new operational complexity they need to manage.",
      "Phoenix is a car-dependent market — leasing teams handle high call volume from prospects who want answers fast.",
      "Sun Belt in-migration is driving occupancy. More leads, more inquiries, more strain on leasing staff.",
    ]),
    email_subject: 'Managing growth at Sunbelt as you expand in Phoenix',
    draft_email: `Hi Maria,

Congrats on the Chandler acquisitions — adding new communities is exciting but the operational lift is real.

With 1,800+ units across Phoenix and more coming online, your team is likely fielding hundreds of leasing inquiries per week. EliseAI automates that entire conversation — from first contact to signed lease — so your staff handles exceptions, not repetition.

Worth a quick 15-minute call to show you how we do it?

Best,
Sarah Chen
EliseAI`,
  },
};
