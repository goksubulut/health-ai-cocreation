import React from 'react';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import { Globe, MoonStar, ShieldCheck } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';

function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <section className="page" data-screen-label="04 Settings">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <h1 className="font-serif text-2xl">Language / Dil</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Select your preferred application language.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`btn ${locale === 'en' ? 'btn-primary' : 'btn-secondary'}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLocale('tr')}
              className={`btn ${locale === 'tr' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Türkçe
            </button>
            <button
              type="button"
              onClick={() => setLocale('pt')}
              className={`btn ${locale === 'pt' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Português
            </button>
            <button
              type="button"
              onClick={() => setLocale('es')}
              className={`btn ${locale === 'es' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Español
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2">
            <MoonStar size={18} className="text-primary" />
            <h2 className="font-serif text-xl">Appearance</h2>
          </div>
          <p className="text-sm text-muted-foreground">Quick theme selection for day/night usage.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setTheme('light')} className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}>Light</button>
            <button type="button" onClick={() => setTheme('dark')} className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}>Dark</button>
            <button type="button" onClick={() => setTheme('system')} className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}>System</button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h2 className="font-serif text-xl">Privacy shortcuts</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            GDPR export/delete actions remain under your profile page.
          </p>
          <div className="mt-4">
            <Link to="/profile?tab=settings" className="btn-secondary">
              Go to profile security controls
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
