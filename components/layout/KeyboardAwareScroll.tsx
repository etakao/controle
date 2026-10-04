"use client";

import { useEffect } from "react";

const FIELD_SELECTOR = "input, textarea, select";
// Tempo aproximado da animação de abertura do teclado virtual.
const KEYBOARD_DELAY_MS = 300;

/**
 * Em dispositivos touch, mantém o campo focado visível quando o teclado virtual
 * aparece, rolando a página até ele.
 */
export function KeyboardAwareScroll() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    function scrollActiveField() {
      const field = document.activeElement;
      if (field instanceof HTMLElement && field.matches(FIELD_SELECTOR)) {
        field.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement) || !event.target.matches(FIELD_SELECTOR)) return;
      clearTimeout(timeout);
      timeout = setTimeout(scrollActiveField, KEYBOARD_DELAY_MS);
    }

    const viewport = window.visualViewport;
    let lastHeight = viewport?.height ?? 0;

    // O teclado reduz a altura do viewport visual; reposiciona quando ele termina de abrir.
    function handleViewportResize() {
      if (!viewport) return;
      if (viewport.height < lastHeight) scrollActiveField();
      lastHeight = viewport.height;
    }

    document.addEventListener("focusin", handleFocusIn);
    viewport?.addEventListener("resize", handleViewportResize);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("focusin", handleFocusIn);
      viewport?.removeEventListener("resize", handleViewportResize);
    };
  }, []);

  return null;
}
