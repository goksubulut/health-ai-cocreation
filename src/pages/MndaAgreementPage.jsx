import React from 'react';

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function MndaAgreementPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 lg:px-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3 border-b border-border/50 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Legal Document
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-foreground">
            Mutual Non-Disclosure Agreement (MNDA)
          </h1>
        </header>

        <Section title="Preamble">
          <p>
            This Mutual Non-Disclosure Agreement (&quot;Agreement&quot;) is entered into between the post creator
            (&quot;Disclosing Party&quot;) and the user expressing interest in collaboration (&quot;Receiving
            Party&quot;), collectively referred to as &quot;the Parties&quot;, through the HEALTH AI Co-Creation &
            Innovation Platform (&quot;Platform&quot;), operated in accordance with applicable data protection law
            including the EU General Data Protection Regulation (GDPR) and Turkish Law No. 6698 (KVKK).
          </p>
        </Section>

        <Section title="1. Purpose">
          <p>
            The Parties wish to explore a potential collaboration in the field of health technology and
            artificial intelligence. In connection with this evaluation, each Party may disclose certain
            Confidential Information to the other. This Agreement governs the protection of such information.
          </p>
        </Section>

        <Section title="2. Definition of confidential information">
          <p>
            &quot;Confidential Information&quot; means any non-public information disclosed by either Party through the
            Platform or during scheduled meetings, including but not limited to: technical data, clinical
            concepts, research findings, software designs, business strategies, patient-related insights (in
            anonymised or de-identified form only), and any information designated as confidential.
            Confidential Information does not include information that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>is or becomes publicly available through no breach of this Agreement;</li>
            <li>was rightfully known to the Receiving Party prior to disclosure;</li>
            <li>
              is independently developed by the Receiving Party without use of Confidential Information; or
            </li>
            <li>
              is required to be disclosed by applicable law or a competent authority, provided the Receiving
              Party gives prompt written notice.
            </li>
          </ul>
        </Section>

        <Section title="3. Obligations of the receiving party">
          <p>Each Party, as a Receiving Party, agrees to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              hold the Confidential Information in strict confidence using at least the same degree of care it
              uses for its own confidential information, but no less than reasonable care;
            </li>
            <li>not disclose Confidential Information to any third party without prior written consent;</li>
            <li>
              use Confidential Information solely for evaluating the potential collaboration described in the
              relevant Platform post;
            </li>
            <li>
              not reverse-engineer, copy, or exploit Confidential Information for any other purpose.
            </li>
          </ul>
        </Section>

        <Section title="4. Mutual nature">
          <p>
            This Agreement is mutual. Both the post creator and the interested user are simultaneously
            Disclosing Party and Receiving Party with respect to information they each share. Both Parties
            assume equivalent obligations of confidentiality.
          </p>
        </Section>

        <Section title="5. Term & termination">
          <p>
            This Agreement becomes effective upon digital acceptance through the Platform and remains in force
            for a period of two (2) years from the date of acceptance, or until the Parties enter into a
            formal collaboration agreement superseding this NDA, whichever occurs first. Obligations regarding
            Confidential Information disclosed during the term shall survive termination for a further two (2)
            years.
          </p>
        </Section>

        <Section title="6. No licence or partnership">
          <p>
            Nothing in this Agreement grants either Party any licence, ownership right, or other interest in
            the other Party&apos;s intellectual property. This Agreement does not establish any agency,
            partnership, or joint venture between the Parties.
          </p>
        </Section>

        <Section title="7. Patient data & healthcare compliance">
          <p>
            The Parties acknowledge that any health-related data shared during collaboration activities must
            comply with applicable healthcare privacy regulations. No identifiable patient data may be shared
            through the Platform. Where clinical information is shared in meetings, it must be fully anonymised
            in accordance with relevant medical ethics standards and GDPR Article 9 requirements for special
            category data.
          </p>
        </Section>

        <Section title="8. Remedies">
          <p>
            Each Party acknowledges that a breach of this Agreement may cause irreparable harm for which
            monetary damages would be an inadequate remedy. Accordingly, the non-breaching Party shall be
            entitled to seek equitable relief, including injunctions, in addition to any other remedies
            available at law.
          </p>
        </Section>

        <Section title="9. Governing law">
          <p>
            This Agreement shall be governed by the laws of the Republic of Turkey. Any disputes arising out
            of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the
            courts of Ankara, Turkey.
          </p>
        </Section>

        <Section title="10. Entire agreement">
          <p>
            This Agreement constitutes the entire understanding between the Parties with respect to the subject
            matter herein and supersedes all prior discussions. Any amendment must be in writing and agreed by
            both Parties.
          </p>
        </Section>
      </div>
    </div>
  );
}
