'use client';
import { useEffect, useState } from 'react';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { apiClient } from '@/lib/api';
import { FileText, Settings2, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function SplitPDFPage() {
  const { files, addFiles, removeFile, clearFiles } = useFileStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState('');
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [defaultFileName, setDefaultFileName] = useState('');
  const [pageRanges, setPageRanges] = useState('');

  useEffect(() => {
    return () => {
      clearFiles();
    };
  }, [clearFiles]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setUploadProgress(0);
    setProcessStatus('Subiendo archivo...');

    const formData = new FormData();
    formData.append('file', files[0]);

    if (pageRanges.trim()) {
      formData.append('page_ranges', pageRanges.trim());
    }

    try {
      const response = await apiClient.post('/split/', formData, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
            if (pct === 100) {
              setProcessStatus('Procesando...');
            }
          }
        },
      });

      const blob = new Blob([response.data]);
      setPendingBlob(blob);
      const baseName = files[0].name.replace(/\.[^.]+$/, '');
      setDefaultFileName(`${baseName}_split.zip`);
      toast.success('¡Archivo procesado con éxito!');
    } catch (err: unknown) {
      let msg = 'Error desconocido al procesar el archivo.';
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const json = JSON.parse(text);
            msg = json.detail ?? msg;
          } catch {
            // ignore
          }
        } else if (err.response.data?.detail) {
          msg = err.response.data.detail;
        }
      }
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      setProcessStatus('');
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Dividir PDF</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Extrae páginas o divide tu documento.
        </p>
        <Uploader onFilesSelected={addFiles} multiple={false} accept=".pdf" />
      </div>
    );
  }

  return (
    <>
      {pendingBlob && (
        <SaveDialog
          defaultName={defaultFileName}
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
                className={`relative group bg-white rounded-lg shadow-sm p-4 flex flex-col items-center justify-center border transition-all ${isProcessing ? 'border-gray-200 opacity-50' : 'border-gray-200 hover:border-brand hover:shadow-md'}`}
              >
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 bg-brand text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar archivo"
                >
                  <X size={16} />
                </button>
                <FileText className="text-brand mb-3 w-16 h-16" />
                <p className="text-xs text-center font-medium truncate w-full" title={file.name}>
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 bg-white border-l border-gray-200 shadow-xl flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Settings2 className="text-brand" />
            <h2 className="text-xl font-bold">Opciones</h2>
          </div>

          <div className="p-6 flex-1 space-y-4 overflow-y-auto">
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
              Esta herramienta extraerá <b>cada página</b> de tu PDF como un archivo independiente
              y te los descargará todos juntos en un archivo ZIP.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Páginas a extraer
              </label>
              <input
                type="text"
                value={pageRanges}
                onChange={(e) => setPageRanges(e.target.value)}
                placeholder="Ej: 1,3-5,7 (vacío = todas)"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-gray-400 mt-1">
                Formato: &quot;1,3-5,7&quot; — números separados por coma, rangos con guión.
              </p>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-3">
            {isProcessing && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{processStatus}</span>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <span>{uploadProgress}%</span>
                  )}
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
              disabled={isProcessing}
              onClick={handleProcess}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 rounded-lg shadow-lg text-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="animate-spin" size={20} />}
              {isProcessing ? processStatus || 'Procesando...' : 'Dividir PDF'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
