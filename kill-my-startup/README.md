**Kill My Startup** — “Real-time market intelligence for founders. Get live metrics about your space, competitors, and audience sentiment — all powered by Perplexity Search.”

Imagine a dashboard that **updates itself every 6–12 hours**.  
Each widget feels like a **truth mirror** for your idea.

- **“People talking about this”** → sparkline chart
    
- **“Competitors launched”** → timeline
    
- **“Top recent news”** → Perplexity-powered summaries
    
- **“Funding trend”** → simple up/down badge
    
- **“User sentiment”** → aggregated word cloud (“love”, “boring”, “expensive”)
    
- **“Tech mentions”** → tag cloud (LangChain, LlamaIndex, fine-tuning, etc.)

| Category                         | Metric                          | Why It Matters                               | Example Insight                                                        |
| -------------------------------- | ------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| **Competitive Landscape**        | **Similar Projects**            | See who’s building in your space right now.  | “4 startups launched in the last month doing AI for legal docs.”       |
|                                  | **Launch Velocity**             | Track _how fast_ new entrants appear.        | “+60% new tools compared to last quarter.”<br>                         |
|                                  | **Funding Activity**            | Who’s getting money, and for what.           | “2 Series A rounds this week for AI hiring tools.”                     |
|                                  | **Tech Stack Mentions**         | What tools/tech others use.                  | “Most use LangChain + Pinecone; new ones moving to LlamaIndex.”        |
| **Market Sentiment & Discourse** | **User Sentiment**              | How the public feels about the domain.       | “Neutral: most feedback is curiosity, not excitement.”                 |
|                                  | **Pain Point Frequency**        | How often users complain about this problem. | “Reddit mentions of ‘data labeling is painful’ up 40%.”                |
|                                  | **Excitement Trend**            | Is the topic heating up or cooling down?     | “Mentions peaked 2 weeks ago; down 10% since.”                         |
| **Ecosystem Dynamics**           | **Acquisitions & Partnerships** | Signs of consolidation or opportunity.       | “Two recent M&As suggest strategic interest.”                          |
|                                  | **Hiring Signals**              | Companies hiring for your space.             | “OpenAI hiring 4 roles for ‘document understanding’.”                  |
|                                  | **Community Activity**          | Open source repos, Slack/Discord growth.     | “20% increase in GitHub commits on ‘RAG’ projects.”                    |
| **Idea Distinctiveness**         | **Semantic Similarity Score**   | How unique your idea description is.         | “Similarity to existing startups: 0.62 — somewhat common.”             |
|                                  | **Keyword Gaps**                | Keywords competitors use but you don’t.      | “You’re missing terms like ‘multi-agent’ or ‘retrieval augmentation’.” |
|                                  | **Trend Adjacencies**           | Adjacent ideas with more traction.           | “AI + spreadsheets trending up vs. AI + documents flat.”               |

## Example Use Case

Founder types:

> “AI that helps therapists transcribe and summarize sessions.”

Dashboard returns:

- 7 recent startups doing similar things
- Sentiment: mostly positive (“helps burnout”, “finally useful AI”)
- Funding: $10M raised last quarter in “AI mental health”
- Stack: Whisper, GPT-4o, LangChain
- Adjacency: AI for _patient summaries_ rising faster than _session transcription_
- Weekly buzz trend: +22%


→ **Founder insight:** “Maybe I pivot toward patient summaries and apply to YC.”

**1. Input**

- Founder enters their _idea name + short description_ (“Uber for therapists”, “AI resume reviewer”).
- Optional: industry tags or seed keywords.

**2. Data Fetch (Cron Job + Perplexity API)**

- Scheduled searches every 1 hour.
- Query templates:
    - `"similar startups to {idea}"`
    - `"acquisitions in {industry}"`
    - `"public sentiment on {idea keywords}"`

**3. Processing**
- Extract entities (company names, URLs, sentiment).
- Run lightweight NLP:
    - **Sentiment** via OpenAI or Cohere.
    - **Similarity** via embeddings (compare your idea vs retrieved ones).
    - **Trends** via count deltas.

**4. Dashboard**

- **“Kill / Survive / Pivot”** rating card (⚰️💡🔁).
- Interactive widgets:
    - Competitor timeline.      
    - Sentiment over time graph.
    - Mentions heatmap.
    - Buzz velocity meter (are mentions accelerating or decaying?).

**5. Alerts**
- Email / Slack / Discord bot: “Your idea has 3 new clones” or “Market sentiment dropped 20% this week.”
---

## 🏆 Hackathon Edge — What Judges Will Love

1. **Perplexity API as the brain** — You’re not just summarizing, you’re _investigating live trends_ through search.
2. **Founder painkiller** — Every builder struggles with idea validation.
3. **Clever framing** — The _“Kill My Startup”_ brand is memorable and contrarian.
4. **Insight loops** — It updates automatically and forces _founder humility_ through data.
5. **Moat potential** — If people adopt it to test every idea, you become the _default startup reality engine_.

---

## 💡 Example Demo Flow

> Founder types: “AI tool that summarizes PDFs for students.”

1. Perplexity finds: “ScholarAI”, “ChatPDF”, “Humata”, etc.    
2. Dashboard shows:
    - 14 similar startups (🔴 saturation high)
    - Sentiment: Neutral (🤷 “Too many already”)
    - Funding: $70M raised in 6 months
    - Novelty: 0.28 cosine similarity → _not novel_
    - 
3. Verdict: **💀 Kill — oversaturated, stagnant sentiment.**
4. Pivot suggestion: “AI that teaches citation literacy” → lower saturation, higher positive buzz.