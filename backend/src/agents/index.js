/**
 * Agent Index — Barrel export + unified run-all-agents function.
 */

const crowdAgent = require('./crowdAgent');
const vendorAgent = require('./vendorAgent');
const securityAgent = require('./securityAgent');
const transportAgent = require('./transportAgent');

/**
 * Run all agents against the current state.
 * @param {Object} zones - Zone data from the store
 * @param {Object} systemInfo - System info from the store
 * @returns {Object} Combined agent reports
 */
function runAll(zones, systemInfo) {
  return {
    crowd: crowdAgent.analyze(zones),
    vendor: vendorAgent.analyze(zones),
    security: securityAgent.analyze(zones),
    transport: transportAgent.analyze(zones, systemInfo),
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  crowdAgent,
  vendorAgent,
  securityAgent,
  transportAgent,
  runAll,
};
