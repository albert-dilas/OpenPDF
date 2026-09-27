'use client';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { FileText, X, Settings2 } from 'lucide-react';
import axios from 'axios';
import SaveDialog from '@/components/pdf/SaveDialog';

export default function MergePDFPage() {
  const { files, addFiles, removeFile, clearFiles, reorderFiles } = useFileStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    return () => { clearFiles(); };
  }, [clearFiles]);

  const handleDragStart = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDrop = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      reorderFiles(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setError(null);
    setIsProcessing(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await apiClient.post('/merge/', formData, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      setPendingBlob(new Blob([response.data]));
    } catch (err: unknown) {
      let msg = 'Error desconocido al procesar el archivo.';
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.detail ?? msg;
        } catch { /* ignore */ }
      }
      setError(msg);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleSave = (fileName: string) => {
    if (!pendingBlob) return;
    const url = window.URL.createObjectURL(pendingBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setPendingBlob(null);
    clearFiles();
  };

  if (files.length === 0) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-gray-50 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Unir PDF</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Une archivos PDF y ponlos en el orden que prefieras. Rápido y fácil.
        </p>
        <Uploader onFilesSelected={addFiles} multiple={true} />
      </div>
    );
  }

  return (
    <>
      {pendingBlob && (
        <SaveDialog
          defaultName="archivos_unidos.pdf"
          onConfirm={handleSave}
          onCancel={() => setPendingBlob(null)}
        />
      )}

      <div className="min-h-screen pt-16 flex bg-gray-100">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative group bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center border-2 border-gray-100 hover:border-brand hover:shadow-lg transition-all cursor-move h-48"
              >
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                  aria-label="Eliminar archivo"
                >
                  <X size={16} />
                </button>
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <FileText className="text-brand w-12 h-12" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-center font-semibold text-gray-700 truncate w-full px-2" title={file.name}>
                  {file.name}
                </p>
              </div>
            ))}

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center h-48 cursor-pointer hover:bg-red-50 hover:border-brand hover:text-brand transition-all"
              onClick={() => document.getElementById('add-more')?.click()}
            >
              <input
                id="add-more"
                type="file"
                className="hidden"
                multiple
                accept=".pdf"
                onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); }}
              />
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">+</span>
                <span className="text-sm font-semibold">Añadir más</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 bg-white border-l border-gray-200 shadow-xl flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Settings2 className="text-brand" />
            <h2 className="text-xl font-bold">Opciones</h2>
          </div>

          <div className="p-6 flex-1">
            {files.length < 2 && (
              <p className="text-sm text-brand bg-red-50 p-3 rounded-lg border border-red-100">
                Por favor selecciona al menos 2 archivos para poder unirlos.
              </p>
            )}
            {files.length >= 2 && !error && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                No se requieren configuraciones adicionales. Haz clic en <strong>Unir PDF</strong> para continuar.
              </p>
            )}
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-3">
            {isProcessing && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{uploadProgress < 100 ? 'Subiendo...' : 'Procesando...'}</span>
                  {uploadProgress > 0 && uploadProgress < 100 && <span>{uploadProgress}%</span>}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <button
              disabled={files.length < 2 || isProcessing}
              onClick={handleMerge}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 rounded-lg shadow-lg text-lg transition-all"
            >
              {isProcessing ? (uploadProgress < 100 ? 'Subiendo...' : 'Procesando...') : 'Unir PDF'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
