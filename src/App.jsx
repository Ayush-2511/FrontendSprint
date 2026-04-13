import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllGen3Pokemons, fetchPokemonByName } from './services/pokeApi';
import { analyzeTeam, comparePokemons } from './services/groqApi';
import { BrainCircuit, Loader2, Sparkles, X, Info, MoreVertical, Activity, Volume2, Database, Search, ArrowDownAZ, Filter, Swords, ShieldHalf } from 'lucide-react';
import './App.css';

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('id-asc');
  const [typeFilter, setTypeFilter] = useState('all');

  const [team, setTeam] = useState([]);
  
  // Modes
  const [appMode, setAppMode] = useState('counter'); // 'counter' or 'compare'

  // Counter Mode State
  const [allowLegendaries, setAllowLegendaries] = useState(false);
  const [counterTeamSize, setCounterTeamSize] = useState(6);
  const [counterPokemons, setCounterPokemons] = useState([]);
  
  // Compare Mode State
  const [comparisonData, setComparisonData] = useState(null);

  // Shared
  const [detailedPokemon, setDetailedPokemon] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const loadAllPokemons = async () => {
    setLoadingList(true);
    try {
      const data = await fetchAllGen3Pokemons();
      setPokemons(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch initial Pokemon database");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAllPokemons();
  }, []);

  const filteredAndSortedPokemons = useMemo(() => {
    let result = pokemons;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => p.name.includes(term) || p.id.toString() === term || p.id.toString().includes(term));
    }
    
    if (typeFilter !== 'all') {
      result = result.filter(p => p.types.includes(typeFilter));
    }
    
    result = [...result].sort((a, b) => {
       if (sortOrder === 'id-asc') return a.id - b.id;
       if (sortOrder === 'id-desc') return b.id - a.id;
       if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
       if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
       return 0;
    });
    
    return result;
  }, [pokemons, searchTerm, typeFilter, sortOrder]);

  const toggleMode = (mode) => {
    setAppMode(mode);
    setTeam([]);
    setCounterPokemons([]);
    setComparisonData(null);
    setError(null);
  };

  const togglePokemon = (pokemon) => {
    setTeam(prev => {
      const isSelected = prev.find(p => p.id === pokemon.id);
      if (isSelected) {
        return prev.filter(p => p.id !== pokemon.id);
      } else {
        const limit = appMode === 'counter' ? 6 : 2;
        if (prev.length >= limit) return prev;
        return [...prev, pokemon];
      }
    });
  };

  const handleAction = async () => {
    if (team.length === 0) return;
    setAnalyzing(true);
    setError(null);
    setDetailedPokemon(null);

    try {
        if (appMode === 'counter') {
            setCounterPokemons([]);
            const resultObj = await analyzeTeam(team, counterTeamSize, allowLegendaries);
            if (!resultObj.counter_team) throw new Error("Invalid AI Response format. Missing 'counter_team'.");
            
            const hydratedTeam = await Promise.all(
              resultObj.counter_team.map(async (cp) => {
                const pData = await fetchPokemonByName(cp.name);
                return { ...cp, data: pData }
              })
            );
            setCounterPokemons(hydratedTeam);
        } else {
            if (team.length !== 2) throw new Error("Please select exactly 2 Pokemon to duel.");
            setComparisonData(null);
            
            const result = await comparePokemons(team[0], team[1]);
            const p1Data = await fetchPokemonByName(team[0].name);
            const p2Data = await fetchPokemonByName(team[1].name);
            
            setComparisonData({
                p1: p1Data,
                p2: p2Data,
                analysis: result
            });
        }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const openDetails = async (e, pObj, isCounter = false) => {
    e.stopPropagation();
    if (isCounter && pObj.data) {
        setDetailedPokemon({ type: 'counter', ...pObj });
    } else {
        setLoadingDetails(true);
        const detailedData = await fetchPokemonByName(pObj.name);
        setLoadingDetails(false);
        if (detailedData) {
            setDetailedPokemon({ type: 'grid', data: detailedData });
        }
    }
  };

  const limitConfig = appMode === 'counter' ? 6 : 2;

  return (
    <div className="app-container">
      <main>
        <div className="header">
          <h1>{appMode === 'counter' ? 'Smart Counter-Team Builder' : 'Hypothetical Duel Analyst'}</h1>
          <p>
            {appMode === 'counter' 
              ? "Select the Opponent's Pokemon team (up to 6) to generate a flawless Counter-Team"
              : "Select exactly 2 Pokemon to analyze their hypothetical duel Matchup"}
          </p>
        </div>

        <div className="filter-header">
           <div className="search-bar">
             <Search size={18} />
             <input type="text" placeholder="Search name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           
           <div className="filter-controls">
             <div className="filter-group">
                <Filter size={16} />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                   <option value="all">All Types</option>
                   <option value="normal">Normal</option>
                   <option value="fire">Fire</option>
                   <option value="water">Water</option>
                   <option value="grass">Grass</option>
                   <option value="electric">Electric</option>
                   <option value="ice">Ice</option>
                   <option value="fighting">Fighting</option>
                   <option value="poison">Poison</option>
                   <option value="ground">Ground</option>
                   <option value="flying">Flying</option>
                   <option value="psychic">Psychic</option>
                   <option value="bug">Bug</option>
                   <option value="rock">Rock</option>
                   <option value="ghost">Ghost</option>
                   <option value="dragon">Dragon</option>
                   <option value="dark">Dark</option>
                   <option value="steel">Steel</option>
                   <option value="fairy">Fairy</option>
                </select>
             </div>
             
             <div className="filter-group">
                <ArrowDownAZ size={16} />
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                   <option value="id-asc">Lowest ID</option>
                   <option value="id-desc">Highest ID</option>
                   <option value="name-asc">A - Z</option>
                   <option value="name-desc">Z - A</option>
                </select>
             </div>
           </div>
        </div>

        {loadingList ? (
          <div className="loader-container" style={{marginTop: '4rem'}}>
            <Loader2 className="spinner" style={{width: 50, height: 50, border: 'none'}} />
            <p style={{fontSize: '1.2rem', color: '#fff'}}>Booting Pokedex Database...</p>
          </div>
        ) : (
          <div className="pokemons-grid">
            {filteredAndSortedPokemons.map((pokemon) => {
              const isSelected = team.find(p => p.id === pokemon.id);
              const isDisabled = !isSelected && team.length >= limitConfig;
              
              return (
                <div 
                  key={pokemon.id}
                  className={`pokemon-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!isDisabled || isSelected) togglePokemon(pokemon);
                  }}
                >
                  <div className="pokemon-card-header">
                     <span className="pokemon-id">#{pokemon.id.toString().padStart(3, '0')}</span>
                     <button className="more-btn" onClick={(e) => openDetails(e, pokemon, false)}>
                       <MoreVertical size={16} />
                     </button>
                  </div>
                  <div className="pokemon-image-container">
                    <img src={pokemon.image} alt={pokemon.name} className="pokemon-image" loading="lazy" />
                  </div>
                  <div className="pokemon-name">{pokemon.name}</div>
                  <div className="pokemon-types">
                    {pokemon.types.map(type => (
                      <span key={type} className="type-badge">{type}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <aside>
        <div className="team-sidebar">
          <div className="mode-tabs">
             <button className={`mode-tab ${appMode === 'counter' ? 'active' : ''}`} onClick={() => toggleMode('counter')}>
               <ShieldHalf size={16} /> Builder
             </button>
             <button className={`mode-tab ${appMode === 'compare' ? 'active' : ''}`} onClick={() => toggleMode('compare')}>
               <Swords size={16} /> Duel
             </button>
          </div>

          <h2>
            {appMode === 'counter' ? "Opponent's Team" : "Duel Matchup"}
            <span className="team-count">{team.length} / {limitConfig}</span>
          </h2>
          
          <div className="selected-slots" style={{ gridTemplateColumns: appMode === 'compare' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
            {Array.from({ length: limitConfig }).map((_, i) => {
              const p = team[i];
              return (
                <div key={i} className={`selected-slot ${p ? 'filled' : ''}`}>
                  {p && (
                    <>
                      <img src={p.image} alt={p.name} />
                      <button className="remove-btn" onClick={() => togglePokemon(p)}>
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {appMode === 'counter' ? (
              <div className="settings-panel">
                <div className="setting-row">
                  <label htmlFor="team-size" style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                     Counter-Team Size: <span className="team-size-val">{counterTeamSize}</span>
                  </label>
                </div>
                <div className="setting-row">
                  <input 
                      id="team-size" 
                      type="range" 
                      min="1" 
                      max="6" 
                      value={counterTeamSize} 
                      onChange={(e) => setCounterTeamSize(Number(e.target.value))}
                      className="size-slider"
                    />
                </div>
                <div className="setting-row" style={{marginTop: '0.5rem'}}>
                     <label htmlFor="allow-legendaries" className="checkbox-label">
                        <input 
                          id="allow-legendaries" 
                          type="checkbox" 
                          checked={allowLegendaries} 
                          onChange={(e) => setAllowLegendaries(e.target.checked)}
                        />
                        <div className="checkbox-custom"></div>
                        Allow Legendaries
                     </label>
                </div>
              </div>
          ) : (
              <div className="settings-panel" style={{textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                 Pick exactly 2 Pokemon from the Pokedex to simulate an AI esports matchup.
              </div>
          )}

          <button 
            className="action-btn"
            disabled={team.length === 0 || analyzing || (appMode === 'compare' && team.length !== 2)}
            onClick={handleAction}
          >
            {analyzing 
               ? <Loader2 className="spinner" style={{width: 20, height: 20, margin: 0, border: 'none' }} /> 
               : (appMode === 'compare' ? <Swords size={20} /> : <Sparkles size={20} />)
            }
            {analyzing ? 'Processing...' : (appMode === 'compare' ? 'Analyze Duel' : 'Generate Counter')}
          </button>

          {error && (
            <div style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {appMode === 'counter' && counterPokemons.length > 0 && (
            <div className="groq-analysis">
              <h3><BrainCircuit size={20} /> Recommended Counter-Team</h3>
              
              <div className="counter-grid">
                {counterPokemons.map((cp, idx) => (
                  <div 
                    key={idx} 
                    className="counter-card"
                    onClick={(e) => openDetails(e, cp, true)}
                  >
                    <div className="pokemon-card-header">
                       <span className="pokemon-id">{cp.data ? `#${cp.data.id.toString().padStart(3,'0')}` : ''}</span>
                       <button className="more-btn" style={{ right: 8, top: 4 }}>
                         <MoreVertical size={14} />
                       </button>
                    </div>
                    {cp.data ? (
                       <img src={cp.data.image} alt={cp.name} className="counter-image" />
                    ) : (
                       <div className="counter-fallback">{cp.name}</div>
                    )}
                    <div className="counter-name">{cp.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Loading Details Overlay */}
      {loadingDetails && (
         <div className="modal-overlay">
            <Loader2 className="spinner" style={{width: 80, height: 80, border: 'none'}} />
         </div>
      )}

      {/* Compare Modal Split Screen */}
      {comparisonData && (
        <div className="modal-overlay" onClick={() => setComparisonData(null)}>
           <div className="vs-modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setComparisonData(null)}>
                <X size={20} />
              </button>
              
              <div className="vs-header">
                  <div className="vs-fighter">
                     <img src={comparisonData.p1.image} alt="p1" />
                     <h2>{comparisonData.p1.name}</h2>
                  </div>
                  <div className="vs-badge">VS</div>
                  <div className="vs-fighter">
                     <img src={comparisonData.p2.image} alt="p2" />
                     <h2>{comparisonData.p2.name}</h2>
                  </div>
              </div>

              <div className="vs-body-scroll">
                  <div className="modal-section ai-reasoning" style={{textAlign: 'center'}}>
                     <h3 style={{justifyContent: 'center', color: '#c084fc'}}><Swords size={18} /> Match Verdict</h3>
                     <p style={{borderRadius: '0.5rem', borderLeft: 'none', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.4)'}}>
                        {comparisonData.analysis.verdict}
                     </p>
                  </div>

                  <div className="modal-section ai-reasoning">
                     <h3><BrainCircuit size={18} /> Strategic Breakdown</h3>
                     <p>{comparisonData.analysis.strategic_breakdown}</p>
                  </div>

                  <div className="vs-pros-cons">
                      <div className="fighter-pros-cons" style={{background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
                         <h4 style={{color: '#60a5fa', marginBottom: '1rem', textTransform: 'capitalize'}}>{comparisonData.p1.name} Synergy</h4>
                         <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5}}>
                           {comparisonData.analysis.pokemon1_pros_cons.map((line, i) => (
                              <li key={i} style={{marginBottom: '0.5rem', display: 'flex', gap: '0.5rem'}}>
                                  <span style={{color: line.startsWith('Pro') ? '#10b981' : '#ef4444'}}>•</span> {line}
                              </li>
                           ))}
                         </ul>
                      </div>
                      <div className="fighter-pros-cons" style={{background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                         <h4 style={{color: '#f87171', marginBottom: '1rem', textTransform: 'capitalize'}}>{comparisonData.p2.name} Synergy</h4>
                         <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5}}>
                           {comparisonData.analysis.pokemon2_pros_cons.map((line, i) => (
                              <li key={i} style={{marginBottom: '0.5rem', display: 'flex', gap: '0.5rem'}}>
                                  <span style={{color: line.startsWith('Pro') ? '#10b981' : '#ef4444'}}>•</span> {line}
                              </li>
                           ))}
                         </ul>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Grid Detail Modal Overlay */}
      {detailedPokemon && detailedPokemon.data && (
        <div className="modal-overlay" onClick={() => setDetailedPokemon(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDetailedPokemon(null)}>
              <X size={20} />
            </button>
            
            <div className="modal-header">
              <img src={detailedPokemon.data.image} alt={detailedPokemon.data.name} className="modal-image" />
              <div>
                <span className="pokemon-id-tag">#{detailedPokemon.data.id.toString().padStart(3, '0')}</span>
                <h2>{detailedPokemon.data.name}</h2>
                <div className="pokemon-types" style={{justifyContent: 'flex-start', marginTop: '0.5rem'}}>
                  {detailedPokemon.data.types.map(type => (
                    <span key={type} className="type-badge">{type}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-body-scroll">
                {detailedPokemon.type === 'counter' && detailedPokemon.reason && (
                  <div className="modal-section ai-reasoning">
                    <h3><Info size={16} /> Strategy Explanation</h3>
                    <p>{detailedPokemon.reason}</p>
                  </div>
                )}
    
                <div className="modal-section physical-stats">
                   <h3><Database size={16} /> Data</h3>
                   <div className="data-grid">
                      <div className="data-item">
                        <span className="data-label">Height</span>
                        <span className="data-val">{detailedPokemon.data.height / 10} m</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Weight</span>
                        <span className="data-val">{detailedPokemon.data.weight / 10} kg</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Base XP</span>
                        <span className="data-val">{detailedPokemon.data.base_experience || 'N/A'}</span>
                      </div>
                   </div>
                      
                   <div style={{marginTop: '1rem'}}>
                     <span className="data-label" style={{display: 'block', marginBottom: '0.4rem'}}>Abilities</span>
                     <div className="abilities-list">
                       {detailedPokemon.data.abilities && detailedPokemon.data.abilities.map(a => (
                         <span key={a.name} className={`ability-badge ${a.is_hidden ? 'hidden-ability' : ''}`}>
                           {a.name.replace('-', ' ')} {a.is_hidden && <small>(Hidden)</small>}
                         </span>
                       ))}
                     </div>
                   </div>
                   
                   {detailedPokemon.data.cry && (
                     <button className="cry-btn" onClick={() => {
                        const audio = new Audio(detailedPokemon.data.cry);
                        audio.volume = 0.3;
                        audio.play();
                     }}>
                        <Volume2 size={16} /> Play Audio Cry
                     </button>
                   )}
                </div>

                <div className="modal-section stats-section">
                  <h3><Activity size={16} /> Base Stats</h3>
                  <div className="stats-list">
                      {detailedPokemon.data.stats && detailedPokemon.data.stats.map(stat => (
                          <div key={stat.name} className="stat-row">
                             <span className="stat-name">{stat.name.replace('-', ' ')}</span>
                             <div className="stat-bar-container">
                                <div className="stat-bar" style={{ width: `${Math.min(100, (stat.value / 200) * 100)}%` }}></div>
                             </div>
                             <span className="stat-value">{stat.value}</span>
                          </div>
                      ))}
                  </div>
                </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
