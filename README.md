# POKÉMON // AI BATTLE SYSTEM v2.0

![Pokédex Banner](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png)

## Overview

A high-performance, **Brutalist-inspired Pokémon Team Builder** and **Analyst**. Engineered for competitive drafting, this application leverages a stark, high-contrast design system to deliver a raw, terminal-like experience for Generation 1-3 Pokémon enthusiasts.

Beyond traditional team building, the application features an **AI-driven counter-team generator** and a **hypothetical duel analyst**, allowing users to simulate match outcomes and optimize roster composition using state-of-the-art data pipelines.

---

## 🚀 Key Features

### ⚔️ Intelligent Drafting Modes
- **Smart Counter-Team Builder**: Input an opponent's roster (up to 6 Pokémon) and generate a mathematically optimized counter-team based on type matchups, stats, and historical competitive data.
- **Hypothetical Duel Analyst**: Select exactly 2 Pokémon to trigger a deep-dive AI simulation of a 1v1 matchup.
- **Team Warfare Matchup**: Draft two full rosters (up to 6 vs 6) to analyze synergy and overall team-on-team warfare viability.

### 🎨 Brutalist Aesthetics
- **High-Contrast Design**: A strict Black, Off-White, and Accent Red palette designed for maximum visual impact.
- **Retro-Terminal Feel**: Monospace typography (`Courier New`) and heavy borders create a raw, industrial user interface.
- **Fixed Sidebar Architecture**: Persistent navigation and drafting controls ensure zero-latency switching between modes.

### 📊 Advanced Data Engine
- **Background Stat Fetching**: Once the app boots, it fetches full base-stat data for all 386 Pokémon in the background, enabling deep sorting by HP, Attack, Speed, and more without blocking the UI.
- **Enhanced Pokédex**: View authentic Pokédex flavor text and genus data from official records.
- **Direct Pokéball Access**: Quick-access details for every Pokémon via a custom Pokéball-themed expansion button.

---

## 🛠️ Tech Stack

- **Frontend**: React (18+) with Vite
- **Styling**: Vanilla CSS (Custom Brutalist Design System)
- **Icons**: Lucide-React
- **API**: PokéAPI (v2)
- **Architecture**: Context-free state management with specialized caching for stat-based sorting.

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Ayush-2511/FrontendSprint.git
   ```
2. Navigate to the project directory:
   ```bash
   cd FrontendSprint
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📜 License

This project is open-source and available under the MIT License.

---

*“To provide the perfect counter, one must understand the absolute stats.”*
