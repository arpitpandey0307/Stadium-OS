const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/api/zones`);
  if (!res.ok) throw new Error('Failed to fetch zones');
  return res.json();
}

export async function fetchDecisions() {
  const res = await fetch(`${API_BASE}/api/decisions`);
  if (!res.ok) throw new Error('Failed to fetch decisions');
  return res.json();
}

export async function fetchAgents() {
  const res = await fetch(`${API_BASE}/api/agents`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function fetchSystemInfo() {
  const res = await fetch(`${API_BASE}/api/system`);
  if (!res.ok) throw new Error('Failed to fetch system info');
  return res.json();
}
