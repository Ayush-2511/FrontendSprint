
# AI-Assisted Frontend API Sprint

**Code Fast. Connect Smart. Deploy Instantly.**

Welcome to the ultimate 60-minute coding challenge. Your mission is to build a frontend web application from scratch, ingest data from a live public API, and use the **Groq LLM** to analyze, synthesize, or transform that data into an intelligent user experience. 

You have 60 minutes to build and deploy. AI coding assistants (ChatGPT, Gemini, Copilot) are highly encouraged to help you write boilerplate and debug. 

---

## 📅 Event Details
- **Time:** 10:00 PM – 11:00 PM
- **Duration:** Exactly 60 Minutes
- **Prerequisites:** Fully charged laptop, GitHub account, Vercel/Netlify account, and your favorite IDE.
- **Tech Stack:** Any frontend framework (React, Next.js, or Vanilla JS).

---

## 🧠 The Challenge: The "Data-to-Intelligence" Pipeline
This is not a standard data-fetching exercise. You must build an application that *thinks*. 

1. **The Fetch (Raw Material):** Grab raw data from one of the approved keyless public APIs.
2. **The Prompt (The Engine):** Pass that raw JSON data into Groq with a highly specific system prompt (e.g., translating it, roasting it, summarizing it, or predicting an outcome).
3. **The Render (The Product):** Display Groq's intelligent output on the frontend using a clean, responsive UI.

### 🔑 Groq LLM Integration
Groq uses an LPU architecture that is blazing fast—perfect for a time-crunched sprint. It is also fully compatible with the OpenAI SDK.
* **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
* **Hackathon Rule:** Because we do not have time to build secure backends, you may temporarily store your Groq API key in your frontend environment variables (`.env`). **You must revoke/delete your key immediately after judging!**

---

## 🔌 Approved Keyless APIs
Choose one of these zero-authentication APIs to source your raw data:

### 🍔 The "Roast & Review" APIs
* **[TheMealDB](https://www.themealdb.com/api.php):** Random recipe generation.
* **[Art Institute of Chicago](https://api.artic.edu/docs/):** High-res public domain artwork metadata.
* **[Dog CEO API](https://dog.ceo/dog-api/):** Over 20,000 images categorized by dog breed.

### ⚡ The "Live Data & Panic" APIs
* **[Open-Meteo](https://open-meteo.com/):** Highly reliable, keyless live weather data.
* **[UK Environment Agency Hydrology](https://environment.data.gov.uk/flood-monitoring/doc/reference):** Live flood warnings and hydrology metrics.
* **[CoinGecko API](https://docs.coingecko.com/v3.0.1/reference/ping):** Free-tier crypto pricing and market caps.

### 🧠 The Text & Trivia APIs
* **[Open Trivia DB (OpenTDB)](https://opentdb.com/api_config.php):** User-contributed trivia questions.
* **[Advice Slip API](https://api.adviceslip.com/):** Randomized or query-based advice strings.
* **[SpaceX Unofficial API](https://github.com/r-spacex/SpaceX-API):** Massive datasets on rocket launches, failures, and crew.
* **[PokeAPI](https://pokeapi.co/):** The classic Pokémon stat and sprite database.

---

## 🏆 Judging Criteria (100 Points Total)

| Category | Points | Key Requirements |
| :--- | :---: | :--- |
| **🧠 Creativity & Innovation** | **35** | • **Concept (15):** Originality and twist on the API data.<br>• **GenAI Features (10):** Integration of Groq for dynamic text, or tools like the Web Speech API.<br>• **UI/UX (10):** Visual flair, layout structure, and responsiveness. |
| **⚙️ Technical Implementation** | **25** | • **API Connectivity (10):** Successful data fetch and parsing.<br>• **State Management (10):** Proper loading states (skeletons) and error handling.<br>• **Interactivity (5):** Working buttons, search, or filters. |
| **🚀 Deployment** | **15** | • **Live Link (15):** Successfully hosted on Vercel/Netlify before the 60 minutes end. Zero points for "it works on localhost." |
| **🌿 Version Control** | **15** | • **Commit History (10):** Clear, multi-step commit history.<br>• **Timestamp (5):** Repo created strictly *after* the event start time. |
| **🗣️ Explainability** | **10** | • **Code Defense (10):** Ability to explain AI-generated logic blocks and demonstrate smart prompt engineering. |

### 🌟 Tie-Breaker (+5 Bonus Points)
**The README Bonus:** Generate and include a clean, professional `README.md` explaining your project, the tech stack, and the APIs used before the timer stops.

---

## 🚀 Final Submission
When the 60-minute timer ends, you must submit your project via the Google Form shared in the WhatsApp group. 
You will need to provide:
1. Your final, deployed Vercel/Netlify Live Link.
2. Your public GitHub Repository Link.

Good luck. Let's see what you can build! 
