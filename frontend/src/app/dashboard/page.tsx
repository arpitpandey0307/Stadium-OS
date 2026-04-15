'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { fetchDecisions } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import MetricsPanel from '@/components/MetricsPanel';
import DecisionPanel from '@/components/DecisionPanel';

// Leaflet must be loaded client-side only (no SSR)
const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-gray-800 bg-gray-900/40">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function DashboardPage() {
  const fetcher = useCallback(() => fetchDecisions(), []);
  const { data, error, loading } = usePolling(fetcher, 2000);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center">
          <p className="text-lg font-semibold text-red-400">Connection Error</p>
          <p className="mt-1 text-sm text-gray-400">
            Cannot reach backend at http://localhost:8080
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Make sure the backend is running: <code className="text-gray-400">cd backend && npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          Connecting to StadiumOS...
        </div>
      </div>
    );
  }

  const { agentReports, decisions, phase, tick, totalUsers } = data;
  const zones = agentReports?.crowd
    ? (() => {
        // Reconstruct zones from the full coordinator response
        // We re-fetch zones from the status to get full zone data
        return null;
      })()
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <a href="/" className="text-xl font-bold">
            <span className="text-white">Stadium</span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">OS</span>
          </a>
          <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400 font-mono">
            Dashboard
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>v1.0</span>
        </div>
      </header>

      {/* Main content - 3 column layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left - Metrics */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-950/50 p-4">
          <MetricsPanel
            systemInfo={{ totalUsers, tick, phase, lastUpdated: data.timestamp }}
            agentReports={agentReports}
          />
        </aside>

        {/* Center - Map */}
        <section className="flex-1 p-4">
          <ZoneMapWrapper />
        </section>

        {/* Right - Decisions */}
        <aside className="w-96 flex-shrink-0 overflow-y-auto border-l border-gray-800 bg-gray-950/50 p-4">
          <DecisionPanel decisions={decisions} totalUsers={totalUsers} />
        </aside>
      </main>
    </div>
  );
}

/**
 * Separate component that polls /api/zones for map data
 * (independent polling from the main decisions endpoint).
 */
function ZoneMapWrapper() {
  const fetcher = useCallback(async () => {
    const res = await fetch(
      (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/api/zones'
    );
    return res.json();
  }, []);

  const { data: zones } = usePolling(fetcher, 2000);

  if (!zones) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-gray-800 bg-gray-900/40">
        <div className="text-gray-500">Waiting for zone data...</div>
      </div>
    );
  }

  return <StadiumMap zones={zones} />;
}
