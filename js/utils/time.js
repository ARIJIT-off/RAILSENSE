// ═══════════════════════════════════════════════
// RailSmart — Time Utility Helpers
// ═══════════════════════════════════════════════

// Convert minutes-from-midnight to "HH:MM" string
function formatTime(minutes) {
  if (minutes == null || minutes < 0) return '--:--';
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Convert duration in minutes to "Xh Ym"
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Get countdown string like "arriving in 23 min"
function getCountdown(targetMinutes, currentMinutes) {
  const diff = targetMinutes - currentMinutes;
  if (diff <= 0) return 'Arrived';
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Get delay in minutes (positive = late, negative = early)
function getDelayMinutes(scheduled, actual) {
  if (actual == null || scheduled == null) return 0;
  return actual - scheduled;
}

// Get delay label and class
function getDelayInfo(delayMin) {
  if (delayMin <= 0) return { label: 'On Time', class: 'badge-ontime', severity: 'ontime' };
  if (delayMin <= 15) return { label: `${delayMin}m late`, class: 'badge-ontime', severity: 'ontime' };
  if (delayMin <= 45) return { label: `${delayMin}m late`, class: 'badge-minor-delay', severity: 'minor' };
  return { label: `${formatDuration(delayMin)} late`, class: 'badge-major-delay', severity: 'major' };
}

// Get simulated current time (minutes from midnight) - based on real clock
function getCurrentSimMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Format date to "Mon, 15 Mar"
function formatDate(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

// Get today/tomorrow/date string
function getDateLabel(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return formatDate(date);
}
