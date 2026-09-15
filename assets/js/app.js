      function isAdminEntry() {
        const pathname = location.pathname.replace(/\/+$/, "") || "/";
        const hashPath = location.hash.replace("#", "").split("?")[0];
        return document.body?.dataset.appEntry === "admin" ||
          pathname.includes("/admin") ||
          hashPath === "/admin" ||
          hashPath.startsWith("/admin/");
      }

      function adminPathFromLocation() {
        const pathname = location.pathname.replace(/\/+$/, "") || "/";
        if (pathname.endsWith("/admin/turismo") || pathname.endsWith("/admin-turismo")) return "/admin/turismo";
        if (pathname.endsWith("/admin/fichas")) return "/admin/fichas";
        if (pathname.endsWith("/admin/grupos")) return "/admin/grupos";
        if (pathname.endsWith("/admin/pasajeros")) return "/admin/pasajeros";
        if (pathname.endsWith("/admin/contratos")) return "/admin/contratos";
        if (pathname.endsWith("/admin/pagos")) return "/admin/pagos";
        if (pathname.endsWith("/admin/configuracion")) return "/admin/configuracion";
        if (pathname.endsWith("/admin")) return "/admin";
        return "/admin";
      }

      function currentPath() {
        const hashPath = location.hash.replace("#", "");
        if (hashPath) return hashPath.split("?")[0];
        if (location.pathname.replace(/\/+$/, "").includes("/admin")) return adminPathFromLocation();
        if (isAdminEntry()) return adminPathFromLocation();
        return "/";
      }

      function currentHashParams() {
        const hashPath = location.hash.replace("#", "");
        const query = hashPath.includes("?") ? hashPath.split("?").slice(1).join("?") : "";
        return new URLSearchParams(query);
      }

      function adminRouteHref(path) {
        // El frontend es una SPA basada en hash. Las rutas físicas como
        // /admin/fichas no existen en el servidor y, con una sesión activa,
        // terminaban en 404. Mantener toda la navegación interna en hash
        // funciona desde la portada y también desde la entrada /admin.
        return `#${path}`;
      }


      function isAdminPath(path) {
        return path === "/admin" ||
          path === "/admin-turismo" ||
          path === "/admin/turismo" ||
          path === "/admin/fichas" ||
          path === "/admin/grupos" ||
          path === "/admin/pasajeros" ||
          path === "/admin/contratos" ||
          path === "/admin/pagos" ||
          path === "/admin/configuracion";
      }







      async function renderHome() {
        const heroSlides = [
          { src: "assets/img/home/hero-carousel/bariloche-atardecer-grupo-hero.webp", pos: "center 42%" },
          { src: "assets/img/home/hero-carousel/bariloche-nieve-cerro-grupo-hero.webp", pos: "center 30%" },
          { src: "assets/img/home/hero-carousel/bariloche-cartel-brc-grupo-hero.webp", pos: "center 38%" },
          { src: "assets/img/home/hero-carousel/bariloche-centro-civico-grupo-hero.webp", pos: "center 40%" },
          { src: "assets/img/home/hero-carousel/carlos-paz-reloj-cucu-grupo-hero.webp", pos: "center 40%" }
        ];
        const carouselPhotos = [
          { name: "bariloche-atardecer-grupo", alt: "Grupo de estudiantes al atardecer frente al lago en Bariloche", cap: "Bariloche · atardecer sobre el lago" },
          { name: "bariloche-centro-civico-grupo", alt: "Grupo con las camperas de El Ángel Azul en el Centro Cívico de Bariloche", cap: "Bariloche · Centro Cívico" },
          { name: "bariloche-nieve-cerro-grupo", alt: "Grupo de egresados en la nieve al pie del cerro en Bariloche", cap: "Bariloche · día de nieve" },
          { name: "bariloche-cartel-brc-grupo", alt: "Grupo posando en el cartel de Bariloche a la orilla del lago", cap: "Bariloche · a la orilla del Nahuel Huapi" },
          { name: "carlos-paz-reloj-cucu-grupo", alt: "Grupo frente al reloj cucú de Villa Carlos Paz", cap: "Carlos Paz · el reloj cucú" },
          { name: "bariloche-nieve-panoramica-grupo", alt: "Grupo de estudiantes con vista panorámica de las montañas nevadas", cap: "Bariloche · panorámica de montaña" },
          { name: "bariloche-lago-montana-grupo", alt: "Grupo de estudiantes frente al lago y la montaña nevada", cap: "Bariloche · lago y cordillera" },
          { name: "carlos-paz-escape-room-grupo", alt: "Grupo de primaria en una actividad de escape room en Carlos Paz", cap: "Carlos Paz · viaje de primaria" }
        ];
        document.getElementById("app").innerHTML = `
          <div class="layout home-layout-v2">

            <!-- HERO -->
            <section class="hero-clean hero-cine">
              <div class="hero-clean-carousel" aria-hidden="true">
                ${heroSlides.map((slide, index) => `
                  <div class="hero-clean-slide${index === 0 ? " is-active" : ""}" style="background-image: url('${slide.src}'); background-position: ${slide.pos}"></div>
                `).join("")}
              </div>
              <div class="hero-clean-overlay" aria-hidden="true"></div>
              <div class="hero-clean-content">
                <p class="hero-clean-kicker">El Ángel Azul · Turismo estudiantil</p>
                <h1 class="hero-clean-title" data-hero-title>El mejor viaje de <span class="ht-accent">tu vida</span></h1>
                <p class="hero-clean-subtitle">Organizamos cada detalle y viajamos con el grupo. Las familias quedan tranquilas y los chicos vuelven con la historia de su vida.</p>
                <div class="hero-clean-actions">
                  <a class="btn-whatsapp btn-icon-pair" href="${whatsappLink("Hola, quiero consultar por un viaje con El Ángel Azul.")}" target="_blank" rel="noopener">
                    <span>Hablar con El Ángel Azul</span>
                    <span class="btn-icon-circle" aria-hidden="true"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">chat</span></span>
                  </a>
                  <a class="btn-ghost-light" href="#/turismo">Ver destinos</a>
                </div>
                <div class="hero-clean-benefits">
                  ${[["verified_user", "Acompañamiento en destino"], ["payments", "Financiación disponible"], ["support_agent", "Atención personalizada"], ["diversity_3", "Primaria y secundaria"]].map(([icon, label]) => `
                    <span class="hero-clean-benefit">
                      <span class="material-symbols-outlined">${icon}</span>
                      ${escapeHtml(label)}
                    </span>
                  `).join("")}
                </div>
              </div>
              <div class="hero-clean-scroll" aria-hidden="true">
                <span class="material-symbols-outlined">expand_more</span>
              </div>
            </section>

            <!-- QUIÉNES SOMOS -->
            <section class="quienes-somos" data-reveal-section>
              <div class="quienes-somos-inner">
                <div class="quienes-somos-photo-wrap" data-reveal>
                  <div class="quienes-somos-photo-shell">
                    <div class="quienes-somos-photo" style="background-image: url('assets/img/home/experiencia/bariloche-lago-companeros.webp')" role="img" aria-label="Grupo de estudiantes de El Ángel Azul frente al lago en Bariloche"></div>
                  </div>
                  <div class="quienes-somos-badge">
                    <div class="quienes-somos-badge-head">
                      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">volunteer_activism</span>
                      <p>Cerca en todo el viaje</p>
                    </div>
                    <p class="quienes-somos-quote">"Acompañamos al grupo antes, durante y después."</p>
                  </div>
                </div>
                <div class="quienes-somos-body">
                  <div class="quienes-somos-heading" data-reveal>
                    <p class="section-kicker">Quiénes somos</p>
                    <h2>Una agencia que acompaña de verdad, en cada etapa</h2>
                    <p>Somos una empresa de Corrientes especializada en turismo y viajes estudiantiles. Estamos cerca desde la primera consulta hasta que el grupo vuelve a casa, con organización clara y trato humano.</p>
                  </div>
                  <div class="quienes-somos-values" data-reveal>
                    ${trustSectionData.cards.slice(0, 3).map((card) => {
                      const icons = { "Experiencia": "workspace_premium", "Acompañamiento": "support_agent", "Financiación": "payments" };
                      return `
                        <div class="quienes-somos-value">
                          <span class="quienes-somos-value-icon"><span class="material-symbols-outlined">${icons[card.title] || "check_circle"}</span></span>
                          <div>
                            <strong>${escapeHtml(card.title)}</strong>
                            <p>${escapeHtml(card.text)}</p>
                          </div>
                        </div>
                      `;
                    }).join("")}
                  </div>
                </div>
              </div>
            </section>

            <!-- CARRUSEL DE VIAJES -->
            <section class="viajes-carousel-section" data-reveal-section>
              <div class="viajes-carousel-heading" data-reveal>
                <p class="section-kicker">Momentos reales</p>
                <h2>Viajes que ya quedaron para siempre</h2>
                <p>Fotos de nuestros grupos en destino. Así se ve un viaje organizado y acompañado por El Ángel Azul.</p>
              </div>
              <div class="viajes-carousel" data-viajes-carousel data-reveal>
                <div class="swiper">
                  <div class="swiper-wrapper">
                    ${carouselPhotos.map((photo) => `
                      <div class="swiper-slide">
                        <figure class="viajes-slide">
                          <img src="assets/img/home/carrusel-viajes/${photo.name}.webp" srcset="assets/img/home/carrusel-viajes/${photo.name}-800.webp 800w, assets/img/home/carrusel-viajes/${photo.name}.webp 1600w" sizes="(max-width: 720px) 90vw, 60vw" alt="${escapeHtml(photo.alt)}" loading="lazy">
                          <figcaption>${escapeHtml(photo.cap)}</figcaption>
                        </figure>
                      </div>
                    `).join("")}
                  </div>
                </div>
                <button class="viajes-carousel-nav viajes-carousel-prev" type="button" aria-label="Foto anterior"><span class="material-symbols-outlined">arrow_back</span></button>
                <button class="viajes-carousel-nav viajes-carousel-next" type="button" aria-label="Foto siguiente"><span class="material-symbols-outlined">arrow_forward</span></button>
                <div class="viajes-carousel-pagination" data-viajes-pagination></div>
              </div>
              <div class="viajes-carousel-cta" data-reveal>
                <a class="btn-whatsapp btn-icon-pair" href="${whatsappLink("Hola, quiero que mi grupo viva un viaje así con El Ángel Azul.")}" target="_blank" rel="noopener">
                  <span>Quiero un viaje así</span>
                  <span class="btn-icon-circle" aria-hidden="true"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">chat</span></span>
                </a>
              </div>
            </section>

          </div>
        `;
        bindHeroCarousel();
        bindViajesCarousel();
        bindHomeAnimations();
      }

      // Carrusel automático del hero: rota las fotos cada 3 segundos con
      // crossfade. Se limpia el interval anterior antes de arrancar uno
      // nuevo, por si renderHome() se llama de nuevo (volver a Inicio
      // varias veces en la misma sesión) - evita que se acumulen varios
      // intervals corriendo en simultáneo y el carrusel se acelere.
      let heroCarouselInterval = null;
      function bindHeroCarousel() {
        if (heroCarouselInterval) {
          clearInterval(heroCarouselInterval);
          heroCarouselInterval = null;
        }
        const slides = [...document.querySelectorAll(".hero-clean-slide")];
        if (slides.length < 2) return;
        let current = slides.findIndex((slide) => slide.classList.contains("is-active"));
        if (current < 0) current = 0;
        heroCarouselInterval = setInterval(() => {
          slides[current].classList.remove("is-active");
          current = (current + 1) % slides.length;
          slides[current].classList.add("is-active");
        }, 3000);
      }

      // Animaciones de Home (GSAP, cargado por CDN en index.html). Todo es
      // progresivo: si el CDN falla o el usuario tiene reducir-movimiento
      // activado, el DOM queda tal cual lo dejó el CSS (nada se esconde vía
      // opacity:0 en CSS, así que no hay riesgo de contenido invisible).
      // Se limpian los ScrollTriggers/tweens anteriores por si renderHome()
      // se llama de nuevo (volver a Inicio varias veces en la sesión).
      let homeScrollTriggers = [];
      let homeHeroZoomTween = null;

      function killHomeAnimations() {
        homeScrollTriggers.forEach((trigger) => trigger.kill());
        homeScrollTriggers = [];
        if (homeHeroZoomTween) {
          homeHeroZoomTween.kill();
          homeHeroZoomTween = null;
        }
      }

      // Parte un título en palabras (cada una envuelta en su propio span) para
      // animarlas de a una - revelado "fade-in-blur" tipo editorial en vez de
      // opacity plana sobre todo el bloque. Preserva el tramo acentuado
      // (.ht-accent) del hero. Idempotente - no vuelve a partir si ya se hizo.
      function splitWords(titleEl) {
        if (!titleEl || titleEl.dataset.split === "true") return [];
        const frag = document.createDocumentFragment();
        const words = [];
        const makeWord = (word, accent) => {
          const span = document.createElement("span");
          span.className = "reveal-word" + (accent ? " is-accent" : "");
          span.textContent = word;
          words.push(span);
          return span;
        };
        const pushText = (text, accent) => {
          text.split(/(\s+)/).forEach((part) => {
            if (part === "") return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
            else frag.appendChild(makeWord(part, accent));
          });
        };
        [...titleEl.childNodes].forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) pushText(node.textContent, false);
          else if (node.nodeType === Node.ELEMENT_NODE) pushText(node.textContent, node.classList.contains("ht-accent"));
        });
        titleEl.innerHTML = "";
        titleEl.appendChild(frag);
        titleEl.dataset.split = "true";
        return words;
      }

      // Revelado "fade-in-blur" palabra por palabra (referencia: text-reveal de
      // cnippet.dev/21st.dev): cada palabra pasa de desenfocada+transparente a
      // nítida+opaca, con un stagger corto. Devuelve el tween para poder
      // encadenarlo en una timeline o dispararlo por ScrollTrigger.
      function fadeInBlurWords(words, vars = {}) {
        return gsap.from(words, {
          autoAlpha: 0,
          filter: "blur(10px)",
          y: 10,
          duration: 0.7,
          stagger: 0.05,
          ease: "power2.out",
          ...vars
        });
      }

      function bindHomeAnimations() {
        if (typeof gsap === "undefined") return;
        killHomeAnimations();
        // "Reducir movimiento" ya NO apaga el reveal de texto por completo -
        // antes lo hacía (return acá mismo) y eso deja el título/las secciones
        // sin ninguna animación para cualquiera que tenga esa preferencia del
        // sistema activada (muy común sin que el usuario lo haya elegido a
        // propósito). Ahora corre una versión mínima: fade simple, sin blur,
        // sin desplazamiento, mucho más corta - sigue siendo respetuosa con
        // la preferencia de accesibilidad, pero el texto SÍ hace una
        // transición visible en vez de aparecer estático de golpe. Lo que sí
        // se sigue salteando del todo bajo reducir-movimiento: el zoom
        // continuo del carrusel, el parallax de scroll y Lenis (scroll suave)
        // - esos son movimiento continuo/vestibular, no revelado de texto.
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

        const heroCarousel = document.querySelector(".hero-clean-carousel");
        const heroKicker = document.querySelector(".hero-clean-kicker");
        const heroTitle = document.querySelector("[data-hero-title]");
        const heroSubtitle = document.querySelector(".hero-clean-subtitle");
        const heroActions = document.querySelector(".hero-clean-actions");
        const heroBenefits = document.querySelectorAll(".hero-clean-benefit");

        // Entrada del hero: kicker aparece, las palabras del título entran con
        // fade-in-blur (de desenfocadas+transparentes a nítidas, en cascada),
        // y detrás entran subtítulo, CTAs y beneficios. Bajo reducir-movimiento
        // se corre la misma secuencia pero sin blur/desplazamiento y bien corta.
        if (heroTitle) {
          const words = splitWords(heroTitle);
          const heroIntro = gsap.timeline({ defaults: { ease: "power3.out" } });
          if (reduceMotion) {
            heroIntro
              .from(heroKicker, { autoAlpha: 0, duration: 0.25 })
              .from(words, { autoAlpha: 0, duration: 0.35, stagger: 0.015 }, "-=0.1")
              .from(heroSubtitle, { autoAlpha: 0, duration: 0.25 }, "-=0.2")
              .from(heroActions ? heroActions.children : [], { autoAlpha: 0, duration: 0.25, stagger: 0.04 }, "-=0.15")
              .from(heroBenefits, { autoAlpha: 0, duration: 0.25, stagger: 0.03 }, "-=0.15");
          } else {
            heroIntro
              .from(heroKicker, { autoAlpha: 0, y: 16, duration: 0.5 })
              .add(fadeInBlurWords(words, { duration: 0.9, stagger: 0.07 }), "-=0.15")
              .from(heroSubtitle, { autoAlpha: 0, y: 18, duration: 0.6 }, "-=0.6")
              .from(heroActions ? heroActions.children : [], { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.08 }, "-=0.4")
              .from(heroBenefits, { autoAlpha: 0, y: 12, duration: 0.45, stagger: 0.06 }, "-=0.35");
          }
          // Anti "título en blanco": el revelado esconde las palabras (blur +
          // opacity 0) y las muestra al reproducirse. Si el ticker de GSAP está
          // pausado (pestaña en segundo plano, renderers/headless que capturan
          // sin rAF), el timeline no avanza y el título quedaría oculto.
          // setTimeout SÍ dispara en ese caso: si a los 1.4s no arrancó,
          // forzamos el estado final (progress(1) renderiza sincrónicamente).
          setTimeout(() => { if (heroIntro.progress() < 1) heroIntro.progress(1); }, 1400);
        }

        // Zoom cinematográfico lento y continuo sobre el carrusel de fotos:
        // movimiento continuo/de fondo, no revelado de texto - se saltea del
        // todo bajo reducir-movimiento (es justo el tipo de motion que esa
        // preferencia pide evitar).
        if (heroCarousel && !reduceMotion) {
          homeHeroZoomTween = gsap.to(heroCarousel, {
            scale: 1.08,
            duration: 16,
            ease: "none",
            repeat: -1,
            yoyo: true,
            transformOrigin: "center center"
          });
        }

        if (typeof ScrollTrigger === "undefined") return;

        // Parallax sutil (scroll-linked, continuo): mismo criterio que el
        // zoom, se saltea con reducir-movimiento.
        if (heroCarousel && !reduceMotion) {
          const parallax = gsap.to(heroCarousel, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: ".hero-clean", start: "top top", end: "bottom top", scrub: true }
          });
          if (parallax.scrollTrigger) homeScrollTriggers.push(parallax.scrollTrigger);
        }

        // Anti "contenido en blanco": mismo resguardo que el hero. Si al
        // entrar en viewport el ticker de GSAP está pausado (pestaña oculta,
        // renderers/headless sin rAF), la animación queda parada en su estado
        // inicial (oculto). Si a los 1.2s de haber entrado no avanzó, se
        // fuerza el estado final - no depende del rAF.
        const armAntiBlankFallback = (animation) => {
          setTimeout(() => { if (animation.progress() < 1) animation.progress(1); }, 1200);
        };

        // Reveal sutil al hacer scroll: cada bloque marcado con [data-reveal]
        // hace un fade-up cuando entra en viewport (bajo reducir-movimiento,
        // la misma secuencia pero corta y sin desplazamiento/blur - nunca se
        // saltea del todo, es revelado de texto/contenido, no motion continuo).
        // El default (sin JS) los deja visibles, así que nunca queda
        // contenido escondido. Si el bloque tiene un título (h1/h2), ese
        // título se revela palabra por palabra en fade-in-blur y el resto del
        // bloque (kicker, texto) hace el fade-up de siempre alrededor.
        gsap.utils.toArray("[data-reveal]").forEach((el) => {
          const heading = el.querySelector(":scope > h1, :scope > h2");
          const blockVars = reduceMotion
            ? { autoAlpha: 0, duration: 0.3, stagger: 0.03 }
            : { autoAlpha: 0, y: 20, duration: 0.55, stagger: 0.06 };
          if (!heading) {
            const tween = gsap.from(el, {
              autoAlpha: 0,
              y: reduceMotion ? 0 : 26,
              duration: reduceMotion ? 0.3 : 0.65,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 86%", toggleActions: "play none none reverse", onEnter: () => armAntiBlankFallback(tween) }
            });
            if (tween.scrollTrigger) homeScrollTriggers.push(tween.scrollTrigger);
            return;
          }
          const words = splitWords(heading);
          const before = [...el.children].filter((child) => child !== heading && child.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING);
          const after = [...el.children].filter((child) => child !== heading && !before.includes(child));
          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: { trigger: el, start: "top 86%", toggleActions: "play none none reverse", onEnter: () => armAntiBlankFallback(tl) }
          });
          if (before.length) tl.from(before, blockVars);
          tl.add(fadeInBlurWords(words, reduceMotion
            ? { duration: 0.35, stagger: 0.015, filter: "blur(0px)", y: 0 }
            : { duration: 0.7, stagger: 0.045 }), before.length ? "-=0.3" : 0);
          if (after.length) tl.from(after, blockVars, "-=0.25");
          if (tl.scrollTrigger) homeScrollTriggers.push(tl.scrollTrigger);
        });
      }

      // Carrusel premium de viajes (Swiper, cargado por CDN). Si Swiper no está
      // disponible (CDN caído / bloqueado), el .swiper queda como una fila con
      // scroll-snap horizontal via CSS -> las fotos siguen siendo navegables,
      // no se rompe nada. Se destruye la instancia anterior antes de crear una
      // nueva por si se vuelve a Inicio en la misma sesión.
      let viajesSwiper = null;
      function bindViajesCarousel() {
        if (viajesSwiper && typeof viajesSwiper.destroy === "function") {
          viajesSwiper.destroy(true, true);
          viajesSwiper = null;
        }
        const root = document.querySelector("[data-viajes-carousel]");
        if (!root || typeof Swiper === "undefined") return;
        const swiperEl = root.querySelector(".swiper");
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        viajesSwiper = new Swiper(swiperEl, {
          slidesPerView: 1.15,
          spaceBetween: 16,
          centeredSlides: true,
          loop: true,
          grabCursor: true,
          speed: 600,
          // observer/observeParents + los update() de abajo evitan que Swiper
          // quede con un ancho mal medido si se inicializa antes de que el
          // layout o las imágenes (lazy) terminen de resolver su tamaño.
          observer: true,
          observeParents: true,
          autoplay: reduceMotion ? false : { delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true },
          keyboard: { enabled: true },
          a11y: { prevSlideMessage: "Foto anterior", nextSlideMessage: "Foto siguiente" },
          navigation: {
            prevEl: root.querySelector(".viajes-carousel-prev"),
            nextEl: root.querySelector(".viajes-carousel-next")
          },
          pagination: {
            el: root.querySelector("[data-viajes-pagination]"),
            clickable: true
          },
          breakpoints: {
            720: { slidesPerView: 1.6, spaceBetween: 22 },
            1040: { slidesPerView: 2.2, spaceBetween: 26 }
          }
        });
        const refresh = () => { if (viajesSwiper && typeof viajesSwiper.update === "function") viajesSwiper.update(); };
        requestAnimationFrame(refresh);
        window.addEventListener("load", refresh, { once: true });
        swiperEl.querySelectorAll("img").forEach((img) => {
          if (!img.complete) img.addEventListener("load", refresh, { once: true });
        });
      }

      const turismoIntentionFilters = [
        ["todos", "Todos"],
        ["playa", "Playa"],
        ["nieve", "Nieve"],
        ["familiar", "Familiar"],
        ["pareja", "Pareja"],
        ["grupo", "Grupo"],
        ["escapada", "Escapada"],
        ["nacional", "Nacional"],
        ["internacional", "Internacional"]
      ];

      const TURISMO_PUBLIC_JSON_URL = "assets/data/turismo-paquetes.json";
      const ADMIN_TURISMO_PREVIEW_MODE_KEY = "angelAzulTurismoPublicPreviewModeV1";
      let turismoPublicPackagesCache = null;

      function turismoPackages() {
        return turismoPublicPackagesCache || turismoFallbackPackages();
      }

      function turismoFallbackPackages() {
        return turismoData.packages.slice(1, 7);
      }

      function isTurismoPublicPreviewMode() {
        return localStorage.getItem(ADMIN_TURISMO_PREVIEW_MODE_KEY) === "true";
      }

      function setTurismoPublicPreviewMode(isActive) {
        if (isActive) {
          localStorage.setItem(ADMIN_TURISMO_PREVIEW_MODE_KEY, "true");
        } else {
          localStorage.removeItem(ADMIN_TURISMO_PREVIEW_MODE_KEY);
        }
        turismoPublicPackagesCache = null;
      }

      function turismoCategoryLabel(category) {
        return adminTurismoCategories.find(([value]) => value === category)?.[1] || "Turismo";
      }

      function turismoDisplayPrice(value, currency = "ARS") {
        const raw = String(value || "").trim();
        if (!raw) return "";
        if (/[A-Za-z$]/.test(raw)) return raw;
        const numeric = Number(raw);
        if (!Number.isFinite(numeric)) return raw;
        const formatted = new Intl.NumberFormat("es-AR", {
          maximumFractionDigits: Number.isInteger(numeric) ? 0 : 2
        }).format(numeric);
        if (currency === "ARS") return `$${formatted}`;
        if (currency === "USD") return `USD ${formatted}`;
        return formatted;
      }

      function adminTripToPublicPackage(adminTrip) {
        if (!adminTrip || adminTrip.estado !== "activo") return null;
        if (!adminTrip.slug || !adminTrip.destino) return null;
        const photos = Array.isArray(adminTrip.fotos) ? adminTrip.fotos.filter((photo) => photo?.url) : [];
        const principalPhoto = photos.find((photo) => photo.principal) || photos[0];
        const gallery = photos.map((photo) => photo.url);
        const categories = Array.isArray(adminTrip.categorias) ? adminTrip.categorias : [];
        const firstCategory = categories[0] || "turismo";
        const title = adminTrip.titulo || adminTrip.destino || "Viaje";
        const image = principalPhoto?.url || turismoFallbackPackages()[0]?.image;
        const visiblePrice = turismoDisplayPrice(adminTrip.precioDesde, adminTrip.moneda);
        return {
          id: adminTrip.id,
          slug: adminTrip.slug,
          destino: adminTrip.destino,
          titulo: title,
          tipo: categories.map(turismoCategoryLabel).join(" · ") || "Turismo",
          categoria: turismoCategoryLabel(firstCategory),
          intenciones: categories,
          duracion: adminTrip.duracion || "A confirmar",
          temporada: adminTrip.temporada || "Consultar disponibilidad",
          fechaSalida: adminTrip.fechaSalida || "",
          fechaRegreso: adminTrip.fechaRegreso || "",
          salidaGarantizada: Boolean(adminTrip.salidaGarantizada),
          resumen: adminTrip.descripcionCorta || "Consultanos por disponibilidad y detalles de este viaje.",
          descripcion: adminTrip.descripcionLarga || adminTrip.descripcionCorta || "Viaje con asesoramiento de El Angel Azul.",
          incluye: Array.isArray(adminTrip.incluye) ? adminTrip.incluye : [],
          noIncluye: Array.isArray(adminTrip.noIncluye) ? adminTrip.noIncluye : [],
          formasPago: Array.isArray(adminTrip.formasPago) && adminTrip.formasPago.length ? adminTrip.formasPago : ["Efectivo / transferencia", "Financiacion a consultar", "Reserva sujeta a disponibilidad"],
          itinerario: Array.isArray(adminTrip.itinerario) ? adminTrip.itinerario : [],
          precio: visiblePrice || "Consultar disponibilidad",
          precioDesde: visiblePrice || "Consultar",
          precioValor: adminTrip.precioValor,
          precioBaseDoble: adminTrip.precioBaseDoble || "",
          suplementoSingle: adminTrip.suplementoSingle || "",
          precioMenor: adminTrip.precioMenor || "",
          condicionVenta: adminTrip.condicionVenta || "",
          moneda: adminTrip.moneda,
          image,
          gallery: gallery.length ? gallery : [image],
          destacado: Boolean(adminTrip.destacado),
          orden: Number(adminTrip.orden) || 999,
          source: "admin-json"
        };
      }

      async function loadTurismoPublicPackages() {
        if (turismoPublicPackagesCache) return turismoPublicPackagesCache;
        if (isTurismoPublicPreviewMode()) {
          const adminTrips = loadAdminTurismoTrips();
          turismoPublicPackagesCache = adminTrips
            .map(adminTripToPublicPackage)
            .filter(Boolean)
            .sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.orden - b.orden);
          return turismoPublicPackagesCache;
        }

        // 1. Intentar leer desde Google Sheets (fuente de verdad en vivo)
        try {
          const response = await fetch("/api/google-sheets?sheet=TURISMO", { cache: "no-store" });
          if (response.ok) {
            const payload = await response.json();
            if (payload.ok && Array.isArray(payload.rows) && payload.rows.length) {
              const publicPackages = payload.rows
                .map(turismoRowToTrip)
                .map(adminTripToPublicPackage)
                .filter(Boolean)
                .sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.orden - b.orden);
              if (publicPackages.length) {
                turismoPublicPackagesCache = publicPackages;
                return turismoPublicPackagesCache;
              }
            }
          }
        } catch (error) {
          // Google Sheets no disponible, seguir al fallback JSON
        }

        // 2. Fallback: JSON estático
        try {
          const response = await fetch(TURISMO_PUBLIC_JSON_URL, { cache: "no-store" });
          if (!response.ok) throw new Error("No se pudo cargar turismo-paquetes.json");
          const adminTrips = await response.json();
          if (!Array.isArray(adminTrips)) throw new Error("El JSON de Turismo no es un array");
          const publicPackages = adminTrips
            .map(adminTripToPublicPackage)
            .filter(Boolean)
            .sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.orden - b.orden);
          if (!publicPackages.length) throw new Error("El JSON no tiene viajes activos");
          turismoPublicPackagesCache = publicPackages;
        } catch (error) {
          // 3. Último fallback: paquetes de demostración
          turismoPublicPackagesCache = turismoFallbackPackages();
        }
        return turismoPublicPackagesCache;
      }

      async function turismoPackageBySlug(slug) {
        const packages = await loadTurismoPublicPackages();
        return packages.find((packageItem) => packageItem.slug === slug);
      }

      function turismoWhatsappForPackage(packageItem) {
        const title = packageItem.titulo || `el viaje a ${packageItem.destino}`;
        const price = packageItem.precioDesde && packageItem.precioDesde !== "Consultar"
          ? ` desde ${packageItem.precioDesde}`
          : "";
        return whatsappLink(`Hola, quiero consultar por ${title} (${packageItem.duracion})${price}. Lo vi en la web de El Angel Azul. ¿Me pasan disponibilidad y formas de pago?`);
      }

      function renderTurismoPackageCard(packageItem) {
        const gallery = packageItem.gallery?.length ? packageItem.gallery.slice(0, 3) : [packageItem.image];
        const priceText = packageItem.precioDesde && packageItem.precioDesde !== "Consultar" ? packageItem.precioDesde : "Consultar";
        const includeItems = Array.isArray(packageItem.incluye) ? packageItem.incluye.slice(0, 3) : [];
        const destination = escapeHtml(packageItem.destino);
        const category = escapeHtml(packageItem.categoria);
        return `
          <article class="package-card turismo-package-card">
            <div class="package-image-wrap package-card-carousel" data-card-carousel data-carousel-index="0">
              <div class="package-carousel-track">
                ${gallery.map((image, index) => `
                  <img class="${index === 0 ? "active" : ""}" src="${escapeHtml(safeMediaUrl(image))}" alt="${destination} ${index + 1}" data-carousel-slide>
                `).join("")}
              </div>
              <span data-categoria="${escapeHtml(((packageItem.intenciones && packageItem.intenciones[0]) || "").toLowerCase())}">${category}</span>
              <button class="package-carousel-arrow package-carousel-prev" type="button" aria-label="Foto anterior de ${destination}" data-carousel-prev>‹</button>
              <button class="package-carousel-arrow package-carousel-next" type="button" aria-label="Foto siguiente de ${destination}" data-carousel-next>›</button>
              <div class="package-carousel-count" aria-hidden="true">1/${gallery.length}</div>
            </div>
            <div class="package-card-body">
              <div class="package-card-head">
                <p class="package-meta">${escapeHtml(packageItem.tipo)} · ${escapeHtml(packageItem.temporada)}</p>
                <h3>${destination}</h3>
              </div>
              <div class="package-quick-info">
                <span>${escapeHtml(packageItem.duracion)}</span>
                <span>${category}</span>
              </div>
              ${packageItem.fechaSalida ? `
                <p class="package-fecha-salida">
                  ${escapeHtml(packageItem.fechaSalida)}${packageItem.fechaRegreso ? ` al ${escapeHtml(packageItem.fechaRegreso)}` : ""}
                  ${packageItem.salidaGarantizada ? `<span class="package-badge-garantizada">Salida garantizada</span>` : ""}
                </p>
              ` : ""}
              <p class="package-summary">${escapeHtml(packageItem.resumen)}</p>
              <div class="package-price" aria-label="Precio desde ${escapeHtml(priceText)}">
                <span>Precio de referencia</span>
                <strong>${escapeHtml(priceText)}</strong>
              </div>
              ${includeItems.length ? `<div class="package-includes" aria-label="Incluye">
                <strong>Incluye</strong>
                <div>
                  ${includeItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
                </div>
              </div>` : ""}
              <div class="package-actions">
                <a href="#/turismo/${encodeURIComponent(String(packageItem.slug || ""))}">Ver detalles</a>
                <a class="package-whatsapp" href="${escapeHtml(turismoWhatsappForPackage(packageItem))}" target="_blank" rel="noopener">WhatsApp</a>
              </div>
            </div>
          </article>
        `;
      }

      function bindTurismoCardCarousels(root = document) {
        root.querySelectorAll("[data-card-carousel]").forEach((carousel) => {
          if (carousel.dataset.carouselBound === "true") return;
          carousel.dataset.carouselBound = "true";
          const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
          const counter = carousel.querySelector(".package-carousel-count");
          const update = (nextIndex) => {
            const index = (nextIndex + slides.length) % slides.length;
            carousel.dataset.carouselIndex = String(index);
            slides.forEach((slide, slideIndex) => {
              slide.classList.toggle("active", slideIndex === index);
            });
            if (counter) counter.textContent = `${index + 1}/${slides.length}`;
          };
          carousel.querySelector("[data-carousel-prev]")?.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            update(Number(carousel.dataset.carouselIndex || 0) - 1);
          });
          carousel.querySelector("[data-carousel-next]")?.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            update(Number(carousel.dataset.carouselIndex || 0) + 1);
          });
        });
      }

      function renderTurismoEmptyState() {
        return `
          <div class="turismo-empty-state">
            <p>No encontramos viajes para esta categoría por ahora. Consultanos por WhatsApp y te ayudamos a encontrar una opción.</p>
            <a class="package-whatsapp" href="${whatsappLink("Hola, quiero consultar por una categoría de viaje que no encontré en la web de El Ángel Azul.")}" target="_blank" rel="noopener">Consultar</a>
          </div>
        `;
      }

      function turismoPackageMatchesSearch(packageItem, query = "") {
        const normalizedQuery = String(query || "").trim().toLowerCase();
        if (!normalizedQuery) return true;
        const searchable = [
          packageItem.destino,
          packageItem.titulo,
          packageItem.tipo,
          packageItem.temporada,
          packageItem.categoria,
          packageItem.duracion,
          packageItem.resumen,
          ...(Array.isArray(packageItem.incluye) ? packageItem.incluye : [])
        ].join(" ").toLowerCase();
        return searchable.includes(normalizedQuery);
      }

      function updateTurismoPackages(filter = "todos", query = "") {
        const grid = document.querySelector("[data-turismo-package-grid]");
        const count = document.querySelector("[data-turismo-results-count]");
        if (!grid) return;
        const packages = turismoPackages().filter((packageItem) => {
          const matchesFilter = filter === "todos" || packageItem.intenciones?.includes(filter);
          return matchesFilter && turismoPackageMatchesSearch(packageItem, query);
        });
        if (count) {
          count.textContent = packages.length === 1 ? "1 opción encontrada" : `${packages.length} opciones encontradas`;
        }
        grid.dataset.resultCount = String(packages.length);
        grid.innerHTML = packages.length
          ? packages.map(renderTurismoPackageCard).join("")
          : renderTurismoEmptyState();
        bindTurismoCardCarousels(grid);
        bindTurismoCardReveal();
      }

      // Animaciones de Turismo: deliberadamente más livianas que las del Home
      // (fade-up simple, sin blur ni split de palabras) - Home es la primera
      // impresión cinematográfica, Turismo es la sección funcional donde el
      // cliente compara viajes. Dos listas separadas de ScrollTriggers: una
      // para encabezados/hero (se limpia solo al re-renderizar toda la
      // página) y otra para las cards del listado (se limpia y rearma cada
      // vez que cambian los filtros, porque el grid se reemplaza entero).
      let turismoScrollTriggers = [];
      let turismoCardTriggers = [];

      function killTurismoAnimations() {
        turismoScrollTriggers.forEach((trigger) => trigger.kill());
        turismoScrollTriggers = [];
        turismoCardTriggers.forEach((trigger) => trigger.kill());
        turismoCardTriggers = [];
      }

      // Mismo resguardo que en Home: si a los 1.2/1.3s la animación no avanzó
      // (ticker de GSAP pausado - pestaña oculta, renderer headless sin rAF),
      // se fuerza el estado final para que nunca quede contenido invisible.
      function turismoAntiBlankFallback(animation) {
        setTimeout(() => { if (animation.progress() < 1) animation.progress(1); }, 1200);
      }

      function bindTurismoCardReveal() {
        turismoCardTriggers.forEach((trigger) => trigger.kill());
        turismoCardTriggers = [];
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
        const cards = [...document.querySelectorAll("[data-turismo-package-grid] .turismo-package-card")];
        if (!cards.length) return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        gsap.set(cards, { autoAlpha: 0, y: reduceMotion ? 0 : 22 });
        const batchTriggers = ScrollTrigger.batch(cards, {
          start: "top 92%",
          onEnter: (elements) => gsap.to(elements, {
            autoAlpha: 1,
            y: 0,
            duration: reduceMotion ? 0.25 : 0.5,
            stagger: reduceMotion ? 0.02 : 0.08,
            ease: "power2.out",
            overwrite: true
          })
        });
        turismoCardTriggers.push(...batchTriggers);
        setTimeout(() => {
          cards.forEach((card) => { if (getComputedStyle(card).opacity === "0") gsap.set(card, { autoAlpha: 1, y: 0 }); });
        }, 1300);
      }

      function bindTurismoAnimations() {
        if (typeof gsap === "undefined") return;
        killTurismoAnimations();
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

        // Hero de Turismo: entrada simple al cargar (fade+leve subida), sin
        // split de palabras ni blur - ese efecto queda reservado para el
        // Home, que es la primera impresión.
        const heroContent = document.querySelector(".turismo-hero-content");
        if (heroContent) {
          const heroIntro = gsap.timeline({ defaults: { ease: "power2.out" } })
            .from(heroContent.children, {
              autoAlpha: 0,
              y: reduceMotion ? 0 : 16,
              duration: reduceMotion ? 0.3 : 0.6,
              stagger: reduceMotion ? 0.03 : 0.08
            });
          setTimeout(() => { if (heroIntro.progress() < 1) heroIntro.progress(1); }, 1200);
        }

        if (typeof ScrollTrigger === "undefined") return;

        // Encabezados de sección (Buscá por destino, Opciones disponibles, Te
        // ayudamos a elegir): fade-up simple al entrar en viewport.
        gsap.utils.toArray("[data-reveal-light]").forEach((el) => {
          if (el === heroContent) return;
          const tween = gsap.from(el, {
            autoAlpha: 0,
            y: reduceMotion ? 0 : 18,
            duration: reduceMotion ? 0.3 : 0.5,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse", onEnter: () => turismoAntiBlankFallback(tween) }
          });
          if (tween.scrollTrigger) turismoScrollTriggers.push(tween.scrollTrigger);
        });

        bindTurismoCardReveal();
      }

      function bindTurismoIntentions() {
        const chips = [...document.querySelectorAll("[data-turismo-intention]")];
        const search = document.querySelector("[data-turismo-search]");
        const applyFilters = () => {
          const activeChip = document.querySelector("[data-turismo-intention].active");
          updateTurismoPackages(activeChip?.dataset.turismoIntention || "todos", search?.value || "");
        };
        chips.forEach((chip) => {
          chip.addEventListener("click", () => {
            chips.forEach((item) => item.classList.toggle("active", item === chip));
            applyFilters();
          });
        });
        search?.addEventListener("input", applyFilters);
      }

      async function renderTurismo() {
        const packages = await loadTurismoPublicPackages();
        const previewMode = isTurismoPublicPreviewMode();
        document.getElementById("app").innerHTML = `
          <div class="layout turismo-layout">
            ${previewMode ? `
              <section class="turismo-preview-mode-banner">
                <div>
                  <strong>Modo prueba activo</strong>
                  <span>Estás viendo los viajes guardados en el Admin de este navegador. No afecta la web pública real.</span>
                </div>
                <button type="button" data-disable-turismo-preview>Volver al JSON público</button>
              </section>
            ` : ""}
            <section class="turismo-hero">
              <div class="turismo-hero-carousel" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="turismo-hero-content" data-reveal-light>
                <p class="turismo-kicker">Turismo nacional e internacional</p>
                <h1>Tu próximo viaje, planificado y acompañado</h1>
                <p>Escapadas en familia, en pareja o en grupo, con asesoramiento claro antes de reservar y alguien que responde en cada paso.</p>
                <div class="turismo-proof-list" aria-label="Beneficios principales">
                  <span>Destinos nacionales e internacionales</span>
                  <span>Asesoramiento directo</span>
                  <span>Pagos y fechas a confirmar</span>
                </div>
                <div class="turismo-hero-actions">
                  <a href="#/turismo" data-scroll-target="turismo-catalogo">Ver viajes</a>
                  <a class="btn-icon-pair" href="${whatsappLink("Hola, quiero que me asesoren para elegir un viaje turístico con El Ángel Azul.")}" target="_blank" rel="noopener">
                    <span>Pedir asesoramiento</span>
                    <span class="btn-icon-circle" aria-hidden="true"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">chat</span></span>
                  </a>
                </div>
              </div>
            </section>

            <section class="turismo-intention-section">
              <div class="catalog-heading" data-reveal-light>
                <h2>Buscá por destino o tipo de experiencia</h2>
                <p>Filtrá las opciones disponibles. La reserva final siempre se confirma con asesoramiento personalizado.</p>
              </div>
              <label class="turismo-search" for="turismo-search">
                <span>Buscar destino</span>
                <input id="turismo-search" type="search" placeholder="Ej: Bariloche, Cataratas, playa..." data-turismo-search>
              </label>
              <div class="intention-chip-row" aria-label="Selector de intención visual">
                ${turismoIntentionFilters.map(([value, label], index) => `
                  <button class="intention-chip${index === 0 ? " active" : ""}" type="button" data-turismo-intention="${value}">${label}</button>
                `).join("")}
              </div>
            </section>

            <section class="catalog-section" id="turismo-catalogo">
              <div class="catalog-heading" data-reveal-light>
                <h2>Opciones disponibles</h2>
                <p>Compará destino, duración, precio de referencia e incluidos. Fechas, cupos y condiciones se confirman por WhatsApp.</p>
                <strong class="turismo-results-count" data-turismo-results-count>${packages.length} opciones encontradas</strong>
              </div>
              <div class="package-grid" data-turismo-package-grid data-result-count="${packages.length}">
                ${packages.map(renderTurismoPackageCard).join("")}
              </div>
            </section>

            <section class="turismo-trust">
              <div class="catalog-heading" data-reveal-light>
                <p class="section-kicker">Antes de viajar</p>
                <h2>Te ayudamos a elegir sin vueltas</h2>
                <p>Si no encontrás el viaje exacto, te orientamos con fechas, cantidad de personas y presupuesto aproximado.</p>
              </div>
              <div class="turismo-trust-grid">
                <article>
                  <span>01</span>
                  <strong>Contanos la idea</strong>
                  <p>Fecha tentativa, cantidad de personas y estilo de viaje.</p>
                </article>
                <article>
                  <span>02</span>
                  <strong>Filtramos opciones</strong>
                  <p>Revisamos destinos, cupos y condiciones actuales.</p>
                </article>
                <article>
                  <span>03</span>
                  <strong>Decidís con claridad</strong>
                  <p>Comparás precio, duración e incluidos antes de reservar.</p>
                </article>
              </div>
              <div class="turismo-trust-actions">
                <a class="package-whatsapp" href="${whatsappLink("Hola, quiero consultar por un viaje turístico con El Ángel Azul. Busco opciones según fecha, presupuesto y cantidad de personas.")}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
              </div>
            </section>
          </div>
        `;
        document.querySelector("[data-disable-turismo-preview]")?.addEventListener("click", () => {
          setTurismoPublicPreviewMode(false);
          renderTurismo();
        });
        bindTurismoIntentions();
        bindTurismoCardCarousels();
        bindTurismoAnimations();
      }

      function renderPackageDetail(packageItem) {
        const gallery = packageItem.gallery?.length ? packageItem.gallery : [packageItem.image];
        const whatsappHref = turismoWhatsappForPackage(packageItem);
        const itinerario = Array.isArray(packageItem.itinerario) ? packageItem.itinerario : [];
        const formasPago = Array.isArray(packageItem.formasPago) ? packageItem.formasPago : [];
        const fechasSalida = [packageItem.fechaSalida, packageItem.fechaRegreso].filter(Boolean).join(" al ");
        const heroImage = packageItem.image?.startsWith("http") || packageItem.image?.startsWith("/")
          ? packageItem.image
          : `/${packageItem.image}`;

        document.getElementById("app").innerHTML = `
          <div class="layout turismo-layout">

            <!-- HERO con imagen de portada -->
            <section class="package-detail-hero" style="--package-hero-image: url('${heroImage}')">
              <div class="package-detail-hero-content">
                <a class="package-back-link" href="#/turismo">← Volver a Turismo</a>
                <p class="turismo-kicker">${escapeHtml(packageItem.tipo)} · ${escapeHtml(packageItem.temporada)}</p>
                <h1>${escapeHtml(packageItem.titulo || packageItem.destino)}</h1>
                ${fechasSalida ? `<p class="package-detail-fechas">${escapeHtml(fechasSalida)}</p>` : ""}
                ${packageItem.salidaGarantizada ? `<span class="package-detail-badge">Salida garantizada</span>` : ""}
                <div class="package-detail-hero-highlights" aria-label="Datos principales del viaje">
                  <span>${escapeHtml(packageItem.duracion || "Duración a confirmar")}</span>
                  <span>${escapeHtml(packageItem.precioDesde || "Precio a consultar")}</span>
                  <span>${escapeHtml(packageItem.tipo || "Turismo")}</span>
                </div>
                <div class="turismo-hero-actions">
                  <a href="${whatsappHref}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
                </div>
              </div>
            </section>

            <!-- PRECIO DESTACADO -->
            <section class="package-detail-precio-section">
              <div class="package-detail-precio-card">
                <div class="package-detail-precio-main">
                  <span>Desde</span>
                  <strong>${escapeHtml(packageItem.precioDesde || "Consultar")}</strong>
                  <small>por persona</small>
                </div>
                ${packageItem.precioBaseDoble || packageItem.suplementoSingle || packageItem.precioMenor ? `
                  <div class="package-detail-precio-desglose">
                    ${packageItem.precioBaseDoble ? `<div><span>Base doble</span><strong>${escapeHtml(packageItem.moneda || "")} ${escapeHtml(packageItem.precioBaseDoble)}</strong></div>` : ""}
                    ${packageItem.suplementoSingle ? `<div><span>Suplemento single</span><strong>+ ${escapeHtml(packageItem.moneda || "")} ${escapeHtml(packageItem.suplementoSingle)}</strong></div>` : ""}
                    ${packageItem.precioMenor ? `<div><span>Precio menor</span><strong>${escapeHtml(packageItem.moneda || "")} ${escapeHtml(packageItem.precioMenor)}</strong></div>` : ""}
                  </div>
                ` : ""}
                <a class="package-detail-precio-cta" href="${whatsappHref}" target="_blank" rel="noopener">Consultar disponibilidad</a>
              </div>

              <div class="package-detail-facts">
                ${fechasSalida ? `<div><span>Fechas</span><strong>${escapeHtml(fechasSalida)}</strong></div>` : ""}
                <div><span>Duración</span><strong>${escapeHtml(packageItem.duracion || "A confirmar")}</strong></div>
                <div><span>Destino</span><strong>${escapeHtml(packageItem.destino)}</strong></div>
                <div><span>Temporada</span><strong>${escapeHtml(packageItem.temporada)}</strong></div>
                <div><span>Tipo</span><strong>${escapeHtml(packageItem.tipo)}</strong></div>
                ${packageItem.salidaGarantizada ? `<div><span>Estado</span><strong class="package-detail-garantizada">Salida garantizada</strong></div>` : ""}
              </div>
            </section>

            <!-- GALERÍA -->
            ${gallery.length > 1 ? `
              <section class="package-detail-gallery" aria-label="Galería de ${escapeHtml(packageItem.destino)}">
                <div class="package-detail-section-head">
                  <p class="section-kicker">Fotos del destino</p>
                  <h2>Un vistazo al viaje</h2>
                </div>
                <img class="package-gallery-main" src="${escapeHtml(safeMediaUrl(gallery[0]))}" alt="${escapeHtml(packageItem.destino)}">
                <div class="package-gallery-strip">
                  ${gallery.slice(1).map((image, index) => `
                    <img src="${escapeHtml(safeMediaUrl(image))}" alt="${escapeHtml(packageItem.destino)} ${index + 2}">
                  `).join("")}
                </div>
              </section>
            ` : ""}

            <!-- DESCRIPCIÓN -->
            <section class="package-detail-summary">
              <p class="section-kicker">Sobre el viaje</p>
              <h2>${escapeHtml(packageItem.titulo || packageItem.destino)}</h2>
              <p>${escapeHtml(packageItem.descripcion)}</p>
            </section>

            <!-- INCLUYE / NO INCLUYE -->
            <section class="package-detail-content">
              <div class="package-detail-list-card package-detail-list-card--positive">
                <h2>Qué incluye</h2>
                <ul class="package-detail-check-list">
                  ${packageItem.incluye.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </div>
              ${packageItem.noIncluye?.length ? `
                <div class="package-detail-list-card package-detail-list-card--neutral">
                  <h2>Qué no incluye</h2>
                  <ul class="package-detail-check-list">
                    ${packageItem.noIncluye.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
            </section>

            <!-- ITINERARIO (acordeón: primer día expandido, resto colapsado) -->
            ${itinerario.length ? `
              <section class="package-detail-itinerario">
                <p class="section-kicker">Programa</p>
                <h2>Itinerario día por día</h2>
                <div class="package-itinerario-list" data-itinerario-accordion>
                  ${itinerario.map((dia, index) => `
                    <div class="package-itinerario-item${index === 0 ? " is-open" : ""}" data-itinerario-item>
                      <button type="button" class="package-itinerario-toggle" data-itinerario-toggle aria-expanded="${index === 0 ? "true" : "false"}">
                        <span class="package-itinerario-num">${escapeHtml(String(dia.dia || index + 1).padStart(2, "0"))}</span>
                        <span class="package-itinerario-toggle-text">
                          <strong>${escapeHtml(dia.titulo)}</strong>
                          <small>Actividad principal</small>
                        </span>
                        <span class="material-symbols-outlined package-itinerario-chevron">expand_more</span>
                      </button>
                      ${dia.descripcion ? `<div class="package-itinerario-body"><p>${escapeHtml(dia.descripcion)}</p></div>` : ""}
                    </div>
                  `).join("")}
                </div>
              </section>
            ` : ""}

            <!-- FORMAS DE PAGO -->
            ${formasPago.length ? `
              <section class="package-detail-payment">
                <div class="package-detail-section-head">
                  <p class="section-kicker">Reserva y pago</p>
                  <h2>Formas de pago</h2>
                </div>
                <ul class="package-detail-payment-list">
                  ${formasPago.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </section>
            ` : ""}

            <!-- CONDICIÓN DE VENTA -->
            ${packageItem.condicionVenta ? `
              <section class="package-detail-condicion">
                <strong>Condición de venta</strong>
                <p>${escapeHtml(packageItem.condicionVenta)}</p>
              </section>
            ` : ""}

            <!-- CTA FINAL -->
            <section class="turismo-cta package-detail-cta">
              <h2>¿Querés reservar este viaje?</h2>
              <p>Consultanos por WhatsApp y te pasamos disponibilidad, precio actualizado y próximas salidas.</p>
              <div class="turismo-hero-actions">
                <a href="${whatsappHref}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
                <a href="#/turismo">Ver más viajes</a>
              </div>
            </section>

          </div>

          <!-- Barra fija inferior: precio + WhatsApp siempre accesible al scrollear -->
          <div class="package-sticky-bar">
            <div>
              <span>Desde</span>
              <strong>${escapeHtml(packageItem.precioDesde || "Consultar")}</strong>
            </div>
            <a href="${whatsappHref}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          </div>
        `;
        bindPackageDetailItinerario();
      }

      function bindPackageDetailItinerario() {
        document.querySelectorAll("[data-itinerario-toggle]").forEach((button) => {
          button.addEventListener("click", () => {
            const item = button.closest("[data-itinerario-item]");
            if (!item) return;
            const isOpen = item.classList.toggle("is-open");
            button.setAttribute("aria-expanded", isOpen ? "true" : "false");
          });
        });
      }

      const ADMIN_TURISMO_STORAGE_KEY = "angelAzulAdminTurismoTripsV2";
      const ADMIN_TURISMO_PUBLISHED_KEY = "angelAzulAdminTurismoPublishedV1";

      const adminTurismoCategories = [
        ["playa", "Playa"],
        ["nieve", "Nieve"],
        ["familiar", "Familiar"],
        ["pareja", "Pareja"],
        ["grupo", "Grupo"],
        ["escapada", "Escapada"],
        ["nacional", "Nacional"],
        ["internacional", "Internacional"]
      ];

      const adminTurismoCurrencies = ["ARS", "USD", "Consultar"];

      const emptyAdminTurismoTrip = {
        id: "",
        slug: "",
        destino: "",
        titulo: "",
        duracion: "",
        temporada: "",
        fechaSalida: "",
        fechaRegreso: "",
        salidaGarantizada: false,
        precioDesde: "",
        precioValor: null,
        moneda: "USD",
        precioBaseDoble: "",
        suplementoSingle: "",
        precioMenor: "",
        condicionVenta: "Precios por persona en base doble. Sujeto a cambios y disponibilidad.",
        categorias: [],
        descripcionCorta: "",
        descripcionLarga: "",
        incluye: [],
        noIncluye: [],
        formasPago: [],
        itinerario: [],
        fotos: [],
        estado: "borrador",
        destacado: false,
        orden: 1
      };

      let adminTurismoTrips = loadAdminTurismoTrips();
      let adminTurismoEditingId = adminTurismoTrips[0]?.id || null;
      let adminTurismoEditorOpen = false;
      let adminTurismoSaveFeedback = null;

      function escapeHtml(value = "") {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function safeMediaUrl(value = "") {
        const candidate = String(value || "").trim();
        if (!candidate) return "";
        if (/^(\/(?!\/)|assets\/)/i.test(candidate)) return candidate;
        try {
          const parsed = new URL(candidate);
          return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
        } catch (error) {
          return "";
        }
      }

      function loadAdminTurismoTrips() {
        try {
          const saved = localStorage.getItem(ADMIN_TURISMO_STORAGE_KEY);
          if (!saved) return [];
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed.map(normalizeAdminTurismoTrip) : [];
        } catch (error) {
          return [];
        }
      }

      function saveAdminTurismoTrips() {
        localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(adminTurismoTrips.map(normalizeAdminTurismoTrip), null, 2));
        if (!googleSheetsHydrating) queueGoogleSheetsWrite(["TURISMO"]);
      }

      // Guardado explícito con feedback directo para el operador.
      // deleteIds: ids que se quieren borrar de la hoja explícitamente (ver writeSheet en
      // server.js: desde el fix de concurrencia, omitir un id de "rows" ya NO lo borra solo,
      // porque ahora se fusiona con lo que ya existe en Sheets en vez de reemplazar todo).
      async function saveAdminTurismoTripsWithFeedback(deleteIds = []) {
        localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(adminTurismoTrips.map(normalizeAdminTurismoTrip), null, 2));
        const config = window.ElAngelAzulPersistence.readGoogleSheetsConfig();
        if (!config.enabled || !config.endpoint) {
          adminTurismoSaveFeedback = { ok: false, message: "Guardado solo en este navegador. La base de datos no está conectada." };
          return false;
        }
        try {
          const rows = googleSheetsTurismoRows(new Date().toISOString());
          await window.ElAngelAzulPersistence.writeGoogleSheetRows("TURISMO", rows, deleteIds);
          adminTurismoSaveFeedback = { ok: true, message: `Guardado en la base de datos: ${rows.length} ${rows.length === 1 ? "viaje" : "viajes"}.` };
          turismoPublicPackagesCache = null;
          return true;
        } catch (error) {
          adminTurismoSaveFeedback = { ok: false, message: `No se pudo guardar en la base de datos: ${error.message || "error desconocido"}.` };
          return false;
        }
      }

      async function importAdminTurismoPublicDefaults() {
        if (adminTurismoTrips.length) {
          window.alert("La importación inicial solo está disponible cuando Turismo está vacío.");
          return;
        }
        const previousTrips = adminTurismoTrips;
        try {
          const response = await fetch(`/${TURISMO_PUBLIC_JSON_URL}`, { cache: "no-store" });
          if (!response.ok) throw new Error("No se pudieron leer los viajes públicos actuales.");
          const sourceTrips = await response.json();
          const activeTrips = Array.isArray(sourceTrips)
            ? sourceTrips.filter((trip) => trip?.estado === "activo")
            : [];
          if (activeTrips.length !== 2 || !activeTrips.some((trip) => trip.destino === "Bariloche") || !activeTrips.some((trip) => trip.destino === "Brasil")) {
            throw new Error("La fuente pública no contiene exactamente Bariloche y Brasil activos.");
          }
          adminTurismoTrips = activeTrips.map((trip) => normalizeAdminTurismoTrip({
            ...trip,
            precioDesde: trip.precioValor == null ? "" : String(trip.precioValor)
          }));
          adminTurismoEditingId = adminTurismoTrips[0]?.id || null;
          adminTurismoEditorOpen = false;
          const saved = await saveAdminTurismoTripsWithFeedback();
          if (!saved) throw new Error(adminTurismoSaveFeedback?.message || "No se pudo guardar la importación.");
          renderAdminTurismo();
          window.alert("Bariloche y Brasil se importaron correctamente a la base de Turismo.");
        } catch (error) {
          adminTurismoTrips = previousTrips;
          adminTurismoEditingId = null;
          adminTurismoEditorOpen = false;
          localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(previousTrips, null, 2));
          renderAdminTurismo();
          window.alert(error.message || "No se pudo completar la importación.");
        }
      }

      function googleSheetsTurismoRows(now = new Date().toISOString()) {
        return adminTurismoTrips.map(normalizeAdminTurismoTrip).map((trip) => ({
          id: trip.id || "",
          slug: trip.slug || "",
          destino: trip.destino || "",
          titulo: trip.titulo || "",
          duracion: trip.duracion || "",
          temporada: trip.temporada || "",
          fecha_salida: trip.fechaSalida || "",
          fecha_regreso: trip.fechaRegreso || "",
          salida_garantizada: trip.salidaGarantizada ? "TRUE" : "FALSE",
          precio_desde: trip.precioDesde || "",
          precio_valor: trip.precioValor != null ? String(trip.precioValor) : "",
          moneda: trip.moneda || "USD",
          precio_base_doble: trip.precioBaseDoble || "",
          suplemento_single: trip.suplementoSingle || "",
          precio_menor: trip.precioMenor || "",
          condicion_venta: trip.condicionVenta || "",
          categorias: (trip.categorias || []).join("|"),
          descripcion_corta: trip.descripcionCorta || "",
          descripcion_larga: trip.descripcionLarga || "",
          incluye: (trip.incluye || []).join("|"),
          no_incluye: (trip.noIncluye || []).join("|"),
          formas_pago: (trip.formasPago || []).join("|"),
          itinerario: JSON.stringify(trip.itinerario || []),
          fotos: JSON.stringify(trip.fotos || []),
          estado: trip.estado || "borrador",
          destacado: trip.destacado ? "TRUE" : "FALSE",
          orden: String(trip.orden || 999),
          created_at: trip.created_at || now,
          updated_at: now
        }));
      }

      function turismoRowToTrip(row = {}) {
        const splitPipe = (val) => String(val || "").split("|").map((s) => s.trim()).filter(Boolean);
        const safeJson = (val, fallback) => {
          try { return JSON.parse(val); } catch (e) { return fallback; }
        };
        return normalizeAdminTurismoTrip({
          id: row.id,
          slug: row.slug,
          destino: row.destino,
          titulo: row.titulo,
          duracion: row.duracion,
          temporada: row.temporada,
          fechaSalida: row.fecha_salida,
          fechaRegreso: row.fecha_regreso,
          salidaGarantizada: String(row.salida_garantizada).toUpperCase() === "TRUE",
          precioDesde: row.precio_desde,
          precioValor: row.precio_valor,
          moneda: row.moneda,
          precioBaseDoble: row.precio_base_doble,
          suplementoSingle: row.suplemento_single,
          precioMenor: row.precio_menor,
          condicionVenta: row.condicion_venta,
          categorias: splitPipe(row.categorias),
          descripcionCorta: row.descripcion_corta,
          descripcionLarga: row.descripcion_larga,
          incluye: splitPipe(row.incluye),
          noIncluye: splitPipe(row.no_incluye),
          formasPago: splitPipe(row.formas_pago),
          itinerario: safeJson(row.itinerario, []),
          fotos: safeJson(row.fotos, []),
          estado: row.estado,
          destacado: String(row.destacado).toUpperCase() === "TRUE",
          orden: row.orden
        });
      }

      function loadAdminTurismoPublishedMap() {
        try {
          const parsed = JSON.parse(localStorage.getItem(ADMIN_TURISMO_PUBLISHED_KEY) || "{}");
          return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
          return {};
        }
      }

      function saveAdminTurismoPublishedMap(map) {
        localStorage.setItem(ADMIN_TURISMO_PUBLISHED_KEY, JSON.stringify(map, null, 2));
      }

      function adminTurismoTripSignature(trip) {
        const normalized = normalizeAdminTurismoTrip(trip);
        return JSON.stringify({
          slug: normalized.slug,
          destino: normalized.destino,
          titulo: normalized.titulo,
          duracion: normalized.duracion,
          temporada: normalized.temporada,
          precioDesde: normalized.precioDesde,
          moneda: normalized.moneda,
          categorias: normalized.categorias,
          descripcionCorta: normalized.descripcionCorta,
          descripcionLarga: normalized.descripcionLarga,
          incluye: normalized.incluye,
          noIncluye: normalized.noIncluye,
          fotos: normalized.fotos,
          estado: normalized.estado,
          destacado: normalized.destacado,
          orden: normalized.orden
        });
      }

      function adminTurismoSlug(value = "") {
        return value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "viaje-demo";
      }

      function adminTurismoCurrentTrip() {
        return adminTurismoTrips.find((trip) => trip.id === adminTurismoEditingId) || adminTurismoTrips[0] || { ...emptyAdminTurismoTrip };
      }

      function linesToArray(value) {
        if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
        return String(value || "")
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      function arrayToLines(value) {
        return linesToArray(value).join("\n");
      }

      function normalizeAdminTurismoCategories(value) {
        const allowed = adminTurismoCategories.map(([category]) => category);
        const raw = Array.isArray(value) ? value : String(value || "").split(/[,\n]+/);
        return raw
          .map((category) => adminTurismoSlug(category))
          .filter((category, index, all) => allowed.includes(category) && all.indexOf(category) === index);
      }

      function normalizeAdminTurismoPhotos(value, principalIndex = 0) {
        if (Array.isArray(value)) {
          const photos = value
            .map((photo, index) => {
              if (typeof photo === "string") {
                return { url: photo.trim(), alt: "", principal: index === Number(principalIndex) };
              }
              return {
                url: String(photo?.url || "").trim(),
                alt: String(photo?.alt || "").trim(),
                principal: Boolean(photo?.principal)
              };
            })
            .filter((photo) => photo.url);
          const activeIndex = photos.findIndex((photo) => photo.principal);
          return photos.map((photo, index) => ({ ...photo, principal: activeIndex >= 0 ? index === activeIndex : index === 0 }));
        }

        return linesToArray(value).map((url, index) => ({
          url,
          alt: "",
          principal: index === Number(principalIndex)
        }));
      }


      function adminTurismoPhotos(trip) {
        return normalizeAdminTurismoPhotos(trip?.fotos || []);
      }

      function adminTurismoCoverPhoto(trip) {
        const photos = adminTurismoPhotos(trip);
        return photos.find((photo) => photo.principal) || photos[0] || null;
      }

      function normalizeAdminTurismoTrip(trip = {}) {
        const destino = String(trip.destino || "").trim();
        const titulo = String(trip.titulo || "").trim();
        const slug = trip.slug || titulo || destino ? adminTurismoSlug(trip.slug || titulo || destino) : "";
        const moneda = adminTurismoCurrencies.includes(trip.moneda) ? trip.moneda : "USD";
        const precioValor = trip.precioValor === "" || trip.precioValor === null || Number.isNaN(Number(trip.precioValor))
          ? null
          : Number(trip.precioValor);
        return {
          id: trip.id || `viaje-${Date.now()}`,
          slug,
          destino,
          titulo,
          duracion: String(trip.duracion || "").trim(),
          temporada: String(trip.temporada || "").trim(),
          fechaSalida: String(trip.fechaSalida || "").trim(),
          fechaRegreso: String(trip.fechaRegreso || "").trim(),
          salidaGarantizada: Boolean(trip.salidaGarantizada),
          precioDesde: String(trip.precioDesde || "").trim(),
          precioValor,
          moneda,
          precioBaseDoble: String(trip.precioBaseDoble || "").trim(),
          suplementoSingle: String(trip.suplementoSingle || "").trim(),
          precioMenor: String(trip.precioMenor || "").trim(),
          condicionVenta: String(trip.condicionVenta || "Precios por persona en base doble. Sujeto a cambios y disponibilidad.").trim(),
          categorias: normalizeAdminTurismoCategories(trip.categorias || trip.categoria),
          descripcionCorta: String(trip.descripcionCorta || "").trim(),
          descripcionLarga: String(trip.descripcionLarga || "").trim(),
          incluye: linesToArray(trip.incluye),
          noIncluye: linesToArray(trip.noIncluye),
          formasPago: linesToArray(trip.formasPago),
          itinerario: Array.isArray(trip.itinerario)
            ? trip.itinerario.map((d) => ({ dia: String(d.dia || "").trim(), titulo: String(d.titulo || "").trim(), descripcion: String(d.descripcion || "").trim() })).filter((d) => d.titulo || d.descripcion)
            : [],
          fotos: normalizeAdminTurismoPhotos(trip.fotos),
          estado: ["activo", "borrador", "revision", "inactivo"].includes(trip.estado) ? trip.estado : "borrador",
          destacado: Boolean(trip.destacado),
          orden: trip.orden === "" || trip.orden === null || Number.isNaN(Number(trip.orden)) ? 999 : Number(trip.orden)
        };
      }

      function uniqueAdminTurismoSlug(baseSlug, currentId) {
        const used = new Set(adminTurismoTrips.filter((trip) => trip.id !== currentId).map((trip) => trip.slug));
        let slug = baseSlug || "viaje-demo";
        let index = 2;
        while (used.has(slug)) {
          slug = `${baseSlug}-${index}`;
          index += 1;
        }
        return slug;
      }

      function adminTurismoPublicationChecklist(trip) {
        const duplicateSlug = adminTurismoTrips.some((item) => item.id !== trip.id && item.slug === trip.slug);
        const validSlug = Boolean(trip.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trip.slug) && !duplicateSlug);
        const hasPrincipalPhoto = trip.fotos.some((photo) => photo.principal);
        return [
          { label: "Destino cargado", ok: Boolean(trip.destino) },
          { label: "Título comercial", ok: Boolean(trip.titulo) },
          { label: "Slug válido", ok: validSlug },
          { label: "Descripción corta", ok: Boolean(trip.descripcionCorta) },
          { label: "Al menos 1 foto", ok: trip.fotos.length >= 1 },
          { label: "Foto principal", ok: hasPrincipalPhoto },
          { label: "Precio cargado", ok: Boolean(trip.precioDesde) },
          { label: "Qué incluye", ok: trip.incluye.length > 0 },
          { label: "Estado activo", ok: trip.estado === "activo" }
        ];
      }


      function adminTurismoReadiness(trip) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        const checklist = adminTurismoPublicationChecklist(normalizedTrip);
        const missing = checklist.filter((item) => !item.ok);
        const publishedMap = loadAdminTurismoPublishedMap();
        const publishedRecord = publishedMap[normalizedTrip.id];
        const isPublished = Boolean(
          publishedRecord &&
          publishedRecord.slug === normalizedTrip.slug &&
          publishedRecord.signature === adminTurismoTripSignature(normalizedTrip)
        );

        if (normalizedTrip.estado === "inactivo") {
          return {
            key: "inactivo",
            label: "Inactivo",
            tone: "neutral",
            canPublish: false,
            isPublished: false,
            missing,
            checklist,
            message: "Este viaje está desactivado y no aparece en Turismo público."
          };
        }

        if (isPublished) {
          return {
            key: "publicado",
            label: "Publicado",
            tone: "success",
            canPublish: true,
            isPublished: true,
            missing,
            checklist,
            message: "Este viaje fue exportado desde el panel. Verificá en Turismo público después de reemplazar el JSON."
          };
        }

        if (missing.length === 0) {
          return {
            key: "listo",
            label: "Listo para publicar",
            tone: "success",
            canPublish: true,
            isPublished: false,
            missing,
            checklist,
            message: "El viaje cumple el checklist. Podés exportarlo para publicar en la web."
          };
        }

        if (normalizedTrip.estado === "borrador") {
          return {
            key: "borrador",
            label: "Borrador",
            tone: "warning",
            canPublish: false,
            isPublished: false,
            missing,
            checklist,
            message: "Está guardado como trabajo interno. Todavía no está listo para publicar."
          };
        }

        return {
          key: "incompleto",
          label: "Incompleto",
          tone: "warning",
          canPublish: false,
          isPublished: false,
          missing,
          checklist,
          message: "No se puede publicar todavía. Completá los puntos faltantes."
        };
      }

      function renderAdminTurismoPublicationState(trip) {
        const readiness = adminTurismoReadiness(trip);
        const nextItems = readiness.missing.slice(0, 3);
        return `
          <div class="admin-turismo-validation ${readiness.canPublish ? "is-ok" : "has-errors"}">
            <div class="admin-turismo-validation-summary">
              <span class="admin-turismo-publication-badge is-${readiness.key}">${escapeHtml(readiness.label)}</span>
              <div>
                <strong>${escapeHtml(readiness.canPublish ? "Listo para probar" : `${readiness.missing.length} faltante${readiness.missing.length === 1 ? "" : "s"}`)}</strong>
                <p>${escapeHtml(readiness.message)}</p>
              </div>
            </div>
            <div class="admin-turismo-checklist" aria-label="Próximo paso">
              <strong>Próximo paso</strong>
              <div>
                ${nextItems.length
                  ? nextItems.map((item) => `<span class="is-pending">${escapeHtml(item.label)}</span>`).join("")
                  : `<span class="is-complete">No falta nada para probar el viaje.</span>`}
              </div>
            </div>
          </div>
        `;
      }


      function renderAdminTurismoPrimaryActions(trip) {
        const readiness = adminTurismoReadiness(trip);
        const esActivo = trip.estado === "activo";
        const fb = adminTurismoSaveFeedback;
        return `
          <section class="admin-turismo-panel admin-turismo-flow-actions">
            <div class="admin-turismo-guardar-banner">
              <div>
                <strong>${esActivo ? "Estado: Activo — visible en la web" : "Estado: " + (trip.estado || "Borrador")}</strong>
                <span>El estado se toma del acordeón Configuración. Guardá para aplicar cambios.</span>
              </div>
              <button type="button" class="admin-turismo-btn-guardar" data-admin-guardar-viaje>
                💾 Guardar viaje
              </button>
            </div>
            ${fb ? `<div class="admin-turismo-save-feedback ${fb.ok ? "is-ok" : "is-error"}">${fb.ok ? "✓" : "⚠️"} ${escapeHtml(fb.message)}</div>` : ""}
          </section>
        `;
      }

      function renderAdminTurismoPreviewActions() {
        return `
          <div class="admin-turismo-action-buttons admin-turismo-action-buttons--preview">
            <button type="button" data-admin-open-card-preview>Ver card</button>
            <button type="button" data-admin-open-detail-preview>Ver detalle</button>
            <button type="button" data-admin-open-whatsapp-preview>Ver WhatsApp</button>
          </div>
        `;
      }

      function adminTurismoPreviewPackage(trip = {}) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        return {
          slug: normalizedTrip.slug,
          destino: normalizedTrip.destino || "Destino",
          duracion: normalizedTrip.duracion || "Duración",
          temporada: normalizedTrip.temporada || "Temporada",
          precioDesde: normalizedTrip.precioDesde || "Consultar",
          categoria: normalizedTrip.categorias[0] || "turismo",
          tipo: normalizedTrip.categorias.join(" · ") || "Turismo",
          resumen: normalizedTrip.descripcionCorta || "Descripción corta del viaje.",
          incluye: normalizedTrip.incluye.slice(0, 3),
          image: adminTurismoCoverPhoto(normalizedTrip)?.url || "",
          gallery: normalizedTrip.fotos.map((photo) => photo.url),
          intenciones: normalizedTrip.categorias
        };
      }

      function adminTurismoWhatsappPreviewText(trip = {}) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        return `Hola, quiero consultar por ${normalizedTrip.titulo || normalizedTrip.destino || "este viaje"} (${normalizedTrip.duracion || "duración a confirmar"}).`;
      }

      function renderAdminTurismoCardModal(trip = {}) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        const previewPackage = adminTurismoPreviewPackage(normalizedTrip);
        return `
          <div class="admin-turismo-modal admin-turismo-modal--compact" data-admin-card-modal aria-hidden="true">
            <div class="admin-turismo-modal-backdrop" data-admin-close-card-preview></div>
            <article class="admin-turismo-modal-card admin-turismo-modal-card--compact" role="dialog" aria-modal="true" aria-label="Preview de card">
              <button type="button" class="admin-turismo-modal-close" data-admin-close-card-preview aria-label="Cerrar card">×</button>
              <div class="admin-turismo-demand-preview">
                <div class="admin-turismo-side-card-head">
                  <div>
                    <p>Vista previa</p>
                    <h3>Card pública</h3>
                  </div>
                  <span>#/turismo/${escapeHtml(normalizedTrip.slug || adminTurismoSlug(normalizedTrip.titulo || normalizedTrip.destino))}</span>
                </div>
                <div class="admin-turismo-real-card-preview">
                  ${renderTurismoPackageCard(previewPackage)}
                </div>
              </div>
            </article>
          </div>
        `;
      }

      function renderAdminTurismoWhatsappModal(trip = {}) {
        const whatsappText = adminTurismoWhatsappPreviewText(trip);
        return `
          <div class="admin-turismo-modal admin-turismo-modal--compact" data-admin-whatsapp-modal aria-hidden="true">
            <div class="admin-turismo-modal-backdrop" data-admin-close-whatsapp-preview></div>
            <article class="admin-turismo-modal-card admin-turismo-modal-card--compact" role="dialog" aria-modal="true" aria-label="Mensaje WhatsApp generado">
              <button type="button" class="admin-turismo-modal-close" data-admin-close-whatsapp-preview aria-label="Cerrar mensaje">×</button>
              <div class="admin-turismo-demand-preview">
                <div class="admin-turismo-side-card-head">
                  <div>
                    <p>Mensaje WhatsApp generado</p>
                    <h3>Texto contextual</h3>
                  </div>
                </div>
                <div class="admin-turismo-whatsapp-copy">${escapeHtml(whatsappText)}</div>
              </div>
            </article>
          </div>
        `;
      }


      function renderAdminTurismoDetailModal(trip = {}) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        const photos = adminTurismoPhotos(normalizedTrip);
        const cover = adminTurismoCoverPhoto(normalizedTrip);
        const title = normalizedTrip.titulo || normalizedTrip.destino || "Título comercial";
        const category = normalizedTrip.categorias.join(" · ") || "Turismo";
        const includes = normalizedTrip.incluye.length ? normalizedTrip.incluye : ["Item demo"];
        const excludes = normalizedTrip.noIncluye.length ? normalizedTrip.noIncluye : ["Item demo"];
        const whatsappText = `Hola, quiero consultar por ${normalizedTrip.titulo || normalizedTrip.destino || "este viaje"} (${normalizedTrip.duracion || "duración a confirmar"}).`;
        return `
          <div class="admin-turismo-modal" data-admin-detail-modal aria-hidden="true">
            <div class="admin-turismo-modal-backdrop" data-admin-close-detail-preview></div>
            <article class="admin-turismo-modal-card" role="dialog" aria-modal="true" aria-label="Detalle completo del viaje">
              <button type="button" class="admin-turismo-modal-close" data-admin-close-detail-preview aria-label="Cerrar detalle">×</button>
              <div class="admin-turismo-modal-hero">
                ${cover ? `<img src="${escapeHtml(cover.url)}" alt="${escapeHtml(cover.alt || normalizedTrip.destino || title)}">` : `<div class="admin-turismo-modal-empty">Foto principal</div>`}
                <div>
                  <p>${escapeHtml(category)} · ${escapeHtml(normalizedTrip.temporada || "Temporada")}</p>
                  <h3>${escapeHtml(title)}</h3>
                  <span>${escapeHtml(normalizedTrip.duracion || "Duración")} · ${escapeHtml(normalizedTrip.precioDesde || "Consultar")}</span>
                </div>
              </div>
              <div class="admin-turismo-modal-body">
                <div class="admin-turismo-modal-gallery">
                  ${photos.slice(0, 6).map((photo) => `<img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt || normalizedTrip.destino || title)}">`).join("")}
                </div>
                <section>
                  <p>${escapeHtml(normalizedTrip.descripcionLarga || "Descripción larga para la página detalle básica.")}</p>
                </section>
                <div class="admin-turismo-modal-columns">
                  <section>
                    <h4>Incluye</h4>
                    <ul>${includes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                  </section>
                  <section>
                    <h4>No incluye</h4>
                    <ul>${excludes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                  </section>
                </div>
                <div class="admin-turismo-modal-cta">
                  <div>
                    <span>Desde</span>
                    <strong>${escapeHtml(normalizedTrip.precioDesde || "Consultar")}</strong>
                  </div>
                  <button type="button">Consultar</button>
                </div>
                <div class="admin-turismo-whatsapp-copy">${escapeHtml(whatsappText)}</div>
              </div>
            </article>
          </div>
        `;
      }

      function renderAdminTurismoSidePanel(trip = {}) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        return `
          <div>
            ${renderAdminTurismoCardModal(normalizedTrip)}
            ${renderAdminTurismoDetailModal(normalizedTrip)}
            ${renderAdminTurismoWhatsappModal(normalizedTrip)}
          </div>
        `;
      }


      function renderAdminTurismoTripRows() {
        if (!adminTurismoTrips.length) {
          return `
            <article class="admin-turismo-row admin-turismo-empty-row">
              <div>
                <strong>Todavía no hay viajes cargados</strong>
                <span>Creá un viaje nuevo para empezar la carga.</span>
              </div>
              <button type="button" class="admin-turismo-primary-button" data-admin-import-public-trips>
                Importar Bariloche y Brasil
              </button>
            </article>
          `;
        }
        return adminTurismoTrips.slice().sort((a, b) => a.orden - b.orden).map((trip) => {
          const normalizedTrip = normalizeAdminTurismoTrip(trip);
          const readiness = adminTurismoReadiness(normalizedTrip);
          const cover = adminTurismoCoverPhoto(normalizedTrip);
          const metadata = [
            normalizedTrip.duracion,
            normalizedTrip.temporada,
            normalizedTrip.precioDesde
          ].filter(Boolean);
          return `
          <article class="admin-turismo-row admin-turismo-trip-card${trip.id === adminTurismoEditingId ? " selected" : ""}">
            <div class="admin-turismo-trip-cover">
              ${cover
                ? `<img src="${escapeHtml(cover.url)}" alt="${escapeHtml(cover.alt || normalizedTrip.destino || normalizedTrip.titulo)}">`
                : `<div class="admin-turismo-trip-cover-placeholder" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z"/></svg>
                  </div>`}
              <span class="admin-turismo-status ${escapeHtml(readiness.key)}">${escapeHtml(readiness.label)}</span>
            </div>
            <div class="admin-turismo-trip-body">
              <div class="admin-turismo-trip-copy">
                <p>${escapeHtml(normalizedTrip.destino || "Destino pendiente")}</p>
                <h3>${escapeHtml(normalizedTrip.titulo || "Sin título comercial")}</h3>
                <span>${escapeHtml(metadata.join(" · ") || "Completá duración, temporada y precio")}</span>
              </div>
              <div class="admin-turismo-row-actions">
                <button type="button" data-admin-edit="${trip.id}">Editar viaje</button>
                <button type="button" data-admin-delete="${trip.id}">Eliminar</button>
              </div>
            </div>
          </article>
        `;
        }).join("");
      }

      function renderAdminTurismoForm(trip = {}) {
        const selectedCategories = normalizeAdminTurismoCategories(trip.categorias || trip.categoria);
        const photos = adminTurismoPhotos(trip);
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        const itinerario = Array.isArray(normalizedTrip.itinerario) ? normalizedTrip.itinerario : [];

        const statusBadge = (isComplete, optional = false) => {
          if (isComplete) return `<span class="admin-turismo-accordion-badge is-complete">Completo</span>`;
          if (optional) return `<span class="admin-turismo-accordion-badge is-optional">Opcional</span>`;
          return `<span class="admin-turismo-accordion-badge is-pending">Falta</span>`;
        };
        const field = (label, control, hint = "", required = false) => `
          <label>
            <span class="admin-field-label">${label}${required ? ` <span class="admin-turismo-required">*</span>` : ""}</span>
            ${control}
            ${hint ? `<small class="admin-field-hint">${hint}</small>` : ""}
          </label>
        `;
        const block = (title, text, content, badge, open = false) => `
          <details class="admin-turismo-form-block admin-turismo-accordion" ${open ? "open" : ""}>
            <summary class="admin-turismo-form-block-head">
              <span>
                <h3>${title}</h3>
                ${text ? `<p>${text}</p>` : ""}
              </span>
              ${badge}
            </summary>
            ${content}
          </details>
        `;

        const basicComplete = Boolean(normalizedTrip.destino && normalizedTrip.titulo && normalizedTrip.descripcionCorta);
        const fechasComplete = Boolean(normalizedTrip.fechaSalida);
        const priceComplete = Boolean(normalizedTrip.precioDesde && normalizedTrip.moneda);
        const photosComplete = normalizedTrip.fotos.length >= 1 && Boolean(adminTurismoCoverPhoto(normalizedTrip));
        const includesComplete = Boolean(normalizedTrip.incluye.length);
        const itinerarioComplete = itinerario.length > 0;

        return `
          <form class="admin-turismo-form" id="admin-turismo-form" data-admin-turismo-form>
            <section class="admin-turismo-quick-status" aria-labelledby="admin-turismo-status-title">
              <div class="admin-turismo-quick-status-head">
                <span>
                  <span class="admin-turismo-eyebrow">Disponibilidad</span>
                  <h3 id="admin-turismo-status-title">Estado del viaje</h3>
                  <p>Definí rápidamente si el viaje se muestra en la web.</p>
                </span>
                <small>El cambio se aplica al guardar.</small>
              </div>
              <div class="admin-turismo-status-options">
                ${[
                  ["borrador", "Borrador", "Solo interno"],
                  ["revision", "En revisión", "Pendiente de validar"],
                  ["activo", "Activo", "Visible en la web"],
                  ["inactivo", "Inactivo", "Oculto temporalmente"]
                ].map(([value, label, description]) => `
                  <label class="admin-turismo-status-option admin-turismo-status-option--${value}">
                    <input name="estado" type="radio" value="${value}" ${(trip.estado || "borrador") === value ? "checked" : ""}>
                    <span class="admin-turismo-status-indicator" aria-hidden="true"></span>
                    <span class="admin-turismo-status-copy">
                      <strong>${label}</strong>
                      <small>${description}</small>
                    </span>
                  </label>
                `).join("")}
              </div>
            </section>

            ${block("Información básica", "Destino, título y descripción para el catálogo.", `
              <div class="admin-turismo-form-grid">
                ${field("Destino", `<input name="destino" value="${escapeHtml(trip.destino || "")}" placeholder="Ej: Cancún">`, "", true)}
                ${field("Título comercial", `<input name="titulo" value="${escapeHtml(trip.titulo || "")}" placeholder="Ej: Año Nuevo en Cancún">`, "", true)}
                ${field("Temporada", `<input name="temporada" value="${escapeHtml(trip.temporada || "")}" placeholder="Ej: Verano 2026">`, "")}
                ${field("Duración", `<input name="duracion" value="${escapeHtml(trip.duracion || "")}" placeholder="Ej: 7 noches / 8 días">`, "")}
                ${field("Resumen corto", `<textarea name="descripcionCorta" rows="3" placeholder="Texto que aparece en la card del catálogo">${escapeHtml(trip.descripcionCorta || "")}</textarea>`, "Máximo 2 líneas. Es lo primero que lee el cliente.", true)}
                ${field("Descripción larga", `<textarea name="descripcionLarga" rows="5" placeholder="Descripción completa para la página de detalle">${escapeHtml(trip.descripcionLarga || "")}</textarea>`, "Opcional si el resumen alcanza.")}
              </div>
            `, statusBadge(basicComplete), true)}

            ${block("Fechas de salida", "Cuándo sale y cuándo vuelve.", `
              <div class="admin-turismo-form-grid admin-turismo-form-grid--compact">
                ${field("Fecha de salida", `<input name="fechaSalida" value="${escapeHtml(trip.fechaSalida || "")}" placeholder="Ej: 28 de diciembre de 2026">`, "Texto libre: podés escribir '28 dic 2026' o 'Diciembre 2026'.", true)}
                ${field("Fecha de regreso", `<input name="fechaRegreso" value="${escapeHtml(trip.fechaRegreso || "")}" placeholder="Ej: 4 de enero de 2027">`, "")}
              </div>
              <label class="admin-turismo-check admin-turismo-check--featured">
                <input name="salidaGarantizada" type="checkbox" ${trip.salidaGarantizada ? "checked" : ""}>
                <span class="admin-turismo-selection-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="m9.2 16.4-4.1-4.1 1.5-1.5 2.6 2.6 8.2-8.2 1.5 1.5-9.7 9.7Z"/></svg>
                </span>
                <span class="admin-turismo-selection-copy">
                  <strong>Salida garantizada</strong>
                  <small>Muestra el badge "Salida garantizada" en el flyer y la card.</small>
                </span>
              </label>
            `, statusBadge(fechasComplete))}

            ${block("Precio", "Valor visible para el cliente y condición de venta.", `
              <div class="admin-turismo-form-grid admin-turismo-form-grid--compact">
                ${field("Precio visible", `<input name="precioDesde" value="${escapeHtml(trip.precioDesde || "")}" placeholder="Ej: USD 1.436">`, "Texto exacto que ve el cliente en la card.", true)}
                ${field("Moneda", `
                  <select name="moneda">
                    ${adminTurismoCurrencies.map((c) => `<option value="${c}" ${(trip.moneda || "USD") === c ? "selected" : ""}>${c}</option>`).join("")}
                  </select>
                `)}
                ${field("Precio base doble (número)", `<input name="precioBaseDoble" value="${escapeHtml(trip.precioBaseDoble || "")}" placeholder="Ej: 1436">`, "Por persona en habitación doble.")}
                ${field("Suplemento single", `<input name="suplementoSingle" value="${escapeHtml(trip.suplementoSingle || "")}" placeholder="Ej: 320">`, "Diferencia para habitación individual.")}
                ${field("Precio menor", `<input name="precioMenor" value="${escapeHtml(trip.precioMenor || "")}" placeholder="Ej: 980">`, "Opcional.")}
              </div>
              ${field("Condición de venta", `<textarea name="condicionVenta" rows="2">${escapeHtml(trip.condicionVenta || "Precios por persona en base doble. Sujeto a cambios y disponibilidad.")}</textarea>`, "Aparece al pie del detalle del paquete.")}
            `, statusBadge(priceComplete))}

            ${block("Fotos", "URLs de las imágenes del paquete.", `
              <div class="admin-turismo-fotos-list" data-admin-turismo-fotos-list>
                ${photos.length ? photos.map((photo, index) => `
                  <div class="admin-turismo-foto-row">
                    <div class="admin-turismo-foto-preview">
                      <img src="${escapeHtml(photo.url)}" alt="Foto ${index + 1}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                      <div class="admin-turismo-foto-error" style="display:none">URL inválida</div>
                    </div>
                    <div class="admin-turismo-foto-fields">
                      <input class="admin-turismo-foto-url" name="foto_url_${index}" value="${escapeHtml(photo.url)}" placeholder="https://... URL de la imagen" data-foto-index="${index}">
                      <input name="foto_alt_${index}" value="${escapeHtml(photo.alt || "")}" placeholder="Descripción de la foto (opcional)">
                      <label class="admin-turismo-foto-principal">
                        <input type="radio" name="fotoPrincipal" value="${index}" ${photo.principal ? "checked" : ""}>
                        <span class="admin-turismo-selection-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><path d="m9.2 16.4-4.1-4.1 1.5-1.5 2.6 2.6 8.2-8.2 1.5 1.5-9.7 9.7Z"/></svg>
                        </span>
                        <span class="admin-turismo-selection-copy">
                          <strong>Foto principal</strong>
                          <small>Usar como portada del viaje</small>
                        </span>
                      </label>
                    </div>
                    <button type="button" class="admin-turismo-foto-remove" data-remove-foto="${index}" aria-label="Quitar foto">×</button>
                  </div>
                `).join("") : ""}
                <div class="admin-turismo-foto-row admin-turismo-foto-row--new">
                  <div class="admin-turismo-foto-preview admin-turismo-foto-preview--empty" id="new-foto-preview">
                    <span>Preview</span>
                  </div>
                  <div class="admin-turismo-foto-fields">
                    <input class="admin-turismo-foto-url" id="new-foto-url" placeholder="Pegá la URL de la imagen aquí" data-nueva-foto>
                    <input id="new-foto-alt" placeholder="Descripción (opcional)">
                  </div>
                  <button type="button" class="admin-turismo-primary-button" data-add-foto>+ Agregar foto</button>
                </div>
              </div>
              <p class="admin-field-hint">La foto marcada como "Principal" aparece de portada en la card y el detalle.</p>
              <input type="hidden" name="fotos_count" value="${photos.length}">
            `, statusBadge(photosComplete))}

            ${block("Incluye / No incluye", "Qué cubre el paquete y qué no.", `
              <div class="admin-turismo-form-grid">
                ${field("Qué incluye", `<textarea name="incluye" rows="7" placeholder="Aéreos desde Asunción con LATAM&#10;Todo incluido&#10;7 noches de alojamiento&#10;Equipaje 12kg + 1 artículo personal&#10;Asistencia al viajero&#10;Traslados de llegada y salida">${escapeHtml(arrayToLines(trip.incluye))}</textarea>`, "Un ítem por línea.", true)}
                ${field("Qué no incluye", `<textarea name="noIncluye" rows="5" placeholder="Gastos personales&#10;Excursiones opcionales&#10;Seguro de viaje">${escapeHtml(arrayToLines(trip.noIncluye))}</textarea>`, "Un ítem por línea.")}
              </div>
              ${field("Formas de pago", `<textarea name="formasPago" rows="4" placeholder="50% de señal al reservar&#10;50% restante 30 días antes de la salida&#10;Cuotas con tarjeta (consultar)">${escapeHtml(arrayToLines(trip.formasPago))}</textarea>`, "Un ítem por línea. Aparece en la página de detalle.")}
            `, statusBadge(includesComplete))}

            ${block("Itinerario", "Programa día por día del viaje.", `
              <div class="admin-turismo-itinerario-list" data-admin-turismo-itinerario>
                ${itinerario.map((dia, index) => `
                  <div class="admin-turismo-itinerario-row" data-itinerario-row="${index}">
                    <div class="admin-turismo-itinerario-num">${index + 1}</div>
                    <div class="admin-turismo-itinerario-fields">
                      <input name="itinerario_titulo_${index}" value="${escapeHtml(dia.titulo)}" placeholder="Ej: Llegada y check in">
                      <textarea name="itinerario_desc_${index}" rows="2" placeholder="Descripción de actividades del día">${escapeHtml(dia.descripcion)}</textarea>
                    </div>
                    <button type="button" class="admin-turismo-foto-remove" data-remove-dia="${index}" aria-label="Quitar día">×</button>
                  </div>
                `).join("")}
                <button type="button" class="admin-turismo-secondary-button" data-add-dia>+ Agregar día</button>
              </div>
            `, statusBadge(itinerarioComplete, true))}

            ${block("Catálogo", "URL, orden, categorías y prioridad comercial.", `
              <div class="admin-turismo-form-grid admin-turismo-form-grid--compact">
                ${field("URL interna", `<input name="slug" value="${escapeHtml(trip.slug || adminTurismoSlug(trip.titulo || trip.destino))}" placeholder="cancun-ano-nuevo-2026">`, "Sin espacios ni acentos. Se genera automático.")}
                ${field("Orden en catálogo", `<input name="orden" type="number" min="1" step="1" value="${escapeHtml(String(trip.orden ?? 999))}">`, "Menor número = aparece antes.")}
              </div>
              <fieldset class="admin-turismo-category-field">
                <legend>Categorías</legend>
                <div class="admin-turismo-category-grid">
                  ${adminTurismoCategories.map(([value, label]) => `
                    <label class="admin-turismo-category-option">
                      <input name="categorias" type="checkbox" value="${value}" ${selectedCategories.includes(value) ? "checked" : ""}>
                      <span class="admin-turismo-selection-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="m9.2 16.4-4.1-4.1 1.5-1.5 2.6 2.6 8.2-8.2 1.5 1.5-9.7 9.7Z"/></svg>
                      </span>
                      <span class="admin-turismo-category-label">${label}</span>
                    </label>
                  `).join("")}
                </div>
              </fieldset>
              <label class="admin-turismo-check admin-turismo-check--featured">
                <input name="destacado" type="checkbox" ${trip.destacado ? "checked" : ""}>
                <span class="admin-turismo-selection-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="m9.2 16.4-4.1-4.1 1.5-1.5 2.6 2.6 8.2-8.2 1.5 1.5-9.7 9.7Z"/></svg>
                </span>
                <span class="admin-turismo-selection-copy">
                  <strong>Destacado</strong>
                  <small>Prioriza este viaje en el catálogo.</small>
                </span>
              </label>
            `, statusBadge(Boolean(normalizedTrip.slug && normalizedTrip.estado)), true)}

          </form>
        `;
      }



      const adminModules = [
        {
          id: "home",
          label: "Resumen",
          path: "/admin",
          icon: "space_dashboard"
        },
        {
          id: "fichas",
          label: "Inscripciones",
          path: "/admin/fichas",
          icon: "assignment"
        },
        {
          id: "grupos",
          label: "Grupos y contratos",
          path: "/admin/grupos",
          icon: "groups"
        },
        {
          id: "pasajeros",
          label: "Pasajeros",
          path: "/admin/pasajeros",
          icon: "person"
        },
        {
          id: "pagos",
          label: "Pagos",
          path: "/admin/pagos",
          icon: "payments"
        },
        {
          id: "turismo",
          label: "Turismo web",
          path: "/admin/turismo",
          icon: "flight"
        },
        {
          id: "configuracion",
          label: "Configuración",
          path: "/admin/configuracion",
          icon: "settings",
          adminOnly: true
        }
      ];

      function adminIconSvg(name, extraClass = "") {
        const paths = {
          space_dashboard: '<path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h8v8H3v-8Zm10-3h8v11h-8V10Z"/>',
          assignment: '<path d="M9 5V3h6v2h3a2 2 0 0 1 2 2v14H4V7a2 2 0 0 1 2-2h3Zm2 0h2V4h-2v1Zm-3 5h8V8H8v2Zm0 4h8v-2H8v2Zm0 4h6v-2H8v2Z"/>',
          groups: '<path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21v-3c0-3 2.7-5 6-5s6 2 6 5v3H2Zm13.5 0v-3c0-1.4-.5-2.7-1.4-3.8.6-.2 1.2-.2 1.9-.2 3.3 0 6 1.8 6 4.5V21h-6.5Z"/>',
          person: '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-9 9v-2c0-3.3 4-5 9-5s9 1.7 9 5v2H3Z"/>',
          payments: '<path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 10h2V9H6v1Zm10 5h2v-1h-2v1Z"/>',
          flight: '<path d="m2 16 8-3V4.5a2 2 0 1 1 4 0V13l8 3v2l-8-1v3l2 1.5V23l-4-1-4 1v-1.5l2-1.5v-3l-8 1v-2Z"/>',
          settings: '<path d="m19.4 13 .1-1-.1-1 2.1-1.6-2-3.4-2.6 1a8 8 0 0 0-1.7-1L15 3h-4l-.4 3a8 8 0 0 0-1.7 1L6.3 6 4.3 9.4 6.4 11l-.1 1 .1 1-2.1 1.6 2 3.4 2.6-1a8 8 0 0 0 1.7 1l.4 3h4l.4-3a8 8 0 0 0 1.7-1l2.6 1 2-3.4-2.3-1.6ZM13 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/>',
          account_circle: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 13a8 8 0 0 1-6.3-3.1C7.1 15.7 9.3 15 12 15s4.9.7 6.3 1.9A8 8 0 0 1 12 20Z"/>'
        };
        const path = paths[name] || paths.space_dashboard;
        return `<svg class="admin-inline-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
      }


      function adminVisibleModules() {
        const role = String(adminSession?.role || "admin").toLowerCase();
        return adminModules.filter((module) => !module.adminOnly || role === "admin");
      }

      function adminCanAccessPath(path) {
        if (path !== "/admin/configuracion") return true;
        return String(adminSession?.role || "").toLowerCase() === "admin";
      }

      let adminSession = null;
      let adminSessionChecked = false;

      async function fetchAdminSession(force = false) {
        if (adminSessionChecked && !force) return adminSession;
        try {
          const response = await fetch("/api/admin/me", {
            credentials: "same-origin",
            cache: "no-store"
          });
          const payload = await response.json();
          adminSession = payload.authenticated ? payload : null;
        } catch (error) {
          adminSession = null;
        }
        adminSessionChecked = true;
        return adminSession;
      }

      function renderAdminLogin(errorMessage = "") {
        document.body?.setAttribute("data-app-entry", "admin");
        document.getElementById("app").innerHTML = `
          <div class="admin-login-screen">
            <section class="admin-login-card" aria-label="Acceso interno El Ángel Azul">
              <div class="admin-login-panel">
                <span class="admin-login-orb admin-login-orb-one" aria-hidden="true"></span>
                <span class="admin-login-orb admin-login-orb-two" aria-hidden="true"></span>
                <div class="admin-login-panel-top">
                  <a class="admin-login-logo-link" href="#/" aria-label="El Ángel Azul - Inicio">
                    <img src="assets/img/favicon-esfera-blanca.svg" alt="">
                    <span>
                      <strong>El Ángel Azul</strong>
                      <small>Panel interno</small>
                    </span>
                  </a>
                </div>
                <div class="admin-login-brand">
                  <h1>Gestión completa de tus viajes</h1>
                  <p>Operá inscripciones, pasajeros, pagos y turismo desde un panel privado.</p>
                </div>
                <div class="admin-login-highlights" aria-label="Módulos disponibles">
                  <span><strong>✎</strong> Inscripciones</span>
                  <span><strong>P</strong> Pasajeros</span>
                  <span><strong>$</strong> Pagos</span>
                  <span><strong>✈</strong> Turismo</span>
                </div>
                <p class="admin-login-footer">© El Ángel Azul · Acceso restringido</p>
              </div>

              <div class="admin-login-access">
                <div class="admin-login-access-head">
                  <span><i aria-hidden="true"></i>Ingreso seguro</span>
                  <h2>Bienvenido de nuevo</h2>
                  <p>Ingresá con tus credenciales para acceder al panel.</p>
                </div>
                <form class="admin-login-form" data-admin-login-form>
                  <label>
                    Usuario
                    <input name="usuario" autocomplete="username" placeholder="admin" required>
                  </label>
                  <label>
                    Contraseña
                    <span class="admin-login-password">
                      <input name="password" type="password" autocomplete="current-password" placeholder="Contraseña" required>
                      <button type="button" data-admin-password-toggle aria-label="Mostrar contraseña" aria-pressed="false">Ver</button>
                    </span>
                  </label>
                  ${errorMessage ? `<p class="admin-login-error">${escapeHtml(errorMessage)}</p>` : ""}
                  <button type="submit">Ingresar al panel</button>
                </form>
                <div class="admin-login-note">
                  <span>Sesión protegida de 8 horas. Se cierra automáticamente por seguridad.</span>
                </div>
              </div>
            </section>
          </div>
        `;

        document.querySelector("[data-admin-password-toggle]")?.addEventListener("click", (event) => {
          const toggle = event.currentTarget;
          const input = toggle.closest(".admin-login-password")?.querySelector("input");
          if (!input) return;
          const shouldShow = input.type === "password";
          input.type = shouldShow ? "text" : "password";
          toggle.setAttribute("aria-pressed", shouldShow ? "true" : "false");
          toggle.setAttribute("aria-label", shouldShow ? "Ocultar contraseña" : "Mostrar contraseña");
          toggle.textContent = shouldShow ? "Ocultar" : "Ver";
        });

        document.querySelector("[data-admin-login-form]")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(event.currentTarget);
          const user = String(formData.get("usuario") || "").trim().toLowerCase();
          const password = String(formData.get("password") || "").trim();
          if (!user || !password) {
            renderAdminLogin("Completá usuario y contraseña para ingresar.");
            return;
          }
          const button = form.querySelector("button");
          if (button) {
            button.disabled = true;
            button.textContent = "Ingresando...";
          }
          try {
            const response = await fetch("/api/admin/login", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: user, password })
            });
            const payload = await response.json();
            if (!response.ok || !payload.authenticated) {
              renderAdminLogin(payload.error || "Usuario o contraseña incorrectos.");
              return;
            }
            adminSession = payload;
            adminSessionChecked = true;
            render();
            return;
          } catch (error) {
            renderAdminLogin("No se pudo iniciar sesión. Intentá nuevamente.");
          }
        });
      }

      function renderAdminShell(moduleId, contentHtml) {
        return `
          <div class="layout admin-layout">
            <section class="admin-shell-header">
              <a class="admin-shell-brand" href="${adminRouteHref("/admin")}">
                <img src="assets/img/favicon-esfera-blanca.svg" alt="">
                <span>
                  <strong>El Ángel Azul</strong>
                  <small>Panel interno</small>
                </span>
              </a>
              <div class="admin-shell-session">
                ${adminIconSvg("account_circle", "admin-session-icon")}
                <strong>${escapeHtml(adminSession?.label || adminSession?.user || "Admin")}</strong>
                <button type="button" data-admin-logout>Cerrar sesión</button>
              </div>
            </section>

            <div class="admin-shell">
              <aside class="admin-sidebar" aria-label="Navegación interna">
                <nav>
                  ${adminVisibleModules().map((module) => `
                    <a class="${module.id === moduleId ? "active" : ""}" href="${adminRouteHref(module.path)}">
                      ${adminIconSvg(module.icon, "admin-nav-icon")}
                      <span>${module.label}</span>
                    </a>
                  `).join("")}
                </nav>
              </aside>
              <main class="admin-main">
                ${contentHtml}
              </main>
            </div>
          </div>
        `;
      }

      function bindAdminShell() {
        document.querySelector("[data-admin-logout]")?.addEventListener("click", async () => {
          try {
            await fetch("/api/admin/logout", {
              method: "POST",
              credentials: "same-origin"
            });
          } catch (error) {
            // Si falla el logout remoto, se limpia igual la sesión visual.
          }
          adminSession = null;
          adminSessionChecked = true;
          renderAdminLogin();
        });
      }


      function renderAdminHome() {
        const fichas = loadFichasAdhesionDemo();
        const passengerRows = adminPasajerosRows();
        const paymentRows = passengerRows.map(({ passenger }) => passengerPaymentData(passenger));
        const fichasNuevas = fichas.filter((ficha) => (ficha.estadoRevision || "pendiente") === "pendiente").length;
        const pasajerosActivos = passengerRows.filter(({ passenger }) => String(passenger.estado || "").toLowerCase().includes("activo")).length;
        const pagosPendientes = paymentRows.filter((payment) => payment.estadoPago !== "Al día").length;
        const gruposActivos = adminPasajerosDemo.filter((group) => {
          const estado = String(group.estado || "Activo").toLowerCase();
          return estado.includes("activo") && !estado.includes("inactivo");
        }).length;
        document.getElementById("app").innerHTML = renderAdminShell("home", `
          <section class="admin-turismo-panel admin-overview admin-dashboard-home">
            <div class="admin-dashboard-head">
              <div>
                <p>Vista general</p>
                <h1>Tablero operativo</h1>
                <span>Entrada rápida para revisar inscripciones, pasajeros, pagos y grupos activos.</span>
              </div>
              <a class="admin-secondary-action" href="${adminRouteHref("/admin/fichas")}">Revisar inscripciones</a>
            </div>
            <div class="admin-dashboard-grid">
              <a class="admin-dashboard-card is-attention" href="${adminRouteHref("/admin/fichas")}">
                <span>Fichas nuevas pendientes</span>
                <strong>${fichasNuevas}</strong>
                <small>Inscripciones por revisar</small>
              </a>
              <a class="admin-dashboard-card" href="${adminRouteHref("/admin/pasajeros")}">
                <span>Pasajeros activos</span>
                <strong>${pasajerosActivos}</strong>
                <small>Personas cargadas como activas</small>
              </a>
              <a class="admin-dashboard-card is-warning" href="${adminRouteHref("/admin/pagos")}">
                <span>Pagos pendientes</span>
                <strong>${pagosPendientes}</strong>
                <small>Pasajeros no marcados al día</small>
              </a>
              <a class="admin-dashboard-card" href="${adminRouteHref("/admin/grupos")}">
                <span>Grupos activos</span>
                <strong>${gruposActivos}</strong>
                <small>Colegios/cursos operativos</small>
              </a>
            </div>
          </section>
        `);
        bindAdminShell();
      }

      function triggerBlobDownload(fileName, blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      function downloadTextFile(fileName, content, type = "text/csv;charset=utf-8") {
        triggerBlobDownload(fileName, new Blob([content], { type }));
      }

      // Excel, al abrir un CSV con doble clic (a diferencia de "Datos >
      // Desde texto/CSV"), en la práctica ignora el BOM y decodifica con
      // la codificación de Windows del sistema - Windows-1252 en una
      // instalación en español. UTF-8 (con o sin BOM) rompe los acentos
      // en ese flujo - confirmado probando ambas variantes. Codificar
      // directo en Windows-1252 evita el problema en la raíz: comparte el
      // mismo valor de byte que el código de punto Unicode en todo el
      // rango 0x00-0xFF, que cubre á, é, í, ó, ú, ñ, ¿, ¡. Un carácter
      // fuera de ese rango (muy improbable en nombres de colegios/viajes)
      // cae a "?" en vez de romper el archivo entero.
      function encodeWindows1252(text) {
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
          const code = text.charCodeAt(i);
          bytes[i] = code <= 0xff ? code : 0x3f;
        }
        return bytes;
      }

      function downloadCsvFile(fileName, csvText) {
        triggerBlobDownload(fileName, new Blob([encodeWindows1252(csvText)], { type: "text/csv;charset=windows-1252" }));
      }

      function sheetMigrationStamp() {
        return new Date().toISOString().slice(0, 10);
      }

      function sheetMigrationSlug(value) {
        return String(value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "sin-dato";
      }

      function adminColegioId(group = {}) {
        return `colegio-${sheetMigrationSlug(group.colegio || "sin-colegio")}`;
      }

      function adminContratoId(group = {}) {
        return `contrato-${group.id || sheetMigrationSlug(`${group.colegio}-${group.viaje}-${group.curso}-${group.division}`)}`;
      }

      function adminContratoCodigo(group = {}) {
        const nivel = sheetMigrationSlug(group.nivel || "nivel").slice(0, 3).toUpperCase();
        const colegio = sheetMigrationSlug(group.colegio || "colegio").slice(0, 14).toUpperCase();
        const cursoDivision = sheetMigrationSlug(`${group.curso || ""}-${group.division || ""}`).toUpperCase();
        const viaje = sheetMigrationSlug(group.viaje || "viaje").toUpperCase();
        return `CON-${nivel}-${colegio}-${cursoDivision}-${viaje}`.replace(/-+/g, "-");
      }

      function adminContratoFromGroup(group = {}, now = "") {
        return {
          id: adminContratoId(group),
          codigo_contrato: adminContratoCodigo(group),
          colegio_id: adminColegioId(group),
          colegio_nombre: group.colegio || "",
          grupo_id: group.id || "",
          nivel: group.nivel || "",
          viaje: group.viaje || "",
          curso: group.curso || "",
          division: group.division || "",
          estado: "Activo",
          fecha_creacion: now ? now.slice(0, 10) : "",
          observaciones: "Contrato base generado para preparar la estructura. Editar/validar desde el panel de Contratos.",
          created_at: now,
          updated_at: now
        };
      }

      // Corrección (25/07): esto era todo o nada - con 0 contratos reales
      // mostraba 101 contratos "base" generados; apenas se guardaba UNO real,
      // los otros 100 desaparecían de la lista (adminContratosDemo.length ya
      // no era 0). Ahora arma un placeholder solo para los grupos que
      // TODAVÍA no tienen contrato real, y lo mezcla con los reales - la
      // lista siempre tiene un renglón por grupo, sea real o para crear.
      function adminContratosRows(now = new Date().toISOString()) {
        const gruposConContrato = new Set(adminContratosDemo.map((c) => c.grupo_id || c.grupoId));
        const placeholders = adminPasajerosDemo
          .filter((group) => !gruposConContrato.has(group.id))
          .map((group) => adminContratoFromGroup(group, now));
        return [...adminContratosDemo, ...placeholders];
      }

      function adminContratoOptionsForGroup(groupId) {
        // Los contratos "base" existen únicamente como borradores editables
        // dentro de la pantalla Contratos. Pasajeros solo puede asociarse a
        // filas que ya fueron persistidas realmente en PostgreSQL.
        return adminContratosDemo.filter(
          (contract) => contract.grupo_id === groupId || contract.grupoId === groupId
        );
      }

      function passengerContratoId(passenger = {}) {
        return passenger.contratoId || passenger.contrato_id || "";
      }

      function passengerCodigoContrato(passenger = {}) {
        return passenger.codigoContrato || passenger.codigo_contrato || passenger.contratoCodigo || "";
      }

      function contractById(contractId, groupId = "") {
        return adminContratoOptionsForGroup(groupId).find((contract) => contract.id === contractId) ||
          adminContratosDemo.find((contract) => contract.id === contractId) ||
          null;
      }

      function sheetTabColumns(tabId) {
        const persistence = window.ElAngelAzulPersistence.architecture();
        return persistence.sheet.requiredTabs.find((tab) => tab.id === tabId)?.columns || [];
      }

      function buildGoogleSheetMigrationRows() {
        const now = new Date().toISOString();
        const passengerRows = adminPasajerosRows();
        const groupRows = adminPasajerosDemo.map((group) => ({
          id: group.id,
          nivel: group.nivel,
          viaje: group.viaje,
          colegio: group.colegio,
          curso: group.curso,
          division: group.division,
          pasajeros_esperados: group.pasajerosEsperados || "",
          estado: "Activo",
          created_at: now,
          updated_at: now
        }));
        const contractRows = adminContratosRows(now);
        const passengers = googleSheetsPassengerRows(now, passengerRows);
        const fichas = googleSheetsFichaRows(now);
        const pagos = [];
        const cuotas = [];
        passengerRows.forEach(({ passenger }) => {
          const passengerId = `pasajero-${passenger.dni || sheetMigrationSlug(passenger.nombre || "sin-dni")}`;
          window.ElAngelAzulPayments.paymentHistory(passenger).forEach((payment, index) => {
            if (!payment.amount) return;
            pagos.push({
              id: `pago-${passenger.dni || "sin-dni"}-${index + 1}`,
              pasajero_id: passengerId,
              pasajero_dni: passenger.dni || "",
              contrato_codigo: passenger.contratoCodigo || "",
              fecha: payment.date || "",
              monto: payment.amount || "",
              medio: payment.method || "",
              estado: payment.status || "",
              cuota_id: payment.concept?.startsWith("Cuota") ? `cuota-${passenger.dni || "sin-dni"}-${payment.concept.replace(/\D/g, "")}` : "",
              comprobante_url: "",
              observaciones: payment.concept || "",
              created_at: now
            });
          });
          passengerInstallments(passenger).forEach((installment) => {
            cuotas.push({
              id: `cuota-${passenger.dni || "sin-dni"}-${installment.number}`,
              pasajero_id: passengerId,
              pasajero_dni: passenger.dni || "",
              contrato_codigo: passenger.contratoCodigo || "",
              numero: installment.number,
              nombre: `Cuota ${installment.number}`,
              monto: installment.amount,
              vencimiento: passenger.proximaCuota || "",
              estado: installment.status,
              created_at: now,
              updated_at: now
            });
          });
        });

        return {
          GRUPOS: groupRows,
          CONTRATOS: contractRows,
          PASAJEROS: passengers,
          FICHAS_ADHESION: fichas,
          PAGOS: pagos,
          CUOTAS: cuotas,
          CONFIG: [
            { clave: "sheet_id", valor: window.ElAngelAzulPersistence.googleSheet.id, descripcion: "Google Sheets principal DATOS / EAA", updated_at: now },
            { clave: "provider_activo", valor: "localStorage", descripcion: "Temporal hasta activar Apps Script/API", updated_at: now },
            { clave: "migracion_estado", valor: "preparada", descripcion: "Estructura y exportador listos", updated_at: now }
          ]
        };
      }

      function googleSheetsPassengerRows(now = new Date().toISOString(), rows = adminPasajerosRows()) {
        return rows.map(({ group, passenger }) => ({
          id: `pasajero-${passenger.dni || sheetMigrationSlug(passenger.nombre || "sin-dni")}`,
          grupo_id: group.id,
          contrato_id: passenger.contratoId || passenger.contrato_id || "",
          codigo_contrato: passenger.codigoContrato || passenger.codigo_contrato || passenger.contratoCodigo || "",
          nombre: passenger.nombre || "",
          apellido: passenger.apellido || "",
          responsable_apellido: passenger.responsableApellido || "",
          responsable_email: passenger.responsableEmail || "",
          plan_pago_id: passenger.planPagoId || "",
          dni: passenger.dni || "",
          nacimiento: passenger.nacimiento || "",
          telefono: passenger.telefono || "",
          responsable_nombre: passenger.responsable || "",
          responsable_dni: passenger.responsableDni || "",
          responsable_telefono: passenger.responsableTelefono || "",
          vinculo: passenger.vinculo || "",
          responsable_cuil_cuit: passenger.responsableCuilCuit || "",
          estado: passenger.estado || "Activo",
          documentacion_estado: passenger.documentacion || "Pendiente",
          ficha_medica_estado: passenger.fichaMedica || "Pendiente",
          pago_estado: passenger.pago || "Pendiente",
          observaciones: passenger.observaciones || "",
          created_at: now,
          updated_at: now
        }));
      }

      // Corrección (25/07): esto usaba adminContratosRows(), que desde el
      // fix de arriba también incluye los placeholders "borrador" de los
      // grupos sin contrato real todavía (necesarios para mostrar/editar
      // en pantalla). Pero PARA GUARDAR hay que mandar solo lo que
      // realmente es un contrato - si no, guardar UN contrato de verdad
      // manda de arrastre TODOS los placeholders del resto de los grupos y
      // los persiste como si fueran reales (confirmado: pasó en vivo,
      // convirtió 0 contratos reales en 101 de golpe). adminContratosDemo
      // es la fuente real, sin placeholders.
      function googleSheetsContratoRows(now = new Date().toISOString()) {
        return adminContratosDemo.map((contract) => ({
          id: contract.id || "",
          codigo_contrato: contract.codigo_contrato || contract.codigoContrato || "",
          colegio_id: contract.colegio_id || contract.colegioId || "",
          colegio_nombre: contract.colegio_nombre || contract.colegioNombre || "",
          grupo_id: contract.grupo_id || contract.grupoId || "",
          nivel: contract.nivel || "",
          viaje: contract.viaje || "",
          curso: contract.curso || "",
          division: contract.division || "",
          estado: contract.estado || "Borrador",
          fecha_creacion: contract.fecha_creacion || contract.fechaCreacion || now.slice(0, 10),
          observaciones: contract.observaciones || "",
          created_at: contract.created_at || contract.createdAt || now,
          updated_at: contract.updated_at || contract.updatedAt || now
        }));
      }

      function googleSheetsGroupRows(now = new Date().toISOString()) {
        return adminPasajerosDemo.map((group) => ({
          id: group.id || "",
          nivel: group.nivel || "",
          viaje: group.viaje || "",
          colegio: group.colegio || "",
          colegio_id: group.colegioId || "",
          curso: group.curso || "",
          division: group.division || "",
          pasajeros_esperados: group.pasajerosEsperados || "",
          estado: group.estado || "Activo",
          created_at: group.created_at || group.createdAt || now,
          updated_at: group.updated_at || group.updatedAt || now
        }));
      }

      function googleSheetsFichaRows(now = new Date().toISOString()) {
        return loadFichasAdhesionDemo().map((ficha) => ({
          id: ficha.id || "",
          tipo: "pax",
          pasajero_dni: ficha.pasajeroNumeroDocumento || ficha.pasajeroDni || "",
          pasajero_nombre: ficha.pasajeroNombre || "",
          pasajero_apellido: ficha.pasajeroApellido || "",
          pasajero_tipo_documento: ficha.pasajeroTipoDocumento || "DNI",
          pasajero_nacimiento: ficha.pasajeroNacimiento || "",
          pasajero_sexo: ficha.pasajeroSexo || "",
          responsable_nombre: ficha.responsableNombre || "",
          responsable_apellido: ficha.responsableApellido || "",
          responsable_tipo_documento: ficha.responsableTipoDocumento || "DNI",
          responsable_numero_documento: ficha.responsableNumeroDocumento || "",
          responsable_nacimiento: ficha.responsableNacimiento || "",
          responsable_parentesco: ficha.responsableParentesco || "",
          responsable_email: ficha.responsableEmail || "",
          responsable_telefono: ficha.responsableTelefono || "",
          responsable_celular: ficha.responsableCelular || "",
          responsable_cuil_cuit: ficha.responsableCuilCuit || "",
          domicilio_calle: ficha.domicilioCalle || "",
          domicilio_numero: ficha.domicilioNumero || "",
          domicilio_piso: ficha.domicilioPiso || "",
          domicilio_departamento: ficha.domicilioDepartamento || "",
          domicilio_barrio: ficha.domicilioBarrio || "",
          domicilio_localidad: ficha.domicilioLocalidad || "",
          domicilio_provincia: ficha.domicilioProvincia || "",
          domicilio_codigo_postal: ficha.domicilioCodigoPostal || "",
          acepta_condiciones: ficha.aceptaCondiciones ? "true" : "false",
          firma_data_url: ficha.firma || "",
          nivel: ficha.nivel || "",
          viaje: ficha.viaje || "",
          colegio_id: ficha.colegioId || "",
          colegio: ficha.colegio || "",
          colegio_texto: ficha.colegioTexto || "",
          grado: ficha.grado || "",
          division: ficha.division || "",
          plan_pago_id: ficha.planPagoId || "",
          grupo_asignado_id: ficha.grupoAsignadoId || ficha.asignacionGrupo?.grupoId || "",
          contrato_id: ficha.contratoId || ficha.asignacionGrupo?.contratoId || "",
          codigo_contrato: ficha.codigoContrato || ficha.asignacionGrupo?.codigoContrato || "",
          estado_revision: ficha.estadoRevision || "pendiente",
          documentacion_estado: ficha.documentacionEstado || "pendiente",
          ficha_medica_estado: ficha.fichaMedicaEstado || "pendiente",
          autorizacion_estado: ficha.autorizacionEstado || "pendiente",
          motivo_rechazo: ficha.motivoRechazo || "",
          observaciones: ficha.observaciones || "",
          created_at: ficha.createdAt || now,
          updated_at: ficha.updatedAt || ficha.createdAt || now
        }));
      }

      function downloadGoogleSheetSchemaCsv() {
        const csvPackage = window.ElAngelAzulPersistence.blankCsvPackage();
        Object.entries(csvPackage).forEach(([tab, csv]) => {
          downloadCsvFile(`EAA_${tab}_encabezados_${sheetMigrationStamp()}.csv`, csv);
        });
      }

      // Un CSV no puede guardar ancho de columna - Excel lo abre siempre con
      // columnas angostas por defecto, por más que el separador y la
      // codificación estén bien (confirmado con el usuario: eso seguía
      // "apretado" incluso después de arreglar ambas cosas). El fix real es
      // dejar de generar CSV y generar un .xlsx real, con las columnas ya
      // ajustadas al contenido - xlsx.js ya está cargado en esta página
      // (index.html) sin usarse en ningún lado del código.
      function autoFitColumnWidths(rows, columns) {
        return columns.map((column) => {
          const maxLen = rows.reduce((max, row) => Math.max(max, String(row[column] ?? "").length), column.length);
          return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
        });
      }

      function downloadGoogleSheetDataXlsx() {
        const rowsByTab = buildGoogleSheetMigrationRows();
        const workbook = XLSX.utils.book_new();
        Object.entries(rowsByTab).forEach(([tab, rows]) => {
          const columns = sheetTabColumns(tab);
          const sheet = XLSX.utils.json_to_sheet(rows, { header: columns });
          sheet["!cols"] = autoFitColumnWidths(rows, columns);
          XLSX.utils.book_append_sheet(workbook, sheet, tab.slice(0, 31));
        });
        XLSX.writeFile(workbook, `EAA_respaldo_${sheetMigrationStamp()}.xlsx`);
      }

      function downloadGoogleSheetAppsScript() {
        downloadTextFile("EAA_Google_Sheets_Apps_Script.js", window.ElAngelAzulPersistence.appsScriptTemplate(), "text/javascript;charset=utf-8");
      }

      function renderAdminConfiguracion() {
        const passengerCount = adminPasajerosRows().length;
        const groupCount = adminPasajerosDemo.length;
        const contractCount = adminContratosDemo.length;
        const fichaCount = loadFichasAdhesionDemo().length;
        const tourismCount = adminTurismoTrips.length;

        document.getElementById("app").innerHTML = renderAdminShell("configuracion", `
          <section class="admin-turismo-panel admin-overview admin-settings-overview">
            <div class="admin-dashboard-head">
              <div>
                <p>Configuración</p>
                <h1>Estado del sistema</h1>
                <span>Información operativa. Las credenciales se administran de forma privada en el servidor.</span>
              </div>
              <span class="admin-system-badge is-online">
                <i aria-hidden="true"></i>
                Sistema operativo
              </span>
            </div>
            <div class="admin-settings-grid">
              <article>
                <span class="material-symbols-outlined" aria-hidden="true">database</span>
                <small>Base de datos</small>
                <strong>PostgreSQL</strong>
                <p>Fuente única de datos en producción.</p>
              </article>
              <article>
                <span class="material-symbols-outlined" aria-hidden="true">cloud_done</span>
                <small>Alojamiento</small>
                <strong>Hostinger</strong>
                <p>Aplicación web activa y protegida.</p>
              </article>
              <article>
                <span class="material-symbols-outlined" aria-hidden="true">shield_lock</span>
                <small>Sesión</small>
                <strong>8 horas</strong>
                <p>Cierre automático por seguridad.</p>
              </article>
              <article>
                <span class="material-symbols-outlined" aria-hidden="true">manage_accounts</span>
                <small>Accesos</small>
                <strong>1 admin + 5 agentes</strong>
                <p>Configuración disponible solo para Admin.</p>
              </article>
            </div>
          </section>

          <section class="admin-turismo-panel admin-settings-data">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Datos disponibles</h2>
                <p>Conteos cargados desde la base activa.</p>
              </div>
              <button type="button" class="admin-secondary-action" data-admin-download-sheet-data>Descargar respaldo Excel</button>
            </div>
            <div class="admin-settings-counts">
              <span><strong>${groupCount}</strong> Grupos</span>
              <span><strong>${contractCount}</strong> Contratos</span>
              <span><strong>${passengerCount}</strong> Pasajeros</span>
              <span><strong>${fichaCount}</strong> Inscripciones</span>
              <span><strong>${tourismCount}</strong> Viajes de turismo</span>
            </div>
          </section>

          <section class="admin-turismo-panel admin-settings-notice">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            <div>
              <h2>Importante</h2>
              <p>Pagos continúa como módulo de demostración hasta conectar la cobranza real. Los cambios de contraseñas y servidor no se realizan desde este panel.</p>
            </div>
          </section>
        `);
        bindAdminShell();
        document.querySelector("[data-admin-download-sheet-data]")?.addEventListener("click", downloadGoogleSheetDataXlsx);
      }

      const ADMIN_PASAJEROS_STORAGE_KEY = "angelAzulAdminPasajerosDemoV4";
      const CONTRATOS_STORAGE_KEY = "angelAzulContratosV2";
      const FICHA_ADHESION_STORAGE_KEY = "angelAzulFichaAdhesionDemoV1";


      function adminPasajerosGroupId(nivel, viaje, colegio, curso, division) {
        return window.ElAngelAzulGroups.groupId(nivel, viaje, colegio, curso, division);
      }

      function normalizeAdminPasajerosGroup(group = {}) {
        return window.ElAngelAzulGroups.normalizeGroup(group);
      }

      function createAdminPasajerosSeedPassenger({ nivel, year, schoolIndex, divisionIndex, passengerIndex, groupId }) {
        const firstNames = [
          "Martina", "Benjamín", "Sofía", "Tomás", "Valentina", "Mateo", "Camila", "Nicolás",
          "Abril", "Joaquín", "Olivia", "Felipe", "Renata", "Thiago", "Alma", "Bruno"
        ];
        const lastNames = [
          "Gómez", "Pérez", "Ramírez", "Torres", "Núñez", "Fernández", "Acosta", "Medina",
          "Silva", "López", "Molina", "Benítez", "Vera", "Castro", "Arias", "Romero"
        ];
        const base = nivel === "Primaria" ? 46000000 : 43000000;
        const dni = String(base + ((year - 2024) * 10000) + (schoolIndex * 1000) + (divisionIndex * 100) + passengerIndex + 1);
        const responsableDni = String(28000000 + ((year - 2024) * 8000) + (schoolIndex * 700) + (divisionIndex * 80) + passengerIndex + 11);
        const nameIndex = ((year - 2024) + schoolIndex + divisionIndex + passengerIndex) % firstNames.length;
        const lastNameIndex = ((year - 2024) * 2 + schoolIndex + divisionIndex + passengerIndex) % lastNames.length;
        const paymentStates = ["Al día", "Pendiente", "Vencido", "Al día"];
        const docStates = ["Completa", "Pendiente", "Completa", "Observada"];
        const fichaStates = ["Cargada", "Pendiente", "Cargada", "Observada"];
        const paymentStatus = paymentStates[(schoolIndex + divisionIndex + passengerIndex) % paymentStates.length];
        const paidByStatus = {
          "Al día": "500000",
          Pendiente: "166666",
          Vencido: "83333"
        };
        const month = String(((schoolIndex + divisionIndex + passengerIndex) % 9) + 1).padStart(2, "0");
        const day = String(((year + schoolIndex + divisionIndex + passengerIndex) % 26) + 1).padStart(2, "0");
        return {
          nombre: `${firstNames[nameIndex]} ${lastNames[lastNameIndex]}`,
          dni,
          contratoId: `contrato-${groupId}`,
          codigoContrato: `CON-${year}-${nivel.slice(0, 3).toUpperCase()}-${String(schoolIndex + 1).padStart(2, "0")}-${divisionIndex === 0 ? "A" : "B"}`,
          nacimiento: nivel === "Primaria" ? `${year - 12}-${month}-${day}` : `${year - 18}-${month}-${day}`,
          telefono: `3794${dni.slice(-6)}`,
          responsable: `${lastNames[(lastNameIndex + 3) % lastNames.length]} ${firstNames[(nameIndex + 4) % firstNames.length]}`,
          responsableDni,
          responsableTelefono: `3795${responsableDni.slice(-6)}`,
          vinculo: passengerIndex % 2 === 0 ? "Madre" : "Padre",
          responsableCuilCuit: passengerIndex % 2 === 0 ? `20-${responsableDni}-3` : "Pendiente",
          fichaMedica: fichaStates[(schoolIndex + divisionIndex + passengerIndex) % fichaStates.length],
          pago: paymentStatus,
          documentacion: docStates[(schoolIndex + divisionIndex + passengerIndex) % docStates.length],
          estado: "Activo",
          valorViaje: "1500000",
          sena: "0",
          cuotas: "18",
          pagado: paidByStatus[paymentStatus] || "0",
          saldo: String(1500000 - Number(paidByStatus[paymentStatus] || 0)),
          planPago: "Regular",
          proximaCuota: paymentStatus === "Vencido" ? `${year}-06-10` : `${year}-07-10`,
          observaciones: "Pasajero ficticio para prueba de organización."
        };
      }

      function createAdminPasajerosSeed() {
        const years = [2024, 2025, 2026, 2027, 2028];
        const divisions = ["A", "B"];
        const schoolsByLevel = {
          Primaria: [
            "Colegio Río Paraná",
            "Escuela Normal Primaria",
            "Instituto Santa Clara",
            "Colegio San José Primario",
            "Escuela Belgrano Primaria"
          ],
          Secundaria: [
            "Colegio San Martín",
            "Colegio Belgrano",
            "Instituto Santa Ana",
            "Colegio Nacional",
            "Instituto San Gabriel"
          ]
        };
        const demo = [];
        Object.entries(schoolsByLevel).forEach(([nivel, schools]) => {
          years.forEach((year) => {
            const viaje = nivel === "Primaria" ? `Carlos Paz ${year}` : `Bariloche ${year}`;
            const curso = nivel === "Primaria" ? "6to grado" : "5to año";
            schools.forEach((colegio, schoolIndex) => {
              divisions.forEach((division, divisionIndex) => {
                const groupId = adminPasajerosGroupId(nivel, viaje, colegio, curso, division);
                demo.push(normalizeAdminPasajerosGroup({
                  id: groupId,
                  nivel,
                  viaje,
                  colegio,
                  curso,
                  division,
                  pasajerosEsperados: nivel === "Primaria" ? 24 + schoolIndex : 28 + schoolIndex,
                  pasajeros: [0, 1].map((passengerIndex) => createAdminPasajerosSeedPassenger({
                    nivel,
                    year,
                    schoolIndex,
                    divisionIndex,
                    passengerIndex,
                    groupId
                  }))
                }));
              });
            });
          });
        });
        return demo;
      }

      function createAdminContratosSeed(groups = createAdminPasajerosSeed()) {
        return groups.map((group) => ({
          ...adminContratoFromGroup(group, new Date().toISOString()),
          observaciones: "Contrato ficticio generado para pruebas del panel."
        }));
      }

      const adminPasajerosCollection = window.ElAngelAzulPersistence.collection({
        key: ADMIN_PASAJEROS_STORAGE_KEY,
        seed: createAdminPasajerosSeed,
        normalize: normalizeAdminPasajerosGroup
      });

      const contratosCollection = window.ElAngelAzulPersistence.collection({
        key: CONTRATOS_STORAGE_KEY,
        seed: () => createAdminContratosSeed(adminPasajerosCollection.load()),
        normalize: (contract) => ({
          ...contract,
          id: String(contract.id || "").trim(),
          codigo_contrato: String(contract.codigo_contrato || contract.codigoContrato || "").trim(),
          grupo_id: String(contract.grupo_id || contract.grupoId || "").trim()
        })
      });

      const fichaAdhesionCollection = window.ElAngelAzulPersistence.collection({
        key: FICHA_ADHESION_STORAGE_KEY,
        seed: () => [],
        normalize: (ficha) => ficha
      });

      let googleSheetsHydrated = false;
      let googleSheetsHydrating = false;
      let googleSheetsWriteQueue = Promise.resolve();
      let googleSheetsSyncState = {
        status: "local",
        message: "Todavía no se sincronizó con la base de datos."
      };

      function loadAdminPasajerosDemo() {
        return adminPasajerosCollection.load();
      }

      function loadAdminContratosDemo() {
        return contratosCollection.load();
      }

      function saveAdminContratosDemo() {
        adminContratosDemo = contratosCollection.save(adminContratosDemo);
        if (!googleSheetsHydrating) return queueGoogleSheetsWrite(["CONTRATOS"]);
        return Promise.resolve();
      }

      function saveAdminPasajerosDemo() {
        adminPasajerosDemo = adminPasajerosCollection.save(adminPasajerosDemo);
        if (!googleSheetsHydrating) queueGoogleSheetsWrite(["PASAJEROS"]);
      }

      function saveAdminGruposDemo() {
        adminPasajerosDemo = adminPasajerosCollection.save(adminPasajerosDemo);
        if (!googleSheetsHydrating) return queueGoogleSheetsWrite(["GRUPOS"]);
        return Promise.resolve();
      }

      // Ficha v2: los grupos eligen el colegio de la lista administrada y el
      // curso (Grado/Año) de la misma lista que usa la inscripción pública.
      function renderAdminColegioSelect(seleccionadoId = "") {
        const activos = adminColegios.filter((colegio) => colegio.activo === "TRUE");
        if (!activos.length) {
          return `<select name="colegio_id" required disabled><option value="">Todavía no hay colegios cargados</option></select>`;
        }
        return `<select name="colegio_id" required>
          <option value="">Elegí un colegio</option>
          ${activos.map((colegio) => `<option value="${escapeHtml(colegio.id)}" ${colegio.id === seleccionadoId ? "selected" : ""}>${escapeHtml(colegio.nombre)}${colegio.localidad ? ` — ${escapeHtml(colegio.localidad)}` : ""}</option>`).join("")}
        </select>`;
      }

      function renderAdminGradoSelect(seleccionado = "") {
        const grados = window.ElAngelAzulFichaValidation.GRADOS.Primaria;
        return `<select name="curso" required>
          <option value="">Elegí</option>
          ${grados.map((grado) => `<option value="${escapeHtml(grado)}" ${grado === seleccionado ? "selected" : ""}>${escapeHtml(grado)}</option>`).join("")}
        </select>`;
      }

      function adminColegioNombre(colegioId) {
        return adminColegios.find((colegio) => colegio.id === colegioId)?.nombre || "";
      }

      function createAdminPasajerosGroup({ nivel, viaje, colegio, colegioId = "", curso, division, pasajerosEsperados = 0 }) {
        const group = normalizeAdminPasajerosGroup({
          nivel,
          viaje,
          colegio,
          colegioId,
          curso,
          division,
          pasajerosEsperados,
          pasajeros: []
        });
        const exists = adminPasajerosDemo.some((item) => (
          item.nivel === group.nivel &&
          item.viaje === group.viaje &&
          item.colegio === group.colegio &&
          item.curso === group.curso &&
          item.division === group.division
        ));
        if (!exists) {
          adminPasajerosDemo.push(group);
          saveAdminGruposDemo();
        }
        adminPasajerosNivel = group.nivel;
        adminPasajerosViaje = group.viaje;
        adminPasajerosColegio = group.colegio;
        adminPasajerosGrupoId = group.id;
        adminPasajerosShowForm = false;
        adminPasajerosFormError = "";
        renderAdminPasajeros();
      }

      function openAdminPasajerosGroupModal(type) {
        adminPasajerosGroupModal = { type, error: "" };
        renderAdminPasajeros();
      }

      let adminPasajerosDemo = loadAdminPasajerosDemo();
      let adminContratosDemo = loadAdminContratosDemo();

      let adminPasajerosNivel = "Secundaria";
      let adminPasajerosViaje = "Bariloche 2026";
      let adminPasajerosColegio = "Colegio San Martín";
      let adminPasajerosGrupoId = adminPasajerosGroupId("Secundaria", "Bariloche 2026", "Colegio San Martín", "5to año", "A");
      let adminPasajerosShowForm = false;
      let adminPasajerosFormError = "";
      let adminPasajerosEditMode = false;
      let adminPasajerosEditError = "";
      let adminPasajerosSearch = "";
      let adminPasajerosFilterViaje = "";
      let adminPasajerosFilterColegio = "";
      let adminPasajerosFilterCurso = "";
      let adminPasajerosFilterEstado = "";
      let adminPasajerosSelectedDni = "";
      let adminPasajerosGroupModal = null;
      let adminGruposFilterNivel = "";
      let adminGruposFilterViaje = "";
      let adminGruposFilterColegio = "";
      let adminGruposSearch = "";
      let adminGruposShowCreateForm = false;
      let adminGruposCreateError = "";
      let adminContratosFilterNivel = "";
      let adminContratosFilterViaje = "";
      let adminContratosFilterColegio = "";
      let adminContratosFilterEstado = "";
      let adminContratosSearch = "";
      let adminContratosEditId = "";
      let adminContratosEditError = "";
      // Ficha v2: filas planas tal cual llegan de /api/google-sheets.
      let adminFichasTutor = [];
      let adminColegios = [];
      let adminPlanesPago = [];
      let adminFichasTipo = "pax";
      let adminFichasSinVincular = false;
      let adminFichasMessage = "";
      let adminFichasFilter = "nuevas";
      let adminFichasSelectedId = "";
      let adminFichasManuallyClosed = false;
      let adminFichasSearch = "";
      let adminFichasFilterColegio = "";
      let adminFichasFilterViaje = "";
      let adminFichasRejectId = "";
      let adminFichasRejectError = "";

      function loadFichasAdhesionDemo() {
        return fichaAdhesionCollection.load();
      }

      function saveFichasAdhesionDemo(fichas) {
        fichaAdhesionCollection.save(fichas);
        if (!googleSheetsHydrating) return queueGoogleSheetsWrite(["FICHAS_ADHESION"]);
        return Promise.resolve();
      }

      function sheetGroupFromRow(row = {}) {
        return normalizeAdminPasajerosGroup({
          id: row.id,
          nivel: row.nivel,
          viaje: row.viaje,
          colegio: row.colegio,
          colegioId: row.colegio_id || "",
          curso: row.curso,
          division: row.division,
          pasajerosEsperados: Number(row.pasajeros_esperados || 0),
          pasajeros: []
        });
      }

      function sheetPassengerFromRow(row = {}) {
        return {
          nombre: row.nombre || "",
          apellido: row.apellido || "",
          responsableApellido: row.responsable_apellido || "",
          responsableEmail: row.responsable_email || "",
          planPagoId: row.plan_pago_id || "",
          planNombre: row.plan_nombre || "",
          planCuotas: row.plan_cuotas || "",
          dni: row.dni || "",
          contratoId: row.contrato_id || "",
          codigoContrato: row.codigo_contrato || "",
          nacimiento: row.nacimiento || "",
          telefono: row.telefono || "",
          responsable: row.responsable_nombre || "",
          responsableDni: row.responsable_dni || "",
          responsableTelefono: row.responsable_telefono || "",
          responsableCuilCuit: row.responsable_cuil_cuit || "",
          vinculo: row.vinculo || "",
          estado: row.estado || "Activo",
          documentacion: row.documentacion_estado || "Pendiente",
          fichaMedica: row.ficha_medica_estado || "Pendiente",
          pago: row.pago_estado || "Pendiente",
          observaciones: row.observaciones || ""
        };
      }

      function sheetFichaFromRow(row = {}) {
        return {
          id: row.id || "",
          tipo: row.tipo || "pax",
          pasajeroDni: row.pasajero_dni || "",
          pasajeroNumeroDocumento: row.pasajero_dni || "",
          pasajeroNombre: row.pasajero_nombre || "",
          pasajeroApellido: row.pasajero_apellido || "",
          pasajeroTipoDocumento: row.pasajero_tipo_documento || "DNI",
          pasajeroNacimiento: row.pasajero_nacimiento || "",
          pasajeroSexo: row.pasajero_sexo || "",
          responsableNombre: row.responsable_nombre || "",
          responsableApellido: row.responsable_apellido || "",
          responsableTipoDocumento: row.responsable_tipo_documento || "DNI",
          responsableNumeroDocumento: row.responsable_numero_documento || "",
          responsableNacimiento: row.responsable_nacimiento || "",
          responsableParentesco: row.responsable_parentesco || "",
          responsableEmail: row.responsable_email || "",
          responsableTelefono: row.responsable_telefono || "",
          responsableCelular: row.responsable_celular || "",
          responsableCuilCuit: row.responsable_cuil_cuit || "",
          domicilioCalle: row.domicilio_calle || "",
          domicilioNumero: row.domicilio_numero || "",
          domicilioPiso: row.domicilio_piso || "",
          domicilioDepartamento: row.domicilio_departamento || "",
          domicilioBarrio: row.domicilio_barrio || "",
          domicilioLocalidad: row.domicilio_localidad || "",
          domicilioProvincia: row.domicilio_provincia || "",
          domicilioCodigoPostal: row.domicilio_codigo_postal || "",
          aceptaCondiciones: String(row.acepta_condiciones || "").toLowerCase() === "true",
          firma: row.firma_data_url || "",
          firmaRegistrada: Boolean(row.firma_data_url),
          nivel: row.nivel || "",
          viaje: row.viaje || "",
          colegioId: row.colegio_id || "",
          colegio: row.colegio || "",
          colegioTexto: row.colegio_texto || "",
          colegioVinculado: String(row.colegio_vinculado || "").toUpperCase() === "TRUE",
          grado: row.grado || "",
          division: row.division || "",
          cursoDivision: row.curso_division || "",
          planPagoId: row.plan_pago_id || "",
          planNombre: row.plan_nombre || "",
          planCuotas: row.plan_cuotas || "",
          estadoRevision: row.estado_revision || "pendiente",
          documentacionEstado: row.documentacion_estado || "pendiente",
          fichaMedicaEstado: row.ficha_medica_estado || "pendiente",
          autorizacionEstado: row.autorizacion_estado || "pendiente",
          motivoRechazo: row.motivo_rechazo || "",
          observaciones: row.observaciones || "",
          emailEstado: row.email_estado || "pendiente",
          emailError: row.email_error || "",
          emailEnviadoAt: row.email_enviado_at || "",
          contratoId: row.contrato_id || "",
          codigoContrato: row.codigo_contrato || "",
          grupoAsignadoId: row.grupo_asignado_id || "",
          createdAt: row.created_at || "",
          updatedAt: row.updated_at || "",
          asignacionGrupo: {
            grupoId: row.grupo_asignado_id || "",
            contratoId: row.contrato_id || "",
            codigoContrato: row.codigo_contrato || ""
          }
        };
      }

      function applyGoogleSheetsRows({
        grupos = [],
        contratos = [],
        pasajeros = [],
        fichas = [],
        includePrivate = true
      }) {
        const groupsById = new Map(grupos.map((row) => [row.id, sheetGroupFromRow(row)]));
        if (includePrivate) {
          pasajeros.forEach((row) => {
            const groupId = row.grupo_id || "";
            if (!groupsById.has(groupId)) return;
            groupsById.get(groupId).pasajeros.push(sheetPassengerFromRow(row));
          });
        }
        googleSheetsHydrating = true;
        adminPasajerosDemo = [...groupsById.values()];
        adminContratosDemo = contratos.map((contract) => ({
          ...contract,
          id: String(contract.id || "").trim(),
          codigo_contrato: String(contract.codigo_contrato || "").trim(),
          grupo_id: String(contract.grupo_id || "").trim()
        }));
        if (includePrivate) {
          adminPasajerosCollection.save(adminPasajerosDemo);
          fichaAdhesionCollection.save(fichas.map(sheetFichaFromRow));
        }
        saveAdminContratosDemo();
        googleSheetsHydrating = false;
      }

      async function hydrateGoogleSheetsData(force = false) {
        const config = window.ElAngelAzulPersistence.readGoogleSheetsConfig();
        if (!config.enabled || !config.endpoint) return false;
        if (googleSheetsHydrated && !force) return true;
        try {
          const adminEntry = isAdminEntry();
          // Las páginas públicas solo necesitan GRUPOS/CONTRATOS para el
          // matching de inscripción. PASAJEROS, FICHAS_ADHESION y TURISMO
          // admin son privados: no se solicitan fuera del panel, evitando
          // 401 esperados y evitando tocar sus caches locales.
          // FIX pérdida de datos: un fetch que FALLA de verdad (Sheets caído,
          // credenciales rotas) caía en el mismo catch(() => []) que una hoja
          // realmente vacía o que el 401 esperado en público - las tres cosas
          // quedaban indistinguibles. Dos problemas reales de esto:
          // 1) Como cada sección del admin es un HTML separado (cualquier
          //    navegación re-hidrata), un error transitorio de Sheets pisaba
          //    pasajeros/contratos reales (ej. un pasajero recién aprobado
          //    desde una ficha) con la base demo ficticia.
          // 2) En Inscripción pública, Pasajeros SIEMPRE da 401 (no hay
          //    sesión) - eso disparaba la rama de "no hay pasajeros" ANTES de
          //    llegar a aplicar los Grupos/Contratos reales recién traídos,
          //    así que el buscador de contrato activo nunca llegaba a usar
          //    los datos reales de Sheets, solo la semilla ficticia.
          // Ahora un fetch fallido devuelve null (no []) para distinguirlo de
          // "la hoja está vacía de verdad", y Grupos/Contratos (siempre
          // públicas) se aplican apenas se leen bien, sin depender de si
          // Pasajeros/Fichas están disponibles en esta página.
          const [grupos, contratos, pasajeros, fichas, turismo, fichasTutor, colegios, planesPago] = await Promise.all([
            adminEntry ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("GRUPOS").catch(() => null) : Promise.resolve([]),
            adminEntry ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("CONTRATOS").catch(() => null) : Promise.resolve([]),
            adminEntry
              ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("PASAJEROS").catch(() => null)
              : Promise.resolve(null),
            adminEntry
              ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("FICHAS_ADHESION").catch(() => null)
              : Promise.resolve(null),
            adminEntry
              ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("TURISMO").catch(() => null)
              : Promise.resolve(null),
            adminEntry
              ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("FICHAS_TUTOR").catch(() => null)
              : Promise.resolve(null),
            adminEntry
              ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("COLEGIOS").catch(() => null)
              : Promise.resolve(null),
            adminEntry
              ? window.ElAngelAzulPersistence.fetchGoogleSheetRows("PLANES_PAGO").catch(() => null)
              : Promise.resolve(null)
          ]);
          if (grupos === null || contratos === null) {
            googleSheetsSyncState = {
              status: "error",
              message: "No se pudo leer Grupos/Contratos desde la base de datos. Se mantienen los datos guardados localmente."
            };
            return false;
          }
          // En el admin sí hay sesión: si Pasajeros/Fichas igual fallan, es un
          // error real (no el 401 esperado de páginas públicas) - no pisar
          // datos reales con la semilla ficticia ni con listas vacías.
          if (adminEntry && [pasajeros, fichas, turismo, fichasTutor, colegios, planesPago].some((rows) => rows === null)) {
            googleSheetsSyncState = {
              status: "error",
              message: "No se pudo leer Pasajeros/Fichas/Turismo/Colegios/Planes desde la base de datos. Se mantienen los datos guardados localmente."
            };
            return false;
          }
          if (adminEntry) {
            adminFichasTutor = fichasTutor;
            adminColegios = colegios;
            adminPlanesPago = planesPago;
          }
          // Una respuesta válida vacía también debe aplicarse. Antes se
          // ignoraba y quedaban viajes viejos en localStorage; el siguiente
          // guardado podía volver a sembrarlos en una base realmente vacía.
          // Un error de red llega como null y conserva el estado local.
          if (Array.isArray(turismo)) {
            googleSheetsHydrating = true;
            adminTurismoTrips = turismo.map(turismoRowToTrip);
            localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(adminTurismoTrips, null, 2));
            googleSheetsHydrating = false;
          }
          // pasajeros/fichas null acá solo pasa en páginas públicas (401
          // esperado, ya se descartó el caso admin arriba) - se tratan como
          // "sin datos de pasajeros visibles", nunca como excusa para pisar
          // lo que haya. Grupos/Contratos reales se aplican igual.
          const pasajerosRows = adminEntry ? (pasajeros || []) : [];
          const fichasRows = adminEntry ? (fichas || []) : [];
          // Migración a Supabase (24/07): antes, una respuesta real pero
          // vacía de Pasajeros (tabla real sin filas todavía, no un error de
          // red) disparaba una siembra de pasajeros/contratos FICTICIOS y los
          // guardaba como si fueran reales. Con las tablas arrancando vacías
          // sin backfill, eso habría contaminado el admin real el día del
          // corte. Una hoja/tabla real vacía se trata igual que cualquier
          // otro conteo: se aplica tal cual, sin inventar datos.
          applyGoogleSheetsRows({
            grupos,
            contratos,
            pasajeros: pasajerosRows,
            fichas: fichasRows,
            includePrivate: adminEntry
          });
          googleSheetsHydrated = true;
          googleSheetsSyncState = {
            status: "ok",
            message: adminEntry
              ? `Base de datos activa: ${grupos.length} grupos, ${contratos.length} contratos, ${pasajerosRows.length} pasajeros y ${fichasRows.length} fichas.`
              : `Base de datos activa: ${grupos.length} grupos y ${contratos.length} contratos.`
          };
          return true;
        } catch (error) {
          googleSheetsSyncState = {
            status: "error",
            message: `No se pudo sincronizar con la base de datos: ${error.message || "error desconocido"}.`
          };
          return false;
        }
      }

      function queueGoogleSheetsWrite(sheets = [], deleteIdsBySheet = {}) {
        const config = window.ElAngelAzulPersistence.readGoogleSheetsConfig();
        if (!config.enabled || !config.endpoint) {
          googleSheetsSyncState = {
            status: "local",
            message: "Guardado local. La base de datos no está conectada."
          };
          return Promise.resolve(false);
        }
        const uniqueSheets = [...new Set(sheets)];
        googleSheetsWriteQueue = googleSheetsWriteQueue.then(async () => {
          const now = new Date().toISOString();
          const rowsByTab = {};
          if (uniqueSheets.includes("GRUPOS")) rowsByTab.GRUPOS = googleSheetsGroupRows(now);
          if (uniqueSheets.includes("CONTRATOS")) rowsByTab.CONTRATOS = googleSheetsContratoRows(now);
          if (uniqueSheets.includes("PASAJEROS")) rowsByTab.PASAJEROS = googleSheetsPassengerRows(now);
          if (uniqueSheets.includes("FICHAS_ADHESION")) rowsByTab.FICHAS_ADHESION = googleSheetsFichaRows(now);
          if (uniqueSheets.includes("TURISMO")) rowsByTab.TURISMO = googleSheetsTurismoRows(now);
          if (uniqueSheets.includes("FICHAS_TUTOR")) rowsByTab.FICHAS_TUTOR = adminFichasTutor;
          if (uniqueSheets.includes("COLEGIOS")) rowsByTab.COLEGIOS = adminColegios;
          if (uniqueSheets.includes("PLANES_PAGO")) rowsByTab.PLANES_PAGO = adminPlanesPago;
          for (const sheet of uniqueSheets) {
            if (!["GRUPOS", "CONTRATOS", "PASAJEROS", "FICHAS_ADHESION", "TURISMO", "FICHAS_TUTOR", "COLEGIOS", "PLANES_PAGO"].includes(sheet)) continue;
            await window.ElAngelAzulPersistence.writeGoogleSheetRows(sheet, rowsByTab[sheet] || [], deleteIdsBySheet[sheet] || []);
          }
          googleSheetsSyncState = {
            status: "ok",
            message: "Cambios guardados en la base de datos."
          };
          return true;
        }).catch((error) => {
          googleSheetsSyncState = {
            status: "error",
            message: `No se pudo guardar en la base de datos: ${error.message || "error desconocido"}.`
          };
          return false;
        });
        return googleSheetsWriteQueue;
      }

      function adminFichasSaveMessage(ok, successText = "Guardado en la base de datos.") {
        adminFichasMessage = ok
          ? successText
          : googleSheetsSyncState.status === "local"
            ? googleSheetsSyncState.message
            : "Error al guardar en la base de datos.";
      }

      async function updateFichaAdhesionStatus(id, estado, patch = {}, successText = "") {
        const now = new Date().toISOString();
        const fichas = loadFichasAdhesionDemo().map((ficha) => (
          ficha.id === id ? { ...ficha, ...patch, estadoRevision: estado, updatedAt: now } : ficha
        ));
        const saved = await saveFichasAdhesionDemo(fichas);
        adminFichasSaveMessage(saved, successText || "Guardado en la base de datos.");
        renderAdminFichasRecibidas();
      }

      async function rejectFichaAdhesion(id, motivo) {
        const motivoRechazo = String(motivo || "").trim();
        if (!motivoRechazo) {
          adminFichasRejectError = "Escribí el motivo del rechazo para confirmar.";
          adminFichasRejectId = id;
          renderAdminFichasRecibidas();
          return;
        }
        adminFichasRejectId = "";
        adminFichasRejectError = "";
        adminFichasFilter = "rechazadas";
        adminFichasSelectedId = id;
        await updateFichaAdhesionStatus(id, "rechazada", { motivoRechazo }, "Guardado en la base de datos. Ficha rechazada.");
      }

      async function markFichaAdhesionStatus(id, estado, message) {
        adminFichasSelectedId = id;
        if (estado === "observada") adminFichasFilter = "observadas";
        if (estado === "duplicada") adminFichasFilter = "duplicadas";
        await updateFichaAdhesionStatus(id, estado, {}, message);
      }

      function fichaAssignmentContext(ficha = {}) {
        const assignment = ficha.asignacionGrupo || {};
        const levelOptions = uniqueValues(adminPasajerosDemo, "nivel");
        const rawNivel = assignment.nivel || ficha.nivel || adminPasajerosNivel;
        const nivel = levelOptions.includes(rawNivel) ? rawNivel : levelOptions[0] || "";
        const viajeOptions = uniqueValues(adminPasajerosDemo.filter((group) => group.nivel === nivel), "viaje");
        const rawViaje = assignment.viaje || ficha.viaje || viajeOptions[0] || "";
        const viaje = viajeOptions.includes(rawViaje) ? rawViaje : viajeOptions[0] || "";
        const colegioOptions = uniqueValues(adminPasajerosDemo.filter((group) => group.nivel === nivel && group.viaje === viaje), "colegio");
        const rawColegio = assignment.colegio || ficha.colegio || colegioOptions[0] || "";
        const colegio = colegioOptions.includes(rawColegio) ? rawColegio : colegioOptions[0] || "";
        const groupOptions = adminPasajerosDemo.filter((group) => (
          group.nivel === nivel &&
          group.viaje === viaje &&
          group.colegio === colegio
        ));
        const assignedGrupoId = String(assignment.grupoId || ficha.grupoAsignadoId || ficha.grupo_id || "").trim();
        const assignedGroup = assignedGrupoId ? adminPasajerosDemo.find((group) => group.id === assignedGrupoId) || null : null;
        const assignedGroupMatchesContext = Boolean(assignedGroup && groupOptions.some((group) => group.id === assignedGrupoId));
        const grupoId = assignedGroupMatchesContext
          ? assignedGrupoId
          : groupOptions[0]?.id || "";
        const selectedGroup = adminPasajerosDemo.find((group) => group.id === grupoId) || null;
        const contractOptions = adminContratoOptionsForGroup(grupoId);
        const rawContratoId = assignment.contratoId || ficha.contratoId || ficha.contrato_id || "";
        const selectedContract = contractOptions.find((contract) => contract.id === rawContratoId) || null;
        const contratoId = selectedContract?.id || "";
        const codigoContrato = selectedContract?.codigo_contrato || assignment.codigoContrato || ficha.codigoContrato || ficha.codigo_contrato || ficha.numeroContrato || ficha.administracion?.contrato || "";
        return { nivel, viaje, colegio, grupoId, selectedGroup, assignedGrupoId, assignedGroup, assignedGroupMatchesContext, contratoId, codigoContrato, selectedContract, contractOptions, viajeOptions, colegioOptions, groupOptions };
      }

      async function saveFichaAssignment(id, patch = {}) {
        const now = new Date().toISOString();
        const fichas = loadFichasAdhesionDemo().map((ficha) => {
          if (ficha.id !== id) return ficha;
          const current = fichaAssignmentContext({ ...ficha, asignacionGrupo: { ...(ficha.asignacionGrupo || {}), ...patch } });
          return {
            ...ficha,
            grupoAsignadoId: current.grupoId,
            asignacionGrupo: {
              nivel: current.nivel,
              viaje: current.viaje,
              colegio: current.colegio,
              grupoId: current.grupoId,
              contratoId: current.contratoId,
              codigoContrato: current.codigoContrato
            },
            contratoId: current.contratoId,
            codigoContrato: current.codigoContrato,
            updatedAt: now
          };
        });
        const saved = await saveFichasAdhesionDemo(fichas);
        adminFichasSaveMessage(saved, "Guardado en la base de datos. Asignación actualizada.");
        renderAdminFichasRecibidas();
      }

      function normalizeYesNoStatus(value) {
        const text = String(value || "").trim().toLowerCase();
        if (["si", "sí", "cargada", "completa", "aprobada", "ok"].some((token) => text.includes(token))) return "Sí";
        if (["no", "pendiente", "observada", "rechazada"].some((token) => text.includes(token))) return "No";
        return "No";
      }

      function renderFichaValue(label, value) {
        return `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(String(value || "").trim() || "Pendiente")}</dd>
          </div>
        `;
      }

      function fichaSignatureDataUrl(ficha = {}) {
        const value = String(ficha.firma || ficha.firmaDataUrl || "");
        return /^data:image\/png;base64,[a-z0-9+/=]+$/i.test(value) ? value : "";
      }

      function renderFichaAssignmentControls(ficha) {
        const context = fichaAssignmentContext(ficha);
        const levelOptions = uniqueValues(adminPasajerosDemo, "nivel");
        return `
          <div class="admin-fichas-assignment-grid">
            <label>Nivel
              <select data-ficha-assign="${escapeHtml(ficha.id)}" data-ficha-assign-field="nivel">
                ${levelOptions.map((nivel) => `<option value="${escapeHtml(nivel)}" ${nivel === context.nivel ? "selected" : ""}>${escapeHtml(nivel)}</option>`).join("")}
              </select>
            </label>
            <label>Viaje
              <select data-ficha-assign="${escapeHtml(ficha.id)}" data-ficha-assign-field="viaje">
                ${context.viajeOptions.map((viaje) => `<option value="${escapeHtml(viaje)}" ${viaje === context.viaje ? "selected" : ""}>${escapeHtml(viaje)}</option>`).join("")}
              </select>
            </label>
            <label>Colegio
              <select data-ficha-assign="${escapeHtml(ficha.id)}" data-ficha-assign-field="colegio">
                ${context.colegioOptions.map((colegio) => `<option value="${escapeHtml(colegio)}" ${colegio === context.colegio ? "selected" : ""}>${escapeHtml(colegio)}</option>`).join("")}
              </select>
            </label>
            <label>Curso / División
              <select data-ficha-assign="${escapeHtml(ficha.id)}" data-ficha-assign-field="grupoId">
                ${context.groupOptions.map((group) => `<option value="${escapeHtml(group.id)}" ${group.id === context.grupoId ? "selected" : ""}>${escapeHtml(group.curso)} ${escapeHtml(group.division)}</option>`).join("")}
              </select>
            </label>
            <label>Contrato
              <select data-ficha-assign="${escapeHtml(ficha.id)}" data-ficha-assign-field="contratoId">
                <option value="">Contrato pendiente</option>
                ${context.contractOptions.map((contract) => `<option value="${escapeHtml(contract.id)}" ${contract.id === context.contratoId ? "selected" : ""}>${escapeHtml(contract.codigo_contrato)}</option>`).join("")}
              </select>
            </label>
          </div>
        `;
      }

      function normalizeFichaDni(value = "") {
        return String(value || "").replace(/\D+/g, "");
      }

      function fichaResponsablePhone(ficha = {}) {
        return String(ficha.responsableCelular || ficha.domicilioCelular || ficha.responsableTelefono || ficha.domicilioTelefono || "").trim();
      }

      function fichaRequiredMissingFields(ficha = {}) {
        const context = fichaAssignmentContext(ficha);
        const missing = [];
        if (!String(ficha.pasajeroNombre || "").trim()) missing.push("nombre pasajero");
        if (!normalizeFichaDni(ficha.pasajeroNumeroDocumento || ficha.pasajeroDni)) missing.push("DNI pasajero");
        if (!String(ficha.responsableNombre || "").trim()) missing.push("nombre responsable");
        if (!normalizeFichaDni(ficha.responsableNumeroDocumento || ficha.responsableDni)) missing.push("DNI responsable");
        if (!fichaResponsablePhone(ficha)) missing.push("teléfono o celular responsable");
        if (!String(ficha.responsableParentesco || ficha.vinculo || "").trim()) missing.push("vínculo");
        if (!context.contratoId) missing.push("contrato");
        if (!context.assignedGrupoId || !context.assignedGroup || !context.assignedGroupMatchesContext) missing.push("grupo");
        return missing;
      }

      function fichaDuplicateMatches(ficha = {}) {
        const dni = normalizeFichaDni(ficha.pasajeroNumeroDocumento || ficha.pasajeroDni);
        if (!dni) return { passenger: [], ficha: [] };
        const passenger = adminPasajerosRows()
          .filter(({ passenger: item }) => normalizeFichaDni(item.dni) === dni)
          .map(({ passenger: item, group }) => ({
            name: item.nombre || "Pasajero existente",
            detail: `${group?.colegio || "Grupo"} · ${item.codigoContrato || item.codigo_contrato || "Contrato pendiente"}`
          }));
        const fichaMatches = loadFichasAdhesionDemo()
          .filter((item) => item.id !== ficha.id)
          .filter((item) => ["pendiente", "revisada", "observada", "duplicada", "aprobada"].includes(item.estadoRevision || "pendiente"))
          .filter((item) => normalizeFichaDni(item.pasajeroNumeroDocumento || item.pasajeroDni) === dni)
          .map((item) => ({
            name: item.pasajeroNombre || "Otra ficha",
            detail: `${item.estadoRevision || "pendiente"} · ${item.codigoContrato || item.numeroContrato || "Contrato pendiente"}`
          }));
        return { passenger, ficha: fichaMatches };
      }

      function fichaValidationResult(ficha = {}) {
        const context = fichaAssignmentContext(ficha);
        const contract = context.selectedContract || (context.contratoId ? contractById(context.contratoId, context.grupoId) : null);
        const contractState = String(contract?.estado || "").trim() || "Sin estado";
        const contractFound = Boolean(context.contratoId && contract);
        const contractActive = contractFound && contractState === "Activo";
        const groupFound = Boolean(context.assignedGrupoId && context.assignedGroup && context.assignedGroupMatchesContext);
        const duplicates = fichaDuplicateMatches(ficha);
        const dniDuplicate = duplicates.passenger.length > 0 || duplicates.ficha.length > 0;
        const missingFields = fichaRequiredMissingFields(ficha);
        const dataComplete = missingFields.length === 0;
        let suggested = "Lista para aprobar";
        if ((ficha.estadoRevision || "") === "duplicada") {
          suggested = "Duplicada";
        } else if (!contractFound || !groupFound || !contractActive) {
          suggested = "Bloqueada";
        } else if (dniDuplicate) {
          suggested = "Duplicada";
        } else if (!dataComplete) {
          suggested = "Observada";
        }
        return {
          context,
          contract,
          contractFound,
          contractActive,
          contractState,
          groupFound,
          dniDuplicate,
          duplicates,
          dataComplete,
          missingFields,
          suggested,
          canApprove: suggested === "Lista para aprobar"
        };
      }

      function validationYesNo(ok) {
        return ok ? "Sí" : "No";
      }

      function renderFichaValidationResult(ficha) {
        const result = fichaValidationResult(ficha);
        const group = result.groupFound ? result.context.assignedGroup : null;
        const duplicateItems = [
          ...result.duplicates.passenger.map((item) => `pasajero existente: ${item.name} (${item.detail})`),
          ...result.duplicates.ficha.map((item) => `otra ficha pendiente/aprobada: ${item.name} (${item.detail})`)
        ];
        return `
          <div class="admin-fichas-approval-checklist" aria-label="Resultado de validación">
            <strong>Resultado de validación</strong>
            <ul>
              <li class="${result.contractFound ? "is-ok" : "is-missing"}">
                <span aria-hidden="true">${result.contractFound ? "✓" : "!"}</span>
                Contrato encontrado: ${validationYesNo(result.contractFound)}
                <small>Código: ${escapeHtml(result.context.codigoContrato || "Pendiente")} · Estado: ${escapeHtml(result.contractState)}</small>
              </li>
              <li class="${result.groupFound ? "is-ok" : "is-missing"}">
                <span aria-hidden="true">${result.groupFound ? "✓" : "!"}</span>
                Grupo encontrado: ${validationYesNo(result.groupFound)}
                <small>${escapeHtml(group ? `${group.colegio} · ${group.viaje} · ${group.curso} ${group.division}` : "Grupo pendiente")}</small>
              </li>
              <li class="${!result.dniDuplicate ? "is-ok" : "is-missing"}">
                <span aria-hidden="true">${!result.dniDuplicate ? "✓" : "!"}</span>
                DNI no duplicado: ${validationYesNo(!result.dniDuplicate)}
                ${duplicateItems.length ? `<small>${escapeHtml(duplicateItems.join(" | "))}</small>` : ""}
              </li>
              <li class="${result.dataComplete ? "is-ok" : "is-missing"}">
                <span aria-hidden="true">${result.dataComplete ? "✓" : "!"}</span>
                Datos completos: ${validationYesNo(result.dataComplete)}
                ${result.missingFields.length ? `<small>Falta: ${escapeHtml(result.missingFields.join(", "))}</small>` : ""}
              </li>
            </ul>
            <div class="admin-fichas-assigned-note">
              <span>Estado sugerido</span>
              <strong>${escapeHtml(result.suggested)}</strong>
            </div>
          </div>
        `;
      }

      function fichaApprovalChecklist(ficha) {
        const result = fichaValidationResult(ficha);
        return [
          { key: "contrato", label: "Contrato activo", ok: result.contractFound && result.contractActive },
          { key: "grupo", label: "Grupo válido", ok: result.groupFound },
          { key: "dni", label: "DNI no duplicado", ok: !result.dniDuplicate && Boolean(normalizeFichaDni(ficha.pasajeroNumeroDocumento || ficha.pasajeroDni)) },
          { key: "data", label: "Datos mínimos completos", ok: result.dataComplete }
        ];
      }

      function canApproveFicha(ficha) {
        return fichaValidationResult(ficha).canApprove && fichaApprovalChecklist(ficha).every((item) => item.ok);
      }

      function renderFichaApprovalChecklist(ficha) {
        return `
          <div class="admin-fichas-approval-checklist" aria-label="Validaciones para aprobar">
            <strong>Validaciones para aprobar</strong>
            <ul>
              ${fichaApprovalChecklist(ficha).map((item) => `
                <li class="${item.ok ? "is-ok" : "is-missing"}">
                  <span aria-hidden="true">${item.ok ? "✓" : "!"}</span>
                  ${escapeHtml(item.label)}
                </li>
              `).join("")}
            </ul>
          </div>
        `;
      }

      function renderFichaActionButtons(ficha) {
        const estadoRevision = ficha.estadoRevision || "pendiente";
        const approvalEnabled = canApproveFicha(ficha);
        if (estadoRevision === "aprobada") {
          return `
            <div class="admin-fichas-actions">
              <span class="admin-fichas-state-badge is-approved">Aprobada</span>
            </div>
          `;
        }
        if (estadoRevision === "rechazada") {
          return `
            <div class="admin-fichas-actions">
              <button type="button" data-ficha-start-review="${escapeHtml(ficha.id)}">Reabrir revisión</button>
            </div>
          `;
        }
        if (["revisada", "observada", "duplicada"].includes(estadoRevision)) {
          return `
            <div class="admin-fichas-actions">
              <button type="button" data-ficha-save-assignment="${escapeHtml(ficha.id)}">Guardar asignación validada</button>
              <button type="button" data-ficha-observar="${escapeHtml(ficha.id)}">Marcar observada</button>
              <button type="button" data-ficha-duplicada="${escapeHtml(ficha.id)}">Marcar duplicada</button>
              <button type="button" data-ficha-rechazar="${escapeHtml(ficha.id)}">Rechazar con motivo</button>
              <button type="button" data-ficha-aprobar="${escapeHtml(ficha.id)}" ${approvalEnabled ? "" : "disabled"}>Aprobar y crear pasajero</button>
            </div>
          `;
        }
        return `
          <div class="admin-fichas-actions">
            <button type="button" data-ficha-start-review="${escapeHtml(ficha.id)}">Marcar en revisión</button>
          </div>
        `;
      }

      function formatFichaApprovalDate(ficha) {
        const rawDate = ficha.updatedAt || ficha.updated_at || "";
        if (!rawDate) return "";
        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return String(rawDate);
        return date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }

      function renderFichaApprovedColumn(ficha) {
        const approvalDate = formatFichaApprovalDate(ficha);
        return `
          <article class="admin-fichas-detail-card admin-fichas-detail-card--wide">
            <h3>Estado final</h3>
            <div class="admin-fichas-assigned-note">
              <strong>✅ Ficha aprobada — pasajero creado correctamente</strong>
              ${approvalDate ? `<strong>Fecha de aprobación: ${escapeHtml(approvalDate)}</strong>` : ""}
            </div>
          </article>
        `;
      }

      function fichaNombreCompleto(apellido, nombre) {
        return [String(apellido || "").trim(), String(nombre || "").trim()].filter(Boolean).join(", ");
      }

      function fichaTutoresAdicionales(dni) {
        const documento = normalizeFichaDni(dni);
        if (!documento) return [];
        // Un mismo tutor puede registrarse más de una vez: se muestra una sola
        // vez, con su registro más reciente (las filas llegan ordenadas así).
        const vistos = new Set();
        return adminFichasTutor.filter((tutor) => {
          if (normalizeFichaDni(tutor.pasajero_dni) !== documento) return false;
          const clave = normalizeFichaDni(tutor.numero_documento) || tutor.id;
          if (vistos.has(clave)) return false;
          vistos.add(clave);
          return true;
        });
      }

      function formatearCuil(valor) {
        return String(valor || "").replace(/^(\d{2})(\d{8})(\d)$/, "$1-$2-$3");
      }

      function fichaPlanTexto(nombre, cuotas) {
        if (!nombre) return "";
        const cantidad = String(cuotas || "").trim();
        if (!cantidad || new RegExp(`\\b${cantidad}\\b`).test(nombre)) return nombre;
        return `${nombre} · ${cantidad} ${cantidad === "1" ? "cuota" : "cuotas"}`;
      }

      const FICHA_EMAIL_ESTADOS = {
        enviado: { label: "Enviado", clase: "is-ok" },
        error: { label: "Error", clase: "is-alert" },
        sin_configurar: { label: "Sin configurar", clase: "is-pending" },
        pendiente: { label: "Pendiente", clase: "is-pending" }
      };

      function renderFichaEmailBadge(ficha) {
        const estado = FICHA_EMAIL_ESTADOS[ficha.emailEstado] || FICHA_EMAIL_ESTADOS.pendiente;
        return `<span class="admin-pasajeros-status ${estado.clase}">${escapeHtml(estado.label)}</span>`;
      }

      function renderFichaVincularColegio(ficha) {
        if (ficha.colegioVinculado) return "";
        const activos = adminColegios.filter((colegio) => colegio.activo === "TRUE");
        return `
          <div class="admin-fichas-vincular-colegio">
            <p><strong>Colegio sin vincular.</strong> La familia escribió: “${escapeHtml(ficha.colegioTexto || ficha.colegio)}”.</p>
            <label>Vincular a un colegio de la lista
              <select data-ficha-vincular-colegio>
                <option value="">Elegí un colegio</option>
                ${activos.map((colegio) => `<option value="${escapeHtml(colegio.id)}">${escapeHtml(colegio.nombre)}${colegio.localidad ? ` — ${escapeHtml(colegio.localidad)}` : ""}</option>`).join("")}
              </select>
            </label>
            <div class="admin-fichas-vincular-actions">
              <button type="button" class="admin-pasajeros-secondary-button" data-ficha-vincular-colegio-btn>Vincular</button>
              <button type="button" class="admin-pasajeros-secondary-button" data-ficha-crear-colegio="${escapeHtml(ficha.colegioTexto || ficha.colegio)}">Crear colegio “${escapeHtml(ficha.colegioTexto || ficha.colegio)}”</button>
            </div>
          </div>
        `;
      }

      function renderAdminFichaDetail(ficha) {
        if (!ficha) return "";
        const context = fichaAssignmentContext(ficha);
        const fichaMedica = normalizeYesNoStatus(ficha.fichaMedicaEstado || ficha.documentacionEstado);
        const fichaAdhesion = normalizeYesNoStatus(ficha.firma || ficha.autorizacionEstado || ficha.documentacionEstado || "Sí");
        const signatureDataUrl = fichaSignatureDataUrl(ficha);
        const estadoRevision = ficha.estadoRevision || "pendiente";
        const estadoClass = estadoRevision === "aprobada" ? "is-ok" : ["rechazada", "duplicada"].includes(estadoRevision) ? "is-alert" : "is-pending";
        const tutoresAdicionales = fichaTutoresAdicionales(ficha.pasajeroNumeroDocumento);
        const planTexto = fichaPlanTexto(ficha.planNombre, ficha.planCuotas);
        const assignmentColumn = estadoRevision === "aprobada" ? renderFichaApprovedColumn(ficha) : `
              <article class="admin-fichas-detail-card admin-fichas-detail-card--wide">
                <h3>Asignar grupo y contrato</h3>
                ${renderFichaAssignmentControls(ficha)}
                <div class="admin-fichas-assigned-note">
                  <span>Asignado</span>
                  <strong>${escapeHtml(context.selectedGroup ? `${context.selectedGroup.colegio} · ${context.selectedGroup.curso} ${context.selectedGroup.division}` : "Pendiente")}</strong>
                  <strong class="admin-fichas-contract-code">${escapeHtml(context.codigoContrato || "Contrato pendiente")}</strong>
                </div>
                ${renderFichaValidationResult(ficha)}
                ${renderFichaApprovalChecklist(ficha)}
                ${renderFichaActionButtons(ficha)}
              </article>
        `;

        return `
          <section class="admin-turismo-panel admin-fichas-detail" data-admin-fichas-detail>
            <div class="admin-fichas-detail-head">
              <div>
                <span class="admin-pasajeros-status ${estadoClass}">${escapeHtml(estadoRevision)}</span>
                <h2>${escapeHtml(fichaNombreCompleto(ficha.pasajeroApellido, ficha.pasajeroNombre) || "Ficha sin nombre")}</h2>
                <p>Preinscripción virtual lista para revisar, asignar y dar de alta oficialmente.</p>
              </div>
              <div class="admin-fichas-detail-head-actions">
                <button type="button" class="admin-pasajeros-primary-button" data-ficha-pdf="${escapeHtml(ficha.id)}">⬇ Descargar PDF</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-ficha-cerrar>Cerrar ficha</button>
              </div>
            </div>

            <div class="admin-fichas-detail-layout">
              <article class="admin-fichas-detail-card admin-fichas-detail-card--wide admin-fichas-pertenencia">
                <h3>Pertenencia</h3>
                <dl class="admin-fichas-pertenencia-grid">
                  ${renderFichaValue("Colegio", ficha.colegio)}
                  ${renderFichaValue("Curso", ficha.nivel)}
                  ${renderFichaValue("Grado/Año", ficha.grado)}
                  ${renderFichaValue("División", ficha.division)}
                  ${renderFichaValue("Plan", planTexto)}
                  ${renderFichaValue("Contrato", ficha.codigoContrato)}
                  ${renderFichaValue("Viaje", ficha.viaje)}
                </dl>
                ${renderFichaVincularColegio(ficha)}
              </article>

              <article class="admin-fichas-detail-card admin-fichas-student-card">
                <h3>Datos del pasajero</h3>
                <dl>
                  ${renderFichaValue("Nombre/s", ficha.pasajeroNombre)}
                  ${renderFichaValue("Apellido/s", ficha.pasajeroApellido)}
                  ${renderFichaValue("Tipo de documento", ficha.pasajeroTipoDocumento)}
                  ${renderFichaValue("Documento", ficha.pasajeroNumeroDocumento)}
                  ${renderFichaValue("Nacimiento", ficha.pasajeroNacimiento)}
                  ${renderFichaValue("Sexo", ficha.pasajeroSexo)}
                </dl>
              </article>

              <article class="admin-fichas-detail-card">
                <h3>Tutor principal</h3>
                <dl>
                  ${renderFichaValue("Nombre/s", ficha.responsableNombre)}
                  ${renderFichaValue("Apellido/s", ficha.responsableApellido)}
                  ${renderFichaValue("Tipo de documento", ficha.responsableTipoDocumento)}
                  ${renderFichaValue("Documento", ficha.responsableNumeroDocumento)}
                  ${renderFichaValue("Nacimiento", ficha.responsableNacimiento)}
                  ${renderFichaValue("Parentesco", ficha.responsableParentesco)}
                  ${renderFichaValue("CUIL/CUIT", formatearCuil(ficha.responsableCuilCuit))}
                  ${renderFichaValue("Correo", ficha.responsableEmail)}
                  ${renderFichaValue("Celular", ficha.responsableCelular)}
                  ${renderFichaValue("Teléfono alternativo", ficha.responsableTelefono || "—")}
                </dl>
                <h3>Tutores adicionales</h3>
                ${tutoresAdicionales.length ? `
                  <ul class="admin-fichas-tutores">
                    ${tutoresAdicionales.map((tutor) => `
                      <li>
                        <strong>${escapeHtml(fichaNombreCompleto(tutor.apellido, tutor.nombre))}</strong>
                        <span>${escapeHtml(tutor.parentesco)} · ${escapeHtml(tutor.celular)} · ${escapeHtml(tutor.email)}</span>
                        <span>Estado: ${escapeHtml(tutor.estado_revision)}</span>
                      </li>
                    `).join("")}
                  </ul>
                ` : `<p>Sin tutores adicionales registrados.</p>`}
              </article>

              <article class="admin-fichas-detail-card">
                <h3>Domicilio</h3>
                <dl>
                  ${renderFichaValue("Calle", ficha.domicilioCalle)}
                  ${renderFichaValue("Número", ficha.domicilioNumero)}
                  ${renderFichaValue("Piso", ficha.domicilioPiso || "—")}
                  ${renderFichaValue("Departamento", ficha.domicilioDepartamento || "—")}
                  ${renderFichaValue("Barrio", ficha.domicilioBarrio || "—")}
                  ${renderFichaValue("Localidad", ficha.domicilioLocalidad)}
                  ${renderFichaValue("Provincia", ficha.domicilioProvincia)}
                  ${renderFichaValue("Código postal", ficha.domicilioCodigoPostal)}
                </dl>
                <h3>Documentación y firma</h3>
                <dl class="admin-fichas-doc-grid">
                  ${renderFichaValue("Ficha médica", fichaMedica)}
                  ${renderFichaValue("Ficha de adhesión", fichaAdhesion)}
                  ${renderFichaValue("Condiciones aceptadas", ficha.aceptaCondiciones ? "Sí" : "")}
                  ${renderFichaValue("Firma registrada", ficha.firmaRegistrada || ficha.firma ? "Sí" : "")}
                </dl>
                ${signatureDataUrl ? `
                  <div class="admin-fichas-signature-preview">
                    <span>Firma del tutor</span>
                    <img src="${escapeHtml(signatureDataUrl)}" alt="Firma registrada del tutor">
                  </div>
                ` : ""}
                ${ficha.motivoRechazo ? `<p class="admin-fichas-reject-note"><strong>Motivo rechazo:</strong> ${escapeHtml(ficha.motivoRechazo)}</p>` : ""}
              </article>

              <article class="admin-fichas-detail-card">
                <h3>Correo al tutor</h3>
                <p>${renderFichaEmailBadge(ficha)} ${ficha.emailEnviadoAt ? `Enviado el ${escapeHtml(formatFichaApprovalDate({ updatedAt: ficha.emailEnviadoAt }))}` : ""}</p>
                ${ficha.emailEstado === "sin_configurar" ? `<p>El envío de correos todavía no está activado (falta configurar Resend).</p>` : ""}
                ${ficha.emailError ? `<p class="admin-fichas-reject-note">${escapeHtml(ficha.emailError)}</p>` : ""}
                <button type="button" class="admin-pasajeros-secondary-button" data-ficha-reenviar-correo="${escapeHtml(ficha.id)}">Reenviar correo</button>
              </article>

              ${assignmentColumn}
            </div>
          </section>
        `;
      }

      async function approveFichaAdhesionAndCreatePassenger(id) {
        const now = new Date().toISOString();
        const fichas = loadFichasAdhesionDemo();
        const ficha = fichas.find((item) => item.id === id);
        if (!ficha) return;
        if ((ficha.estadoRevision || "pendiente") === "aprobada") {
          adminFichasMessage = "Esta ficha ya estaba aprobada. No se creó otro pasajero.";
          renderAdminFichasRecibidas();
          return;
        }
        const validation = fichaValidationResult(ficha);
        if (!validation.canApprove) {
          adminFichasMessage = `No se puede aprobar: estado sugerido ${validation.suggested}. Revisá el Resultado de validación.`;
          renderAdminFichasRecibidas();
          return;
        }
        if (!canApproveFicha(ficha)) {
          adminFichasMessage = "Faltan validaciones para aprobar. Revisá el checklist visible.";
          renderAdminFichasRecibidas();
          return;
        }
        if (!ficha.asignacionGrupo?.grupoId) {
          adminFichasMessage = "Antes de aprobar, asigná explícitamente nivel, viaje, colegio y curso/división.";
          renderAdminFichasRecibidas();
          return;
        }
        const context = fichaAssignmentContext(ficha);
        const group = adminPasajerosDemo.find((item) => item.id === context.grupoId);
        if (!group) {
          adminFichasMessage = "Antes de aprobar, asigná un grupo válido para crear el pasajero.";
          renderAdminFichasRecibidas();
          return;
        }
        if (!context.contratoId) {
          adminFichasMessage = "Antes de aprobar, asigná un contrato válido.";
          renderAdminFichasRecibidas();
          return;
        }
        const dni = normalizeFichaDni(ficha.pasajeroNumeroDocumento || ficha.pasajeroDni);
        if (!dni) {
          adminFichasMessage = "La ficha no tiene DNI de pasajero. Revisala antes de aprobar.";
          renderAdminFichasRecibidas();
          return;
        }
        const duplicatedDni = adminPasajerosDemo.some((adminGroup) => (
          adminGroup.pasajeros.some((passenger) => normalizeFichaDni(passenger.dni) === dni)
        ));
        if (duplicatedDni) {
          adminFichasMessage = "Ese DNI ya existe en pasajeros. No se creó un pasajero duplicado.";
          renderAdminFichasRecibidas();
          return;
        }
        group.pasajeros.push({
          nombre: String(ficha.pasajeroNombre || "").trim(),
          apellido: String(ficha.pasajeroApellido || "").trim(),
          dni,
          contratoId: context.contratoId,
          codigoContrato: context.codigoContrato,
          nacimiento: String(ficha.pasajeroNacimiento || "").trim(),
          telefono: String(ficha.responsableCelular || "").trim(),
          responsable: String(ficha.responsableNombre || "").trim(),
          responsableApellido: String(ficha.responsableApellido || "").trim(),
          responsableDni: String(ficha.responsableNumeroDocumento || "").trim(),
          responsableTelefono: String(ficha.responsableCelular || ficha.responsableTelefono || "").trim(),
          responsableEmail: String(ficha.responsableEmail || "").trim(),
          responsableCuilCuit: String(ficha.responsableCuilCuit || "").trim(),
          vinculo: String(ficha.responsableParentesco || "").trim(),
          planPagoId: String(ficha.planPagoId || "").trim(),
          planNombre: String(ficha.planNombre || "").trim(),
          planCuotas: String(ficha.planCuotas || "").trim(),
          estado: "Activo",
          pago: "Pendiente",
          documentacion: "Pendiente",
          fichaMedica: "Pendiente",
          planPago: "Regular",
          valorViaje: "",
          sena: "",
          cuotas: "",
          pagado: "",
          saldo: "",
          proximaCuota: "",
          observaciones: "Creado desde ficha de adhesión aprobada."
        });
        saveAdminPasajerosDemo();
        const saved = await saveFichasAdhesionDemo(fichas.map((item) => (
          item.id === id
            ? {
              ...item,
              estadoRevision: "aprobada",
              colegio: group.colegio,
              cursoDivision: `${group.curso} ${group.division}`,
              grupoAsignadoId: group.id,
              asignacionGrupo: {
                nivel: group.nivel,
                viaje: group.viaje,
                colegio: group.colegio,
                grupoId: group.id,
                contratoId: context.contratoId,
                codigoContrato: context.codigoContrato
              },
              contratoId: context.contratoId,
              codigoContrato: context.codigoContrato,
              documentacionEstado: item.documentacionEstado || "Pendiente",
              fichaMedicaEstado: item.fichaMedicaEstado || "Pendiente",
              autorizacionEstado: item.autorizacionEstado || "Pendiente",
              updatedAt: now
            }
            : item
        )));
        adminPasajerosNivel = group.nivel;
        adminPasajerosViaje = group.viaje;
        adminPasajerosColegio = group.colegio;
        adminPasajerosGrupoId = group.id;
        adminFichasFilter = "aprobadas";
        adminFichasSelectedId = id;
        adminFichasSaveMessage(saved, "Guardado en la base de datos. Ficha aprobada y pasajero creado.");
        renderAdminFichasRecibidas();
      }

      function normalizeFichaSearchText(value) {
        return normalizeText(value)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      }

      function fichaMatchesText(ficha, search) {
        const needle = normalizeFichaSearchText(search);
        if (!needle) return true;
        return [
          ficha.pasajeroNombre,
          ficha.pasajeroApellido,
          ficha.pasajeroNumeroDocumento,
          ficha.pasajeroDni,
          ficha.responsableNombre,
          ficha.responsableApellido,
          ficha.responsableCelular,
          ficha.colegio
        ].some((value) => normalizeFichaSearchText(value).includes(needle));
      }

      function fichaFilterValue(ficha, field) {
        if (field === "colegio") return ficha.colegio || "";
        if (field === "viaje") return ficha.viaje || "";
        return "";
      }

      function renderAdminFichasFilters(colegios = [], viajes = []) {
        return `
          <div class="admin-fichas-filters" aria-label="Filtros de fichas">
            <label>Buscar por nombre, apellido, DNI o colegio
              <input type="search" value="${escapeHtml(adminFichasSearch)}" placeholder="Ej: Benítez, 47555666" data-admin-fichas-search>
            </label>
            <label>Colegio
              <select data-admin-fichas-filter-colegio>
                <option value="">Todos los colegios</option>
                ${colegios.map((colegio) => `<option value="${escapeHtml(colegio)}" ${colegio === adminFichasFilterColegio ? "selected" : ""}>${escapeHtml(colegio)}</option>`).join("")}
              </select>
            </label>
            <label>Viaje
              <select data-admin-fichas-filter-viaje>
                <option value="">Todos los viajes</option>
                ${viajes.map((viaje) => `<option value="${escapeHtml(viaje)}" ${viaje === adminFichasFilterViaje ? "selected" : ""}>${escapeHtml(viaje)}</option>`).join("")}
              </select>
            </label>
            <label class="admin-fichas-sin-vincular">
              <input type="checkbox" data-admin-fichas-sin-vincular ${adminFichasSinVincular ? "checked" : ""}>
              Solo colegio sin vincular
            </label>
          </div>
        `;
      }

      function renderAdminFichasRejectModal() {
        if (!adminFichasRejectId) return "";
        const ficha = loadFichasAdhesionDemo().find((item) => item.id === adminFichasRejectId);
        return `
          <div class="admin-modal-backdrop" role="presentation">
            <section class="admin-modal-card admin-fichas-reject-modal" role="dialog" aria-modal="true" aria-labelledby="admin-fichas-reject-title">
              <div class="admin-modal-head">
              <div>
                <span class="admin-pasajeros-status is-alert">Rechazo</span>
                <h2 id="admin-fichas-reject-title">Rechazar ficha</h2>
                <p>${escapeHtml(ficha?.pasajeroNombre || "Ficha seleccionada")}</p>
              </div>
              </div>
              <label>Motivo del rechazo
                <textarea data-ficha-reject-reason rows="4" placeholder="Ej: falta documentación obligatoria"></textarea>
              </label>
              ${adminFichasRejectError ? `<p class="admin-fichas-modal-error">${escapeHtml(adminFichasRejectError)}</p>` : ""}
              <div class="admin-fichas-modal-actions">
                <button type="button" data-ficha-reject-confirm="${escapeHtml(adminFichasRejectId)}">Confirmar rechazo</button>
                <button type="button" data-ficha-reject-cancel>Cancelar</button>
              </div>
            </section>
          </div>
        `;
      }

      async function viewFichaAdhesionDetail(id) {
        const ficha = loadFichasAdhesionDemo().find((item) => item.id === id);
        if (!ficha) return;
        adminFichasManuallyClosed = false;
        adminFichasSelectedId = id;
        renderAdminFichasRecibidas();
      }

      async function startFichaAdhesionReview(id) {
        adminFichasManuallyClosed = false;
        adminFichasSelectedId = id;
        adminFichasFilter = "revision";
        await updateFichaAdhesionStatus(id, "revisada", {}, "Guardado en la base de datos. Ficha marcada en revisión.");
      }

      function fichaAdhesionDemoRows(fichas = loadFichasAdhesionDemo()) {
        if (!fichas.length) {
          return `
            <tr>
              <td colspan="7">No hay fichas en esta bandeja.</td>
            </tr>
          `;
        }
        return fichas.map((ficha) => {
          const estadoRevision = ficha.estadoRevision || "pendiente";
          const estadoClass = estadoRevision === "aprobada" ? "is-ok" : ["rechazada", "duplicada"].includes(estadoRevision) ? "is-alert" : "is-pending";
          return `
          <tr class="${ficha.id === adminFichasSelectedId ? "is-selected" : ""}">
            <td class="admin-fichas-main-cell">
              <strong>${escapeHtml(fichaNombreCompleto(ficha.pasajeroApellido, ficha.pasajeroNombre) || "Sin nombre")}</strong>
              <span>DNI ${escapeHtml(ficha.pasajeroNumeroDocumento || "Pendiente")}</span>
              <span>Tutor: ${escapeHtml(fichaNombreCompleto(ficha.responsableApellido, ficha.responsableNombre) || "Pendiente")}</span>
            </td>
            <td>
              <strong>${escapeHtml(ficha.colegio || "Pendiente")}</strong>
              ${ficha.colegioVinculado ? "" : `<span class="admin-pasajeros-status is-alert">Sin vincular</span>`}
              <span>${escapeHtml(ficha.viaje || "")}</span>
            </td>
            <td>
              <strong>${escapeHtml([ficha.nivel, ficha.grado, ficha.division].filter(Boolean).join(" ") || "Pendiente")}</strong>
              <span>Contrato: ${escapeHtml(ficha.codigoContrato || "Pendiente")}</span>
            </td>
            <td>${escapeHtml(ficha.planNombre || "Pendiente")}</td>
            <td><span class="admin-pasajeros-status ${estadoClass}">${escapeHtml(estadoRevision)}</span></td>
            <td>${renderFichaEmailBadge(ficha)}</td>
            <td>
              <div class="admin-pasajeros-row-actions admin-fichas-row-actions">
                <button type="button" data-ficha-select="${escapeHtml(ficha.id)}">Ver ficha</button>
                <button type="button" data-ficha-pdf="${escapeHtml(ficha.id)}">PDF</button>
              </div>
            </td>
          </tr>
        `;
        }).join("");
      }

      // Fichas del formulario corto de Tutor: se revisan acá y se muestran
      // también dentro de la ficha y del perfil del pasajero con el mismo DNI.
      function renderAdminFichasTutorTabla(tutores = adminFichasTutor) {
        const search = normalizeFichaSearchText(adminFichasSearch);
        const visibles = tutores.filter((tutor) => !search || [tutor.nombre, tutor.apellido, tutor.numero_documento, tutor.pasajero_nombre, tutor.pasajero_apellido, tutor.pasajero_dni]
          .some((value) => normalizeFichaSearchText(value).includes(search)));
        const dnisConFicha = new Set([
          ...loadFichasAdhesionDemo().map((ficha) => normalizeFichaDni(ficha.pasajeroNumeroDocumento)),
          ...adminPasajerosRows().map(({ passenger }) => normalizeFichaDni(passenger.dni))
        ].filter(Boolean));
        return `
          <div class="admin-pasajeros-table-wrap">
            <table class="admin-pasajeros-table admin-fichas-table">
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Pasajero a cargo</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${visibles.length ? visibles.map((tutor) => `
                  <tr>
                    <td class="admin-fichas-main-cell">
                      <strong>${escapeHtml(fichaNombreCompleto(tutor.apellido, tutor.nombre))}</strong>
                      <span>${escapeHtml(tutor.tipo_documento)} ${escapeHtml(tutor.numero_documento)} · CUIL ${escapeHtml(formatearCuil(tutor.cuil_cuit))}</span>
                      <span>${escapeHtml(tutor.parentesco)}</span>
                    </td>
                    <td>
                      <strong>${escapeHtml(fichaNombreCompleto(tutor.pasajero_apellido, tutor.pasajero_nombre))}</strong>
                      <span>DNI ${escapeHtml(tutor.pasajero_dni)}</span>
                      ${dnisConFicha.has(normalizeFichaDni(tutor.pasajero_dni))
                        ? `<span class="admin-pasajeros-status is-ok">Pasajero registrado</span>`
                        : `<span class="admin-pasajeros-status is-pending">Pasajero todavía no registrado</span>`}
                    </td>
                    <td>
                      <strong>${escapeHtml(tutor.celular)}</strong>
                      <span>${escapeHtml(tutor.email)}</span>
                    </td>
                    <td>
                      <select data-ficha-tutor-estado="${escapeHtml(tutor.id)}" aria-label="Estado de la ficha de tutor">
                        ${["pendiente", "revisada", "observada", "rechazada"].map((estado) => `<option value="${estado}" ${estado === tutor.estado_revision ? "selected" : ""}>${estado}</option>`).join("")}
                      </select>
                    </td>
                  </tr>
                `).join("") : `<tr><td colspan="4">No hay fichas de tutor.</td></tr>`}
              </tbody>
            </table>
          </div>
        `;
      }

      function parseAdminMoney(value) {
        const normalized = String(value || "").replace(/[^\d.-]/g, "");
        const number = Number(normalized);
        return Number.isFinite(number) ? number : 0;
      }

      function formatAdminMoney(value) {
        const amount = parseAdminMoney(value);
        if (!amount) return "Pendiente";
        return amount.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0
        });
      }

      function passengerPaymentData(passenger) {
        return window.ElAngelAzulPayments.paymentData(passenger);
      }

      function passengerInstallments(passenger) {
        return window.ElAngelAzulPayments.installments(passenger);
      }

      function installmentSummary(passenger) {
        return window.ElAngelAzulPayments.installmentSummary(passenger);
      }

      function renderInstallmentCells(passenger) {
        const installments = passengerInstallments(passenger);
        const firstUnpaidIndex = installments.findIndex((installment) => installment.status !== "Pagada");
        const startIndex = Math.max(0, firstUnpaidIndex === -1 ? installments.length - 4 : firstUnpaidIndex - 1);
        const visibleInstallments = installments.slice(startIndex, startIndex + 4);
        const hiddenCount = installments.length - visibleInstallments.length;
        const cells = visibleInstallments.map((installment) => `
          <span class="admin-installment-pill ${adminStatusClass(installment.status)}">
            C${installment.number}: ${escapeHtml(installment.status)}
          </span>
        `).join("");
        return `
          ${cells}
          ${hiddenCount > 0 ? `<span class="admin-installment-pill is-neutral">+${hiddenCount} cuotas en detalle</span>` : ""}
        `;
      }

      function passengerPaymentHistory(passenger) {
        return window.ElAngelAzulPayments.paymentHistory(passenger);
      }

      function renderPaymentHistoryCells(passenger) {
        return passengerPaymentHistory(passenger).map((item) => `
          <div class="admin-payment-history-item">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.concept)} · ${escapeHtml(formatAdminMoney(item.amount))}</strong>
            <small>${escapeHtml(item.method)} · ${escapeHtml(item.status)}</small>
          </div>
        `).join("");
      }

      function adminStatusClass(value) {
        const normalized = String(value || "").toLowerCase();
        if (normalized.includes("no cargada")) return "is-pending";
        if (normalized.includes("día") || normalized.includes("completa") || normalized.includes("activo") || normalized.includes("cargada") || normalized.includes("aprobada") || normalized.includes("pagada")) return "is-ok";
        if (normalized.includes("vencido") || normalized.includes("vencida") || normalized.includes("rechazada") || normalized.includes("baja") || normalized.includes("observada")) return "is-alert";
        return "is-pending";
      }

      function uniqueValues(items, key) {
        return [...new Set(items.map((item) => item[key]).filter(Boolean))];
      }

      const passengerArchitecture = {
        passengers: "Alta, busqueda, filtros, ficha individual y estados operativos.",
        groups: "Viaje, colegio, curso y division. Hoy usa localStorage y queda listo para backend.",
        payments: "Resumen, cuotas, saldo e historial preparado para pagos reales.",
        forms: "Fichas de adhesion: recibida, revision, asignacion, aprobacion y creacion de pasajero.",
        portal: "Consulta simple del pasajero con DNI y codigo de contrato.",
        persistence: "Capa de colecciones con localStorage temporal y providers preparados para Google Sheets, Supabase o Firebase."
      };

      window.ElAngelAzulPassengerModules = passengerArchitecture;

      function adminPasajerosRows() {
        return window.ElAngelAzulPassengers.rows(adminPasajerosDemo, passengerPaymentData);
      }

      function adminPasajerosFilteredRows() {
        return window.ElAngelAzulPassengers.filterRows(adminPasajerosRows(), {
          search: adminPasajerosSearch,
          viaje: adminPasajerosFilterViaje,
          colegio: adminPasajerosFilterColegio,
          curso: adminPasajerosFilterCurso,
          estado: adminPasajerosFilterEstado,
          normalizeText: normalizeFichaSearchText
        });
      }

      function adminPasajerosSelectedRecord() {
        if (!adminPasajerosSelectedDni) return null;
        return adminPasajerosRows().find(({ passenger }) => String(passenger.dni) === String(adminPasajerosSelectedDni)) || null;
      }

      function renderAdminPasajerosTableRows(rows) {
        return rows.length ? rows.map(({ group, passenger, payment }) => {
          const isSelected = String(passenger.dni) === String(adminPasajerosSelectedDni);
          return `
            <tr class="${isSelected ? "is-selected" : ""}">
              <td class="admin-pasajeros-passenger-cell">
                <strong>${escapeHtml(adminPasajeroNombreCompleto(passenger))}</strong>
                <span>DNI ${escapeHtml(passenger.dni || "Pendiente")}</span>
              </td>
              <td class="admin-pasajeros-contact-cell">
                <strong>${escapeHtml(passenger.telefono || passenger.responsableTelefono || "Sin teléfono")}</strong>
                <span>Resp. ${escapeHtml(passenger.responsableTelefono || "Pendiente")}</span>
              </td>
              <td>${escapeHtml(fichaNombreCompleto(passenger.responsableApellido, passenger.responsable) || "Pendiente")}</td>
              <td class="admin-pasajeros-group-cell">
                <strong>${escapeHtml(group.colegio)}</strong>
                <span>${escapeHtml(group.nivel)} · ${escapeHtml(group.curso)} ${escapeHtml(group.division)} · ${escapeHtml(group.viaje)}</span>
                <span>Contrato: ${escapeHtml(passengerCodigoContrato(passenger) || "Pendiente")}</span>
              </td>
              <td>${escapeHtml(fichaPlanTexto(passenger.planNombre, passenger.planCuotas) || "Pendiente")}</td>
              <td><span class="admin-pasajeros-status ${adminStatusClass(payment.estadoPago)}">${escapeHtml(payment.estadoPago)}</span></td>
              <td><span class="admin-pasajeros-status ${adminStatusClass(passenger.documentacion)}">${escapeHtml(passenger.documentacion)}</span></td>
              <td><span class="admin-pasajeros-status ${adminStatusClass(passenger.estado)}">${escapeHtml(passenger.estado)}</span></td>
              <td>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-open-profile="${escapeHtml(passenger.dni || "")}">
                  ${isSelected ? "Ficha abierta" : "Ver ficha"}
                </button>
              </td>
            </tr>
          `;
        }).join("") : `
          <tr>
            <td colspan="9">No hay pasajeros que coincidan con la búsqueda o los filtros aplicados.</td>
          </tr>
        `;
      }

      function bindAdminPasajerosProfileButtons(root = document) {
        root.querySelectorAll("[data-admin-pasajeros-open-profile]").forEach((button) => {
          button.addEventListener("click", () => {
            adminPasajerosSelectedDni = button.dataset.adminPasajerosOpenProfile || "";
            adminPasajerosShowForm = false;
            adminPasajerosFormError = "";
            adminPasajerosEditMode = false;
            adminPasajerosEditError = "";
            renderAdminPasajeros();
          });
        });
      }

      function updateAdminPasajerosSearchResults() {
        const filteredRows = adminPasajerosFilteredRows();
        const tableBody = document.querySelector("[data-admin-pasajeros-results]");
        const count = document.querySelector("[data-admin-pasajeros-results-count]");
        if (tableBody) {
          tableBody.innerHTML = renderAdminPasajerosTableRows(filteredRows);
          bindAdminPasajerosProfileButtons(tableBody);
        }
        if (count) {
          count.textContent = `${filteredRows.length} / ${adminPasajerosRows().length}`;
        }
      }

      function renderAdminPasajerosSelect(name, value, options, placeholder) {
        return `
          <label>${escapeHtml(placeholder)}
            <select name="${escapeHtml(name)}" data-admin-pasajeros-filter="${escapeHtml(name)}">
              <option value="">Todos</option>
              ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
            </select>
          </label>
        `;
      }

      function renderAdminPasajerosProfile() {
        const record = adminPasajerosSelectedRecord();
        if (!record) return "";
        const { group, passenger, payment } = record;
        const installments = passengerInstallments(passenger);
        const paidInstallments = installments.filter((installment) => installment.status === "Pagada").length;
        const pendingInstallments = installments.length - paidInstallments;
        const isEditing = adminPasajerosEditMode;
        const editError = adminPasajerosEditError;

        if (isEditing) {
          const contractOptions = adminContratoOptionsForGroup(group.id);
          return `
            <section class="admin-turismo-panel admin-pasajeros-profile" data-admin-pasajeros-profile>
              <div class="admin-pasajeros-section-head">
                <div>
                  <h2>Editando ficha</h2>
                  <p>${escapeHtml(passenger.nombre)} · DNI ${escapeHtml(passenger.dni || "Pendiente")}</p>
                </div>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-cancel-edit>Cancelar edición</button>
              </div>

              ${editError ? `<div class="admin-pasajeros-form-error"><strong>Revisar:</strong> ${escapeHtml(editError)}</div>` : ""}

              <form class="admin-pasajeros-form admin-pasajeros-edit-form" data-admin-pasajeros-edit-form novalidate>

                <fieldset>
                  <legend>Datos del pasajero</legend>
                  <label>Nombre/s <span class="admin-pasajeros-required">*</span>
                    <input name="nombre" value="${escapeHtml(passenger.nombre)}" required>
                  </label>
                  <label>Apellido/s <span class="admin-pasajeros-required">*</span>
                    <input name="apellido" value="${escapeHtml(passenger.apellido || "")}" required>
                  </label>
                  <label>DNI <span class="admin-pasajeros-required">*</span>
                    <input name="dni" value="${escapeHtml(passenger.dni)}" required>
                  </label>
                  <label>Fecha de nacimiento
                    <input name="nacimiento" type="date" value="${escapeHtml(passenger.nacimiento || "")}">
                  </label>
                  <label>Teléfono del pasajero
                    <input name="telefono" value="${escapeHtml(passenger.telefono || "")}">
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Responsable</legend>
                  <label>Nombre y apellido <span class="admin-pasajeros-required">*</span>
                    <input name="responsable" value="${escapeHtml(passenger.responsable || "")}" required>
                  </label>
                  <label>DNI del responsable
                    <input name="responsableDni" value="${escapeHtml(passenger.responsableDni || "")}">
                  </label>
                  <label>Teléfono del responsable <span class="admin-pasajeros-required">*</span>
                    <input name="responsableTelefono" value="${escapeHtml(passenger.responsableTelefono || "")}" required>
                  </label>
                  <label>Vínculo
                    <input name="vinculo" value="${escapeHtml(passenger.vinculo || "")}" placeholder="Madre, padre, tutor">
                  </label>
                  <label>CUIL / CUIT del responsable
                    <input name="responsableCuilCuit" value="${escapeHtml(passenger.responsableCuilCuit || "")}" placeholder="20-12345678-9">
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Contrato</legend>
                  <label>Contrato asociado <span class="admin-pasajeros-required">*</span>
                    <select name="contratoId" required>
                      <option value="">Seleccionar contrato</option>
                      ${contractOptions.map((c) => `<option value="${escapeHtml(c.id)}" ${c.id === passenger.contratoId ? "selected" : ""}>${escapeHtml(c.codigo_contrato)}</option>`).join("")}
                    </select>
                  </label>
                  ${contractOptions.length === 0 ? `<p class="admin-pasajeros-modal-note">No hay contratos disponibles para este grupo. Creá uno primero en la sección Contratos.</p>` : ""}
                  <label>Plan de pago
                    <select name="planPagoId">
                      <option value="">Pendiente</option>
                      ${adminPlanesPago.filter((plan) => plan.contrato_id === passenger.contratoId && (plan.activo === "TRUE" || plan.id === passenger.planPagoId)).map((plan) => `<option value="${escapeHtml(plan.id)}" ${plan.id === passenger.planPagoId ? "selected" : ""}>${escapeHtml(fichaPlanTexto(plan.nombre, plan.cuotas))}</option>`).join("")}
                    </select>
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Estados</legend>
                  <label>Estado del pasajero
                    <select name="estado">
                      ${["Activo", "Pendiente", "Baja"].map((opt) => `<option ${passenger.estado === opt ? "selected" : ""}>${opt}</option>`).join("")}
                    </select>
                  </label>
                  <label>Documentación
                    <select name="documentacion">
                      ${["Pendiente", "Completa", "Rechazada"].map((opt) => `<option ${passenger.documentacion === opt ? "selected" : ""}>${opt}</option>`).join("")}
                    </select>
                  </label>
                  <label>Ficha médica
                    <select name="fichaMedica">
                      ${["Pendiente", "Cargada", "Observada"].map((opt) => `<option ${passenger.fichaMedica === opt ? "selected" : ""}>${opt}</option>`).join("")}
                    </select>
                  </label>
                  <label>Estado de pago
                    <select name="pago">
                      ${["Pendiente", "Al día", "Vencido"].map((opt) => `<option ${passenger.pago === opt ? "selected" : ""}>${opt}</option>`).join("")}
                    </select>
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Observaciones internas</legend>
                  <label style="grid-column: 1 / -1">Observaciones
                    <textarea name="observaciones" rows="3">${escapeHtml(passenger.observaciones || "")}</textarea>
                  </label>
                </fieldset>

                <div class="admin-pasajeros-form-actions">
                  <button type="submit" class="admin-pasajeros-primary-button">Guardar cambios</button>
                  <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-cancel-edit>Cancelar</button>
                </div>
              </form>
            </section>
          `;
        }

        return `
          <section class="admin-turismo-panel admin-pasajeros-profile" data-admin-pasajeros-profile>
            <div class="admin-pasajeros-section-head">
              <div>
                <h2>Ficha individual</h2>
                <p>${escapeHtml(passenger.nombre)} · DNI ${escapeHtml(passenger.dni || "Pendiente")}</p>
              </div>
              <div class="admin-pasajeros-profile-actions">
                <button type="button" class="admin-pasajeros-primary-button" data-admin-pasajeros-open-edit>Editar ficha</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-close-profile>Cerrar ficha</button>
              </div>
            </div>

            <div class="admin-pasajeros-profile-hero">
              <div>
                <span>Pasajero</span>
                <strong>${escapeHtml(passenger.nombre)}</strong>
                <p>${escapeHtml(group.viaje)} · ${escapeHtml(group.colegio)} · ${escapeHtml(group.curso)} ${escapeHtml(group.division)}</p>
              </div>
              <div class="admin-pasajeros-profile-statuses">
                <span class="admin-pasajeros-status ${adminStatusClass(passenger.estado)}">${escapeHtml(passenger.estado || "Pendiente")}</span>
                <span class="admin-pasajeros-status ${adminStatusClass(payment.estadoPago)}">${escapeHtml(payment.estadoPago || "Pendiente")}</span>
                <span class="admin-pasajeros-status ${adminStatusClass(passenger.documentacion)}">${escapeHtml(passenger.documentacion || "Pendiente")}</span>
                <span class="admin-pasajeros-status ${adminStatusClass(passenger.fichaMedica)}">${escapeHtml(passenger.fichaMedica || "Pendiente")} (médica)</span>
              </div>
            </div>

            <article class="admin-fichas-detail-card admin-pasajeros-pertenencia">
              <h3>Pertenencia</h3>
              <dl class="admin-fichas-pertenencia-grid">
                ${renderFichaValue("Colegio", group.colegio)}
                ${renderFichaValue("Curso", group.nivel)}
                ${renderFichaValue("Grado/Año", group.curso)}
                ${renderFichaValue("División", group.division)}
                ${renderFichaValue("Plan", fichaPlanTexto(passenger.planNombre, passenger.planCuotas))}
                ${renderFichaValue("Contrato", passengerCodigoContrato(passenger))}
                ${renderFichaValue("Tutor", fichaNombreCompleto(passenger.responsableApellido, passenger.responsable))}
              </dl>
            </article>

            <div class="admin-pasajeros-profile-grid">
              <article>
                <span>Datos personales</span>
                <strong>${escapeHtml(adminPasajeroNombreCompleto(passenger))}</strong>
                <dl>
                  <div><dt>DNI</dt><dd>${escapeHtml(passenger.dni || "Pendiente")}</dd></div>
                  <div><dt>Nacimiento</dt><dd>${escapeHtml(passenger.nacimiento || "Pendiente")}</dd></div>
                  <div><dt>Teléfono</dt><dd>${escapeHtml(passenger.telefono || "Pendiente")}</dd></div>
                </dl>
              </article>
              <article>
                <span>Tutor principal</span>
                <strong>${escapeHtml(fichaNombreCompleto(passenger.responsableApellido, passenger.responsable) || "Pendiente")}</strong>
                <dl>
                  <div><dt>Vínculo</dt><dd>${escapeHtml(passenger.vinculo || "Pendiente")}</dd></div>
                  <div><dt>DNI</dt><dd>${escapeHtml(passenger.responsableDni || "Pendiente")}</dd></div>
                  <div><dt>CUIL / CUIT</dt><dd>${escapeHtml(formatearCuil(passenger.responsableCuilCuit) || "Pendiente")}</dd></div>
                  <div><dt>Teléfono</dt><dd>${escapeHtml(passenger.responsableTelefono || "Pendiente")}</dd></div>
                  <div><dt>Correo</dt><dd>${escapeHtml(passenger.responsableEmail || "Pendiente")}</dd></div>
                </dl>
              </article>
              <article>
                <span>Tutores adicionales</span>
                ${fichaTutoresAdicionales(passenger.dni).length ? `<dl>${fichaTutoresAdicionales(passenger.dni).map((tutor) => `
                  <div><dt>${escapeHtml(tutor.parentesco)}</dt><dd>${escapeHtml(fichaNombreCompleto(tutor.apellido, tutor.nombre))} · ${escapeHtml(tutor.celular)} · ${escapeHtml(tutor.email)}</dd></div>
                `).join("")}</dl>` : "<p>Sin tutores adicionales registrados.</p>"}
              </article>
              <article>
                <span>Viaje asignado</span>
                <strong>${escapeHtml(group.viaje)}</strong>
                <dl>
                  <div><dt>Nivel</dt><dd>${escapeHtml(group.nivel)}</dd></div>
                  <div><dt>Colegio</dt><dd>${escapeHtml(group.colegio)}</dd></div>
                  <div><dt>Curso / división</dt><dd>${escapeHtml(group.curso)} ${escapeHtml(group.division)}</dd></div>
                  <div><dt>Cupo esperado</dt><dd>${escapeHtml(String(group.pasajerosEsperados || "Pendiente"))}</dd></div>
                </dl>
              </article>
              <article>
                <span>Contrato</span>
                <strong>${escapeHtml(passengerCodigoContrato(passenger) || "Contrato pendiente")}</strong>
                <dl>
                  <div><dt>ID contrato</dt><dd>${escapeHtml(passengerContratoId(passenger) || "Pendiente")}</dd></div>
                  <div><dt>Regla operativa</dt><dd>Pasajero operativo requiere contrato validado</dd></div>
                </dl>
              </article>
              <article>
                <span>Estados</span>
                <dl>
                  <div><dt>Pasajero</dt><dd><span class="admin-pasajeros-status ${adminStatusClass(passenger.estado)}">${escapeHtml(passenger.estado || "Pendiente")}</span></dd></div>
                  <div><dt>Documentación</dt><dd><span class="admin-pasajeros-status ${adminStatusClass(passenger.documentacion)}">${escapeHtml(passenger.documentacion || "Pendiente")}</span></dd></div>
                  <div><dt>Ficha médica</dt><dd><span class="admin-pasajeros-status ${adminStatusClass(passenger.fichaMedica)}">${escapeHtml(passenger.fichaMedica || "Pendiente")}</span></dd></div>
                </dl>
              </article>
              <article>
                <span>Pagos</span>
                <strong>${escapeHtml(payment.estadoPago)}</strong>
                <dl>
                  <div><dt>Total</dt><dd>${escapeHtml(formatAdminMoney(payment.valorViaje))}</dd></div>
                  <div><dt>Pagado</dt><dd>${escapeHtml(formatAdminMoney(payment.pagado))}</dd></div>
                  <div><dt>Saldo</dt><dd>${escapeHtml(formatAdminMoney(payment.saldo))}</dd></div>
                  <div><dt>Cuotas</dt><dd>${escapeHtml(installmentSummary(passenger))}</dd></div>
                  <div><dt>Estado cuotas</dt><dd>${paidInstallments} pagas · ${pendingInstallments} pendientes</dd></div>
                </dl>
              </article>
              <article>
                <span>Observaciones</span>
                <p>${escapeHtml(passenger.observaciones || "Sin observaciones internas.")}</p>
              </article>
            </div>
          </section>
        `;
      }

      function renderAdminPasajerosGroupModal() {
        if (!adminPasajerosGroupModal) return "";
        const selectedGroup = adminPasajerosDemo.find((group) => group.id === adminPasajerosGrupoId) || {};
        const type = adminPasajerosGroupModal.type;
        const title = type === "colegio" ? "Crear colegio" : type === "curso" ? "Crear curso" : "Crear división";
        const actionLabel = type === "colegio" ? "Crear colegio" : type === "curso" ? "Crear curso" : "Crear división";
        const helper = type === "colegio"
          ? "Agregá un colegio dentro del viaje seleccionado y definí el primer curso/división para cargar pasajeros."
          : type === "curso"
            ? "Agregá un nuevo curso dentro del colegio seleccionado."
            : "Agregá una nueva división dentro del curso seleccionado.";
        const showColegio = type === "colegio";
        const showCurso = type === "colegio" || type === "curso";
        const contextItems = [
          ["Nivel", adminPasajerosNivel || selectedGroup.nivel || "Pendiente"],
          ["Viaje", adminPasajerosViaje || selectedGroup.viaje || "Pendiente"],
          ["Colegio", adminPasajerosColegio || selectedGroup.colegio || "Pendiente"],
          ["Curso", selectedGroup.curso || "Pendiente"],
          ["División", selectedGroup.division || "Pendiente"]
        ];
        return `
          <div class="admin-turismo-modal is-open admin-pasajeros-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
            <div class="admin-turismo-modal-backdrop" data-admin-pasajeros-close-group-modal></div>
            <div class="admin-turismo-modal-card admin-turismo-modal-card--compact admin-pasajeros-group-modal-card">
              <button type="button" class="admin-turismo-modal-close" data-admin-pasajeros-close-group-modal aria-label="Cerrar">×</button>
              <div class="admin-pasajeros-modal-header">
                <span>Gestión de grupos</span>
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(helper)}</p>
              </div>

              <div class="admin-pasajeros-modal-context" aria-label="Contexto actual">
                ${contextItems.map(([label, value]) => `
                  <div>
                    <span>${escapeHtml(label)}</span>
                    <strong>${escapeHtml(value)}</strong>
                  </div>
                `).join("")}
              </div>

              ${adminPasajerosGroupModal.error ? `<div class="admin-pasajeros-form-error">${escapeHtml(adminPasajerosGroupModal.error)}</div>` : ""}
              <form class="admin-pasajeros-form admin-pasajeros-group-form" data-admin-pasajeros-group-form>
                <fieldset>
                  <legend>${escapeHtml(actionLabel)}</legend>
                  <label>Nivel
                    <select name="nivel">
                      <option ${adminPasajerosNivel === "Primaria" ? "selected" : ""}>Primaria</option>
                      <option ${adminPasajerosNivel === "Secundaria" ? "selected" : ""}>Secundaria</option>
                    </select>
                  </label>
                  <label>Viaje
                    <input name="viaje" value="${escapeHtml(adminPasajerosViaje || selectedGroup.viaje || "")}" placeholder="Ej: Bariloche 2026" required>
                  </label>
                  <label>Colegio
                    ${renderAdminColegioSelect(showColegio ? "" : selectedGroup.colegioId || "")}
                  </label>
                  <label>Grado/Año
                    ${renderAdminGradoSelect(showCurso ? "" : selectedGroup.curso || "")}
                  </label>
                  <label>División
                    <input name="division" value="" placeholder="Ej: A" maxlength="3" required>
                  </label>
                  <label>Cupo esperado
                    <input name="pasajerosEsperados" type="number" min="0" value="${escapeHtml(String(selectedGroup.pasajerosEsperados || 0))}" placeholder="Ej: 28">
                  </label>
                </fieldset>
                <p class="admin-pasajeros-modal-note">Al confirmar, el grupo se guarda en la base de datos activa.</p>
                <div class="admin-pasajeros-form-actions">
                  <button type="submit" class="admin-pasajeros-primary-button">${escapeHtml(actionLabel)}</button>
                  <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-close-group-modal>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        `;
      }

      function renderAdminFichasRecibidas() {
        const fichas = loadFichasAdhesionDemo();
        const passengerDnis = new Set(adminPasajerosRows().map(({ passenger }) => String(passenger.dni || "").trim()).filter(Boolean));
        const fichasConPasajeroExistente = fichas.filter((ficha) => {
          const dni = String(ficha.pasajeroNumeroDocumento || ficha.pasajeroDni || "").trim();
          return dni && passengerDnis.has(dni) && (ficha.estadoRevision || "pendiente") !== "aprobada";
        }).length;
        const fichaSummary = fichas.reduce((summary, ficha) => {
          const estado = ficha.estadoRevision || "pendiente";
          summary[estado] = (summary[estado] || 0) + 1;
          return summary;
        }, { pendiente: 0, revisada: 0, observada: 0, duplicada: 0, aprobada: 0, rechazada: 0 });
        const filterMap = {
          nuevas: { label: "Nuevas", states: ["pendiente"] },
          revision: { label: "En revisión", states: ["revisada"] },
          observadas: { label: "Observadas", states: ["observada"] },
          duplicadas: { label: "Duplicadas", states: ["duplicada"] },
          aprobadas: { label: "Aprobadas", states: ["aprobada"] },
          rechazadas: { label: "Rechazadas", states: ["rechazada"] }
        };
        const activeFilter = filterMap[adminFichasFilter] ? adminFichasFilter : "nuevas";
        const stateFichas = adminFichasSearch
          ? fichas
          : fichas.filter((ficha) => filterMap[activeFilter].states.includes(ficha.estadoRevision || "pendiente"));
        const colegios = uniqueValues(fichas.map((ficha) => ({ value: fichaFilterValue(ficha, "colegio") })), "value");
        const viajes = uniqueValues(fichas.map((ficha) => ({ value: fichaFilterValue(ficha, "viaje") })), "value");
        if (adminFichasFilterColegio && !colegios.includes(adminFichasFilterColegio)) adminFichasFilterColegio = "";
        if (adminFichasFilterViaje && !viajes.includes(adminFichasFilterViaje)) adminFichasFilterViaje = "";
        const visibleFichas = stateFichas.filter((ficha) => (
          fichaMatchesText(ficha, adminFichasSearch) &&
          (!adminFichasFilterColegio || fichaFilterValue(ficha, "colegio") === adminFichasFilterColegio) &&
          (!adminFichasFilterViaje || fichaFilterValue(ficha, "viaje") === adminFichasFilterViaje) &&
          (!adminFichasSinVincular || !ficha.colegioVinculado)
        ));
        const esTutor = adminFichasTipo === "tutor";
        const selectedFichaCandidate = visibleFichas.find((ficha) => ficha.id === adminFichasSelectedId);
        const selectedFicha = adminFichasManuallyClosed ? null : selectedFichaCandidate || null;
        adminFichasSelectedId = selectedFicha?.id || "";
        document.getElementById("app").innerHTML = renderAdminShell("fichas", `
          <section class="admin-turismo-panel">
            <h1>Inscripciones</h1>
            <p>Bandeja operativa para revisar fichas, asignar grupo y aprobar la creación del pasajero.</p>
            <div class="admin-fichas-flow-summary">
              <span>${fichaSummary.pendiente || 0} nuevas</span>
              <span>${fichaSummary.revisada || 0} en revisión/asignación</span>
              <span>${fichaSummary.observada || 0} observadas</span>
              <span>${fichaSummary.duplicada || 0} duplicadas</span>
              <span>${fichaSummary.aprobada || 0} aprobadas</span>
              <span>${fichaSummary.rechazada || 0} rechazadas</span>
              <span>${fichasConPasajeroExistente} con DNI ya cargado</span>
            </div>
            <div class="admin-sync-status is-${escapeHtml(googleSheetsSyncState.status)}">
              <span>${escapeHtml(googleSheetsSyncState.message)}</span>
            </div>
            ${adminFichasMessage ? `<div class="admin-fichas-message">${escapeHtml(adminFichasMessage)}</div>` : ""}
          </section>

          <section class="admin-turismo-panel admin-pasajeros-table-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Bandeja de fichas</h2>
                <p>Filtrá por estado y ejecutá la acción siguiente sin salir de la tabla.</p>
              </div>
              <strong>${esTutor ? `${adminFichasTutor.length} fichas de tutor` : `${visibleFichas.length} / ${fichas.length} fichas`}</strong>
            </div>
            <div class="admin-fichas-tabs admin-fichas-tipo" role="group" aria-label="Tipo de ficha">
              <button type="button" class="${esTutor ? "" : "is-active"}" data-admin-fichas-tipo="pax" aria-pressed="${esTutor ? "false" : "true"}">Pasajeros (PAX) <span>${fichas.length}</span></button>
              <button type="button" class="${esTutor ? "is-active" : ""}" data-admin-fichas-tipo="tutor" aria-pressed="${esTutor ? "true" : "false"}">Tutores <span>${adminFichasTutor.length}</span></button>
            </div>
            ${esTutor ? renderAdminFichasTutorTabla() : `
            <div class="admin-fichas-tabs" role="tablist" aria-label="Estado de fichas">
              ${Object.entries(filterMap).map(([key, filter]) => {
                const count = fichas.filter((ficha) => filter.states.includes(ficha.estadoRevision || "pendiente")).length;
                return `
                  <button type="button" class="${key === activeFilter ? "is-active" : ""}" data-admin-fichas-filter="${escapeHtml(key)}">
                    ${escapeHtml(filter.label)}
                    <span>${count}</span>
                  </button>
                `;
              }).join("")}
            </div>
            ${renderAdminFichasFilters(colegios, viajes)}
            ${adminFichasSearch ? `<p class="admin-fichas-search-note">La búsqueda revisa fichas de todos los estados.</p>` : ""}
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-fichas-table">
                <thead>
                  <tr>
                    <th>Apellido y nombre</th>
                    <th>Colegio</th>
                    <th>Curso / División</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Correo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>${fichaAdhesionDemoRows(visibleFichas)}</tbody>
              </table>
            </div>
            ${renderAdminFichaDetail(selectedFicha)}
            `}
          </section>
          ${renderAdminFichasRejectModal()}
        `);
        adminFichasMessage = "";
        bindAdminShell();
        bindAdminFichasRecibidas();
      }

      function renderAdminPasajeros() {
        const nivelGroups = adminPasajerosDemo.filter((group) => group.nivel === adminPasajerosNivel);
        const viajes = uniqueValues(nivelGroups, "viaje");
        if (!viajes.includes(adminPasajerosViaje)) adminPasajerosViaje = viajes[0] || "";

        const viajeGroups = nivelGroups.filter((group) => group.viaje === adminPasajerosViaje);
        const colegios = uniqueValues(viajeGroups, "colegio");
        if (!colegios.includes(adminPasajerosColegio)) adminPasajerosColegio = colegios[0] || "";

        const colegioGroups = viajeGroups.filter((group) => group.colegio === adminPasajerosColegio);
        if (!colegioGroups.some((group) => group.id === adminPasajerosGrupoId)) adminPasajerosGrupoId = colegioGroups[0]?.id || "";
        const selectedGroup = colegioGroups.find((group) => group.id === adminPasajerosGrupoId) || colegioGroups[0] || adminPasajerosDemo[0];
        const contextPassengers = selectedGroup?.pasajeros || [];
        const contextPaymentSummary = contextPassengers.reduce((summary, passenger) => {
          const payment = passengerPaymentData(passenger);
          if (payment.estadoPago === "Al día") summary.alDia += 1;
          if (payment.estadoPago !== "Al día") summary.pagoPendiente += 1;
          if (passenger.documentacion !== "Completa") summary.documentacionPendiente += 1;
          return summary;
        }, { alDia: 0, pagoPendiente: 0, documentacionPendiente: 0 });

        const allRows = adminPasajerosRows();
        const filteredRows = adminPasajerosFilteredRows();
        const dashboardSummary = window.ElAngelAzulPassengers.dashboardSummary(allRows);

        const allViajes = uniqueValues(adminPasajerosDemo, "viaje");
        const colegioFilterGroups = adminPasajerosDemo.filter((group) => !adminPasajerosFilterViaje || group.viaje === adminPasajerosFilterViaje);
        const allColegios = uniqueValues(colegioFilterGroups, "colegio");
        const cursoFilterGroups = colegioFilterGroups.filter((group) => !adminPasajerosFilterColegio || group.colegio === adminPasajerosFilterColegio);
        const allCursos = [...new Set(cursoFilterGroups.map((group) => `${group.curso} ${group.division}`).filter(Boolean))];
        const allEstados = [...new Set(allRows.flatMap(({ passenger, payment }) => [
          passenger.estado,
          payment.estadoPago,
          passenger.documentacion
        ]).filter(Boolean))];

        const passengerRows = renderAdminPasajerosTableRows(filteredRows);
        const contextLabel = selectedGroup
          ? `${selectedGroup.nivel} · ${selectedGroup.viaje} · ${selectedGroup.colegio} · ${selectedGroup.curso} ${selectedGroup.division}`
          : "Sin contexto seleccionado";
        const manualContractOptions = selectedGroup ? adminContratoOptionsForGroup(selectedGroup.id) : [];
        const formHtml = adminPasajerosShowForm ? `
          <section class="admin-turismo-panel admin-pasajeros-form-panel">
            <div class="admin-pasajeros-section-head">
              <div>
                <h2>Cargar pasajero</h2>
                <p>Completá todos los campos obligatorios <span class="admin-pasajeros-required">*</span> para guardar el pasajero.</p>
              </div>
              <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-cancel>Cancelar</button>
            </div>

            <div class="admin-pasajeros-form-context-banner">
              <div>
                <span>Nivel</span>
                <strong>${escapeHtml(adminPasajerosNivel || "Sin seleccionar")}</strong>
              </div>
              <div>
                <span>Viaje</span>
                <strong>${escapeHtml(adminPasajerosViaje || "Sin seleccionar")}</strong>
              </div>
              <div>
                <span>Colegio</span>
                <strong>${escapeHtml(adminPasajerosColegio || "Sin seleccionar")}</strong>
              </div>
              <div>
                <span>Curso / División</span>
                <strong>${escapeHtml(selectedGroup ? `${selectedGroup.curso} ${selectedGroup.division}` : "Sin seleccionar")}</strong>
              </div>
              <div>
                <span>Contrato disponible</span>
                <strong>${escapeHtml(manualContractOptions.length ? manualContractOptions[0].codigo_contrato : "Sin contrato")}</strong>
              </div>
            </div>

            ${!selectedGroup ? `<div class="admin-pasajeros-form-error">Seleccioná un grupo (nivel, viaje, colegio y curso/división) antes de cargar un pasajero.</div>` : ""}
            ${manualContractOptions.length === 0 && selectedGroup ? `<div class="admin-pasajeros-form-warning">Este grupo no tiene contratos asignados. El pasajero quedará sin contrato hasta que se cree uno en la sección Contratos.</div>` : ""}
            ${adminPasajerosFormError ? `<div class="admin-pasajeros-form-error"><strong>Revisar:</strong> ${escapeHtml(adminPasajerosFormError)}</div>` : ""}

            <form class="admin-pasajeros-form" data-admin-pasajeros-form novalidate>

              <fieldset>
                <legend>Datos del pasajero</legend>
                <label>Nombre/s <span class="admin-pasajeros-required">*</span>
                  <input name="nombre" placeholder="Ej: Juan Ignacio" autocomplete="off" required>
                </label>
                <label>Apellido/s <span class="admin-pasajeros-required">*</span>
                  <input name="apellido" placeholder="Ej: Pérez" autocomplete="off" required>
                </label>
                <label>DNI <span class="admin-pasajeros-required">*</span>
                  <input name="dni" placeholder="Ej: 44123456" autocomplete="off" required>
                </label>
                <label>Fecha de nacimiento
                  <input name="nacimiento" type="date">
                </label>
                <label>Teléfono del pasajero
                  <input name="telefono" placeholder="Ej: 3794123456">
                </label>
              </fieldset>

              <fieldset>
                <legend>Responsable / Tutor</legend>
                <label>Nombre y apellido <span class="admin-pasajeros-required">*</span>
                  <input name="responsable" placeholder="Ej: María Gómez" autocomplete="off" required>
                </label>
                <label>Vínculo
                  <input name="vinculo" placeholder="Madre, padre, tutor">
                </label>
                <label>DNI del responsable
                  <input name="responsableDni" placeholder="Ej: 29123456">
                </label>
                <label>CUIL / CUIT del responsable
                  <input name="responsableCuilCuit" placeholder="20-29123456-3">
                </label>
                <label>Teléfono del responsable <span class="admin-pasajeros-required">*</span>
                  <input name="responsableTelefono" placeholder="Ej: 3794654321" required>
                </label>
              </fieldset>

              <fieldset>
                <legend>Contrato asociado</legend>
                <label>Contrato <span class="admin-pasajeros-required">*</span>
                  <select name="contratoId" required>
                    <option value="">Seleccionar contrato</option>
                    ${manualContractOptions.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.codigo_contrato)}</option>`).join("")}
                  </select>
                </label>
                <p class="admin-pasajeros-modal-note">Un pasajero sin contrato no puede generar pagos ni documentación. Si no aparece el contrato, crealo primero en la sección Contratos.</p>
              </fieldset>

              <fieldset>
                <legend>Estados iniciales</legend>
                <label>Estado del pasajero
                  <select name="estado">
                    <option value="Activo">Activo</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Baja">Baja</option>
                  </select>
                </label>
                <label>Documentación
                  <select name="documentacion">
                    <option value="Pendiente">Pendiente</option>
                    <option value="Completa">Completa</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </label>
                <label>Ficha médica
                  <select name="fichaMedica">
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cargada">Cargada</option>
                    <option value="Observada">Observada</option>
                  </select>
                </label>
                <label>Estado de pago
                  <select name="pago">
                    <option value="Pendiente">Pendiente</option>
                    <option value="Al día">Al día</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </label>
              </fieldset>

              <fieldset>
                <legend>Observaciones internas</legend>
                <label style="grid-column: 1 / -1">Observaciones
                  <textarea name="observaciones" rows="3" placeholder="Notas internas sobre este pasajero..."></textarea>
                </label>
              </fieldset>

              <div class="admin-pasajeros-form-actions">
                <button type="submit" class="admin-pasajeros-primary-button" ${!selectedGroup ? "disabled" : ""}>Guardar pasajero</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-cancel>Cancelar</button>
              </div>
            </form>
          </section>
        ` : "";

        document.getElementById("app").innerHTML = renderAdminShell("pasajeros", `

          <!-- 1. DASHBOARD -->
          <section class="admin-turismo-panel">
            <div class="admin-pasajeros-section-head">
              <div>
                <h1>Pasajeros</h1>
                <p>Vista general de la base de pasajeros.</p>
              </div>
              <button type="button" class="admin-pasajeros-primary-button" data-admin-pasajeros-open-form>
                ${adminPasajerosShowForm ? "Formulario abierto ↓" : "+ Cargar pasajero"}
              </button>
            </div>
            <div class="admin-pasajeros-dashboard">
              <article>
                <strong>${dashboardSummary.total}</strong>
                <span>Total pasajeros</span>
              </article>
              <article>
                <strong>${dashboardSummary.activos}</strong>
                <span>Activos</span>
              </article>
              <article>
                <strong>${dashboardSummary.pagoPendiente}</strong>
                <span>Pago pendiente</span>
              </article>
              <article>
                <strong>${dashboardSummary.documentacionPendiente}</strong>
                <span>Documentación pendiente</span>
              </article>
            </div>
          </section>

          <!-- 2. FORMULARIO DE CARGA -->
          ${formHtml}

          <!-- 3. BUSCAR Y FILTRAR -->
          <section class="admin-turismo-panel admin-pasajeros-filter-panel">
            <div class="admin-pasajeros-section-head">
              <div>
                <h2>Buscar y filtrar</h2>
                <p>La tabla muestra todos los pasajeros del sistema, no solo el curso seleccionado.</p>
              </div>
            </div>
            <div class="admin-pasajeros-filters">
              <label>Buscar pasajero
                <input type="search" value="${escapeHtml(adminPasajerosSearch)}" placeholder="Nombre, DNI o teléfono" data-admin-pasajeros-search>
              </label>
              ${renderAdminPasajerosSelect("viaje", adminPasajerosFilterViaje, allViajes, "Viaje")}
              ${renderAdminPasajerosSelect("colegio", adminPasajerosFilterColegio, allColegios, "Colegio")}
              ${renderAdminPasajerosSelect("curso", adminPasajerosFilterCurso, allCursos, "Curso")}
              ${renderAdminPasajerosSelect("estado", adminPasajerosFilterEstado, allEstados, "Estado")}
              <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-clear-filters>Limpiar</button>
            </div>
          </section>

          <!-- 4. TABLA DE PASAJEROS ENCONTRADOS -->
          <section class="admin-turismo-panel admin-pasajeros-table-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Pasajeros encontrados</h2>
                <p>Tabla con contacto, responsable, grupo, pago, documentación y estado.</p>
              </div>
              <strong data-admin-pasajeros-results-count>${filteredRows.length} / ${allRows.length}</strong>
            </div>
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-pasajeros-table--compact">
                <thead>
                  <tr>
                    <th>Apellido y nombre</th>
                    <th>Contacto</th>
                    <th>Tutor</th>
                    <th>Colegio / curso</th>
                    <th>Plan</th>
                    <th>Pago</th>
                    <th>Documentación</th>
                    <th>Estado</th>
                    <th>Ficha</th>
                  </tr>
                </thead>
                <tbody data-admin-pasajeros-results>${passengerRows}</tbody>
              </table>
            </div>
          </section>

          <!-- FICHA INDIVIDUAL (aparece al hacer clic en Ver ficha) -->
          ${renderAdminPasajerosProfile()}

          ${renderAdminPasajerosGroupModal()}
        `);
        bindAdminShell();
        bindAdminPasajeros();
      }

      function adminContratosFilteredRows() {
        const search = normalizeFichaSearchText(adminContratosSearch);
        return adminContratosRows().filter((contract) => {
          const matchesNivel = !adminContratosFilterNivel || contract.nivel === adminContratosFilterNivel;
          const matchesViaje = !adminContratosFilterViaje || contract.viaje === adminContratosFilterViaje;
          const matchesColegio = !adminContratosFilterColegio || contract.colegio_nombre === adminContratosFilterColegio;
          const matchesEstado = !adminContratosFilterEstado || contract.estado === adminContratosFilterEstado;
          const haystack = normalizeFichaSearchText([
            contract.codigo_contrato,
            contract.id,
            contract.colegio_nombre,
            contract.grupo_id,
            contract.viaje,
            contract.curso,
            contract.division,
            contract.observaciones
          ].join(" "));
          return matchesNivel && matchesViaje && matchesColegio && matchesEstado && (!search || haystack.includes(search));
        });
      }

      function renderAdminContratosRows(rows = []) {
        if (!rows.length) {
          return `
            <tr>
              <td colspan="7">
                <span>No hay contratos con ese criterio. Limpiá los filtros o actualizá la página si la carga fue reciente.</span>
              </td>
            </tr>
          `;
        }
        return rows.map((contract) => {
          const group = adminPasajerosDemo.find((item) => item.id === contract.grupo_id);
          const passengerCount = group?.pasajeros?.length || 0;
          const grupoCurso = `${contract.curso || group?.curso || ""} ${contract.division || group?.division || ""}`.trim();
          return `
            <tr>
              <td>
                <strong>${escapeHtml(contract.codigo_contrato || "Sin código")}</strong>
                <span>${escapeHtml(contract.id || "Sin ID")}</span>
              </td>
              <td>
                <strong>${escapeHtml(contract.colegio_nombre || "Sin colegio")}</strong>
                <span>Referencia desde Grupos</span>
              </td>
              <td>
                <strong>${escapeHtml(contract.nivel || "Sin nivel")} · ${escapeHtml(contract.viaje || "Sin viaje")}</strong>
                <span>${escapeHtml(grupoCurso || "Curso pendiente")} · solo lectura</span>
              </td>
              <td>
                <strong>${escapeHtml(contract.estado || "Sin estado")}</strong>
                <span>Editable</span>
              </td>
              <td>
                <strong>${passengerCount}</strong>
                <span>${escapeHtml(contract.grupo_id || "grupo_id pendiente")}</span>
              </td>
              <td>${escapeHtml(contract.observaciones || "Sin observaciones")}</td>
              <td>
                <button type="button" data-admin-contrato-edit="${escapeHtml(contract.id)}">Editar</button>
              </td>
            </tr>
          `;
        }).join("");
      }

      // Ficha v2: planes de pago por contrato (1 a 18 cuotas). Se eligen en la
      // ficha pública y quedan visibles en Fichas y Pasajeros.
      function renderAdminContratoPlanes(contract) {
        const planes = adminPlanesPago.filter((plan) => plan.contrato_id === contract.id);
        return `
          <section class="admin-contrato-planes" aria-label="Planes de pago">
            <h3>Planes de pago</h3>
            <p>Las familias eligen uno de los planes activos al completar la ficha.</p>
            ${planes.length ? `
              <ul>
                ${planes.map((plan) => `
                  <li>
                    <div>
                      <strong>${escapeHtml(plan.nombre)}</strong>
                      <span>${escapeHtml(plan.cuotas)} ${plan.cuotas === "1" ? "cuota" : "cuotas"}${plan.descripcion ? ` · ${escapeHtml(plan.descripcion)}` : ""}</span>
                    </div>
                    <span class="admin-pasajeros-status ${plan.activo === "TRUE" ? "is-ok" : "is-pending"}">${plan.activo === "TRUE" ? "Activo" : "Inactivo"}</span>
                    <button type="button" class="admin-secondary-action" data-plan-toggle="${escapeHtml(plan.id)}">${plan.activo === "TRUE" ? "Desactivar" : "Activar"}</button>
                  </li>
                `).join("")}
              </ul>
            ` : "<p>Este contrato todavía no tiene planes cargados.</p>"}
            <div class="admin-contrato-plan-form">
              <label><span>Nombre del plan</span><input data-plan-nombre maxlength="80" placeholder="Ej.: 12 cuotas sin interés"></label>
              <label><span>Cuotas</span><input data-plan-cuotas type="number" min="1" max="18" step="1" placeholder="1 a 18"></label>
              <label><span>Descripción (opcional)</span><input data-plan-descripcion maxlength="200"></label>
              <button type="button" data-plan-agregar>Agregar plan</button>
            </div>
            <p class="admin-pasajeros-modal-error" data-plan-error hidden></p>
          </section>
        `;
      }

      function adminPasajeroNombreCompleto(passenger = {}) {
        return fichaNombreCompleto(passenger.apellido, passenger.nombre) || passenger.nombre || "";
      }

      function renderAdminContratoEditModal() {
        if (!adminContratosEditId) return "";
        const contract = adminContratosDemo.find((item) => item.id === adminContratosEditId);
        if (!contract) return "";
        const group = adminPasajerosDemo.find((item) => item.id === contract.grupo_id);
        const grupoCurso = `${contract.curso || group?.curso || ""} ${contract.division || group?.division || ""}`.trim();
        const estados = ["Activo", "Borrador", "Inactivo"];
        const estadoActual = contract.estado || "Borrador";
        return `
          <div class="admin-contrato-modal-backdrop" data-admin-contrato-edit-backdrop>
            <section class="admin-contrato-modal" role="dialog" aria-modal="true" aria-label="Editar contrato">
              <div class="admin-contrato-modal-head">
                <div>
                  <span class="admin-contrato-modal-eyebrow">Edición de contrato</span>
                  <h2>${escapeHtml(contract.colegio_nombre || "Contrato sin colegio")}</h2>
                  <p>Actualizá los datos operativos del contrato sin modificar la información del grupo.</p>
                </div>
                <button type="button" class="admin-contrato-modal-close" data-admin-contrato-edit-cancel aria-label="Cerrar editor">×</button>
              </div>
              <div class="admin-contrato-reference" aria-label="Datos del grupo, solo lectura">
                <div>
                  <span>Nivel</span>
                  <strong>${escapeHtml(contract.nivel || "Sin nivel")}</strong>
                </div>
                <div>
                  <span>Viaje</span>
                  <strong>${escapeHtml(contract.viaje || "Sin viaje")}</strong>
                </div>
                <div>
                  <span>Curso</span>
                  <strong>${escapeHtml(grupoCurso || "Curso pendiente")}</strong>
                </div>
                <p>Información vinculada al grupo · Solo lectura</p>
              </div>
              ${adminContratosEditError ? `<p class="admin-pasajeros-modal-error">${escapeHtml(adminContratosEditError)}</p>` : ""}
              <form class="admin-contrato-form" data-admin-contrato-edit-form>
                <label>
                  <span>Código de contrato</span>
                  <input name="codigo_contrato" value="${escapeHtml(contract.codigo_contrato || "")}" placeholder="Ej: EAA-2026-001" required>
                </label>
                <label>
                  <span>Estado</span>
                  <select name="estado" required>
                    ${estados.map((estado) => `<option value="${escapeHtml(estado)}" ${estado === estadoActual ? "selected" : ""}>${escapeHtml(estado)}</option>`).join("")}
                  </select>
                </label>
                <label class="admin-contrato-form-observaciones">
                  <span>Observaciones internas</span>
                  <textarea name="observaciones" rows="4" placeholder="Observaciones internas">${escapeHtml(contract.observaciones || "")}</textarea>
                </label>
                <div class="admin-contrato-modal-actions">
                  <button type="button" class="admin-secondary-action" data-admin-contrato-edit-cancel>Cancelar</button>
                  <button type="submit">Guardar cambios</button>
                </div>
              </form>
              ${renderAdminContratoPlanes(contract)}
            </section>
          </div>
        `;
      }

      // Corrección (25/07): "Editar" en un contrato "base" (todavía no
      // guardado de verdad) no hacía nada - ni error, ni modal, nada. El
      // modal y el guardado buscan estrictamente en adminContratosDemo, y
      // estos placeholders solo existen en adminContratosRows(), nunca se
      // empujaban ahí. El propio texto del contrato prometía "editar/
      // validar desde el panel de Contratos" y no era cierto. Acá se
      // materializa recién al abrir la edición - así "Guardar" sí lo
      // persiste como contrato real por primera vez.
      function openAdminContratoEdit(contractId) {
        if (!adminContratosDemo.some((item) => item.id === contractId)) {
          const draft = adminContratosRows().find((item) => item.id === contractId);
          if (draft) adminContratosDemo.push({ ...draft });
        }
        adminContratosEditId = contractId;
        adminContratosEditError = "";
        renderAdminContratos();
      }

      function closeAdminContratoEdit() {
        adminContratosEditId = "";
        adminContratosEditError = "";
        renderAdminContratos();
      }

      function submitAdminContratoEdit(form) {
        const contractId = adminContratosEditId;
        const index = adminContratosDemo.findIndex((contract) => contract.id === contractId);
        if (index < 0) return;
        const current = adminContratosDemo[index];
        const formData = new FormData(form);
        const codigo = String(formData.get("codigo_contrato") || "").trim();
        const estado = String(formData.get("estado") || "Borrador").trim();
        const observaciones = String(formData.get("observaciones") || "").trim();
        if (!codigo) {
          adminContratosEditError = "Cargá el código de contrato antes de guardar.";
          renderAdminContratos();
          return;
        }
        const duplicatedCodigo = adminContratosDemo.some((contract, idx) => idx !== index && contract.codigo_contrato === codigo);
        if (duplicatedCodigo) {
          adminContratosEditError = "Ya existe otro contrato con ese código. El código de contrato debe ser único.";
          renderAdminContratos();
          return;
        }
        const now = new Date().toISOString();
        adminContratosDemo[index] = {
          ...current,
          codigo_contrato: codigo,
          estado,
          observaciones,
          updated_at: now
        };
        adminContratosEditId = "";
        adminContratosEditError = "";
        googleSheetsSyncState = {
          status: "pending",
          message: "Guardando contrato en la base de datos..."
        };
        saveAdminContratosDemo().then(() => {
          if (currentPath() === "/admin/contratos") renderAdminContratos();
        });
        renderAdminContratos();
      }

      function renderAdminContratos() {
        const contracts = adminContratosRows();
        const filteredRows = adminContratosFilteredRows();
        const activeContracts = contracts.filter((contract) => contract.estado === "Activo").length;
        const linkedGroups = new Set(contracts.map((contract) => contract.grupo_id).filter(Boolean)).size;
        const duplicatedCodes = contracts.length - new Set(contracts.map((contract) => contract.codigo_contrato).filter(Boolean)).size;
        const niveles = uniqueValues(contracts, "nivel");
        const viajeSource = contracts.filter((contract) => !adminContratosFilterNivel || contract.nivel === adminContratosFilterNivel);
        const viajes = uniqueValues(viajeSource, "viaje");
        const colegioSource = viajeSource.filter((contract) => !adminContratosFilterViaje || contract.viaje === adminContratosFilterViaje);
        const colegios = uniqueValues(colegioSource, "colegio_nombre");
        const estados = uniqueValues(contracts, "estado");

        document.getElementById("app").innerHTML = renderAdminShell("contratos", `
          <section class="admin-turismo-panel admin-overview">
            <p>Base operativa</p>
            <h2>Contratos</h2>
            <div class="admin-pasajeros-breadcrumb">
              <span>Total: ${contracts.length}</span>
              <span>Activos: ${activeContracts}</span>
              <span>Grupos vinculados: ${linkedGroups}</span>
              <span>Códigos duplicados: ${duplicatedCodes}</span>
              <span>${escapeHtml(googleSheetsSyncState.message)}</span>
            </div>
            <p>Esta vista permite validar el número real que carga Hugo. Solo los contratos en estado Activo habilitan inscripción pública automática.</p>
            <div class="admin-fichas-message">
              Los datos de colegio, viaje, curso y división vienen desde Grupos. En esta pantalla solo se valida el contrato real y su estado.
            </div>
          </section>

          <section class="admin-turismo-panel admin-pasajeros-filter-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Filtros</h2>
                <p>Revisá rápidamente contratos por colegio, viaje, nivel o código.</p>
              </div>
            </div>
            <div class="admin-pasajeros-filters" data-admin-contratos-filters>
              <label>Buscar
                <input name="search" value="${escapeHtml(adminContratosSearch)}" placeholder="Código, colegio, grupo">
              </label>
              <label>Nivel
                <select name="nivel">
                  <option value="">Todos</option>
                  ${niveles.map((nivel) => `<option value="${escapeHtml(nivel)}" ${nivel === adminContratosFilterNivel ? "selected" : ""}>${escapeHtml(nivel)}</option>`).join("")}
                </select>
              </label>
              <label>Viaje
                <select name="viaje">
                  <option value="">Todos</option>
                  ${viajes.map((viaje) => `<option value="${escapeHtml(viaje)}" ${viaje === adminContratosFilterViaje ? "selected" : ""}>${escapeHtml(viaje)}</option>`).join("")}
                </select>
              </label>
              <label>Colegio
                <select name="colegio">
                  <option value="">Todos</option>
                  ${colegios.map((colegio) => `<option value="${escapeHtml(colegio)}" ${colegio === adminContratosFilterColegio ? "selected" : ""}>${escapeHtml(colegio)}</option>`).join("")}
                </select>
              </label>
              <label>Estado
                <select name="estado">
                  <option value="">Todos</option>
                  ${estados.map((estado) => `<option value="${escapeHtml(estado)}" ${estado === adminContratosFilterEstado ? "selected" : ""}>${escapeHtml(estado)}</option>`).join("")}
                </select>
              </label>
            </div>
          </section>

          <section class="admin-turismo-panel admin-pasajeros-table-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Contratos cargados</h2>
                <p>${filteredRows.length} contratos visibles de ${contracts.length} cargados. Colegio, viaje, curso y división se muestran como referencia de Grupos.</p>
              </div>
              <strong>${duplicatedCodes === 0 ? "Base sin duplicados" : "Revisar duplicados"}</strong>
            </div>
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-pasajeros-table--compact">
                <thead>
                  <tr>
                    <th>Contrato editable</th>
                    <th>Colegio de referencia</th>
                    <th>Grupo / viaje de referencia</th>
                    <th>Estado</th>
                    <th>Pasajeros</th>
                    <th>Observaciones editables</th>
                    <th>Editar contrato</th>
                  </tr>
                </thead>
                <tbody>${renderAdminContratosRows(filteredRows)}</tbody>
              </table>
            </div>
          </section>

          ${renderAdminContratoEditModal()}
        `);
        bindAdminShell();
        bindAdminContratos();
      }

      function bindAdminContratos() {
        const filters = document.querySelector("[data-admin-contratos-filters]");
        document.querySelector("[data-plan-agregar]")?.addEventListener("click", async () => {
          const nombre = document.querySelector("[data-plan-nombre]")?.value.trim() || "";
          const cuotas = Number(document.querySelector("[data-plan-cuotas]")?.value || 0);
          const descripcion = document.querySelector("[data-plan-descripcion]")?.value.trim() || "";
          const errorNode = document.querySelector("[data-plan-error]");
          if (nombre.length < 2 || !Number.isInteger(cuotas) || cuotas < 1 || cuotas > 18) {
            errorNode.textContent = "Cargá un nombre y una cantidad de cuotas entre 1 y 18.";
            errorNode.hidden = false;
            return;
          }
          const plan = { id: crypto.randomUUID(), contrato_id: adminContratosEditId, nombre, cuotas: String(cuotas), descripcion, activo: "TRUE", orden: "" };
          adminPlanesPago = [...adminPlanesPago, plan];
          const guardado = await queueGoogleSheetsWrite(["PLANES_PAGO"]);
          if (!guardado) {
            adminPlanesPago = adminPlanesPago.filter((item) => item.id !== plan.id);
            adminContratosEditError = googleSheetsSyncState.message;
          }
          renderAdminContratos();
        });
        document.querySelectorAll("[data-plan-toggle]").forEach((button) => {
          button.addEventListener("click", async () => {
            const id = button.dataset.planToggle;
            adminPlanesPago = adminPlanesPago.map((plan) => (plan.id === id ? { ...plan, activo: plan.activo === "TRUE" ? "FALSE" : "TRUE" } : plan));
            const guardado = await queueGoogleSheetsWrite(["PLANES_PAGO"]);
            if (!guardado) adminContratosEditError = googleSheetsSyncState.message;
            renderAdminContratos();
          });
        });
        if (!filters) return;
        const handleFilter = () => {
          const formData = new FormData();
          filters.querySelectorAll("input, select").forEach((field) => formData.set(field.name, field.value));
          adminContratosSearch = String(formData.get("search") || "").trim();
          adminContratosFilterNivel = String(formData.get("nivel") || "");
          adminContratosFilterViaje = String(formData.get("viaje") || "");
          adminContratosFilterColegio = String(formData.get("colegio") || "");
          adminContratosFilterEstado = String(formData.get("estado") || "");
          renderAdminContratos();
        };
        filters.querySelectorAll("select").forEach((field) => field.addEventListener("change", handleFilter));
        filters.querySelector("input[name='search']")?.addEventListener("input", (event) => {
          const input = event.currentTarget;
          const selectionStart = input.selectionStart;
          const selectionEnd = input.selectionEnd;
          const scrollX = window.scrollX;
          const scrollY = window.scrollY;
          handleFilter();
          requestAnimationFrame(() => {
            const nextInput = document.querySelector("[data-admin-contratos-filters] input[name='search']");
            if (!nextInput) return;
            nextInput.focus({ preventScroll: true });
            if (selectionStart !== null && selectionEnd !== null) {
              nextInput.setSelectionRange(selectionStart, selectionEnd);
            }
            window.scrollTo(scrollX, scrollY);
          });
        });
        document.querySelectorAll("[data-admin-contrato-edit]").forEach((button) => {
          button.addEventListener("click", () => openAdminContratoEdit(button.dataset.adminContratoEdit || ""));
        });
        document.querySelectorAll("[data-admin-contrato-edit-cancel]").forEach((button) => {
          button.addEventListener("click", closeAdminContratoEdit);
        });
        document.querySelector("[data-admin-contrato-edit-backdrop]")?.addEventListener("click", (event) => {
          if (event.target === event.currentTarget) closeAdminContratoEdit();
        });
        document.querySelector("[data-admin-contrato-edit-form]")?.addEventListener("submit", (event) => {
          event.preventDefault();
          submitAdminContratoEdit(event.currentTarget);
        });
      }

      function adminGruposFilteredRows() {
        const search = normalizeFichaSearchText(adminGruposSearch);
        return adminPasajerosDemo.filter((group) => {
          const matchesNivel = !adminGruposFilterNivel || group.nivel === adminGruposFilterNivel;
          const matchesViaje = !adminGruposFilterViaje || group.viaje === adminGruposFilterViaje;
          const matchesColegio = !adminGruposFilterColegio || group.colegio === adminGruposFilterColegio;
          const haystack = normalizeFichaSearchText([
            group.id,
            group.nivel,
            group.viaje,
            group.colegio,
            group.curso,
            group.division
          ].join(" "));
          return matchesNivel && matchesViaje && matchesColegio && (!search || haystack.includes(search));
        });
      }

      function renderAdminGruposRows(rows = []) {
        if (!rows.length) {
          return `
            <tr>
              <td colspan="7">
                <span>No hay grupos con ese criterio. Revisá la hoja GRUPOS o limpiá filtros.</span>
              </td>
            </tr>
          `;
        }
        return rows.map((group) => {
          const contracts = adminContratoOptionsForGroup(group.id);
          const activeContracts = contracts.filter((contract) => contract.estado === "Activo").length;
          const cupo = Number(group.pasajerosEsperados || group.cupo || 0);
          return `
            <tr>
              <td>
                <strong>${escapeHtml(group.nivel || "Sin nivel")}</strong>
              </td>
              <td>
                <strong>${escapeHtml(group.viaje || "Sin viaje")}</strong>
              </td>
              <td>
                <strong>${escapeHtml(group.colegio || "Sin colegio")}</strong>
                <span>${escapeHtml(group.id || "Sin ID")}</span>
              </td>
              <td>
                <strong>${escapeHtml(group.curso || "Curso pendiente")}</strong>
              </td>
              <td>
                <strong>${escapeHtml(group.division || "División pendiente")}</strong>
              </td>
              <td>
                <strong>${escapeHtml(String(cupo || 0))}</strong>
                <span>${contracts.length} contratos · ${activeContracts} activos</span>
              </td>
              <td>
                <button type="button" data-admin-grupo-view-contracts="${escapeHtml(group.id)}">Ver contratos</button>
              </td>
            </tr>
          `;
        }).join("");
      }

      function renderAdminGruposCreateForm() {
        if (!adminGruposShowCreateForm) return "";
        return `
          <section class="admin-turismo-panel admin-pasajeros-form-panel">
            <div class="admin-pasajeros-section-head">
              <div>
                <h2>Crear grupo nuevo</h2>
                <p>Alta directa para colegio, viaje, curso y división. Al guardar se sincroniza con la pestaña GRUPOS.</p>
              </div>
            </div>
            ${adminGruposCreateError ? `<div class="admin-pasajeros-form-error"><strong>Revisar grupo:</strong> ${escapeHtml(adminGruposCreateError)}</div>` : ""}
            <form class="admin-pasajeros-form" data-admin-grupos-create-form novalidate>
              <fieldset>
                <legend>Datos del grupo</legend>
                <label>Nivel
                  <select name="nivel" required>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria" selected>Secundaria</option>
                  </select>
                </label>
                <label>Viaje
                  <input name="viaje" placeholder="Ej: Bariloche 2026" required>
                </label>
                <label>Colegio
                  ${renderAdminColegioSelect()}
                </label>
                <label>Grado/Año
                  ${renderAdminGradoSelect()}
                </label>
                <label>División
                  <input name="division" placeholder="Ej: A" maxlength="3" required>
                </label>
                <label>Cupo esperado
                  <input name="pasajerosEsperados" type="number" min="0" placeholder="Ej: 28">
                </label>
              </fieldset>
              <div class="admin-pasajeros-form-actions">
                <button type="submit" class="admin-pasajeros-primary-button">Guardar grupo</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-grupos-cancel-create>Cancelar</button>
              </div>
            </form>
          </section>
        `;
      }

      function renderAdminGrupos() {
        const groups = adminPasajerosDemo;
        const filteredRows = adminGruposFilteredRows();
        const colegios = uniqueValues(groups, "colegio");
        const viajes = uniqueValues(groups.filter((group) => !adminGruposFilterNivel || group.nivel === adminGruposFilterNivel), "viaje");
        const colegioSource = groups.filter((group) => (
          (!adminGruposFilterNivel || group.nivel === adminGruposFilterNivel) &&
          (!adminGruposFilterViaje || group.viaje === adminGruposFilterViaje)
        ));
        const filteredColegios = uniqueValues(colegioSource, "colegio");
        const niveles = uniqueValues(groups, "nivel");
        const totalPassengers = groups.reduce((total, group) => total + (group.pasajeros?.length || 0), 0);
        const groupsWithoutContract = groups.filter((group) => !adminContratoOptionsForGroup(group.id).length).length;
        const uniqueSchools = colegios.length;

        document.getElementById("app").innerHTML = renderAdminShell("grupos", `
          <section class="admin-turismo-panel admin-overview">
            <p>Base operativa</p>
            <h2>Grupos y contratos</h2>
            <div class="admin-pasajeros-breadcrumb">
              <span>Grupos: ${groups.length}</span>
              <span>Colegios únicos: ${uniqueSchools}</span>
              <span>Pasajeros: ${totalPassengers}</span>
              <span>Sin contrato: ${groupsWithoutContract}</span>
              <span>${escapeHtml(googleSheetsSyncState.message)}</span>
            </div>
            <p>Organizá la estructura de colegio, viaje, curso y división que alimenta contratos y pasajeros.</p>
            <div class="admin-actions-row admin-grupos-primary-actions">
              <button type="button" class="admin-pasajeros-primary-button" data-admin-grupos-open-create>Crear grupo nuevo</button>
            </div>
          </section>

          ${renderAdminGruposCreateForm()}

          <section class="admin-turismo-panel admin-pasajeros-filter-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Filtros</h2>
                <p>Usá esta vista para detectar grupos faltantes, cursos mal cargados o colegios duplicados.</p>
              </div>
            </div>
            <div class="admin-pasajeros-filters" data-admin-grupos-filters>
              <label>Buscar
                <input name="search" value="${escapeHtml(adminGruposSearch)}" placeholder="Colegio, curso, viaje">
              </label>
              <label>Nivel
                <select name="nivel">
                  <option value="">Todos</option>
                  ${niveles.map((nivel) => `<option value="${escapeHtml(nivel)}" ${nivel === adminGruposFilterNivel ? "selected" : ""}>${escapeHtml(nivel)}</option>`).join("")}
                </select>
              </label>
              <label>Viaje
                <select name="viaje">
                  <option value="">Todos</option>
                  ${viajes.map((viaje) => `<option value="${escapeHtml(viaje)}" ${viaje === adminGruposFilterViaje ? "selected" : ""}>${escapeHtml(viaje)}</option>`).join("")}
                </select>
              </label>
              <label>Colegio
                <select name="colegio">
                  <option value="">Todos</option>
                  ${filteredColegios.map((colegio) => `<option value="${escapeHtml(colegio)}" ${colegio === adminGruposFilterColegio ? "selected" : ""}>${escapeHtml(colegio)}</option>`).join("")}
                </select>
              </label>
            </div>
          </section>

          <section class="admin-turismo-panel admin-pasajeros-table-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Grupos cargados</h2>
                <p>${filteredRows.length} grupos visibles de ${groups.length} cargados en la base de datos.</p>
              </div>
              <strong>${groupsWithoutContract === 0 ? "Todos vinculados" : "Revisar contratos"}</strong>
            </div>
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-pasajeros-table--compact">
                <thead>
                  <tr>
                    <th>Nivel</th>
                    <th>Viaje</th>
                    <th>Colegio</th>
                    <th>Curso</th>
                    <th>División</th>
                    <th>Cupo</th>
                    <th>Contratos</th>
                  </tr>
                </thead>
                <tbody>${renderAdminGruposRows(filteredRows)}</tbody>
              </table>
            </div>
          </section>
        `);
        bindAdminShell();
        bindAdminGrupos();
      }

      function bindAdminGrupos() {
        const filters = document.querySelector("[data-admin-grupos-filters]");
        document.querySelector("[data-admin-grupos-open-create]")?.addEventListener("click", () => {
          adminGruposShowCreateForm = true;
          adminGruposCreateError = "";
          renderAdminGrupos();
        });
        document.querySelector("[data-admin-grupos-cancel-create]")?.addEventListener("click", () => {
          adminGruposShowCreateForm = false;
          adminGruposCreateError = "";
          renderAdminGrupos();
        });
        document.querySelector("[data-admin-grupos-create-form]")?.addEventListener("submit", (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const colegioId = String(formData.get("colegio_id") || "").trim();
          const payload = {
            nivel: String(formData.get("nivel") || "").trim(),
            viaje: String(formData.get("viaje") || "").trim(),
            colegioId,
            colegio: adminColegioNombre(colegioId),
            curso: String(formData.get("curso") || "").trim(),
            division: String(formData.get("division") || "").trim().toUpperCase(),
            pasajerosEsperados: Number(formData.get("pasajerosEsperados") || 0)
          };
          if (!payload.nivel || !payload.viaje || !payload.colegio || !payload.curso || !payload.division) {
            adminGruposCreateError = "Completá nivel, viaje, colegio (de la lista), grado/año y división.";
            renderAdminGrupos();
            return;
          }
          const duplicatedGroup = adminPasajerosDemo.some((group) => (
            group.nivel === payload.nivel &&
            group.viaje === payload.viaje &&
            group.colegio === payload.colegio &&
            group.curso === payload.curso &&
            group.division === payload.division
          ));
          if (duplicatedGroup) {
            adminGruposCreateError = "Ese grupo ya existe para ese nivel, viaje, colegio, curso y división.";
            renderAdminGrupos();
            return;
          }
          const group = normalizeAdminPasajerosGroup({
            ...payload,
            estado: "Activo",
            pasajeros: []
          });
          adminPasajerosDemo.push(group);
          adminPasajerosNivel = group.nivel;
          adminPasajerosViaje = group.viaje;
          adminPasajerosColegio = group.colegio;
          adminPasajerosGrupoId = group.id;
          adminGruposFilterNivel = "";
          adminGruposFilterViaje = "";
          adminGruposFilterColegio = "";
          adminGruposSearch = "";
          adminGruposShowCreateForm = false;
          adminGruposCreateError = "";
          googleSheetsSyncState = {
            status: "pending",
            message: "Guardando grupo en la base de datos..."
          };
          saveAdminGruposDemo().then(() => {
            if (currentPath() === "/admin/grupos") renderAdminGrupos();
          });
          renderAdminGrupos();
        });
        document.querySelectorAll("[data-admin-grupo-view-contracts]").forEach((button) => {
          button.addEventListener("click", () => {
            const groupId = button.dataset.adminGrupoViewContracts || "";
            const group = adminPasajerosDemo.find((item) => item.id === groupId);
            adminContratosFilterNivel = group?.nivel || "";
            adminContratosFilterViaje = group?.viaje || "";
            adminContratosFilterColegio = group?.colegio || "";
            adminContratosFilterEstado = "";
            adminContratosSearch = groupId;
            window.history.pushState({}, "", adminRouteHref("/admin/contratos"));
            renderAdminContratos();
          });
        });
        if (!filters) return;
        const handleFilter = () => {
          const formData = new FormData();
          filters.querySelectorAll("input, select").forEach((field) => formData.set(field.name, field.value));
          adminGruposSearch = String(formData.get("search") || "").trim();
          adminGruposFilterNivel = String(formData.get("nivel") || "");
          adminGruposFilterViaje = String(formData.get("viaje") || "");
          adminGruposFilterColegio = String(formData.get("colegio") || "");
          renderAdminGrupos();
        };
        filters.querySelectorAll("select").forEach((field) => field.addEventListener("change", handleFilter));
        filters.querySelector("input[name='search']")?.addEventListener("input", (event) => {
          const input = event.currentTarget;
          const selectionStart = input.selectionStart;
          const selectionEnd = input.selectionEnd;
          const scrollX = window.scrollX;
          const scrollY = window.scrollY;
          handleFilter();
          requestAnimationFrame(() => {
            const nextInput = document.querySelector("[data-admin-grupos-filters] input[name='search']");
            if (!nextInput) return;
            nextInput.focus({ preventScroll: true });
            if (selectionStart !== null && selectionEnd !== null) {
              nextInput.setSelectionRange(selectionStart, selectionEnd);
            }
            window.scrollTo(scrollX, scrollY);
          });
        });
      }

      function bindAdminPasajeros() {
        document.querySelector("[data-admin-pasajeros-open-form]")?.addEventListener("click", () => {
          adminPasajerosShowForm = !adminPasajerosShowForm;
          adminPasajerosFormError = "";
          renderAdminPasajeros();
        });
        document.querySelector("[data-admin-pasajeros-cancel]")?.addEventListener("click", () => {
          adminPasajerosShowForm = false;
          adminPasajerosFormError = "";
          renderAdminPasajeros();
        });
        document.querySelector("[data-admin-pasajeros-form]")?.addEventListener("submit", (event) => {
          event.preventDefault();
          const selectedGroup = adminPasajerosDemo.find((group) => group.id === adminPasajerosGrupoId);
          if (!selectedGroup) return;

          const formData = new FormData(event.currentTarget);
          const selectedContract = contractById(String(formData.get("contratoId") || "").trim(), selectedGroup.id);
          const passenger = {
            nombre: String(formData.get("nombre") || "").trim(),
            apellido: String(formData.get("apellido") || "").trim(),
            dni: String(formData.get("dni") || "").trim(),
            contratoId: selectedContract?.id || "",
            codigoContrato: selectedContract?.codigo_contrato || "",
            nacimiento: String(formData.get("nacimiento") || "").trim(),
            telefono: String(formData.get("telefono") || "").trim(),
            responsable: String(formData.get("responsable") || "").trim(),
            responsableDni: String(formData.get("responsableDni") || "").trim(),
            responsableTelefono: String(formData.get("responsableTelefono") || "").trim(),
            responsableCuilCuit: String(formData.get("responsableCuilCuit") || "").trim(),
            vinculo: String(formData.get("vinculo") || "").trim(),
            estado: String(formData.get("estado") || "Activo").trim(),
            pago: String(formData.get("pago") || "Pendiente").trim(),
            documentacion: String(formData.get("documentacion") || "Pendiente").trim(),
            fichaMedica: String(formData.get("fichaMedica") || "Pendiente").trim(),
            planPago: String(formData.get("planPago") || "Regular").trim(),
            valorViaje: String(formData.get("valorViaje") || "").trim(),
            sena: String(formData.get("sena") || "").trim(),
            cuotas: String(formData.get("cuotas") || "").trim(),
            pagado: String(formData.get("pagado") || "").trim(),
            saldo: "",
            proximaCuota: String(formData.get("proximaCuota") || "").trim(),
            observaciones: String(formData.get("observaciones") || "").trim()
          };
          const valorViaje = parseAdminMoney(passenger.valorViaje);
          const pagado = parseAdminMoney(passenger.pagado);
          passenger.saldo = valorViaje ? String(Math.max(0, valorViaje - pagado)) : "";

          if (!passenger.nombre) {
            adminPasajerosFormError = "El nombre del pasajero es obligatorio.";
            renderAdminPasajeros();
            return;
          }
          if (!passenger.dni) {
            adminPasajerosFormError = "El DNI del pasajero es obligatorio.";
            renderAdminPasajeros();
            return;
          }
          if (!passenger.contratoId) {
            adminPasajerosFormError = "Antes de crear el pasajero, asigná un contrato válido.";
            renderAdminPasajeros();
            return;
          }
          if (!passenger.responsable) {
            adminPasajerosFormError = "El responsable es obligatorio.";
            renderAdminPasajeros();
            return;
          }
          if (!passenger.responsableTelefono) {
            adminPasajerosFormError = "El teléfono del responsable es obligatorio.";
            renderAdminPasajeros();
            return;
          }
          const duplicatedDni = adminPasajerosDemo.some((group) => (
            group.pasajeros.some((item) => normalizeFichaDni(item.dni) === normalizeFichaDni(passenger.dni))
          ));
          if (duplicatedDni) {
            adminPasajerosFormError = "Ya existe un pasajero con ese DNI (revisá otros colegios/viajes, el DNI es único en toda la base).";
            renderAdminPasajeros();
            return;
          }

          selectedGroup.pasajeros.push(passenger);
          saveAdminPasajerosDemo();
          adminPasajerosShowForm = false;
          adminPasajerosFormError = "";
          renderAdminPasajeros();
        });
        document.querySelector("[data-admin-pasajeros-new-colegio]")?.addEventListener("click", () => openAdminPasajerosGroupModal("colegio"));
        document.querySelector("[data-admin-pasajeros-new-curso]")?.addEventListener("click", () => openAdminPasajerosGroupModal("curso"));
        document.querySelector("[data-admin-pasajeros-new-division]")?.addEventListener("click", () => openAdminPasajerosGroupModal("division"));
        document.querySelectorAll("[data-admin-pasajeros-close-group-modal]").forEach((button) => {
          button.addEventListener("click", () => {
            adminPasajerosGroupModal = null;
            renderAdminPasajeros();
          });
        });
        document.querySelector("[data-admin-pasajeros-group-form]")?.addEventListener("submit", (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const colegioId = String(formData.get("colegio_id") || "").trim();
          const payload = {
            nivel: String(formData.get("nivel") || "").trim(),
            viaje: String(formData.get("viaje") || "").trim(),
            colegioId,
            colegio: adminColegioNombre(colegioId),
            curso: String(formData.get("curso") || "").trim(),
            division: String(formData.get("division") || "").trim().toUpperCase(),
            pasajerosEsperados: Number(formData.get("pasajerosEsperados") || 0)
          };
          if (!payload.nivel || !payload.viaje || !payload.colegio || !payload.curso || !payload.division) {
            adminPasajerosGroupModal = { ...(adminPasajerosGroupModal || { type: "colegio" }), error: "Completá nivel, viaje, colegio (de la lista), grado/año y división." };
            renderAdminPasajeros();
            return;
          }
          const duplicatedGroup = adminPasajerosDemo.some((group) => (
            group.nivel === payload.nivel &&
            group.viaje === payload.viaje &&
            group.colegio === payload.colegio &&
            group.curso === payload.curso &&
            group.division === payload.division
          ));
          if (duplicatedGroup) {
            adminPasajerosGroupModal = { ...(adminPasajerosGroupModal || { type: "colegio" }), error: "Ese colegio, curso y división ya existe para el viaje seleccionado." };
            renderAdminPasajeros();
            return;
          }
          adminPasajerosGroupModal = null;
          createAdminPasajerosGroup(payload);
        });
        document.querySelector("[data-admin-pasajeros-search]")?.addEventListener("input", (event) => {
          adminPasajerosSearch = event.currentTarget.value;
          updateAdminPasajerosSearchResults();
        });
        document.querySelectorAll("[data-admin-pasajeros-filter]").forEach((field) => {
          field.addEventListener("change", () => {
            const filterName = field.dataset.adminPasajerosFilter;
            if (filterName === "viaje") {
              adminPasajerosFilterViaje = field.value;
              adminPasajerosFilterColegio = "";
              adminPasajerosFilterCurso = "";
            }
            if (filterName === "colegio") {
              adminPasajerosFilterColegio = field.value;
              adminPasajerosFilterCurso = "";
            }
            if (filterName === "curso") adminPasajerosFilterCurso = field.value;
            if (filterName === "estado") adminPasajerosFilterEstado = field.value;
            renderAdminPasajeros();
          });
        });
        document.querySelector("[data-admin-pasajeros-clear-filters]")?.addEventListener("click", () => {
          adminPasajerosSearch = "";
          adminPasajerosFilterViaje = "";
          adminPasajerosFilterColegio = "";
          adminPasajerosFilterCurso = "";
          adminPasajerosFilterEstado = "";
          renderAdminPasajeros();
        });
        bindAdminPasajerosProfileButtons();
        document.querySelector("[data-admin-pasajeros-close-profile]")?.addEventListener("click", () => {
          adminPasajerosSelectedDni = "";
          adminPasajerosEditMode = false;
          adminPasajerosEditError = "";
          renderAdminPasajeros();
        });
        document.querySelector("[data-admin-pasajeros-open-edit]")?.addEventListener("click", () => {
          adminPasajerosEditMode = true;
          adminPasajerosEditError = "";
          renderAdminPasajeros();
        });
        document.querySelector("[data-admin-pasajeros-cancel-edit]")?.addEventListener("click", () => {
          adminPasajerosEditMode = false;
          adminPasajerosEditError = "";
          renderAdminPasajeros();
        });
        document.querySelector("[data-admin-pasajeros-edit-form]")?.addEventListener("submit", (event) => {
          event.preventDefault();
          const record = adminPasajerosSelectedRecord();
          if (!record) return;
          const { group, passenger } = record;
          const formData = new FormData(event.currentTarget);
          const nombre = String(formData.get("nombre") || "").trim();
          const dni = String(formData.get("dni") || "").trim();
          const responsable = String(formData.get("responsable") || "").trim();
          const responsableTelefono = String(formData.get("responsableTelefono") || "").trim();
          const contratoId = String(formData.get("contratoId") || "").trim();
          if (!nombre) { adminPasajerosEditError = "El nombre del pasajero es obligatorio."; renderAdminPasajeros(); return; }
          if (!dni) { adminPasajerosEditError = "El DNI es obligatorio."; renderAdminPasajeros(); return; }
          if (!responsable) { adminPasajerosEditError = "El nombre del responsable es obligatorio."; renderAdminPasajeros(); return; }
          if (!responsableTelefono) { adminPasajerosEditError = "El teléfono del responsable es obligatorio."; renderAdminPasajeros(); return; }
          if (!contratoId) { adminPasajerosEditError = "Seleccioná un contrato antes de guardar."; renderAdminPasajeros(); return; }
          const selectedContract = contractById(contratoId, group.id);
          const targetGroup = adminPasajerosDemo.find((g) => g.id === group.id);
          if (!targetGroup) return;
          const passengerIndex = targetGroup.pasajeros.findIndex((p) => String(p.dni) === String(passenger.dni));
          if (passengerIndex === -1) return;
          const duplicatedDni = adminPasajerosDemo.some((g) => (
            g.pasajeros.some((item, idx) => (
              !(g.id === targetGroup.id && idx === passengerIndex) &&
              normalizeFichaDni(item.dni) === normalizeFichaDni(dni)
            ))
          ));
          if (duplicatedDni) {
            adminPasajerosEditError = "Ya existe otro pasajero con ese DNI (el DNI es único en toda la base).";
            renderAdminPasajeros();
            return;
          }
          const planElegido = adminPlanesPago.find((plan) => plan.id === String(formData.get("planPagoId") || ""));
          targetGroup.pasajeros[passengerIndex] = {
            ...targetGroup.pasajeros[passengerIndex],
            nombre,
            apellido: String(formData.get("apellido") || "").trim(),
            planPagoId: planElegido?.id || "",
            planNombre: planElegido?.nombre || "",
            planCuotas: planElegido?.cuotas || "",
            dni,
            nacimiento: String(formData.get("nacimiento") || "").trim(),
            telefono: String(formData.get("telefono") || "").trim(),
            responsable,
            responsableDni: String(formData.get("responsableDni") || "").trim(),
            responsableTelefono,
            responsableCuilCuit: String(formData.get("responsableCuilCuit") || "").trim(),
            vinculo: String(formData.get("vinculo") || "").trim(),
            contratoId: selectedContract?.id || contratoId,
            codigoContrato: selectedContract?.codigo_contrato || passenger.codigoContrato || "",
            estado: String(formData.get("estado") || "Activo").trim(),
            documentacion: String(formData.get("documentacion") || "Pendiente").trim(),
            fichaMedica: String(formData.get("fichaMedica") || "Pendiente").trim(),
            pago: String(formData.get("pago") || "Pendiente").trim(),
            observaciones: String(formData.get("observaciones") || "").trim()
          };
          saveAdminPasajerosDemo();
          adminPasajerosSelectedDni = dni;
          adminPasajerosEditMode = false;
          adminPasajerosEditError = "";
          renderAdminPasajeros();
        });
        document.querySelectorAll("[data-admin-pasajeros-nivel]").forEach((button) => {
          button.addEventListener("click", () => {
            adminPasajerosNivel = button.dataset.adminPasajerosNivel;
            adminPasajerosFormError = "";
            renderAdminPasajeros();
          });
        });
        document.querySelectorAll("[data-admin-pasajeros-viaje]").forEach((button) => {
          button.addEventListener("click", () => {
            adminPasajerosViaje = button.dataset.adminPasajerosViaje;
            adminPasajerosFormError = "";
            renderAdminPasajeros();
          });
        });
        document.querySelectorAll("[data-admin-pasajeros-colegio]").forEach((button) => {
          button.addEventListener("click", () => {
            adminPasajerosColegio = button.dataset.adminPasajerosColegio;
            adminPasajerosFormError = "";
            renderAdminPasajeros();
          });
        });
        document.querySelectorAll("[data-admin-pasajeros-grupo]").forEach((button) => {
          button.addEventListener("click", () => {
            adminPasajerosGrupoId = button.dataset.adminPasajerosGrupo;
            adminPasajerosFormError = "";
            renderAdminPasajeros();
          });
        });
      }

      function bindAdminFichasRecibidas() {
        document.querySelectorAll("[data-admin-fichas-filter]").forEach((button) => {
          button.addEventListener("click", () => {
            adminFichasFilter = button.dataset.adminFichasFilter || "nuevas";
            adminFichasSelectedId = "";
            renderAdminFichasRecibidas();
          });
        });
        document.querySelector("[data-admin-fichas-search]")?.addEventListener("input", (event) => {
          const input = event.currentTarget;
          const selectionStart = input.selectionStart;
          const selectionEnd = input.selectionEnd;
          const scrollX = window.scrollX;
          const scrollY = window.scrollY;
          adminFichasSearch = input.value;
          adminFichasSelectedId = "";
          renderAdminFichasRecibidas();
          window.requestAnimationFrame(() => {
            const nextInput = document.querySelector("[data-admin-fichas-search]");
            if (!nextInput) return;
            nextInput.focus({ preventScroll: true });
            nextInput.setSelectionRange(selectionStart, selectionEnd);
            window.scrollTo(scrollX, scrollY);
          });
        });
        document.querySelector("[data-admin-fichas-filter-colegio]")?.addEventListener("change", (event) => {
          adminFichasFilterColegio = event.currentTarget.value;
          adminFichasSelectedId = "";
          renderAdminFichasRecibidas();
        });
        document.querySelector("[data-admin-fichas-filter-viaje]")?.addEventListener("change", (event) => {
          adminFichasFilterViaje = event.currentTarget.value;
          adminFichasSelectedId = "";
          renderAdminFichasRecibidas();
        });
        document.querySelectorAll("[data-ficha-select]").forEach((button) => {
          button.addEventListener("click", () => {
            adminFichasManuallyClosed = false;
            adminFichasSelectedId = button.dataset.fichaSelect;
            renderAdminFichasRecibidas();
          });
        });
        document.querySelectorAll("[data-ficha-cerrar]").forEach((button) => {
          button.addEventListener("click", () => {
            adminFichasManuallyClosed = true;
            adminFichasSelectedId = "";
            renderAdminFichasRecibidas();
          });
        });
        // PDF generado en el servidor a partir de la ficha guardada (el mismo
        // que recibe el tutor por correo).
        document.querySelectorAll("[data-ficha-pdf]").forEach((button) => {
          button.addEventListener("click", () => {
            const id = button.dataset.fichaPdf;
            window.location.href = `/api/admin/fichas/${encodeURIComponent(id)}/pdf`;
          });
        });
        document.querySelectorAll("[data-admin-fichas-tipo]").forEach((button) => {
          button.addEventListener("click", () => {
            adminFichasTipo = button.dataset.adminFichasTipo === "tutor" ? "tutor" : "pax";
            adminFichasSelectedId = "";
            renderAdminFichasRecibidas();
          });
        });
        document.querySelector("[data-admin-fichas-sin-vincular]")?.addEventListener("change", (event) => {
          adminFichasSinVincular = event.currentTarget.checked;
          adminFichasSelectedId = "";
          renderAdminFichasRecibidas();
        });
        document.querySelector("[data-ficha-reenviar-correo]")?.addEventListener("click", async (event) => {
          const button = event.currentTarget;
          const id = button.dataset.fichaReenviarCorreo;
          button.disabled = true;
          button.textContent = "Enviando…";
          try {
            const response = await fetch(`/api/admin/fichas/${encodeURIComponent(id)}/reenviar-correo`, {
              method: "POST",
              credentials: "same-origin"
            });
            const payload = await response.json();
            adminFichasMessage = payload.email_estado === "enviado"
              ? "Correo reenviado al tutor."
              : payload.email_estado === "sin_configurar"
                ? "El envío de correos todavía no está activado (falta configurar Resend)."
                : `No se pudo reenviar el correo: ${payload.email_error || payload.error || "error desconocido"}`;
          } catch (_) {
            adminFichasMessage = "No se pudo contactar al servidor para reenviar el correo.";
          }
          await hydrateGoogleSheetsData(true);
          renderAdminFichasRecibidas();
        });
        const vincularColegio = async (fichaId, colegioId, mensaje) => {
          const ficha = loadFichasAdhesionDemo().find((item) => item.id === fichaId);
          if (!ficha) return;
          await updateFichaAdhesionStatus(fichaId, ficha.estadoRevision || "pendiente", { colegioId, colegioVinculado: true }, mensaje);
          // El primer render consume el mensaje; se conserva para mostrarlo
          // después de recargar el nombre real del colegio desde la base.
          const resultado = googleSheetsSyncState.status === "ok" ? mensaje : googleSheetsSyncState.message;
          await hydrateGoogleSheetsData(true);
          adminFichasMessage = resultado;
          renderAdminFichasRecibidas();
        };
        document.querySelector("[data-ficha-vincular-colegio-btn]")?.addEventListener("click", () => {
          const colegioId = document.querySelector("[data-ficha-vincular-colegio]")?.value || "";
          if (!colegioId) {
            adminFichasMessage = "Elegí un colegio de la lista para vincular la ficha.";
            renderAdminFichasRecibidas();
            return;
          }
          vincularColegio(adminFichasSelectedId, colegioId, "Colegio vinculado a la ficha.");
        });
        document.querySelector("[data-ficha-crear-colegio]")?.addEventListener("click", async (event) => {
          const nombre = String(event.currentTarget.dataset.fichaCrearColegio || "").trim();
          const existente = adminColegios.find((colegio) => normalizeFichaSearchText(colegio.nombre) === normalizeFichaSearchText(nombre));
          if (existente) {
            await vincularColegio(adminFichasSelectedId, existente.id, `Ya existía “${existente.nombre}”: se vinculó a la ficha.`);
            return;
          }
          const colegio = { id: crypto.randomUUID(), nombre, provincia: "", localidad: "", codigo_oficial: "", activo: "TRUE" };
          adminColegios = [...adminColegios, colegio];
          const guardado = await queueGoogleSheetsWrite(["COLEGIOS"]);
          if (!guardado) {
            adminColegios = adminColegios.filter((item) => item.id !== colegio.id);
            adminFichasMessage = googleSheetsSyncState.message;
            renderAdminFichasRecibidas();
            return;
          }
          await vincularColegio(adminFichasSelectedId, colegio.id, `Colegio “${nombre}” creado y vinculado.`);
        });
        document.querySelectorAll("[data-ficha-tutor-estado]").forEach((select) => {
          select.addEventListener("change", async () => {
            adminFichasTutor = adminFichasTutor.map((tutor) => (
              tutor.id === select.dataset.fichaTutorEstado ? { ...tutor, estado_revision: select.value } : tutor
            ));
            const guardado = await queueGoogleSheetsWrite(["FICHAS_TUTOR"]);
            adminFichasMessage = guardado ? "Estado de la ficha de tutor guardado." : googleSheetsSyncState.message;
            renderAdminFichasRecibidas();
          });
        });
        document.querySelectorAll("[data-ficha-aprobar]").forEach((button) => {
          button.addEventListener("click", () => approveFichaAdhesionAndCreatePassenger(button.dataset.fichaAprobar));
        });
        document.querySelectorAll("[data-ficha-rechazar]").forEach((button) => {
          button.addEventListener("click", () => {
            adminFichasRejectId = button.dataset.fichaRechazar;
            adminFichasRejectError = "";
            renderAdminFichasRecibidas();
          });
        });
        document.querySelectorAll("[data-ficha-observar]").forEach((button) => {
          button.addEventListener("click", () => {
            markFichaAdhesionStatus(button.dataset.fichaObservar, "observada", "Guardado en la base de datos. Ficha marcada como observada.");
          });
        });
        document.querySelectorAll("[data-ficha-duplicada]").forEach((button) => {
          button.addEventListener("click", () => {
            markFichaAdhesionStatus(button.dataset.fichaDuplicada, "duplicada", "Guardado en la base de datos. Ficha marcada como duplicada.");
          });
        });
        document.querySelectorAll("[data-ficha-start-review]").forEach((button) => {
          button.addEventListener("click", () => startFichaAdhesionReview(button.dataset.fichaStartReview));
        });
        document.querySelectorAll("[data-ficha-assign]").forEach((field) => {
          field.addEventListener("change", () => {
            const fichaId = field.dataset.fichaAssign;
            const fieldName = field.dataset.fichaAssignField;
            const currentFicha = loadFichasAdhesionDemo().find((item) => item.id === fichaId);
            const current = fichaAssignmentContext(currentFicha || {});
            const patch = { [fieldName]: field.value };
            if (fieldName === "nivel") {
              const viaje = uniqueValues(adminPasajerosDemo.filter((group) => group.nivel === field.value), "viaje")[0] || "";
              const colegio = uniqueValues(adminPasajerosDemo.filter((group) => group.nivel === field.value && group.viaje === viaje), "colegio")[0] || "";
              const grupoId = adminPasajerosDemo.find((group) => group.nivel === field.value && group.viaje === viaje && group.colegio === colegio)?.id || "";
              Object.assign(patch, { viaje, colegio, grupoId, contratoId: "", codigoContrato: "" });
            }
            if (fieldName === "viaje") {
              const colegio = uniqueValues(adminPasajerosDemo.filter((group) => group.nivel === current.nivel && group.viaje === field.value), "colegio")[0] || "";
              const grupoId = adminPasajerosDemo.find((group) => group.nivel === current.nivel && group.viaje === field.value && group.colegio === colegio)?.id || "";
              Object.assign(patch, { colegio, grupoId, contratoId: "", codigoContrato: "" });
            }
            if (fieldName === "colegio") {
              const grupoId = adminPasajerosDemo.find((group) => group.nivel === current.nivel && group.viaje === current.viaje && group.colegio === field.value)?.id || "";
              Object.assign(patch, { grupoId, contratoId: "", codigoContrato: "" });
            }
            if (fieldName === "grupoId") {
              const group = adminPasajerosDemo.find((item) => item.id === field.value);
              if (group) Object.assign(patch, { nivel: group.nivel, viaje: group.viaje, colegio: group.colegio, contratoId: "", codigoContrato: "" });
            }
            if (fieldName === "contratoId") {
              const contract = adminContratoOptionsForGroup(current.grupoId).find((item) => item.id === field.value);
              Object.assign(patch, { codigoContrato: contract?.codigo_contrato || "" });
            }
            saveFichaAssignment(fichaId, patch);
          });
        });
        document.querySelectorAll("[data-ficha-save-assignment]").forEach((button) => {
          button.addEventListener("click", () => saveFichaAssignment(button.dataset.fichaSaveAssignment, {}));
        });
        document.querySelectorAll("[data-ficha-reject-cancel]").forEach((button) => {
          button.addEventListener("click", () => {
            adminFichasRejectId = "";
            adminFichasRejectError = "";
            renderAdminFichasRecibidas();
          });
        });
        document.querySelector("[data-ficha-reject-confirm]")?.addEventListener("click", (event) => {
          const reason = document.querySelector("[data-ficha-reject-reason]")?.value || "";
          rejectFichaAdhesion(event.currentTarget.dataset.fichaRejectConfirm, reason);
        });
      }

      function renderAdminPagos() {
        const paymentRows = adminPasajerosDemo.flatMap((group) => (
          group.pasajeros.map((passenger) => {
            const payment = passengerPaymentData(passenger);
            return { group, passenger, payment };
          })
        ));
        const totalSaldo = paymentRows.reduce((sum, row) => sum + parseAdminMoney(row.payment.saldo), 0);
        const totalPagado = paymentRows.reduce((sum, row) => sum + parseAdminMoney(row.payment.pagado), 0);
        const totalViajes = paymentRows.reduce((sum, row) => sum + parseAdminMoney(row.payment.valorViaje), 0);
        const specialPlans = paymentRows.filter((row) => row.payment.planPago !== "Regular").length;
        const overdue = paymentRows.filter((row) => row.payment.estadoPago === "Vencido").length;
        const pending = paymentRows.filter((row) => row.payment.estadoPago !== "Al día").length;
        const collectionRate = totalViajes ? Math.round((totalPagado / totalViajes) * 100) : 0;
        const rowsHtml = paymentRows.map(({ group, passenger, payment }) => `
          <tr>
            <td class="admin-payment-passenger-cell">
              <strong>${escapeHtml(passenger.nombre)}</strong>
              <span>DNI ${escapeHtml(passenger.dni || "Pendiente")}</span>
              <span>${escapeHtml(group.colegio)} · ${escapeHtml(group.curso)} ${escapeHtml(group.division)}</span>
            </td>
            <td class="admin-payment-summary-cell">
              <strong>${escapeHtml(formatAdminMoney(payment.valorViaje))}</strong>
              <span>Pagado: ${escapeHtml(formatAdminMoney(payment.pagado))}</span>
              <span>Saldo: ${escapeHtml(formatAdminMoney(payment.saldo))}</span>
            </td>
            <td>
              <span class="admin-pasajeros-status ${adminStatusClass(payment.estadoPago)}">${escapeHtml(payment.estadoPago)}</span>
              <span>${escapeHtml(payment.planPago)} · ${escapeHtml(payment.cuotas || "Pendiente")} cuotas</span>
              <span>Próxima: ${escapeHtml(payment.proximaCuota || "Pendiente")}</span>
            </td>
            <td>
              <div class="admin-installments-strip">
                ${renderInstallmentCells(passenger)}
              </div>
            </td>
            <td>
              <div class="admin-payment-history">
                ${renderPaymentHistoryCells(passenger)}
              </div>
            </td>
          </tr>
        `).join("");

        document.getElementById("app").innerHTML = renderAdminShell("pagos", `
          <section class="admin-turismo-panel">
            <h1>Pagos y cuotas</h1>
            <p>Control de cobranza conectado a Pasajeros. Mantiene resumen, cuotas e historial preparado para registrar pagos reales más adelante.</p>
            <div class="admin-demo-banner" role="note">
              <span class="admin-demo-banner-icon material-symbols-outlined" aria-hidden="true">info</span>
              <div>
                <strong>Datos de ejemplo</strong>
                <p>Los montos, cuotas, vencimientos y estados de pago que se ven acá son de muestra: <strong>no reflejan la cobranza real</strong>. Esta sección se conectará a los datos reales más adelante.</p>
              </div>
            </div>
            <div class="admin-payment-dashboard">
              <article>
                <strong>${paymentRows.length}</strong>
                <span>Pasajeros con control</span>
              </article>
              <article>
                <strong>${escapeHtml(formatAdminMoney(totalViajes))}</strong>
                <span>Total viajes</span>
              </article>
              <article>
                <strong>${escapeHtml(formatAdminMoney(totalPagado))}</strong>
                <span>Total pagado</span>
              </article>
              <article>
                <strong>${escapeHtml(formatAdminMoney(totalSaldo))}</strong>
                <span>Saldo pendiente</span>
              </article>
              <article>
                <strong>${collectionRate}%</strong>
                <span>Avance de cobro</span>
              </article>
              <article>
                <strong>${specialPlans}</strong>
                <span>Planes especiales</span>
              </article>
              <article>
                <strong>${pending}</strong>
                <span>Con pago pendiente</span>
              </article>
              <article>
                <strong>${overdue}</strong>
                <span>Pagos vencidos</span>
              </article>
            </div>
          </section>

          <section class="admin-turismo-panel admin-payment-architecture">
            <div>
              <h2>Estructura preparada para pagos reales</h2>
              <p>La pantalla ya separa los datos necesarios para pasar de control manual a registro real.</p>
            </div>
            <div class="admin-payment-architecture-grid">
              <article>
                <span>Resumen</span>
                <strong>Valor, pagado, saldo y avance</strong>
              </article>
              <article>
                <span>Historial</span>
                <strong>Fecha, concepto, medio, monto y estado</strong>
              </article>
              <article>
                <span>Cuotas</span>
                <strong>Pagada, parcial, pendiente o vencida</strong>
              </article>
              <article>
                <span>Integración futura</span>
                <strong>Comprobante, Mercado Pago, transferencia o caja</strong>
              </article>
            </div>
          </section>

          <section class="admin-turismo-panel admin-pasajeros-table-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Control por pasajero</h2>
                <p>Vista compacta con resumen, estado de cuotas e historial preparado por pasajero.</p>
              </div>
              <strong>${paymentRows.length} registros</strong>
            </div>
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-payment-table">
                <thead>
                  <tr>
                    <th>Pasajero</th>
                    <th>Resumen</th>
                    <th>Estado</th>
                    <th>Cuotas</th>
                    <th>Historial</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            </div>
          </section>
        `);
        bindAdminShell();
      }

      function renderAdminTurismoContent() {
        const trip = adminTurismoCurrentTrip() || {};
        const readiness = adminTurismoReadiness(trip);
        const summary = adminTurismoTrips.reduce((acc, item) => {
          const state = adminTurismoReadiness(item);
          acc.total += 1;
          acc[state.key] = (acc[state.key] || 0) + 1;
          if (item.estado === "activo") acc.activos += 1;
          return acc;
        }, { total: 0, activos: 0, listo: 0, publicado: 0, borrador: 0, incompleto: 0, inactivo: 0 });
        const editorHtml = adminTurismoEditorOpen ? `
            <section class="admin-turismo-panel admin-turismo-editor-panel" data-admin-turismo-editor>
              <div class="admin-turismo-section-head">
                <div>
                  <p>Formulario de carga</p>
                  <h2>${trip.id ? "Editar viaje" : "Cargar viaje"}</h2>
                </div>
                <span class="admin-turismo-status ${escapeHtml(readiness.key)}">${escapeHtml(readiness.label)}</span>
              </div>
              ${renderAdminTurismoForm(trip)}
            </section>

            <section class="admin-turismo-panel admin-turismo-flow-status" data-admin-checklist-section>
              <div class="admin-turismo-section-head">
                <div>
                  <p>Checklist</p>
                  <h2>Revisión del viaje</h2>
                </div>
                <span class="admin-turismo-status ${escapeHtml(readiness.key)}">${escapeHtml(readiness.label)}</span>
              </div>
              ${renderAdminTurismoPublicationState(trip)}
            </section>

            <section class="admin-turismo-panel admin-turismo-preview-panel" data-admin-preview-section>
              <div class="admin-turismo-section-head">
                <div>
                  <p>Previsualización</p>
                  <h2>Card, detalle y WhatsApp</h2>
                </div>
              </div>
              ${renderAdminTurismoPreviewActions()}
            </section>

            ${renderAdminTurismoPrimaryActions(trip)}
            ${renderAdminTurismoSidePanel(trip)}
        ` : "";
        return `
          <div class="admin-turismo-layout">
            <section class="admin-turismo-hero">
              <div class="admin-turismo-hero-head">
                <div class="admin-turismo-hero-copy">
                  <p>Contenido público</p>
                  <h1>Turismo web</h1>
                  <span>Administrá los destinos que se muestran en la web sin salir del panel.</span>
                </div>
              </div>
              <div class="admin-turismo-hero-stats">
                <article><strong>${summary.total}</strong><span>Cargados</span></article>
                <article><strong>${summary.activos}</strong><span>Activos</span></article>
                <article><strong>${summary.listo || 0}</strong><span>Listos</span></article>
                <article><strong>${summary.activos}</strong><span>Visibles en web</span></article>
              </div>
            </section>

            <section class="admin-turismo-panel admin-turismo-create-panel">
              <div>
                <p>Nuevo contenido</p>
                <h2>Crear un nuevo viaje</h2>
                <span>Cargá el destino, sus fechas, precio y fotos. Podés guardarlo como borrador antes de activarlo en la web.</span>
              </div>
              <button type="button" data-admin-new>Nuevo viaje</button>
            </section>

            <section class="admin-turismo-panel admin-turismo-list-panel">
              <div class="admin-turismo-section-head">
                <div>
                  <p>Biblioteca de viajes</p>
                  <h2>Destinos cargados</h2>
                </div>
                <span class="admin-turismo-list-count"><strong>${summary.total}</strong> viaje${summary.total === 1 ? "" : "s"}</span>
              </div>
              <div class="admin-turismo-list">
                ${renderAdminTurismoTripRows()}
              </div>
            </section>

            ${editorHtml}
          </div>
        `;
      }

      function renderAdminTurismo() {
        document.getElementById("app").innerHTML = renderAdminShell("turismo", renderAdminTurismoContent());
        bindAdminShell();
        bindAdminTurismo();
        bindTurismoCardCarousels(document.querySelector(".admin-turismo-layout"));
      }

      function exportAdminTurismoJson() {
        const data = JSON.stringify(adminTurismoTrips.map(normalizeAdminTurismoTrip).sort((a, b) => a.orden - b.orden), null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "turismo-paquetes.json";
        link.click();
        URL.revokeObjectURL(url);
      }

      function bindAdminTurismo() {
        document.querySelector("[data-admin-import-public-trips]")?.addEventListener("click", () => {
          importAdminTurismoPublicDefaults();
        });

        document.querySelectorAll("[data-admin-edit], [data-admin-preview]").forEach((button) => {
          button.addEventListener("click", () => {
            adminTurismoEditingId = button.dataset.adminEdit || button.dataset.adminPreview;
            adminTurismoEditorOpen = true;
            renderAdminTurismo();
          });
        });

        document.querySelectorAll("[data-admin-delete]").forEach((button) => {
          button.addEventListener("click", () => {
            const tripId = button.dataset.adminDelete;
            const trip = adminTurismoTrips.find((item) => item.id === tripId);
            const tripName = trip?.titulo || trip?.destino || "este viaje";
            // Usamos la versión CON feedback: si falla la sync, el operador tiene que
            // saberlo explícitamente, no asumir en silencio que se borró en la base.
            if (!window.confirm(`¿Eliminar ${tripName}?\n\nEsta acción borra el viaje de este administrador y actualiza la base de datos.`)) return;
            adminTurismoTrips = adminTurismoTrips.filter((item) => item.id !== tripId);
            if (adminTurismoEditingId === tripId) {
              adminTurismoEditingId = adminTurismoTrips[0]?.id || null;
              adminTurismoEditorOpen = false;
            }
            renderAdminTurismo();
            saveAdminTurismoTripsWithFeedback([tripId]).then(() => renderAdminTurismo()).catch(() => renderAdminTurismo());
          });
        });

        document.querySelectorAll("[data-admin-new]").forEach((button) => {
          button.addEventListener("click", () => {
            const id = `demo-${Date.now()}`;
            adminTurismoTrips = [
              {
                id,
                slug: "",
                destino: "",
                titulo: "",
                duracion: "",
                temporada: "",
                precioDesde: "",
                precioValor: null,
                moneda: "ARS",
                categorias: [],
                descripcionCorta: "",
                descripcionLarga: "",
                incluye: [],
                noIncluye: [],
                fotos: [],
                estado: "borrador",
                destacado: false,
                orden: adminTurismoTrips.length + 1
              },
              ...adminTurismoTrips
            ];
            adminTurismoEditingId = id;
            adminTurismoEditorOpen = true;
            saveAdminTurismoTrips();
            renderAdminTurismo();
          });
        });

        document.querySelectorAll("[data-admin-export]").forEach((button) => {
          button.addEventListener("click", exportAdminTurismoJson);
        });

        // Botón guardar viaje — respeta el estado elegido en Configuración
        document.querySelector("[data-admin-guardar-viaje]")?.addEventListener("click", () => {
          const form = document.querySelector("[data-admin-turismo-form]");
          if (form) form.requestSubmit();
        });

        // Mantener compatibilidad con data-admin-save-draft si existe en otro lado
        document.querySelector("[data-admin-save-draft]")?.addEventListener("click", () => {
          const form = document.querySelector("[data-admin-turismo-form]");
          if (form) form.requestSubmit();
        });

        document.querySelector("[data-admin-publish]")?.addEventListener("click", () => {
          const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          const readiness = adminTurismoReadiness(trip);
          if (!readiness.canPublish) {
            window.alert(`No se puede publicar todavía.\n\nFalta:\n- ${readiness.missing.map((item) => item.label).join("\n- ")}`);
            return;
          }
          const publishedMap = loadAdminTurismoPublishedMap();
          publishedMap[trip.id] = {
            slug: trip.slug,
            signature: adminTurismoTripSignature(trip),
            exportedAt: new Date().toISOString()
          };
          saveAdminTurismoPublishedMap(publishedMap);
          exportAdminTurismoJson();
          window.alert("Se exportó turismo-paquetes.json.\n\nPara verlo en la web pública, reemplazá assets/data/turismo-paquetes.json por este archivo y verificá en Turismo.");
          renderAdminTurismo();
        });

        document.querySelector("[data-admin-preview-public]")?.addEventListener("click", () => {
          const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          const readiness = adminTurismoReadiness(trip);
          if (!readiness.canPublish) {
            window.alert(`No se puede activar la prueba pública todavía.\n\nFalta:\n- ${readiness.missing.map((item) => item.label).join("\n- ")}`);
            return;
          }
          setTurismoPublicPreviewMode(true);
          window.open("/#/turismo", "_blank");
          renderAdminTurismo();
        });

        document.querySelector("[data-admin-disable-preview]")?.addEventListener("click", () => {
          setTurismoPublicPreviewMode(false);
          renderAdminTurismo();
        });

        document.querySelector("[data-admin-duplicate]")?.addEventListener("click", () => {
          const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          if (!trip.id) return;
          const id = `viaje-${Date.now()}`;
          const duplicated = normalizeAdminTurismoTrip({
            ...trip,
            id,
            slug: `${trip.slug || "viaje"}-copia`,
            titulo: `${trip.titulo || trip.destino || "Viaje"} copia`,
            estado: "borrador",
            orden: adminTurismoTrips.length + 1
          });
          duplicated.slug = uniqueAdminTurismoSlug(duplicated.slug, id);
          adminTurismoTrips = [duplicated, ...adminTurismoTrips];
          adminTurismoEditingId = id;
          saveAdminTurismoTripsWithFeedback().finally(() => renderAdminTurismo());
        });

        document.querySelector("[data-admin-deactivate]")?.addEventListener("click", () => {
          const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          if (!trip.id) return;
          adminTurismoTrips = adminTurismoTrips.map((item) => item.id === trip.id ? { ...item, estado: "inactivo" } : item);
          renderAdminTurismo();
          saveAdminTurismoTripsWithFeedback().then(() => renderAdminTurismo()).catch(() => renderAdminTurismo());
        });

        // --- Aplicar estado rápido desde el panel de publicación ---
        document.querySelector("[data-admin-turismo-apply-estado]")?.addEventListener("click", () => {
          const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          if (!trip.id) {
            window.alert("Guardá el viaje primero antes de cambiar el estado.");
            return;
          }
          const select = document.querySelector("[data-admin-turismo-estado-quick]");
          if (!select) return;
          const nuevoEstado = select.value;
          adminTurismoTrips = adminTurismoTrips.map((item) => item.id === trip.id ? { ...item, estado: nuevoEstado } : item);
          renderAdminTurismo();
          saveAdminTurismoTripsWithFeedback().then(() => renderAdminTurismo()).catch(() => renderAdminTurismo());
        });

        document.querySelector("[data-admin-scroll-preview]")?.addEventListener("click", () => {
          document.querySelector("[data-admin-preview-section]")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        document.querySelector("[data-admin-scroll-checklist]")?.addEventListener("click", () => {
          document.querySelector("[data-admin-checklist-section]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });

        // --- Preview de foto al pegar URL ---
        document.querySelector("[data-nueva-foto]")?.addEventListener("input", (event) => {
          const url = event.target.value.trim();
          const preview = document.getElementById("new-foto-preview");
          if (!preview) return;
          preview.replaceChildren();
          const safeUrl = safeMediaUrl(url);
          if (!safeUrl) {
            const message = document.createElement("span");
            message.textContent = url ? "URL inválida" : "Preview";
            preview.append(message);
            return;
          }
          const image = document.createElement("img");
          image.src = safeUrl;
          image.alt = "Preview";
          const error = document.createElement("div");
          error.className = "admin-turismo-foto-error";
          error.textContent = "URL inválida";
          error.style.display = "none";
          image.addEventListener("error", () => {
            image.style.display = "none";
            error.style.display = "flex";
          });
          preview.append(image, error);
        });

        // --- Agregar foto ---
        document.querySelector("[data-add-foto]")?.addEventListener("click", () => {
          const urlInput = document.getElementById("new-foto-url");
          const altInput = document.getElementById("new-foto-alt");
          if (!urlInput) return;
          const url = safeMediaUrl(urlInput.value);
          if (!url) { urlInput.focus(); return; }
          const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          const newFoto = { url, alt: altInput?.value?.trim() || "", principal: trip.fotos.length === 0 };
          trip.fotos.push(newFoto);
          const index = adminTurismoTrips.findIndex((t) => t.id === adminTurismoEditingId);
          if (index >= 0) adminTurismoTrips[index] = { ...adminTurismoTrips[index], fotos: trip.fotos };
          saveAdminTurismoTrips();
          renderAdminTurismo();
        });

        // --- Quitar foto ---
        document.querySelectorAll("[data-remove-foto]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const fotoIndex = Number(btn.dataset.removeFoto);
            const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
            trip.fotos.splice(fotoIndex, 1);
            if (trip.fotos.length && !trip.fotos.some((f) => f.principal)) trip.fotos[0].principal = true;
            const index = adminTurismoTrips.findIndex((t) => t.id === adminTurismoEditingId);
            if (index >= 0) adminTurismoTrips[index] = { ...adminTurismoTrips[index], fotos: trip.fotos };
            saveAdminTurismoTrips();
            renderAdminTurismo();
          });
        });

        // --- Agregar día de itinerario ---
        document.querySelector("[data-add-dia]")?.addEventListener("click", () => {
          const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          const itinerario = [...(trip.itinerario || []), { dia: String(trip.itinerario.length + 1), titulo: "", descripcion: "" }];
          const index = adminTurismoTrips.findIndex((t) => t.id === adminTurismoEditingId);
          if (index >= 0) adminTurismoTrips[index] = { ...adminTurismoTrips[index], itinerario };
          saveAdminTurismoTrips();
          renderAdminTurismo();
        });

        // --- Quitar día de itinerario ---
        document.querySelectorAll("[data-remove-dia]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const diaIndex = Number(btn.dataset.removeDia);
            const trip = normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
            trip.itinerario.splice(diaIndex, 1);
            const index = adminTurismoTrips.findIndex((t) => t.id === adminTurismoEditingId);
            if (index >= 0) adminTurismoTrips[index] = { ...adminTurismoTrips[index], itinerario: trip.itinerario };
            saveAdminTurismoTrips();
            renderAdminTurismo();
          });
        });

        document.querySelector("[data-admin-open-card-preview]")?.addEventListener("click", () => {
          const modal = document.querySelector("[data-admin-card-modal]");
          if (!modal) return;
          modal.classList.add("is-open");
          modal.setAttribute("aria-hidden", "false");
          document.body.classList.add("admin-modal-open");
        });

        document.querySelectorAll("[data-admin-close-card-preview]").forEach((button) => {
          button.addEventListener("click", () => {
            const modal = document.querySelector("[data-admin-card-modal]");
            if (!modal) return;
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("admin-modal-open");
          });
        });

        document.querySelector("[data-admin-open-detail-preview]")?.addEventListener("click", () => {
          const modal = document.querySelector("[data-admin-detail-modal]");
          if (!modal) return;
          modal.classList.add("is-open");
          modal.setAttribute("aria-hidden", "false");
          document.body.classList.add("admin-modal-open");
        });

        document.querySelectorAll("[data-admin-close-detail-preview]").forEach((button) => {
          button.addEventListener("click", () => {
            const modal = document.querySelector("[data-admin-detail-modal]");
            if (!modal) return;
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("admin-modal-open");
          });
        });

        document.querySelector("[data-admin-open-whatsapp-preview]")?.addEventListener("click", () => {
          const modal = document.querySelector("[data-admin-whatsapp-modal]");
          if (!modal) return;
          modal.classList.add("is-open");
          modal.setAttribute("aria-hidden", "false");
          document.body.classList.add("admin-modal-open");
        });

        document.querySelectorAll("[data-admin-close-whatsapp-preview]").forEach((button) => {
          button.addEventListener("click", () => {
            const modal = document.querySelector("[data-admin-whatsapp-modal]");
            if (!modal) return;
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("admin-modal-open");
          });
        });

        document.querySelector("[data-admin-turismo-form]")?.addEventListener("submit", (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const id = adminTurismoEditingId || `viaje-${Date.now()}`;

          // Leer fotos desde los campos individuales
          const fotosCount = Number(formData.get("fotos_count") || 0);
          const fotosArray = [];
          for (let i = 0; i < fotosCount; i++) {
            const url = String(formData.get(`foto_url_${i}`) || "").trim();
            if (url) fotosArray.push({ url, alt: String(formData.get(`foto_alt_${i}`) || "").trim(), principal: false });
          }
          const principalIndex = Number(formData.get("fotoPrincipal") || 0);
          if (fotosArray[principalIndex]) fotosArray[principalIndex].principal = true;
          else if (fotosArray.length) fotosArray[0].principal = true;

          // Leer itinerario desde campos dinámicos
          const itinerarioArray = [];
          let diaIndex = 0;
          while (formData.get(`itinerario_titulo_${diaIndex}`) !== null || formData.get(`itinerario_desc_${diaIndex}`) !== null) {
            const titulo = String(formData.get(`itinerario_titulo_${diaIndex}`) || "").trim();
            const descripcion = String(formData.get(`itinerario_desc_${diaIndex}`) || "").trim();
            if (titulo || descripcion) itinerarioArray.push({ dia: String(diaIndex + 1), titulo, descripcion });
            diaIndex++;
          }

          const baseTrip = {
            id,
            slug: formData.get("slug") || "",
            destino: formData.get("destino") || "",
            titulo: formData.get("titulo") || "",
            duracion: formData.get("duracion") || "",
            temporada: formData.get("temporada") || "",
            fechaSalida: formData.get("fechaSalida") || "",
            fechaRegreso: formData.get("fechaRegreso") || "",
            salidaGarantizada: formData.get("salidaGarantizada") === "on",
            precioDesde: formData.get("precioDesde") || "",
            precioValor: formData.get("precioBaseDoble") || null,
            moneda: formData.get("moneda") || "USD",
            precioBaseDoble: formData.get("precioBaseDoble") || "",
            suplementoSingle: formData.get("suplementoSingle") || "",
            precioMenor: formData.get("precioMenor") || "",
            condicionVenta: formData.get("condicionVenta") || "",
            categorias: formData.getAll("categorias"),
            descripcionCorta: formData.get("descripcionCorta") || "",
            descripcionLarga: formData.get("descripcionLarga") || "",
            incluye: formData.get("incluye") || "",
            noIncluye: formData.get("noIncluye") || "",
            formasPago: formData.get("formasPago") || "",
            itinerario: itinerarioArray,
            fotos: fotosArray,
            estado: formData.get("estado") || "borrador",
            destacado: formData.get("destacado") === "on",
            orden: formData.get("orden") || 999
          };
          const nextTrip = normalizeAdminTurismoTrip(baseTrip);
          nextTrip.slug = uniqueAdminTurismoSlug(nextTrip.slug, id);
          nextTrip.fotos = fotosArray.length ? fotosArray : normalizeAdminTurismoPhotos(baseTrip.fotos);
          const existingIndex = adminTurismoTrips.findIndex((trip) => trip.id === id);
          if (existingIndex >= 0) {
            adminTurismoTrips[existingIndex] = nextTrip;
          } else {
            adminTurismoTrips.unshift(nextTrip);
          }
          adminTurismoEditingId = id;
          // Render inmediato para mostrar el estado guardado, feedback llega async
          renderAdminTurismo();
          saveAdminTurismoTripsWithFeedback().then(() => renderAdminTurismo()).catch(() => renderAdminTurismo());
        });
      }

      function renderEstudiantil() {
        document.getElementById("app").innerHTML = `
          <div class="layout estudiantil-layout">
            <section class="estudiantil-hero">
              <div class="estudiantil-hero-content">
                <p class="hero-kicker">Viajes estudiantiles</p>
                <h1>Información clara para elegir el viaje del curso</h1>
                <p>Propuestas para primaria y secundaria con destinos separados, datos simples y acceso directo a inscripción cuando el grupo ya está decidido.</p>
                <div class="estudiantil-hero-actions">
                  <a href="#/estudiantil" data-scroll-target="viajes-estudiantiles">Ver viajes</a>
                  <a href="#/inscripcion">Inscribirse</a>
                </div>
              </div>
            </section>

            <section class="student-experience">
              <p class="section-kicker">Cómo avanzar</p>
              <h2>Primero encontrá el destino correcto. Después revisá la información y completá la inscripción.</h2>
              <p>La página separa cada viaje para evitar confusiones entre primaria, secundaria, Bariloche y Carlos Paz.</p>
            </section>

            <section class="student-path-section" id="viajes-estudiantiles">
              <div class="student-path-heading">
                <p class="section-kicker">Viajes disponibles</p>
                <h2>Elegí la opción que corresponde al grupo</h2>
                <p>Entrá al viaje para ver la información específica antes de consultar o inscribirte.</p>
              </div>
              <div class="student-path-grid">
                ${[
                  {
                    title: "Primaria Carlos Paz",
                    meta: "📍 Carlos Paz · 5 días / 4 noches",
                    variant: "primary-carlos-paz",
                    text: "Una experiencia cuidada para el primer gran viaje de egresados, con actividades, coordinación y acompañamiento.",
                    href: "#/estudiantil/primaria-carlos-paz"
                  },
                  {
                    title: "Secundaria Bariloche",
                    meta: "📍 Bariloche · 7 días / 6 noches",
                    variant: "secondary-bariloche",
                    text: "El viaje clásico de egresados a Bariloche, con experiencias, salidas, coordinación y asesoramiento.",
                    href: "#/estudiantil/secundaria-bariloche"
                  },
                  {
                    title: "Secundaria Carlos Paz",
                    meta: "📍 Carlos Paz · 5 días / 4 noches",
                    variant: "secondary-carlos-paz",
                    text: "Una alternativa cercana y completa para grupos de secundaria que buscan viaje de egresados con organización clara.",
                    href: "#/estudiantil/secundaria-carlos-paz"
                  }
                ].map(path => `
                  <article class="student-path-card">
                    <div class="student-path-visual is-${path.variant}" aria-hidden="true"></div>
                    <div class="student-path-body">
                      <p class="student-path-kicker">Viaje estudiantil</p>
                      <h3>${path.title}</h3>
                      <p class="student-path-meta">${path.meta}</p>
                      <p>${path.text}</p>
                      <a href="${path.href}">Ver viaje</a>
                    </div>
                  </article>
                `).join("")}
              </div>
            </section>

            <section class="estudiantil-trust">
              <h2>${trustSectionData.title}</h2>
              <div class="items">
                ${trustSectionData.cards.map(card => `
                  <article class="item">
                    <h3>${card.title}</h3>
                    <p>${card.text}</p>
                  </article>
                `).join("")}
              </div>
            </section>

            <section class="estudiantil-cta">
              <h2>${estudiantilData.finalCta.title}</h2>
              <p>${estudiantilData.finalCta.text}</p>
              <a href="${estudiantilData.finalCta.button[1]}" target="_blank" rel="noopener">${estudiantilData.finalCta.button[0]}</a>
            </section>
          </div>
        `;
      }

      function renderPrimariaCarlosPaz() {
        document.getElementById("app").innerHTML = `
          <div class="layout student-detail-layout">
            <section class="student-detail-hero primary">
              <div class="student-detail-hero-content">
                <p class="hero-kicker">Primaria</p>
                <h1>Primaria Carlos Paz</h1>
                <p>Viaje pensado para que el grupo viva una experiencia segura, organizada y acompañada en Carlos Paz.</p>
                <div class="student-detail-hero-actions">
                  <a href="#/inscripcion">Inscribirse</a>
                  <a href="#/estudiantil/primaria-carlos-paz" data-scroll-target="detalles-del-viaje">Ver detalles</a>
                </div>
              </div>
            </section>

            <section class="student-detail-experience" id="detalles-del-viaje">
              <p class="section-kicker">Experiencia</p>
              <h2>${primariaCarlosPazData.experience.title}</h2>
              <p>${primariaCarlosPazData.experience.text}</p>
            </section>

            <section class="student-detail-benefits">
              <p class="section-kicker">Qué incluye la propuesta</p>
              <h2>Beneficios</h2>
              <ul>
                ${primariaCarlosPazData.benefits.map(benefit => `<li>${benefit}</li>`).join("")}
              </ul>
            </section>

            <section class="student-detail-cta">
              <h2>${primariaCarlosPazData.finalCta.title}</h2>
              <p>${primariaCarlosPazData.finalCta.text}</p>
              <div class="student-detail-cta-actions">
                <a href="#/inscripcion">Inscribirse</a>
                <a class="student-detail-cta-secondary" href="${primariaCarlosPazData.finalCta.button[1]}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
              </div>
            </section>
          </div>
        `;
      }

      function renderSecundariaBariloche() {
        const renderExperienceGallery = item => {
          if (item.gallery?.length) {
            return item.gallery.map((src, index) => `
              <div class="bariloche-gallery-slot">
                <img src="${src}" alt="${item.name} ${index + 1}" loading="lazy">
              </div>
            `).join("");
          }

          return Array.from(
            { length: item.gallerySlots || 3 },
            () => `<div class="bariloche-gallery-slot"></div>`
          ).join("");
        };

        const renderExperienceVideo = item => {
          if (item.videos?.length) {
            return item.videos.map((src, index) => `
              <div class="bariloche-experience-video">
                <video src="${src}" controls preload="metadata" aria-label="Video ${index + 1} de ${item.name}"></video>
              </div>
            `).join("");
          }

          return `<div class="bariloche-experience-video" aria-label="Video de ${item.name}"></div>`;
        };

        const renderExperienceCategory = category => `
          <div class="bariloche-experience-category">
            <h3>${category.title}</h3>
            <div class="bariloche-experience-grid">
              ${category.items.map(item => `
                <article class="bariloche-experience-card">
                  <h4>${item.name}</h4>
                  <div class="bariloche-experience-photo" aria-label="Foto principal de ${item.name}">
                    ${item.cover ? `<img src="${item.cover}" alt="${item.name}" loading="lazy">` : ""}
                  </div>
                  <div class="bariloche-gallery-grid" aria-label="Galería de ${item.name}">
                    ${renderExperienceGallery(item)}
                  </div>
                  ${renderExperienceVideo(item)}
                  <div class="bariloche-experience-description" aria-label="Descripción corta de ${item.name}">${item.description}</div>
                </article>
              `).join("")}
            </div>
          </div>
        `;

        document.getElementById("app").innerHTML = `
          <div class="layout student-detail-layout">
            <section class="student-detail-hero">
              <div class="student-detail-hero-content">
                <p class="hero-kicker">Secundaria</p>
                <h1>Secundaria Bariloche</h1>
                <p>El viaje de egresados a Bariloche presentado con experiencias, actividades y consulta directa.</p>
                <div class="student-detail-hero-actions">
                  <a href="#/inscripcion">Inscribirse</a>
                  <a href="#/estudiantil/secundaria-bariloche" data-scroll-target="experiencias-bariloche">Ver experiencias</a>
                </div>
              </div>
            </section>

            <section class="bariloche-experiences" id="experiencias-bariloche">
              <p class="section-kicker">Experiencias</p>
              <h2>Qué experiencias te esperan</h2>
              ${secundariaBarilocheData.experiences.map(renderExperienceCategory).join("")}
            </section>

            <section class="student-detail-cta">
              <h2>${secundariaBarilocheData.finalCta.title}</h2>
              <p>${secundariaBarilocheData.finalCta.text}</p>
              <div class="student-detail-cta-actions">
                <a href="#/inscripcion">Inscribirse</a>
                <a class="student-detail-cta-secondary" href="${secundariaBarilocheData.finalCta.button[1]}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
              </div>
            </section>
          </div>
        `;
      }

      function renderSecundariaCarlosPaz() {
        document.getElementById("app").innerHTML = `
          <div class="layout student-detail-layout">
            <section class="student-detail-hero">
              <div class="student-detail-hero-content">
                <p class="hero-kicker">Secundaria</p>
                <h1>Secundaria Carlos Paz</h1>
                <p>Una propuesta estudiantil clara y cercana para grupos de secundaria que eligen Carlos Paz.</p>
                <div class="student-detail-hero-actions">
                  <a href="#/inscripcion">Inscribirse</a>
                  <a href="#/estudiantil/secundaria-carlos-paz" data-scroll-target="detalles-del-viaje">Ver detalles</a>
                </div>
              </div>
            </section>

            <section class="student-detail-experience" id="detalles-del-viaje">
              <p class="section-kicker">Experiencia</p>
              <h2>${secundariaCarlosPazData.experience.title}</h2>
              <p>${secundariaCarlosPazData.experience.text}</p>
            </section>

            <section class="student-detail-benefits">
              <p class="section-kicker">Qué incluye la propuesta</p>
              <h2>Beneficios</h2>
              <ul>
                ${secundariaCarlosPazData.benefits.map(benefit => `<li>${benefit}</li>`).join("")}
              </ul>
            </section>

            <section class="student-detail-cta">
              <h2>${secundariaCarlosPazData.finalCta.title}</h2>
              <p>${secundariaCarlosPazData.finalCta.text}</p>
              <div class="student-detail-cta-actions">
                <a href="#/inscripcion">Inscribirse</a>
                <a class="student-detail-cta-secondary" href="${secundariaCarlosPazData.finalCta.button[1]}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
              </div>
            </section>
          </div>
        `;
      }

      function renderNosotros() {
        document.getElementById("app").innerHTML = `
          <div class="layout institutional-layout">
            <section class="institutional-hero">
              <div>
                <p class="section-kicker">Quiénes somos</p>
                <h1>El Ángel Azul</h1>
                <p>Una empresa de viajes enfocada en turismo y experiencias estudiantiles, con atención cercana desde la consulta hasta la inscripción.</p>
                <div class="institutional-actions">
                  <a href="#/turismo">Ver Turismo</a>
                  <a href="#/estudiantil">Ver Estudiantil</a>
                </div>
              </div>
              <img class="institutional-logo" src="${companyData.logo}" alt="El Ángel Azul">
            </section>

            <section class="institutional-split">
              <article>
                <p class="section-kicker">Turismo</p>
                <h2>Viajes para familias, parejas y grupos</h2>
                <p>Paquetes nacionales e internacionales con consulta directa y acompañamiento para elegir la mejor opción.</p>
                <a href="#/turismo">Explorar paquetes</a>
              </article>
              <article>
                <p class="section-kicker">Estudiantil</p>
                <h2>Información clara para colegios y cursos</h2>
                <p>Propuestas separadas por destino y nivel para que cada grupo encuentre rápido su viaje correspondiente.</p>
                <a href="#/estudiantil">Ver viajes estudiantiles</a>
              </article>
            </section>

            <section class="institutional-contact-strip">
              <h2>Consultas y atención</h2>
              <p>Para dudas sobre viajes, disponibilidad o inscripción, el canal principal es WhatsApp.</p>
              <a href="${whatsappLink("Hola, quiero consultar por El Ángel Azul.")}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
            </section>
          </div>
        `;
      }

      function renderContacto() {
        document.getElementById("app").innerHTML = `
          <div class="layout institutional-layout">
            <section class="institutional-hero contact-hero">
              <div>
                <p class="section-kicker">Contacto</p>
                <h1>Hablemos de tu próximo viaje</h1>
                <p>Escribinos para consultar por paquetes turísticos, viajes estudiantiles, inscripción o disponibilidad.</p>
                <div class="institutional-actions">
                  <a href="${whatsappLink("Hola, quiero consultar por un viaje con El Ángel Azul.")}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
                  <a href="#/inscripcion">Ir a inscripción</a>
                </div>
              </div>
              <img class="institutional-logo" src="${companyData.logo}" alt="El Ángel Azul">
            </section>

            <section class="contact-options">
              <article>
                <p class="section-kicker">WhatsApp</p>
                <h2>Consultas directas</h2>
                <p>Para disponibilidad, formas de pago, contratos o dudas sobre el viaje.</p>
                <a href="${whatsappLink("Hola, quiero consultar por un viaje con El Ángel Azul.")}" target="_blank" rel="noopener">Enviar mensaje</a>
              </article>
              <article>
                <p class="section-kicker">Instagram</p>
                <h2>Redes sociales</h2>
                <p>Seguinos según el tipo de viaje que estás buscando.</p>
                <div class="contact-socials">
                  <a href="${companyData.instagram.estudiantil}" target="_blank" rel="noopener">Estudiantil</a>
                  <a href="${companyData.instagram.turismo}" target="_blank" rel="noopener">Turismo</a>
                </div>
              </article>
            </section>

            <section class="institutional-contact-strip">
              <h2>Marca</h2>
              <p>${companyData.address}</p>
              <img class="brand-mark" src="${companyData.mark}" alt="">
            </section>
          </div>
        `;
      }

      function portalStatusTone(value) {
        return window.ElAngelAzulPortal.statusTone(value);
      }

      function portalPaymentStatus(record) {
        return window.ElAngelAzulPortal.paymentStatus(record);
      }

      function portalDocumentationItems(record) {
        return window.ElAngelAzulPortal.documentationItems(record);
      }

      function renderPortalDocumentation(record) {
        const items = portalDocumentationItems(record);
        const pendingItems = items.filter(item => !item.isComplete);
        if (!pendingItems.length) {
          return `
            <div class="portal-doc-ok">
              <strong>Documentación al día</strong>
              <span>No figuran documentos pendientes para este pasajero.</span>
            </div>
          `;
        }
        return `
          <div class="portal-doc-list">
            ${pendingItems.map(item => `
              <div class="portal-doc-item">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.status)}</strong>
              </div>
            `).join("")}
          </div>
        `;
      }

      function portalWhatsappHref(record) {
        return whatsappLink(window.ElAngelAzulPortal.whatsappMessage(record));
      }

      function renderPortalResult(record) {
        const result = document.getElementById("portal-result");
        const paymentStatus = portalPaymentStatus(record);
        const paidPercentage = record.total > 0 ? Math.min(100, Math.max(0, Math.round((record.paid / record.total) * 100))) : 0;
        const pendingDocs = portalDocumentationItems(record).filter(item => !item.isComplete).length;
        const whatsappHref = portalWhatsappHref(record);
        const nextActions = [
          paymentStatus === "Al día" ? "Mantené tu comprobante guardado por cualquier revisión." : "Consultá el detalle de pago y próxima cuota.",
          pendingDocs ? "Revisá la documentación pendiente con administración." : "La documentación figura sin pendientes cargados.",
          "Guardá este acceso para volver a consultar tu viaje."
        ];
        result.innerHTML = `
          <section class="portal-result portal-result-dashboard">
            <div class="portal-result-head">
              <div>
                <span>Mi viaje</span>
                <h2>${escapeHtml(record.name)}</h2>
                <p>${escapeHtml(record.group.school || record.group.name || "Grupo pendiente")} · ${escapeHtml(record.group.course || "Curso pendiente")}</p>
              </div>
              <a href="${whatsappHref}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
            </div>

            <div class="portal-trip-card">
              <div>
                <span>Viaje asignado</span>
                <strong>${escapeHtml(record.trip.name || "Viaje pendiente")}</strong>
                <p>${escapeHtml(record.group.name || "Grupo pendiente")} · Contrato ${escapeHtml(record.contractCode || "Pendiente")}</p>
              </div>
              <strong class="portal-status-pill ${portalStatusTone(record.generalStatus)}">${escapeHtml(record.generalStatus || "Consultar")}</strong>
            </div>

            <div class="portal-status-grid">
              <article class="portal-status-card">
                <span>Estado del viaje</span>
                <strong>${escapeHtml(record.trip.status || record.passengerStatus || "En seguimiento")}</strong>
                <small>${escapeHtml(record.trip.name || "Viaje pendiente")} · ${escapeHtml(record.trip.destination || "Destino pendiente")}</small>
                <small>${escapeHtml(record.generalStatus || "Consultar estado")}</small>
              </article>
              <article class="portal-status-card">
                <span>Estado de pagos</span>
                <strong>${escapeHtml(paymentStatus)}</strong>
                <small>${record.nextInstallment ? `Próxima cuota: ${escapeHtml(record.nextInstallment.cuota_nombre || `Cuota ${record.nextInstallment.cuota_numero}`)} · ${formatDate(record.nextInstallment.cuota_vencimiento)}` : "Sin cuotas pendientes cargadas"}</small>
                ${record.hasReview ? `<small>Hay un pago en revisión administrativa.</small>` : ""}
              </article>
              <article class="portal-status-card">
                <span>Documentación pendiente</span>
                <strong>${pendingDocs ? `${pendingDocs} pendiente${pendingDocs > 1 ? "s" : ""}` : "Al día"}</strong>
                <small>${pendingDocs ? "Revisá el detalle de documentación más abajo." : "No figuran pendientes cargados."}</small>
              </article>
            </div>

            <div class="portal-next-actions">
              <span>Próximos pasos</span>
              ${nextActions.map((action, index) => `
                <div>
                  <strong>${index + 1}</strong>
                  <p>${escapeHtml(action)}</p>
                </div>
              `).join("")}
            </div>

            <div class="portal-result-section">
              <h3>Resumen del viaje</h3>
              <div class="portal-summary">
                <div><span>Viaje</span><strong>${escapeHtml(record.trip.name || "Pendiente")}</strong></div>
                <div><span>Colegio / grupo</span><strong>${escapeHtml(record.group.name || "Pendiente")}</strong></div>
                <div><span>Contrato</span><strong>${escapeHtml(record.contractCode || "Pendiente")}</strong></div>
                <div><span>DNI</span><strong>${escapeHtml(record.dni || "Pendiente")}</strong></div>
                <div><span>Estado del pasajero</span><strong class="portal-status-pill ${portalStatusTone(record.passengerStatus)}">${escapeHtml(record.passengerStatus || "En seguimiento")}</strong></div>
                <div><span>Estado general</span><strong class="portal-status-pill ${portalStatusTone(record.generalStatus)}">${escapeHtml(record.generalStatus || "Consultar")}</strong></div>
              </div>
            </div>

            <div class="portal-result-section">
              <h3>Estado de pagos</h3>
              ${record.total === null || record.total === undefined ? `
                <p class="portal-notice">Todavía no cargamos el detalle de montos para este viaje. Tu estado de pago actual es <strong>${escapeHtml(paymentStatus)}</strong>. Para el monto exacto, consultanos por WhatsApp.</p>
              ` : `
                <div class="portal-payment-panel">
                  <div class="portal-payment-meter" aria-label="Avance de pago">
                    <span style="width: ${paidPercentage}%"></span>
                  </div>
                  <div class="portal-payment-summary">
                    <div><span>Total del viaje</span><strong>${formatCurrency(record.total)}</strong></div>
                    <div><span>Monto pagado</span><strong>${formatCurrency(record.paid)}</strong></div>
                    <div><span>Saldo pendiente</span><strong>${formatCurrency(record.balance)}</strong></div>
                    <div><span>Avance</span><strong>${paidPercentage}%</strong></div>
                  </div>
                </div>
              `}
              ${record.hasReview ? `<p class="portal-notice">Hay pagos en revisión.</p>` : ""}
            </div>

            <div class="portal-result-section">
              <h3>Cuotas</h3>
              <div class="portal-installments">
                ${record.installments.length ? record.installments.map(installment => `
                  <div class="portal-installment">
                    <strong>${installment.cuota_nombre || `Cuota ${installment.cuota_numero}`}</strong>
                    <span>${formatCurrency(parseNumber(installment.cuota_monto))}</span>
                    <span>Vence: ${formatDate(installment.cuota_vencimiento)}</span>
                    <span class="portal-status-pill ${portalStatusTone(installment.cuota_estado)}">${escapeHtml(installment.cuota_estado)}</span>
                  </div>
                `).join("") : `<p>Este contrato todavía no tiene cuotas cargadas.</p>`}
              </div>
            </div>

            <div class="portal-result-section">
              <h3>Documentación</h3>
              ${renderPortalDocumentation(record)}
            </div>

            <div class="portal-whatsapp-panel">
              <div>
                <span>Atención directa</span>
                <h3>Consultá por WhatsApp</h3>
                <p>El mensaje ya incluye pasajero, DNI y contrato para que administración ubique rápido el caso.</p>
              </div>
              <a href="${whatsappHref}" target="_blank" rel="noopener">Abrir WhatsApp</a>
            </div>
          </section>
        `;
      }

      function renderPortalNotFound() {
        const result = document.getElementById("portal-result");
        result.innerHTML = `
          <section class="portal-empty">
            <h2>No encontramos un pasajero con ese DNI.</h2>
            <p>Revisá el número o consultanos por WhatsApp.</p>
            <a href="${whatsappLink("Hola, quiero consultar por el portal de pasajeros de El Ángel Azul.")}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          </section>
        `;
      }

      // FIX: el portal leía de un archivo Excel hardcodeado ("...simulado_v1.xlsx") con
      // datos de prueba, completamente desconectado de la base real (Google Sheets) que
      // usa el resto del sistema. Por eso la ruta pública estaba deshabilitada (redirigía
      // a Inscripción) - mostrar datos falsos a una familia real hubiera sido peor que no
      // mostrar nada. Ahora busca sobre los GRUPOS/PASAJEROS reales (los mismos que ya
      // sincroniza el admin con Sheets).
      //
      // Importante: el sistema hoy NO trackea montos reales de pago por pasajero (solo un
      // estado: "Pendiente" / "Al día" / "Vencido"), así que NO se inventan cifras de saldo.
      // Se muestra el estado real, y para el detalle de monto se deriva a WhatsApp - es
      // preferible decir "consultá el monto por WhatsApp" antes que mostrar un número
      // inventado que la familia podría tomar como real.
      function buildRealPortalRecord(passenger, group) {
        const contrato = contractById(passengerContratoId(passenger), group.id);
        return {
          contractCode: passengerCodigoContrato(passenger) || "Pendiente",
          name: passenger.nombre || "Pasajero",
          dni: passenger.dni || "",
          passengerStatus: passenger.estado || "Pendiente",
          trip: {
            code: group.id || "",
            name: group.viaje || "",
            destination: group.viaje || "",
            type: group.nivel || "",
            status: group.estado || ""
          },
          group: {
            code: group.id || "",
            name: `${group.colegio || ""} · ${group.curso || ""} ${group.division || ""}`.trim(),
            school: group.colegio || "",
            course: `${group.curso || ""} ${group.division || ""}`.trim()
          },
          documentation: {
            general: passenger.documentacion || "Pendiente de validar",
            medical: passenger.fichaMedica || "Pendiente de validar",
            authorization: String(contrato?.estado || "").toLowerCase() === "activo" ? "Aprobada" : "Pendiente de validar"
          },
          installments: [],
          payments: [],
          total: null,
          paid: 0,
          balance: null,
          nextInstallment: null,
          hasReview: false,
          generalStatus: passenger.pago || "Consultar estado"
        };
      }

      async function consultarPortalPasajeros(event) {
        event.preventDefault();
        const dni = document.getElementById("portal-dni").value.replace(/\D/g, "");
        const accessCode = document.getElementById("portal-code").value.trim().toUpperCase();
        const result = document.getElementById("portal-result");
        result.innerHTML = `<section class="portal-empty"><p>Cargando datos del pasajero...</p></section>`;
        try {
          await hydrateGoogleSheetsData();
          let foundPassenger = null;
          let foundGroup = null;
          for (const group of adminPasajerosDemo) {
            const match = (group.pasajeros || []).find((item) => (
              normalizeDni(item.dni) === dni &&
              normalizeCode(passengerCodigoContrato(item)) === accessCode
            ));
            if (match) {
              foundPassenger = match;
              foundGroup = group;
              break;
            }
          }
          if (!foundPassenger) {
            renderPortalNotFound();
            return;
          }
          renderPortalResult(buildRealPortalRecord(foundPassenger, foundGroup));
        } catch (error) {
          result.innerHTML = `
            <section class="portal-empty">
              <h2>No pudimos cargar la base de pasajeros.</h2>
              <p>Revisá que la base esté disponible o consultanos por WhatsApp.</p>
            </section>
          `;
        }
      }

      function renderPortalPasajeros() {
        document.getElementById("app").innerHTML = `
          <div class="layout portal-layout">
            <section class="portal-hero">
              <span>Mi viaje</span>
              <h1>Estado de inscripción</h1>
              <p>Consultá desde el celular tu viaje, documentación y estado de pagos con DNI y código de contrato.</p>
            </section>

            <section class="portal-panel">
              <div class="portal-panel-head">
                <span>Acceso rápido</span>
                <h2>Ingresá tus datos</h2>
                <p>El código figura en la ficha o contrato de viaje.</p>
              </div>
              <form class="portal-form" id="portal-form">
                <label for="portal-dni">DNI del pasajero</label>
                <input id="portal-dni" name="dni" inputmode="numeric" autocomplete="off" placeholder="Ingresá tu DNI" required>
                <label for="portal-code">Código de contrato</label>
                <input id="portal-code" name="code" autocomplete="off" placeholder="Ej: CON-PRI-RIO-PARANA-6TO-A-CARLOS-PAZ-2026" required>
                <small class="portal-form-hint">Lo encontrás en tu ficha de adhesión o contrato de viaje.</small>
                <button type="submit">Ver mi viaje</button>
              </form>
            </section>

            <div id="portal-result" aria-live="polite"></div>
          </div>
        `;
        document.getElementById("portal-form").addEventListener("submit", consultarPortalPasajeros);
      }

      const inscripcionDestinosPorNivel = {
        Primaria: ["Carlos Paz"],
        Secundaria: ["Bariloche", "Carlos Paz", "Camboriú"]
      };
      const inscripcionAnios = ["2026", "2027", "2028"];

      // Animaciones de Inscripción: mismo criterio liviano que Turismo (fade-up
      // simple, sin blur), pero corren UNA sola vez al cargar la página. El
      // cambio de Paso 1 a Paso 2 (y de fieldset en fieldset en la Ficha de
      // Adhesión) usa la lógica existente de mostrar/ocultar por atributo
      // "hidden" - no se le agrega transición ahí a propósito, porque
      // ScrollTrigger no puede medir bien un bloque que estuvo oculto.
      let inscripcionScrollTriggers = [];

      function killInscripcionAnimations() {
        inscripcionScrollTriggers.forEach((trigger) => trigger.kill());
        inscripcionScrollTriggers = [];
      }

      function inscripcionAntiBlankFallback(animation) {
        setTimeout(() => { if (animation.progress() < 1) animation.progress(1); }, 1200);
      }

      function bindInscripcionAnimations() {
        if (typeof gsap === "undefined") return;
        killInscripcionAnimations();
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

        const heroContent = document.querySelector(".inscripcion-hero-copy-compact");
        if (heroContent) {
          const heroIntro = gsap.timeline({ defaults: { ease: "power2.out" } })
            .from(heroContent.children, {
              autoAlpha: 0,
              y: reduceMotion ? 0 : 16,
              duration: reduceMotion ? 0.3 : 0.6,
              stagger: reduceMotion ? 0.03 : 0.08
            });
          setTimeout(() => { if (heroIntro.progress() < 1) heroIntro.progress(1); }, 1200);
        }

        if (typeof ScrollTrigger === "undefined") return;

        gsap.utils.toArray("[data-reveal-light]").forEach((el) => {
          if (el === heroContent) return;
          const tween = gsap.from(el, {
            autoAlpha: 0,
            y: reduceMotion ? 0 : 18,
            duration: reduceMotion ? 0.3 : 0.5,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse", onEnter: () => inscripcionAntiBlankFallback(tween) }
          });
          if (tween.scrollTrigger) inscripcionScrollTriggers.push(tween.scrollTrigger);
        });
      }

      function renderInscripcion() {
        document.getElementById("app").innerHTML = `
          <div class="layout portal-layout public-inscripcion-layout">
            <section class="inscripcion-page-hero inscripcion-page-hero--compact">
              <div class="inscripcion-hero-copy-compact" data-reveal-light>
                <span>Inscripción</span>
                <h1>Anotá a tu grupo en dos pasos simples</h1>
                <p>Elegí el viaje, tu colegio y curso, y completá la ficha digital. Te acompañamos en cada paso.</p>
                <div class="inscripcion-hero-reassure" aria-label="Qué esperar de la inscripción">
                  ${[["⏰", "Dos pasos, sin vueltas"], ["📋", "Podés continuar aunque tu colegio no aparezca"], ["🔒", "Tus datos quedan protegidos"]].map(([icon, label]) => `
                    <span><span class="inscripcion-reassure-icon" aria-hidden="true">${icon}</span>${escapeHtml(label)}</span>
                  `).join("")}
                </div>
              </div>
            </section>

            <section class="portal-empty public-inscripcion-card">
              <div class="inscripcion-section-heading">
                <span>Inscripción oficial</span>
                <h2>¿Quién completa la ficha?</h2>
                <p>Elegí una opción para ver el formulario que corresponde.</p>
              </div>
              <div class="inscripcion-tipo-grid" data-inscripcion-tipo>
                <button type="button" data-inscripcion-tipo-pax aria-pressed="false">
                  <strong>Pasajero (PAX)</strong>
                  <span>Ficha de adhesión del alumno que viaja. La completa su padre, madre o tutor.</span>
                </button>
                <a href="#/inscripcion/tutor">
                  <strong>Tutor</strong>
                  <span>Registrá a un tutor adicional de un pasajero. Es un formulario corto.</span>
                </a>
              </div>

              <form data-inscripcion-form hidden>
                <div hidden>
                  <select data-inscripcion-nivel>
                    <option>Primaria</option>
                    <option selected>Secundaria</option>
                  </select>
                  <select data-inscripcion-destino></select>
                  <select data-inscripcion-anio>
                    ${inscripcionAnios.map((anio) => `<option>${escapeHtml(anio)}</option>`).join("")}
                  </select>
                </div>

                <div class="inscripcion-stepper-v2">
                  <div class="inscripcion-stepper-v2-item" data-macro-indicator="1">
                    <span class="inscripcion-stepper-v2-dot">1</span>
                    <small>Selección</small>
                  </div>
                  <div class="inscripcion-stepper-v2-track">
                    <span data-macro-fill></span>
                  </div>
                  <div class="inscripcion-stepper-v2-item" data-macro-indicator="2">
                    <span class="inscripcion-stepper-v2-dot">2</span>
                    <small>Ficha y firma</small>
                  </div>
                </div>
                <p class="inscripcion-stepper-v2-label" data-macro-label>Paso 1 de 2: Selección de viaje</p>

                <div class="inscripcion-macro-step" data-macro-step="1">
                  <div class="inscripcion-field-block">
                    <h3><span>1</span> Elegí el curso</h3>
                    <div class="inscripcion-option-group inscripcion-option-group--nivel" data-inscripcion-options="nivel"></div>
                  </div>

                  <div class="inscripcion-field-block">
                    <h3><span>2</span> Elegí el destino</h3>
                    <div class="inscripcion-option-group" data-inscripcion-options="destino"></div>
                  </div>

                  <div class="inscripcion-field-block">
                    <h3><span>3</span> Año del viaje</h3>
                    <div class="inscripcion-option-group" data-inscripcion-options="anio"></div>
                  </div>

                  <div class="inscripcion-field-block">
                    <h3><span>4</span> Colegio, grado y división</h3>
                    <div class="public-inscripcion-grid">
                      <label class="public-inscripcion-colegio" data-colegio-buscar-wrap>Colegio
                        <input data-inscripcion-colegio-buscar list="colegios-lista" placeholder="Escribí y elegí tu colegio" autocomplete="off">
                        <datalist id="colegios-lista"></datalist>
                      </label>
                      <label class="public-inscripcion-colegio" data-colegio-texto-wrap hidden>Nombre completo del colegio
                        <input data-inscripcion-colegio-texto maxlength="120" placeholder="Ej.: Escuela Normal Dr. Juan Pujol">
                      </label>
                      <label class="ficha-adhesion-check public-inscripcion-colegio">
                        <input type="checkbox" data-inscripcion-colegio-no-esta>
                        Mi colegio no está en la lista
                      </label>
                      <label>Grado/Año
                        <select data-inscripcion-grado></select>
                      </label>
                      <label>División
                        <input data-inscripcion-division maxlength="3" autocapitalize="characters" autocomplete="off" placeholder="Ej.: B">
                      </label>
                    </div>
                    <p class="inscripcion-field-hint">Si tu colegio no aparece, marcá “Mi colegio no está en la lista” y escribí su nombre completo: administración lo vincula después.</p>
                    <div data-inscripcion-contract-result class="inscripcion-contract-result" aria-live="polite"></div>
                  </div>
                </div>

                <div class="inscripcion-macro-step" data-macro-step="2" hidden>
                  <div class="inscripcion-summary-card" data-inscripcion-summary></div>
                </div>

                <aside data-inscripcion-context-summary class="inscripcion-context-summary"></aside>
                <div class="ficha-adhesion-error" data-inscripcion-error hidden role="alert"></div>
                <div class="inscripcion-step-actions">
                  <button type="button" data-inscripcion-back>Volver</button>
                  <button type="button" data-inscripcion-next>Seguir con la ficha</button>
                </div>
              </form>
            </section>
          </div>
        `;
        bindInscripcion();
        bindInscripcionAnimations();
      }

      function bindInscripcion() {
        const validacion = window.ElAngelAzulFichaValidation;
        const tipoPaxButton = document.querySelector("[data-inscripcion-tipo-pax]");
        const form = document.querySelector("[data-inscripcion-form]");
        const nivelField = document.querySelector("[data-inscripcion-nivel]");
        const destinoField = document.querySelector("[data-inscripcion-destino]");
        const anioField = document.querySelector("[data-inscripcion-anio]");
        const colegioBuscar = document.querySelector("[data-inscripcion-colegio-buscar]");
        const colegiosLista = document.getElementById("colegios-lista");
        const colegioTexto = document.querySelector("[data-inscripcion-colegio-texto]");
        const colegioNoEsta = document.querySelector("[data-inscripcion-colegio-no-esta]");
        const buscarWrap = document.querySelector("[data-colegio-buscar-wrap]");
        const textoWrap = document.querySelector("[data-colegio-texto-wrap]");
        const gradoField = document.querySelector("[data-inscripcion-grado]");
        const divisionField = document.querySelector("[data-inscripcion-division]");
        const contractResult = document.querySelector("[data-inscripcion-contract-result]");
        const summary = document.querySelector("[data-inscripcion-summary]");
        const contextSummary = document.querySelector("[data-inscripcion-context-summary]");
        const stepBlocks = [...document.querySelectorAll("[data-macro-step]")];
        const backButton = document.querySelector("[data-inscripcion-back]");
        const nextButton = document.querySelector("[data-inscripcion-next]");
        const errorMessage = document.querySelector("[data-inscripcion-error]");
        const optionGroups = {
          nivel: document.querySelector('[data-inscripcion-options="nivel"]'),
          destino: document.querySelector('[data-inscripcion-options="destino"]'),
          anio: document.querySelector('[data-inscripcion-options="anio"]')
        };
        if (!validacion || !tipoPaxButton || !form || !nivelField || !destinoField || !anioField || !colegioBuscar || !gradoField || !divisionField || !contractResult || !summary || !contextSummary || !backButton || !nextButton || !errorMessage) return;

        let currentStep = 1;
        let colegios = [];
        let colegiosCargados = false;
        // undefined = buscando; null = sin contrato; objeto = contrato encontrado.
        let contrato = null;
        let contractRequest = 0;
        let contractTimer = null;
        const requiredMessage = "Completá el curso, el destino, el año, el colegio, el grado y la división para continuar.";

        tipoPaxButton.addEventListener("click", () => {
          tipoPaxButton.setAttribute("aria-pressed", "true");
          tipoPaxButton.classList.add("selected");
          form.hidden = false;
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        const etiquetaColegio = (colegio) => (colegio.localidad ? `${colegio.nombre} — ${colegio.localidad}` : colegio.nombre);
        const comparable = (texto) => String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
        const colegioElegido = () => {
          const valor = comparable(colegioBuscar.value);
          if (!valor) return null;
          return colegios.find((colegio) => comparable(etiquetaColegio(colegio)) === valor || comparable(colegio.nombre) === valor) || null;
        };

        fetch("/api/public/colegios", { cache: "no-store" })
          .then((response) => response.json())
          .then((payload) => {
            colegios = Array.isArray(payload.colegios) ? payload.colegios : [];
            colegiosCargados = true;
            colegiosLista.innerHTML = colegios.map((colegio) => `<option value="${escapeHtml(etiquetaColegio(colegio))}"></option>`).join("");
            update();
          })
          .catch(() => {
            // Sin lista disponible la familia puede seguir con "Mi colegio no está".
            colegiosCargados = true;
            update();
          });

        const optionDescription = (key, value) => {
          if (key === "nivel") return value === "Primaria" ? "Viajes para nivel primario" : "Viajes para nivel secundario";
          if (key === "destino") return "Seleccionar destino del grupo";
          if (key === "anio") return "Año previsto de salida";
          return "";
        };

        const renderChoiceButtons = (field, group, key) => {
          if (!field || !group) return;
          group.innerHTML = [...field.options].map((option) => {
            const selected = option.value === field.value;
            return `
              <button class="inscripcion-option-button${selected ? " selected" : ""}" type="button" data-inscripcion-option="${key}" data-value="${escapeHtml(option.value)}" aria-pressed="${selected ? "true" : "false"}">
                <strong>${escapeHtml(option.textContent)}</strong>
                <small>${escapeHtml(optionDescription(key, option.value))}</small>
              </button>
            `;
          }).join("");
        };

        const renderGrados = () => {
          const grados = validacion.GRADOS[nivelField.value] || [];
          const actual = grados.includes(gradoField.value) ? gradoField.value : "";
          gradoField.innerHTML = `<option value="">Elegí</option>${grados.map((grado) => `<option value="${escapeHtml(grado)}"${grado === actual ? " selected" : ""}>${escapeHtml(grado)}</option>`).join("")}`;
        };

        const seleccion = () => {
          const colegio = colegioNoEsta.checked ? null : colegioElegido();
          const texto = colegioNoEsta.checked ? colegioTexto.value.replace(/\s+/g, " ").trim() : "";
          return {
            nivel: nivelField.value,
            destino: destinoField.value,
            anio: anioField.value,
            colegioId: colegio?.id || "",
            colegioTexto: texto,
            colegioNombre: colegio?.nombre || texto,
            grado: gradoField.value,
            division: divisionField.value.trim().toUpperCase()
          };
        };

        const seleccionValida = (s) => Boolean(
          s.destino && s.anio &&
          (validacion.GRADOS[s.nivel] || []).includes(s.grado) &&
          /^[A-Z0-9]{1,3}$/.test(s.division) &&
          (s.colegioId || s.colegioTexto.length >= 3)
        );

        const whatsappConsultUrl = (s) => whatsappLink(
          `Hola, quiero inscribirme y no encuentro contrato activo. Colegio: ${s.colegioNombre || "-"} / Curso: ${s.nivel} / Viaje: ${s.destino} ${s.anio} / Grado y división: ${s.grado} ${s.division}.`
        );

        const renderContractResult = (s) => {
          contractResult.className = "inscripcion-contract-result";
          if (colegioNoEsta.checked) {
            contractResult.classList.add("is-info");
            contractResult.innerHTML = `
              <strong>Seguimos con el nombre que escribiste.</strong>
              <p class="inscripcion-contract-info-text">Administración revisa tu ficha y la vincula con el colegio y el contrato correctos.</p>
            `;
            return;
          }
          if (!s.colegioId) {
            contractResult.innerHTML = colegioBuscar.value.trim() && colegiosCargados
              ? "No encontramos ese colegio en la lista. Elegí una de las opciones sugeridas o marcá “Mi colegio no está en la lista”."
              : "Elegí tu colegio, el grado y la división para buscar el contrato activo.";
            return;
          }
          if (!s.grado || !/^[A-Z0-9]{1,3}$/.test(s.division)) {
            contractResult.innerHTML = "Completá el grado y la división para buscar el contrato activo.";
            return;
          }
          if (contrato === undefined) {
            contractResult.innerHTML = "Buscando contrato…";
            return;
          }
          if (contrato) {
            contractResult.classList.add("is-ok");
            contractResult.innerHTML = `
              <div class="inscripcion-contract-confirmed">
                <span>Encontramos tu contrato:</span>
                <strong>${escapeHtml(contrato.codigo || "Contrato activo")}</strong>
              </div>
            `;
            return;
          }
          contractResult.classList.add("is-info");
          contractResult.innerHTML = `
            <strong>No encontramos un contrato activo para ese curso.</strong>
            <p class="inscripcion-contract-info-text">No hay problema: podés continuar igual. Administración revisa y vincula tu ficha.</p>
            <a href="${escapeHtml(whatsappConsultUrl(s))}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          `;
        };

        const update = (source = "") => {
          const destinos = inscripcionDestinosPorNivel[nivelField.value] || [];
          if (source === "nivel" || !destinos.includes(destinoField.value)) {
            destinoField.innerHTML = destinos.map((destino, index) => `<option value="${escapeHtml(destino)}"${index === 0 ? " selected" : ""}>${escapeHtml(destino)}</option>`).join("");
          }
          if (source === "nivel" || !gradoField.options.length) renderGrados();
          buscarWrap.hidden = colegioNoEsta.checked;
          textoWrap.hidden = !colegioNoEsta.checked;
          const s = seleccion();
          renderContractResult(s);
          const contratoTexto = s.colegioId && contrato ? contrato.codigo : "Se vincula en administración";
          const filas = [
            ["Curso", s.nivel], ["Destino", s.destino], ["Año", s.anio],
            ["Colegio", s.colegioNombre], ["Grado/Año", s.grado], ["División", s.division], ["Contrato", contratoTexto]
          ];
          contextSummary.innerHTML = `
            <span>Tu inscripción</span>
            <ul>${filas.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "Pendiente")}</li>`).join("")}</ul>
          `;
          summary.innerHTML = `
            <span>Resumen</span>
            <h2>Vas a completar una ficha para:</h2>
            <ul>${filas.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "Pendiente")}</li>`).join("")}</ul>
            <p class="inscripcion-next-note">El siguiente paso es cargar los datos del pasajero y de su padre, madre o tutor.</p>
          `;
          renderChoiceButtons(nivelField, optionGroups.nivel, "nivel");
          renderChoiceButtons(destinoField, optionGroups.destino, "destino");
          renderChoiceButtons(anioField, optionGroups.anio, "anio");
        };

        const refreshContract = () => {
          clearTimeout(contractTimer);
          const s = seleccion();
          if (!s.colegioId || !s.grado || !/^[A-Z0-9]{1,3}$/.test(s.division)) {
            contrato = null;
            update();
            return;
          }
          contrato = undefined;
          update();
          const requestId = ++contractRequest;
          contractTimer = setTimeout(async () => {
            const params = new URLSearchParams({
              colegioId: s.colegioId, nivel: s.nivel, viaje: `${s.destino} ${s.anio}`, grado: s.grado, division: s.division
            });
            try {
              const response = await fetch(`/api/public/inscripcion-context?${params}`, { cache: "no-store" });
              const payload = await response.json();
              if (requestId !== contractRequest) return;
              contrato = response.ok && payload.ok ? payload.contrato : null;
            } catch (_) {
              if (requestId !== contractRequest) return;
              contrato = null;
            }
            update();
          }, 300);
        };

        const macroLabels = ["50% completado: elegí el viaje", "90% completado: falta completar datos y firma"];
        const progressFill = document.querySelector("[data-macro-fill]");
        const progressLabel = document.querySelector("[data-macro-label]");
        const macroIndicators = [...document.querySelectorAll("[data-macro-indicator]")];

        const renderStep = () => {
          const macroStep = currentStep >= 5 ? 2 : 1;
          stepBlocks.forEach((block) => {
            block.hidden = Number(block.dataset.macroStep) !== macroStep;
          });
          macroIndicators.forEach((item) => {
            const step = Number(item.dataset.macroIndicator);
            item.classList.toggle("active", step === macroStep);
            item.classList.toggle("done", step < macroStep);
          });
          if (progressFill) progressFill.style.width = macroStep === 2 ? "90%" : "50%";
          if (progressLabel) progressLabel.textContent = macroLabels[macroStep - 1];
          backButton.disabled = macroStep === 1;
          nextButton.textContent = macroStep === 2 ? "Completar ficha de adhesión" : "Seguir con la ficha";
          errorMessage.hidden = true;
        };

        const goNext = () => {
          if (!seleccionValida(seleccion())) {
            errorMessage.textContent = requiredMessage;
            errorMessage.hidden = false;
            return;
          }
          if (currentStep < 5) {
            currentStep = 5;
            renderStep();
            return;
          }
          form.requestSubmit();
        };

        nivelField.addEventListener("change", () => { update("nivel"); refreshContract(); });
        destinoField.addEventListener("change", () => { update(); refreshContract(); });
        anioField.addEventListener("change", () => { update(); refreshContract(); });
        colegioBuscar.addEventListener("input", refreshContract);
        colegioTexto.addEventListener("input", () => update());
        colegioNoEsta.addEventListener("change", () => {
          update();
          (colegioNoEsta.checked ? colegioTexto : colegioBuscar).focus();
          refreshContract();
        });
        gradoField.addEventListener("change", refreshContract);
        divisionField.addEventListener("input", () => {
          divisionField.value = divisionField.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
          refreshContract();
        });
        form.addEventListener("click", (event) => {
          const optionButton = event.target.closest("[data-inscripcion-option]");
          if (!optionButton) return;
          const field = { nivel: nivelField, destino: destinoField, anio: anioField }[optionButton.dataset.inscripcionOption];
          if (!field) return;
          field.value = optionButton.dataset.value || "";
          field.dispatchEvent(new Event("change", { bubbles: true }));
          errorMessage.hidden = true;
        });
        backButton.addEventListener("click", () => {
          currentStep = 1;
          renderStep();
        });
        nextButton.addEventListener("click", goNext);
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const s = seleccion();
          if (!seleccionValida(s)) {
            errorMessage.textContent = requiredMessage;
            errorMessage.hidden = false;
            return;
          }
          location.hash = `/inscripcion/ficha-adhesion?${new URLSearchParams(s).toString()}`;
        });
        update("nivel");
        renderStep();
      }

      function fichaAdhesionContextFromParams(params = currentHashParams()) {
        return {
          nivel: params.get("nivel") || "",
          destino: params.get("destino") || "",
          anio: params.get("anio") || "",
          colegioId: params.get("colegioId") || "",
          colegioTexto: params.get("colegioTexto") || "",
          colegioNombre: params.get("colegioNombre") || params.get("colegioTexto") || "",
          grado: params.get("grado") || "",
          division: params.get("division") || ""
        };
      }

      // La ficha solo se abre con una selección completa del paso 1. El
      // contrato no es obligatorio (se permite "Mi colegio no está"); el
      // servidor vuelve a validar todo al recibir la ficha.
      function hasValidFichaAdhesionContext(params = currentHashParams()) {
        const context = fichaAdhesionContextFromParams(params);
        const grados = window.ElAngelAzulFichaValidation?.GRADOS[context.nivel] || [];
        return Boolean(
          context.destino &&
          /^20\d{2}$/.test(context.anio) &&
          grados.includes(context.grado) &&
          /^[A-Z0-9]{1,3}$/.test(context.division) &&
          (context.colegioId || context.colegioTexto.trim().length >= 3)
        );
      }

      async function renderAdminPortal() {
        document.getElementById("app").innerHTML = `
          <div class="layout portal-layout">
            <section class="portal-hero">
              <h1>Admin portal</h1>
              <p>Cargando estructura desde Excel simulado...</p>
            </section>
          </div>
        `;

        let data;
        try {
          data = await loadPortalExcelData();
        } catch (error) {
          document.getElementById("app").innerHTML = `
            <div class="layout portal-layout">
              <section class="portal-empty">
                <h1>No se pudo cargar el Excel simulado</h1>
                <p>La vista admin necesita el archivo ${portalExcelFile}.</p>
              </section>
            </div>
          `;
          return;
        }

        const tripCards = data.tripsGroups.map(group => {
          const passengers = data.passengers.filter(passenger => (
            normalizeCode(passenger.viaje_codigo) === normalizeCode(group.viaje_codigo) &&
            normalizeCode(passenger.grupo_codigo) === normalizeCode(group.grupo_codigo)
          ));
          const records = passengers.map(passenger => getPassengerPortalRecord(passenger, data));
          const total = records.reduce((sum, record) => sum + record.total, 0);
          const paid = records.reduce((sum, record) => sum + record.paid, 0);
          const balance = total - paid;
          return `
            <div class="admin-demo-card">
              <h3>${group.viaje_nombre}</h3>
              <p><strong>Código:</strong> ${group.viaje_codigo}</p>
              <p><strong>Destino:</strong> ${group.destino}</p>
              <p><strong>Tipo:</strong> ${group.tipo_viaje}</p>
              <p><strong>Estado:</strong> ${group.estado_grupo}</p>
              <p><strong>Grupo:</strong> ${group.grupo_nombre}</p>
              <p><strong>Pasajeros:</strong> ${passengers.length}</p>
              <p><strong>Total:</strong> ${formatCurrency(total)}</p>
              <p><strong>Pagado:</strong> ${formatCurrency(paid)}</p>
              <p><strong>Saldo:</strong> ${formatCurrency(balance)}</p>
            </div>
          `;
        }).join("");

        const groupCards = data.tripsGroups.map(group => {
          const passengers = data.passengers.filter(passenger => normalizeCode(passenger.grupo_codigo) === normalizeCode(group.grupo_codigo));
          return `
            <div class="admin-demo-card">
              <h3>${group.grupo_nombre}</h3>
              <p><strong>Código:</strong> ${group.grupo_codigo}</p>
              <p><strong>Viaje:</strong> ${group.viaje_nombre}</p>
              <p><strong>Colegio:</strong> ${group.colegio}</p>
              <p><strong>Curso:</strong> ${group.curso}</p>
              <p><strong>Estado:</strong> ${group.estado_grupo}</p>
              <p><strong>Pasajeros:</strong> ${passengers.length}</p>
            </div>
          `;
        }).join("");

        const passengerCards = data.passengers.map(passenger => {
          const record = getPassengerPortalRecord(passenger, data);
          return `
            <div class="admin-demo-card">
              <h3>${record.name}</h3>
              <p><strong>DNI:</strong> ${record.dni}</p>
              <p><strong>Contrato:</strong> ${record.contractCode}</p>
              <p><strong>Viaje:</strong> ${record.trip.name}</p>
              <p><strong>Grupo:</strong> ${record.group.name}</p>
              <p><strong>Estado:</strong> ${record.generalStatus}</p>
              <p><strong>Total:</strong> ${formatCurrency(record.total)}</p>
              <p><strong>Pagado:</strong> ${formatCurrency(record.paid)}</p>
              <p><strong>Saldo:</strong> ${formatCurrency(record.balance)}</p>
            </div>
          `;
        }).join("");

        const paymentCards = data.payments.map(payment => {
          const passenger = data.passengers.find(item => (
            normalizeDni(item.pasajero_dni) === normalizeDni(payment.pasajero_dni) &&
            normalizeCode(item.contrato_codigo) === normalizeCode(payment.contrato_codigo)
          ));
          return `
            <div class="admin-demo-card">
              <h3>${passenger?.pasajero_nombre || "Pasajero no encontrado"}</h3>
              <p><strong>Contrato:</strong> ${payment.contrato_codigo}</p>
              <p><strong>Pago:</strong> ${formatCurrency(parseNumber(payment.pago_monto))}</p>
              <p><strong>Fecha:</strong> ${formatDate(payment.pago_fecha)}</p>
              <p><strong>Medio:</strong> ${payment.pago_medio || "Sin medio"}</p>
              <p><strong>Cuota:</strong> ${payment.cuota_asociada || "Sin asociar"}</p>
              <p><strong>Estado:</strong> ${payment.pago_estado}</p>
            </div>
          `;
        }).join("");

        document.getElementById("app").innerHTML = `
          <div class="layout portal-layout">
            <section class="portal-hero">
              <h1>Admin portal</h1>
              <p>Vista interna para validar estructura de viajes, grupos, pasajeros, cuotas y pagos.</p>
            </section>

            <section class="admin-demo-section">
              <p class="portal-notice">Esta es una vista de solo lectura para revisar viajes, grupos, pasajeros, cuotas y pagos.</p>
            </section>

            <section class="admin-demo-section">
              <h2>Viajes</h2>
              <div class="admin-demo-grid">${tripCards}</div>
            </section>

            <section class="admin-demo-section">
              <h2>Grupos</h2>
              <div class="admin-demo-grid">${groupCards}</div>
            </section>

            <section class="admin-demo-section">
              <h2>Pasajeros</h2>
              <div class="admin-demo-grid">${passengerCards}</div>
            </section>

            <section class="admin-demo-section">
              <h2>Resumen de pagos</h2>
              <div class="admin-demo-grid">${paymentCards}</div>
            </section>
          </div>
        `;
      }

      // Mismo criterio que bindInscripcionAnimations: entrada liviana una sola
      // vez al cargar la Ficha de Adhesión. Los 5 fieldsets están todos
      // presentes en el DOM a la vez (no se ocultan por pasos), así que su
      // scroll-reveal es seguro - no hay riesgo de medir un bloque oculto.
      let fichaAdhesionScrollTriggers = [];

      function killFichaAdhesionAnimations() {
        fichaAdhesionScrollTriggers.forEach((trigger) => trigger.kill());
        fichaAdhesionScrollTriggers = [];
      }

      function fichaAdhesionAntiBlankFallback(animation) {
        setTimeout(() => { if (animation.progress() < 1) animation.progress(1); }, 1200);
      }

      function bindFichaAdhesionAnimations() {
        if (typeof gsap === "undefined") return;
        killFichaAdhesionAnimations();
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

        const hero = document.querySelector("[data-ficha-hero]");
        if (hero) {
          const heroIntro = gsap.timeline({ defaults: { ease: "power2.out" } })
            .from(hero.children, {
              autoAlpha: 0,
              y: reduceMotion ? 0 : 16,
              duration: reduceMotion ? 0.3 : 0.6,
              stagger: reduceMotion ? 0.03 : 0.08
            });
          setTimeout(() => { if (heroIntro.progress() < 1) heroIntro.progress(1); }, 1200);
        }

        if (typeof ScrollTrigger === "undefined") return;

        gsap.utils.toArray("[data-reveal-light]").forEach((el) => {
          if (el === hero) return;
          const tween = gsap.from(el, {
            autoAlpha: 0,
            y: reduceMotion ? 0 : 18,
            duration: reduceMotion ? 0.3 : 0.5,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse", onEnter: () => fichaAdhesionAntiBlankFallback(tween) }
          });
          if (tween.scrollTrigger) fichaAdhesionScrollTriggers.push(tween.scrollTrigger);
        });
      }

      function fichaOpciones(lista, seleccionado = "", placeholder = "") {
        return `${placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : ""}${lista.map((valor) => (
          `<option value="${escapeHtml(valor)}"${valor === seleccionado ? " selected" : ""}>${escapeHtml(valor)}</option>`
        )).join("")}`;
      }

      function fichaCampoError(nombre) {
        return `<small class="ficha-campo-error" data-error-for="${nombre}" hidden></small>`;
      }

      function fichaFechaNacimiento(nombre, etiqueta) {
        return `
          <label>${escapeHtml(etiqueta)}
            <span class="ficha-dob-group" data-dob-group="${nombre}">
              <input type="text" inputmode="numeric" maxlength="2" placeholder="DD" data-dob-day aria-label="Día de ${escapeHtml(etiqueta.toLowerCase())}">
              <span>/</span>
              <input type="text" inputmode="numeric" maxlength="2" placeholder="MM" data-dob-month aria-label="Mes de ${escapeHtml(etiqueta.toLowerCase())}">
              <span>/</span>
              <input type="text" inputmode="numeric" maxlength="4" placeholder="AAAA" data-dob-year aria-label="Año de ${escapeHtml(etiqueta.toLowerCase())}">
            </span>
            <input type="hidden" name="${nombre}" data-dob-hidden>
            ${fichaCampoError(nombre)}
          </label>
        `;
      }

      // Marca los errores por campo (vienen del validador compartido o del
      // servidor), arma el resumen de faltantes y lleva la vista al primero.
      function mostrarErroresFormulario(form, errorBox, errores = {}, sugerencias = {}) {
        const validacion = window.ElAngelAzulFichaValidation;
        form.querySelectorAll("[data-error-for]").forEach((nodo) => {
          const campo = nodo.dataset.errorFor;
          const mensaje = errores[campo] || "";
          nodo.textContent = mensaje || sugerencias[campo] || "";
          nodo.hidden = !nodo.textContent;
          nodo.classList.toggle("is-sugerencia", !mensaje && Boolean(sugerencias[campo]));
          form.querySelectorAll(`[name="${campo}"]`).forEach((input) => {
            if (mensaje) input.setAttribute("aria-invalid", "true");
            else input.removeAttribute("aria-invalid");
          });
        });
        const campos = Object.keys(errores);
        errorBox.hidden = campos.length === 0;
        errorBox.innerHTML = campos.length
          ? `<strong>Faltan completar o corregir ${campos.length === 1 ? "1 dato" : `${campos.length} datos`}:</strong><ul>${campos.map((campo) => `<li>${escapeHtml(validacion.ETIQUETAS[campo] || campo)}</li>`).join("")}</ul>`
          : "";
        if (!campos.length) return;
        const nodo = form.querySelector(`[data-error-for="${campos[0]}"]`);
        const contenedor = nodo?.closest("label, fieldset, .ficha-adhesion-context") || errorBox;
        contenedor.scrollIntoView({ behavior: "smooth", block: "center" });
        contenedor.querySelector?.("input:not([type=hidden]), select")?.focus({ preventScroll: true });
      }

      // Al corregir un campo se borra su error (no hace falta reenviar para
      // ver que ya está bien). Sirve también para la fecha en 3 partes.
      function limpiarErrorAlEditar(form) {
        const limpiar = (event) => {
          const contenedor = event.target.closest("label, .ficha-adhesion-signature");
          const nodo = contenedor?.querySelector("[data-error-for]");
          if (!nodo || nodo.classList.contains("is-sugerencia")) return;
          nodo.hidden = true;
          nodo.textContent = "";
          form.querySelectorAll(`[name="${nodo.dataset.errorFor}"]`).forEach((input) => input.removeAttribute("aria-invalid"));
        };
        form.addEventListener("input", limpiar);
        form.addEventListener("change", limpiar);
      }

      function renderFichaAdhesion(exito = null) {
        const validacion = window.ElAngelAzulFichaValidation;
        const contexto = fichaAdhesionContextFromParams();
        if (exito) {
          document.getElementById("app").innerHTML = `
            <div class="layout ficha-adhesion-layout">
              <section class="ficha-adhesion-panel ficha-adhesion-success-screen">
                <div class="ficha-adhesion-progress ficha-adhesion-progress--complete" aria-label="Progreso de inscripción">
                  <div>
                    <span>100% completado</span>
                    <strong>Ficha enviada</strong>
                  </div>
                  <i aria-hidden="true"></i>
                </div>
                <div class="ficha-adhesion-success ficha-adhesion-success-large">Recibimos tu ficha correctamente.</div>
                ${exito.emailDestino ? `<p>Te enviamos una copia a <strong>${escapeHtml(exito.emailDestino)}</strong>. Si no la ves en unos minutos, revisá la carpeta de spam.</p>` : ""}
                <p>Queda pendiente de revisión por administración. Te contactaremos si necesitamos validar algún dato.</p>
                <a class="ficha-adhesion-home-link" href="#/inscripcion">Volver al inicio</a>
              </section>
            </div>
          `;
          return;
        }
        document.getElementById("app").innerHTML = `
          <div class="layout ficha-adhesion-layout">
            <section class="ficha-adhesion-hero" data-ficha-hero>
              <p>Paso 2 de 2</p>
              <h1>Ficha y firma</h1>
              <p>Cargá los datos del alumno, de su padre, madre o tutor, y firmá la inscripción desde el celular.</p>
            </section>

            <section class="ficha-adhesion-panel">
              <div class="ficha-adhesion-progress" aria-label="Progreso de inscripción">
                <div>
                  <span>90% completado</span>
                  <strong>Último tramo: datos y firma</strong>
                </div>
                <i aria-hidden="true"></i>
              </div>
              <div class="ficha-adhesion-context" data-reveal-light>
                <span>Colegio y viaje</span>
                <strong>${escapeHtml(contexto.colegioNombre)} · ${escapeHtml(contexto.nivel)} ${escapeHtml(contexto.grado)} ${escapeHtml(contexto.division)}</strong>
                <p>${escapeHtml(contexto.destino)} ${escapeHtml(contexto.anio)} · Contrato: <strong data-ficha-contrato>${contexto.colegioId ? "buscando…" : "se vincula en administración"}</strong></p>
                ${["colegio", "nivel", "grado", "division", "destino", "anio"].map(fichaCampoError).join("")}
                <a class="ficha-adhesion-context-edit" href="#/inscripcion">Cambiar colegio o curso</a>
              </div>
              <div class="ficha-adhesion-help" data-reveal-light>
                <strong>Antes de empezar</strong>
                <p>Te va a llevar unos minutos. Tené a mano el DNI del pasajero y el DNI y CUIL del padre, madre o tutor. Todos los campos son obligatorios salvo los marcados como opcionales.</p>
              </div>
              <form class="ficha-adhesion-form" data-ficha-adhesion-form novalidate>
                <fieldset data-reveal-light>
                  <legend>Datos del pasajero</legend>
                  <p class="ficha-fieldset-note">Información del alumno que viaja.</p>
                  <p class="ficha-nombre-aviso">Escribí nombre/s y apellido/s completos, tal como figuran en el DNI y con tildes (ej.: José María / Fernández Núñez).</p>
                  <label>Nombre/s
                    <input name="pasajeroNombre" autocomplete="off" required>
                    ${fichaCampoError("pasajeroNombre")}
                  </label>
                  <label>Apellido/s
                    <input name="pasajeroApellido" autocomplete="off" required>
                    ${fichaCampoError("pasajeroApellido")}
                  </label>
                  <label>Tipo de documento
                    <select name="pasajeroTipoDocumento">${fichaOpciones(validacion.TIPOS_DOCUMENTO, "DNI")}</select>
                    ${fichaCampoError("pasajeroTipoDocumento")}
                  </label>
                  <label>Número de documento
                    <input name="pasajeroNumeroDocumento" inputmode="numeric" autocomplete="off" required>
                    ${fichaCampoError("pasajeroNumeroDocumento")}
                  </label>
                  ${fichaFechaNacimiento("pasajeroNacimiento", "Fecha de nacimiento")}
                  <label>Sexo (como figura en el DNI)
                    <select name="pasajeroSexo" required>${fichaOpciones(validacion.SEXOS, "", "Seleccionar")}</select>
                    ${fichaCampoError("pasajeroSexo")}
                  </label>
                </fieldset>

                <fieldset data-reveal-light>
                  <legend>Datos del padre, madre o tutor</legend>
                  <p class="ficha-fieldset-note">Adulto responsable de la inscripción. A este correo le enviamos la copia de la ficha.</p>
                  <label>Nombre/s
                    <input name="responsableNombre" autocomplete="given-name" required>
                    ${fichaCampoError("responsableNombre")}
                  </label>
                  <label>Apellido/s
                    <input name="responsableApellido" autocomplete="family-name" required>
                    ${fichaCampoError("responsableApellido")}
                  </label>
                  <label>Tipo de documento
                    <select name="responsableTipoDocumento">${fichaOpciones(validacion.TIPOS_DOCUMENTO, "DNI")}</select>
                    ${fichaCampoError("responsableTipoDocumento")}
                  </label>
                  <label>Número de documento
                    <input name="responsableNumeroDocumento" inputmode="numeric" autocomplete="off" required>
                    ${fichaCampoError("responsableNumeroDocumento")}
                  </label>
                  ${fichaFechaNacimiento("responsableNacimiento", "Fecha de nacimiento")}
                  <label>Parentesco
                    <select name="responsableParentesco" required>${fichaOpciones(validacion.PARENTESCOS, "", "Seleccionar")}</select>
                    ${fichaCampoError("responsableParentesco")}
                  </label>
                  <label>CUIL/CUIT
                    <input name="responsableCuilCuit" inputmode="numeric" autocomplete="off" placeholder="20-12345678-6" required>
                    ${fichaCampoError("responsableCuilCuit")}
                  </label>
                  <label>Correo electrónico
                    <input name="responsableEmail" type="email" autocomplete="email" inputmode="email" required>
                    ${fichaCampoError("responsableEmail")}
                  </label>
                  <label>Celular
                    <input name="responsableCelular" type="tel" autocomplete="tel" placeholder="3794 123456" required>
                    ${fichaCampoError("responsableCelular")}
                  </label>
                  <label><span>Teléfono alternativo <span class="ficha-opcional">(opcional)</span></span>
                    <input name="responsableTelefono" type="tel" autocomplete="off">
                    ${fichaCampoError("responsableTelefono")}
                  </label>
                </fieldset>

                <fieldset data-reveal-light>
                  <legend>Domicilio</legend>
                  <p class="ficha-fieldset-note">Domicilio del pasajero.</p>
                  <div class="ficha-fila-calle">
                    <label>Calle
                      <input name="domicilioCalle" autocomplete="address-line1" required>
                      ${fichaCampoError("domicilioCalle")}
                    </label>
                    <label>Número
                      <input name="domicilioNumero" inputmode="numeric" autocomplete="off" placeholder="1234" maxlength="6" required>
                      ${fichaCampoError("domicilioNumero")}
                    </label>
                  </div>
                  <label><span>Piso <span class="ficha-opcional">(opcional)</span></span>
                    <input name="domicilioPiso" maxlength="4" autocomplete="off">
                    ${fichaCampoError("domicilioPiso")}
                  </label>
                  <label><span>Departamento <span class="ficha-opcional">(opcional)</span></span>
                    <input name="domicilioDepartamento" maxlength="6" autocomplete="off">
                    ${fichaCampoError("domicilioDepartamento")}
                  </label>
                  <label><span>Barrio <span class="ficha-opcional">(opcional)</span></span>
                    <input name="domicilioBarrio" maxlength="80" autocomplete="off">
                    ${fichaCampoError("domicilioBarrio")}
                  </label>
                  <label>Provincia
                    <select name="domicilioProvincia" required>${fichaOpciones(validacion.PROVINCIAS, "Corrientes")}</select>
                    ${fichaCampoError("domicilioProvincia")}
                  </label>
                  <label>Localidad
                    <input name="domicilioLocalidad" list="localidades-lista" autocomplete="off" required>
                    <datalist id="localidades-lista"></datalist>
                    ${fichaCampoError("domicilioLocalidad")}
                  </label>
                  <label>Código postal
                    <input name="domicilioCodigoPostal" inputmode="numeric" maxlength="8" autocomplete="postal-code" placeholder="3400" required>
                    ${fichaCampoError("domicilioCodigoPostal")}
                  </label>
                </fieldset>

                <fieldset data-reveal-light data-ficha-planes hidden>
                  <legend>Plan de pago</legend>
                  <p class="ficha-fieldset-note">Elegí cómo vas a pagar el viaje. Administración te confirma los montos.</p>
                  <div class="ficha-planes-opciones" data-ficha-planes-opciones></div>
                  ${fichaCampoError("planPagoId")}
                </fieldset>

                <fieldset data-reveal-light>
                  <legend>Condiciones</legend>
                  <p class="ficha-fieldset-note">Confirmación previa al envío.</p>
                  <label class="ficha-adhesion-check">
                    <input name="aceptaCondiciones" type="checkbox" value="si">
                    Acepto que esta ficha sea revisada por administración y entiendo que no confirma pagos ni cupo definitivo.
                    ${fichaCampoError("aceptaCondiciones")}
                  </label>
                </fieldset>

                <fieldset data-reveal-light>
                  <legend>Firma del padre, madre o tutor</legend>
                  <p class="ficha-fieldset-note">Firmá dentro del recuadro usando el dedo o lápiz óptico.</p>
                  <div class="ficha-adhesion-signature">
                    <span>Firma del padre, madre o tutor</span>
                    <canvas width="720" height="220" data-ficha-signature></canvas>
                    <button type="button" data-ficha-clear-signature>Limpiar firma</button>
                    ${fichaCampoError("firma")}
                  </div>
                </fieldset>

                <div class="ficha-adhesion-error" data-ficha-error hidden role="alert"></div>
                <button type="submit" class="ficha-adhesion-submit">Enviar ficha</button>
              </form>
            </section>
          </div>
        `;
        bindFichaAdhesion();
        bindFichaAdhesionAnimations();
      }

      function bindFichaAdhesion() {
        // Fecha de nacimiento: día/mes/año con autoavance en vez del selector
        // nativo type="date" (que no dejaba llegar cómodo a años viejos como
        // 1970/1980 para el responsable, y no avanzaba de campo al escribir).
        document.querySelectorAll("[data-dob-group]").forEach((group) => {
          const dayInput = group.querySelector("[data-dob-day]");
          const monthInput = group.querySelector("[data-dob-month]");
          const yearInput = group.querySelector("[data-dob-year]");
          const hiddenInput = group.parentElement.querySelector("[data-dob-hidden]");
          if (!dayInput || !monthInput || !yearInput || !hiddenInput) return;

          const clampNumeric = (input, max) => {
            input.value = input.value.replace(/\D/g, "").slice(0, max);
          };

          const syncHidden = () => {
            const day = dayInput.value.padStart(2, "0");
            const month = monthInput.value.padStart(2, "0");
            const year = yearInput.value;
            hiddenInput.value = dayInput.value && monthInput.value && year.length === 4 ? `${year}-${month}-${day}` : "";
          };

          dayInput.addEventListener("input", () => {
            clampNumeric(dayInput, 2);
            if (Number(dayInput.value) > 31) dayInput.value = "31";
            if (dayInput.value.length === 2) monthInput.focus();
            syncHidden();
          });
          monthInput.addEventListener("input", () => {
            clampNumeric(monthInput, 2);
            if (Number(monthInput.value) > 12) monthInput.value = "12";
            if (monthInput.value.length === 2) yearInput.focus();
            syncHidden();
          });
          yearInput.addEventListener("input", () => {
            clampNumeric(yearInput, 4);
            syncHidden();
          });
          monthInput.addEventListener("keydown", (event) => {
            if (event.key === "Backspace" && !monthInput.value) dayInput.focus();
          });
          yearInput.addEventListener("keydown", (event) => {
            if (event.key === "Backspace" && !yearInput.value) monthInput.focus();
          });
        });

        const validacion = window.ElAngelAzulFichaValidation;
        const form = document.querySelector("[data-ficha-adhesion-form]");
        const canvas = document.querySelector("[data-ficha-signature]");
        const clearButton = document.querySelector("[data-ficha-clear-signature]");
        const errorBox = document.querySelector("[data-ficha-error]");
        if (!validacion || !form || !canvas || !errorBox) return;
        limpiarErrorAlEditar(form);

        const context = canvas.getContext("2d");
        let drawing = false;
        let hasSignature = false;
        const canvasPoint = (event) => {
          const rect = canvas.getBoundingClientRect();
          const source = event.touches?.[0] || event;
          return {
            x: (source.clientX - rect.left) * (canvas.width / rect.width),
            y: (source.clientY - rect.top) * (canvas.height / rect.height)
          };
        };
        const begin = (event) => {
          event.preventDefault();
          drawing = true;
          const point = canvasPoint(event);
          context.beginPath();
          context.moveTo(point.x, point.y);
        };
        const move = (event) => {
          if (!drawing) return;
          event.preventDefault();
          const point = canvasPoint(event);
          context.lineWidth = 3;
          context.lineCap = "round";
          context.strokeStyle = "#10202b";
          context.lineTo(point.x, point.y);
          context.stroke();
          hasSignature = true;
        };
        const end = () => {
          drawing = false;
        };
        canvas.addEventListener("mousedown", begin);
        canvas.addEventListener("mousemove", move);
        window.addEventListener("mouseup", end);
        canvas.addEventListener("touchstart", begin, { passive: false });
        canvas.addEventListener("touchmove", move, { passive: false });
        canvas.addEventListener("touchend", end);
        clearButton?.addEventListener("click", () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          hasSignature = false;
        });

        // Contrato y planes del curso elegido (si el colegio es de la lista).
        const contextoInscripcion = fichaAdhesionContextFromParams();
        const contratoNode = document.querySelector("[data-ficha-contrato]");
        const planesFieldset = form.querySelector("[data-ficha-planes]");
        const planesOpciones = form.querySelector("[data-ficha-planes-opciones]");
        let planesDisponibles = [];
        if (contextoInscripcion.colegioId) {
          const params = new URLSearchParams({
            colegioId: contextoInscripcion.colegioId,
            nivel: contextoInscripcion.nivel,
            viaje: `${contextoInscripcion.destino} ${contextoInscripcion.anio}`,
            grado: contextoInscripcion.grado,
            division: contextoInscripcion.division
          });
          fetch(`/api/public/inscripcion-context?${params}`, { cache: "no-store" })
            .then((response) => response.json())
            .then((payload) => {
              const planes = Array.isArray(payload.planes) ? payload.planes : [];
              planesDisponibles = planes.map((plan) => plan.id);
              if (contratoNode) contratoNode.textContent = payload.contrato?.codigo || "se vincula en administración";
              planesFieldset.hidden = planes.length === 0;
              planesOpciones.innerHTML = planes.map((plan) => `
                <label>
                  <input type="radio" name="planPagoId" value="${escapeHtml(plan.id)}">
                  <span><strong>${escapeHtml(plan.nombre)}</strong> · ${escapeHtml(String(plan.cuotas))} ${Number(plan.cuotas) === 1 ? "cuota" : "cuotas"}${plan.descripcion ? `<small>${escapeHtml(plan.descripcion)}</small>` : ""}</span>
                </label>
              `).join("");
            })
            .catch(() => {
              if (contratoNode) contratoNode.textContent = "se vincula en administración";
            });
        }

        // Localidades sugeridas por Georef (API oficial). Si no responde, la
        // localidad se escribe a mano igual.
        const localidadInput = form.querySelector('[name="domicilioLocalidad"]');
        const provinciaSelect = form.querySelector('[name="domicilioProvincia"]');
        const localidadesLista = document.getElementById("localidades-lista");
        let georefTimer = null;
        localidadInput.addEventListener("input", () => {
          clearTimeout(georefTimer);
          const nombre = localidadInput.value.trim();
          if (nombre.length < 2) return;
          georefTimer = setTimeout(async () => {
            try {
              const params = new URLSearchParams({ provincia: provinciaSelect.value, nombre, max: "10", campos: "nombre" });
              const response = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?${params}`);
              const payload = await response.json();
              const nombres = [...new Set((payload.localidades || []).map((localidad) => localidad.nombre))];
              localidadesLista.innerHTML = nombres.map((valor) => `<option value="${escapeHtml(valor)}"></option>`).join("");
            } catch (_) {
              // Georef caído: la localidad se escribe a mano.
            }
          }, 250);
        });
        provinciaSelect.addEventListener("change", () => {
          localidadesLista.innerHTML = "";
        });

        // Sugerencia de email mal escrito (no bloquea).
        const emailInput = form.querySelector('[name="responsableEmail"]');
        const emailAviso = form.querySelector('[data-error-for="responsableEmail"]');
        emailInput.addEventListener("blur", () => {
          const sugerida = validacion.sugerenciaEmail(emailInput.value);
          if (!sugerida) return;
          emailAviso.hidden = false;
          emailAviso.classList.add("is-sugerencia");
          emailAviso.innerHTML = `¿Quisiste decir <strong>${escapeHtml(sugerida)}</strong>? <button type="button" data-usar-email>Usar</button>`;
          emailAviso.querySelector("[data-usar-email]").addEventListener("click", () => {
            emailInput.value = sugerida;
            emailAviso.hidden = true;
            emailAviso.textContent = "";
          });
        });

        const CAMPOS = [
          "pasajeroNombre", "pasajeroApellido", "pasajeroTipoDocumento", "pasajeroNumeroDocumento", "pasajeroNacimiento", "pasajeroSexo",
          "responsableNombre", "responsableApellido", "responsableTipoDocumento", "responsableNumeroDocumento", "responsableNacimiento",
          "responsableParentesco", "responsableCuilCuit", "responsableEmail", "responsableCelular", "responsableTelefono",
          "domicilioCalle", "domicilioNumero", "domicilioPiso", "domicilioDepartamento", "domicilioBarrio", "domicilioLocalidad",
          "domicilioProvincia", "domicilioCodigoPostal", "planPagoId"
        ];
        const leerFormulario = () => {
          const formData = new FormData(form);
          return {
            ...contextoInscripcion,
            ...Object.fromEntries(CAMPOS.map((campo) => [campo, String(formData.get(campo) || "")])),
            aceptaCondiciones: formData.get("aceptaCondiciones") === "si",
            firma: hasSignature ? canvas.toDataURL("image/png") : ""
          };
        };

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submitButton = form.querySelector(".ficha-adhesion-submit");
          if (submitButton.disabled) return;
          const ficha = leerFormulario();
          const local = validacion.validarFichaPax(ficha, { planesDisponibles });
          if (!local.ok) {
            mostrarErroresFormulario(form, errorBox, local.errores, local.sugerencias);
            return;
          }
          mostrarErroresFormulario(form, errorBox, {}, local.sugerencias);
          submitButton.disabled = true;
          submitButton.textContent = "Enviando…";
          try {
            const response = await fetch("/api/public/fichas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(ficha)
            });
            const payload = await response.json().catch(() => ({}));
            if (response.status === 201 && payload.ok) {
              renderFichaAdhesion({ emailDestino: payload.emailDestino || "" });
              window.scrollTo({ top: 0 });
              return;
            }
            if (payload.errores && Object.keys(payload.errores).length) {
              mostrarErroresFormulario(form, errorBox, payload.errores);
            } else {
              errorBox.hidden = false;
              errorBox.textContent = payload.error || "No pudimos enviar la ficha. Tus datos siguen cargados: volvé a intentar.";
              errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          } catch (_) {
            errorBox.hidden = false;
            errorBox.textContent = "No hay conexión con el servidor. Tus datos siguen cargados: revisá tu internet y volvé a intentar.";
            errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
          } finally {
            if (submitButton.isConnected) {
              submitButton.disabled = false;
              submitButton.textContent = "Enviar ficha";
            }
          }
        });
      }

      function renderFichaTutor(registrado = false) {
        const validacion = window.ElAngelAzulFichaValidation;
        if (registrado) {
          document.getElementById("app").innerHTML = `
            <div class="layout ficha-adhesion-layout">
              <section class="ficha-adhesion-panel ficha-adhesion-success-screen">
                <div class="ficha-adhesion-success ficha-adhesion-success-large">Registramos tus datos como tutor.</div>
                <p>Administración los vincula con la ficha del pasajero. Te contactaremos si necesitamos validar algún dato.</p>
                <a class="ficha-adhesion-home-link" href="#/inscripcion">Volver al inicio</a>
              </section>
            </div>
          `;
          return;
        }
        document.getElementById("app").innerHTML = `
          <div class="layout ficha-adhesion-layout">
            <section class="ficha-adhesion-hero" data-ficha-hero>
              <p>Registro de tutor</p>
              <h1>Datos del tutor</h1>
              <p>Formulario corto para sumar a un tutor de un pasajero. La ficha de adhesión completa la carga el tutor principal.</p>
            </section>
            <section class="ficha-adhesion-panel">
              <form class="ficha-adhesion-form" data-ficha-tutor-form novalidate>
                <fieldset data-reveal-light>
                  <legend>Pasajero a cargo</legend>
                  <p class="ficha-nombre-aviso">Escribí nombre/s y apellido/s completos, tal como figuran en el DNI y con tildes.</p>
                  <label>Nombre/s del pasajero
                    <input name="pasajeroNombre" autocomplete="off" required>
                    ${fichaCampoError("pasajeroNombre")}
                  </label>
                  <label>Apellido/s del pasajero
                    <input name="pasajeroApellido" autocomplete="off" required>
                    ${fichaCampoError("pasajeroApellido")}
                  </label>
                  <label>DNI del pasajero
                    <input name="pasajeroNumeroDocumento" inputmode="numeric" autocomplete="off" required>
                    ${fichaCampoError("pasajeroNumeroDocumento")}
                  </label>
                </fieldset>
                <fieldset data-reveal-light>
                  <legend>Datos del tutor</legend>
                  <label>Nombre/s
                    <input name="nombre" autocomplete="given-name" required>
                    ${fichaCampoError("nombre")}
                  </label>
                  <label>Apellido/s
                    <input name="apellido" autocomplete="family-name" required>
                    ${fichaCampoError("apellido")}
                  </label>
                  <label>Tipo de documento
                    <select name="tipoDocumento">${fichaOpciones(validacion.TIPOS_DOCUMENTO, "DNI")}</select>
                    ${fichaCampoError("tipoDocumento")}
                  </label>
                  <label>Número de documento
                    <input name="numeroDocumento" inputmode="numeric" autocomplete="off" required>
                    ${fichaCampoError("numeroDocumento")}
                  </label>
                  <label>CUIL/CUIT
                    <input name="cuilCuit" inputmode="numeric" autocomplete="off" placeholder="20-12345678-6" required>
                    ${fichaCampoError("cuilCuit")}
                  </label>
                  <label>Parentesco
                    <select name="parentesco" required>${fichaOpciones(validacion.PARENTESCOS, "", "Seleccionar")}</select>
                    ${fichaCampoError("parentesco")}
                  </label>
                  <label>Celular
                    <input name="celular" type="tel" autocomplete="tel" placeholder="3794 123456" required>
                    ${fichaCampoError("celular")}
                  </label>
                  <label>Correo electrónico
                    <input name="email" type="email" autocomplete="email" inputmode="email" required>
                    ${fichaCampoError("email")}
                  </label>
                  <label class="ficha-adhesion-check">
                    <input name="aceptaCondiciones" type="checkbox" value="si">
                    Confirmo que soy tutor de este pasajero y que los datos son correctos.
                    ${fichaCampoError("aceptaCondiciones")}
                  </label>
                </fieldset>
                <div class="ficha-adhesion-error" data-ficha-error hidden role="alert"></div>
                <button type="submit" class="ficha-adhesion-submit">Registrar tutor</button>
              </form>
            </section>
          </div>
        `;
        bindFichaTutor();
        bindFichaAdhesionAnimations();
      }

      function bindFichaTutor() {
        const validacion = window.ElAngelAzulFichaValidation;
        const form = document.querySelector("[data-ficha-tutor-form]");
        const errorBox = form?.querySelector("[data-ficha-error]");
        if (!validacion || !form || !errorBox) return;
        limpiarErrorAlEditar(form);
        const CAMPOS = ["pasajeroNombre", "pasajeroApellido", "pasajeroNumeroDocumento", "nombre", "apellido", "tipoDocumento", "numeroDocumento", "cuilCuit", "celular", "email", "parentesco"];
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submitButton = form.querySelector(".ficha-adhesion-submit");
          if (submitButton.disabled) return;
          const formData = new FormData(form);
          const tutor = {
            ...Object.fromEntries(CAMPOS.map((campo) => [campo, String(formData.get(campo) || "")])),
            aceptaCondiciones: formData.get("aceptaCondiciones") === "si"
          };
          const local = validacion.validarFichaTutor(tutor);
          if (!local.ok) {
            mostrarErroresFormulario(form, errorBox, local.errores, local.sugerencias);
            return;
          }
          mostrarErroresFormulario(form, errorBox, {}, local.sugerencias);
          submitButton.disabled = true;
          submitButton.textContent = "Enviando…";
          try {
            const response = await fetch("/api/public/fichas-tutor", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(tutor)
            });
            const payload = await response.json().catch(() => ({}));
            if (response.status === 201 && payload.ok) {
              renderFichaTutor(true);
              window.scrollTo({ top: 0 });
              return;
            }
            if (payload.errores && Object.keys(payload.errores).length) {
              mostrarErroresFormulario(form, errorBox, payload.errores);
            } else {
              errorBox.hidden = false;
              errorBox.textContent = payload.error || "No pudimos registrar tus datos. Volvé a intentar.";
            }
          } catch (_) {
            errorBox.hidden = false;
            errorBox.textContent = "No hay conexión con el servidor. Revisá tu internet y volvé a intentar.";
          } finally {
            if (submitButton.isConnected) {
              submitButton.disabled = false;
              submitButton.textContent = "Registrar tutor";
            }
          }
        });
      }

      async function render() {
        const path = currentPath();
        const page = routes[path] || routes["/"];
        document.body.classList.toggle("home-page", path === "/");
        document.body.classList.toggle("turismo-page", path.startsWith("/turismo"));
        closeMobileNav();
        if (path !== "/" && heroCarouselInterval) {
          clearInterval(heroCarouselInterval);
          heroCarouselInterval = null;
        }
        if (path === "/") {
          await renderHome();
          return;
        }
        if (path === "/turismo") {
          await renderTurismo();
          return;
        }
        if (path.startsWith("/turismo/")) {
          const packageItem = await turismoPackageBySlug(path.replace("/turismo/", ""));
          if (packageItem) {
            renderPackageDetail(packageItem);
            return;
          }
        }
        if (path === "/estudiantil") {
          renderEstudiantil();
          return;
        }
        if (path === "/estudiantil/primaria-carlos-paz") {
          renderPrimariaCarlosPaz();
          return;
        }
        if (path === "/estudiantil/secundaria-bariloche") {
          renderSecundariaBariloche();
          return;
        }
        if (path === "/estudiantil/secundaria-carlos-paz") {
          renderSecundariaCarlosPaz();
          return;
        }
        if (path === "/nosotros") {
          renderNosotros();
          return;
        }
        if (path === "/contacto") {
          renderContacto();
          return;
        }
        // FIX: el portal de pasajeros estaba desconectado del router (redirigía a
        // Inscripción) porque su fuente de datos era un Excel simulado. Ahora que lee
        // de la base real (ver buildRealPortalRecord / consultarPortalPasajeros), se
        // reconecta la ruta pública.
        if (path === "/portal-pasajeros" || path === "/pasajeros" || path === "/mi-viaje") {
          await hydrateGoogleSheetsData();
          renderPortalPasajeros();
          return;
        }
        // Ficha v2: la inscripción ya no hidrata Grupos/Contratos en el
        // navegador; consulta colegios y contrato exacto en /api/public/*.
        if (path === "/inscripcion") {
          renderInscripcion();
          return;
        }
        if (path === "/inscripcion/tutor") {
          renderFichaTutor();
          return;
        }
        if (path === "/inscripcion/ficha-adhesion") {
          if (!hasValidFichaAdhesionContext()) {
            location.replace("#/inscripcion");
            return;
          }
          renderFichaAdhesion();
          return;
        }
        if (path === "/pasajeros/ficha-adhesion") {
          const params = currentHashParams().toString();
          location.replace(`#/inscripcion/ficha-adhesion${params ? `?${params}` : ""}`);
          return;
        }
        if (path === "/ficha-adhesion") {
          const params = currentHashParams().toString();
          location.replace(`#/inscripcion/ficha-adhesion${params ? `?${params}` : ""}`);
          return;
        }
        if (path === "/admin-portal") {
          location.replace("#/");
          return;
        }
        if (isAdminPath(path)) {
          document.body?.setAttribute("data-app-entry", "admin");
          const session = await fetchAdminSession();
          if (!session) {
            renderAdminLogin();
            return;
          }
          if (!adminCanAccessPath(path)) {
            location.replace(adminRouteHref("/admin"));
            return;
          }
          await hydrateGoogleSheetsData();
        }
        if (path === "/admin") {
          renderAdminHome();
          return;
        }
        if (path === "/admin-turismo" || path === "/admin/turismo") {
          renderAdminTurismo();
          return;
        }
        if (path === "/admin/fichas") {
          renderAdminFichasRecibidas();
          return;
        }
        if (path === "/admin/grupos") {
          renderAdminGrupos();
          return;
        }
        if (path === "/admin/pasajeros") {
          renderAdminPasajeros();
          return;
        }
        if (path === "/admin/contratos") {
          renderAdminContratos();
          return;
        }
        if (path === "/admin/pagos") {
          renderAdminPagos();
          return;
        }
        if (path === "/admin/configuracion") {
          renderAdminConfiguracion();
          return;
        }
        renderNotFound(path);
      }

      function renderNotFound(path) {
        document.getElementById("app").innerHTML = `
          <div class="not-found-page">
            <section class="not-found-card" aria-labelledby="not-found-title">
              <a class="not-found-logo" href="#/" aria-label="El Ángel Azul - Inicio">
                <img src="assets/img/logo-completo-azul.svg" alt="El Ángel Azul">
              </a>
              <p class="not-found-kicker">Página no encontrada</p>
              <h1 id="not-found-title">Esta página no existe</h1>
              <p>El enlace puede estar mal escrito o la sección ya no está disponible. Volvé al inicio para seguir navegando por El Ángel Azul.</p>
              <a class="not-found-action" href="#/">Volver al inicio</a>
            </section>
          </div>
        `;
      }

      function syncHeaderState() {
        document.body.classList.toggle("nav-scrolled", window.scrollY > 16);
      }

      function closeMobileNav() {
        document.body.classList.remove("nav-open");
        const toggle = document.querySelector(".nav-toggle");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      }

      function setupPublicInternalAccess() {
        document.querySelectorAll('.site-nav a[href="/admin/"]').forEach(link => {
          if (link.textContent.trim() === "Iniciar sesión") {
            link.remove();
          }
        });

        const footerBottom = document.querySelector(".footer-bottom");
        if (!footerBottom || footerBottom.querySelector(".footer-internal-access")) return;

        const internalAccess = document.createElement("a");
        internalAccess.className = "footer-internal-access";
        // Entrar al panel por la misma ruta hash que usa toda la SPA. Así el
        // acceso desde la portada no depende de una ruta física ni de una
        // redirección intermedia del servidor.
        internalAccess.href = adminRouteHref("/admin");
        internalAccess.textContent = "Acceso interno";
        footerBottom.appendChild(internalAccess);
      }

      // Scroll suave global (Lenis) para el sitio público. Solo animaciones/
      // sensación de scroll, no toca layout ni lógica. Se sincroniza con el
      // ticker de GSAP para que ScrollTrigger (parallax del hero, reveals de
      // sección) lea la posición real en vez de la nativa. Se salta a
      // propósito en Admin (necesita scroll instantáneo en tablas/listas
      // largas) y con "reducir movimiento" activado, dejando el scroll nativo
      // del navegador intacto en ambos casos - nunca rompe el scroll en sí.
      function initLenisSmoothScroll() {
        if (document.body.dataset.appEntry === "admin") return;
        if (typeof Lenis === "undefined") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (window.__lenisInstance) return;
        const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
        window.__lenisInstance = lenis;
        if (typeof gsap !== "undefined") {
          lenis.on("scroll", () => { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update(); });
          gsap.ticker.add((time) => lenis.raf(time * 1000));
          gsap.ticker.lagSmoothing(0);
        } else {
          requestAnimationFrame(function raf(time) { lenis.raf(time); requestAnimationFrame(raf); });
        }
      }

      function bindInternalSectionLinks() {
        document.addEventListener("click", (event) => {
          const link = event.target.closest("[data-scroll-target]");
          if (!link) return;
          const targetId = String(link.dataset.scrollTarget || "").trim();
          const target = targetId ? document.getElementById(targetId) : null;
          if (!target) return;
          event.preventDefault();
          const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start"
          });
        });
      }

      setupPublicInternalAccess();
      bindInternalSectionLinks();
      initLenisSmoothScroll();

      const navToggle = document.querySelector(".nav-toggle");
      if (navToggle) {
        navToggle.addEventListener("click", () => {
          const isOpen = document.body.classList.toggle("nav-open");
          navToggle.setAttribute("aria-expanded", String(isOpen));
        });
      }

      document.querySelectorAll(".site-nav a").forEach(link => {
        link.addEventListener("click", closeMobileNav);
      });

      window.addEventListener("scroll", syncHeaderState, { passive: true });
      window.addEventListener("hashchange", render);
      render();
      syncHeaderState();
