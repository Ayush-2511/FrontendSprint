const BASE_URL = 'https://pokeapi.co/api/v2/pokemon';

export const fetchAllGen3Pokemons = async () => {
  const rootRes = await fetch(`${BASE_URL}?limit=386`);
  if (!rootRes.ok) throw new Error('Failed to fetch Pokemon root list');
  const rootData = await rootRes.json();
  
  const typeMap = {};
  
  const typePromises = Array.from({ length: 18 }, async (_, i) => {
    try {
      const tRes = await fetch(`https://pokeapi.co/api/v2/type/${i + 1}`);
      if (!tRes.ok) return;
      const tData = await tRes.json();
      const typeName = tData.name;
      tData.pokemon.forEach(p => {
        if (!typeMap[p.pokemon.name]) typeMap[p.pokemon.name] = [];
        typeMap[p.pokemon.name].push(typeName);
      });
    } catch(e) {
      console.error(e);
    }
  });

  await Promise.all(typePromises);

  return rootData.results.map(p => {
    const id = parseInt(p.url.split('/').filter(Boolean).pop(), 10);
    return {
      id,
      name: p.name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      types: typeMap[p.name] || ['normal']
    };
  });
};

// Fetch base stats for a list of pokemon IDs in a background batch
export const fetchStatBatch = async (ids, onProgress) => {
  const BATCH = 20;
  const cache = {};
  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    await Promise.all(slice.map(async id => {
      try {
        const res = await fetch(`${BASE_URL}/${id}`);
        if (!res.ok) return;
        const d = await res.json();
        const stats = {};
        d.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });
        stats.total = d.stats.reduce((sum, s) => sum + s.base_stat, 0);
        cache[id] = stats;
      } catch(_) {}
    }));
    if (onProgress) onProgress({ ...cache });
  }
  return cache;
};


export const fetchPokemonByName = async (name) => {
  try {
    const formattedName = name.toLowerCase().replace(/[^a-z0-9-]/g, ' ').trim().replace(/\s+/g, '-');
    const pRes = await fetch(`${BASE_URL}/${formattedName}`);
    if (!pRes.ok) return null;
    const detail = await pRes.json();

    // Fetch species for flavor text + genus
    let flavorText = null;
    let genus = null;
    try {
      const speciesRes = await fetch(detail.species.url);
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        // Pick the first English flavor text, clean up form-feed chars
        const entry = speciesData.flavor_text_entries.find(e => e.language.name === 'en');
        if (entry) flavorText = entry.flavor_text.replace(/[\f\n]/g, ' ').replace(/\s+/g, ' ').trim();
        const gen = speciesData.genera.find(g => g.language.name === 'en');
        if (gen) genus = gen.genus;
      }
    } catch (_) { /* species fetch is best-effort */ }

    return {
      id: detail.id,
      name: detail.name,
      image: detail.sprites.other['official-artwork'].front_default || detail.sprites.front_default,
      types: detail.types.map(t => t.type.name),
      stats: detail.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
      height: detail.height,
      weight: detail.weight,
      base_experience: detail.base_experience,
      abilities: detail.abilities.map(a => ({ name: a.ability.name, is_hidden: a.is_hidden })),
      cry: detail.cries ? detail.cries.latest : null,
      flavorText,
      genus,
    };
  } catch (e) {
    return null;
  }
};

