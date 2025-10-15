import React, { useState } from 'react';
import { Sport } from '../types';
import { UploadIcon } from './icons';

interface ImportCsvModalProps {
  onClose: () => void;
  onImport: (payload: { name: string; teams: string[]; sport: Sport }) => void;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleImport = () => {
    if (!file) {
      setError('Por favor, selecciona un archivo CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);

        if (lines.length < 20) {
          throw new Error(`El archivo debe tener al menos 20 líneas (1 para nombre, 1 para deporte, 18 para equipos). Se encontraron ${lines.length}.`);
        }

        const name = lines[0];
        const sport = lines[1].toLowerCase() as Sport;
        
        if (sport !== Sport.GENERAL && sport !== Sport.VOLLEYBALL) {
          throw new Error(`El deporte en la línea 2 debe ser '${Sport.GENERAL}' o '${Sport.VOLLEYBALL}'.`);
        }
        
        const teams = lines.slice(2, 20);
        
        if(teams.some(t => t.trim() === '')) {
            throw new Error('Todos los nombres de los equipos deben estar completos.');
        }

        onImport({ name, sport, teams });
        onClose();

      } catch (err: any) {
        setError(`Error al procesar el archivo: ${err.message}`);
      }
    };

    reader.onerror = () => {
        setError('No se pudo leer el archivo.');
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl border border-gray-700 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-teal-400">Importar Torneo desde CSV</h2>
        
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">Instrucciones de Formato</h3>
            <p className="text-gray-400 mb-4">
                Para importar, crea un archivo <code className="bg-gray-700 text-teal-300 px-1 rounded">.csv</code> con el siguiente formato exacto:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><span className="font-semibold">Línea 1:</span> El nombre completo del torneo.</li>
                <li><span className="font-semibold">Línea 2:</span> El deporte (<code className="bg-gray-700 text-teal-300 px-1 rounded">general</code> o <code className="bg-gray-700 text-teal-300 px-1 rounded">volleyball</code>).</li>
                <li><span className="font-semibold">Líneas 3 a 20:</span> Los 18 nombres de los equipos, uno por línea.</li>
            </ul>
             <p className="text-sm text-gray-500 mb-4">
                Asegúrate de que no haya líneas vacías entre los datos ni cabeceras de columnas.
            </p>
            <h4 className="font-semibold text-gray-300 mb-2">Ejemplo:</h4>
            <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-400 overflow-x-auto">
                <code>
                    Torneo de Verano 2024<br/>
                    general<br/>
                    Equipo Los Rápidos<br/>
                    Equipo Los Fuertes<br/>
                    ... (16 nombres más)<br/>
                </code>
            </pre>
        </div>

        <div>
            <label htmlFor="csv-upload" className="w-full inline-block bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 transition-colors">
                <UploadIcon className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                <span className="text-teal-400 font-semibold">{file ? file.name : "Seleccionar archivo"}</span>
                <p className="text-xs text-gray-500 mt-1">Sube tu archivo .csv aquí</p>
            </label>
            <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>

        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleImport} 
            disabled={!file}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            Cargar y Crear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCsvModal;
