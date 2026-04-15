/**
 * Simulation Engine — Simulates real-time stadium activity.
 *
 * Lifecycle phases (controlled by tick count):
 *   0–15     pre-event   → trickle of users entering
 *   15–40    ingress     → heavy flow into stadium
 *   40–120   mid-event   → users settle, food court active
 *   120–150  egress      → users leave in waves
 *   150+     post-event  → stadium empties
 *
 * At 2-second intervals, each tick:
 *   1. Determines lifecycle phase
 *   2. Distributes users across zones with weighted randomness
 *   3. Simulates food court queue dynamics
 *   4. Simulates gate flow rates
 *   5. Writes updated state to the data store
 */

const { getInitialZones } = require('../models/stadium');
const store = require('./store');

const CONFIG = {
  TICK_INTERVAL_MS: 2000,
  TARGET_USERS: 750,          // target peak crowd (500–1000 range)
  MAX_USERS: 1000,
  NOISE_FACTOR: 0.15,         // ±15% random variation
};

// Phase thresholds (in ticks, each tick = 2s)
const PHASES = [
  { tick: 0,   name: 'pre-event',  entryRate: 5,   exitRate: 0  },
  { tick: 15,  name: 'ingress',    entryRate: 25,  exitRate: 2  },
  { tick: 40,  name: 'mid-event',  entryRate: 3,   exitRate: 3  },
  { tick: 120, name: 'egress',     entryRate: 0,   exitRate: 20 },
  { tick: 150, name: 'post-event', entryRate: 0,   exitRate: 30 },
];

let tickCount = 0;
let totalUsersInStadium = 0;
let intervalHandle = null;

/**
 * Get current phase based on tick.
 */
function getCurrentPhase() {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (tickCount >= PHASES[i].tick) return PHASES[i];
  }
  return PHASES[0];
}

/**
 * Add gaussian-like noise to a value.
 */
function noisy(value, factor = CONFIG.NOISE_FACTOR) {
  const noise = 1 + (Math.random() - 0.5) * 2 * factor;
  return Math.max(0, Math.round(value * noise));
}

/**
 * Distribute a count of users across crowd zones with weighted randomness.
 * Weights: Zone A (40%), Zone B (35%), Zone C (25%)
 */
function distributeUsers(total) {
  const weights = { zone_a: 0.40, zone_b: 0.35, zone_c: 0.25 };
  const result = {};
  let remaining = total;

  const keys = Object.keys(weights);
  for (let i = 0; i < keys.length; i++) {
    if (i === keys.length - 1) {
      result[keys[i]] = remaining; // last one gets remainder
    } else {
      const share = noisy(Math.round(total * weights[keys[i]]));
      result[keys[i]] = Math.min(share, remaining);
      remaining -= result[keys[i]];
    }
  }
  return result;
}

/**
 * Simulate one tick of stadium activity.
 */
async function simulateTick() {
  tickCount++;
  const phase = getCurrentPhase();
  const zones = store.getZones();

  // --- 1. Gate flow ---
  const entering = noisy(phase.entryRate);
  const exiting = Math.min(noisy(phase.exitRate), totalUsersInStadium);

  totalUsersInStadium = Math.max(0, Math.min(
    CONFIG.MAX_USERS,
    totalUsersInStadium + entering - exiting
  ));

  // Update gate zones
  zones.entry_gate.currentUsers = entering;
  zones.entry_gate.flowRate = entering;
  zones.entry_gate.status = entering > 20 ? 'warning' : 'normal';

  zones.exit_gate.currentUsers = exiting;
  zones.exit_gate.flowRate = exiting;
  zones.exit_gate.status = exiting > 20 ? 'warning' : 'normal';

  // --- 2. Distribute users to crowd zones ---
  const inFoodCourt = phase.name === 'mid-event'
    ? noisy(Math.round(totalUsersInStadium * 0.12))  // 12% at food court mid-event
    : noisy(Math.round(totalUsersInStadium * 0.04));  // 4% otherwise

  const inCrowdZones = Math.max(0, totalUsersInStadium - inFoodCourt);
  const distribution = distributeUsers(inCrowdZones);

  // Update crowd zones
  for (const [zoneId, count] of Object.entries(distribution)) {
    const zone = zones[zoneId];
    zone.currentUsers = count;
    const ratio = count / zone.capacity;
    zone.status = ratio > 0.9 ? 'critical' : ratio > 0.7 ? 'warning' : 'normal';
  }

  // --- 3. Food court queue dynamics ---
  const fc = zones.food_court;
  fc.currentUsers = Math.min(inFoodCourt, fc.capacity);
  fc.queueSize = Math.max(0, inFoodCourt - Math.round(fc.stallsOpen * 8));
  const ratio = fc.currentUsers / fc.capacity;
  fc.status = ratio > 0.9 ? 'critical' : ratio > 0.7 ? 'warning' : 'normal';

  // Dynamically open/close food stalls based on queue pressure
  if (fc.queueSize > 30 && fc.stallsOpen < fc.stallsTotal) {
    fc.stallsOpen = Math.min(fc.stallsTotal, fc.stallsOpen + 1);
  } else if (fc.queueSize < 5 && fc.stallsOpen > 2) {
    fc.stallsOpen = Math.max(2, fc.stallsOpen - 1);
  }

  // --- 4. Write updated state ---
  await store.setZones(zones);
  await store.updateSystemInfo({
    totalUsers: totalUsersInStadium,
    tick: tickCount,
    phase: phase.name,
  });

  // Log summary every 5 ticks
  if (tickCount % 5 === 0) {
    console.log(
      `   🎯 Tick ${tickCount} | Phase: ${phase.name} | Users: ${totalUsersInStadium} | ` +
      `A:${zones.zone_a.currentUsers} B:${zones.zone_b.currentUsers} C:${zones.zone_c.currentUsers} ` +
      `FC:${fc.currentUsers}(q${fc.queueSize})`
    );
  }
}

/**
 * Start the simulation loop.
 */
function start() {
  console.log('\n🏟️  Simulation Engine starting...');
  console.log(`   Target users: ~${CONFIG.TARGET_USERS} | Tick interval: ${CONFIG.TICK_INTERVAL_MS}ms`);

  // Initialize zones
  const zones = getInitialZones();
  store.setZones(zones);
  store.updateSystemInfo({ startedAt: new Date().toISOString(), tick: 0, totalUsers: 0, phase: 'pre-event' });

  tickCount = 0;
  totalUsersInStadium = 0;

  intervalHandle = setInterval(simulateTick, CONFIG.TICK_INTERVAL_MS);
  console.log('   ✅ Simulation running\n');
}

/**
 * Stop the simulation loop.
 */
function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('   🛑 Simulation stopped');
  }
}

/**
 * Reset simulation to initial state.
 */
function reset() {
  stop();
  tickCount = 0;
  totalUsersInStadium = 0;
  const zones = getInitialZones();
  store.setZones(zones);
  store.updateSystemInfo({ tick: 0, totalUsers: 0, phase: 'pre-event' });
  console.log('   🔄 Simulation reset');
}

module.exports = { start, stop, reset, CONFIG };
