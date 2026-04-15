/**
 * Transport Agent — Predicts exit congestion and manages gate flow.
 *
 * Monitors exit gate flow rate and estimates time to clear
 * based on remaining users and current exit throughput.
 */

const CONGESTION_THRESHOLDS = {
  LOW: 15,       // < 15 users/tick exiting → low
  MODERATE: 25,  // 15–25
  HIGH: 40,      // 25–40
  SEVERE: 999,   // > 40
};

/**
 * Analyze transport / exit congestion.
 * @param {Object} zones - All zone data from the store
 * @param {Object} systemInfo - System info (totalUsers, phase)
 * @returns {Object} Agent analysis report
 */
function analyze(zones, systemInfo) {
  const exitGate = zones.exit_gate;
  const entryGate = zones.entry_gate;

  if (!exitGate || !entryGate) {
    return { agent: 'transport', error: 'Gate zones not found' };
  }

  const exitFlowRate = exitGate.flowRate || 0;
  const entryFlowRate = entryGate.flowRate || 0;
  const totalUsers = systemInfo?.totalUsers || 0;
  const phase = systemInfo?.phase || 'unknown';

  // Congestion level
  let congestionLevel = 'LOW';
  if (exitFlowRate > CONGESTION_THRESHOLDS.HIGH) congestionLevel = 'SEVERE';
  else if (exitFlowRate > CONGESTION_THRESHOLDS.MODERATE) congestionLevel = 'HIGH';
  else if (exitFlowRate > CONGESTION_THRESHOLDS.LOW) congestionLevel = 'MODERATE';

  // Estimated time to clear stadium (only meaningful during egress)
  const isEgress = phase === 'egress' || phase === 'post-event';
  const avgExitRate = exitFlowRate || 1; // avoid divide by zero
  const ticksToClear = isEgress ? Math.ceil(totalUsers / avgExitRate) : null;
  const minutesToClear = ticksToClear !== null ? Math.round((ticksToClear * 2) / 60 * 10) / 10 : null;

  // Net flow (positive = filling, negative = emptying)
  const netFlow = entryFlowRate - exitFlowRate;

  return {
    agent: 'transport',
    timestamp: new Date().toISOString(),
    gates: {
      entry: {
        flowRate: entryFlowRate,
        status: entryGate.status,
      },
      exit: {
        flowRate: exitFlowRate,
        status: exitGate.status,
      },
    },
    summary: {
      netFlow,
      filling: netFlow > 0,
      congestionLevel,
      isEgress,
      totalUsersRemaining: totalUsers,
      estimatedClearTimeTicks: ticksToClear,
      estimatedClearTimeMin: minutesToClear,
      recommendation: congestionLevel === 'SEVERE'
        ? 'Open additional exit lanes. Stagger departure by zones.'
        : congestionLevel === 'HIGH'
          ? 'Monitor exit flow closely. Consider phased departure.'
          : null,
    },
  };
}

module.exports = { analyze };
