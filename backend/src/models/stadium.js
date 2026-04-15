/**
 * Stadium Model — Zone definitions and initial state.
 *
 * The stadium has 6 zones:
 *   Zone A, B, C  → Crowd/seating zones
 *   Food Court    → Queue-based vendor zone
 *   Entry Gate    → Ingress point
 *   Exit Gate     → Egress point
 */

const ZONES = {
  zone_a: {
    id: 'zone_a',
    name: 'Zone A — North Stand',
    type: 'crowd',
    capacity: 300,
    currentUsers: 0,
    status: 'normal', // normal | warning | critical
    coordinates: { lat: 40.4532, lng: -3.6883 }, // for map rendering
  },
  zone_b: {
    id: 'zone_b',
    name: 'Zone B — East Stand',
    type: 'crowd',
    capacity: 250,
    currentUsers: 0,
    status: 'normal',
    coordinates: { lat: 40.4528, lng: -3.6870 },
  },
  zone_c: {
    id: 'zone_c',
    name: 'Zone C — South Stand',
    type: 'crowd',
    capacity: 200,
    currentUsers: 0,
    status: 'normal',
    coordinates: { lat: 40.4524, lng: -3.6883 },
  },
  food_court: {
    id: 'food_court',
    name: 'Food Court',
    type: 'vendor',
    capacity: 150,
    currentUsers: 0,
    status: 'normal',
    coordinates: { lat: 40.4528, lng: -3.6895 },
    // Vendor-specific fields
    queueSize: 0,
    serviceRate: 12,      // users served per minute
    stallsOpen: 3,
    stallsTotal: 6,
  },
  entry_gate: {
    id: 'entry_gate',
    name: 'Entry Gate',
    type: 'gate',
    capacity: 100,
    currentUsers: 0,
    status: 'normal',
    coordinates: { lat: 40.4536, lng: -3.6890 },
    flowRate: 0,          // users per minute
  },
  exit_gate: {
    id: 'exit_gate',
    name: 'Exit Gate',
    type: 'gate',
    capacity: 100,
    currentUsers: 0,
    status: 'normal',
    coordinates: { lat: 40.4520, lng: -3.6890 },
    flowRate: 0,
  },
};

/**
 * Returns a deep clone of the initial zone definitions.
 */
function getInitialZones() {
  return JSON.parse(JSON.stringify(ZONES));
}

/**
 * Get total capacity across all crowd zones.
 */
function getTotalCrowdCapacity(zones) {
  return Object.values(zones)
    .filter((z) => z.type === 'crowd')
    .reduce((sum, z) => sum + z.capacity, 0);
}

module.exports = { ZONES, getInitialZones, getTotalCrowdCapacity };
