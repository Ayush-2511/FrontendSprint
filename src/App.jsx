import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchAllGen3Pokemons, fetchPokemonByName, fetchStatBatch } from './services/pokeApi';
import { analyzeTeam, comparePokemons, compareTeams } from './services/groqApi';
import { BrainCircuit, Loader2, Sparkles, X, Info, Activity, Volume2, Database, Search, ArrowDownAZ, Filter, Swords, ShieldHalf, Users, BookOpen } from 'lucide-react';
import './App.css';

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('id-asc');
  const [typeFilter, setTypeFilter] = useState('all');

  // Stat cache for sort (loaded in background)
  const [statCache, setStatCache] = useState({});
  const statLoadedRef = useRef(false);

  const [team, setTeam] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [draftingTarget, setDraftingTarget] = useState('A');
  
  // Modes
  const [appMode, setAppMode] = useState('counter'); // 'counter', 'compare', 'team_compare'

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
      // Kick off background stat fetch once list is ready
      if (!statLoadedRef.current) {
        statLoadedRef.current = true;
        fetchStatBatch(data.map(p => p.id), (partial) => setStatCache(partial));
      }
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
    
    const STAT_MAP = {
      'hp-asc':      (a, b) => (statCache[a.id]?.hp || 0) - (statCache[b.id]?.hp || 0),
      'hp-desc':     (a, b) => (statCache[b.id]?.hp || 0) - (statCache[a.id]?.hp || 0),
      'atk-asc':     (a, b) => (statCache[a.id]?.attack || 0) - (statCache[b.id]?.attack || 0),
      'atk-desc':    (a, b) => (statCache[b.id]?.attack || 0) - (statCache[a.id]?.attack || 0),
      'def-asc':     (a, b) => (statCache[a.id]?.defense || 0) - (statCache[b.id]?.defense || 0),
      'def-desc':    (a, b) => (statCache[b.id]?.defense || 0) - (statCache[a.id]?.defense || 0),
      'spatk-asc':   (a, b) => (statCache[a.id]?.['special-attack'] || 0) - (statCache[b.id]?.['special-attack'] || 0),
      'spatk-desc':  (a, b) => (statCache[b.id]?.['special-attack'] || 0) - (statCache[a.id]?.['special-attack'] || 0),
      'spdef-asc':   (a, b) => (statCache[a.id]?.['special-defense'] || 0) - (statCache[b.id]?.['special-defense'] || 0),
      'spdef-desc':  (a, b) => (statCache[b.id]?.['special-defense'] || 0) - (statCache[a.id]?.['special-defense'] || 0),
      'spd-asc':     (a, b) => (statCache[a.id]?.speed || 0) - (statCache[b.id]?.speed || 0),
      'spd-desc':    (a, b) => (statCache[b.id]?.speed || 0) - (statCache[a.id]?.speed || 0),
      'total-asc':   (a, b) => (statCache[a.id]?.total || 0) - (statCache[b.id]?.total || 0),
      'total-desc':  (a, b) => (statCache[b.id]?.total || 0) - (statCache[a.id]?.total || 0),
    };

    result = [...result].sort((a, b) => {
       if (sortOrder === 'id-asc')   return a.id - b.id;
       if (sortOrder === 'id-desc')  return b.id - a.id;
       if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
       if (sortOrder === 'name-desc')return b.name.localeCompare(a.name);
       if (STAT_MAP[sortOrder])      return STAT_MAP[sortOrder](a, b);
       return 0;
    });
    
    return result;
  }, [pokemons, searchTerm, typeFilter, sortOrder, statCache]);

  const toggleMode = (mode) => {
    setAppMode(mode);
    setTeam([]);
    setTeamB([]);
    setDraftingTarget('A');
    setCounterPokemons([]);
    setComparisonData(null);
    setError(null);
  };

  const togglePokemon = (pokemon, forceTarget = null) => {
    if (appMode === 'team_compare') {
      const target = forceTarget || draftingTarget;
      if (target === 'A') {
        setTeam(prev => {
          const isSelected = prev.find(p => p.id === pokemon.id);
          if (isSelected) return prev.filter(p => p.id !== pokemon.id);
          if (prev.length >= 6) return prev;
          return [...prev, pokemon];
        });
      } else {
        setTeamB(prev => {
          const isSelected = prev.find(p => p.id === pokemon.id);
          if (isSelected) return prev.filter(p => p.id !== pokemon.id);
          if (prev.length >= 6) return prev;
          return [...prev, pokemon];
        });
      }
    } else {
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
    }
  };

  const handleAction = async () => {
    if (appMode === 'team_compare' && (team.length === 0 || teamB.length === 0)) return;
    if (appMode !== 'team_compare' && team.length === 0) return;
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
        } else if (appMode === 'compare') {
            if (team.length !== 2) throw new Error("Please select exactly 2 Pokemon to duel.");
            setComparisonData(null);
            
            const result = await comparePokemons(team[0], team[1]);
            const p1Data = await fetchPokemonByName(team[0].name);
            const p2Data = await fetchPokemonByName(team[1].name);
            
            setComparisonData({
                type: 'single',
                p1: p1Data,
                p2: p2Data,
                analysis: result
            });
        } else if (appMode === 'team_compare') {
            setComparisonData(null);
            const result = await compareTeams(team, teamB);
            
            setComparisonData({
                type: 'team',
                teamA: team,
                teamB: teamB,
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

  // Custom Dropdown Component
  const CustomSelect = ({ value, onChange, options, icon: Icon, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
      <div className="custom-select-container" ref={dropdownRef}>
        <div className={`custom-select-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
          {Icon && <Icon size={16} />}
          <span className="selected-label">{selectedOption.label}</span>
          <svg className={`chevron ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {isOpen && (
          <div className="custom-select-options">
            {options.map((opt) => (
              <div 
                key={opt.value} 
                className={`custom-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const limitConfig = appMode === 'counter' ? 6 : (appMode === 'compare' ? 2 : 6);

  const getHeaderTitle = () => {
     if (appMode === 'counter') return 'Smart Counter-Team Builder';
     if (appMode === 'compare') return 'Hypothetical Duel Analyst';
     return 'Team Warfare Matchup';
  };

  const getHeaderSubtitle = () => {
     if (appMode === 'counter') return "Select the Opponent's Pokemon team (up to 6) to generate a flawless Counter-Team";
     if (appMode === 'compare') return "Select exactly 2 Pokemon to analyze their hypothetical duel Matchup";
     return "Draft two Pokemon teams (up to 6 each) to simulate a full roster vs roster battle.";
  };

  return (
    <div className="app-container">
      <main>
        <div className="header">
          <div className="header-topbar">POKÉMON // AI BATTLE SYSTEM v2.0</div>
          <h1>
            {getHeaderTitle()}
          </h1>
          <p>{getHeaderSubtitle()}</p>
        </div>

        <div className="filter-header">
           <div className="search-bar">
             <Search size={18} />
             <input type="text" placeholder="Search name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           
           <div className="filter-controls">
             <CustomSelect 
               value={typeFilter} 
               onChange={setTypeFilter}
               icon={Filter}
               options={[
                 { value: 'all', label: 'All Types' },
                 { value: 'normal', label: 'Normal' },
                 { value: 'fire', label: 'Fire' },
                 { value: 'water', label: 'Water' },
                 { value: 'grass', label: 'Grass' },
                 { value: 'electric', label: 'Electric' },
                 { value: 'ice', label: 'Ice' },
                 { value: 'fighting', label: 'Fighting' },
                 { value: 'poison', label: 'Poison' },
                 { value: 'ground', label: 'Ground' },
                 { value: 'flying', label: 'Flying' },
                 { value: 'psychic', label: 'Psychic' },
                 { value: 'bug', label: 'Bug' },
                 { value: 'rock', label: 'Rock' },
                 { value: 'ghost', label: 'Ghost' },
                 { value: 'dragon', label: 'Dragon' },
                 { value: 'dark', label: 'Dark' },
                 { value: 'steel', label: 'Steel' },
                 { value: 'fairy', label: 'Fairy' },
               ]}
             />

             <CustomSelect 
               value={sortOrder} 
               onChange={setSortOrder}
               icon={ArrowDownAZ}
               options={[
                 { value: 'id-asc', label: 'Lowest ID' },
                 { value: 'id-desc', label: 'Highest ID' },
                 { value: 'name-asc', label: 'A - Z' },
                 { value: 'name-desc', label: 'Z - A' },
                 { value: 'total-desc', label: 'Stat Total (High)' },
                 { value: 'total-asc', label: 'Stat Total (Low)' },
                 { value: 'hp-desc', label: 'HP (High)' },
                 { value: 'atk-desc', label: 'Attack (High)' },
                 { value: 'def-desc', label: 'Defense (High)' },
                 { value: 'spatk-desc', label: 'Sp. Atk (High)' },
                 { value: 'spdef-desc', label: 'Sp. Def (High)' },
                 { value: 'spd-desc', label: 'Speed (High)' },
               ]}
             />
           </div>
        </div>

        <div className="poke-grid-panel">
          {loadingList ? (
            <div className="loader-container" style={{marginTop: '4rem'}}>
              <Loader2 className="spinner" style={{width: 50, height: 50, border: 'none'}} />
              <p style={{fontSize: '0.85rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)'}}>BOOTING POKÉDEX DATABASE...</p>
            </div>
          ) : (
            <div className="pokemons-grid">
              {filteredAndSortedPokemons.map((pokemon) => {
                const isSelectedA = team.find(p => p.id === pokemon.id);
                const isSelectedB = teamB.find(p => p.id === pokemon.id);
                
                let isSelected = false;
                let isDisabled = false;
                let teamClass = '';

                if (appMode === 'team_compare') {
                  if (draftingTarget === 'A') {
                    isSelected = isSelectedA;
                    isDisabled = !isSelected && team.length >= 6;
                    teamClass = isSelected ? 'selected-team-a' : (isSelectedB ? 'selected-team-b-inactive' : '');
                  } else {
                    isSelected = isSelectedB;
                    isDisabled = !isSelected && teamB.length >= 6;
                    teamClass = isSelected ? 'selected-team-b' : (isSelectedA ? 'selected-team-a-inactive' : '');
                  }
                } else {
                  isSelected = isSelectedA;
                  isDisabled = !isSelected && team.length >= limitConfig;
                  teamClass = isSelected ? 'selected' : '';
                }
                
                return (
                  <div 
                    key={pokemon.id}
                    className={`pokemon-card ${teamClass} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!isDisabled || isSelected) togglePokemon(pokemon);
                    }}
                  >
                    <div className="pokemon-card-header">
                       <span className="pokemon-id">#{pokemon.id.toString().padStart(3, '0')}</span>
                       <button className="pokeball-override-btn" onClick={(e) => openDetails(e, pokemon, false)} title="View Details">
                         {/* POKEBALL SVG PLACEHOLDER — drop your SVG here */}
                         <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                           <circle cx="12" cy="12" r="10"/>
                           <line x1="2" y1="12" x2="22" y2="12"/>
                           <circle cx="12" cy="12" r="3" fill="currentColor"/>
                         </svg>
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
        </div>
      </main>

      <aside>
        <div className="team-sidebar">
          <div className="sidebar-header">
            <div className="mode-tabs">
               <button className={`mode-tab ${appMode === 'counter' ? 'active' : ''}`} onClick={() => toggleMode('counter')}>
                 <ShieldHalf size={16} /> Builder
               </button>
               <button className={`mode-tab ${appMode === 'compare' ? 'active' : ''}`} onClick={() => toggleMode('compare')}>
                 <Swords size={16} /> Duel
               </button>
               <button className={`mode-tab ${appMode === 'team_compare' ? 'active' : ''}`} onClick={() => toggleMode('team_compare')}>
                 <Users size={16} /> Teams
               </button>
            </div>
          </div>

          <div className="sidebar-inner">
            <h2>
              {appMode === 'counter' ? "Opponent's Team" : (appMode === 'compare' ? "Duel Matchup" : "Draft Teams")}
              {appMode !== 'team_compare' && <span className="team-count">{team.length} / {limitConfig}</span>}
            </h2>
            
            {appMode === 'team_compare' ? (
              <div className="team-split-draft">
                 <div className={`draft-side ${draftingTarget === 'A' ? 'active' : ''}`} onClick={() => setDraftingTarget('A')}>
                   <h3 style={{display: 'flex', justifyContent: 'space-between'}}>Team A <span className="team-count">{team.length} / 6</span></h3>
                   <div className="selected-slots" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      {Array.from({ length: 6 }).map((_, i) => {
                        const p = team[i];
                        return (
                          <div key={i} className={`selected-slot ${p ? 'filled' : ''}`}>
                            {p && (
                              <>
                                <img src={p.image} alt={p.name} />
                                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); togglePokemon(p, 'A'); }}>
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                   </div>
                 </div>
                 
                 <div className={`draft-side ${draftingTarget === 'B' ? 'active' : ''}`} onClick={() => setDraftingTarget('B')} style={{marginTop: '1.5rem'}}>
                   <h3 style={{display: 'flex', justifyContent: 'space-between'}}>Team B <span className="team-count">{teamB.length} / 6</span></h3>
                   <div className="selected-slots" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      {Array.from({ length: 6 }).map((_, i) => {
                        const p = teamB[i];
                        return (
                          <div key={i} className={`selected-slot ${p ? 'filled' : ''}`}>
                            {p && (
                              <>
                                <img src={p.image} alt={p.name} />
                                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); togglePokemon(p, 'B'); }}>
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                   </div>
                 </div>
              </div>
            ) : (
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
            )}

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
            ) : (appMode === 'compare' ? (
                <div className="settings-panel" style={{textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                   Pick exactly 2 Pokemon from the Pokedex to simulate an AI esports matchup.
                </div>
            ) : (
                <div className="settings-panel" style={{textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                   Draft 1 to 6 Pokemon per team for analysis. Click Team A or Team B above to focus drafting.
                </div>
            ))}

            <button 
              className="action-btn"
              disabled={
                 (appMode === 'team_compare' && (team.length === 0 || teamB.length === 0)) ||
                 (appMode !== 'team_compare' && team.length === 0) || 
                 analyzing || 
                 (appMode === 'compare' && team.length !== 2)
              }
              onClick={handleAction}
            >
              {analyzing 
                 ? <Loader2 className="spinner" style={{width: 20, height: 20, margin: 0, border: 'none' }} /> 
                 : (appMode === 'compare' ? <Swords size={20} /> : (appMode === 'team_compare' ? <Users size={20} /> : <Sparkles size={20} />))
              }
              {analyzing ? 'Processing...' : (appMode === 'compare' ? 'Analyze Duel' : (appMode === 'team_compare' ? 'Analyze Teams' : 'Generate Counter'))}
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
        </div>
      </aside>

      {/* Loading Details Overlay */}
      {loadingDetails && (
         <div className="modal-overlay">
            <Loader2 className="spinner" style={{width: 80, height: 80, border: 'none'}} />
         </div>
      )}

      {/* Compare Modal Split Screen */}
      {comparisonData && comparisonData.type === 'single' && (
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

                  <div className="modal-section">
                     <h3><Activity size={18} /> Base Stats Comparison</h3>
                     <div className="modal-stats-comparison">
                        {comparisonData.p1.stats.map((s1, index) => {
                           const s2 = comparisonData.p2.stats.find(s => s.name === s1.name);
                           if (!s2) return null;
                           const diff = s1.value - s2.value;
                           const diffP1 = diff > 0 ? `(+${diff})` : (diff < 0 ? `(${diff})` : '');
                           const diffP2 = diff < 0 ? `(+${Math.abs(diff)})` : (diff > 0 ? `(-${diff})` : '');
                           return (
                             <div key={s1.name} className="stat-comp-row">
                                <div className="stat-comp-val p1">
                                   {s1.value} <span className={diff > 0 ? 'stat-diff-positive' : (diff < 0 ? 'stat-diff-negative' : 'stat-diff-zero')}>{diffP1}</span>
                                </div>
                                <div className="stat-comp-name">{s1.name.replace('-', ' ')}</div>
                                <div className="stat-comp-val p2">
                                   <span className={diff < 0 ? 'stat-diff-positive' : (diff > 0 ? 'stat-diff-negative' : 'stat-diff-zero')}>{diffP2}</span> {s2.value}
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="vs-pros-cons" style={{marginTop: '2rem'}}>
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

      {/* Team Compare Modal */}
      {comparisonData && comparisonData.type === 'team' && (
        <div className="modal-overlay" onClick={() => setComparisonData(null)}>
           <div className="vs-modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setComparisonData(null)}>
                <X size={20} />
              </button>
              
              <div className="vs-header">
                  <div className="vs-fighter">
                     <h2>Team A</h2>
                     <div className="pokemon-types" style={{gap: '0.2rem'}}>
                       {comparisonData.teamA.map(p => <img key={p.id} src={p.image} style={{width: 40, height: 40}} alt={p.name} title={p.name} />)}
                     </div>
                  </div>
                  <div className="vs-badge">VS</div>
                  <div className="vs-fighter">
                     <h2>Team B</h2>
                     <div className="pokemon-types" style={{gap: '0.2rem'}}>
                       {comparisonData.teamB.map(p => <img key={p.id} src={p.image} style={{width: 40, height: 40}} alt={p.name} title={p.name} />)}
                     </div>
                  </div>
              </div>

              <div className="vs-body-scroll">
                  <div className="modal-section ai-reasoning" style={{textAlign: 'center'}}>
                     <h3 style={{justifyContent: 'center', color: '#c084fc'}}><Users size={18} /> Match Verdict</h3>
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
                         <h4 style={{color: '#60a5fa', marginBottom: '1rem', textTransform: 'capitalize'}}>Team A Synergy</h4>
                         <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5}}>
                           {comparisonData.analysis.team1_pros_cons && comparisonData.analysis.team1_pros_cons.map((line, i) => (
                              <li key={i} style={{marginBottom: '0.5rem', display: 'flex', gap: '0.5rem'}}>
                                  <span style={{color: line.startsWith('Pro') ? '#10b981' : '#ef4444'}}>•</span> {line}
                              </li>
                           ))}
                         </ul>
                      </div>
                      <div className="fighter-pros-cons" style={{background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                         <h4 style={{color: '#f87171', marginBottom: '1rem', textTransform: 'capitalize'}}>Team B Synergy</h4>
                         <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5}}>
                           {comparisonData.analysis.team2_pros_cons && comparisonData.analysis.team2_pros_cons.map((line, i) => (
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
                {detailedPokemon.data.genus && (
                  <div className="pokemon-genus" style={{fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem'}}>
                    {detailedPokemon.data.genus}
                  </div>
                )}
                {detailedPokemon.data.flavorText && (
                  <div className="modal-section flavor-text" style={{marginBottom: '1.5rem', borderLeft: '3px solid var(--accent)', paddingLeft: '1rem', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.9}}>
                    {detailedPokemon.data.flavorText}
                  </div>
                )}
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
