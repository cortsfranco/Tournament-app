import React, { useState, useEffect, useCallback } from 'react';
import { TournamentState, Team, TournamentStatus, Sport, Match, TournamentAction } from './types';
import { tournamentReducer } from './hooks/useTournament';
import TeamSetup from './components/TeamSetup';
import TournamentView from './components/TournamentView';
import Dashboard from './components/Dashboard';

const STORAGE_KEY = 'tournamentsApp';

const loadTournaments = (): TournamentState[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load tournaments:", e);
        return [];
    }
};

const saveTournaments = (tournaments: TournamentState[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
    } catch (e) {
        console.error("Failed to save tournaments:", e);
    }
};

const EditTournamentModal: React.FC<{
  tournament: TournamentState;
  onClose: () => void;
  onSave: (details: { name: string; sport: Sport }) => void;
}> = ({ tournament, onClose, onSave }) => {
  const [name, setName] = useState(tournament.name);
  const [sport, setSport] = useState(tournament.sport);

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name: name.trim(), sport });
      onClose();
    } else {
      alert('El nombre del torneo no puede estar vacío.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Editar Torneo</h2>
        <div className="mb-6">
          <label htmlFor="tournamentName" className="block text-lg font-semibold text-gray-300 mb-2">Nombre del Torneo</label>
          <input
            id="tournamentName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-300 mb-4">Deporte</label>
          <div className="flex space-x-4">
            <button type="button" onClick={() => setSport(Sport.GENERAL)} className={`flex-1 p-4 rounded-lg font-semibold transition-all duration-200 ${sport === Sport.GENERAL ? 'bg-teal-500 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              Futsal / Baloncesto / Balonmano
            </button>
            <button type="button" onClick={() => setSport(Sport.VOLLEYBALL)} className={`flex-1 p-4 rounded-lg font-semibold transition-all duration-200 ${sport === Sport.VOLLEYBALL ? 'bg-teal-500 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              Voleibol
            </button>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
          <button onClick={handleSave} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};


const ScoreModal: React.FC<{
  match: Match | null;
  matchType: 'group' | 'playoff';
  sport: Sport;
  team1Name: string;
  team2Name: string;
  onClose: () => void;
  onSave: (scores: Omit<Match, 'id' | 'team1Id' | 'team2Id' | 'played' | 'round'>) => void;
  onForceWin: (winnerId: number) => void;
}> = ({ match, matchType, sport, team1Name, team2Name, onClose, onSave, onForceWin }) => {
    const [team1Score, setTeam1Score] = useState(match?.team1Score ?? 0);
    const [team2Score, setTeam2Score] = useState(match?.team2Score ?? 0);
    const [team1GreenCards, setTeam1GreenCards] = useState(match?.team1GreenCards ?? 0);
    const [team2GreenCards, setTeam2GreenCards] = useState(match?.team2GreenCards ?? 0);
    const [team1SetScores, setTeam1SetScores] = useState<string[]>(match?.team1SetScores.map(String) ?? Array(5).fill(''));
    const [team2SetScores, setTeam2SetScores] = useState<string[]>(match?.team2SetScores.map(String) ?? Array(5).fill(''));

    if (!match) return null;

    const handleSave = () => {
        let scoresPayload: Omit<Match, 'id' | 'team1Id' | 'team2Id' | 'played' | 'round'>;

        if (sport === Sport.VOLLEYBALL) {
            const parsedTeam1Sets = team1SetScores.map(s => parseInt(s, 10)).filter(s => !isNaN(s));
            const parsedTeam2Sets = team2SetScores.map(s => parseInt(s, 10)).filter(s => !isNaN(s));
            let t1SetsWon = 0;
            let t2SetsWon = 0;
            for(let i=0; i < Math.min(parsedTeam1Sets.length, parsedTeam2Sets.length); i++) {
                if (parsedTeam1Sets[i] > parsedTeam2Sets[i]) t1SetsWon++;
                else t2SetsWon++;
            }
            scoresPayload = {
                team1Score: t1SetsWon, team2Score: t2SetsWon,
                team1SetScores: parsedTeam1Sets, team2SetScores: parsedTeam2Sets,
                team1GreenCards, team2GreenCards,
            };
        } else {
             scoresPayload = {
                team1Score, team2Score,
                team1SetScores: [], team2SetScores: [],
                team1GreenCards, team2GreenCards,
            };
        }
        onSave(scoresPayload);
        onClose();
    };
    
    const CardInputRow: React.FC<{team: string, value: number, onChange: (v:number) => void, color: string}> = ({team, value, onChange, color}) => (
         <div className="flex justify-between items-center">
            <label className="text-lg">{team}</label>
            <input type="number" min="0" value={value} onChange={e => onChange(parseInt(e.target.value, 10) || 0)} className={`bg-gray-700 text-white p-2 rounded w-24 text-center border-2 ${color}`}/>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-lg border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center">{team1Name} vs {team2Name}</h2>
                {sport === Sport.GENERAL ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-lg">{team1Name} Puntos</label>
                            <input type="number" value={team1Score} onChange={e => setTeam1Score(parseInt(e.target.value, 10))} className="bg-gray-700 text-white p-2 rounded w-24 text-center"/>
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-lg">{team2Name} Puntos</label>
                            <input type="number" value={team2Score} onChange={e => setTeam2Score(parseInt(e.target.value, 10))} className="bg-gray-700 text-white p-2 rounded w-24 text-center"/>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 items-center text-center mb-4">
                            <span className="font-semibold">{team1Name}</span>
                            <span className="text-gray-400">Set</span>
                            <span className="font-semibold">{team2Name}</span>
                        </div>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-3 gap-x-4 gap-y-2 items-center mb-2">
                                <input type="number" placeholder="0" value={team1SetScores[i]} onChange={e => { const newScores = [...team1SetScores]; newScores[i] = e.target.value; setTeam1SetScores(newScores); }} className="bg-gray-700 text-white p-2 rounded text-center"/>
                                <span className="text-gray-400 text-center">{i + 1}</span>
                                <input type="number" placeholder="0" value={team2SetScores[i]} onChange={e => { const newScores = [...team2SetScores]; newScores[i] = e.target.value; setTeam2SetScores(newScores); }} className="bg-gray-700 text-white p-2 rounded text-center"/>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-6 border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold mb-4 text-center text-gray-300">Tarjetas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-3">
                            <CardInputRow team={team1Name} value={team1GreenCards} onChange={setTeam1GreenCards} color="border-green-500/50" />
                        </div>
                        <div className="space-y-3">
                           <CardInputRow team={team2Name} value={team2GreenCards} onChange={setTeam2GreenCards} color="border-green-500/50" />
                        </div>
                    </div>
                </div>
                 {matchType === 'playoff' && (
                    <div className="mt-6 border-t border-gray-700 pt-6">
                        <h3 className="text-xl font-semibold mb-4 text-center text-gray-300">Anulación Manual</h3>
                        <p className="text-center text-gray-400 text-sm mb-4">Designa un ganador manualmente. Útil para descalificaciones.</p>
                        <div className="flex justify-around gap-4">
                            <button onClick={() => onForceWin(match.team1Id)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors">Forzar Victoria para {team1Name}</button>
                            <button onClick={() => onForceWin(match.team2Id)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors">Forzar Victoria para {team2Name}</button>
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
                    <button onClick={handleSave} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded">Guardar</button>
                </div>
            </div>
        </div>
    );
};

function App() {
  const [tournaments, setTournaments] = useState<TournamentState[]>(loadTournaments);
  const [view, setView] = useState<'dashboard' | 'setup' | 'tournament'>('dashboard');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ match: Match; type: 'group' | 'playoff' } | null>(null);
  const [isEditTournamentModalOpen, setIsEditTournamentModalOpen] = useState(false);


  useEffect(() => {
    saveTournaments(tournaments);
  }, [tournaments]);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);

  const dispatchForTournament = (tournamentId: string, action: TournamentAction) => {
    setTournaments(prev =>
      prev.map(t =>
        t.id === tournamentId ? tournamentReducer(t, action) : t
      )
    );
  };
  
  const handleNewTournament = () => setView('setup');
  
  const handleBackToDashboard = () => {
    setActiveTournamentId(null);
    setView('dashboard');
  };
  
  const handleSetupTournament = (payload: { name: string; teams: string[]; sport: Sport }) => {
    const newTournamentId = Date.now().toString();
    
    let newTournament: TournamentState = {
        id: newTournamentId,
        name: payload.name,
        sport: payload.sport,
        teams: [],
        groups: [],
        status: TournamentStatus.SETUP,
        playoff: null,
    };
    
    newTournament = tournamentReducer(newTournament, {
        type: 'SETUP_TOURNAMENT',
        payload: { teams: payload.teams, sport: payload.sport }
    });

    setTournaments(prev => [...prev, newTournament]);
    setActiveTournamentId(newTournamentId);
    setView('tournament');
  };

  const handleViewTournament = (id: string) => {
    setActiveTournamentId(id);
    setView('tournament');
  };

  const handleDeleteTournament = (id: string) => {
    setTournaments(prev => prev.filter(t => t.id !== id));
    if (activeTournamentId === id) {
      handleBackToDashboard();
    }
  };

  const getTeamById = useCallback((id: number): Team | undefined => {
    return activeTournament?.teams.find(t => t.id === id);
  }, [activeTournament]);

  const handleUpdateMatch = (match: Match, matchType: 'group' | 'playoff') => {
    setSelectedMatch({ match, type: matchType });
    setIsScoreModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsScoreModalOpen(false);
    setSelectedMatch(null);
  };

  const handleSaveScore = (scores: Omit<Match, 'id' | 'team1Id' | 'team2Id' | 'played' | 'round'>) => {
    if (selectedMatch && activeTournamentId) {
        dispatchForTournament(activeTournamentId, { 
            type: 'UPDATE_MATCH_SCORE', 
            payload: { matchId: selectedMatch.match.id, scores, matchType: selectedMatch.type } 
        });
    }
  };
  
  const handleGeneratePlayoffs = () => {
    if (activeTournamentId) {
        dispatchForTournament(activeTournamentId, { type: 'GENERATE_PLAYOFFS' });
    }
  };

  const handleEditTournament = () => {
    setIsEditTournamentModalOpen(true);
  };

  const handleSaveTournamentDetails = (details: { name: string, sport: Sport }) => {
    if (activeTournamentId) {
      dispatchForTournament(activeTournamentId, {
        type: 'EDIT_TOURNAMENT_DETAILS',
        payload: details
      });
    }
  };

  const handleForceWin = (winnerId: number) => {
    if (selectedMatch && activeTournamentId) {
      dispatchForTournament(activeTournamentId, {
        type: 'OVERRIDE_PLAYOFF_WINNER',
        payload: { matchId: selectedMatch.match.id, winnerId }
      });
      handleCloseModal();
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'setup':
        return <TeamSetup onSetupTournament={handleSetupTournament} onBack={handleBackToDashboard} />;
      case 'tournament':
        if (activeTournament) {
          return <TournamentView 
                    tournament={activeTournament} 
                    getTeamById={getTeamById} 
                    onUpdateMatch={handleUpdateMatch} 
                    onGeneratePlayoffs={handleGeneratePlayoffs} 
                    dispatch={(action) => dispatchForTournament(activeTournament.id, action)}
                    onBackToDashboard={handleBackToDashboard}
                    onEditTournament={handleEditTournament}
                 />;
        }
        handleBackToDashboard(); // Fallback if active tournament not found
        return null;
      case 'dashboard':
      default:
        return <Dashboard 
                  tournaments={tournaments}
                  onNewTournament={handleNewTournament}
                  onViewTournament={handleViewTournament}
                  onDeleteTournament={handleDeleteTournament}
                  onImportTournament={handleSetupTournament}
               />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      {renderContent()}
      {isScoreModalOpen && selectedMatch && activeTournament && (
        <ScoreModal
          match={selectedMatch.match}
          matchType={selectedMatch.type}
          sport={activeTournament.sport}
          team1Name={getTeamById(selectedMatch.match.team1Id)?.name ?? 'Equipo 1'}
          team2Name={getTeamById(selectedMatch.match.team2Id)?.name ?? 'Equipo 2'}
          onClose={handleCloseModal}
          onSave={handleSaveScore}
          onForceWin={handleForceWin}
        />
      )}
      {isEditTournamentModalOpen && activeTournament && (
        <EditTournamentModal 
            tournament={activeTournament}
            onClose={() => setIsEditTournamentModalOpen(false)}
            onSave={handleSaveTournamentDetails}
        />
      )}
    </div>
  );
}

export default App;
