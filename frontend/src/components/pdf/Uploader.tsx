'use client';
import { useState, useRef } from 'react';
import { FilePlus } from 'lucide-react';

interface UploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function Uploader({ onFilesSelected, accept = ".pdf", multiple = true }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div 
      className={`mt-10 flex flex-col items-center justify-center p-16 max-w-4xl w-full mx-auto border-[3px] border-dashed rounded-3xl transition-all duration-300 ${
        isDragging ? 'border-brand bg-red-50 scale-[1.02]' : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept={accept} 
        multiple={multiple} 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="bg-brand hover:bg-brand-dark text-white font-bold py-6 px-16 rounded-2xl text-3xl mb-4 shadow-xl flex items-center gap-4 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <FilePlus size={36} />
        Seleccionar archivos
      </button>
      <p className="text-gray-500 text-lg">o arrastra y suelta los PDF aquí</p>
    </div>
  );
}
