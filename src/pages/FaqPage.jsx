import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, HelpCircle, ShieldCheck, Bell, LifeBuoy } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { GlowCard } from '@/components/ui/spotlight-card';

const faqItems = [
  {
    question: 'My .edu email is not accepted. What should I do?',
    answer:
      'Use an institutional email with a valid .edu or .edu.tr domain. Personal domains are not allowed. If the issue continues, contact support with your institution details.',
  },
  {
    question: "I did not receive the verification email. What should I do?",
    answer:
      'Check your spam/junk folder first. Then use "Resend Verification Email" on the login screen. If your mailbox has strict filters, whitelist our support address.',
  },
  {
    question: 'Can I edit a published post?',
    answer:
      'Yes. You can open your post and update it while it is in Draft or Active status. Changes are saved immediately after submission.',
  },
  {
    question: 'How do I delete my account and personal data?',
    answer:
      'Open Profile Settings and choose Delete Account. This action is permanent and removes personal account access. Some legal logs may be retained for security compliance.',
  },
  {
    question: 'Are meetings held on this platform?',
    answer:
      'No. Meetings are held on external platforms like Zoom or Microsoft Teams. The platform handles scheduling, request management, and collaboration context.',
  },
  {
    question: 'Can I have multiple active posts?',
    answer:
      'Yes, but keep only currently relevant posts active. We recommend archiving outdated posts to improve matching quality and visibility for collaborators.',
  },
  {
    question: 'Can I save a post as draft and publish later?',
    answer:
      'Absolutely. You can save as Draft during creation, revisit from your dashboard, and publish when your requirements and timeline are finalized.',
  },
  {
    question: 'Who can see confidential projects?',
    answer:
      'Confidential projects are visibility-restricted and require NDA-aware collaboration flow. Sensitive details are exposed only in approved meeting contexts.',
  },
  {
    question: 'How do meeting request approvals work?',
    answer:
      'The project owner reviews incoming requests, checks profile fit, and can approve or reject. Status updates appear in the meetings section.',
  },
];

const items = [
  { id: '1', icon: HelpCircle, title: 'Account Access', sub: 'Email verification and login support', content: faqItems[0].answer },
  { id: '2', icon: Bell, title: 'Verification Email', sub: 'Delivery and inbox troubleshooting', content: faqItems[1].answer },
  { id: '3', icon: ShieldCheck, title: 'Privacy & Data', sub: 'Deletion, confidentiality, and security', content: `${faqItems[3].answer} ${faqItems[7].answer}` },
  { id: '4', icon: LifeBuoy, title: 'Meetings & Collaboration', sub: 'Requests, approvals, and scheduling', content: `${faqItems[4].answer} ${faqItems[8].answer}` },
];

function FaqPage() {
  return (
    <div className="wizard-wrapper">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <GlowCard customSize glowColor="purple" className="w-full rounded-2xl border border-border/60 bg-card/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Need Help</p>
          <h1 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">Frequently Asked Questions</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Expand each section for detailed answers about account setup, meetings, privacy, and publishing.
          </p>
        </GlowCard>

        <GlowCard customSize glowColor="blue" className="w-full rounded-2xl border border-border/60 bg-card/80 p-6">
          <Accordion type="single" collapsible className="w-full" defaultValue="1">
            {items.map((item) => (
              <AccordionItem value={item.id} key={item.id} className="py-2">
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 text-left text-[15px] font-semibold leading-6 transition-all [&[data-state=open]>svg]:rotate-180">
                    <span className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border">
                        <item.icon size={16} className="opacity-70" />
                      </span>
                      <span className="flex flex-col space-y-1">
                        <span>{item.title}</span>
                        <span className="text-sm font-normal text-muted-foreground">{item.sub}</span>
                      </span>
                    </span>
                    <ChevronDown size={16} className="shrink-0 opacity-60 transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="ms-3 pb-2 ps-10 text-muted-foreground">{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </GlowCard>

        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.slice(2).map((item, idx) => (
            <GlowCard
              key={item.question}
              customSize
              glowColor={idx % 2 === 0 ? 'purple' : 'blue'}
              className="h-full w-full rounded-2xl border border-border/60 bg-card/80 p-5"
            >
              <h3 className="mb-2 text-base font-semibold text-foreground">{item.question}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </GlowCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FaqPage;
