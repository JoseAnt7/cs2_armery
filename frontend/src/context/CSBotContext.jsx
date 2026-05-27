import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useRef,

  useState,

} from 'react';

import { fetchCSBotStatus, fetchCSBotSettings, runCSBotSearch, saveCSBotSettings } from '../api/client';



const CSBotContext = createContext(null);

const POLL_INTERVAL_MS = 50000;



function getToken() {

  return localStorage.getItem('access_token');

}



function mergeMatches(existing, incoming) {

  const map = new Map();

  for (const row of existing) {

    const key = `${row.market_hash_name}|${row.listing_id || ''}|${row.listing_price_usd}`;

    map.set(key, row);

  }

  for (const row of incoming) {

    const key = `${row.market_hash_name}|${row.listing_id || ''}|${row.listing_price_usd}`;

    map.set(key, row);

  }

  return [...map.values()].sort((a, b) => b.drop_percent - a.drop_percent);

}



export function CSBotProvider({ children }) {

  const [active, setActive] = useState(false);

  const [plan, setPlan] = useState(null);

  const [limits, setLimits] = useState(null);

  const [settings, setSettings] = useState({});

  const [ready, setReady] = useState(false);



  const [monitoring, setMonitoring] = useState(false);

  const [monitorEndsAt, setMonitorEndsAt] = useState(null);

  const [monitorResults, setMonitorResults] = useState(null);

  const [monitorError, setMonitorError] = useState('');

  const [monitorBusy, setMonitorBusy] = useState(false);

  const [monitorTick, setMonitorTick] = useState(0);



  const pollRef = useRef(null);

  const offsetRef = useRef(0);

  const paramsRef = useRef(null);



  const refresh = useCallback(async () => {

    const token = getToken();

    if (!token) {

      setActive(false);

      setPlan(null);

      setLimits(null);

      setSettings({});

      setReady(true);

      return;

    }



    try {

      const status = await fetchCSBotStatus();

      setActive(status.active);

      setPlan(status.plan);

      setLimits(status.limits);



      if (status.active) {

        const saved = await fetchCSBotSettings();

        setSettings(saved.settings || {});

      } else {

        setSettings({});

      }

    } catch {

      setActive(false);

    } finally {

      setReady(true);

    }

  }, []);



  const stopMonitoring = useCallback(() => {

    if (pollRef.current) {

      clearInterval(pollRef.current);

      pollRef.current = null;

    }

    setMonitoring(false);

    setMonitorEndsAt(null);

    setMonitorBusy(false);

    offsetRef.current = 0;

  }, []);



  const runPoll = useCallback(async () => {

    const params = paramsRef.current;

    if (!params) return;



    setMonitorBusy(true);

    setMonitorError('');



    try {

      const data = await runCSBotSearch({

        ...params,

        group_offset: offsetRef.current,

      });

      offsetRef.current = data.group_offset ?? offsetRef.current;

      if (data.groups_total) {

        offsetRef.current = (offsetRef.current + (data.groups_scanned || 1)) % data.groups_total;

      }



      setMonitorResults((prev) => {

        const base = prev?.matches ? prev : { matches: [], scanned: 0 };

        return {

          ...data,

          matches: mergeMatches(base.matches, data.matches || []),

        };

      });

      setMonitorTick((t) => t + 1);

    } catch (err) {

      setMonitorError(err.message);

    } finally {

      setMonitorBusy(false);

    }

  }, []);



  const startMonitoring = useCallback(

    async (searchParams, durationMinutes) => {

      stopMonitoring();

      paramsRef.current = searchParams;

      offsetRef.current = 0;

      setMonitorResults(null);

      setMonitorError('');



      const mins = Number(durationMinutes) || 15;

      const endsAt = Date.now() + mins * 60 * 1000;

      setMonitorEndsAt(endsAt);

      setMonitoring(true);



      try {

        await saveCSBotSettings({

          ...searchParams,

          monitor_duration_minutes: mins,

        });

      } catch {

        /* ok */

      }



      await runPoll();

      pollRef.current = setInterval(() => {

        if (Date.now() >= endsAt) {

          stopMonitoring();

          return;

        }

        runPoll();

      }, POLL_INTERVAL_MS);

    },

    [runPoll, stopMonitoring],

  );



  useEffect(() => {

    refresh();

    const onAuth = () => {

      setReady(false);

      stopMonitoring();

      refresh();

    };

    window.addEventListener('auth-changed', onAuth);

    window.addEventListener('storage', onAuth);

    return () => {

      window.removeEventListener('auth-changed', onAuth);

      window.removeEventListener('storage', onAuth);

      if (pollRef.current) clearInterval(pollRef.current);

    };

  }, [refresh, stopMonitoring]);



  useEffect(() => {

    if (!monitoring || !monitorEndsAt) return undefined;

    const timer = setInterval(() => {

      if (Date.now() >= monitorEndsAt) stopMonitoring();

    }, 1000);

    return () => clearInterval(timer);

  }, [monitoring, monitorEndsAt, stopMonitoring]);



  return (

    <CSBotContext.Provider

      value={{

        active,

        plan,

        limits,

        settings,

        setSettings,

        ready,

        refresh,

        monitoring,

        monitorEndsAt,

        monitorResults,

        monitorError,

        monitorBusy,

        monitorTick,

        startMonitoring,

        stopMonitoring,

        runPoll,

      }}

    >

      {children}

    </CSBotContext.Provider>

  );

}



export function useCSBot() {

  const ctx = useContext(CSBotContext);

  if (!ctx) throw new Error('useCSBot debe usarse dentro de CSBotProvider');

  return ctx;

}


