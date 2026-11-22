'use client';

import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  LayoutGrid,
  Layers,
  Monitor,
  Cpu,
  Download,
  MessageSquare,
  RotateCcw,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSystemStore } from '@/store/useSystemStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AppearancePanel from '@/components/settings/AppearancePanel';
import WorkspacePanel from '@/components/settings/WorkspacePanel';
import ProcessingPanel from '@/components/settings/ProcessingPanel';
import DesktopSystemPanel from '@/components/settings/DesktopSystemPanel';
import ModulesPanel from '@/components/settings/ModulesPanel';
import UpdatesPanel from '@/components/settings/UpdatesPanel';
import FeedbackPanel from '@/components/settings/FeedbackPanel';
import { useI18n } from '@/i18n';

type SettingsTab =
  | 'appearance'
  | 'workspace'
  | 'processing'
  | 'system'
  | 'modules'
  | 'updates'
  | 'feedback';

export default function SettingsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const resetDefaults = useSettingsStore((s) => s.resetDefaults);
  const setUpdateModalOpen = useSystemStore((s) => s.setUpdateModalOpen);
  const checkForUpdatesRealtime = useSystemStore((s) => s.checkForUpdatesRealtime);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reqTab = params.get('tab');
    if (
      reqTab === 'appearance' ||
      reqTab === 'workspace' ||
      reqTab === 'processing' ||
      reqTab === 'system' ||
      reqTab === 'modules' ||
      reqTab === 'updates' ||
      reqTab === 'feedback'
    ) {
      setActiveTab(reqTab);
    }
  }, []);

  const handleCheckForUpdates = async () => {
    setUpdateModalOpen(true);
    await checkForUpdatesRealtime();
  };

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'appearance', label: t.settings.tabs.appearance, icon: Palette },
    { id: 'workspace', label: t.settings.tabs.workspace, icon: LayoutGrid },
    { id: 'processing', label: t.settings.tabs.processing, icon: Layers },
    { id: 'system', label: t.settings.tabs.system, icon: Monitor },
    { id: 'modules', label: t.settings.tabs.modules, icon: Cpu },
    { id: 'updates', label: t.settings.tabs.updates, icon: Download },
    { id: 'feedback', label: t.settings.tabs.feedback, icon: MessageSquare },
  ];

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-start gap-3 pb-5 border-b border-[var(--border)]">
        <div className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">
            {t.settings.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fg-muted)] mt-0.5 max-w-2xl">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[var(--border)] scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)] text-xs font-medium border whitespace-nowrap transition-colors ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                  : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Panel */}
      <div>
        {activeTab === 'appearance' && <AppearancePanel />}
        {activeTab === 'workspace' && <WorkspacePanel />}
        {activeTab === 'processing' && <ProcessingPanel />}
        {activeTab === 'system' && <DesktopSystemPanel />}
        {activeTab === 'modules' && <ModulesPanel />}
        {activeTab === 'updates' && (
          <UpdatesPanel onCheckForUpdates={handleCheckForUpdates} />
        )}
        {activeTab === 'feedback' && <FeedbackPanel />}
      </div>

      {/* Global Reset Footer */}
      <div className="pt-5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{t.settings.savedLocallyNote}</span>
        </div>

        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--fg-muted)] hover:text-red-500 hover:border-red-500/40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.settings.resetDefaults}</span>
        </button>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        title={t.common.confirmTitle}
        message={t.settings.resetConfirm}
        confirmLabel={t.settings.resetDefaults}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={() => {
          setConfirmResetOpen(false);
          resetDefaults();
          toast.success(t.settings.resetSuccess);
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
}
