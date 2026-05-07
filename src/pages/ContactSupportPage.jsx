import React from 'react';
import { LifeBuoy, Mail, MessageSquareWarning, ShieldCheck } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { useLocale } from '@/contexts/locale-context';

function buildSupportChannels(t) {
  return [
    { channel: t('supportEmailTitle', 'Support Email'), details: t('supportEmailDetails', 'support@healthai.edu - Use for account recovery, verification issues, and technical blockers. Include your institution and user role.'), icon: Mail },
    { channel: t('supportFeedbackTitle', 'In-Platform Feedback'), details: t('supportFeedbackDetails', 'Use the built-in feedback flow to report UI issues, broken forms, and product suggestions with reproducible steps.'), icon: MessageSquareWarning },
    { channel: t('supportSecurityTitle', 'Security & Privacy Desk'), details: t('supportSecurityDetails', 'security@healthai.edu - Contact for privacy requests, suspicious activity reports, or vulnerability disclosure.'), icon: ShieldCheck },
    { channel: t('supportCollabTitle', 'Collaboration Support'), details: t('supportCollabDetails', 'collab-support@healthai.edu - For meeting coordination issues, role mismatch clarifications, and collaboration policy help.'), icon: LifeBuoy },
  ];
}

function ContactSupportPage() {
  const { t, locale } = useLocale();
  const supportChannels = React.useMemo(() => buildSupportChannels(t), [t, locale]);

  return (
    <div className="wizard-wrapper">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <GlowCard customSize glowColor="purple" className="w-full rounded-2xl border border-border/60 bg-card/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t('helpNeedHelp', 'Need Help')}</p>
          <h1 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">{t('helpContactSupportTitle', 'Contact & Support')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('helpContactSupportDesc', 'Choose the correct support channel for faster resolution and escalation.')}
          </p>
        </GlowCard>

        <div className="grid gap-4 md:grid-cols-2">
          {supportChannels.map((item, idx) => {
            const Icon = item.icon;
            return (
              <GlowCard
                key={item.channel}
                customSize
                glowColor={idx % 2 === 0 ? 'blue' : 'purple'}
                className="h-full w-full rounded-2xl border border-border/60 bg-card/80 p-5"
              >
                <div className="mb-3 flex items-center gap-2 text-foreground">
                  <Icon size={18} />
                  <h3 className="text-base font-semibold">{item.channel}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.details}</p>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ContactSupportPage;
