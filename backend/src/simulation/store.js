/**
 * DataStore — In-memory state store with optional Firestore sync.
 *
 * Works instantly without Firebase. When Firestore is configured,
 * it mirrors writes to the 'zones' and 'system' collections.
 */

let firestoreDb = null;

// In-memory state
const state = {
  zones: {},
  systemInfo: {
    totalUsers: 0,
    tick: 0,
    startedAt: null,
    lastUpdated: null,
    phase: 'pre-event', // pre-event | ingress | mid-event | egress | post-event
  },
};

/**
 * Attempt to connect to Firestore. Fails silently if not configured.
 */
function initFirestore() {
  try {
    const { db } = require('../config/firebase');
    firestoreDb = db;
    console.log('   📡 Firestore connected — writes will be mirrored');
  } catch (err) {
    console.log('   ⚠️  Firestore not configured — using in-memory store only');
    firestoreDb = null;
  }
}

/**
 * Set all zone data at once.
 */
async function setZones(zones) {
  state.zones = JSON.parse(JSON.stringify(zones));

  if (firestoreDb) {
    try {
      const batch = firestoreDb.batch();
      for (const [id, zone] of Object.entries(zones)) {
        const ref = firestoreDb.collection('zones').doc(id);
        batch.set(ref, zone);
      }
      await batch.commit();
    } catch (err) {
      // Firestore write failed — in-memory is still updated
    }
  }
}

/**
 * Update a single zone.
 */
async function updateZone(zoneId, data) {
  state.zones[zoneId] = { ...state.zones[zoneId], ...data };

  if (firestoreDb) {
    try {
      await firestoreDb.collection('zones').doc(zoneId).set(state.zones[zoneId]);
    } catch (err) {
      // silent
    }
  }
}

/**
 * Update system info.
 */
async function updateSystemInfo(info) {
  state.systemInfo = { ...state.systemInfo, ...info, lastUpdated: new Date().toISOString() };

  if (firestoreDb) {
    try {
      await firestoreDb.collection('system').doc('info').set(state.systemInfo);
    } catch (err) {
      // silent
    }
  }
}

/**
 * Get current state snapshot.
 */
function getState() {
  return JSON.parse(JSON.stringify(state));
}

function getZones() {
  return JSON.parse(JSON.stringify(state.zones));
}

function getSystemInfo() {
  return JSON.parse(JSON.stringify(state.systemInfo));
}

module.exports = {
  initFirestore,
  setZones,
  updateZone,
  updateSystemInfo,
  getState,
  getZones,
  getSystemInfo,
};
