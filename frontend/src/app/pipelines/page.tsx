'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Workflow,
  ArrowRight,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  FileCheck2,
  Inbox,
  BookmarkPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SaveDialog from '@/components/pdf/SaveDialog';
import { AsyncButton, ProgressBar } from '@/components/ui/Loaders';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { selectAssets, useWorkspaceStore } from '@/store/useWorkspaceStore';
import { API_BASE_URL, formatBytes, SessionAssetRecord } from '@/lib/api';
import { AsyncResourceState, getResourceData, MutationState } from '@/lib/fsm';
import { useI18n } from '@/i18n';

interface PipelineRecipe {
  id: string;
  title: string;
  description: string;
  domain: string;
  steps: string[];
  custom?: boolean;
}

const STEP_CATALOG: { id: string; labelEs: string; labelEn: string; domain: string }[] = [
  { id: 'pdf-repair', labelEs: 'Reparar estructura PDF', labelEn: 'Repair PDF structure', domain: 'pdf' },
  { id: 'metadata-clean', labelEs: 'Limpiar metadatos ocultos', labelEn: 'Strip hidden metadata', domain: 'pdf' },
  { id: 'redact-pii', labelEs: 'Anonimizar correos, teléfonos y DNI', labelEn: 'Redact emails, phones & IDs', domain: 'pdf' },
  { id: 'page-numbers-pdf', labelEs: 'Numerar páginas', labelEn: 'Add page numbers', domain: 'pdf' },
  { id: 'watermark-pdf', labelEs: 'Estampar marca de agua', labelEn: 'Stamp watermark', domain: 'pdf' },
  { id: 'compress-pdf', labelEs: 'Comprimir peso del PDF', labelEn: 'Compress PDF size', domain: 'pdf' },
  { id: 'protect-pdf', labelEs: 'Proteger con contraseña AES-256', labelEn: 'Protect with AES-256 password', domain: 'pdf' },
  { id: 'ai-doc-summary', labelEs: 'Extraer Resumen Ejecutivo (.MD)', labelEn: 'Extract Executive Summary (.MD)', domain: 'pdf' },
  { id: 'pdf-tables-csv', labelEs: 'Extraer Tablas a Excel (.CSV)', labelEn: 'Extract Tables to Excel (.CSV)', domain: 'pdf' },
  { id: 'image-exif-strip', labelEs: 'Borrar ubicación GPS y EXIF', labelEn: 'Strip GPS & EXIF data', domain: 'image' },
  { id: 'image-enhance-scan', labelEs: 'Súper Nitidez para foto de apuntes', labelEn: 'Super Sharpness for document photo', domain: 'image' },
  { id: 'image-bg-remove', labelEs: 'Quitar fondo con IA local', labelEn: 'Remove background with local AI', domain: 'image' },
  { id: 'image-convert-webp', labelEs: 'Convertir imagen a WebP ligero', labelEn: 'Convert image to lightweight WebP', domain: 'image' },
  { id: 'file-vault', labelEs: 'Cifrar en Bóveda AES-256-GCM (.tvault)', labelEn: 'Encrypt in AES-256-GCM Vault (.tvault)', domain: 'any' },
];

const BUILTIN_RECIPES_ES: PipelineRecipe[] = [
  {
    id: 'builtin-legal-delivery',
    title: 'Entrega Oficial y Legal (PDF)',
    description: 'Repara el documento, numera todas las páginas y comprime el peso para enviarlo sin errores.',
    domain: 'pdf',
    steps: ['pdf-repair', 'page-numbers-pdf', 'compress-pdf'],
  },
  {
    id: 'builtin-privacy-shield',
    title: 'Privacidad Total y Anonimización',
    description: 'Borra autor/metadatos ocultos, censura física e irreversiblemente correos, teléfonos y DNI, y optimiza el PDF.',
    domain: 'pdf',
    steps: ['metadata-clean', 'redact-pii', 'compress-pdf'],
  },
  {
    id: 'builtin-study-summary',
    title: 'Lectura Rápida y Resumen de Estudio',
    description: 'Limpia la estructura del PDF y genera un Resumen Ejecutivo en Markdown con puntos clave y palabras frecuentes.',
    domain: 'pdf',
    steps: ['pdf-repair', 'ai-doc-summary'],
  },
  {
    id: 'builtin-scan-restore',
    title: 'Mejorar Foto de Apuntes o Escaneo',
    description: 'Elimina datos GPS del celular y aplica realce inteligente de contraste y nitidez sobre fotos de documentos.',
    domain: 'image',
    steps: ['image-exif-strip', 'image-enhance-scan'],
  },
  {
    id: 'builtin-web-creator',
    title: 'Optimización de Imagen para Web y Redes',
    description: 'Limpia metadatos privados EXIF de cámara y convierte la imagen a formato WebP ultraligero.',
    domain: 'image',
    steps: ['image-exif-strip', 'image-convert-webp'],
  },
];

export default function PipelinesPage() {
  const { locale } = useI18n();
  const sessionAssets = useWorkspaceStore(selectAssets);
  const downloadAssetUrl = useWorkspaceStore((s) => s.downloadAssetUrl);
  const inspectAndAddFiles = useWorkspaceStore((s) => s.inspectAndAddFiles);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(BUILTIN_RECIPES_ES[0].id);
  const [customSteps, setCustomSteps] = useState<string[]>([
    'pdf-repair',
    'metadata-clean',
    'compress-pdf',
  ]);
  const [newRecipeTitle, setNewRecipeTitle] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENCIAL');
  const [vaultPassword, setVaultPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [recipesState, setRecipesState] = useState<AsyncResourceState<PipelineRecipe[]>>({
    status: 'idle',
  });
  const [saveRecipeState, setSaveRecipeState] = useState<MutationState<PipelineRecipe>>({
    status: 'idle',
  });
  const [chainSessionState, setChainSessionState] = useState<MutationState<null>>({
    status: 'idle',
  });

  const {
    status,
    isProcessing,
    uploadProgress,
    processStatus,
    pendingBlob,
    defaultFileName,
    process,
    cancel,
    handleSave,
    dismissSave,
  } = useToolProcessor();

  const loadCustomRecipes = async () => {
    setRecipesState({ status: 'loading' });
    try {
      const res = await fetch(`${API_BASE_URL}/pipelines/recipes`);
      if (!res.ok) throw new Error('Error loading recipes');
      const data = (await res.json()) as { items?: PipelineRecipe[] };
      const items = data.items ?? [];
      setRecipesState(
        items.length > 0 ? { status: 'ready', data: items } : { status: 'empty' }
      );
    } catch {
      setRecipesState({ status: 'empty' });
    }
  };

  useEffect(() => {
    loadCustomRecipes();
  }, []);

  const customRecipes = useMemo(
    () => getResourceData(recipesState) ?? [],
    [recipesState]
  );

  const allRecipes = useMemo(
    () => [...BUILTIN_RECIPES_ES, ...customRecipes],
    [customRecipes]
  );

  const activeRecipe = useMemo(
    () => allRecipes.find((r) => r.id === selectedRecipeId) ?? null,
    [allRecipes, selectedRecipeId]
  );

  const effectiveSteps = activeRecipe ? activeRecipe.steps : customSteps;

  const getStepLabel = (stepId: string) => {
    const found = STEP_CATALOG.find((s) => s.id === stepId);
    if (!found) return stepId;
    return locale === 'en' ? found.labelEn : found.labelEs;
  };

  const handlePickSessionAsset = async (asset: SessionAssetRecord) => {
    try {
      const res = await fetch(downloadAssetUrl(asset.id));
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      setSelectedFile(
        new File([blob], asset.filename, {
          type: asset.mime_type || blob.type || 'application/octet-stream',
        })
      );
      toast.success(`Archivo cargado: ${asset.filename}`);
    } catch {
      toast.error('No se pudo cargar el archivo de la sesión.');
    }
  };

  const handleSaveCustomRecipe = async () => {
    if (!newRecipeTitle.trim() || customSteps.length === 0) {
      toast.error('Escribe un nombre para guardar tu flujo personalizado.');
      return;
    }
    setSaveRecipeState({ status: 'pending' });
    try {
      const res = await fetch(`${API_BASE_URL}/pipelines/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRecipeTitle.trim(),
          description: `Flujo personalizado de ${customSteps.length} pasos`,
          domain: 'custom',
          steps: customSteps,
        }),
      });
      if (!res.ok) throw new Error('Error guardando flujo');
      const created = (await res.json()) as PipelineRecipe;
      setSaveRecipeState({ status: 'success', data: created });
      setNewRecipeTitle('');
      await loadCustomRecipes();
      setSelectedRecipeId(created.id);
      toast.success('Flujo personalizado guardado en este equipo.');
    } catch {
      setSaveRecipeState({ status: 'error', error: 'No se pudo guardar el flujo.' });
      toast.error('No se pudo guardar el flujo personalizado.');
    }
  };

  const handleDeleteCustomRecipe = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/pipelines/recipes/${id}`, { method: 'DELETE' });
      if (selectedRecipeId === id) {
        setSelectedRecipeId(BUILTIN_RECIPES_ES[0].id);
      }
      await loadCustomRecipes();
      toast.success('Flujo eliminado.');
    } catch {
      toast.error('No se pudo eliminar el flujo.');
    }
  };

  const handleExecutePipeline = async () => {
    if (!selectedFile) {
      toast.error('Selecciona primero un archivo para ejecutar el flujo automático.');
      return;
    }
    if (effectiveSteps.length === 0) {
      toast.error('El flujo debe tener al menos 1 paso.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('steps', effectiveSteps.join(','));
    formData.append('watermark_text', watermarkText || 'CONFIDENCIAL');
    if (vaultPassword) {
      formData.append('password', vaultPassword);
    }

    const lastStep = effectiveSteps[effectiveSteps.length - 1];
    const outExt =
      lastStep === 'ai-doc-summary' || lastStep === 'pdf-to-markdown'
        ? '.md'
        : lastStep === 'pdf-tables-csv'
        ? '.csv'
        : lastStep === 'image-convert-webp'
        ? '.webp'
        : lastStep === 'image-enhance-scan' || lastStep === 'image-bg-remove'
        ? '.png'
        : lastStep === 'image-exif-strip'
        ? '.jpg'
        : lastStep === 'file-vault'
        ? '.tvault'
        : '.pdf';

    const stem = selectedFile.name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/pipelines/execute',
      formData,
      fallbackFileName: `${stem}_flujo${outExt}`,
    });
  };

  const handleSaveResultToSession = async (fileName: string) => {
    if (!pendingBlob) return;
    setChainSessionState({ status: 'pending' });
    try {
      const f = new File([pendingBlob], fileName, {
        type: pendingBlob.type || 'application/octet-stream',
      });
      await inspectAndAddFiles([f]);
      setChainSessionState({ status: 'success', data: null });
      dismissSave();
      toast.success(`Resultado guardado en Archivos de la Sesión: ${fileName}`);
    } catch {
      setChainSessionState({ status: 'error', error: 'Error' });
      toast.error('No se pudo guardar en Archivos de la Sesión.');
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
      {pendingBlob && (
        <SaveDialog
          defaultName={defaultFileName}
          blobSize={pendingBlob.size}
          onConfirm={(fileName) => handleSave(fileName, () => setSelectedFile(null))}
          onSaveToSession={handleSaveResultToSession}
          savingToSession={chainSessionState.status === 'pending'}
          onCancel={dismissSave}
        />
      )}

      {/* Header */}
      <div className="pb-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">
                {locale === 'en' ? 'Automated Workflows (1-Click)' : 'Flujos Automáticos en 1 Clic'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                100% Local
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--fg-muted)] mt-1">
              {locale === 'en'
                ? 'Choose a ready-made template or chain 2 to 4 steps linearly. Drop your file and Tornio runs every step automatically.'
                : 'Elige una plantilla lista para tu trabajo o arma tu propia secuencia paso a paso. Suelta el archivo y Tornio ejecuta todo de corrido.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ready-to-Use Templates + Linear Step Builder */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Ready-to-Use Templates */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--fg)]">
                1. Plantillas Listas por Rubro
              </h2>
              <button
                type="button"
                onClick={() => setSelectedRecipeId('__custom__')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-control)] border transition-colors ${
                  selectedRecipeId === '__custom__'
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                + Crear mi propio flujo paso a paso
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {allRecipes.map((recipe) => {
                const isSelected = selectedRecipeId === recipe.id;
                return (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipeId(recipe.id)}
                    className={`cursor-pointer rounded-[var(--radius-card)] border p-4 transition-all space-y-3 ${
                      isSelected
                        ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--surface)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2">
                          <span>{recipe.title}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                          {recipe.description}
                        </p>
                      </div>

                      {recipe.custom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomRecipe(recipe.id);
                          }}
                          className="p-1.5 rounded text-[var(--fg-muted)] hover:text-red-500"
                          title="Eliminar flujo personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {recipe.steps.map((stepId, idx) => (
                        <React.Fragment key={`${recipe.id}-${stepId}-${idx}`}>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg)]">
                            <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                              #{idx + 1}
                            </span>
                            <span>{getStepLabel(stepId)}</span>
                          </span>
                          {idx < recipe.steps.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Simple Linear Step Builder (Paso 1 -> Paso 2 -> Paso 3) */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--fg)]">
                  Constructor Lineal por Etapas
                </h2>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  Elige los pasos en orden sin complicaciones técnicas y guárdalo para usarlo cuando quieras.
                </p>
              </div>
              {selectedRecipeId !== '__custom__' && (
                <button
                  type="button"
                  onClick={() => setSelectedRecipeId('__custom__')}
                  className="px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--bg)] text-xs font-semibold text-[var(--fg)]"
                >
                  Usar este constructor
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {customSteps.map((stepId, idx) => (
                <div
                  key={`custom-step-${idx}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]"
                >
                  <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--fg)]">
                    Paso {idx + 1}
                  </span>

                  <select
                    value={stepId}
                    onChange={(e) => {
                      setSelectedRecipeId('__custom__');
                      setCustomSteps((prev) =>
                        prev.map((s, i) => (i === idx ? e.target.value : s))
                      );
                    }}
                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-medium text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {STEP_CATALOG.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {locale === 'en' ? opt.labelEn : opt.labelEs}
                      </option>
                    ))}
                  </select>

                  {customSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipeId('__custom__');
                        setCustomSteps((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="p-1.5 rounded text-[var(--fg-muted)] hover:text-red-500"
                      title="Quitar paso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {customSteps.length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipeId('__custom__');
                    setCustomSteps((prev) => [...prev, 'compress-pdf']);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-dashed border-[var(--border-strong)] text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir siguiente paso</span>
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newRecipeTitle}
                onChange={(e) => setNewRecipeTitle(e.target.value)}
                placeholder="Nombre para guardar esta receta (ej. Mi entrega mensual)..."
                className="flex-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <AsyncButton
                pending={saveRecipeState.status === 'pending'}
                pendingLabel="Guardando..."
                onClick={handleSaveCustomRecipe}
                className="px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--bg)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--fg)] shrink-0"
              >
                <span className="inline-flex items-center gap-1.5">
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Guardar receta</span>
                </span>
              </AsyncButton>
            </div>
          </section>
        </div>

        {/* Right Column: File Selection & 1-Click Pipeline Execution */}
        <div className="lg:col-span-5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5 sticky top-6">
          <div>
            <h2 className="text-base font-bold text-[var(--fg)]">
              2. Ejecutar Flujo Seleccionado
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              Flujo activo:{' '}
              <strong className="text-[var(--fg)]">
                {activeRecipe ? activeRecipe.title : 'Flujo Personalizado'}
              </strong>{' '}
              ({effectiveSteps.length} pasos)
            </p>
          </div>

          {/* Active Steps Summary */}
          <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-2">
            {effectiveSteps.map((st, i) => (
              <div key={`active-${st}-${i}`} className="flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px] font-bold flex items-center justify-center text-[var(--fg)]">
                  {i + 1}
                </span>
                <span className="font-medium text-[var(--fg)]">{getStepLabel(st)}</span>
              </div>
            ))}
          </div>

          {/* Conditional inputs if watermark or password step is included */}
          {effectiveSteps.includes('watermark-pdf') && (
            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--fg-muted)] mb-1">
                Texto de Marca de Agua
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)]"
              />
            </div>
          )}

          {(effectiveSteps.includes('protect-pdf') || effectiveSteps.includes('file-vault')) && (
            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--fg-muted)] mb-1">
                Contraseña de Cifrado
              </label>
              <input
                type="password"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                placeholder="Contraseña para proteger el archivo..."
                className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)]"
              />
            </div>
          )}

          {/* File Drop / Picker */}
          <div className="space-y-3">
            <label className="block border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)] rounded-[var(--radius-card)] bg-[var(--bg)] p-5 text-center cursor-pointer transition-colors">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              {selectedFile ? (
                <div className="space-y-1">
                  <FileCheck2 className="w-6 h-6 mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-[var(--fg)] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] font-mono text-[var(--fg-muted)]">
                    {formatBytes(selectedFile.size)} · Clic para cambiar
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[var(--fg)]">
                    Seleccionar archivo de mi PC
                  </p>
                  <p className="text-[11px] text-[var(--fg-muted)]">
                    El archivo se procesará 100% en local a través de los {effectiveSteps.length} pasos
                  </p>
                </div>
              )}
            </label>

            {sessionAssets.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-[var(--fg-muted)] flex items-center gap-1">
                  <Inbox className="w-3 h-3" />
                  <span>O elige un archivo de tu sesión actual:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sessionAssets.slice(0, 4).map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handlePickSessionAsset(asset)}
                      className="px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-[11px] font-medium text-[var(--fg)] truncate max-w-[180px]"
                    >
                      {asset.filename}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <ProgressBar
                value={status === 'uploading' ? uploadProgress : undefined}
                indeterminate={status === 'processing'}
              />
              <button
                type="button"
                onClick={cancel}
                className="w-full py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] text-xs text-[var(--fg-muted)]"
              >
                Cancelar
              </button>
            </div>
          )}

          <AsyncButton
            pending={isProcessing}
            pendingLabel={processStatus || 'Ejecutando pasos en serie...'}
            disabled={!selectedFile}
            onClick={handleExecutePipeline}
            className="w-full py-3.5 rounded-[var(--radius-control)] font-semibold text-sm disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <span className="inline-flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>Ejecutar Flujo Automático ({effectiveSteps.length} pasos)</span>
            </span>
          </AsyncButton>
        </div>
      </div>
    </div>
  );
}
