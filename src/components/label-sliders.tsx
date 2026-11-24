"use client";

import { useEffect } from "react";

/**
 * The interactive figures render bare <input type="range"> controls. Give each an
 * accessible name derived from the text next to it, once the figures have mounted.
 */
export function LabelSliders() {
  useEffect(() => {
    const label = () => {
      document
        .querySelectorAll<HTMLInputElement>('.viz-stage input:not([type="checkbox"]):not([type="radio"]):not([aria-label])')
        .forEach((el, i) => {
          let node: HTMLElement | null = el.parentElement;
          let text = "";
          for (let d = 0; d < 3 && node && !text; d++, node = node.parentElement) {
            text = (node.previousElementSibling?.textContent || node.textContent || "")
              .replace(/[\d.,%×x=]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 40);
          }
          el.setAttribute("aria-label", text ? `${text} control` : `Figure control ${i + 1}`);
        });
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
