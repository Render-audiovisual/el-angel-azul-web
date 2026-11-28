// Movimiento del inicio (GSAP + ScrollTrigger + Lenis, ya cargados por index.html).
// Principios: todo es visible por defecto (sin JS, sin GSAP o con "reducir movimiento" el inicio se lee
// completo); solo se animan transform y opacity; ningún bloque sale del orden de Tab ni del lector de
// pantalla (nada de visibility:hidden); si algo dentro de un bloque recibe foco, el bloque se muestra.
(function () {
  const state = { triggers: [], tweens: [], root: null, timers: [], cleanups: [] };

  function reduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function ready() { return typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined"; }
  function wide() { return window.matchMedia("(min-width: 62rem)").matches; }

  // Titulares que ocupan todo el ancho: se mide el texto a 100 px y se calcula el tamaño que llena la caja.
  function fitText(el) {
    const box = el.parentElement;
    if (!box) return;
    const cs = getComputedStyle(box);
    const available = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (available <= 0) return;
    el.style.fontSize = "100px";
    const range = document.createRange();
    range.selectNodeContents(el);
    const natural = range.getBoundingClientRect().width;
    if (natural > 0) el.style.fontSize = `${Math.min(100 * available / natural, 320)}px`;
  }
  function fitAll(root) { root.querySelectorAll("[data-fit]").forEach(fitText); }

  // Parte un título en palabras con máscara, para que cada palabra suba desde su línea.
  function splitWords(el) {
    if (!el || el.dataset.splitDone === "true") return [];
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
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
  function revealOnFocus(el, tween) { el.addEventListener("focusin", () => tween.progress(1)); }

  // Carrusel independiente del Home; no modifica el hero de Turismo.
  function initHomeCarousel(root) {
    const carousel = root.querySelector("[data-home-carousel]");
    if (!carousel) return;
    const slides = [...carousel.querySelectorAll("[data-home-slide]")];
    const dots = [...carousel.querySelectorAll("[data-home-dot]")];
    const toggle = carousel.querySelector("[data-home-autoplay]");
    const icon = carousel.querySelector("[data-home-pause-icon]");
    const stage = carousel.querySelector(".eaa-home-carousel-stage");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (slides.length < 2 || !toggle) return;
    let index = 0, timer = null, playing = !motionPreference.matches, hovering = false, explicitPlayback = false;
    const clearTimer = () => { clearTimeout(timer); timer = null; };
    function schedule() {
      clearTimer();
      if (playing && !document.hidden && (explicitPlayback || (!hovering && !carousel.contains(document.activeElement)))) {
        timer = setTimeout(() => show((index + 1) % slides.length), 4000);
      }
    }
    function updatePlayback() {
      toggle.setAttribute("aria-label", playing ? "Pausar carrusel" : "Reproducir carrusel");
      icon?.setAttribute("d", playing ? "M9 5v14M15 5v14" : "M8 5l11 7-11 7Z");
      stage.setAttribute("aria-live", playing ? "off" : "polite");
      schedule();
    }
    function show(next) {
      index = next;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
        dots[i]?.setAttribute("aria-pressed", String(i === index));
      });
      schedule();
    }
    dots.forEach((dot, i) => dot.addEventListener("click", () => { playing = false; updatePlayback(); show(i); }));
    toggle.addEventListener("click", () => { playing = !playing; explicitPlayback = playing; updatePlayback(); });
    const onEnter = () => { hovering = true; explicitPlayback = false; clearTimer(); };
    const onLeave = () => { hovering = false; schedule(); };
    const onFocusIn = () => { explicitPlayback = false; clearTimer(); };
    const onFocusOut = () => { explicitPlayback = false; clearTimer(); timer = setTimeout(schedule, 0); };
    const onMotionChange = () => { if (motionPreference.matches) { playing = false; updatePlayback(); } };
    carousel.addEventListener("mouseenter", onEnter);
    carousel.addEventListener("mouseleave", onLeave);
    carousel.addEventListener("focusin", onFocusIn);
    carousel.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", schedule);
    motionPreference.addEventListener("change", onMotionChange);
    state.cleanups.push(() => {
      clearTimer();
      carousel.removeEventListener("mouseenter", onEnter);
      carousel.removeEventListener("mouseleave", onLeave);
      carousel.removeEventListener("focusin", onFocusIn);
      carousel.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", schedule);
      motionPreference.removeEventListener("change", onMotionChange);
    });
    updatePlayback();
  }

  // Fotos del hero: cambia sola cada pocos segundos (se detiene si la persona usa las flechas o tras unas vueltas),
  // con contador, barra de progreso y descripción. Funciona también con "reducir movimiento" (sin avance automático).
  function initHero(root) {
    const slides = [...root.querySelectorAll("[data-hero-slide]")];
    if (slides.length < 2) return;
    const bar = root.querySelector("[data-hero-bar]");
    const count = root.querySelector("[data-hero-count]");
    const caption = root.querySelector("[data-hero-caption]");
    const DURATION = 5500;
    const MAX_AUTO = slides.length * 2;
    let index = 0, autoplay = !reduced(), steps = 0, animation = null, timer = null;
    const show = (next) => {
      slides[index].classList.remove("is-active");
      index = (next + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      if (count) count.textContent = `0${index + 1}/0${slides.length}`;
      if (caption) caption.textContent = slides[index].dataset.caption || "";
      schedule();
    };
    function schedule() {
      clearTimeout(timer);
      if (animation) animation.cancel();
      if (!autoplay || steps >= MAX_AUTO) { if (bar) bar.style.transform = "scaleX(0)"; return; }
      if (bar && bar.animate) animation = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: DURATION, easing: "linear", fill: "forwards" });
      timer = setTimeout(() => { steps += 1; show(index + 1); }, DURATION);
    }
    const stopAuto = () => { autoplay = false; schedule(); };
    root.querySelector("[data-hero-prev]")?.addEventListener("click", () => { stopAuto(); show(index - 1); });
    root.querySelector("[data-hero-next]")?.addEventListener("click", () => { stopAuto(); show(index + 1); });
    const onVisibility = () => { if (document.hidden) { clearTimeout(timer); animation?.pause(); } else if (autoplay) schedule(); };
    document.addEventListener("visibilitychange", onVisibility);
    state.cleanups.push(() => { clearTimeout(timer); animation?.cancel(); document.removeEventListener("visibilitychange", onVisibility); });
    schedule();
  }

  function initReveals(root) {
    root.querySelectorAll("[data-split]").forEach((heading) => {
      const words = splitWords(heading);
      if (!words.length) return;
      const inHero = Boolean(heading.closest(".eaa-hero"));
      const tween = track(gsap.from(words, {
        yPercent: 112, duration: 1, ease: "expo.out", stagger: 0.06, delay: inHero ? 0.2 : 0,
        scrollTrigger: inHero ? undefined : { trigger: heading, start: "top 88%", once: true }
      }));
      revealOnFocus(heading, tween);
    });
    root.querySelectorAll("[data-rise]").forEach((el) => {
      if (el.closest(".eaa-hero")) {
        track(gsap.from(el, { y: 24, duration: 0.9, ease: "power3.out", delay: 0.4 })); // sin opacity: el texto del hero se lee desde el primer cuadro
        return;
      }
      const tween = track(gsap.from(el, { opacity: 0, y: 36, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }));
      revealOnFocus(el, tween);
    });
    // El titular de ancho completo del hero entra con un leve acercamiento de la foto.
    const hero = root.querySelector("[data-hero]");
    if (hero) track(gsap.fromTo(hero.querySelectorAll(".eaa-hero-slide img"), { scale: 1.08 }, { scale: 1, duration: 2.2, ease: "expo.out" }));
  }

  // Texto que se "llena" palabra por palabra mientras se scrollea (la presentación).
  function initScrubText(root) {
    root.querySelectorAll("[data-scrub-words]").forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute("aria-label", words.join(" "));
      el.textContent = "";
      const spans = words.map((word, i) => {
        const span = document.createElement("span");
        span.className = "eaa-sw";
        span.setAttribute("aria-hidden", "true");
        span.textContent = word;
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
        return span;
      });
      track(gsap.fromTo(spans, { opacity: 0.22 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 46%", scrub: true } }));
    });
  }

  function initParallax(root) {
    const hero = root.querySelector("[data-hero]");
    if (hero && wide()) {
      track(gsap.to(hero.querySelector(".eaa-hero-inner"), { yPercent: -8, opacity: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } }));
      track(gsap.to(hero.querySelectorAll(".eaa-hero-slide img"), { scale: 1.16, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } }));
    }
    root.querySelectorAll("[data-work]").forEach((panel) => {
      const bg = panel.querySelector("[data-work-bg]");
      const type = panel.querySelector("[data-work-type]");
      const thumb = panel.querySelector("[data-work-thumb]");
      const scroll = { trigger: panel, start: "top bottom", end: "bottom top", scrub: true };
      if (bg) track(gsap.fromTo(bg, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: scroll }));
      if (type) track(gsap.fromTo(type, { x: () => window.innerWidth * 0.1 }, { x: () => -type.scrollWidth * 0.34, ease: "none", scrollTrigger: scroll }));
      if (thumb) track(gsap.fromTo(thumb, { yPercent: -6 }, { yPercent: 8, ease: "none", scrollTrigger: { ...scroll } }));
    });
    const tourism = root.querySelector(".eaa-tourism-media img");
    if (tourism) track(gsap.fromTo(tourism, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: tourism.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
    const photo = root.querySelector("[data-cta-photo]");
    if (photo) track(gsap.fromTo(photo, { scale: 0.7 }, { scale: 1, ease: "none", scrollTrigger: { trigger: photo.closest(".eaa-cta"), start: "top 70%", end: "center center", scrub: true } }));
  }

  // Pasos de inscripción: el que está en el centro de la pantalla se resalta.
  function initProcess(root) {
    root.querySelectorAll("[data-process-row]").forEach((row) => {
      state.triggers.push(ScrollTrigger.create({ trigger: row, start: "top 72%", end: "bottom 38%", onToggle: (self) => row.classList.toggle("is-on", self.isActive) }));
    });
  }

  // Tarjetas de «Momentos»: se apilan y la anterior se achica al llegar la siguiente.
  function initStack(root) {
    if (!wide()) return;
    const cards = [...root.querySelectorAll("[data-stack-card]")];
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      track(gsap.to(card, { scale: 0.93, ease: "none", scrollTrigger: { trigger: next, start: "top 90%", end: "top 24%", scrub: true } }));
    });
  }

  function init(root) {
    kill();
    state.root = root;
    if (!root) return;
    fitAll(root);
    const refit = () => fitAll(root);
    window.addEventListener("resize", refit);
    state.cleanups.push(() => window.removeEventListener("resize", refit));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    initHero(root);
    initHomeCarousel(root);
    if (reduced() || !ready()) return;
    try {
      gsap.registerPlugin(ScrollTrigger);
      root.classList.add("is-motion");
      initReveals(root);
      initScrubText(root);
      initParallax(root);
      initProcess(root);
      initStack(root);
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh, { once: true });
      state.timers.push(setTimeout(refresh, 700));
      // Red de seguridad: si algo no llegó a animarse, a los 3 segundos la primera pantalla queda completa.
      state.timers.push(setTimeout(() => root.querySelectorAll(".eaa-hero [data-split], .eaa-hero [data-rise]").forEach((el) => { el.querySelectorAll(".eaa-wi").forEach((w) => { w.style.transform = "none"; }); el.style.opacity = "1"; }), 3000));
    } catch (error) {
      root.classList.remove("is-motion");
    }
  }

  function refresh() { if (ready() && state.root) ScrollTrigger.refresh(); }

  function kill() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.cleanups.forEach((fn) => fn());
    state.cleanups = [];
    state.triggers.forEach((trigger) => trigger.kill());
    state.tweens.forEach((tween) => tween.kill());
    state.triggers = [];
    state.tweens = [];
    if (state.root) state.root.classList.remove("is-motion");
    state.root = null;
  }

  window.EAAHomeMotion = { init, kill, refresh };
})();
