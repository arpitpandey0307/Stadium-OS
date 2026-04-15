/**
 * Vendor Agent — Monitors food court queues and service efficiency.
 *
 * Input:  food_court zone data (queueSize, serviceRate, stallsOpen, currentUsers)
 * Output: estimated wait time, overload flag, recommendations
 */

const WAIT_THRESHOLD_MINUTES = 8; // flag overload above 8 min wait

/**
 * Analyze vendor / food court state.
 * @param {Object} zones - All zone data from the store
 * @returns {Object} Agent analysis report
 */
function analyze(zones) {
  const fc = zones.food_court;
  if (!fc) {
    return { agent: 'vendor', error: 'No food_court zone found' };
  }

  // Effective service rate = stalls × per-stall rate
  const effectiveRate = fc.stallsOpen * (fc.serviceRate / 3); // serviceRate is total, divide by base stalls
  const estimatedWaitMin = effectiveRate > 0
    ? Math.round((fc.queueSize / effectiveRate) * 10) / 10
    : 0;

  const overloaded = estimatedWaitMin > WAIT_THRESHOLD_MINUTES;
  const utilization = fc.capacity > 0
    ? Math.round((fc.currentUsers / fc.capacity) * 100)
    : 0;

  return {
    agent: 'vendor',
    timestamp: new Date().toISOString(),
    foodCourt: {
      currentUsers: fc.currentUsers,
      capacity: fc.capacity,
      utilization,
      queueSize: fc.queueSize,
      stallsOpen: fc.stallsOpen,
      stallsTotal: fc.stallsTotal,
      serviceRate: fc.serviceRate,
      estimatedWaitMin,
    },
    summary: {
      overloaded,
      waitTimeMin: estimatedWaitMin,
      status: overloaded ? 'OVERLOADED' : estimatedWaitMin > 4 ? 'BUSY' : 'NORMAL',
      canOpenMoreStalls: fc.stallsOpen < fc.stallsTotal,
      recommendation: overloaded
        ? `Open more stalls (${fc.stallsOpen}/${fc.stallsTotal} active). Wait time: ${estimatedWaitMin} min`
        : null,
    },
  };
}

module.exports = { analyze };
