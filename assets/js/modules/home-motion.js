// Movimiento del inicio (GSAP + ScrollTrigger + Lenis, ya cargados por index.html).
// Principios: todo es visible por defecto (sin JS, sin GSAP o con "reducir movimiento" el inicio se lee
// completo); solo se animan transform y opacity; ningún bloque sale del orden de Tab ni del lector de
// pantalla (nada de visibility:hidden); si algo dentro de un bloque recibe foco, el bloque se muestra.
(function () {
  const state = { triggers: [], tweens: [], root: null, timers: [] };

  function reduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function ready() { return typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined"; }

  // Parte un título en palabras con máscara, para que cada palabra suba desde su línea.
  function splitWords(el) {
    if (!el || el.dataset.splitDone === "true") return [];
    const label = el.textContent.trim();
    el.setAttribute("aria-label", label);
    // Respeta los <br>: cada tramo de texto entre saltos se parte en palabras.
    const nodes = [...el.childNodes];
    el.textContent = "";
    const inner = [];
    nodes.forEach((node) => {
      if (node.nodeName === "BR") { el.appendChild(document.createElement("br")); return; }
      const words = String(node.textContent).trim().split(/\s+/).filter(Boolean);
      words.forEach((word, index) => {
        const outer = document.createElement("span");
        outer.className = "eaa-w";
        outer.setAttribute("aria-hidden", "true");
        const span = document.createElement("span");
        span.className = "eaa-wi";
        span.textContent = word;
        outer.appendChild(span);
        el.appendChild(outer);
        if (index < words.length - 1) el.appendChild(document.createTextNode(" "));
        inner.push(span);
      });
    });
    el.dataset.splitDone = "true";
    return inner;
  }

  function track(tween) {
    state.tweens.push(tween);
    if (tween.scrollTrigger) state.triggers.push(tween.scrollTrigger);
    return tween;
  }

  function revealOnFocus(el, tween) {
    el.addEventListener("focusin", () => tween.progress(1));
  }

  function initReveals(root) {
    root.querySelectorAll("[data-split]").forEach((heading) => {
      const words = splitWords(heading);
      if (!words.length) return;
      const inHero = Boolean(heading.closest(".eaa-hero"));
      const tween = track(gsap.from(words, {
        yPercent: 112,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.06,
        delay: inHero ? 0.15 : 0,
        scrollTrigger: inHero ? undefined : { trigger: heading, start: "top 88%", once: true }
      }));
      revealOnFocus(heading, tween);
    });
    root.querySelectorAll("[data-rise]").forEach((el) => {
      if (el.closest(".eaa-hero")) {
        track(gsap.from(el, { opacity: 0, y: 24, duration: 0.8, ease: "power3.out", delay: 0.55 }));
        return;
      }
      const tween = track(gsap.from(el, {
        opacity: 0, y: 36, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      }));
      revealOnFocus(el, tween);
    });
  }

  function initParallax(root) {
    const heroPhoto = root.querySelector("[data-hero-photo]");
    if (heroPhoto) {
      track(gsap.fromTo(heroPhoto, { scale: 1 }, {
        scale: 1.14, ease: "none",
        scrollTrigger: { trigger: heroPhoto.closest(".eaa-hero"), start: "top top", end: "bottom top", scrub: true }
      }));
    }
    root.querySelectorAll(".eaa-destination > img").forEach((img) => {
      img.style.height = "114%";
      img.style.top = "-7%";
      track(gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      }));
    });
  }

  // «Vos vivís el viaje»: en pantallas grandes la sección se queda fija y las tres fotos
  // cambian junto con los tres pasos. En celular o con "reducir movimiento" queda apilada.
  function initStory(root) {
    const story = root.querySelector("[data-story]");
    if (!story || !window.matchMedia("(min-width: 62rem)").matches) return;
    const panels = [...story.querySelectorAll("[data-story-panel]")];
    const steps = [...story.querySelectorAll("[data-story-step]")];
    if (panels.length < 2) return;
    story.classList.add("is-pinned");
    const setActive = (index) => steps.forEach((step, i) => step.classList.toggle("is-dim", i !== index));
    setActive(0);
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: story, start: "top top", end: () => `+=${panels.length * 70}%`, pin: true, scrub: 0.6, anticipatePin: 1,
        onUpdate: (self) => setActive(Math.min(panels.length - 1, Math.floor(self.progress * panels.length * 0.999)))
      }
    });
    panels.forEach((panel, i) => {
      if (i === 0) return;
      timeline.to(panels[i - 1], { opacity: 0, duration: 0.3, ease: "none" }, i - 0.3)
              .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, i - 0.3);
    });
    timeline.to({}, { duration: 0.3 });
    state.tweens.push(timeline);
    if (timeline.scrollTrigger) state.triggers.push(timeline.scrollTrigger);
    state.pinned = story;
  }

  function init(root) {
    kill();
    state.root = root;
    if (!root || reduced() || !ready()) return;
    try {
      gsap.registerPlugin(ScrollTrigger);
      root.classList.add("is-motion");
      initReveals(root);
      initParallax(root);
      initStory(root);
      // Con las imágenes cargadas cambian las alturas: se recalcula una vez y se revela lo que ya quedó a la vista.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh, { once: true });
      state.timers.push(setTimeout(refresh, 600));
      // Red de seguridad: si algo no llegó a animarse, a los 3 segundos el título y el texto de la primera pantalla quedan completos.
      state.timers.push(setTimeout(() => root.querySelectorAll(".eaa-hero [data-split], .eaa-hero [data-rise]").forEach((el) => { el.querySelectorAll(".eaa-wi").forEach((w) => { w.style.transform = "none"; }); el.style.opacity = "1"; }), 3000));
    } catch (error) {
      root.classList.remove("is-motion");
    }
  }

  function kill() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.triggers.forEach((trigger) => trigger.kill());
    state.tweens.forEach((tween) => tween.kill());
    state.triggers = [];
    state.tweens = [];
    if (state.root) state.root.classList.remove("is-motion");
    if (state.pinned) state.pinned.classList.remove("is-pinned");
    state.pinned = null;
    state.root = null;
  }

  window.EAAHomeMotion = { init, kill };
})();
