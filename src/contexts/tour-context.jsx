import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TourContext = createContext();

const TOUR_STEPS = [
  {
    target: null,
    eyebrow: 'Health AI Assistant',
    title: 'Welcome to your collaboration cockpit',
    content: 'I will show the places that matter most: your dashboard, quick actions, discovery board, requests, and account controls.',
    action: 'Begin tour',
    tone: 'intro',
  },
  {
    target: '[data-tour="sidebar-nav"]',
    eyebrow: 'Global navigation',
    title: 'Move between the core workspaces',
    content: 'Use this navigation to jump between discovery, your dashboard, help resources, and the account area without losing context.',
    action: 'Show dashboard',
    placement: 'bottom',
  },
  {
    route: 'dashboard',
    target: '[data-tour="dashboard-overview"]',
    eyebrow: 'Dashboard overview',
    title: 'Your live project signal',
    content: 'These metrics summarize active posts, incoming requests, and recommendations so you can decide what needs attention first.',
    action: 'Quick actions',
    placement: 'bottom',
  },
  {
    route: 'dashboard',
    target: '[data-tour="create-post-btn"]',
    eyebrow: 'Quick action',
    title: 'Publish a project when you are ready',
    content: 'This starts the guided project brief. A clear brief helps the matching engine surface the right clinicians, engineers, and researchers.',
    action: 'Requests',
    placement: 'right',
  },
  {
    route: 'dashboard',
    target: '[data-tour="meetings-tab"]',
    eyebrow: 'Requests workspace',
    title: 'Turn matches into real conversations',
    content: 'Open the requests workspace to review inbound interest, NDA status, and scheduled meeting activity.',
    action: 'Discover board',
    placement: 'right',
  },
  {
    route: '/board',
    target: '[data-tour="discover-board"]',
    eyebrow: 'Discover board',
    title: 'Find high-fit collaborators and projects',
    content: 'The board is where Health AI becomes searchable. Filter by expertise, inspect match scores, save promising listings, and open a project when it feels relevant.',
    action: 'Account tools',
    placement: 'top',
  },
  {
    target: '[data-tour="settings-nav"]',
    eyebrow: 'Account controls',
    title: 'Tune the experience around you',
    content: 'Theme, notifications, profile access, and account actions live here. A complete profile gives the platform better context for recommendations.',
    action: 'Finish',
    placement: 'bottom',
  }
];

export function TourProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenHealthAITour');
    // Only auto-start if they are on a protected page (like /dashboard), not landing or auth
    if (!hasSeenTour && pathname.includes('/dashboard')) {
      const t = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const endTour = () => {
    setIsActive(false);
    localStorage.setItem('hasSeenHealthAITour', 'true');
  };

  return (
    <TourContext.Provider value={{
      isActive,
      currentStep,
      stepData: TOUR_STEPS[currentStep],
      totalSteps: TOUR_STEPS.length,
      startTour,
      nextStep,
      endTour,
      setCurrentStep,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
