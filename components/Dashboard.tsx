import React, { useState } from 'react';
import { TournamentState, TournamentStatus, Sport } from '../types';
import { TrophyIcon, WhistleIcon, TrashIcon, UploadIcon } from './icons';
import ImportCsvModal from './ImportCsvModal';

interface DashboardProps {
  tournaments: TournamentState[];
  onNewTournament: () => void;
  onViewTournament: (id: string) => void;
  onDeleteTournament: (id: string) => void;
  onImportTournament: (payload: { name: string; teams: string[]; sport: Sport }) => void;
}

const statusToText: Record<TournamentStatus, string> = {
    [TournamentStatus.SETUP]: "Configuración",
    [TournamentStatus.GROUP_STAGE]: "Fase de Grupos",
    [TournamentStatus.PLAYOFFS]: "Eliminatorias",
    [TournamentStatus.FINISHED]: "Finalizado",
}

const Dashboard: React.FC<DashboardProps> = ({ tournaments, onNewTournament, onViewTournament, onDeleteTournament, onImportTournament }) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, tournamentId: string) => {
    e.stopPropagation();
    if (pendingDeleteId === tournamentId) {
        onDeleteTournament(tournamentId);
        setPendingDeleteId(null);
    } else {
        setPendingDeleteId(tournamentId);
    }
  };

  return (
    <>
        <div className="min-h-screen bg-gray-900 p-4 md:p-8" onClick={() => setPendingDeleteId(null)}>
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-bold text-white">Mis Torneos</h1>
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-300 text-lg shadow-lg flex items-center gap-2"
                >
                    <UploadIcon className="w-6 h-6" />
                    <span>Importar desde CSV</span>
                </button>
                <button
                    onClick={onNewTournament}
                    className="bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors duration-300 text-lg shadow-lg flex items-center gap-2"
                >
                    <WhistleIcon className="w-6 h-6" />
                    <span>Crear Nuevo Torneo</span>
                </button>
            </div>
            </div>
            
            {tournaments.length === 0 ? (
            <div className="text-center py-20 bg-gray-800 rounded-lg border border-gray-700">
                <TrophyIcon className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl text-gray-400">No tienes torneos todavía.</h2>
                <p className="text-gray-500 mt-2">¡Crea uno para empezar!</p>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map(t => {
                    const isPendingDelete = pendingDeleteId === t.id;
                    return (
                    <div key={t.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col justify-between hover:border-teal-500 transition-all group">
                        <div>
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold text-teal-400 mb-2">{t.name}</h2>
                            <button 
                                onClick={(e) => handleDeleteClick(e, t.id)}
                                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors w-24 text-center ${
                                    isPendingDelete 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : 'text-gray-500 hover:text-red-500'
                                }`}
                                title={isPendingDelete ? "Confirmar eliminación" : "Eliminar torneo"}
                            >
                            {isPendingDelete ? "Confirmar" : <TrashIcon className="w-5 h-5 mx-auto"/>}
                            </button>
                        </div>
                        <p className="text-gray-400 capitalize mb-1">Deporte: {t.sport === 'general' ? 'General' : 'Voleibol'}</p>
                        <p className="text-gray-400 capitalize">Estado: {statusToText[t.status]}</p>
                        </div>
                        <button onClick={() => !isPendingDelete && onViewTournament(t.id)} className="mt-6 w-full bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 group-hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPendingDelete}>
                            Ver Torneo
                        </button>
                    </div>
                    )
                })}
            </div>
            )}
        </div>
        </div>
        {isImportModalOpen && (
            <ImportCsvModal 
                onClose={() => setIsImportModalOpen(false)} 
                onImport={onImportTournament} 
            />
        )}
    </>
  );
};

export default Dashboard;