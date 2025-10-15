
import { useReducer, useCallback, useEffect } from 'react';
import { TournamentState, TournamentAction, Sport, Team, Group, Match, TournamentStatus, Playoff } from '../types';

const STORAGE_KEY = 'tournamentData';

const createTeam = (id: number, name: string): Team => ({
  id, name, played: 0, wins: 0, draws: 0, losses: 0, points: 0,
  goalsFor: 0, goalsAgainst: 0, goalDifference: 0, greenCards: 0,
  setsWon: 0, setsLost: 0, setDifference: 0, 
  pointsFor: 0, pointsAgainst: 0, pointsDifference: 0,
});

const initialState: TournamentState = {
  id: '',
  name: '',
  sport: Sport.GENERAL,
  teams: [],
  groups: [],
  status: TournamentStatus.SETUP,
  playoff: null,
};

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
    // Menos tarjetas es mejor
    if (a.greenCards !== b.greenCards) return a.greenCards - b.greenCards;
    return 0; // Empate
  });
};

export const tournamentReducer = (state: TournamentState, action: TournamentAction): TournamentState => {
  switch (action.type) {
    case 'SETUP_TOURNAMENT': {
      const { teams: teamNames, sport } = action.payload;
      const teams = teamNames.map((name, i) => createTeam(i + 1, name));
      
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      const groups: Group[] = [];
      let matchIdCounter = 1;
      const matchBase = { team1Score: 0, team2Score: 0, played: false, team1GreenCards: 0, team2GreenCards: 0, team1SetScores: [], team2SetScores: [] };

      for (let i = 0; i < 6; i++) {
        const groupTeams = shuffledTeams.slice(i * 3, i * 3 + 3);
        const groupMatches: Match[] = [
          { id: matchIdCounter++, team1Id: groupTeams[0].id, team2Id: groupTeams[1].id, ...matchBase },
          { id: matchIdCounter++, team1Id: groupTeams[0].id, team2Id: groupTeams[2].id, ...matchBase },
          { id: matchIdCounter++, team1Id: groupTeams[1].id, team2Id: groupTeams[2].id, ...matchBase },
        ];
        groups.push({ id: `Grupo ${String.fromCharCode(65 + i)}`, teams: groupTeams, matches: groupMatches });
      }

      return { ...state, teams, groups, sport, status: TournamentStatus.GROUP_STAGE };
    }

    case 'UPDATE_MATCH_SCORE': {
      const { matchId, scores, matchType } = action.payload;
      
      // --- Green Card Accumulation Logic ---
      let originalMatch: Match | undefined;
      if (matchType === 'group') {
          for (const group of state.groups) {
              originalMatch = group.matches.find(m => m.id === matchId);
              if (originalMatch) break;
          }
      } else if (state.playoff) {
          originalMatch = [...state.playoff.quarterfinals, ...state.playoff.semifinals, ...(state.playoff.thirdPlace || []), ...state.playoff.final].find(m => m.id === matchId);
      }

      let newTeams = state.teams;
      if (originalMatch) {
          const team1CardsDelta = scores.team1GreenCards - originalMatch.team1GreenCards;
          const team2CardsDelta = scores.team2GreenCards - originalMatch.team2GreenCards;
          newTeams = state.teams.map(t => {
              if (t.id === originalMatch!.team1Id) return { ...t, greenCards: t.greenCards + team1CardsDelta };
              if (t.id === originalMatch!.team2Id) return { ...t, greenCards: t.greenCards + team2CardsDelta };
              return t;
          });
      }
      // --- End Green Card Logic ---

      let newGroups = JSON.parse(JSON.stringify(state.groups));
      let newPlayoff = state.playoff ? JSON.parse(JSON.stringify(state.playoff)) : null;

      if (matchType === 'group') {
        let groupToUpdate: Group | undefined;
        for (const group of newGroups) {
            const matchIndex = group.matches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                group.matches[matchIndex] = { ...group.matches[matchIndex], ...scores, played: true };
                groupToUpdate = group;
                break;
            }
        }

        if (groupToUpdate) {
            groupToUpdate.teams.forEach(team => {
                Object.assign(team, createTeam(team.id, team.name));
            });

            for (const match of groupToUpdate.matches) {
                if (!match.played) continue;
                
                const team1 = groupToUpdate.teams.find(t => t.id === match.team1Id)!;
                const team2 = groupToUpdate.teams.find(t => t.id === match.team2Id)!;

                team1.played++;
                team2.played++;
                // Group-specific green cards for tie-breaking
                team1.greenCards += match.team1GreenCards;
                team2.greenCards += match.team2GreenCards;

                if (state.sport === Sport.VOLLEYBALL) {
                    team1.setsWon += match.team1Score;
                    team1.setsLost += match.team2Score;
                    team2.setsWon += match.team2Score;
                    team2.setsLost += match.team1Score;
                    const team1Points = match.team1SetScores.reduce((a, b) => a + b, 0);
                    const team2Points = match.team2SetScores.reduce((a, b) => a + b, 0);
                    team1.pointsFor += team1Points;
                    team1.pointsAgainst += team2Points;
                    team2.pointsFor += team2Points;
                    team2.pointsAgainst += team1Points;
                    if(match.team1Score > match.team2Score) {
                        team1.wins++; team2.losses++; team1.points += 3;
                    } else {
                        team2.wins++; team1.losses++; team2.points += 3;
                    }
                } else {
                    team1.goalsFor += match.team1Score;
                    team1.goalsAgainst += match.team2Score;
                    team2.goalsFor += match.team2Score;
                    team2.goalsAgainst += match.team1Score;
                    if (match.team1Score > match.team2Score) {
                        team1.wins++; team2.losses++; team1.points += 3;
                    } else if (match.team1Score < match.team2Score) {
                        team2.wins++; team1.losses++; team2.points += 3;
                    } else {
                        team1.draws++; team2.draws++; team1.points++; team2.points++;
                    }
                }
            }
            
            groupToUpdate.teams.forEach(t => {
                if(state.sport === Sport.VOLLEYBALL) {
                    t.setDifference = t.setsWon - t.setsLost;
                    t.pointsDifference = t.pointsFor - t.pointsAgainst;
                } else {
                    t.goalDifference = t.goalsFor - t.goalsAgainst;
                }
            });
            groupToUpdate.teams = sortTeams(groupToUpdate.teams, state.sport);
        }
      } else if (matchType === 'playoff' && newPlayoff) {
          const allPlayoffMatches = [...newPlayoff.quarterfinals, ...newPlayoff.semifinals, ...newPlayoff.thirdPlace, ...newPlayoff.final];
          const matchToUpdate = allPlayoffMatches.find(m => m.id === matchId);
          if (matchToUpdate) {
              Object.assign(matchToUpdate, { ...scores, played: true });
              
              const winnerId = matchToUpdate.team1Score > matchToUpdate.team2Score ? matchToUpdate.team1Id : matchToUpdate.team2Id;
              const loserId = matchToUpdate.team1Score > matchToUpdate.team2Score ? matchToUpdate.team2Id : matchToUpdate.team1Id;

              if (matchToUpdate.round === 'QF') {
                const qfIndex = newPlayoff.quarterfinals.findIndex(m => m.id === matchId);
                if(qfIndex === 0 || qfIndex === 1) newPlayoff.semifinals[0][qfIndex === 0 ? 'team1Id' : 'team2Id'] = winnerId;
                if(qfIndex === 2 || qfIndex === 3) newPlayoff.semifinals[1][qfIndex === 2 ? 'team1Id' : 'team2Id'] = winnerId;
              } else if (matchToUpdate.round === 'SF') {
                const sfIndex = newPlayoff.semifinals.findIndex(m => m.id === matchId);
                if (sfIndex === 0) newPlayoff.final[0].team1Id = winnerId;
                else newPlayoff.final[0].team2Id = winnerId;
                
                if (sfIndex === 0) newPlayoff.thirdPlace[0].team1Id = loserId;
                else newPlayoff.thirdPlace[0].team2Id = loserId;

              } else if (matchToUpdate.round === 'F') {
                  newPlayoff.championId = winnerId;
                  return { ...state, teams: newTeams, playoff: newPlayoff, status: TournamentStatus.FINISHED };
              } else if (matchToUpdate.round === '3P') {
                  newPlayoff.thirdPlaceId = winnerId;
              }
          }
      }

      return { ...state, teams: newTeams, groups: newGroups, playoff: newPlayoff };
    }
    
    case 'GENERATE_PLAYOFFS': {
        const firstPlaceTeams: Team[] = [];
        const secondPlaceTeams: Team[] = [];

        state.groups.forEach(group => {
            const sortedGroupTeams = sortTeams(group.teams, state.sport);
            if(sortedGroupTeams[0]) firstPlaceTeams.push(sortedGroupTeams[0]);
            if(sortedGroupTeams[1]) secondPlaceTeams.push(sortedGroupTeams[1]);
        });
        
        const rankedFirsts = sortTeams(firstPlaceTeams, state.sport);
        const rankedSeconds = sortTeams(secondPlaceTeams, state.sport);

        const bestSeconds = rankedSeconds.slice(0, 2);
        
        if (rankedFirsts.length < 6 || bestSeconds.length < 2) {
            alert("No hay suficientes equipos para generar las eliminatorias.");
            return state;
        }

        let matchIdCounter = 100;
        const matchBase = { team1Score: 0, team2Score: 0, played: false, team1GreenCards: 0, team2GreenCards: 0, team1SetScores: [], team2SetScores: [] };
        const playoff: Playoff = {
            quarterfinals: [
                { id: matchIdCounter++, round: 'QF', team1Id: rankedFirsts[0].id, team2Id: bestSeconds[1].id, ...matchBase },      // 1 vs 8 (2nd best second)
                { id: matchIdCounter++, round: 'QF', team1Id: rankedFirsts[3].id, team2Id: rankedFirsts[4].id, ...matchBase },      // 4 vs 5
                { id: matchIdCounter++, round: 'QF', team1Id: rankedFirsts[1].id, team2Id: bestSeconds[0].id, ...matchBase },      // 2 vs 7 (1st best second)
                { id: matchIdCounter++, round: 'QF', team1Id: rankedFirsts[2].id, team2Id: rankedFirsts[5].id, ...matchBase },      // 3 vs 6
            ],
            semifinals: [
                { id: matchIdCounter++, round: 'SF', team1Id: 0, team2Id: 0, ...matchBase },
                { id: matchIdCounter++, round: 'SF', team1Id: 0, team2Id: 0, ...matchBase },
            ],
            thirdPlace: [
                 { id: matchIdCounter++, round: '3P', team1Id: 0, team2Id: 0, ...matchBase },
            ],
            final: [
                { id: matchIdCounter++, round: 'F', team1Id: 0, team2Id: 0, ...matchBase },
            ]
        };
        
        return { ...state, status: TournamentStatus.PLAYOFFS, playoff };
    }
    
    case 'EDIT_TEAM_NAME': {
      const { teamId, newName } = action.payload;
      
      const newTeams = state.teams.map(team => 
        team.id === teamId ? { ...team, name: newName } : team
      );

      const newGroups = state.groups.map(group => ({
        ...group,
        teams: group.teams.map(team => 
          team.id === teamId ? { ...team, name: newName } : team
        )
      }));

      return {
        ...state,
        teams: newTeams,
        groups: newGroups,
      };
    }

    default:
      return state;
  }
};

// The useTournament hook is no longer used by the App but is kept to avoid file deletion.
const loadState = (): TournamentState => {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            return initialState;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        console.warn("Could not load state from localStorage", err);
        return initialState;
    }
};

export const useTournament = () => {
  const [state, dispatch] = useReducer(tournamentReducer, loadState());

  useEffect(() => {
    if (state.status !== TournamentStatus.SETUP) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const getTeamById = useCallback((id: number): Team | undefined => {
    return state.teams.find(t => t.id === id);
  }, [state.teams]);

  return { state, dispatch, getTeamById };
};