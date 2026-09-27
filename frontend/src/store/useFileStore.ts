import { create } from 'zustand';

interface FileStore {
  files: File[];
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  reorderFiles: (startIndex: number, endIndex: number) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  addFiles: (newFiles) => set((state) => ({ files: [...state.files, ...newFiles] })),
  removeFile: (index) => set((state) => ({
    files: state.files.filter((_, i) => i !== index)
  })),
  clearFiles: () => set({ files: [] }),
  reorderFiles: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.files);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return { files: result };
  }),
}));
