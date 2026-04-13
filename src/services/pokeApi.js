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
      types: typeMap[p.name] || ['normal'] // safe fallback
    };
  });
};

export const fetchPokemonByName = async (name) => {
  try {
    const formattedName = name.toLowerCase().replace(/[^a-z0-9-]/g, ' ').trim().replace(/\s+/g, '-');
    const pRes = await fetch(`${BASE_URL}/${formattedName}`);
    if (!pRes.ok) return null;
    const detail = await pRes.json();
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
      cry: detail.cries ? detail.cries.latest : null
    };
  } catch (e) {
    return null;
  }
};
