'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Lightbulb,
  Bug,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GithubIcon } from '@/components/BrandIcons';
import {
  selectEngineCapabilities,
  selectEngineVersion,
  selectMaxFileSizeMb,
  selectOcrLanguages,
  useSystemStore,
} from '@/store/useSystemStore';
import { isMutationPending, MutationState } from '@/lib/fsm';
import { useI18n } from '@/i18n';

type FeedbackCategory = 'feature' | 'bug' | 'opinion';

export default function FeedbackPanel() {
  const { t, locale } = useI18n();
  const version = useSystemStore(selectEngineVersion);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const ocrLanguages = useSystemStore(selectOcrLanguages);
  const maxFileSizeMb = useSystemStore(selectMaxFileSizeMb);
  const submitFeedback = useSystemStore((s) => s.submitFeedback);

  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [submitState, setSubmitState] = useState<MutationState>({ status: 'idle' });

  const submitting = isMutationPending(submitState);

  const generateMarkdownReport = () => {
    const categoryLabel =
      category === 'feature'
        ? '[Feature]'
        : category === 'bug'
        ? '[Bug]'
        : '[Feedback]';

    const diagnosticBlock = includeDiagnostics
      ? `\n### Local Environment\n- **Tornio Version:** v${version}\n- **OCR:** ${
          capabilities.ocr ? 'Ready' : 'Pending'
        }\n- **Word to PDF:** ${capabilities.word_to_pdf ? 'Ready' : 'Pending'}\n- **FFmpeg:** ${
          capabilities.ffmpeg ? 'Ready' : 'Pending'
        }\n- **OCR Languages:** ${(ocrLanguages || []).join(', ') || 'N/A'}\n- **Max File Size:** ${maxFileSizeMb} MB\n`
      : '';

    return `## ${categoryLabel} ${title.trim() || 'Untitled'}\n\n### Description\n${
      description.trim() || 'No details provided.'
    }\n${diagnosticBlock}\n---\n*Generated from Tornio Settings.*`;
  };

  const handleSubmitLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error(
        locale === 'en'
          ? 'Please enter both title and description.'
          : 'Completa el título y la descripción.'
      );
      return;
    }

    setSubmitState({ status: 'pending' });
    try {
      await submitFeedback({
        category,
        title: title.trim(),
        description: description.trim(),
        email: email.trim(),
        system_info: includeDiagnostics
          ? {
              version,
              ...capabilities,
              max_file_size_mb: maxFileSizeMb,
            }
          : {},
      });
      setSubmitState({ status: 'success', data: undefined });
      toast.success(
        locale === 'en'
          ? 'Feedback recorded locally.'
          : 'Comentario registrado en el sistema local.'
      );
      setTitle('');
      setDescription('');
    } catch {
      setSubmitState({ status: 'error', error: 'Submit failed' });
      toast.error(
        locale === 'en'
          ? 'Could not reach local backend. You can still open a GitHub Issue.'
          : 'No se pudo conectar con el motor local. Puedes abrir un Issue en GitHub.'
      );
    }
  };

  const handleOpenGitHubIssue = () => {
    if (!title.trim()) {
      toast.error(
        locale === 'en' ? 'Enter a title first.' : 'Indica un título antes de abrir GitHub.'
      );
      return;
    }

    const prefix = category === 'feature' ? 'feat: ' : category === 'bug' ? 'fix: ' : 'feedback: ';
    const rawReport = generateMarkdownReport();
    const encodedBody = encodeURIComponent(rawReport);
    const fullTitle = encodeURIComponent(`${prefix}${title.trim()}`);

    if (encodedBody.length > 2500) {
      navigator.clipboard?.writeText(rawReport).catch(() => {});
      toast.success(t.common.copied);
      window.open(
        `https://github.com/albert-dilas/OpenPDF/issues/new?title=${fullTitle}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    window.open(
      `https://github.com/albert-dilas/OpenPDF/issues/new?title=${fullTitle}&body=${encodedBody}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownReport());
      toast.success(t.common.copied);
    } catch {
      toast.error('Clipboard unavailable.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--fg)]" />
            <h2 className="text-sm font-semibold text-[var(--fg)]">
              {t.settings.feedback.title}
            </h2>
          </div>
          <p className="text-xs text-[var(--fg-muted)]">{t.settings.feedback.desc}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'feature' as const, icon: Lightbulb },
            { id: 'bug' as const, icon: Bug },
            { id: 'opinion' as const, icon: Sparkles },
          ].map(({ id, icon: Icon }) => {
            const active = category === id;
            const copy = t.settings.feedback.categories[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`p-3 rounded-[var(--radius-control)] border flex items-center gap-2.5 text-left transition-colors ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                }`}
              >
                <Icon className="w-4 h-4 text-[var(--fg)] shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-[var(--fg)] block">
                    {copy.title}
                  </span>
                  <span className="text-[11px] text-[var(--fg-muted)]">{copy.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmitLocal} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.feedback.titleLabel}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.feedback.descLabel}
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                {t.settings.feedback.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--fg)] cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-strong)]"
              />
              <span>{t.settings.feedback.includeDiag}</span>
            </label>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--fg)] disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {submitting ? t.settings.feedback.submitting : t.settings.feedback.submitLocal}
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenGitHubIssue}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>{t.settings.feedback.openGithub}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg)]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t.settings.feedback.copyMarkdown}</span>
            </button>
          </div>
        </form>

        <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3.5 flex flex-wrap items-center gap-3 text-xs text-[var(--fg-muted)]">
          <span className="font-semibold text-[var(--fg)]">
            {t.settings.feedback.communityTitle}:
          </span>
          <a
            href="https://github.com/albert-dilas/OpenPDF"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--fg)] inline-flex items-center gap-1"
          >
            GitHub Repository <ExternalLink className="w-3 h-3" />
          </a>
          <span>·</span>
          <a
            href="https://github.com/albert-dilas/OpenPDF/issues"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--fg)] inline-flex items-center gap-1"
          >
            Issues <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
