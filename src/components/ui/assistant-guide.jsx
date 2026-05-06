import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Play, Sparkles, X } from 'lucide-react';
import { useTour } from '@/contexts/tour-context';
import { getAuth, getDashboardPathByRole } from '@/lib/auth';

const SPOTLIGHT_PADDING = 12;
const TOOLTIP_WIDTH = 360;
const EDGE_GAP = 20;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDashboardPath() {
  const auth = getAuth();
  return auth?.user?.role ? getDashboardPathByRole(auth.user.role) : null;
}

function resolveRoute(route) {
  if (!route) return null;
  return route === 'dashboard' ? getDashboardPath() : route;
}

function readTargetRect(selector) {
  if (!selector) return null;
  const element = document.querySelector(selector);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  return {
    top: Math.max(EDGE_GAP, rect.top - SPOTLIGHT_PADDING),
    left: Math.max(EDGE_GAP, rect.left - SPOTLIGHT_PADDING),
    width: Math.min(window.innerWidth - EDGE_GAP * 2, rect.width + SPOTLIGHT_PADDING * 2),
    height: Math.min(window.innerHeight - EDGE_GAP * 2, rect.height + SPOTLIGHT_PADDING * 2),
    radius: Number.parseFloat(getComputedStyle(element).borderRadius) || 18,
  };
}

function getTooltipPosition(rect, preferredPlacement = 'bottom') {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!rect) {
    return {
      left: clamp((viewportWidth - TOOLTIP_WIDTH) / 2, EDGE_GAP, viewportWidth - TOOLTIP_WIDTH - EDGE_GAP),
      top: clamp(viewportHeight / 2 - 180, EDGE_GAP, viewportHeight - 380),
    };
  }

  const placements = [
    preferredPlacement,
    'bottom',
    'top',
    'left',
    'right',
  ].filter((placement, index, list) => placement && list.indexOf(placement) === index);

  for (const placement of placements) {
    if (placement === 'bottom' && rect.top + rect.height + 18 + 250 < viewportHeight) {
      return {
        left: clamp(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, EDGE_GAP, viewportWidth - TOOLTIP_WIDTH - EDGE_GAP),
        top: rect.top + rect.height + 18,
      };
    }

    if (placement === 'top' && rect.top - 268 > EDGE_GAP) {
      return {
        left: clamp(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, EDGE_GAP, viewportWidth - TOOLTIP_WIDTH - EDGE_GAP),
        top: rect.top - 268,
      };
    }

    if (placement === 'left' && rect.left - TOOLTIP_WIDTH - 18 > EDGE_GAP) {
      return {
        left: rect.left - TOOLTIP_WIDTH - 18,
        top: clamp(rect.top + rect.height / 2 - 130, EDGE_GAP, viewportHeight - 300),
      };
    }

    if (placement === 'right' && rect.left + rect.width + TOOLTIP_WIDTH + 18 < viewportWidth) {
      return {
        left: rect.left + rect.width + 18,
        top: clamp(rect.top + rect.height / 2 - 130, EDGE_GAP, viewportHeight - 300),
      };
    }
  }

  return {
    left: clamp(viewportWidth / 2 - TOOLTIP_WIDTH / 2, EDGE_GAP, viewportWidth - TOOLTIP_WIDTH - EDGE_GAP),
    top: clamp(viewportHeight - 340, EDGE_GAP, viewportHeight - 300),
  };
}

function AssistantOrb({ active = false, compact = false }) {
  return (
    <motion.div
      className={`assistant-orb ${active ? 'is-active' : ''} ${compact ? 'is-compact' : ''}`}
      aria-hidden="true"
      animate={{ y: active ? [0, -5, 0] : [0, -3, 0] }}
      transition={{ duration: active ? 2.2 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="assistant-orb__halo" />
      <span className="assistant-orb__core" />
      <span className="assistant-orb__ring assistant-orb__ring--one" />
      <span className="assistant-orb__ring assistant-orb__ring--two" />
      <span className="assistant-orb__spark assistant-orb__spark--one" />
      <span className="assistant-orb__spark assistant-orb__spark--two" />
    </motion.div>
  );
}

export function AssistantGuide() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    isActive,
    currentStep,
    stepData,
    totalSteps,
    nextStep,
    endTour,
    startTour,
    setCurrentStep,
  } = useTour();
  const [isHovered, setIsHovered] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [targetFound, setTargetFound] = useState(false);

  const isHiddenRoute = pathname === '/' || pathname === '/auth';
  const progress = useMemo(() => ((currentStep + 1) / totalSteps) * 100, [currentStep, totalSteps]);

  useEffect(() => {
    if (!isActive || !stepData) return;

    const route = resolveRoute(stepData.route);
    if (route && pathname !== route) {
      navigate(route);
    }
  }, [isActive, stepData, pathname, navigate]);

  useEffect(() => {
    if (!isActive || !stepData) {
      setSpotlightRect(null);
      setTargetFound(false);
      return;
    }

    let frameId;
    const targetSelector = stepData.target;

    const syncTarget = () => {
      const rect = readTargetRect(targetSelector);
      setSpotlightRect(rect);
      setTargetFound(Boolean(rect));

      if (targetSelector) {
        const element = document.querySelector(targetSelector);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    };

    const delayedSync = () => {
      window.clearTimeout(frameId);
      frameId = window.setTimeout(syncTarget, 180);
    };

    delayedSync();
    window.addEventListener('resize', delayedSync);
    window.addEventListener('scroll', syncTarget, true);

    return () => {
      window.clearTimeout(frameId);
      window.removeEventListener('resize', delayedSync);
      window.removeEventListener('scroll', syncTarget, true);
    };
  }, [isActive, stepData, pathname]);

  useEffect(() => {
    document.body.classList.toggle('tour-is-active', Boolean(isActive && !isHiddenRoute));
    return () => document.body.classList.remove('tour-is-active');
  }, [isActive, isHiddenRoute]);

  if (isHiddenRoute) return null;

  const tooltipPosition = getTooltipPosition(spotlightRect, stepData?.placement);
  const hasPrevious = currentStep > 0;

  return (
    <>
      <AnimatePresence>
        {isActive && stepData && (
          <motion.div
            key="tour-layer"
            className="fixed inset-0 z-[90] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="tour-scrim tour-scrim--top" style={{ height: spotlightRect ? spotlightRect.top : '100%' }} />
            {spotlightRect && (
              <>
                <div className="tour-scrim tour-scrim--left" style={{ top: spotlightRect.top, left: 0, width: spotlightRect.left, height: spotlightRect.height }} />
                <div className="tour-scrim tour-scrim--right" style={{ top: spotlightRect.top, left: spotlightRect.left + spotlightRect.width, right: 0, height: spotlightRect.height }} />
                <div className="tour-scrim tour-scrim--bottom" style={{ top: spotlightRect.top + spotlightRect.height, height: `calc(100% - ${spotlightRect.top + spotlightRect.height}px)` }} />
                <motion.div
                  layout
                  className="tour-spotlight"
                  style={{
                    top: spotlightRect.top,
                    left: spotlightRect.left,
                    width: spotlightRect.width,
                    height: spotlightRect.height,
                    borderRadius: Math.max(18, spotlightRect.radius + 10),
                  }}
                />
              </>
            )}

            <motion.div
              key={currentStep}
              className="tour-card pointer-events-auto"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
            >
              <div className="tour-card__ambient" />
              <div className="tour-card__header">
                <AssistantOrb active compact />
                <div>
                  <span className="tour-card__eyebrow">{stepData.eyebrow || 'Guided tour'}</span>
                  <h3>{stepData.title}</h3>
                </div>
                <button type="button" className="tour-icon-button" onClick={endTour} aria-label="Close tour">
                  <X size={16} />
                </button>
              </div>

              <p>{stepData.content}</p>

              {!targetFound && stepData.target && (
                <div className="tour-card__hint">
                  This part may appear after opening the related workspace. I will keep the tour moving with you.
                </div>
              )}

              <div className="tour-progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>

              <div className="tour-card__footer">
                <div className="tour-step-count">
                  <span>{String(currentStep + 1).padStart(2, '0')}</span>
                  <em>/</em>
                  <span>{String(totalSteps).padStart(2, '0')}</span>
                </div>
                <div className="tour-card__actions">
                  <button
                    type="button"
                    className="tour-ghost-button"
                    onClick={() => hasPrevious && setCurrentStep((step) => step - 1)}
                    disabled={!hasPrevious}
                  >
                    <ChevronLeft size={15} />
                    Back
                  </button>
                  <button type="button" className="tour-primary-button" onClick={nextStep}>
                    {currentStep === totalSteps - 1 ? (
                      <>
                        Finish <Check size={15} />
                      </>
                    ) : (
                      <>
                        {stepData.action || 'Next'} <ChevronRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="assistant-launcher fixed bottom-6 right-6 z-[80] pointer-events-none">
        <AnimatePresence>
          {!isActive && isHovered && (
            <motion.button
              type="button"
              className="assistant-launcher__bubble pointer-events-auto"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              onClick={startTour}
            >
              <Play size={13} />
              Replay tour
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          className="assistant-launcher__orb pointer-events-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          onClick={startTour}
          aria-label="Open Health AI product tour"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 210, damping: 22 }}
        >
          <AssistantOrb active={isActive} />
          <span className="assistant-launcher__badge">
            <Sparkles size={13} />
          </span>
        </motion.button>
      </div>
    </>
  );
}
