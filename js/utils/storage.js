// ═══════════════════════════════════════════════
// RailSmart — LocalStorage Wrapper
// ═══════════════════════════════════════════════

const STORAGE_KEYS = {
  SEARCH_HISTORY: 'railsmart_search_history',
  JOURNEY_PREFS: 'railsmart_journey_prefs',
  SELECTED_TRAIN: 'railsmart_selected_train',
};

const MAX_HISTORY = 10;

function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)) || [];
  } catch { return []; }
}

function addToSearchHistory(entry) {
  const history = getSearchHistory();
  // Remove duplicate
  const filtered = history.filter(h =>
    !(h.from === entry.from && h.to === entry.to && h.type === entry.type)
  );
  filtered.unshift({ ...entry, timestamp: Date.now() });
  localStorage.setItem(
    STORAGE_KEYS.SEARCH_HISTORY,
    JSON.stringify(filtered.slice(0, MAX_HISTORY))
  );
}

function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
}

function getJourneyPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.JOURNEY_PREFS)) || {};
  } catch { return {}; }
}

function saveJourneyPrefs(prefs) {
  localStorage.setItem(STORAGE_KEYS.JOURNEY_PREFS, JSON.stringify(prefs));
}

function getSelectedTrain() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_TRAIN));
  } catch { return null; }
}

function saveSelectedTrain(train) {
  localStorage.setItem(STORAGE_KEYS.SELECTED_TRAIN, JSON.stringify(train));
}

function saveMapRoute(fromCode, toCode) {
  localStorage.setItem('railsmart_map_route', JSON.stringify({ from: fromCode, to: toCode }));
}

function getMapRoute() {
  try { return JSON.parse(localStorage.getItem('railsmart_map_route')) || null; }
  catch { return null; }
}
