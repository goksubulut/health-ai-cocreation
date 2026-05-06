import React from 'react';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  Contrast,
  Eye,
  Focus,
  Globe,
  Keyboard,
  MoonStar,
  MousePointer2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Type,
  Waves,
} from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';
import { useAccessibility } from '@/contexts/accessibility-context';

const ACCESSIBILITY_OPTIONS = [
  {
    key: 'highContrast',
    icon: Contrast,
    label: 'Precision contrast',
    description: 'Strengthens text, borders, and interface surfaces for clinical review sessions.',
    metric: 'Clarity',
  },
  {
    key: 'largeText',
    icon: Type,
    label: 'Larger reading scale',
    description: 'Raises application text size while keeping dense dashboard layouts usable.',
    metric: 'Readability',
  },
  {
    key: 'reduceMotion',
    icon: Waves,
    label: 'Calm motion',
    description: 'Softens animated movement for users who prefer steadier interfaces.',
    metric: 'Comfort',
  },
  {
    key: 'focusMode',
    icon: Focus,
    label: 'Focus field',
    description: 'Quietens decorative atmosphere so data, requests, and actions sit forward.',
    metric: 'Attention',
  },
  {
    key: 'underlineLinks',
    icon: Keyboard,
    label: 'Visible links',
    description: 'Adds clearer link affordances for keyboard users and fast scanners.',
    metric: 'Navigation',
  },
  {
    key: 'spaciousControls',
    icon: MousePointer2,
    label: 'Generous controls',
    description: 'Expands touch targets and button spacing for easier pointer interaction.',
    metric: 'Control',
  },
];

function PreferenceToggle({ option, enabled, onToggle }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      className={`a11y-toggle ${enabled ? 'is-active' : ''}`}
      onClick={onToggle}
      aria-pressed={enabled}
    >
      <span className="a11y-toggle__icon">
        <Icon size={18} />
      </span>
      <span className="a11y-toggle__copy">
        <span className="a11y-toggle__metric">{option.metric}</span>
        <strong>{option.label}</strong>
        <em>{option.description}</em>
      </span>
      <span className="a11y-toggle__switch" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const {
    preferences: accessibility,
    activeCount,
    togglePreference,
    resetPreferences,
  } = useAccessibility();

  return (
    <section className="page settings-page" data-screen-label="04 Settings">
      <div className="settings-shell">
        <div className="settings-hero">
          <div>
            <span className="ds-eyebrow">Workspace preferences</span>
            <h1>Settings that adapt around the way you work.</h1>
            <p>
              Tune language, appearance, privacy shortcuts, and accessibility from one calm control surface.
            </p>
          </div>
          <div className="settings-hero__signal" aria-hidden="true">
            <span><Sparkles size={18} /></span>
            <strong>{activeCount}</strong>
            <em>accessibility assists active</em>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-main">
            <section className="accessibility-lab" aria-labelledby="accessibility-heading">
              <div className="accessibility-lab__header">
                <div>
                  <span className="ds-eyebrow">Accessibility</span>
                  <h2 id="accessibility-heading">Personal comfort layer</h2>
                  <p>
                    A polished set of interface assists for researchers, clinicians, and engineers who need the product to stay readable, steady, and precise.
                  </p>
                </div>
                <button type="button" className="a11y-reset" onClick={resetPreferences}>
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>

              <div className="a11y-preview" aria-hidden="true">
                <div className="a11y-preview__scan">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="a11y-preview__panel">
                  <div>
                    <span className="a11y-preview__chip">Match score</span>
                    <strong>92%</strong>
                  </div>
                  <p>High signal collaboration, clearly framed for review.</p>
                </div>
                <div className="a11y-preview__rail">
                  <span className={accessibility.highContrast ? 'is-on' : ''}>Contrast</span>
                  <span className={accessibility.largeText ? 'is-on' : ''}>Text</span>
                  <span className={accessibility.reduceMotion ? 'is-on' : ''}>Motion</span>
                </div>
              </div>

              <div className="a11y-toggle-grid">
                {ACCESSIBILITY_OPTIONS.map((option) => (
                  <PreferenceToggle
                    key={option.key}
                    option={option}
                    enabled={accessibility[option.key]}
                    onToggle={() => togglePreference(option.key)}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className="settings-side">
            <section className="settings-panel">
              <div className="settings-panel__heading">
                <Globe size={18} />
                <h2>Language / Dil</h2>
              </div>
              <p>Select your preferred application language.</p>
              <div className="segmented-stack">
                {[
                  ['en', 'English'],
                  ['tr', 'Turkce'],
                  ['pt', 'Portugues'],
                  ['es', 'Espanol'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLocale(value)}
                    className={locale === value ? 'is-active' : ''}
                  >
                    {label}
                    {locale === value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-panel">
              <div className="settings-panel__heading">
                <MoonStar size={18} />
                <h2>Appearance</h2>
              </div>
              <p>Quick theme selection for day/night usage.</p>
              <div className="theme-orbit">
                {[
                  ['light', 'Light'],
                  ['dark', 'Dark'],
                  ['system', 'System'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={theme === value ? 'is-active' : ''}
                  >
                    <span />
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-panel settings-panel--privacy">
              <div className="settings-panel__heading">
                <ShieldCheck size={18} />
                <h2>Privacy shortcuts</h2>
              </div>
              <p>GDPR export/delete actions remain under your profile page.</p>
              <Link to="/profile?tab=settings" className="settings-link">
                Profile security controls
                <ArrowUpRight size={15} />
              </Link>
            </section>

            <section className="settings-panel settings-panel--note">
              <div className="settings-panel__heading">
                <Eye size={18} />
                <h2>Applied instantly</h2>
              </div>
              <p>
                Accessibility preferences are saved locally and applied across the interface as soon as you toggle them.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
