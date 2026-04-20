import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth, getDashboardPathByRole } from '@/lib/auth';
import { DatePickerField } from '@/components/ui/date-picker-field';

const inputClass =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground';

const EXPERTISE_LABELS = {
  ml_engineer: 'Machine Learning Engineer',
  data_scientist: 'Data Scientist',
  surgeon: 'Surgeon / Clinical Lead',
  other: 'Other',
};

/** Maps form step-2 values to API project_stage */
function mapStageToApi(stage) {
  const map = {
    idea: 'idea',
    validation: 'concept_validation',
    prototype: 'prototype',
    pilot: 'pilot',
    pre_deployment: 'pre_deployment',
  };
  return map[stage] ?? undefined;
}

function parseLocation(raw) {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], country: parts.slice(1).join(', ') };
  }
  return { city: parts[0] || null, country: null };
}

const STAGE_FROM_API = {
  idea: 'idea',
  concept_validation: 'validation',
  prototype: 'prototype',
  pilot: 'pilot',
  pre_deployment: 'pre_deployment',
};

function expertiseStringToKey(requiredExpertise) {
  if (!requiredExpertise) return '';
  const found = Object.entries(EXPERTISE_LABELS).find(
    ([, label]) => label === requiredExpertise
  );
  return found ? found[0] : 'other';
}

function expertiseStringToOtherValue(requiredExpertise) {
  if (!requiredExpertise) return '';
  const known = Object.values(EXPERTISE_LABELS).includes(requiredExpertise);
  return known ? '' : requiredExpertise;
}

function mapPostApiToForm(p) {
  let location = '';
  if (p.city && p.country) location = `${p.city}, ${p.country}`;
  else if (p.city) location = p.city;
  else if (p.country) location = p.country;

  let expiration = '';
  if (p.expiry_date) {
    const d = String(p.expiry_date);
    expiration = d.length >= 10 ? d.slice(0, 10) : '';
  }

  return {
    title: p.title || '',
    desc: p.description || '',
    area: p.domain || '',
    roleNeeded: expertiseStringToKey(p.required_expertise),
    otherExpertise: expertiseStringToOtherValue(p.required_expertise),
    stage: STAGE_FROM_API[p.project_stage] || '',
    privacy: p.confidentiality === 'meeting_only' ? 'confidential' : 'public',
    location,
    expiration,
  };
}

function PostForm() {
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    area: '',
    roleNeeded: '',
    otherExpertise: '',
    stage: '',
    privacy: '',
    location: '',
    expiration: '',
  });
  const [originalStatus, setOriginalStatus] = useState('draft');
  const submitActionRef = useRef('active');

  useEffect(() => {
    if (!isEdit || !editId) {
      setLoadingPost(false);
      return;
    }
    const load = async () => {
      const auth = getAuth();
      if (!auth?.accessToken) {
        setLoadError('You must be signed in.');
        setLoadingPost(false);
        return;
      }
      setLoadingPost(true);
      setLoadError('');
      try {
        const res = await fetch(`/api/posts/${editId}`, {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || 'Could not load post.');
        }
        const p = json.data;
        if (!p) throw new Error('Invalid response.');
        setOriginalStatus(p.status || 'draft');
        setFormData(mapPostApiToForm(p));
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not load post.');
      } finally {
        setLoadingPost(false);
      }
    };
    load();
  }, [isEdit, editId]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (step < 3) return handleNext();

    const submitAction = submitActionRef.current;

    const auth = getAuth();
    if (!auth?.accessToken) {
      setSubmitError('You must be signed in to create a post.');
      return;
    }

    const desc = formData.desc.trim();
    if (desc.length < 50) {
      setSubmitError('Description must be at least 50 characters.');
      return;
    }

    const projectStage = mapStageToApi(formData.stage);
    const { city, country } = parseLocation(formData.location);

    const body = {
      title: formData.title.trim(),
      domain: formData.area.trim(),
      description: desc,
      required_expertise:
        formData.roleNeeded === 'other'
          ? formData.otherExpertise.trim()
          : (EXPERTISE_LABELS[formData.roleNeeded] || formData.roleNeeded),
      project_stage: projectStage,
      confidentiality: formData.privacy === 'confidential' ? 'meeting_only' : 'public',
      status: submitAction,
      city: city || undefined,
      country: country || undefined,
    };

    if (!body.required_expertise) {
      setSubmitError('Please enter the expertise needed.');
      return;
    }

    if (formData.expiration) {
      body.expiry_date = new Date(`${formData.expiration}T12:00:00`).toISOString();
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/posts/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            (Array.isArray(data.errors) && data.errors[0]) ||
            data.message ||
            data.error ||
            'Could not update post.';
          throw new Error(msg);
        }

        if (originalStatus !== submitAction) {
          const patchRes = await fetch(`/api/posts/${editId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.accessToken}`,
            },
            body: JSON.stringify({ status: submitAction }),
          });
          if (!patchRes.ok) {
            const patchData = await patchRes.json().catch(() => ({}));
            console.error('Could not update status:', patchData);
          }
        }
      } else {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            (Array.isArray(data.errors) && data.errors[0]) ||
            data.message ||
            data.error ||
            'Could not create post.';
          throw new Error(msg);
        }
      }
      navigate(getDashboardPathByRole(auth.user.role));
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : isEdit ? 'Could not update post.' : 'Could not create post.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { n: 1, label: 'Basics' },
    { n: 2, label: 'Details' },
    { n: 3, label: 'Logistics' },
  ];

  if (loadingPost) {
    return (
      <div className="wizard-wrapper flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading post…</p>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="wizard-wrapper flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{loadError}</p>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="wizard-wrapper">
      <div className="wizard-container">
        <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
          {isEdit ? 'Edit post' : 'Create post'}
        </p>
        <div className="mb-8 space-y-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium sm:text-sm">
            {steps.map((s) => (
              <span
                key={s.n}
                className={
                  step >= s.n
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }
              >
                <span className="mr-1 hidden sm:inline">{s.n}.</span>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-md lg:p-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col">
            {submitError && (
              <div
                className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {submitError}
              </div>
            )}
            <div className="min-h-[280px] sm:min-h-[320px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2 border-b border-border/40 pb-6">
                      <h3 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
                        Project Basics
                      </h3>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Start by outlining your primary goals.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="post-title" className={labelClass}>
                        Project title
                      </label>
                      <input
                        id="post-title"
                        type="text"
                        className={inputClass}
                        placeholder="e.g. AI-driven cardiac imaging pipeline"
                        required
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="post-area" className={labelClass}>
                        Study area
                      </label>
                      <input
                        id="post-area"
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Cardiology, Radiology ML"
                        required
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({ ...formData, area: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="post-desc" className={labelClass}>
                        Short description & goals
                      </label>
                      <textarea
                        id="post-desc"
                        rows={4}
                        className={`${inputClass} min-h-[120px] resize-y py-3`}
                        placeholder="What problem are you solving? Who benefits? What do you need from collaborators? (min. 50 characters)"
                        required
                        minLength={50}
                        value={formData.desc}
                        onChange={(e) =>
                          setFormData({ ...formData, desc: e.target.value })
                        }
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2 border-b border-border/40 pb-6">
                      <h3 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
                        Needs & Collaboration
                      </h3>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        What kind of expertise are you looking for?
                      </p>
                    </div>
                    <div>
                      <label htmlFor="post-expertise" className={labelClass}>
                        Expertise needed
                      </label>
                      <select
                        id="post-expertise"
                        className={inputClass}
                        required
                        value={formData.roleNeeded}
                        onChange={(e) =>
                          setFormData({ ...formData, roleNeeded: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Select expertise…
                        </option>
                        <option value="ml_engineer">Machine Learning Engineer</option>
                        <option value="data_scientist">Data Scientist</option>
                        <option value="surgeon">Surgeon / Clinical Lead</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {formData.roleNeeded === 'other' && (
                      <div>
                        <label htmlFor="post-expertise-other" className={labelClass}>
                          Custom expertise
                        </label>
                        <input
                          id="post-expertise-other"
                          type="text"
                          className={inputClass}
                          placeholder="e.g. Biomedical Signal Processing Specialist"
                          required
                          value={formData.otherExpertise}
                          onChange={(e) =>
                            setFormData({ ...formData, otherExpertise: e.target.value })
                          }
                        />
                      </div>
                    )}
                    <div>
                      <label htmlFor="post-stage" className={labelClass}>
                        Project stage
                      </label>
                      <select
                        id="post-stage"
                        className={inputClass}
                        required
                        value={formData.stage}
                        onChange={(e) =>
                          setFormData({ ...formData, stage: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Select stage…
                        </option>
                        <option value="idea">Idea / concept</option>
                        <option value="validation">Concept validation</option>
                        <option value="prototype">Prototype</option>
                        <option value="pilot">Pilot</option>
                        <option value="pre_deployment">Pre-deployment</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="post-privacy" className={labelClass}>
                        Privacy level
                      </label>
                      <select
                        id="post-privacy"
                        className={inputClass}
                        required
                        value={formData.privacy}
                        onChange={(e) =>
                          setFormData({ ...formData, privacy: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Select visibility…
                        </option>
                        <option value="public">Publicly visible</option>
                        <option value="confidential">
                          Confidential (NDA & meeting)
                        </option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2 border-b border-border/40 pb-6">
                      <h3 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
                        Final logistics
                      </h3>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Where is this happening and what is the timeline?
                      </p>
                    </div>
                    <div>
                      <label htmlFor="post-location" className={labelClass}>
                        City & country
                      </label>
                      <input
                        id="post-location"
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Istanbul, Turkey"
                        required
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="post-expiry" className={labelClass}>
                        Target end date
                      </label>
                      <DatePickerField
                        value={formData.expiration}
                        onChange={(date) => setFormData({ ...formData, expiration: date })}
                        placeholder="Select target date"
                        min={new Date().toISOString().slice(0, 10)}
                      />
                      <input
                        id="post-expiry"
                        type="text"
                        value={formData.expiration}
                        onChange={() => {}}
                        required
                        aria-hidden="true"
                        tabIndex={-1}
                        className="h-0 w-0 opacity-0"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/40 pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn-secondary"
                >
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              <div className="min-w-[1rem] flex-1" />
              {step < 3 ? (
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  Next step <ArrowRight size={18} />
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="btn-secondary"
                    disabled={isSubmitting}
                    onClick={() => { submitActionRef.current = 'draft'; }}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    onClick={() => { submitActionRef.current = 'active'; }}
                  >
                    {isEdit ? 'Save Changes & Publish' : 'Publish'}
                    {!isSubmitting && <CheckCircle2 size={18} className="ml-1" />}
                  </button>
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default PostForm;
