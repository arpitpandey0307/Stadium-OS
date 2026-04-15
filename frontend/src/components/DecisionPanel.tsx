'use client';

interface Decision {
  priority: number;
  category: string;
  action: string;
  message: string;
  zoneId?: string;
}

interface DecisionPanelProps {
  decisions: Decision[];
  totalUsers: number;
}

const PRIORITY_STYLES: Record<number, { badge: string; border: string; bg: string }> = {
  1: {
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
  },
  2: {
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
  },
  3: {
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
  },
  4: {
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    border: 'border-gray-700',
    bg: 'bg-gray-500/5',
  },
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'CRITICAL',
  2: 'HIGH',
  3: 'MEDIUM',
  4: 'INFO',
};

const CATEGORY_ICONS: Record<string, string> = {
  crowd: '👥',
  vendor: '🍔',
  security: '🛡️',
  transport: '🚌',
};

export default function DecisionPanel({ decisions, totalUsers }: DecisionPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h2 className="text-lg font-bold text-white">
          🧠 Coordinator Decisions
        </h2>
        <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-400 border border-cyan-500/20">
          {decisions.length} active
        </span>
      </div>

      {/* Decision list */}
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {decisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl">✅</div>
            <p className="mt-2 text-sm text-gray-500">
              All systems normal — no actions required
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {totalUsers} users in stadium
            </p>
          </div>
        ) : (
          decisions.map((decision, i) => {
            const style = PRIORITY_STYLES[decision.priority] || PRIORITY_STYLES[4];
            const icon = CATEGORY_ICONS[decision.category] || '⚡';
            return (
              <div
                key={`${decision.action}-${decision.zoneId || i}`}
                className={`rounded-lg border ${style.border} ${style.bg} p-3 transition-all hover:brightness-110`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="mt-0.5 text-base flex-shrink-0">{icon}</span>
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {decision.message}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${style.badge}`}
                  >
                    {PRIORITY_LABELS[decision.priority] || 'P' + decision.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
