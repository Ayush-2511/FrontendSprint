export const analyzeTeam = async (team, size = 6, allowLegendaries = false) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GROQ_API_KEY in environment');
  
  const teamNames = team.map(p => `${p.name} (Types: ${p.types.join(", ")})`).join(", ");
  
  const payload = {
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional Pokemon strategist. The user will provide the opponent's Pokemon team. Your task is to build a counter-team of exactly ${size} Pokemon from Generation 1 to 3 that will defeat the opponent's team. ${allowLegendaries ? 'You MAY include Legendary Pokemon.' : 'You MUST NOT include Legendary or Mythical Pokemon.'}

You MUST output your response ONLY as a JSON object with this exact structure:
{
  "counter_team": [
    { "name": "pokemon-name-here", "reason": "A brief 2-3 sentence explanation of why they counter the opponent's team" }
  ]
}
Ensure the "name" field contains the exact valid species name (e.g., "charizard", "mewtwo") so and the "reason" field explains the specific type advantages and synergy.`
      },
      {
        role: "user",
        content: `Here is the opponent's team: ${teamNames}. Build me a counter-team!`
      }
    ],
    temperature: 0.7,
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
};

export const comparePokemons = async (p1, p2) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GROQ_API_KEY in environment');
  
  const payload = {
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional Pokemon esports analyst. The user will provide two Pokemon (Pokemon A and Pokemon B). Your task is to analyze a hypothetical 1v1 duel between them. You MUST output your response ONLY as a JSON object with this exact structure:
{
  "pokemon1_pros_cons": ["Pro: [reason]", "Con: [reason]", ...],
  "pokemon2_pros_cons": ["Pro: [reason]", "Con: [reason]", ...],
  "strategic_breakdown": "A brief structural paragraph of how their elemental types and base stats intersect in a duel.",
  "verdict": "Which Pokemon wins the matchup and why."
}
Do not return any extra text. Make sure pros and cons explicitly start with 'Pro:' or 'Con:'.`
      },
      {
        role: "user",
        content: `Compare Pokemon A: ${p1.name} (Types: ${p1.types.join(", ")}) vs Pokemon B: ${p2.name} (Types: ${p2.types.join(", ")}). Who emerges victorious?`
      }
    ],
    temperature: 0.7,
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
};
