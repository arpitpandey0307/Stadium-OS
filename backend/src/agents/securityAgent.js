/**
 * Security Agent — Detects sudden crowd spikes and anomalies.
 *
 * Tracks a rolling history of user counts per zone (last 10 ticks).
 * If any zone's user count jumps by more than SPIKE_THRESHOLD% in one tick,
 * it triggers an ALERT.
 */

const SPIKE_THRESHOLD = 0.30; // 30% jump in one tick = alert
const HISTORY_SIZE = 10;

// Rolling history: { zoneId: [count, count, ...] }
const history = {};

/**
 * Analyze for security anomalies.
 * @param {Object} zones - All zone data from the store
 * @returns {Object} Agent analysis report
 */
function analyze(zones) {
  const alerts = [];
  const zoneReports = {};

  const crowdZones = Object.values(zones).filter(
    (z) => z.type === 'crowd' || z.type === 'vendor'
  );

  for (const zone of crowdZones) {
    if (!history[zone.id]) {
      history[zone.id] = [];
    }

    const prev = history[zone.id].length > 0
      ? history[zone.id][history[zone.id].length - 1]
      : 0;

    // Push current reading
    history[zone.id].push(zone.currentUsers);
    if (history[zone.id].length > HISTORY_SIZE) {
      history[zone.id].shift();
    }

    // Spike detection
    const delta = zone.currentUsers - prev;
    const spikeRatio = prev > 0 ? delta / prev : 0;
    const isSpiking = prev > 10 && spikeRatio > SPIKE_THRESHOLD;

    // Sustained high detection (average of last 5 readings > 85% capacity)
    const recent = history[zone.id].slice(-5);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const sustainedHigh = zone.capacity > 0 && avgRecent / zone.capacity > 0.85;

    const zoneStatus = isSpiking ? 'ALERT' : sustainedHigh ? 'WARNING' : 'NORMAL';

    zoneReports[zone.id] = {
      name: zone.name,
      currentUsers: zone.currentUsers,
      previousUsers: prev,
      delta,
      spikeRatio: Math.round(spikeRatio * 100),
      sustainedHigh,
      status: zoneStatus,
    };

    if (isSpiking) {
      alerts.push({
        type: 'SPIKE',
        zoneId: zone.id,
        zoneName: zone.name,
        message: `Sudden surge: +${delta} users (+${Math.round(spikeRatio * 100)}%) in ${zone.name}`,
      });
    }

    if (sustainedHigh) {
      alerts.push({
        type: 'SUSTAINED_HIGH',
        zoneId: zone.id,
        zoneName: zone.name,
        message: `${zone.name} sustained at ${Math.round((avgRecent / zone.capacity) * 100)}% capacity`,
      });
    }
  }

  return {
    agent: 'security',
    timestamp: new Date().toISOString(),
    zones: zoneReports,
    summary: {
      status: alerts.some((a) => a.type === 'SPIKE') ? 'ALERT' : alerts.length > 0 ? 'WARNING' : 'NORMAL',
      alertCount: alerts.length,
      alerts,
    },
  };
}

/**
 * Reset history (e.g., on simulation reset).
 */
function reset() {
  for (const key of Object.keys(history)) {
    delete history[key];
  }
}

module.exports = { analyze, reset };
