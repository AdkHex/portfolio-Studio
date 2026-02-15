const KEY = "portfolio-content-version";
const EVENT = "portfolio-content-version-updated";

export function bumpContentVersion() {
  localStorage.setItem(KEY, String(Date.now()));
  window.dispatchEvent(new Event(EVENT));
}

export function getContentVersion() {
  return localStorage.getItem(KEY) || "0";
}

export function listenContentVersion(onChange: () => void) {
  const customHandler = () => onChange();
  const handler = (event: StorageEvent) => {
    if (event.key === KEY) {
      onChange();
    }
  };

  window.addEventListener(EVENT, customHandler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, customHandler);
    window.removeEventListener("storage", handler);
  };
}
