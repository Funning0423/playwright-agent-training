const STORAGE_KEYS = {
  progress: "tutorialProgress",
  promptDraft: "promptBuilderDraft",
  review: "reviewChecklist",
  testStatus: "testStatus"
};

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(key, value) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
}

export function clearTrainingState() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
