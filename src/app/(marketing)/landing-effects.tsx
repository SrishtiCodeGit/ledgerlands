"use client";

import { useEffect } from "react";
import { loadScript, THREE_URL, type KingdomHandle } from "@/lib/load-script";
import { setTheme, currentTheme } from "@/lib/theme";

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

    // The bot, then three.js, then the world, which is mounted here and stopped when the page goes away.
    let alive = true;
    let world: KingdomHandle | null = null;
    loadScript("/legacy/bot.js")
      .then(() => loadScript(THREE_URL))
      .then(() => loadScript("/legacy/world.js"))
      .then(() => {
        const host = document.getElementById("world");
        if (!alive || !host) return;
        world = window.LLWorld?.mount(host) ?? null;
        if (!world) document.body.classList.add("no3d");
      })
      .catch(() => document.body.classList.add("no3d"));

    return () => {
      alive = false;
      world?.destroy();
      themeBtn?.removeEventListener("click", onTheme);
      reveal.disconnect();
      spy.disconnect();
    };
  }, []);

  return null;
}
