"use client";

import { useEffect } from "react";
import { setTheme, currentTheme } from "@/lib/theme";

// Loads one classic script once, in order. The 3D world and the Steward bot were written
// as plain browser scripts for the static site; they move into React components in Phase 2.
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.dataset.src = src;
    s.async = false;
    s.addEventListener("load", () => { s.dataset.loaded = "1"; resolve(); }, { once: true });
    s.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
    document.body.appendChild(s);
  });
}

// Wraps every word of a headline in a span so the words can rise one after another.
function splitWords(node: Element, counter: { n: number }) {
  Array.from(node.childNodes).forEach((c) => {
    if (c.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      (c.textContent ?? "").split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const s = document.createElement("span");
        s.className = "w";
        s.style.setProperty("--i", String(counter.n++));
        s.textContent = part;
        frag.appendChild(s);
      });
      node.replaceChild(frag, c);
    } else if (c.nodeType === Node.ELEMENT_NODE) {
      splitWords(c as Element, counter);
    }
  });
}

let started = false;

export default function LandingEffects() {
  useEffect(() => {
    // The theme button lives in the landing markup.
    const themeBtn = document.getElementById("themeBtn");
    const onTheme = () => setTheme(currentTheme() === "dark" ? "light" : "dark");
    themeBtn?.addEventListener("click", onTheme);

    // Headlines and section reveals.
    document.querySelectorAll("[data-split]").forEach((h) => {
      if (!h.querySelector(".w")) splitWords(h, { n: 0 });
    });
    const secs = document.querySelectorAll(".sky");
    const dots = document.querySelectorAll(".dots a");
    const reveal = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); } });
    }, { threshold: 0.12 });
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        dots.forEach((d) => d.classList.toggle("on", d.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    secs.forEach((s) => { reveal.observe(s); spy.observe(s); });

    // The bot, then three.js, then the world that uses it. Once per page load.
    if (!started) {
      started = true;
      loadScript("/legacy/bot.js")
        .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"))
        .then(() => loadScript("/legacy/world.js"))
        .catch(() => document.body.classList.add("no3d"));
    }

    return () => {
      themeBtn?.removeEventListener("click", onTheme);
      reveal.disconnect();
      spy.disconnect();
    };
  }, []);

  return null;
}
