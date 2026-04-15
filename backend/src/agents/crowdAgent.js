/**
 * Crowd Agent — Monitors crowd density across seating zones.
 *
 * Input:  zone data (currentUsers, capacity)
 * Output: density level (LOW / MEDIUM / HIGH) per zone + overall assessment
 */

const THRESHOLDS = {
  LOW: 0.5,      // < 50% capacity
  MEDIUM: 0.75,  // 50–75%
  HIGH: 0.9,     // 75–90%
  CRITICAL: 1.0, // > 90%
};

function getDensityLevel(ratio) {
  if (ratio >= THRESHOLDS.HIGH) return 'HIGH';
  if (ratio >= THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

/**
 * Analyze crowd density for all crowd-type zones.
 * @param {Object} zones - All zone data from the store
 * @returns {Object} Agent analysis report
 */
function analyze(zones) {
  const crowdZones = Object.values(zones).filter((z) => z.type === 'crowd');
  const report = {
    agent: 'crowd',
    timestamp: new Date().toISOString(),
    zones: {},
    summary: {
      totalUsers: 0,
      totalCapacity: 0,
      overallDensity: 'LOW',
      zonesAtHigh: [],
    },
  };

  for (const zone of crowdZones) {
    const ratio = zone.capacity > 0 ? zone.currentUsers / zone.capacity : 0;
    const level = getDensityLevel(ratio);

    report.zones[zone.id] = {
      name: zone.name,
      currentUsers: zone.currentUsers,
      capacity: zone.capacity,
      occupancyPercent: Math.round(ratio * 100),
      density: level,
    };

    report.summary.totalUsers += zone.currentUsers;
    report.summary.totalCapacity += zone.capacity;

    if (level === 'HIGH') {
      report.summary.zonesAtHigh.push(zone.id);
    }
  }

  // Overall density
  const overallRatio = report.summary.totalCapacity > 0
    ? report.summary.totalUsers / report.summary.totalCapacity
    : 0;
  report.summary.overallDensity = getDensityLevel(overallRatio);
  report.summary.overallPercent = Math.round(overallRatio * 100);

  return report;
}

module.exports = { analyze };
