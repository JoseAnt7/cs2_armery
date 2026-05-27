import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackVisit } from '../api/client';

const SESSION_KEY = 'cs2_armery_visit_sent';

export function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    trackVisit(location.pathname || '/');
  }, [location.pathname]);

  return null;
}
