No key needed (free, open):
  - HUD Fair Market Rents — public government API
  - OpenCorporates — basic tier, no key required
  - Wikipedia — no key required

GEMINI
  How Gemini Works (in this project)                                                                                                                                                                                             
                                                                                                                                                                                                                                 
  The SDK
                                                                                                                                                                                                                                 
  This project uses google-genai (the newer unified SDK, not the older google-generativeai).

  from google import genai
  from google.genai import types

  client = genai.Client()  # reads GEMINI_API_KEY from env automatically

  Making a Request

  response = client.models.generate_content(
      model="gemini-2.5-flash-lite",          # model ID
      config=types.GenerateContentConfig(
          system_instruction="You are a ...", # sets model persona/role
      ),
      contents=prompt,                         # the actual user prompt (str)
  )
  raw_text = response.text  # the model's reply as a plain string

  System Instruction vs. Prompt

  ┌────────────────────┬────────────────────────────────────────────────────────────────────┐
  │       Field        │                              Purpose                               │
  ├────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ system_instruction │ Sets the model's role/persona. Persistent across the conversation. │
  ├────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ contents           │ The actual task/question.                                          │
  └────────────────────┴────────────────────────────────────────────────────────────────────┘

  In this project: system instruction = "senior SOC analyst", contents = the full prompt with log data injected.

  Structured Output (the problem)

  Gemini doesn't natively return a dict — it returns a string. You have to ask it to return JSON in your prompt and then parse it yourself:

  # In prompt: "Return ONLY a JSON object (no markdown, no explanation)"
  result = json.loads(response.text)

  Gemini sometimes ignores the "no markdown" instruction and wraps the JSON in backtick code fences anyway — that's why ai_analysis.py:117 has the fence-stripping logic.

  Model Options

  ┌───────────────────────┬─────────┬───────────┬───────────────────────────────────────────────┐
  │         Model         │  Speed  │   Cost    │                    Use for                    │
  ├───────────────────────┼─────────┼───────────┼───────────────────────────────────────────────┤
  │ gemini-2.5-flash-lite │ Fastest │ Cheapest  │ This project (low latency, structured output) │
  ├───────────────────────┼─────────┼───────────┼───────────────────────────────────────────────┤
  │ gemini-2.5-flash      │ Fast    │ Mid       │ Longer reasoning tasks                        │
  ├───────────────────────┼─────────┼───────────┼───────────────────────────────────────────────┤
  │ gemini-2.5-pro        │ Slower  │ Expensive │ Complex analysis, large context               │
  └───────────────────────┴─────────┴───────────┴───────────────────────────────────────────────┘

  Auth

  Set GEMINI_API_KEY in your .env. The client picks it up automatically — no manual header setup needed.

TAVILY
# To install: pip install tavily-python
from tavily import TavilyClient
client = TavilyClient("tvly-dev-********************************") #api key here
response = client.search(
    query="What are the best practices for implementing RAG in production?",
    include_answer="basic", //enable this if we want LLM summarize, delete this line if no llm needed, basic for a short answer, advanced for a detailed answer
    search_depth="advanced"
)
print(response)

CENSUS API
Census API – Core Overview

Purpose:
The U.S. Census Data API provides access to public statistical data about locations (city, state, county, etc.), including demographics, economics, and population data.

Key Idea:
You query data by specifying:
- dataset
- variables (fields you want)
- geography (location)

-----------------------------------

API Structure:

Base URL:
https://api.census.gov/data/{year}/{dataset}

Query format:
?get={variables}&for={geography}&in={higher_geography}

Example:
https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E&for=place:*&in=state:06

-----------------------------------

Core Concepts:

1. Datasets
Different datasets contain different types of data.

Common useful ones:
- acs/acs5 → American Community Survey (demographics, income, housing)
- acs/acs1 → same but more recent, less coverage
- pep → population estimates

-----------------------------------

2. Variables
Variables are the fields you request.

Examples:
- NAME → location name
- B01003_001E → total population
- DP03_0062E → median household income

Notes:
- Variables are coded (not human-readable)
- You must look them up in the dataset’s variables endpoint
- You can request up to 50 variables per query :contentReference[oaicite:0]{index=0}

-----------------------------------

3. Geography (IMPORTANT)

Controlled using:
- &for= → target level
- &in= → parent level

Examples:
- &for=state:* → all states
- &for=place:*&in=state:06 → all cities in California
- &for=county:*&in=state:06 → all counties in California

Supports:
- state
- county
- place (city)
- tract, zip, etc.

-----------------------------------

4. Predicates (filters)

Used to filter results.

Examples:
- &for=state:06 → only California
- &for=state:* → all states (wildcard *)

Rules:
- predicates start with &
- wildcard (*) works for geography and strings :contentReference[oaicite:1]{index=1}

-----------------------------------

5. Output Format

Default:
- JSON (2D array format)

Example:
[
  ["NAME","B01003_001E"],
  ["San Francisco city, California","808000"]
]

Optional:
- CSV using &outputFormat=csv :contentReference[oaicite:2]{index=2}

-----------------------------------

6. Variable Types

In ACS datasets:

- E → estimate (actual value)
- M → margin of error
- PE → percentage estimate
- PM → percentage margin of error :contentReference[oaicite:3]{index=3}

-----------------------------------

7. Limits

- Up to 50 variables per request
- ~500 requests/day per IP without API key :contentReference[oaicite:4]{index=4}
- API key is free if needed

-----------------------------------

What Data You Can Query (Relevant Types):

From ACS and related datasets:

Demographics:
- population
- age distribution
- race/ethnicity

Economics:
- median household income
- employment data
- poverty rates

Housing:
- occupancy
- housing units
- rent-related stats

Geographic context:
- city, state, county level stats
- urban vs rural breakdowns

-----------------------------------

Summary:

The Census API is a REST API that:
- returns structured demographic/economic data
- is queried by dataset + variables + geography
- outputs JSON
- is used to enrich location-based data with population and economic context

FRED


The Economic Research Division of the Federal Reserve Bank of St. Louis has enhanced the economic data services it provides by constructing an API (application programming interface), which allows users to create programs that retrieve data from our servers connected to the Internet.

With our FRED® API, users may query our Federal Reserve Economic Data (FRED®) and Archival Federal Reserve Economic Data (ALFRED®) databases to retrieve the specific data desired (according to source, release, category and series among other preferences).

Our API accommodates any programming language that can parse XML or JSON and communicate with our servers using HTTPS. The FRED® API is based on the REST web service architecture. REST leverages familiar web technologies. Like a website, the FRED® API uses HTTPS to receive requests and send responses. Also like a website, the FRED® API uses URLs to specify requests. This web service differs from a normal website by sending XML or JSON instead of HTML. HTML is a visual medium that's not always strictly formatted and flexible enough for arbitrary data structures.

FRED® stands for Federal Reserve Economic Data. FRED® contains frequently updated US macro and regional economic time series at annual, quarterly, monthly, weekly, and daily frequencies. FRED® aggregates economic data from a variety of sources- most of which are US government agencies. The economic time series in FRED® contain observation or measurement periods associated with data values. For instance, the US unemployment rate for the month of January, 1990 was 5.4 percent and for the month of January, 2000 was 4.0 percent.

Below is an example HTTP GET request:

https://api.stlouisfed.org/fred/series/search?api_key=abcdefghijklmnopqrstuvwxyz123456&search_text=canada

Note that API key 'abcdefghijklmnopqrstuvwxyz123456' is for demonstration purposes only. Use one of your registered API keys instead.

Categories
fred/category - Get a category.
fred/category/children - Get the child categories for a specified parent category.
fred/category/related - Get the related categories for a category.
fred/category/series - Get the series in a category.
fred/category/tags - Get the tags for a category.
fred/category/related_tags - Get the related tags for a category.
Releases
fred/releases - Get all releases of economic data
fred/releases/dates - Get release dates for all releases of economic data.
fred/release - Get a release of economic data.
fred/release/dates - Get release dates for a release of economic data.
fred/release/series - Get the series on a release of economic data.
fred/release/sources - Get the sources for a release of economic data.
fred/release/tags - Get the tags for a release.
fred/release/related_tags - Get the related tags for a release.
fred/release/tables - Get the release tables for a given release.
Series
fred/series - Get an economic data series.
fred/series/categories - Get the categories for an economic data series.
fred/series/observations - Get the observations or data values for an economic data series.
fred/series/release - Get the release for an economic data series.
fred/series/search - Get economic data series that match keywords.
fred/series/search/tags - Get the tags for a series search.
fred/series/search/related_tags - Get the related tags for a series search.
fred/series/tags - Get the tags for an economic data series.
fred/series/updates - Get economic data series sorted by when observations were updated on the FRED® server.
fred/series/vintagedates - Get the dates in history when a series' data values were revised or new data values were released.
Sources
fred/sources - Get all sources of economic data.
fred/source - Get a source of economic data.
fred/source/releases - Get the releases for a source.
Tags
fred/tags - Get all tags, search for tags, or get tags by name.
fred/related_tags - Get the related tags for one or more tags.
fred/tags/series - Get the series matching tags.
Maps API
The FRED® Maps API is a web service that allows developers to write programs and build applications to harvest data and shape files of series available on the maps found in the FRED website. Not all series that are in FRED have geographical data.

Shape Files
Series Group Meta
Series Regional Data
Regional Data


NOTE:
The Walkscore api doesnt work so I'll use tavily for the walkscore, the query is usually just the city name, state, and walk score. But it does need to have the include_answer="basic", enabled for llm summary. Also the content might be a bit different everytime cuz its llm

Examples
{
  "query": "Santa Cruz, CA walk score",
  "follow_up_questions": null,
  "answer": "Santa Cruz, CA has an average Walk Score of 63, indicating it is somewhat walkable with many amenities nearby. Downtown Santa Cruz has a Walk Score of 73, making it very walkable. The city offers some public transportation and is very bikeable.",
  "images": [],
  "results": [
    {
      "url": "https://www.walkscore.com/score/loc/lat=36.9739/lng=-122.0071/?utm_source=zillow2.com&utm_medium=ws_api&utm_campaign=ws_api",
      "title": "Santa Cruz CA - Walk Score",
      "content": "0.1 mi\n\n1 Soquel/Cabrillo/Airport\n\n0.5 mi\n\n## City of Santa Cruz\n\nThis location is in the city of Santa Cruz, CA. Santa Cruz has an average Walk Score of 63 and has 59,946 residents.\n\n##### Walk Score\n\n##### Professional\n\nIf you are using a screen reader or having trouble reading this website, please call Walk Score customer service at (253) 256-1634.\n\n© 2026 Walk Score [...] ### What's Nearby\n\nSomething missing? Add a place\n\nmap of restaurants, bars, coffee shops, grocery stores, and more near in Santa Cruz\n\n## About this Location\n\nThis location has a Walk Score of 73 out of 100. This location is Very Walkable so most errands can be accomplished on foot.\n\nThis location is in Santa Cruz. Nearby parks include Star Of The Sea Park, Frederick Street Park and Ocean View Park.\n\n## Travel Time Map\n\nAdd to your site\n\nExplore how far you can travel by car, bus, bike and foot from this location.\n\nAdd to your site\n\n38 Transit Score of this location\n\n## Some Transit\n\nThis location has some transit which means a few nearby public transportation options.\n\nBus lines:\n\n3A UCSC/Capitola Mall/Live Oak\n\n0.1 mi\n\n3B UCSC/Capitola Mall/Live Oak\n\n0.1 mi\n\n1 Soquel/Cabrillo/Airport [...] Walk Score Logo\nLogin default user image\nLogin default user image\n\nFavorites\n\nProfile\n\nLog out\n\nLog in to save favorites.\n\nFavorite\n\n# Very Walkable\n\nSanta Cruz, California, 95062\n\nAdd scores to your site\n\nCommute to  Downtown Twin Lakes\n\n2 min    9 min    4 min    20 min  View Routes\n\n73 Walk Score of this location\n\n##### Very Walkable\n\nMost errands can be accomplished on foot.\n\n38 Transit Score of this location\n\n##### Some Transit\n\nA few nearby public transportation options.\n\n99 Bike Score of this location\n\n##### Biker’s Paradise\n\nDaily errands can be accomplished on a bike.\n\nAdd scores to your site\n\nmap of restaurants, bars, coffee shops, grocery stores, and more near in Santa Cruz\n\n### What's Nearby\n\nSomething missing? Add a place",
      "score": 0.9293445,
      "raw_content": null,
      "favicon": null
    },
    {
      "url": "https://www.walkscore.com/CA/Santa_Cruz",
      "title": "Santa Cruz Apartments for Rent and Santa Cruz Rentals - Walk Score",
      "content": "+ Search\n  + Find Apartments\n  + My Favorites\n\nGet Scores My Favorites Add to Your Site\n\nLog in to save favorites.\n\n## Living in Santa Cruz\n\n# Santa Cruz Apartments for Rent\n\nSanta Cruz has an average Walk Score of 63 with 59,946 residents.\n\nSanta Cruz has some public transportation and is very bikeable.\n\nNearby Santa Cruz Apartments on Redfin\n\nView Santa Cruz apartments for rent  |   View Santa Cruz homes for sale\n\n## Santa Cruz is Somewhat Walkable\n\nSome errands can be accomplished on foot.\n\n### Walk Score Map\n\n25\n\n100\n\nUnited States California Santa Cruz\n\nSanta Cruz has an average Walk Score of 63 with 59,946 residents.\n\nSanta Cruz has some public transportation and is very bikeable.\n\n## Santa Cruz Apartments for Rent\n\n## Santa Cruz Apartments for Rent## Santa Cruz Homes for Sale [...] ##### Nearby Cities\n\n Capitola Apartments\n Monte Sereno Apartments\n Scotts Valley Apartments\n Cambrian Park Apartments\n Aptos Hills-Larkin Valley Apartments\n Boulder Creek Apartments\n Corralitos Apartments\n Aptos Apartments\n Day Valley Apartments\n Freedom Apartments\n\n## Santa Cruz Neighborhoods\n\n| Rank  # | Name | Walk Score | Transit Score | Bike Score | Population |\n ---  ---  --- |\n| 1 | 95064 | 27  - | 7,061 |\n\n## Eating & Drinking\n\nThere are about 247 restaurants, bars and coffee shops in Santa Cruz.\n\nPeople in Santa Cruz can walk to an average of 1 restaurants, bars and coffee shops in 5 minutes.\n\n### Restaurant Choices Map\n\n= More Choices\n\n## Santa Cruz has Some Transit\n\nA few nearby public transportation options.  Find Santa Cruz apartments for rent on Redfin. [...] Banana Belt, Santa Cruz Real Estate\n Beach Hill Historic District, Santa Cruz Real Estate\n Branciforte Drive, Santa Cruz Real Estate\n Carbonera, Santa Cruz Real Estate\n Central Santa Cruz, Santa Cruz Real Estate\n Downtown Santa Cruz, Santa Cruz Real Estate\n Harvey West, Santa Cruz Real Estate\n Lower Seabright, Santa Cruz Real Estate\n Mission Hill, Santa Cruz Real Estate\n Natural Bridges, Santa Cruz Real Estate\n\n Prospect Heights, Santa Cruz Real Estate\n San Lorenzo, Santa Cruz Real Estate\n Santa Cruz Beach Boardwalk, Santa Cruz Real Estate\n Seabright, Santa Cruz Real Estate\n South Felton, Santa Cruz Real Estate\n Spring Street, Santa Cruz Real Estate\n Ucsc, Santa Cruz Real Estate\n Upper Ocean, Santa Cruz Real Estate\n Westlake, Santa Cruz Real Estate\n Westside, Santa Cruz Real Estate",
      "score": 0.9037116,
      "raw_content": null,
      "favicon": null
    },


{
  "query": "San Jose, CA walk score",
  "follow_up_questions": null,
  "answer": "San Jose, CA has an average Walk Score of 51 out of 100, indicating it is somewhat walkable. Specific areas like 95112 and 95126 have Walk Scores of 83 and 84, respectively, marking them as very walkable.",
  "images": [],
  "results": [
    {
      "url": "https://sjtoday.6amcity.com/san-jose-ca-walkability",
      "title": "San Jose’s walkability score - SJtoday",
      "content": "SJ Logo\n\n# San Jose’s walkability score\n\nView from a parking deck at the corner of East Santa Clara Street and Notre Dame Avenue in Downtown San Jose, California in the San Francisco Bay Area, looking down E Santa Clara St. Cars and a Santa Clara Valley Transit Authority (VTA) city bus are seen on the street below. Palm trees and other trees line the street.\n\nWould you stroll down Santa Clara Street? | Photo via Wikimedia Commons\n\nWill Buckner\n\n51. That’s what San Jose scored out of 100 on Walk Score’s walkability meter, making it a “somewhat walkable” city. Given how large San Jose is, this was actually a pleasant surprise to us.\n\nA walk score is a numeric ranking that represents the walkability of an address based on pedestrian-friendliness and access to businesses.\n\nWalking Score [...] Walking Score\n\nWalk Score’s scale of walkability | Screenshot via Walk Score\n\nPoints are given based on the distance between residential areas and businesses, including restaurants, retail, and entertainment. Anything outside a 30+ minute walk is given 0 points. A city’s walkability score is found by calculating the average walkability of many residential addresses in a city.\n\nTrading in the walking shoes for wheels? We rank slightly higher for our bicyclists with an overall score of 62. This number has likely gone up in recent years, thanks to big strides in bike infrastructure, like protected bike lanes. [...] While these numbers aren’t the best, we may soon see some improvements. San Jose is already taking steps towards becoming more pedestrian and commuter-friendly through the city’s new Downtown Transportation Plan, which promises more paseos, bike trails, and a more people-centered downtown. (Psst… The city is still accepting public feedback on their new plans, so let them know what improvements you’d like to see.)\n\nIn the meantime, here are San Jose’s top five most walkable + bikeable neighborhoods:\n\nSJ Logo\n\n© 6AM City Inc. 2026. All rights reserved.",
      "score": 0.9999125,
      "raw_content": null
    },
    {
      "url": "https://www.walkscore.com/CA/San_Jose",
      "title": "San Jose - Apartments for Rent - Walk Score",
      "content": "Walk Score Logo\nLogin default user image\nLogin default user image\n\nFavorites\n\nProfile\n\nLog out\n\nLog in to save favorites.\n\n## Living in San Jose\n\n# San Jose Apartments for Rent\n\nmap of San Jose apartments for rent\n51 Walk Score of San Jose, CA\n40 Transit Score of San Jose, CA\n62 Bike Score of San Jose, CA\n\nAt the South end of the CalTrain line, with easy access to Silicon Valley, there’s San Jose, a university town that’s home to tech start ups, a great art scene, and many a righteous burrito. San Jose has a light rail serving downtown and the outlying neighborhoods, plenty of bike routes, and great California weather. [...] | 210 | Little Branham-Rosswood | 39 | 31 | 50 | 1,641 |\n| 211 | Dove Hill | 38 | 36 | 46 | 3,775 |\n| 212 | Piedmont Hills | 38 | 39 | 46 | 1,226 |\n| 213 | Meadows | 38 | 44 | 53 | 3,971 |\n| 214 | Shadow Brook | 38 | 23 | 64 | 2,157 |\n| 215 | Rodgers | 38 | 40 | 59 | 1,108 |\n| 216 | Gilchrist | 38 | 45 | 69 | 1,585 |\n| 217 | Walnut Blossom | 38 | 38 | 50 | 1,527 |\n| 218 | Cimarron | 38 | 38 | 66 | 1,233 |\n| 219 | Calabazas Sorth | 37 | 25 | 66 | 1,026 |\n| 220 | Windmill Springs | 37 | 39 | 50 | 1,943 |\n| 221 | Carlton | 37 | 34 | 49 | 2,238 |\n| 222 | Oak Grove | 37 | 42 | 47 | 3,423 |\n| 223 | Yerba Buena | 37 | 40 | 52 | 1,572 |\n| 224 | Rancho Santa Teresa | 37 | 42 | 47 | 5,990 |\n| 225 | Glenview Serenity | 37 | 23 | 48 | 1,645 |\n| 226 | Yum Yum | 37 | 33 | 55 | 2,696 | [...] | 259 | Knights Bridge | 25 | 37 | 47 | 2,513 |\n| 260 | Glen Crest | 25 | 17 | 27 | 1,167 |\n| 261 | Oak Canyon | 25 | 24 | 42 | 734 |\n| 262 | Ramblewood | 25 | 38 | 51 | 3,853 |\n| 263 | Norwood | 25 | 23 | 37 | 3,415 |\n| 264 | Montevideo | 24 | 16 | 34 | 1,056 |\n| 265 | Pierce Ranch | 24 | 24 | 32 | 1,604 |\n| 266 | Creekside | 23 | 27 | 52 | 2,263 |\n| 267 | Coldwater | 23 | 28 | 58 | 1,923 |\n| 268 | Buena Park | 23 | 29 | 46 | 797 |\n| 269 | Pinnacle | 23 | 33 | 44 | 636 |\n| 270 | Danna Rocks | 22 | 48 | 43 | 2,105 |\n| 271 | Candlestick | 21 | 23 | 16 | 1,473 |\n| 272 | Gateview | 21 | 45 | 61 | 1,164 |\n| 273 | Silver Leaf | 20 | 34 | 56 | 3,247 |\n| 274 | Clayton South | 20 | 16 | 33 | 1,036 |\n| 275 | Notting Hill-Royal Crest | 19 | 53 | 53 | 1,723 |",
      "score": 0.99950826,
      "raw_content": null,
      "favicon": null
    },

    {
  "query": "Chicago, IL walkscore",
  "follow_up_questions": null,
  "answer": "Chicago, IL has a Walk Score of 77, ranking it as the fourth most walkable large city in the U.S. The Loop and River North are among its most walkable neighborhoods. Lincoln Park has the highest Walk Score at 94.",
  "images": [],
  "results": [
    {
      "url": "https://www.hotspotrentals.com/the-5-best-walkable-neighborhoods-in-chicago/",
      "title": "The 5 Best Walkable Neighborhoods in Chicago - Hotspot Rentals",
      "content": "It may be little surprise to many of you that Lincoln Park ranked as our most walkable neighborhood in Chicago. Located just two miles north of the heart of downtown, this neighborhood delivers charm and ease of living in a picturesque package.   \nWith a stellar Walk Score of 94, Lincoln Park truly earns its title as Chicago’s most walkable neighborhood. Getting around is so easy, you don’t need to own a car, just a good pair of sneakers. Rent an apartment in Lincoln Park and enjoy walking to: [...] Our busy lives demand it. We expect to shop for groceries, hit the gym, romp in the dog park, and pop by a farmer’s market, all on foot. When the corner coffee shop feels like an extension of your home, and your favorite restaurant’s staff greets you like family, you know you’ve hit the neighborhood jackpot.\n\nHere in Chicago, we love a walkable neighborhood. With a Walk Score of 77, Chicago is the 4th most walkable large city in the U.S. But after matching thousands of folks with downtown’s best luxury apartments, we wanted to highlight the best neighborhoods. Our leasing team knows that busy Chicagoans have high expectations—that’s why we surveyed our top 30 agents to understand what makes a neighborhood in Chicago walkable. [...] So, let’s explore the cream of the crop—Chicago neighborhoods with a minimum Walk Score above 92. And, we’ll go beyond the score, sharing insider info from the locals who live, work, and walk these neighborhoods on the daily. Get ready for hidden gems, favorite local spots, and tips to make the most of Chicago’s best walkable neighborhoods.\n\nThe tin man sculpture at Oz Park, Lincoln Park\n\n## Lincoln Park is the Most Walkable Neighborhood in Downtown Chicago",
      "score": 0.99935883,
      "raw_content": null
    },
    {
      "url": "https://www.walkscore.com/IL/Chicago",
      "title": "Chicago Apartments for Rent and Chicago Rentals - Walk Score",
      "content": "+ Search\n  + Find Apartments\n  + My Favorites\n\nWalk Score Logo\n\nGet Scores My Favorites Add to Your Site\n\nLogin default user image\n\nLog in to save favorites.\n\n## Living in Chicago\n\n# Chicago Apartments for Rent\n\nmap of Chicago apartments for rent\n\n77 Walk Score of Chicago, IL 65 Transit Score of Chicago, IL 72 Bike Score of Chicago, IL\n\nChicago is the 4th most walkable large city in the US with 2,695,598 residents.\n\nChicago has good public transportation and is very bikeable.\n\nThe most walkable Chicago neighborhoods are East Ukrainian Village, Wicker Park and Near North Side.\n\nNearby Chicago Apartments on Redfin\n\nView Chicago apartments for rent  |   View Chicago homes for sale\n\n77 Walk Score of Chicago, IL\n\n## Chicago is Very Walkable\n\nMost errands can be accomplished on foot. [...] | 95 | Washington Park | 59 | 73 | 66 | 11,328 |\n| 96 | Longwood Manor | 58 | 68 | 53 | 6,407 |\n| 97 | Ashburn | 57 | 55 | 50 | 16,334 |\n| 98 | Mount Greenwood | 56 | 43 | 57 | 17,508 |\n| 99 | West Chesterfield | 53 | 79 | 49 | 4,125 |\n| 100 | Ford City | 52 | 61 | 49 | 861 |\n| 101 | Fernwood | 52 | 58 | 48 | 9,984 |\n| 102 | Irving Woods | 52 | 48 | 50 | 4,355 |\n| 103 | Burnside | 51 | 66 | 48 | 9,931 |\n| 104 | Hegewisch | 51 | 34 | 56 | 9,511 |\n| 105 | West Pullman | 49 | 54 | 57 | 29,655 |\n| 106 | Tally's Corner | 45 | 45 | 46 | 1,584 |\n| 107 | South Deering | 45 | 52 | 45 | 14,340 |\n| 108 | Pullman | 44 | 62 | 49 | 7,284 |\n| 109 | Princeton Park | 43 | 82 | 43 | 3,364 | [...] | 31 | Cragin | 84 | 58 | 66 | 42,978 |\n| 32 | Near West Side | 84 | 81 | 90 | 17,235 |\n| 33 | Belmont Central | 83 | 58 | 67 | 31,071 |\n| 34 | Hermosa | 83 | 59 | 73 | 20,888 |\n| 35 | West Ridge | 83 | 56 | 73 | 71,939 |\n| 36 | The Villa | 82 | 72 | 61 | 598 |\n| 37 | Bridgeport | 82 | 61 | 83 | 32,884 |\n| 38 | Tri-taylor | 81 | 73 | 90 | 3,341 |\n| 39 | Mayfair | 80 | 65 | 75 | 7,468 |\n| 40 | Archer Heights | 78 | 57 | 57 | 15,593 |\n| 41 | Portage Park | 78 | 59 | 63 | 43,601 |\n| 42 | North Mayfair | 77 | 59 | 71 | 6,882 |\n| 43 | Old Irving Park | 77 | 69 | 67 | 11,558 |\n| 44 | Chatham | 77 | 67 | 56 | 25,742 |\n| 45 | Montclare | 77 | 56 | 69 | 16,143 |\n| 46 | Marynook | 76 | 58 | 55 | 2,461 |\n| 47 | McKinley Park | 76 | 64 | 64 | 14,484 |\n| 48 | Jefferson Park | 76 | 64 | 73 | 44,147 |",
      "score": 0.9991374,
      "raw_content": null,
      "favicon": null
    },


NewsAPI
Documentation
News API is a simple HTTP REST API for searching and retrieving live articles from all over the web. It can help you answer questions like:

What top stories is TechCrunch running right now?
What new articles were published about the next iPhone today?
Has my company or product been mentioned or reviewed by any blogs recently?
You can search for articles with any combination of the following criteria:

Keyword or phrase. Eg: find all articles containing the word 'Microsoft'.
Date published. Eg: find all articles published yesterday.
Source domain name. Eg: find all articles published on thenextweb.com.
Language. Eg: find all articles written in English.
You can sort the results in the following orders:

Date published
Relevancy to search keyword
Popularity of source
You need an API key to use the API - this is a unique key that identifies your requests. They're free while you're in development.

Endpoints
News API has 2 main endpoints:

Everything /v2/everything – search every article published by over 150,000 different sources large and small in the last 5 years. This endpoint is ideal for news analysis and article discovery.
Top headlines /v2/top-headlines – returns breaking news headlines for countries, categories, and singular publishers. This is perfect for use with news tickers or anywhere you want to use live up-to-date news headlines.
There is also a minor endpoint that can be used to retrieve a small subset of the publishers we can scan:

Sources /v2/top-headlines/sources – returns information (including name, description, and category) about the most notable sources available for obtaining top headlines from. This list could be piped directly through to your users when showing them some of the options available.

Request parameters
apiKey
required
Your API key. Alternatively you can provide this via the X-Api-Key HTTP header.

q
Keywords or phrases to search for in the article title and body.

Advanced search is supported here:

Surround phrases with quotes (") for exact match.
Prepend words or phrases that must appear with a + symbol. Eg: +bitcoin
Prepend words that must not appear with a - symbol. Eg: -bitcoin
Alternatively you can use the AND / OR / NOT keywords, and optionally group these with parenthesis. Eg: crypto AND (ethereum OR litecoin) NOT bitcoin.
The complete value for q must be URL-encoded. Max length: 500 chars.

searchIn
The fields to restrict your q search to.

The possible options are:

title
description
content
Multiple options can be specified by separating them with a comma, for example: title,content.

This parameter is useful if you have an edge case where searching all the fields is not giving the desired outcome, but generally you should not need to set this.

Default: all fields are searched.

sources
A comma-seperated string of identifiers (maximum 20) for the news sources or blogs you want headlines from. Use the /sources endpoint to locate these programmatically or look at the sources index.

domains
A comma-seperated string of domains (eg bbc.co.uk, techcrunch.com, engadget.com) to restrict the search to.

excludeDomains
A comma-seperated string of domains (eg bbc.co.uk, techcrunch.com, engadget.com) to remove from the results.

from
A date and optional time for the oldest article allowed. This should be in ISO 8601 format (e.g. 2026-04-26 or 2026-04-26T22:03:33)

Default: the oldest according to your plan.

to
A date and optional time for the newest article allowed. This should be in ISO 8601 format (e.g. 2026-04-26 or 2026-04-26T22:03:33)

Default: the newest according to your plan.

language
The 2-letter ISO-639-1 code of the language you want to get headlines for. Possible options: ardeenesfrheitnlnoptrusvudzh.

Default: all languages returned.

sortBy
The order to sort the articles in. Possible options: relevancy, popularity, publishedAt.
relevancy = articles more closely related to q come first.
popularity = articles from popular sources and publishers come first.
publishedAt = newest articles come first.

Default: publishedAt

pageSize
int
The number of results to return per page.

Default: 100. Maximum: 100.

page
int
Use this to page through the results.

Default: 1.

Response object
status
string
If the request was successful or not. Options: ok, error. In the case of error a code and message property will be populated.

totalResults
int
The total number of results available for your request. Only a limited number are shown at a time though, so use the page parameter in your requests to page through them.

articles
array[article]
The results of the request.

source
object
The identifier id and a display name name for the source this article came from.

author
string
The author of the article

title
string
The headline or title of the article.

description
string
A description or snippet from the article.

url
string
The direct URL to the article.

urlToImage
string
The URL to a relevant image for the article.

publishedAt
string
The date and time that the article was published, in UTC (+000)

content
string
The unformatted content of the article, where available. This is truncated to 200 chars

GET https://newsapi.org/v2/everything?q=bitcoin&apiKey=0edc491be96a4ccf9b7b5111e697db20
{
"status": "ok",
"totalResults": 4936,
-"articles": [
-{
-"source": {
"id": null,
"name": "Gizmodo.com"
},
"author": "Kyle Torpey",
"title": "Popular Musician Loses Life Savings Through Malicious Crypto Wallet in Apple’s App Store",
"description": "The theft apparently combined a counterfeit app with a critical mistake by the musician.",
"url": "https://gizmodo.com/popular-musician-loses-life-savings-through-malicious-crypto-wallet-in-apples-app-store-2000745902",
"urlToImage": "https://gizmodo.com/app/uploads/2026/04/g-love-crypto-theft-1200x675.jpg",
"publishedAt": "2026-04-13T21:25:17Z",
"content": "Musician G. Love lost his life savings after downloading a fake Ledger Live app from Apple’s Mac App Store, according to a post made to his X account. Noted blockchain investigator ZachXBT traced the… [+4424 chars]"
},
-{
-"source": {
"id": null,
"name": "Gizmodo.com"
},
"author": "Bruce Gil",
"title": "The New York Times Claims It Finally Unmasked Satoshi Nakamoto (This Time for Real)",
"description": "If true, the man would be one of the richest people in the world on paper. He denies it.",
"url": "https://gizmodo.com/the-new-york-times-claims-it-finally-unmasked-satoshi-nakamoto-this-time-for-real-2000744057",
"urlToImage": "https://gizmodo.com/app/uploads/2025/10/satoshi-bust-1200x675.jpg",
"publishedAt": "2026-04-08T16:40:08Z",
"content": "The real identity of Satoshi Nakamoto, the creator of Bitcoin, has remained one of the internets biggest mysteries ever since the cryptocurrency launched in 2009.\r\nOver the years, variousnames have b… [+3071 chars]"
},

Top headlines /v2/top-headlines
This endpoint provides live top and breaking headlines for a country, specific category in a country, single source, or multiple sources. You can also search with keywords. Articles are sorted by the earliest date published first.

This endpoint is great for retrieving headlines for use with news tickers or similar.

Request parameters
apiKey
required
Your API key. Alternatively you can provide this via the X-Api-Key HTTP header.

country
The 2-letter ISO 3166-1 code of the country you want to get headlines for. Possible options: us. Note: you can't mix this param with the sources param.

category
The category you want to get headlines for. Possible options: businessentertainmentgeneralhealthsciencesportstechnology. Note: you can't mix this param with the sources param.

sources
A comma-seperated string of identifiers for the news sources or blogs you want headlines from. Use the /top-headlines/sources endpoint to locate these programmatically or look at the sources index. Note: you can't mix this param with the country or category params.

q
Keywords or a phrase to search for.

pageSize
int
The number of results to return per page (request). 20 is the default, 100 is the maximum.

page
int
Use this to page through the results if the total results found is greater than the page size.

Response object
status
string
If the request was successful or not. Options: ok, error. In the case of error a code and message property will be populated.

totalResults
int
The total number of results available for your request.

articles
array[article]
The results of the request.

source
object
The identifier id and a display name name for the source this article came from.

author
string
The author of the article

title
string
The headline or title of the article.

description
string
A description or snippet from the article.

url
string
The direct URL to the article.

urlToImage
string
The URL to a relevant image for the article.

publishedAt
string
The date and time that the article was published, in UTC (+000)

content
string
The unformatted content of the article, where available. This is truncated to 200 chars.

HUD API
FMR & IL API
Click here to view Terms of Service of the HUD User API

Important Notice: FIPS Code Update for Income Limits 2025
FIPS codes for counties of some of the states have been updated for the Income Limits 2025 dataset and may differ from those used in previous years. To retrieve the updated FIPS codes applicable to IL 2025, please use the new updated=2025 query parameter in your "listCounties" API request. Eg:
GET fmr/listCounties/CT?updated=2025

Getting an Access Token
Follow these steps to create an account and get an access token:

Sign up for an account and select the Datasets API you want to access.
Confirm your account, if it's new - Check your inbox for a confirmation email from HUD User.
After log in, Get an access token by clicking on Create New Token.
Use it in the Authorization: Bearer header to make API calls.
Base URL
The base URL for all FMR API endpoints is

https://www.huduser.gov/hudapi/public/fmr

The table below shows the path that completes the URI for each endpoint.
To..	Endpoint
Get a list of all states

fmr/listStates

Get a list of all counties in a state
to Get a list of all counties in a state for Income Limits 2025

fmr/listCounties/{stateid}
fmr/listCounties/{stateid}?updated=2025

Get a list of all Metropolitan areas
to Get a list of all Metropolitan areas for Income Limits 2025

fmr/listMetroAreas
fmr/listMetroAreas?updated=2025

Get FMR data for a town(in NE state), county or metropolitan area.

fmr/data/{entityid}

Get FMR data for a state.

fmr/statedata/{statecode}

Get IL data for a town(in NE state), county or metropolitan area.

il/data/{entityid}

Get IL data for a state.

il/statedata/{statecode}

Get MTSP IL data for a town(in NE state), county or metropolitan area.

mtspil/data/{entityid}

Response Codes
One of the following response codes will be returned with every request:

code	description
200

Request was successful

400

An invalid value was specified for one of the query parameters in the request URI.

401

Authentication failure

403

Not allowed to access this dataset API because you have not registered for it.

404

No data found using '(value you entered)'

405

Unsupported method, only GET is supported

406

Unsupported Accept Header value, must be application/json

500

Internal server error occurred

Input parameters
These parameters appear after a question mark (?) in the endpoint. They are separated using the ampersand (&) character.

name	description
year

Year of the data to retrieve E.g. 2017. Default is latest year. Optional

Example Call
Pass the accesstoken in the header to make API calls. An example using the command-line client curl is shown below:

  curl -H "Authorization: Bearer YOUR_API_KEY" https://www.huduser.gov/hudapi/public/fmr/data/0801499999 

API Tester
Use the API Tester to make API calls to Datasets. The API Tester requires an access token. If you have forgotten or do not have a token, click here.












Response Structure for /listStates
property	type	description
state_name

string

State name

state_code

string

State code

state_num

string

State number

category

string

Value is "State"

Response Example for /listStates
API call:

https://www.huduser.gov/hudapi/public/fmr/listStates
		"data":[
		{
		"state_name": "Alabama",
		"state_code": "AL",
		"state_num": "1",
		"category": "State"
		},	
		{
		"state_name": "Alaska",
		"state_code": "AK",
		"state_num": "2",
		"category": "State"
		},
		{
		"state_name": "American Samoa",
		"state_code": "AS",
		"state_num": "60",
		"category": "State"
		},
		...
		]
	


Response Structure for /listCounties/{state_code}
property	type	description
state_code

string

State code

fips_code

string

fips code of the county

county_name

string

County name

town_name

string

Town name - applicable for North East regions

category

string

Value is "County"

Response Example for /listCounties/{state_code}
API call:

https://www.huduser.gov/hudapi/public/fmr/listCounties/VA
		"data":[
		{
		"state_code": "VA",
		"fips_code": "5100199999",
		"county_name": "Accomack County",
		"town_name": "",
		"category": "County"
		},
		{
		"state_code": "VA",
		"fips_code": "5100399999",
		"county_name": "Albemarle County",
		"town_name": "",
		"category": "County"
		},
		{
		"state_code": "VA",
		"fips_code": "5151099999",
		"county_name": "Alexandria city",
		"town_name": "",
		"category": "County"
		},
		...
		]
	


Response Structure for /listMetroAreas
property	type	description
cbsa_code

string

cbsa code of the Metropolitan Area

area_name

string

area name

category

string

Value is "MetroArea"

Response Example for /listMetroAreas
API call:

https://www.huduser.gov/hudapi/public/fmr/listMetroAreas
		"data":[
		{
		"cbsa_code": "METRO10180M10180",
		"area_name": "Abilene, TX MSA",
		"category": "MetroArea"
		},
		{
		"cbsa_code": "METRO29180N22001",
		"area_name": "Acadia Parish, LA HUD Metro FMR Area",
		"category": "MetroArea"
		},
		{
		"cbsa_code": "METRO10380M10380",
		"area_name": "Aguadilla-Isabela, PR HUD Metro FMR Area",
		"category": "MetroArea"
		},
		...
		]
	


Response Structure for fmr/data/{entityid}?year=2017
property	type	description
county_name

string

Name of the county if it is a county.

counties_msa

string

Names of all counties belonging to the Metro Area if it is a Metro Area (MSA).

town_name

string

Town name - applicable for North East regions

metro_status

string

value will be "1" if it is a metropolitan county. Otherwise value will be "0".

metro_name

string

Metro area name if metro_status is "1"

smallarea_status

string

value will be "1" if it is a small area. Otherwise value will be "0".

basicdata

object

Data for the requested year.

Efficiency

string

Efficiency FMR

One-Bedroom

string

1-bedroom FMR

Two-Bedroom

string

2-bedroom FMR

Three-Bedroom

string

3-bedroom FMR

Four-Bedroom

string

4-bedroom FMR

year

string

Value of year

Response Example for fmr/data/{entityid}?year=2017
API call:

https://www.huduser.gov/hudapi/public/fmr/data/5002175925?year=2017
		"data": {
        "county_name": "Rutland County, VT",
        "counties_msa": "",
        "town_name": "Wallingford town",
        "metro_status": "0",
        "metro_name": "",
        "basicdata": {
		"Efficiency": "758.0",
		"One-Bedroom": "769.0",
		"Two-Bedroom": "948.0",
		"Three-Bedroom": "1186.0",
		"Four-Bedroom": "1386.0",
		"year": "2017"
        },
        
		}
	


Response Example for fmr/data/{entityid} if entity will use Small Area FMRs as defined by ZIP codes.
Note: The field "zip_code": "MSA level" has been added to the API to provide MSA-level data for regions utilizing Small Area FMRs.
API call:

https://www.huduser.gov/hudapi/public/fmr/data/METRO47900M47900
	"data": {
		"county_name": "",
		"counties_msa": "Alexandria city, VA; Arlington County, VA; Calvert County, MD; Charles County, MD; Clarke County, VA; District of Columbia, DC; Fairfax city, VA; Fairfax County, VA; Falls Church city, VA; Fauquier County, VA; Frederick County, MD; Fredericksburg city, VA; Loudoun County, VA; Manassas city, VA; Manassas Park city, VA; Montgomery County, MD; Prince George's County, MD; Prince William County, VA; Spotsylvania County, VA; and Stafford County, VA",
		"town_name": "",
		"metro_status": "1",
		"metro_name": "Washington-Arlington-Alexandria, DC-VA-MD-WV",
		"area_name": "Washington-Arlington-Alexandria, DC-VA-MD HUD Metro FMR Area",
		"smallarea_status": "1",
		"year": "2024",
		"basicdata": [
			{
				"zip_code": "MSA level",
				"Efficiency": 1772,
				"One-Bedroom": 1803,
				"Two-Bedroom": 2045,
				"Three-Bedroom": 2544,
				"Four-Bedroom": 3015
			},
			{
				"zip_code": "20001",
				"Efficiency": 2460,
				"One-Bedroom": 2500,
				"Two-Bedroom": 2840,
				"Three-Bedroom": 3530,
				"Four-Bedroom": 4190
			},
			{
				"zip_code": "20002",
				"Efficiency": 1750,
				"One-Bedroom": 1780,
				"Two-Bedroom": 2020,
				"Three-Bedroom": 2510,
				"Four-Bedroom": 2980
			},
			{
				"zip_code": "20003",
				"Efficiency": 2660,
				"One-Bedroom": 2710,
				"Two-Bedroom": 3070,
				"Three-Bedroom": 3820,
				"Four-Bedroom": 4530
			},
		...
		]
		}
	


Response Structure for fmr/statedata/{statecode}?year=2017
property	type	description
year

String

The year of the data being displayed

metroareas

array

Data of all metro areas in this State

counties

array

Data of all counties in this State

code

string

code of cbsa/county

name

string

Name of the cbsa/county

Efficiency

string

Efficiency FMR

One-Bedroom

string

1-bedroom FMR

Two-Bedroom

string

2-bedroom FMR

Three-Bedroom

string

3-bedroom FMR

Four-Bedroom

string

4-bedroom FMR

statename

string

state name

state_code

string

state code

town_name

string

Town name - applicable for North East States

smallarea_status

string

value will be "1" if it is a small area. Otherwise value will be "0".

Response Example for fmr/statedata/{statecode}
API call:

https://www.huduser.gov/hudapi/public/fmr/statedata/MA
		"data": {
        "year": "2018",
        "metroareas": [
		{
		"code": "METRO12700M12700",
		"name": "Barnstable Town, MA MSA",
		"state_name": "Massachusetts",
		"state_code": "MA",
		"Efficiency": "925.0",
		"One-Bedroom": "1048.0",
		"Two-Bedroom": "1394.0",
		"Three-Bedroom": "1757.0",
		"Four-Bedroom": "1919.0",
		"smallarea_status": 0
		},
		{
		"code": "METRO38340N25003",
		"name": "Berkshire County, MA (part) HUD Metro FMR Area",
		"state_name": "Massachusetts",
		"state_code": "MA",
		"Efficiency": "836.0",
		"One-Bedroom": "849.0",
		"Two-Bedroom": "988.0",
		"Three-Bedroom": "1239.0",
		"Four-Bedroom": "1441.0",
		"smallarea_status": 0
		},
    	...
		]
		,
		"counties": [
		{
		"town_name": "Abington town",
		"county_name": "Plymouth County",
		"metro_name": "Brockton, MA HUD Metro FMR Area",
		"fips_code": "2502300170",
		"Efficiency": 1064,
		"One-Bedroom": 1160,
		"Two-Bedroom": 1528,
		"Three-Bedroom": 1918,
		"Four-Bedroom": 2240,
		"FMR Percentile": 40,
		"statename": "Massachusetts",
		"statecode": "MA",
		"smallarea_status": 0
		},
		{
		"town_name": "Acton town",
		"county_name": "Middlesex County",
		"metro_name": "Boston-Cambridge-Quincy, MA-NH HUD Metro FMR Area",
		"fips_code": "2501700380",
		"Efficiency": 1715,
		"One-Bedroom": 1900,
		"Two-Bedroom": 2311,
		"Three-Bedroom": 2880,
		"Four-Bedroom": 3131,
		"FMR Percentile": 40,
		"statename": "Massachusetts",
		"statecode": "MA",
		"smallarea_status": 0
		},
    	...
    	]
		]
	


Response Structure for il/data/{entityid}?year=2017
property	type	description
county_name

string

Name of the county if it is a county.

counties_msa

string

Names of all counties belonging to the Metro Area if it is a Metro Area (MSA).

town_name

string

Town name - applicable for North East regions

metro_status

string

value will be "1" if it is a metropolitan county. Otherwise value will be "0".

metro_name

string

Metro area name if metro_status is "1"

year

string

year of the data

median_income

string

Median Income for the area

object

Very Low (50%) Income Limits

object

Extremely Low (30%) Income Limits

object

Low (80%) Income Limits

Response Example for il/data/0100199999
API call:

https://www.huduser.gov/hudapi/public/il/data/0100199999
		"data": {
        "county_name": "Autauga County, AL",
        "counties_msa": "",
        "town_name": "",
        "metro_status": "1",
        "metro_name": "Montgomery, AL MSA",
        "area_name": "Montgomery, AL MSA",
        "year": "2019",
        "median_income": 65900,
        "very_low": {
		"il50_p1": 23100,
		"il50_p2": 26400,
		"il50_p3": 29700,
		"il50_p4": 32950,
		"il50_p5": 35600,
		"il50_p6": 38250,
		"il50_p7": 40900,
		"il50_p8": 43500
        },
        "extremely_low": {
		"il30_p1": 13850,
		"il30_p2": 16910,
		"il30_p3": 21330,
		"il30_p4": 25750,
		"il30_p5": 30170,
		"il30_p6": 34590,
		"il30_p7": 39010,
		"il30_p8": 43430
        },
        "low": {
		"il80_p1": 36900,
		"il80_p2": 42200,
		"il80_p3": 47450,
		"il80_p4": 52700,
		"il80_p5": 56950,
		"il80_p6": 61150,
		"il80_p7": 65350,
		"il80_p8": 69600
        }
		}
	

Response Structure for mtspil/data/{entityid}?year=2024
property	type	description
county_name

string

Name of the county if it is a county.

counties_msa

string

Names of all counties belonging to the Metro Area if it is a Metro Area (MSA).

town_name

string

Town name - applicable for North East regions

metro_status

string

value will be "1" if it is a metropolitan county. Otherwise value will be "0".

metro_name

string

Metro area name if metro_status is "1"

year

string

year of the data

median_income

string

Median Income for the area


80percent
object
80 Percent MTSP Income Limits

70percent
object
70 Percent MTSP Income Limits

60percent
object
60 Percent MTSP Income Limits

50percent
object
50 Percent MTSP Income Limits

40percent
object
40 Percent MTSP Income Limits

30percent
object
30 Percent MTSP Income Limits

20percent
object
20 Percent MTSP Income Limits

hera_special_50percent
object
50 Percent HERA Special Income Limits

hera_special_60percent
object
60 Percent HERA Special Income Limits
Response Example for mtspil/data/METRO11020M11020
API call:

https://www.huduser.gov/hudapi/public/mtspil/data/METRO11020M11020
		{
            "data": {
                "county_name": "",
                "counties_msa": "Blair County, PA; ",
                "town_name": "",
                "metro_status": "1",
                "metro_name": "Altoona, PA",
                "area_name": "Altoona, PA MSA",
                "year": "2024",
                "median_income": 86900,
                "80percent": {
                    "il80_p1": 47600,
                    "il80_p2": 54320,
                    "il80_p3": 61120,
                    "il80_p4": 67920,
                    "il80_p5": 73360,
                    "il80_p6": 78800,
                    "il80_p7": 84240,
                    "il80_p8": 89680
                },
                "70percent": {
                    "il70_p1": 41650,
                    "il70_p2": 47530,
                    "il70_p3": 53480,
                    "il70_p4": 59430,
                    "il70_p5": 64190,
                    "il70_p6": 68950,
                    "il70_p7": 73710,
                    "il70_p8": 78470
                },
                "60percent": {
                    "il60_p1": 35700,
                    "il60_p2": 40740,
                    "il60_p3": 45840,
                    "il60_p4": 50940,
                    "il60_p5": 55020,
                    "il60_p6": 59100,
                    "il60_p7": 63180,
                    "il60_p8": 67260
                },
                "50percent": {
                   ...
                },
                "40percent": {
                   ...
                },
                "30percent": {
                   ...
                },
                "20percent": {
                    ...
                },
                "hera_special_50percent": {
                    "hera_special_il50_p1": 30950,
                    "hera_special_il50_p2": 35350,
                    "hera_special_il50_p3": 39750,
                    "hera_special_il50_p4": 44150,
                    "hera_special_il50_p5": 47700,
                    "hera_special_il50_p6": 51250,
                    "hera_special_il50_p7": 54750,
                    "hera_special_il50_p8": 58300
                },
                "hera_special_60percent": {
                    "hera_special_il60_p1": 37140,
                    "hera_special_il60_p2": 42420,
                    "hera_special_il60_p3": 47700,
                    "hera_special_il60_p4": 52980,
                    "hera_special_il60_p5": 57240,
                    "hera_special_il60_p6": 61500,
                    "hera_special_il60_p7": 65700,
                    "hera_special_il60_p8": 69960
                }
            }
        }	


        Wikipedia API – Core Overview (MediaWiki API)

Purpose:
The Wikipedia API (MediaWiki API) allows programs to retrieve structured data from Wikipedia pages, including summaries, content, and search results.

Key Idea:
You send an HTTP request to the API endpoint and specify:
- action (what you want to do)
- parameters (what data you want)

-----------------------------------

Base Endpoint:

https://en.wikipedia.org/w/api.php

-----------------------------------

Core Concept:

Everything is controlled by the "action" parameter.

Most important action for this project:
- action=query → retrieve data
- action=parse → get page content

-----------------------------------

Common Usage (for EliseAI project):

1. Get Page Summary / Content

Example:
api.php?action=query&prop=extracts&titles=San_Jose&format=json

Returns:
- short summary text about a city or company

-----------------------------------

2. Search for a Page

Example:
api.php?action=opensearch&search=San%20Jose&format=json

Returns:
- matching page titles
- useful when input is messy

-----------------------------------

3. Get Parsed Page (HTML content)

Example:
api.php?action=parse&page=San_Jose&format=json

Returns:
- full page content (HTML)

-----------------------------------

Key Parameters:

- action → defines operation (query, parse, search)
- format=json → response format (always use JSON)
- titles= → page name (use underscores for spaces)
- prop=extracts → get summary text
- search= → search query

-----------------------------------

Output:

Returns JSON data.

Example structure:
{
  "query": {
    "pages": {
      "12345": {
        "title": "San Jose",
        "extract": "San Jose is a city in California..."
      }
    }
  }
}

-----------------------------------

What Data You Can Get (Relevant for Project):

- City descriptions
- Company descriptions
- Industry context
- Economic or regional context
- General summaries for personalization

-----------------------------------

Usage in EliseAI Project:

For each lead:
1. Take city or company name
2. Query Wikipedia API
3. Extract summary text
4. Use it for:
   - sales insights
   - personalized outreach emails

-----------------------------------

Important Notes:

- No API key required
- Free and unlimited for reasonable use
- Use underscores instead of spaces in titles
- Use search endpoint if exact match fails

-----------------------------------

Summary:

The Wikipedia API is a REST-style API that allows you to fetch summaries, search results, and page content by specifying an action and parameters, returning structured JSON data.