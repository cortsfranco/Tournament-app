export enum Sport {
  GENERAL = 'general',
  VOLLEYBALL = 'volleyball',
}

export enum TournamentStatus {
  SETUP = 'setup',
  GROUP_STAGE = 'group_stage',
  PLAYOFFS = 'playoffs',
  FINISHED = 'finished',
}

export interface Team {
  id: number;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  greenCards: number;
  setsWon: number;
  setsLost: number;
  setDifference: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
}

export interface Match {
  id: number;
  team1Id: number;
  team2Id: number;
  team1Score: number;
  team2Score: number;
  team1GreenCards: number;
  team2GreenCards: number;
  team1SetScores: number[];
  team2SetScores: number[];
  played: boolean;
  round?: string;
}

export interface Group {
  id: string;
  teams: Team[];
  matches: Match[];
}

export interface Playoff {
  quarterfinals: Match[];
  semifinals: Match[];
  thirdPlace: Match[];
  final: Match[];
  championId?: number;
  thirdPlaceId?: number;
}

export interface TournamentState {
  id: string;
  name: string;
  sport: Sport;
  teams: Team[];
  groups: Group[];
  status: TournamentStatus;
  playoff: Playoff | null;
}

export type TournamentAction =
  | { type: 'SETUP_TOURNAMENT'; payload: { teams: string[]; sport: Sport } }
  | { type: 'UPDATE_MATCH_SCORE'; payload: { matchId: number; scores: Omit<Match, 'id' | 'team1Id' | 'team2Id' | 'played' | 'round'>; matchType: 'group' | 'playoff' } }
  | { type: 'GENERATE_PLAYOFFS' }
  | { type: 'EDIT_TEAM_NAME'; payload: { teamId: number; newName: string } }
  | { type: 'EDIT_TOURNAMENT_DETAILS'; payload: { name: string; sport: Sport } }
  | { type: 'OVERRIDE_PLAYOFF_WINNER'; payload: { matchId: number; winnerId: number } };
