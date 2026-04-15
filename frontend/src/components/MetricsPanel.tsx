'use client';

interface SystemInfo {
  totalUsers: number;
  tick: number;
  phase: string;
  lastUpdated: string | null;
}

interface AgentReports {
  crowd?: {
    summary: {
      overallDensity: string;
      overallPercent: number;
      totalUsers: number;
      zonesAtHigh: string[];
    };
  };
  vendor?: {
    summary: {
      status: string;
      waitTimeMin: number;
      overloaded: boolean;
    };
    foodCourt?: {
      stallsOpen: number;
      stallsTotal: number;
      queueSize: number;
      utilization: number;
    };
  };
  security?: {
    summary: {
      status: string;
      alertCount: number;
    };
  };
  transport?: {
    summary: {
      congestionLevel: string;
      netFlow: number;
      estimatedClearTimeMin: number | null;
    };
  };
}

interface MetricsPanelProps {
  systemInfo: SystemInfo | null;
  agentReports: AgentReports | null;
}

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  'pre-event': { label: 'Pre-Event', color: 'text-gray-400' },
  ingress: { label: 'Ingress', color: 'text-blue-400' },
  'mid-event': { label: 'Mid-Event', color: 'text-green-400' },
  egress: { label: 'Egress', color: 'text-amber-400' },
  'post-event': { label: 'Post-Event', color: 'text-gray-500' },
};

const DENSITY_COLORS: Record<string, string> = {
  LOW: 'text-green-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  NORMAL: 'text-green-400',
  BUSY: 'text-amber-400',
  OVERLOADED: 'text-red-400',
  ALERT: 'text-red-400',
  WARNING: 'text-amber-400',
  LOW: 'text-green-400',
  MODERATE: 'text-blue-400',
  HIGH: 'text-amber-400',
  SEVERE: 'text-red-400',
};

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  valueColor,
}: {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className={`mt-1 text-2xl font-bold ${valueColor || 'text-white'}`}>
        {value}
      </div>
      {subtitle && <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

export default function MetricsPanel({ systemInfo, agentReports }: MetricsPanelProps) {
  const phase = systemInfo?.phase || 'unknown';
  const phaseInfo = PHASE_LABELS[phase] || { label: phase, color: 'text-gray-400' };
  const crowd = agentReports?.crowd?.summary;
  const vendor = agentReports?.vendor;
  const security = agentReports?.security?.summary;
  const transport = agentReports?.transport?.summary;

  return (
    <div className="space-y-4">
      {/* System status bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
          </span>
          <span className="text-sm font-medium text-gray-300">LIVE</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            Tick <span className="font-mono text-gray-300">{systemInfo?.tick ?? '—'}</span>
          </span>
          <span className={`font-semibold ${phaseInfo.color}`}>
            {phaseInfo.label}
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon="👥"
          title="Total Users"
          value={systemInfo?.totalUsers ?? '—'}
          subtitle="in stadium"
          valueColor="text-cyan-400"
        />
        <MetricCard
          icon="📊"
          title="Crowd Density"
          value={crowd?.overallDensity ?? '—'}
          subtitle={crowd ? `${crowd.overallPercent}% overall` : undefined}
          valueColor={DENSITY_COLORS[crowd?.overallDensity || ''] || 'text-white'}
        />
        <MetricCard
          icon="🍔"
          title="Food Court"
          value={vendor?.summary?.status ?? '—'}
          subtitle={
            vendor?.foodCourt
              ? `Wait: ${vendor.summary.waitTimeMin}m · Q: ${vendor.foodCourt.queueSize} · Stalls: ${vendor.foodCourt.stallsOpen}/${vendor.foodCourt.stallsTotal}`
              : undefined
          }
          valueColor={STATUS_COLORS[vendor?.summary?.status || ''] || 'text-white'}
        />
        <MetricCard
          icon="🛡️"
          title="Security"
          value={security?.status ?? '—'}
          subtitle={security ? `${security.alertCount} alert(s)` : undefined}
          valueColor={STATUS_COLORS[security?.status || ''] || 'text-white'}
        />
        <MetricCard
          icon="🚌"
          title="Exit Congestion"
          value={transport?.congestionLevel ?? '—'}
          subtitle={
            transport?.estimatedClearTimeMin !== null && transport?.estimatedClearTimeMin !== undefined
              ? `Clear in ~${transport.estimatedClearTimeMin}m`
              : `Net flow: ${transport?.netFlow ?? 0}`
          }
          valueColor={STATUS_COLORS[transport?.congestionLevel || ''] || 'text-white'}
        />
        <MetricCard
          icon="🚪"
          title="Net Flow"
          value={transport?.netFlow ?? 0}
          subtitle={transport?.netFlow !== undefined ? (transport.netFlow > 0 ? 'Filling ↑' : transport.netFlow < 0 ? 'Emptying ↓' : 'Stable') : undefined}
          valueColor={
            (transport?.netFlow ?? 0) > 0
              ? 'text-blue-400'
              : (transport?.netFlow ?? 0) < 0
                ? 'text-amber-400'
                : 'text-gray-400'
          }
        />
      </div>
    </div>
  );
}
