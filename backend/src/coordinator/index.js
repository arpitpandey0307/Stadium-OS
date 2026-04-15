/**
 * Coordinator Engine — The decision-making brain of StadiumOS.
 *
 * Ingests reports from all 4 agents and produces a prioritized
 * list of actionable decisions using a rule-based engine.
 *
 * Priority levels: CRITICAL (1) > HIGH (2) > MEDIUM (3) > LOW (4)
 */

const agents = require('../agents');
const store = require('../simulation/store');

// ──────────────────────────────────────────────
// Decision Rules
// ──────────────────────────────────────────────

function evaluateCrowdDecisions(crowdReport) {
  const decisions = [];

  for (const [zoneId, zone] of Object.entries(crowdReport.zones)) {
    if (zone.density === 'HIGH') {
      decisions.push({
        priority: 1,
        category: 'crowd',
        action: `REDIRECT_USERS`,
        message: `🚨 ${zone.name} at ${zone.occupancyPercent}% capacity — redirect incoming users to lower-density zones`,
        zoneId,
        data: { occupancy: zone.occupancyPercent, density: zone.density },
      });
    } else if (zone.density === 'MEDIUM' && zone.occupancyPercent > 70) {
      decisions.push({
        priority: 3,
        category: 'crowd',
        action: `MONITOR_ZONE`,
        message: `⚠️ ${zone.name} approaching capacity (${zone.occupancyPercent}%) — prepare overflow plan`,
        zoneId,
        data: { occupancy: zone.occupancyPercent, density: zone.density },
      });
    }
  }

  return decisions;
}

function evaluateVendorDecisions(vendorReport) {
  const decisions = [];
  const { summary } = vendorReport;

  if (summary.overloaded) {
    decisions.push({
      priority: 1,
      category: 'vendor',
      action: 'OPEN_STALLS',
      message: `🍔 Food court OVERLOADED — wait time ${summary.waitTimeMin} min. Open additional stalls (${vendorReport.foodCourt.stallsOpen}/${vendorReport.foodCourt.stallsTotal})`,
      data: { waitTime: summary.waitTimeMin, stallsOpen: vendorReport.foodCourt.stallsOpen },
    });
  } else if (summary.status === 'BUSY') {
    decisions.push({
      priority: 3,
      category: 'vendor',
      action: 'PREPARE_STALLS',
      message: `🍔 Food court busy — wait time ${summary.waitTimeMin} min. Consider opening standby stalls`,
      data: { waitTime: summary.waitTimeMin },
    });
  }

  if (vendorReport.foodCourt && vendorReport.foodCourt.utilization > 85) {
    decisions.push({
      priority: 2,
      category: 'vendor',
      action: 'ACTIVATE_OVERFLOW',
      message: `🏪 Food court at ${vendorReport.foodCourt.utilization}% utilization — activate overflow food stations`,
      data: { utilization: vendorReport.foodCourt.utilization },
    });
  }

  return decisions;
}

function evaluateSecurityDecisions(securityReport) {
  const decisions = [];

  for (const alert of securityReport.summary.alerts) {
    if (alert.type === 'SPIKE') {
      decisions.push({
        priority: 1,
        category: 'security',
        action: 'RESTRICT_ZONE',
        message: `🛡️ SECURITY ALERT: ${alert.message} — restrict zone access and deploy patrol`,
        zoneId: alert.zoneId,
        data: alert,
      });
    } else if (alert.type === 'SUSTAINED_HIGH') {
      decisions.push({
        priority: 2,
        category: 'security',
        action: 'INCREASE_PATROL',
        message: `🛡️ ${alert.message} — increase security presence`,
        zoneId: alert.zoneId,
        data: alert,
      });
    }
  }

  return decisions;
}

function evaluateTransportDecisions(transportReport) {
  const decisions = [];
  const { summary } = transportReport;

  if (summary.congestionLevel === 'SEVERE') {
    decisions.push({
      priority: 1,
      category: 'transport',
      action: 'OPEN_EXIT_LANES',
      message: `🚌 SEVERE exit congestion — open all exit lanes and announce staggered departure`,
      data: { congestion: summary.congestionLevel, flowRate: transportReport.gates.exit.flowRate },
    });
  } else if (summary.congestionLevel === 'HIGH') {
    decisions.push({
      priority: 2,
      category: 'transport',
      action: 'STAGGER_DEPARTURE',
      message: `🚌 High exit congestion — consider phased zone-by-zone departure`,
      data: { congestion: summary.congestionLevel },
    });
  }

  if (summary.isEgress && summary.estimatedClearTimeMin !== null) {
    decisions.push({
      priority: 4,
      category: 'transport',
      action: 'CLEAR_ESTIMATE',
      message: `🕐 Estimated stadium clear time: ${summary.estimatedClearTimeMin} minutes (${summary.totalUsersRemaining} users remaining)`,
      data: { clearTimeMin: summary.estimatedClearTimeMin, remaining: summary.totalUsersRemaining },
    });
  }

  return decisions;
}

// ──────────────────────────────────────────────
// Main Coordinator
// ──────────────────────────────────────────────

/**
 * Run the full coordination cycle:
 *   1. Fetch current state
 *   2. Run all agents
 *   3. Evaluate decisions from each agent report
 *   4. Sort by priority and return
 *
 * @returns {Object} Coordination result with agent reports + decisions
 */
function coordinate() {
  const zones = store.getZones();
  const systemInfo = store.getSystemInfo();

  // Run all agents
  const agentReports = agents.runAll(zones, systemInfo);

  // Evaluate decisions from each agent
  const allDecisions = [
    ...evaluateCrowdDecisions(agentReports.crowd),
    ...evaluateVendorDecisions(agentReports.vendor),
    ...evaluateSecurityDecisions(agentReports.security),
    ...evaluateTransportDecisions(agentReports.transport),
  ];

  // Sort by priority (1 = highest)
  allDecisions.sort((a, b) => a.priority - b.priority);

  return {
    timestamp: new Date().toISOString(),
    phase: systemInfo.phase,
    tick: systemInfo.tick,
    totalUsers: systemInfo.totalUsers,
    agentReports,
    decisions: allDecisions,
    summary: {
      totalDecisions: allDecisions.length,
      criticalCount: allDecisions.filter((d) => d.priority === 1).length,
      highCount: allDecisions.filter((d) => d.priority === 2).length,
      categories: [...new Set(allDecisions.map((d) => d.category))],
    },
  };
}

module.exports = { coordinate };
