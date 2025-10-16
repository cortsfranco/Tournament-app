import React, { useState, useEffect, useRef } from 'react';
import { TournamentState, Team, Group, Match, Sport, TournamentStatus, TournamentAction } from '../types';
import { TrophyIcon, EditIcon } from './icons';

interface TournamentViewProps {
  tournament: TournamentState;
  getTeamById: (id: number) => Team | undefined;
  onUpdateMatch: (match: Match, matchType: 'group' | 'playoff') => void;
  onGeneratePlayoffs: () => void;
  dispatch: React.Dispatch<TournamentAction>;
  onBackToDashboard: () => void;
  onEditTournament: () => void;
}

const sortTeams = (teams: Team[], sport: Sport): Team[] => {
  return [...teams].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (sport === Sport.VOLLEYBALL) {
      if (a.setDifference !== b.setDifference) return b.setDifference - a.setDifference;
      if (a.pointsDifference !== b.pointsDifference) return b.pointsDifference - a.pointsDifference;
      if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor;
    } else {
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    }
    // Fair play: más tarjetas verdes es mejor para el desempate.
    if (a.greenCards !== b.greenCards) return b.greenCards - a.greenCards;
    
    // Fallback alfabético si todo es idéntico
    return a.name.localeCompare(b.name);
  });
};

const exportToCsv = (tournament: TournamentState) => {
    const { groups, sport, playoff, teams, name } = tournament;
    let csvContent = "data:text/csv;charset=utf-8,";

    const getTeamName = (id: number) => teams.find(t => t.id === id)?.name || `Equipo ${id}`;

    csvContent += "FASE DE GRUPOS\n\n";

    const headersGeneral = ['Grupo', 'Equipo', 'Pts', 'PJ', 'G', 'E', 'P', 'DG', 'GF', 'GC', 'T. Verdes'];
    const headersVolleyball = ['Grupo', 'Equipo', 'Pts', 'PJ', 'G', 'P', 'DS', 'DP', 'T. Verdes'];
    
    groups.forEach(group => {
        csvContent += group.id + "\n";
        const headers = sport === Sport.GENERAL ? headersGeneral : headersVolleyball;
        csvContent += headers.slice(1).join(',') + "\n";
        
        const sortedTeams = sortTeams(group.teams, sport);
        sortedTeams.forEach(team => {
            const teamData = teams.find(t => t.id === team.id)!; // Get updated total green cards
            const rowData = sport === Sport.GENERAL
                ? [`"${team.name}"`, team.points, team.played, team.wins, team.draws, team.losses, team.goalDifference, team.goalsFor, team.goalsAgainst, teamData.greenCards]
                : [`"${team.name}"`, team.points, team.played, team.wins, team.losses, team.setDifference, team.pointsDifference, teamData.greenCards];
            csvContent += rowData.join(',') + "\n";
        });
        csvContent += "\n";
    });

    if (playoff) {
        csvContent += "ELIMINATORIAS\n\n";
        const formatMatch = (match: Match, round: string) => {
            if (!match.team1Id || !match.team2Id) return "";
            const team1 = getTeamName(match.team1Id);
            const team2 = getTeamName(match.team2Id);
            const score = match.played ? `${match.team1Score} - ${match.team2Score}` : 'Pendiente';
            return [round, `"${team1}" vs "${team2}"`, score].join(',') + "\n";
        };
        csvContent += "Ronda,Partido,Resultado\n";
        playoff.quarterfinals.forEach(m => csvContent += formatMatch(m, "Cuartos de Final"));
        playoff.semifinals.forEach(m => csvContent += formatMatch(m, "Semifinales"));
        playoff.thirdPlace.forEach(m => csvContent += formatMatch(m, "3er y 4to Puesto"));
        playoff.final.forEach(m => csvContent += formatMatch(m, "Final"));
        if (playoff.championId) {
            csvContent += "\nCAMPEÓN," + getTeamName(playoff.championId) + "\n";
        }
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${name.replace(/ /g, '_')}_datos.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const TeamRow: React.FC<{ team: Team; rank: number; sport: Sport; dispatch: React.Dispatch<TournamentAction>; totalGreenCards: number; }> = ({ team, rank, sport, dispatch, totalGreenCards }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(team.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        setName(team.name);
    }, [team.name]);

    const handleSave = () => {
        if (name.trim() && name.trim() !== team.name) {
            dispatch({ type: 'EDIT_TEAM_NAME', payload: { teamId: team.id, newName: name.trim() } });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setName(team.name);
            setIsEditing(false);
        }
    };
    
    return (
        <tr className="border-b border-gray-700 hover:bg-gray-700/50">
            <td className="p-3 text-center">{rank}</td>
            <td className="p-3 font-semibold">
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-600 border border-teal-500 rounded-md px-2 py-1 text-white placeholder-gray-400 focus:outline-none"
                        />
                    ) : (
                        <>
                            <span>{team.name}</span>
                            <button onClick={() => setIsEditing(true)} title="Editar nombre" className="text-gray-400 hover:text-white transition-colors">
                                <EditIcon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </td>
            <td className="p-3 text-center">{team.points}</td>
            <td className="p-3 text-center">{team.played}</td>
            <td className="p-3 text-center">{team.wins}</td>
            {sport === Sport.GENERAL && <td className="p-3 text-center">{team.draws}</td>}
            <td className="p-3 text-center">{team.losses}</td>
            {sport === Sport.GENERAL ? (
                <>
                    <td className="p-3 text-center">{team.goalDifference}</td>
                    <td className="p-3 text-center">{team.goalsFor}</td>
                    <td className="p-3 text-center">{team.goalsAgainst}</td>
                </>
            ) : (
                <>
                    <td className="p-3 text-center">{team.setDifference}</td>
                    <td className="p-3 text-center">{team.pointsDifference}</td>
                </>
            )}
            <td className="p-3 text-center text-green-400">{totalGreenCards}</td>
        </tr>
    );
};

const GroupComponent: React.FC<{ group: Group; getTeamById: (id: number) => Team | undefined; onUpdateMatch: (match: Match) => void, sport: Sport; dispatch: React.Dispatch<TournamentAction>; fullTeamsList: Team[] }> = ({ group, getTeamById, onUpdateMatch, sport, dispatch, fullTeamsList }) => {
    const tableHeadersGeneral = ['#', 'Equipo', 'Pts', 'PJ', 'G', 'E', 'P', 'DG', 'GF', 'GC', 'TV'];
    const tableHeadersVolleyball = ['#', 'Equipo', 'Pts', 'PJ', 'G', 'P', 'DS', 'DP', 'TV'];
    const headers = sport === Sport.GENERAL ? tableHeadersGeneral : tableHeadersVolleyball;
    
    const sortedTeams = sortTeams(group.teams, sport);

    return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-xl font-bold mb-4 text-teal-400">{group.id}</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-700/50">
                        {headers.map(h => <th key={h} className="p-3 text-left text-gray-400 font-semibold">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {sortedTeams.map((team, index) => {
                        const totalGreenCards = fullTeamsList.find(t => t.id === team.id)?.greenCards ?? 0;
                        return <TeamRow key={team.id} team={team} rank={index + 1} sport={sport} dispatch={dispatch} totalGreenCards={totalGreenCards}/>
                    })}
                </tbody>
            </table>
        </div>
        <div className="mt-4">
            <h4 className="font-semibold mb-2">Partidos</h4>
            <div className="space-y-2">
                {group.matches.map(match => (
                    <div key={match.id} onClick={() => onUpdateMatch(match)} className="bg-gray-700 p-2 rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-600 transition-colors">
                        <span className="text-sm">{getTeamById(match.team1Id)?.name} vs {getTeamById(match.team2Id)?.name}</span>
                        {match.played ? (
                            <span className="text-sm font-bold bg-teal-500/20 text-teal-300 px-2 py-1 rounded">{sport === Sport.VOLLEYBALL ? `${match.team1Score} - ${match.team2Score} (sets)` : `${match.team1Score} - ${match.team2Score}`}</span>
                        ) : (
                            <span className="text-xs text-gray-400">Pendiente</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
)};

const PlayoffBracket: React.FC<{ playoff: TournamentState['playoff'], getTeamById: (id: number) => Team | undefined, onUpdateMatch: (match: Match) => void }> = ({ playoff, getTeamById, onUpdateMatch }) => {
    if (!playoff) return null;

    const Matchup: React.FC<{ match: Match, round: string }> = ({ match, round }) => {
        const team1 = getTeamById(match.team1Id);
        const team2 = getTeamById(match.team2Id);
        const winnerId = match.played ? (match.team1Score > match.team2Score ? match.team1Id : match.team2Id) : -1;

        return (
            <div onClick={() => (team1 && team2) && onUpdateMatch(match)} className={`bg-gray-800 p-3 rounded-lg border border-gray-700 min-h-[80px] flex flex-col justify-center space-y-1 ${team1 && team2 ? 'cursor-pointer hover:border-teal-500' : 'cursor-not-allowed'}`}>
                <div className={`flex justify-between items-center text-sm ${winnerId === team1?.id ? 'font-bold text-teal-300' : ''}`}>
                    <span>{team1?.name || `Ganador ${round}`}</span>
                    {match.played && <span>{match.team1Score}</span>}
                </div>
                <div className={`flex justify-between items-center text-sm ${winnerId === team2?.id ? 'font-bold text-teal-300' : ''}`}>
                    <span>{team2?.name || `Ganador ${round}`}</span>
                     {match.played && <span>{match.team2Score}</span>}
                </div>
            </div>
        );
    }
    
    const finalMatch = playoff.final[0];
    const thirdPlaceMatch = playoff.thirdPlace[0];

    const secondPlaceId = finalMatch.played && playoff.championId ? (finalMatch.team1Id === playoff.championId ? finalMatch.team2Id : finalMatch.team1Id) : null;
    const fourthPlaceId = thirdPlaceMatch.played && playoff.thirdPlaceId ? (thirdPlaceMatch.team1Id === playoff.thirdPlaceId ? thirdPlaceMatch.team2Id : thirdPlaceMatch.team1Id) : null;

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-center mb-8">Eliminatorias</h2>
            <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-8">
                {/* Left Side */}
                <div className="flex flex-col justify-around space-y-8 w-full md:w-64">
                    <h3 className="text-xl font-bold text-center text-gray-400">Cuartos de Final</h3>
                    {playoff.quarterfinals.slice(0, 2).map(match => <Matchup key={match.id} match={match} round="CF" />)}
                </div>
                <div className="flex flex-col justify-around items-center space-y-24 w-full md:w-64">
                     <h3 className="text-xl font-bold text-center text-gray-400">Semifinales</h3>
                    {playoff.semifinals.slice(0,1).map(match => <Matchup key={match.id} match={match} round="SF" />)}
                </div>
                
                {/* Center Column */}
                <div className="flex flex-col justify-center items-center w-full md:w-64 space-y-8">
                     <h3 className="text-xl font-bold text-center text-gray-400">Final</h3>
                    <Matchup match={finalMatch} round="Final" />
                    
                    <div className="w-full">
                        <h3 className="text-lg font-bold text-center text-gray-400">3er y 4to Puesto</h3>
                        <Matchup match={thirdPlaceMatch} round="3P" />
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col justify-around items-center space-y-24 w-full md:w-64">
                     <h3 className="text-xl font-bold text-center text-gray-400">Semifinales</h3>
                    {playoff.semifinals.slice(1,2).map(match => <Matchup key={match.id} match={match} round="SF" />)}
                </div>
                 <div className="flex flex-col justify-around space-y-8 w-full md:w-64">
                    <h3 className="text-xl font-bold text-center text-gray-400">Cuartos de Final</h3>
                    {playoff.quarterfinals.slice(2, 4).map(match => <Matchup key={match.id} match={match} round="CF" />)}
                </div>
            </div>
             {playoff.championId && (
                <div className="mt-12 text-center bg-gray-800/50 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
                    <TrophyIcon className="w-20 h-20 text-yellow-400 mx-auto" />
                    <h2 className="text-4xl font-bold mt-4">Podio Final</h2>
                    <div className="space-y-2 mt-4 text-left">
                        <p className="text-3xl text-yellow-400"><span className="font-bold inline-block w-10">1°:</span> {getTeamById(playoff.championId)?.name}</p>
                        {secondPlaceId && <p className="text-2xl text-gray-300"><span className="font-bold inline-block w-10">2°:</span> {getTeamById(secondPlaceId)?.name}</p>}
                        {playoff.thirdPlaceId && <p className="text-xl text-orange-400"><span className="font-bold inline-block w-10">3°:</span> {getTeamById(playoff.thirdPlaceId)?.name}</p>}
                        {fourthPlaceId && <p className="text-lg text-gray-400"><span className="font-bold inline-block w-10">4°:</span> {getTeamById(fourthPlaceId)?.name}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};


const TournamentView: React.FC<TournamentViewProps> = ({ tournament, getTeamById, onUpdateMatch, onGeneratePlayoffs, dispatch, onBackToDashboard, onEditTournament }) => {
  const [activeTab, setActiveTab] = useState('groups');

  const allGroupMatchesPlayed = tournament.groups.every(g => g.matches.every(m => m.played));

  const firstPlaceTeams = tournament.groups.map(g => {
      const sortedGroup = sortTeams(g.teams, tournament.sport);
      return tournament.teams.find(t => t.id === sortedGroup[0]?.id);
  }).filter((t): t is Team => !!t);

  const secondPlaceTeams = tournament.groups.map(g => {
      const sortedGroup = sortTeams(g.teams, tournament.sport);
      return tournament.teams.find(t => t.id === sortedGroup[1]?.id);
  }).filter((t): t is Team => !!t);

  const sortedFirsts = sortTeams(firstPlaceTeams, tournament.sport);
  const sortedSeconds = sortTeams(secondPlaceTeams, tournament.sport);
  
  const TabButton: React.FC<{tabName: string; label: string}> = ({ tabName, label }) => (
    <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 font-semibold rounded-md transition-colors ${activeTab === tabName ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        {label}
    </button>
  );

  return (
    <div className="p-4 md:p-8">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold">{tournament.name}</h1>
                <button onClick={onEditTournament} title="Editar Torneo" className="text-gray-400 hover:text-white transition-colors">
                    <EditIcon className="w-6 h-6"/>
                </button>
            </div>
            <div className="flex items-center gap-4">
                 <button onClick={onBackToDashboard} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors">
                    Volver al Dashboard
                </button>
                <button onClick={() => exportToCsv(tournament)} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                    Exportar a CSV
                </button>
                {tournament.status === TournamentStatus.GROUP_STAGE && allGroupMatchesPlayed && (
                    <button onClick={onGeneratePlayoffs} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                        Generar Eliminatorias
                    </button>
                )}
            </div>
        </div>
        
        <div className="flex space-x-2 border-b border-gray-700 mb-6">
            <TabButton tabName="groups" label="Fase de Grupos" />
            <TabButton tabName="rankings" label="Clasificación" />
            <TabButton tabName="playoffs" label="Eliminatorias" />
            <TabButton tabName="fairplay" label="Fair Play" />
        </div>

        {activeTab === 'groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tournament.groups.map(group => <GroupComponent key={group.id} group={group} getTeamById={getTeamById} onUpdateMatch={(match) => onUpdateMatch(match, 'group')} sport={tournament.sport} dispatch={dispatch} fullTeamsList={tournament.teams} />)}
            </div>
        )}

        {activeTab === 'rankings' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Clasificación 1ros Puestos</h2>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                       <table className="w-full text-sm">
                           <thead><tr className="bg-gray-700/50"><th className="p-3">#</th><th className="p-3 text-left">Equipo</th><th className="p-3">Pts</th><th className="p-3">DG/DS</th><th className="p-3">GF/PF</th><th className="p-3 text-green-400">TV</th></tr></thead>
                           <tbody>
                             {sortedFirsts.map((team, index) => (
                                <tr key={team.id} className="border-b border-gray-700">
                                  <td className="p-2 text-center">{index + 1}</td>
                                  <td className="p-2 font-semibold">{team.name}</td>
                                  <td className="p-2 text-center">{team.points}</td>
                                  <td className="p-2 text-center">{tournament.sport === Sport.GENERAL ? team.goalDifference : team.setDifference}</td>
                                  <td className="p-2 text-center">{tournament.sport === Sport.GENERAL ? team.goalsFor : team.pointsFor}</td>
                                  <td className="p-2 text-center text-green-400">{team.greenCards}</td>
                                </tr>
                             ))}
                           </tbody>
                       </table>
                    </div>
                </div>
                 <div>
                    <h2 className="text-2xl font-bold mb-4">Clasificación 2dos Puestos (Clasifican 2)</h2>
                     <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                       <table className="w-full text-sm">
                          <thead><tr className="bg-gray-700/50"><th className="p-3">#</th><th className="p-3 text-left">Equipo</th><th className="p-3">Pts</th><th className="p-3">DG/DS</th><th className="p-3">GF/PF</th><th className="p-3 text-green-400">TV</th></tr></thead>
                           <tbody>
                             {sortedSeconds.map((team, index) => (
                                <tr key={team.id} className={`border-b border-gray-700 ${index < 2 ? 'bg-green-500/10' : ''}`}>
                                  <td className="p-2 text-center">{index + 1}</td>
                                  <td className={`p-2 font-semibold ${index < 2 ? 'text-green-300' : ''}`}>{team.name}</td>
                                  <td className="p-2 text-center">{team.points}</td>
                                  <td className="p-2 text-center">{tournament.sport === Sport.GENERAL ? team.goalDifference : team.setDifference}</td>
                                  <td className="p-2 text-center">{tournament.sport === Sport.GENERAL ? team.goalsFor : team.pointsFor}</td>
                                  <td className="p-2 text-center text-green-400">{team.greenCards}</td>
                                </tr>
                             ))}
                           </tbody>
                       </table>
                    </div>
                </div>
            </div>
        )}
        
        {activeTab === 'playoffs' && (tournament.status === TournamentStatus.PLAYOFFS || tournament.status === TournamentStatus.FINISHED) ? (
            <PlayoffBracket playoff={tournament.playoff} getTeamById={getTeamById} onUpdateMatch={(match) => onUpdateMatch(match, 'playoff')} />
        ) : activeTab === 'playoffs' && (
             <div className="text-center py-20 bg-gray-800 rounded-lg">
                <h2 className="text-2xl text-gray-400">Las eliminatorias se generarán cuando la fase de grupos haya terminado.</h2>
            </div>
        )}

        {activeTab === 'fairplay' && (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-center">Ranking de Fair Play</h2>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-700/50">
                                <th className="p-3 text-gray-400 font-semibold text-center">#</th>
                                <th className="p-3 text-gray-400 font-semibold text-left">Equipo</th>
                                <th className="p-3 text-gray-400 font-semibold text-center">Tarjetas Verdes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...tournament.teams].sort((a, b) => b.greenCards - a.greenCards).map((team, index) => (
                                <tr key={team.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 text-center font-semibold">{index + 1}</td>
                                    <td className="p-3">{team.name}</td>
                                    <td className="p-3 text-center text-green-400 font-bold text-lg">{team.greenCards}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};

export default TournamentView;