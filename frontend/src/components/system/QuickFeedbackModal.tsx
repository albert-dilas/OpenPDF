'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Lightbulb,
  MessageSquareHeart,
  Send,
  Wrench,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isMutationPending, MutationState } from '@/lib/fsm';
import {
  selectEngineCapabilities,
  selectEngineVersion,
  useSystemStore,
} from '@/store/useSystemStore';
import { AsyncButton } from '@/components/ui/Loaders';
import { useI18n } from '@/i18n';

type QuickCategory = 'feature' | 'bug' | 'opinion';

export default function QuickFeedbackModal() {
  const { t, locale } = useI18n();
  const qf = t.quickFeedback;

  const isOpen = useSystemStore((s) => s.feedbackModalOpen);
  const setOpen = useSystemStore((s) => s.setFeedbackModalOpen);
  const version = useSystemStore(selectEngineVersion);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const submitFeedback = useSystemStore((s) => s.submitFeedback);

  const [category, setCategory] = useState<QuickCategory>('feature');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [saveMutation, setSaveMutation] = useState<MutationState>({ status: 'idle' });

  if (!isOpen) return null;

  const busy = isMutationPending(saveMutation);

  const handleClose = () => {
    if (!busy) setOpen(false);
  };

  const handleSaveLocally = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanDesc = details.trim() || cleanTitle;
    if (cleanTitle.length < 2) {
      toast.error(
        locale === 'en'
          ? 'Please enter at least a short title.'
          : 'Escribe un título breve antes de enviar.'
      );
      return;
    }

    setSaveMutation({ status: 'pending' });
    try {
      await submitFeedback({
        category,
        title: cleanTitle,
        description: cleanDesc,
        system_info: { version, ...capabilities },
      });
      setSaveMutation({ status: 'success', data: undefined });
      toast.success(qf.savedToast);
      setTitle('');
      setDetails('');
      setOpen(false);
    } catch {
      setSaveMutation({ status: 'error', error: 'submit_failed' });
      toast.error(
        locale === 'en'
          ? 'Could not reach local backend. Try posting directly on GitHub.'
          : 'El motor local no respondió. Puedes publicarlo en GitHub.'
      );
    }
  };

  const handleOpenGithub = () => {
    const cleanTitle = title.trim() || qf.types[category].title;
    const cleanBody =
      (details.trim() || qf.detailsPlaceholder) + `\n\nTornio v${version}`;
    const prefix =
      category === 'feature' ? 'feat: ' : category === 'bug' ? 'fix: ' : 'feedback: ';
    const url = `https://github.com/albert-dilas/Tornio/issues/new?title=${encodeURIComponent(
      prefix + cleanTitle
    )}&body=${encodeURIComponent(cleanBody)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const cards: { id: QuickCategory; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'feature', icon: Wrench },
    { id: 'bug', icon: AlertCircle },
    { id: 'opinion', icon: Lightbulb },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-feedback-title"
      className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-left text-[var(--fg)]">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
            <div>
              <h2 id="quick-feedback-title" className="text-sm font-bold text-[var(--fg)]">
                {qf.title}
              </h2>
              <p className="text-[11px] text-[var(--fg-muted)]">{qf.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.common.close}
            className="p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveLocally} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {cards.map(({ id, icon: Icon }) => {
              const selected = category === id;
              const copy = qf.types[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={`p-3 rounded-[var(--radius-control)] border text-left transition-colors ${
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1.5 text-[var(--fg)]" />
                  <span className="text-xs font-semibold block text-[var(--fg)]">
                    {copy.title}
                  </span>
                  <span className="text-[11px] text-[var(--fg-muted)] leading-snug block mt-0.5">
                    {copy.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="quick-fb-subject"
              className="block text-xs font-semibold text-[var(--fg)]"
            >
              {qf.subjectLabel}
            </label>
            <input
              id="quick-fb-subject"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={qf.subjectPlaceholder}
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="quick-fb-details"
              className="block text-xs font-semibold text-[var(--fg)]"
            >
              {qf.detailsLabel}
            </label>
            <textarea
              id="quick-fb-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={qf.detailsPlaceholder}
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <p className="text-[11px] text-[var(--fg-muted)]">{qf.githubHint}</p>

          <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleOpenGithub}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{qf.publishGithubBtn}</span>
            </button>

            <AsyncButton
              type="submit"
              pending={busy}
              pendingLabel={qf.savingBtn}
              icon={<Send className="w-3.5 h-3.5" />}
              className="px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              {qf.saveLocalBtn}
            </AsyncButton>
          </div>
        </form>
      </div>
    </div>
  );
}
