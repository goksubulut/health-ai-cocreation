import React from 'react';
import { AlertTriangle, CalendarClock, Filter, RefreshCcw, ShieldAlert, WifiOff } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocale } from '@/contexts/locale-context';

function buildTroubleshootingItems(locale) {
  if (locale === 'tr') {
    return [
      { id: '1', icon: WifiOff, problem: 'Sayfa yüklenmiyor', cause: 'İnternet bağlantısı sorunu veya geçici backend kesintisi.', solution: 'Bağlantını kontrol et, sayfayı yenile ve 1-2 dakika sonra tekrar dene.' },
      { id: '2', icon: ShieldAlert, problem: 'Oturum beklenmedik şekilde kapandı', cause: 'Oturum zaman aşımı veya tarayıcı çerez kısıtları.', solution: 'Tekrar giriş yap ve bu alan adı için çerez/yerel depolamayı etkinleştir.' },
      { id: '3', icon: Filter, problem: 'Filtreler sonuç döndürmüyor', cause: 'Seçilen filtrelerle eşleşen ilan yok.', solution: 'Daha esnek filtreler kullan veya aşama/alan seçimlerini genişlet.' },
      { id: '4', icon: CalendarClock, problem: 'Toplantı talebi gönderilemiyor', cause: 'İlan kapanmış olabilir veya zorunlu alanlar eksik.', solution: 'NDA onayı, tarih/saat alanları ve ilan durumunu tekrar kontrol et.' },
      { id: '5', icon: RefreshCcw, problem: 'Takvim/tarih seçimi bozuk görünüyor', cause: 'Eski cache veya eklenti CSS müdahalesi.', solution: 'Hard refresh yap ve stil değiştiren tarayıcı eklentilerini kapat.' },
      { id: '6', icon: AlertTriangle, problem: 'İlan güncelleme başarısız', cause: 'Doğrulama uyuşmazlığı veya süresi dolmuş token.', solution: 'Zorunlu alanları kontrol edip tekrar giriş yaptıktan sonra dene.' },
    ];
  }
  return [
    { id: '1', icon: WifiOff, problem: 'Page is not loading', cause: 'Internet connection issue or temporary backend downtime.', solution: 'Check your connection, refresh the page, and retry after 1-2 minutes.' },
    { id: '2', icon: ShieldAlert, problem: 'Session closed unexpectedly', cause: 'Session timeout or browser cookie restrictions.', solution: 'Sign in again and enable cookies/local storage for this domain.' },
    { id: '3', icon: Filter, problem: 'Filters return no results', cause: 'No posts match selected filters.', solution: 'Remove strict filters or broaden stage/domain selections.' },
    { id: '4', icon: CalendarClock, problem: 'Cannot submit meeting request', cause: 'Post may be closed or required fields are incomplete.', solution: 'Recheck NDA acceptance, date/time fields, and post status.' },
    { id: '5', icon: RefreshCcw, problem: 'Calendar/date selection appears broken', cause: 'Stale cache or extension CSS override.', solution: 'Hard refresh the page and disable style-altering browser extensions.' },
    { id: '6', icon: AlertTriangle, problem: 'Post update fails', cause: 'Validation mismatch or expired auth token.', solution: 'Review required fields and retry after signing in again.' },
  ];
}

function TroubleshootingPage() {
  const { t, locale } = useLocale();
  const troubleshootingItems = React.useMemo(() => buildTroubleshootingItems(locale), [locale]);

  return (
    <div className="wizard-wrapper">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <GlowCard customSize glowColor="purple" className="w-full rounded-2xl border border-border/60 bg-card/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t('helpNeedHelp', 'Need Help')}</p>
          <h1 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">{t('helpTroubleshootingTitle', 'Troubleshooting')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('helpTroubleshootingDesc', 'Quick diagnostics for the most common platform and workflow problems.')}
          </p>
        </GlowCard>

        <GlowCard customSize glowColor="blue" className="w-full rounded-2xl border border-border/60 bg-card/80 p-6">
          <Accordion type="single" collapsible className="w-full" defaultValue="1">
            {troubleshootingItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full border border-border">
                      <item.icon size={16} className="opacity-75" />
                    </span>
                    <span className="text-left">{item.problem}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pl-12">
                  <p className="text-sm"><span className="font-semibold text-foreground">{t('helpPossibleCause', 'Possible cause:')}</span> {item.cause}</p>
                  <p className="text-sm"><span className="font-semibold text-foreground">{t('helpSolution', 'Solution:')}</span> {item.solution}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </GlowCard>
      </div>
    </div>
  );
}

export default TroubleshootingPage;
