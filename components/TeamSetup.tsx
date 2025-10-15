import React, { useState } from 'react';
import { Sport } from '../types';
import { WhistleIcon } from './icons';

interface TeamSetupProps {
  onSetupTournament: (payload: { name: string; teams: string[]; sport: Sport }) => void;
  onBack: () => void;
}

const defaultTeams = [
    "Equipo 1", "Equipo 2", "Equipo 3", "Equipo 4", "Equipo 5", "Equipo 6",
    "Equipo 7", "Equipo 8", "Equipo 9", "Equipo 10", "Equipo 11", "Equipo 12",
    "Equipo 13", "Equipo 14", "Equipo 15", "Equipo 16", "Equipo 17", "Equipo 18"
];

const TeamSetup: React.FC<TeamSetupProps> = ({ onSetupTournament, onBack }) => {
  const [tournamentName, setTournamentName] = useState('');
  const [teams, setTeams] = useState<string[]>(defaultTeams);
  const [sport, setSport] = useState<Sport>(Sport.GENERAL);

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeams = [...teams];
    newTeams[index] = name;
    setTeams(newTeams);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tournamentName.trim() === '') {
      alert('Por favor, ingrese un nombre para el torneo.');
      return;
    }
    if (teams.some(t => t.trim() === '')) {
      alert('Por favor, complete todos los nombres de los equipos.');
      return;
    }
    onSetupTournament({ name: tournamentName, teams, sport });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-700">
            <div className="text-center mb-8">
                <WhistleIcon className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-white">Configuración del Torneo</h1>
                <p className="text-gray-400 mt-2">Configura tu torneo ingresando los equipos y seleccionando el deporte.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label htmlFor="tournamentName" className="block text-lg font-semibold text-gray-300 mb-2">Nombre del Torneo</label>
                    <input
                        id="tournamentName"
                        type="text"
                        value={tournamentName}
                        onChange={(e) => setTournamentName(e.target.value)}
                        placeholder="Ej: Torneo de Verano 2024"
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

                <div className="mb-8">
                     <label className="block text-lg font-semibold text-gray-300 mb-4">18 Equipos</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map((team, index) => (
                            <input
                                key={index}
                                type="text"
                                value={team}
                                onChange={(e) => handleTeamNameChange(index, e.target.value)}
                                placeholder={`Equipo ${index + 1}`}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        ))}
                     </div>
                </div>
                
                <div className="flex gap-4 mt-8">
                    <button type="button" onClick={onBack} className="w-1/3 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-300 text-lg">
                        Cancelar
                    </button>
                    <button type="submit" className="w-2/3 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors duration-300 text-lg shadow-lg">
                        Crear Torneo
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default TeamSetup;
