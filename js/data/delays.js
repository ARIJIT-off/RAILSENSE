// ═══════════════════════════════════════════════
// RailSmart — Delay Analytics & Track Health Data
// Bandel–Howrah Local Line specific data
// ═══════════════════════════════════════════════

const DELAY_CAUSES = [
  { id: 'cascading', label: 'Cascading Delays',    color: 'var(--chart-cascading)', icon: '🔗', pct: 38 },
  { id: 'signal',    label: 'Signal Failure',       color: 'var(--chart-signal)',    icon: '🚦', pct: 22 },
  { id: 'track',     label: 'Track Maintenance',    color: 'var(--chart-track)',     icon: '🛤️', pct: 17 },
  { id: 'weather',   label: 'Weather / Flooding',   color: 'var(--chart-weather)',   icon: '🌧️', pct: 15 },
  { id: 'crew',      label: 'Crew / Loco Issue',    color: 'var(--chart-crew)',      icon: '👷', pct:  8 },
];

// Track section data for all routes
const TRACK_SECTIONS = [
  // ── Main Line: BDC → HWH ──
  { from: 'BDC',  to: 'HGY',  distKm: 2.5, railType: '52kg', age: 18, signalling: 'Semi-Auto', lastUpgrade: 2014, score: 64, route: 'main' },
  { from: 'HGY',  to: 'CNS',  distKm: 1.8, railType: '52kg', age: 14, signalling: 'Semi-Auto', lastUpgrade: 2016, score: 68, route: 'main' },
  { from: 'CNS',  to: 'CGR',  distKm: 3.4, railType: '52kg', age: 20, signalling: 'Manual',    lastUpgrade: 2010, score: 47, route: 'main' },
  { from: 'CGR',  to: 'MUU',  distKm: 2.0, railType: '52kg', age: 16, signalling: 'Semi-Auto', lastUpgrade: 2015, score: 61, route: 'main' },
  { from: 'MUU',  to: 'BHR',  distKm: 2.1, railType: '52kg', age: 12, signalling: 'Semi-Auto', lastUpgrade: 2018, score: 71, route: 'main' },
  { from: 'BHR',  to: 'BBAE', distKm: 3.8, railType: '52kg', age: 22, signalling: 'Manual',    lastUpgrade: 2008, score: 43, route: 'main' },
  { from: 'BBAE', to: 'SHE',  distKm: 2.5, railType: '60kg', age:  8, signalling: 'Auto',      lastUpgrade: 2020, score: 82, route: 'main' },
  { from: 'SHE',  to: 'SRP',  distKm: 3.0, railType: '60kg', age:  6, signalling: 'Auto',      lastUpgrade: 2022, score: 87, route: 'main' },
  { from: 'SRP',  to: 'RIS',  distKm: 3.0, railType: '52kg', age: 14, signalling: 'Semi-Auto', lastUpgrade: 2016, score: 66, route: 'main' },
  { from: 'RIS',  to: 'KOG',  distKm: 2.8, railType: '52kg', age: 16, signalling: 'Semi-Auto', lastUpgrade: 2014, score: 60, route: 'main' },
  { from: 'KOG',  to: 'HMZ',  distKm: 2.0, railType: '52kg', age: 18, signalling: 'Semi-Auto', lastUpgrade: 2013, score: 57, route: 'main' },
  { from: 'HMZ',  to: 'UPA',  distKm: 1.9, railType: '60kg', age:  7, signalling: 'Auto',      lastUpgrade: 2021, score: 85, route: 'main' },
  { from: 'UPA',  to: 'BLY',  distKm: 1.8, railType: '60kg', age:  5, signalling: 'Auto',      lastUpgrade: 2023, score: 91, route: 'main' },
  { from: 'BLY',  to: 'BEQ',  distKm: 2.1, railType: '60kg', age:  5, signalling: 'Auto',      lastUpgrade: 2023, score: 90, route: 'main' },
  { from: 'BEQ',  to: 'LLH',  distKm: 1.6, railType: '60kg', age:  4, signalling: 'Auto',      lastUpgrade: 2024, score: 93, route: 'main' },
  { from: 'LLH',  to: 'HWH',  distKm: 4.2, railType: '60kg', age:  3, signalling: 'ATP',       lastUpgrade: 2024, score: 96, route: 'main' },
  // ── Main Line extension: BDC → BWN ──
  { from: 'BDC',  to: 'ADST', distKm: 3.2, railType: '52kg', age: 20, signalling: 'Semi-Auto', lastUpgrade: 2012, score: 55, route: 'main' },
  { from: 'ADST', to: 'MUG',  distKm: 3.0, railType: '52kg', age: 22, signalling: 'Manual',    lastUpgrade: 2010, score: 48, route: 'main' },
  { from: 'MUG',  to: 'PDA',  distKm: 9.0, railType: '52kg', age: 18, signalling: 'Semi-Auto', lastUpgrade: 2014, score: 58, route: 'main' },
  { from: 'PDA',  to: 'BOI',  distKm: 8.0, railType: '52kg', age: 16, signalling: 'Semi-Auto', lastUpgrade: 2015, score: 62, route: 'main' },
  { from: 'BOI',  to: 'MYM',  distKm: 8.0, railType: '52kg', age: 14, signalling: 'Semi-Auto', lastUpgrade: 2016, score: 65, route: 'main' },
  { from: 'MYM',  to: 'SKG',  distKm: 11.5,railType: '60kg', age: 10, signalling: 'Auto',      lastUpgrade: 2018, score: 75, route: 'main' },
  { from: 'SKG',  to: 'BWN',  distKm: 10.0,railType: '60kg', age:  8, signalling: 'Auto',      lastUpgrade: 2020, score: 80, route: 'main' },
  // ── Chord Line ──
  { from: 'BLY',  to: 'DKAE', distKm: 6.0, railType: '60kg', age:  5, signalling: 'Auto',      lastUpgrade: 2023, score: 88, route: 'chord' },
  { from: 'DKAE', to: 'KQU',  distKm: 16.0,railType: '52kg', age: 12, signalling: 'Semi-Auto', lastUpgrade: 2018, score: 70, route: 'chord' },
  { from: 'KQU',  to: 'GRAE', distKm: 22.0,railType: '52kg', age: 16, signalling: 'Semi-Auto', lastUpgrade: 2014, score: 58, route: 'chord' },
  { from: 'GRAE', to: 'JRAE', distKm: 6.0, railType: '52kg', age: 18, signalling: 'Manual',    lastUpgrade: 2012, score: 50, route: 'chord' },
  { from: 'JRAE', to: 'SKG',  distKm: 16.0,railType: '52kg', age: 14, signalling: 'Semi-Auto', lastUpgrade: 2016, score: 63, route: 'chord' },
  // ── Goghat Line ──
  { from: 'SHE',  to: 'SIU',  distKm: 12.0,railType: '52kg', age: 20, signalling: 'Manual',    lastUpgrade: 2010, score: 45, route: 'goghat' },
  { from: 'SIU',  to: 'HPL',  distKm: 12.0,railType: '52kg', age: 22, signalling: 'Manual',    lastUpgrade: 2008, score: 40, route: 'goghat' },
  { from: 'HPL',  to: 'TAK',  distKm: 12.0,railType: '52kg', age: 18, signalling: 'Semi-Auto', lastUpgrade: 2014, score: 55, route: 'goghat' },
  { from: 'TAK',  to: 'GOGT', distKm: 28.0,railType: '52kg', age: 25, signalling: 'Manual',    lastUpgrade: 2006, score: 35, route: 'goghat' },
];

// Risk based on actual platform / level-crossing conditions on this line
const ACCIDENT_HISTORY = [
  { station: 'CNS',  incidents: 4, riskLevel: 'high',   lastIncident: '2024-09', description: 'Level crossing accidents on unmanned crossings near Chinsurah' },
  { station: 'BHR',  incidents: 3, riskLevel: 'high',   lastIncident: '2024-07', description: 'Manual signalling failures causing near-misses' },
  { station: 'SHE',  incidents: 2, riskLevel: 'medium', lastIncident: '2024-04', description: 'Platform overcrowding incidents at Seoraphuli Jn' },
  { station: 'SRP',  incidents: 2, riskLevel: 'medium', lastIncident: '2024-02', description: 'Signal failure due to cable theft' },
  { station: 'CGR',  incidents: 3, riskLevel: 'high',   lastIncident: '2024-10', description: 'Flood surges affecting track near Chandannagar' },
  { station: 'KOG',  incidents: 2, riskLevel: 'medium', lastIncident: '2024-06', description: 'Unauthorised track crossing incidents' },
  { station: 'BLY',  incidents: 1, riskLevel: 'low',    lastIncident: '2023-11', description: 'Minor platform edge incident' },
  { station: 'HWH',  incidents: 5, riskLevel: 'medium', lastIncident: '2024-12', description: 'Platform congestion and buffer-stop incidents at terminus' },
];

// Train performance data from actual local trains on this corridor
const TRAIN_PERFORMANCE = [
  { trainNumber: '37212', name: 'BDC–HWH Local (37212)', punctuality: 74, avgDelay: 10, onTimeRuns: 271, totalRuns: 365 },
  { trainNumber: '37214', name: 'BDC–HWH Local (37214)', punctuality: 71, avgDelay: 12, onTimeRuns: 259, totalRuns: 365 },
  { trainNumber: '37216', name: 'BDC–HWH Local (37216)', punctuality: 78, avgDelay:  9, onTimeRuns: 285, totalRuns: 365 },
  { trainNumber: '37218', name: 'BDC–HWH Local (37218)', punctuality: 69, avgDelay: 15, onTimeRuns: 252, totalRuns: 365 },
  { trainNumber: '37220', name: 'BDC–HWH Local (37220)', punctuality: 76, avgDelay: 11, onTimeRuns: 277, totalRuns: 365 },
  { trainNumber: '37282', name: 'BDC–HWH Local (37282)', punctuality: 65, avgDelay: 18, onTimeRuns: 237, totalRuns: 365 },
  { trainNumber: '37211', name: 'HWH–BDC Local (37211)', punctuality: 81, avgDelay:  8, onTimeRuns: 296, totalRuns: 365 },
  { trainNumber: '37213', name: 'HWH–BDC Local (37213)', punctuality: 77, avgDelay: 10, onTimeRuns: 281, totalRuns: 365 },
  { trainNumber: '37281', name: 'HWH–BDC Local (37281)', punctuality: 63, avgDelay: 21, onTimeRuns: 230, totalRuns: 365 },
  { trainNumber: '37215', name: 'HWH–BDC Local (37215)', punctuality: 80, avgDelay:  9, onTimeRuns: 292, totalRuns: 365 },
];

// Speed-up opportunities specific to sections of the Bandel–Howrah corridor
const SPEEDUP_OPPORTUNITIES = [
  {
    section: 'CNS → CGR',
    currentSpeed: 40,
    potentialSpeed: 75,
    timeSaved: 4,
    investment: '₹35 Cr',
    priority: 'high',
    details: 'Replace manual signalling with semi-automatic block system + 52kg→60kg rail',
  },
  {
    section: 'BHR → BBAE',
    currentSpeed: 38,
    potentialSpeed: 70,
    timeSaved: 5,
    investment: '₹48 Cr',
    priority: 'high',
    details: 'Oldest rail section on the corridor; full track renewal and signal upgrade needed',
  },
  {
    section: 'SRP → RIS',
    currentSpeed: 45,
    potentialSpeed: 80,
    timeSaved: 3,
    investment: '₹28 Cr',
    priority: 'medium',
    details: 'Semi-auto to automatic block signalling; minor curve correction at km 32',
  },
  {
    section: 'RIS → HMZ',
    currentSpeed: 42,
    potentialSpeed: 75,
    timeSaved: 4,
    investment: '₹32 Cr',
    priority: 'medium',
    details: 'Rail replacement and signalling modernisation',
  },
];

// Helper: Get track health score label
function getTrackHealthLabel(score) {
  if (score >= 80) return { label: 'Good', class: 'good' };
  if (score >= 60) return { label: 'Fair', class: 'fair' };
  return { label: 'Poor', class: 'poor' };
}

// Helper: Get risk level styling
function getRiskLevelStyle(level) {
  switch (level) {
    case 'high':   return { color: 'var(--status-major-delay)', bg: 'var(--status-major-delay-bg)' };
    case 'medium': return { color: 'var(--status-minor-delay)', bg: 'var(--status-minor-delay-bg)' };
    case 'low':    return { color: 'var(--status-ontime)',      bg: 'var(--status-ontime-bg)' };
    default:       return { color: 'var(--text-muted)',         bg: 'var(--bg-tertiary)' };
  }
}
