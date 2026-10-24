// Daylight / Midnight theme: stored in localStorage and applied as data-theme on <html>.
export type Theme = "light" | "dark";
export const THEME_KEY = "ll-theme";

// Runs in <head> before first paint so the page never flashes the wrong theme.
export const themeInitScript = `(function(){var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="light"&&t!=="dark")t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)})();`;

export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode: the choice lasts this visit */ }
}
