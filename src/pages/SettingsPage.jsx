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

function buildAccessibilityOptions(t) {
  return [
    {
      key: 'highContrast',
      icon: Contrast,
      label: t('a11yHighContrastLabel', 'Precision contrast'),
      description: t('a11yHighContrastDesc', 'Strengthens text, borders, and interface surfaces for clinical review sessions.'),
      metric: t('a11yMetricClarity', 'Clarity'),
    },
    {
      key: 'largeText',
      icon: Type,
      label: t('a11yLargeTextLabel', 'Larger reading scale'),
      description: t('a11yLargeTextDesc', 'Raises application text size while keeping dense dashboard layouts usable.'),
      metric: t('a11yMetricReadability', 'Readability'),
    },
    {
      key: 'reduceMotion',
      icon: Waves,
      label: t('a11yReduceMotionLabel', 'Calm motion'),
      description: t('a11yReduceMotionDesc', 'Softens animated movement for users who prefer steadier interfaces.'),
      metric: t('a11yMetricComfort', 'Comfort'),
    },
    {
      key: 'focusMode',
      icon: Focus,
      label: t('a11yFocusModeLabel', 'Focus field'),
      description: t('a11yFocusModeDesc', 'Quietens decorative atmosphere so data, requests, and actions sit forward.'),
      metric: t('a11yMetricAttention', 'Attention'),
    },
    {
      key: 'underlineLinks',
      icon: Keyboard,
      label: t('a11yUnderlineLinksLabel', 'Visible links'),
      description: t('a11yUnderlineLinksDesc', 'Adds clearer link affordances for keyboard users and fast scanners.'),
      metric: t('a11yMetricNavigation', 'Navigation'),
    },
    {
      key: 'spaciousControls',
      icon: MousePointer2,
      label: t('a11ySpaciousControlsLabel', 'Generous controls'),
      description: t('a11ySpaciousControlsDesc', 'Expands touch targets and button spacing for easier pointer interaction.'),
      metric: t('a11yMetricControl', 'Control'),
    },
  ];
}

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
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const {
    preferences: accessibility,
    activeCount,
    togglePreference,
    resetPreferences,
  } = useAccessibility();

  const accessibilityOptions = React.useMemo(() => buildAccessibilityOptions(t), [t, locale]);

  return (
    <section className="page settings-page" data-screen-label="04 Settings">
      <div className="settings-shell">
        <div className="settings-hero">
          <div>
            <span className="ds-eyebrow">{t('settingsHeroEyebrow', 'Workspace preferences')}</span>
            <h1>{t('settingsHeroTitle', 'Settings that adapt around the way you work.')}</h1>
            <p>
              {t('settingsHeroDesc', 'Tune language, appearance, privacy shortcuts, and accessibility from one calm control surface.')}
            </p>
          </div>
          <div className="settings-hero__signal" aria-hidden="true">
            <span><Sparkles size={18} /></span>
            <strong>{activeCount}</strong>
            <em>{t('settingsA11yActiveCountSuffix', 'accessibility assists active')}</em>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-main">
            <section className="accessibility-lab" aria-labelledby="accessibility-heading">
              <div className="accessibility-lab__header">
                <div>
                  <span className="ds-eyebrow">{t('settingsA11yEyebrow', 'Accessibility')}</span>
                  <h2 id="accessibility-heading">{t('settingsA11yTitle', 'Personal comfort layer')}</h2>
                  <p>
                    {t(
                      'settingsA11yDesc',
                      'A polished set of interface assists for researchers, clinicians, and engineers who need the product to stay readable, steady, and precise.'
                    )}
                  </p>
                </div>
                <button type="button" className="a11y-reset" onClick={resetPreferences}>
                  <RotateCcw size={15} />
                  {t('settingsReset', 'Reset')}
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
                    <span className="a11y-preview__chip">{t('settingsMatchScoreChip', 'Match score')}</span>
                    <strong>92%</strong>
                  </div>
                  <p>{t('settingsA11yPreviewText', 'High signal collaboration, clearly framed for review.')}</p>
                </div>
                <div className="a11y-preview__rail">
                  <span className={accessibility.highContrast ? 'is-on' : ''}>{t('settingsPreviewContrast', 'Contrast')}</span>
                  <span className={accessibility.largeText ? 'is-on' : ''}>{t('settingsPreviewText', 'Text')}</span>
                  <span className={accessibility.reduceMotion ? 'is-on' : ''}>{t('settingsPreviewMotion', 'Motion')}</span>
                </div>
              </div>

              <div className="a11y-toggle-grid">
                {accessibilityOptions.map((option) => (
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
                <h2>{t('settingsLanguageTitle', 'Language')}</h2>
              </div>
              <p>{t('settingsLanguageDesc', 'Select your preferred application language.')}</p>
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
                <h2>{t('settingsAppearanceTitle', 'Appearance')}</h2>
              </div>
              <p>{t('settingsAppearanceDesc', 'Quick theme selection for day/night usage.')}</p>
              <div className="theme-orbit">
                {[
                  ['light', t('themeLight', 'Light')],
                  ['dark', t('themeDark', 'Dark')],
                  ['system', t('themeSystem', 'System')],
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
                <h2>{t('settingsPrivacyTitle', 'Privacy shortcuts')}</h2>
              </div>
              <p>{t('settingsPrivacyDesc', 'GDPR export/delete actions remain under your profile page.')}</p>
              <Link to="/profile?tab=settings" className="settings-link">
                {t('settingsPrivacyLink', 'Profile security controls')}
                <ArrowUpRight size={15} />
              </Link>
            </section>

            <section className="settings-panel settings-panel--note">
              <div className="settings-panel__heading">
                <Eye size={18} />
                <h2>{t('settingsAppliedTitle', 'Applied instantly')}</h2>
              </div>
              <p>
                {t(
                  'settingsAppliedDesc',
                  'Accessibility preferences are saved locally and applied across the interface as soon as you toggle them.'
                )}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
