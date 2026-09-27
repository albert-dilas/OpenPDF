'use client';
import { useState } from 'react';

interface SaveDialogProps {
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function SaveDialog({ defaultName, onConfirm, onCancel }: SaveDialogProps) {
  const [name, setName] = useState(defaultName);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Guardar archivo</h3>
        <p className="text-sm text-gray-500 mb-4">
          Introduce el nombre del archivo que se descargará.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder="Nombre del archivo"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
        />
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="flex-1 bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}
