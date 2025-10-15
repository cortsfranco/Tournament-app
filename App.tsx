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

const ScoreModal: React.FC<{
  match: Match | null;
  sport: Sport;
  team1Name: string;
  team2Name: string;
  onClose: () => void;
  onSave: (scores: Omit<Match, 'id' | 'team1Id' | 'team2Id' | 'played' | 'round'>) => void;
}> = ({ match, sport, team1Name, team2Name, onClose, onSave }) => {
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

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ match: Match; type: 'group' | 'playoff' } | null>(null);

  const handleUpdateMatch = (match: Match, matchType: 'group' | 'playoff') => {
    setSelectedMatch({ match, type: matchType });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
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
      {modalOpen && selectedMatch && activeTournament && (
        <ScoreModal
          match={selectedMatch.match}
          sport={activeTournament.sport}
          team1Name={getTeamById(selectedMatch.match.team1Id)?.name ?? 'Equipo 1'}
          team2Name={getTeamById(selectedMatch.match.team2Id)?.name ?? 'Equipo 2'}
          onClose={handleCloseModal}
          onSave={handleSaveScore}
        />
      )}
    </div>
  );
}

export default App;