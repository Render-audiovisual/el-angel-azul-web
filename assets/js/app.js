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
        if (pathname.endsWith("/admin/colegios")) return "/admin/colegios";
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
          path === "/admin/colegios" ||
          path === "/admin/pasajeros" ||
          path === "/admin/contratos" ||
          path === "/admin/pagos" ||
          path === "/admin/configuracion";
      }







      async function renderHome() {
        killHomeAnimations();
        const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        // Fotos de reemplazo para Camboriú y Turismo (son de Brasil y de turismo en general, no de tus grupos):
        // cambialas por las tuyas poniendo acá la ruta del archivo que subas (por ejemplo "assets/img/home/camboriu.webp").
        const homePhotos = {
          camboriu: "assets/img/turismo/hero/playa-rio.webp",
          turismo: "assets/img/turismo/hero/cataratas-iguazu.webp"
        };
        const heroSlides = [
          ["bariloche-atardecer-grupo-hero", "Nuestro grupo de estudiantes junto al Nahuel Huapi, en Bariloche", "Bariloche, el grupo y el lago al atardecer"],
          ["bariloche-nieve-cerro-grupo-hero", "Estudiantes de El Ángel Azul en la nieve del cerro, en Bariloche", "Bariloche, la primera vez en la nieve"],
          ["carlos-paz-reloj-cucu-grupo-hero", "Grupo de primaria frente al reloj cucú de Villa Carlos Paz", "Carlos Paz, el viaje de primaria"],
          ["bariloche-centro-civico-grupo-hero", "Grupo de El Ángel Azul en el Centro Cívico de Bariloche", "Bariloche, una foto en el Centro Cívico"]
        ];
        const works = [
          { id: "bariloche", name: "Bariloche", tag: "Secundaria", text: "Nieve, lagos y tu grupo. El viaje que se espera todo el año.", href: "#/estudiantil/secundaria-bariloche", cta: "Conocé la experiencia", bg: "assets/img/home/carrusel-viajes/bariloche-lago-montana-grupo.webp", thumb: "assets/img/home/carrusel-viajes/bariloche-nieve-panoramica-grupo.webp", alt: "Estudiantes en las montañas nevadas de Bariloche" },
          { id: "carlos-paz", name: "Carlos Paz", tag: "Primaria", text: "La aventura de viajar juntos, con cuidado en cada detalle.", href: "#/estudiantil/primaria-carlos-paz", cta: "Conocé la experiencia", bg: "assets/img/home/carrusel-viajes/carlos-paz-escape-room-grupo.webp", thumb: "assets/img/home/carrusel-viajes/carlos-paz-reloj-cucu-grupo.webp", alt: "Nuestro grupo de primaria en Villa Carlos Paz" },
          { id: "camboriu", name: "Camboriú", tag: "Egresados", text: "El viaje de egresados, en Brasil.", href: whatsappLink("Hola, quiero consultar por el viaje de egresados a Camboriú, Brasil, con El Ángel Azul."), external: true, cta: "Consultá por WhatsApp", bg: homePhotos.camboriu, thumb: homePhotos.camboriu, alt: "Costa de Brasil, foto de reemplazo para el viaje de egresados a Camboriú" }
        ];
        const moments = [
          ["bariloche-atardecer-grupo", "El grupo, el lago y un atardecer en Bariloche", "Atardeceres que quedan"],
          ["bariloche-nieve-cerro-grupo", "Estudiantes de El Ángel Azul disfrutando un día de nieve", "La primera vez en la nieve"],
          ["carlos-paz-reloj-cucu-grupo", "Grupo de primaria frente al reloj cucú de Carlos Paz", "Juntos en Carlos Paz"],
          ["bariloche-lago-montana-grupo", "Compañeros de viaje frente al lago y las montañas", "Mucho más que compañeros"],
          ["bariloche-centro-civico-grupo", "Grupo de El Ángel Azul en el Centro Cívico", "Una foto, mil historias"]
        ];
        const img = (src, alt, extra = "") => `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" ${extra}>`;
        document.getElementById("app").innerHTML = `
          <div class="eaa-home">
            <section class="eaa-hero eaa-dark" aria-label="El Ángel Azul" data-hero>
              <div class="eaa-hero-slides" data-hero-slides>
                ${heroSlides.map(([name, alt, caption], i) => `<figure class="eaa-hero-slide${i === 0 ? " is-active" : ""}" data-hero-slide data-caption="${escapeHtml(caption)}">${img(`assets/img/home/hero-carousel/${name}.webp`, alt, `width="2000" height="1333"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}`)}</figure>`).join("")}
              </div>
              <div class="eaa-grain" aria-hidden="true"></div>
              <div class="eaa-hero-shade" aria-hidden="true"></div>
              <div class="eaa-hero-inner">
                <h1 class="eaa-wordmark" data-fit data-hero-title aria-label="El Ángel Azul">El Ángel Azul</h1>
                <div class="eaa-hero-foot">
                  <div class="eaa-hero-tag">
                    <p class="eaa-hero-claim" data-rise>El viaje pasa.<br>La historia queda.</p>
                    <p class="eaa-hero-sub" data-rise>Viajes estudiantiles y turismo, organizados desde Corrientes con acompañamiento real.</p>
                    <div class="eaa-actions" data-rise>
                      <a class="eaa-button eaa-button-fill" href="#/estudiantil" data-scroll-target="eaa-destinos">Viajes estudiantiles ${arrow}</a>
                      <a class="eaa-button eaa-button-line" href="#/turismo" data-scroll-target="eaa-turismo">Turismo ${arrow}</a>
                    </div>
                  </div>
                  <div class="eaa-hero-panel" role="group" aria-label="Fotos del inicio">
                    <div class="eaa-hero-progress" aria-hidden="true"><span data-hero-bar></span></div>
                    <div class="eaa-hero-controls">
                      <button type="button" data-hero-prev aria-label="Foto anterior">${arrow}</button>
                      <button type="button" data-hero-next aria-label="Foto siguiente">${arrow}</button>
                      <span class="eaa-hero-count" data-hero-count aria-live="off">01/0${heroSlides.length}</span>
                    </div>
                    <p class="eaa-hero-caption" data-hero-caption aria-live="polite">${heroSlides[0][2]}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="eaa-intro eaa-dark" aria-labelledby="eaa-intro-title">
              <div class="eaa-wrap eaa-intro-grid">
                <div class="eaa-intro-side" data-rise>
                  <div class="eaa-intro-photo">${img("assets/img/home/experiencia/bariloche-retrato-lago.webp", "Estudiante de El Ángel Azul frente al lago, en Bariloche", 'width="560" height="700" loading="lazy"')}</div>
                  <a class="eaa-button eaa-button-line" href="#/nosotros">Conocé a El Ángel Azul</a>
                </div>
                <div class="eaa-intro-main">
                  <h2 id="eaa-intro-title" class="visually-hidden">Quiénes somos</h2>
                  <p class="eaa-statement" data-scrub-words>Somos una agencia de Corrientes. Nos gusta conocer a cada grupo, escuchar a las familias y acompañar el viaje desde la primera consulta. Viajes estudiantiles y turismo, con alguien que responde en cada paso.</p>
                  <div class="eaa-signature" data-rise>
                    <img src="assets/img/favicon-esfera-blanca.svg" alt="" width="44" height="44">
                    <div><strong>Equipo de El Ángel Azul</strong><span>Agencia de viajes, Corrientes Capital</span></div>
                  </div>
                </div>
              </div>
            </section>

            <section class="eaa-works" id="eaa-destinos" aria-labelledby="eaa-works-title">
              <h2 id="eaa-works-title" class="visually-hidden">Destinos de viajes estudiantiles</h2>
              ${works.map((w, i) => `
              <article class="eaa-work eaa-dark" data-work>
                <div class="eaa-work-bg" aria-hidden="true"><img src="${escapeHtml(w.bg)}" alt="" loading="lazy" data-work-bg></div>
                <div class="eaa-grain" aria-hidden="true"></div>
                <p class="eaa-work-type" aria-hidden="true" data-work-type>${w.name} ${w.name} ${w.name}</p>
                <div class="eaa-work-head eaa-wrap">
                  <div><h3 data-split>${w.name}</h3><p>${w.text}</p></div>
                  <span class="eaa-work-tag">${w.tag}</span>
                </div>
                <a class="eaa-work-thumb" href="${escapeHtml(w.href)}"${w.external ? ' target="_blank" rel="noopener"' : ""} aria-label="${w.name}: ${w.cta}">
                  ${img(w.thumb, w.alt, `width="1600" height="1067" loading="lazy" data-work-thumb`)}
                </a>
                <a class="eaa-work-link eaa-link" href="${escapeHtml(w.href)}"${w.external ? ' target="_blank" rel="noopener"' : ""}>${w.cta} ${arrow}</a>
                <p class="eaa-work-index" aria-hidden="true">0${i + 1}/0${works.length}</p>
              </article>`).join("")}
            </section>

            <section class="eaa-tourism eaa-soft" id="eaa-turismo" aria-labelledby="eaa-turismo-title">
              <div class="eaa-wrap">
                <div class="eaa-tourism-card">
                  <div class="eaa-tourism-media" data-rise>${img(homePhotos.turismo, "Cataratas del Iguazú, foto de reemplazo para la sección de turismo", 'width="1600" height="1067" loading="lazy" data-parallax')}</div>
                  <div class="eaa-tourism-copy">
                    <h2 id="eaa-turismo-title" data-split>También viajamos en familia</h2>
                    <p data-rise>Escapadas en familia, en pareja o en grupo, con asesoramiento claro antes de reservar.</p>
                    <div class="eaa-actions" data-rise>
                      <a class="eaa-button eaa-button-fill" href="#/turismo">Ver turismo ${arrow}</a>
                      <a class="eaa-button eaa-button-ink" href="${whatsappLink("Hola, quiero que me asesoren para elegir un viaje turístico con El Ángel Azul.")}" target="_blank" rel="noopener">Pedir asesoramiento</a>
                    </div>
                  </div>
                </div>
                <ul class="eaa-trips" data-eaa-trips aria-label="Viajes de turismo disponibles"></ul>
              </div>
            </section>

            <section class="eaa-process eaa-dark" aria-labelledby="eaa-process-title">
              <div class="eaa-wrap">
                <h2 id="eaa-process-title" data-split>Inscribirte es simple y está claro</h2>
                <ol class="eaa-process-list">
                  <li data-process-row><span class="eaa-n" aria-hidden="true">001</span><div><h3>Elegí tu viaje</h3><p>Seleccioná el curso, el destino y el año desde la inscripción online.</p></div><span class="eaa-process-note">Online</span></li>
                  <li data-process-row><span class="eaa-n" aria-hidden="true">002</span><div><h3>Completá la ficha</h3><p>Datos del pasajero y del tutor, domicilio y firma, desde el celular o la computadora.</p></div><span class="eaa-process-note">Online</span></li>
                  <li data-process-row><span class="eaa-n" aria-hidden="true">003</span><div><h3>Administración la revisa</h3><p>El plan de pago corresponde al contrato de tu grupo y se confirma con la agencia.</p></div><span class="eaa-process-note">Con la agencia</span></li>
                </ol>
                <div class="eaa-actions" data-rise><a class="eaa-button eaa-button-fill" href="#/inscripcion">Completar ficha ${arrow}</a></div>
              </div>
            </section>

            <div class="eaa-ticker eaa-dark" aria-hidden="true">
              <div class="eaa-ticker-track" data-ticker>${Array.from({ length: 4 }, () => `<span>Bariloche</span><i></i><span>Carlos Paz</span><i></i><span>Camboriú</span><i></i><span>Turismo</span><i></i>`).join("")}</div>
            </div>

            <section class="eaa-moments eaa-dark" aria-labelledby="eaa-moments-title">
              <div class="eaa-wrap">
                <h2 id="eaa-moments-title" data-split>Momentos reales, recuerdos para siempre</h2>
                <div class="eaa-stack">
                  ${moments.map(([name, alt, caption], i) => `
                  <figure class="eaa-stack-card" data-stack-card style="--i:${i}">
                    <div class="eaa-frame">${img(`assets/img/home/carrusel-viajes/${name}.webp`, alt, 'loading="lazy"')}</div>
                    <figcaption><span class="eaa-n" aria-hidden="true">0${i + 1}</span>${caption}</figcaption>
                  </figure>`).join("")}
                </div>
              </div>
            </section>

            <section class="eaa-faq-section" aria-labelledby="eaa-family-title">
              <div class="eaa-wrap eaa-faq-grid">
                <div><h2 id="eaa-family-title" data-split>Las preguntas también viajan</h2><p data-rise>Lo que las familias quieren saber antes de preparar la valija.</p></div>
                <div class="eaa-faq" data-rise>
                  <details><summary>¿Cómo conocemos la propuesta del viaje?<span aria-hidden="true">+</span></summary><p>Escribinos por WhatsApp para coordinar una reunión. Contanos el colegio, el curso y el destino que les interesa, y revisamos la propuesta para el grupo.</p></details>
                  <details><summary>¿Dónde veo los servicios y las formas de pago?<span aria-hidden="true">+</span></summary><p>Los servicios, fechas, condiciones y planes se detallan en la propuesta y el contrato de cada grupo. Consultalos con la agencia antes de confirmar la inscripción.</p></details>
                  <details><summary>¿Puedo registrar a otro tutor?<span aria-hidden="true">+</span></summary><p>Sí. En <a href="#/inscripcion">Ficha de adhesión</a>, elegí Tutor adicional para completar el formulario corto con sus datos y el DNI del pasajero al que acompaña.</p></details>
                </div>
              </div>
            </section>

            <section class="eaa-cta eaa-dark" aria-labelledby="eaa-final-title">
              <p class="eaa-corner eaa-corner-tl">Desde Corrientes</p>
              <p class="eaa-corner eaa-corner-tr">Viajes estudiantiles y turismo</p>
              <div class="eaa-cta-stage">
                <div class="eaa-cta-head">
                  <div class="eaa-cta-photo" data-cta-photo>${img("assets/img/home/experiencia/bariloche-retrato-mirador.webp", "Estudiante de El Ángel Azul en un mirador de Bariloche", 'width="900" height="1100" loading="lazy"')}</div>
                  <h2 id="eaa-final-title" class="eaa-wordmark eaa-cta-title" data-fit data-split>¿Y si nos vamos juntos?</h2>
                </div>
                <div class="eaa-actions" data-rise>
                  <a class="eaa-button eaa-button-fill" href="${whatsappLink("Hola, queremos viajar con El Ángel Azul. ¿Nos cuentan las propuestas para nuestro grupo?")}" target="_blank" rel="noopener">Armemos el viaje ${arrow}</a>
                  <a class="eaa-button eaa-button-line" href="#/inscripcion">Completar ficha de adhesión</a>
                </div>
              </div>
              <p class="eaa-corner eaa-corner-bl">Acompañamiento real</p>
              <p class="eaa-corner eaa-corner-br">Córdoba 6660, Corrientes</p>
            </section>
          </div>
        `;
        // Viajes de turismo publicados desde el admin (ninguno inventado: sin viajes activos la lista no aparece).
        const tripList = document.querySelector("[data-eaa-trips]");
        loadTurismoPublicPackages().then((packages) => {
          if (!tripList.isConnected) return;
          packages.slice(0, 4).forEach((trip) => {
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.className = "eaa-trip";
            link.href = `#/turismo/${encodeURIComponent(trip.slug)}`;
            if (trip.image) {
              const photo = document.createElement("img");
              photo.src = trip.image;
              photo.alt = "";
              photo.loading = "lazy";
              link.appendChild(photo);
            }
            const text = document.createElement("div");
            const name = document.createElement("strong");
            name.textContent = trip.titulo || trip.destino;
            text.appendChild(name);
            const duration = String(trip.duracion || "");
            if (duration && duration !== "A confirmar") {
              const meta = document.createElement("span");
              meta.textContent = duration;
              text.appendChild(meta);
            }
            const price = String(trip.precioDesde || "");
            if (price && price !== "Consultar") {
              const priceEl = document.createElement("em");
              priceEl.textContent = `Desde ${price}`;
              text.appendChild(priceEl);
            }
            link.appendChild(text);
            item.appendChild(link);
            tripList.appendChild(item);
          });
          if (tripList.children.length && window.EAAHomeMotion) window.EAAHomeMotion.refresh();
        }).catch(() => {});
        if (window.EAAHomeMotion) window.EAAHomeMotion.init(document.querySelector(".eaa-home"));
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
        if (window.EAAHomeMotion) window.EAAHomeMotion.kill();
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
      let turismoPublicLoadError = "";

      // Sin viajes cargados la web muestra el estado vacío: nunca viajes de demostración
      // con precios inventados (los viajes los carga el dueño desde el admin).
      function turismoPackages() {
        return turismoPublicPackagesCache || [];
      }

      function turismoFallbackPackages() {
        return turismoData.packages.slice(1, 7);
      }

      function isTurismoPublicPreviewMode() {
        return false;
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
        const raw = String(value ?? "").trim();
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
        const image = principalPhoto?.url || "";
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
          temporada: adminTrip.temporada || "",
          fechaSalida: adminTrip.fechaSalida || "",
          fechaRegreso: adminTrip.fechaRegreso || "",
          salidaGarantizada: Boolean(adminTrip.salidaGarantizada),
          resumen: adminTrip.descripcionCorta || "Consultanos por disponibilidad y detalles de este viaje.",
          descripcion: adminTrip.descripcionLarga || adminTrip.descripcionCorta || "Viaje con asesoramiento de El Angel Azul.",
          incluye: Array.isArray(adminTrip.incluye) ? adminTrip.incluye : [],
          noIncluye: Array.isArray(adminTrip.noIncluye) ? adminTrip.noIncluye : [],
          formasPago: Array.isArray(adminTrip.formasPago) ? adminTrip.formasPago : [],
          itinerario: Array.isArray(adminTrip.itinerario) ? adminTrip.itinerario : [],
          precio: visiblePrice || "Consultar disponibilidad",
          precioDesde: visiblePrice || "Consultar",
          precioValor: adminTrip.precioDesde === "" ? null : Number(adminTrip.precioDesde),
          precioBaseDoble: adminTrip.precioBaseDoble || "",
          suplementoSingle: adminTrip.suplementoSingle || "",
          precioMenor: adminTrip.precioMenor || "",
          condicionVenta: adminTrip.condicionVenta || "",
          alojamiento:adminTrip.alojamiento,transporte:adminTrip.transporte,regimenComidas:adminTrip.regimenComidas,disponibilidad:adminTrip.disponibilidad||"a_confirmar",cupos:adminTrip.cupos===""?null:Number(adminTrip.cupos),promocion:adminTrip.promocion,videoUrl:adminTrip.videoUrl,
          moneda: adminTrip.moneda,
          image,
          gallery: gallery.length ? gallery : [image],
          destacado: Boolean(adminTrip.destacado),
          orden: Number(adminTrip.orden) || 999,
          source: "database"
        };
      }

      async function loadTurismoPublicPackages() {
        // La base es la fuente de verdad: si responde, lo que devuelve es lo que se publica,
        // aunque no haya ningún viaje activo (entonces la web muestra el estado vacío).
        try {
          const response = await fetch("/api/public/paquetes", { cache: "no-store" });
          if (response.ok) {
            const payload = await response.json();
            if (payload.ok && Array.isArray(payload.paquetes)) {
              turismoPublicLoadError = "";
              turismoPublicPackagesCache = payload.paquetes
                .map(turismoRowToTrip)
                .map(adminTripToPublicPackage)
                .filter(Boolean)
                .sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.orden - b.orden);
              return turismoPublicPackagesCache;
            }
          }
        } catch (error) {
          // Sin caché de éxito: el próximo intento vuelve a consultar.
        }
        turismoPublicLoadError = "No pudimos cargar los viajes. Revisá tu conexión y volvé a intentar.";
        return [];
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

      // Tarjeta compacta de viaje: toda la tarjeta lleva al detalle (pensada para elegir rápido entre muchos paquetes).
      function turismoPrecioNumero(packageItem) {
        if (packageItem.precioValor === null || packageItem.precioValor === undefined || packageItem.precioValor === "") return null;
        const valor = Number(packageItem.precioValor);
        return Number.isFinite(valor) && valor >= 0 ? valor : null;
      }

      function turismoDias(packageItem) {
        const match = String(packageItem.duracion || "").match(/(\d+)\s*(?:d[ií]as?\b|d\b)/i);
        return match ? Number(match[1]) : null;
      }

      const TURISMO_ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

      function turismoDisponibilidad(packageItem) {
        if(packageItem.disponibilidad==="sin_cupo"||packageItem.cupos===0)return "Sin cupos disponibles";
        if(packageItem.disponibilidad==="disponible")return packageItem.cupos!==null&&packageItem.cupos!==undefined?`${packageItem.cupos} cupos informados`:"Disponible · consultá con la agencia";
        return "Disponibilidad a confirmar";
      }

      function turismoVideoUrl(raw) {
        try {
          const url=new URL(raw);if(url.protocol!=="https:"||url.username||url.password)return "";
          const host=url.hostname.replace(/^www\./,"");
          let id=host==="youtu.be"?url.pathname.slice(1):["youtube.com","youtube-nocookie.com"].includes(host)?url.pathname==="/watch"?url.searchParams.get("v"):/^\/(?:embed|shorts)\/([^/]+)$/.exec(url.pathname)?.[1]:null;
          if(id&&/^[a-z0-9_-]{11}$/i.test(id))return "https://www.youtube-nocookie.com/embed/"+id;
          if(["vimeo.com","player.vimeo.com"].includes(host)){id=/^\/(?:video\/)?(\d{6,12})\/?$/.exec(url.pathname)?.[1];if(id)return "https://player.vimeo.com/video/"+id;}
        } catch(_) {} return "";
      }

      function bindTurismoVideos(root=document) {
        root.querySelectorAll("[data-tur-video-open]").forEach(button=>button.onclick=()=>{
          const src=turismoVideoUrl(button.dataset.videoSrc);if(!src)return;
          const frame=document.createElement("iframe");frame.src=src;frame.title=button.dataset.videoTitle||"Video del viaje";frame.allow="fullscreen; encrypted-media; picture-in-picture";frame.allowFullscreen=true;frame.referrerPolicy="no-referrer";frame.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");
          button.closest("[data-tur-video]").replaceChildren(frame);
        });
      }

      function renderTurismoPackageCard(packageItem) {
        const priceText = packageItem.precioDesde && packageItem.precioDesde !== "Consultar" ? packageItem.precioDesde : "";
        const destination = escapeHtml(packageItem.destino);
        const dias = turismoDias(packageItem);
        const image = escapeHtml(safeMediaUrl(packageItem.image || (packageItem.gallery && packageItem.gallery[0])));
        return `
          <article class="tur-card turismo-package-card">
            <a class="tur-card-link" href="#/turismo/${encodeURIComponent(String(packageItem.slug || ""))}">
              <span class="tur-card-media">
                <img src="${image}" alt="" loading="lazy" width="800" height="600">
                <span class="tur-card-tag">${packageItem.destacado ? "Destacado" : escapeHtml(packageItem.categoria)}</span>
                ${dias ? `<span class="tur-card-days">${dias} ${dias === 1 ? "día" : "días"}</span>` : ""}
              </span>
              <span class="tur-card-body">
                <span class="tur-card-meta">${escapeHtml(packageItem.temporada || packageItem.tipo || "")}</span>
                <h3>${escapeHtml(packageItem.titulo || packageItem.destino)}</h3>
                <span class="tur-card-availability">${escapeHtml(turismoDisponibilidad(packageItem))}</span>
                ${packageItem.promocion?`<span class="tur-card-promotion">${escapeHtml(packageItem.promocion)}</span>`:""}
                <span class="tur-card-foot">
                  <span class="tur-price"><span>${priceText ? "Desde" : "Precio"}</span><strong>${priceText ? escapeHtml(priceText) : "A consultar"}</strong></span>
                  <span class="tur-card-go" aria-hidden="true">${TURISMO_ARROW_SVG}</span>
                </span>
              </span>
            </a>
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

      function renderTurismoEmptyState(sinViajes = false) {
        if (turismoPublicLoadError) return `<div class="tur-empty" role="alert"><p>${escapeHtml(turismoPublicLoadError)}</p><button type="button" class="eaa-button eaa-button-ink" data-turismo-retry>Volver a intentar</button></div>`;
        return `
          <div class="tur-empty">
            <p>${sinViajes
              ? "Estamos preparando nuestros próximos viajes de turismo. Escribinos por WhatsApp y te asesoramos con las opciones disponibles."
              : "No encontramos viajes para esta categoría por ahora. Consultanos por WhatsApp y te ayudamos a encontrar una opción."}</p>
            <a class="eaa-button eaa-button-fill" href="${whatsappLink("Hola, quiero consultar por una categoría de viaje que no encontré en la web de El Ángel Azul.")}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          </div>
        `;
      }

      function turismoPackageMatchesSearch(packageItem, query = "") {
        const normalizedQuery = String(query || "").trim().toLowerCase();
        if (!normalizedQuery) return true;
        return [packageItem.destino, packageItem.titulo, packageItem.tipo, packageItem.categoria, packageItem.resumen, packageItem.temporada]
          .filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
      }

      // Movimiento de Turismo: el mismo módulo que el inicio (titulares, textos que suben, hero con fotos, pasos).
      function bindTurismoAnimations() {
        if (window.EAAHomeMotion) window.EAAHomeMotion.init(document.querySelector(".eaa-turismo-page"));
      }

      const TURISMO_FILTRO_QUIEN = [["", "Todos"], ["pareja", "Pareja"], ["familiar", "Familia"], ["grupo", "Grupo"]];
      const TURISMO_FILTRO_TIPO = [["", "Todos"], ["playa", "Playa"], ["nieve", "Nieve"], ["escapada", "Escapada"], ["nacional", "Nacional"], ["internacional", "Internacional"]];
      const TURISMO_FILTRO_DURACION = [["", "Cualquiera"], ["corto", "Hasta 4 días"], ["medio", "5 a 8 días"], ["largo", "9 días o más"]];
      const TURISMO_ORDENES = [["destacados", "Destacados primero"], ["precio-asc", "Precio por moneda: menor a mayor"], ["precio-desc", "Precio por moneda: mayor a menor"], ["dias-asc", "Duración: más corta primero"], ["dias-desc", "Duración: más larga primero"]];
      const TURISMO_PAGINA = 24;

      function filtrarOrdenarTurismo(packages, filtros) {
        const valida = (lista, valor) => lista.some(([clave]) => clave === valor) ? valor : "";
        const quien = valida(TURISMO_FILTRO_QUIEN, filtros.quien);
        const tipo = valida(TURISMO_FILTRO_TIPO, filtros.tipo);
        const duracion = valida(TURISMO_FILTRO_DURACION, filtros.dur);
        const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : "";
        const desde = date(filtros.desde), hasta = date(filtros.hasta);
        const destino = String(filtros.destino || "");
        const orden = TURISMO_ORDENES.some(([clave]) => clave === filtros.orden) ? filtros.orden : "destacados";
        const resultado = packages.filter((p) => {
          const intenciones = Array.isArray(p.intenciones) ? p.intenciones : [];
          const dias = turismoDias(p);
          if (destino && p.destino !== destino) return false;
          if (desde && (!p.fechaSalida || p.fechaSalida < desde)) return false;
          if (hasta && (!p.fechaSalida || p.fechaSalida > hasta)) return false;
          if (quien && !intenciones.includes(quien)) return false;
          if (tipo && !intenciones.includes(tipo)) return false;
          if (duracion === "corto" && !(dias !== null && dias <= 4)) return false;
          if (duracion === "medio" && !(dias !== null && dias >= 5 && dias <= 8)) return false;
          if (duracion === "largo" && !(dias !== null && dias >= 9)) return false;
          return turismoPackageMatchesSearch(p, filtros.q);
        });
        // El orden de entrada ya es «destacados primero»; los viajes sin precio o sin duración van al final.
        const clave = (p, fn) => { const v = fn(p); return v === null || v === undefined ? Infinity : v; };
        if (orden === "precio-asc") resultado.sort((a, b) => String(a.moneda).localeCompare(String(b.moneda)) || clave(a, turismoPrecioNumero) - clave(b, turismoPrecioNumero));
        if (orden === "precio-desc") resultado.sort((a, b) => String(a.moneda).localeCompare(String(b.moneda)) || (turismoPrecioNumero(b) ?? -1) - (turismoPrecioNumero(a) ?? -1));
        if (orden === "dias-asc") resultado.sort((a, b) => clave(a, turismoDias) - clave(b, turismoDias));
        if (orden === "dias-desc") resultado.sort((a, b) => (turismoDias(b) ?? -1) - (turismoDias(a) ?? -1));
        return { resultado, filtros: { q: String(filtros.q || ""), destino, desde, hasta, quien, tipo, dur: duracion, orden } };
      }

      // Página con todos los paquetes: filtros a la izquierda, tarjetas a la derecha, estado en la URL.
      async function renderTurismoPaquetes() {
        const packages = await loadTurismoPublicPackages();
        const params = currentHashParams();
        const estado = { destino: params.get("destino") || "", desde: params.get("desde") || "", hasta: params.get("hasta") || "", q: params.get("q") || "", quien: params.get("quien") || "", tipo: params.get("tipo") || "", dur: params.get("dur") || "", orden: params.get("orden") || "destacados", visibles: TURISMO_PAGINA };
        const abierto = window.matchMedia("(min-width: 62rem)").matches;
        const radios = (nombre, opciones, actual) => opciones.map(([valor, etiqueta]) => `
          <label class="tur-radio"><input type="radio" name="${nombre}" value="${valor}"${valor === actual ? " checked" : ""}><span>${etiqueta}</span></label>`).join("");
        const inicial = filtrarOrdenarTurismo(packages, estado).filtros;
        document.getElementById("app").innerHTML = `
          <div class="eaa-home eaa-turismo-page tur-all">
            <section class="tur-all-head eaa-dark" aria-labelledby="tur-all-title">
              <div class="eaa-grain" aria-hidden="true"></div>
              <div class="eaa-wrap">
                <nav class="tur-crumbs" aria-label="Ruta"><a href="#/turismo">Turismo</a><span aria-hidden="true">/</span><span aria-current="page">Todos los paquetes</span></nav>
                <h1 id="tur-all-title" class="tur-all-title">Todos los paquetes</h1>
                <p>Filtrá por cantidad de personas, tipo de viaje, duración y precio. Elegí el que más te guste y consultanos.</p>
              </div>
            </section>
            <section class="tur-shop" aria-label="Paquetes de viaje">
              <div class="eaa-wrap tur-shop-grid">
                <details class="tur-filters"${abierto ? " open" : ""}>
                  <summary>Filtros</summary>
                  <form class="tur-filters-form" data-tur-filtros autocomplete="off">
                    <label class="tur-search" for="tur-q"><span>Buscar destino</span>
                      <input id="tur-q" name="q" type="search" value="${escapeHtml(inicial.q)}" placeholder="Ej: Bariloche, Cataratas, playa">
                    </label>
                    <label class="tur-filter-label"><span>Destino</span><select name="destino"><option value="">Todos los destinos</option>${[...new Set(packages.map(item => item.destino))].sort().map(destino => `<option value="${escapeHtml(destino)}"${destino === inicial.destino ? " selected" : ""}>${escapeHtml(destino)}</option>`).join("")}</select></label>
                    <fieldset><legend>Fecha de salida</legend><label class="tur-filter-label"><span>Desde</span><input type="date" name="desde" value="${escapeHtml(inicial.desde)}"></label><label class="tur-filter-label"><span>Hasta</span><input type="date" name="hasta" value="${escapeHtml(inicial.hasta)}"></label></fieldset>
                    <fieldset><legend>¿Cuántos viajan?</legend>${radios("quien", TURISMO_FILTRO_QUIEN, inicial.quien)}</fieldset>
                    <fieldset><legend>Tipo de viaje</legend>${radios("tipo", TURISMO_FILTRO_TIPO, inicial.tipo)}</fieldset>
                    <fieldset><legend>Duración</legend>${radios("dur", TURISMO_FILTRO_DURACION, inicial.dur)}</fieldset>
                    <button type="button" class="eaa-button eaa-button-ink" data-tur-limpiar>Limpiar filtros</button>
                  </form>
                </details>
                <div class="tur-results">
                  <div class="tur-results-bar">
                    <p class="tur-count" data-tur-count aria-live="polite"></p>
                    <label class="tur-sort"><span>Ordenar por</span>
                      <select name="orden" data-tur-orden>${TURISMO_ORDENES.map(([valor, etiqueta]) => `<option value="${valor}"${valor === inicial.orden ? " selected" : ""}>${etiqueta}</option>`).join("")}</select>
                    </label>
                  </div>
                  <div class="tur-grid tur-grid-all" data-tur-resultados></div>
                  <div class="tur-more"><button type="button" class="eaa-button eaa-button-ink" data-tur-mas hidden>Mostrar más viajes</button></div>
                </div>
              </div>
            </section>
          </div>
        `;
        const form = document.querySelector("[data-tur-filtros]");
        const ordenSelect = document.querySelector("[data-tur-orden]");
        const contenedor = document.querySelector("[data-tur-resultados]");
        const contador = document.querySelector("[data-tur-count]");
        const botonMas = document.querySelector("[data-tur-mas]");
        const leer = () => {
          const datos = new FormData(form);
          return { destino: datos.get("destino") || "", desde: datos.get("desde") || "", hasta: datos.get("hasta") || "", q: datos.get("q") || "", quien: datos.get("quien") || "", tipo: datos.get("tipo") || "", dur: datos.get("dur") || "", orden: ordenSelect.value };
        };
        const pintar = () => {
          const selection=leer();
          if(selection.desde&&selection.hasta&&selection.hasta<selection.desde){contador.textContent="Revisá las fechas";contenedor.innerHTML='<p role="alert" class="tur-date-error">La fecha hasta debe ser igual o posterior a la fecha desde.</p>';botonMas.hidden=true;return;}
          const { resultado, filtros } = filtrarOrdenarTurismo(packages, selection);
          const url = new URLSearchParams();
          Object.entries(filtros).forEach(([clave, valor]) => { if (valor && !(clave === "orden" && valor === "destacados")) url.set(clave, valor); });
          history.replaceState(null, "", `#/turismo/paquetes${url.toString() ? `?${url}` : ""}`);
          const total = resultado.length;
          contador.textContent = turismoPublicLoadError ? "No pudimos consultar los viajes" : !packages.length ? "Todavía no hay viajes publicados" : total === 1 ? "1 viaje" : `${total} viajes`;
          const visibles = resultado.slice(0, estado.visibles);
          contenedor.innerHTML = visibles.length ? visibles.map(renderTurismoPackageCard).join("") : renderTurismoEmptyState(!packages.length);
          botonMas.hidden = total <= estado.visibles;
        };
        form.addEventListener("change", () => { estado.visibles = TURISMO_PAGINA; pintar(); });
        form.addEventListener("input", (event) => { if (event.target.name === "q") { estado.visibles = TURISMO_PAGINA; pintar(); } });
        form.addEventListener("submit", (event) => event.preventDefault());
        ordenSelect.addEventListener("change", () => { estado.visibles = TURISMO_PAGINA; pintar(); });
        botonMas.addEventListener("click", () => { estado.visibles += TURISMO_PAGINA; pintar(); });
        document.querySelector("[data-tur-limpiar]").addEventListener("click", () => {
          form.reset();
          form.querySelectorAll('input[type="radio"][value=""]').forEach((radio) => { radio.checked = true; });
          form.querySelector('input[name="q"]').value = "";
          ordenSelect.value = "destacados";
          estado.visibles = TURISMO_PAGINA;
          pintar();
        });
        pintar();
        bindTurismoAnimations();
      }

      async function renderTurismo() {
        const packages = await loadTurismoPublicPackages();
        const previewMode = isTurismoPublicPreviewMode();
        const arrow = TURISMO_ARROW_SVG;
        const destacados = packages.slice(0, 6);
        const heroSlides = [
          ["cataratas-iguazu", "Las Cataratas del Iguazú rodeadas de selva", "Cataratas del Iguazú"],
          ["playa-rio", "Playa de Río de Janeiro al atardecer", "Playas de Brasil"],
          ["montana-patagonia", "Montañas y lagos de la Patagonia", "Patagonia"],
          ["nieve-montana", "Montaña nevada en la Cordillera", "Nieve y montaña"],
          ["ciudad-rio", "Vista de Río de Janeiro y el Pan de Azúcar", "Río de Janeiro"]
        ];
        const beneficios = [
          ["flight_takeoff", "Destinos nacionales e internacionales", "Escapadas y viajes largos para elegir."],
          ["support_agent", "Asesoramiento directo", "Una persona de la agencia responde en cada paso."],
          ["event_available", "Fechas y cupos claros", "Se confirman por WhatsApp antes de reservar."],
          ["payments", "Pagos a confirmar", "Te contamos las opciones antes de que decidas."]
        ];
        const pasos = [
          ["001", "Contanos la idea", "Fecha tentativa, cantidad de personas y estilo de viaje."],
          ["002", "Filtramos opciones", "Revisamos destinos, cupos y condiciones actuales."],
          ["003", "Decidís con claridad", "Comparás precio, duración e incluidos antes de reservar."]
        ];
        document.getElementById("app").innerHTML = `
          <div class="eaa-home eaa-turismo-page">
            ${previewMode ? `
              <section class="turismo-preview-mode-banner">
                <div>
                  <strong>Modo prueba activo</strong>
                  <span>Estás viendo los viajes guardados en el Admin de este navegador. No afecta la web pública real.</span>
                </div>
                <button type="button" data-disable-turismo-preview>Volver al JSON público</button>
              </section>
            ` : ""}
            <section class="eaa-hero eaa-dark" aria-label="Turismo" data-hero>
              <div class="eaa-hero-slides" data-hero-slides>
                ${heroSlides.map(([name, alt, caption], i) => `<figure class="eaa-hero-slide${i === 0 ? " is-active" : ""}" data-hero-slide data-caption="${escapeHtml(caption)}"><img src="assets/img/turismo/hero/${name}.webp" alt="${escapeHtml(alt)}" width="2000" height="1333"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}></figure>`).join("")}
              </div>
              <div class="eaa-grain" aria-hidden="true"></div>
              <div class="eaa-hero-shade" aria-hidden="true"></div>
              <div class="eaa-hero-inner">
                <h1 class="eaa-wordmark" data-fit aria-label="Turismo El Ángel Azul">Turismo El Ángel Azul</h1>
                <div class="eaa-hero-foot">
                  <div class="eaa-hero-tag">
                    <p class="eaa-hero-claim" data-rise>Tu próximo viaje,<br>planificado y acompañado.</p>
                    <p class="eaa-hero-sub" data-rise>Escapadas en familia, en pareja o en grupo, con asesoramiento claro antes de reservar y alguien que responde en cada paso.</p>
                    <div class="eaa-actions" data-rise>
                      <a class="eaa-button eaa-button-fill" href="#/turismo" data-scroll-target="turismo-catalogo">Ver viajes ${arrow}</a>
                      <a class="eaa-button eaa-button-line" href="${whatsappLink("Hola, quiero que me asesoren para elegir un viaje turístico con El Ángel Azul.")}" target="_blank" rel="noopener">Pedir asesoramiento ${arrow}</a>
                    </div>
                  </div>
                  <div class="eaa-hero-panel" role="group" aria-label="Fotos de destinos">
                    <div class="eaa-hero-progress" aria-hidden="true"><span data-hero-bar></span></div>
                    <div class="eaa-hero-controls">
                      <button type="button" data-hero-prev aria-label="Foto anterior">${arrow}</button>
                      <button type="button" data-hero-next aria-label="Foto siguiente">${arrow}</button>
                      <span class="eaa-hero-count" data-hero-count aria-live="off">01/0${heroSlides.length}</span>
                    </div>
                    <p class="eaa-hero-caption" data-hero-caption aria-live="polite">${heroSlides[0][2]}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="tur-intro" aria-labelledby="tur-intro-title">
              <div class="eaa-wrap">
                <div class="tur-intro-head">
                  <h2 id="tur-intro-title" data-split>Viajes de turismo, con alguien que te acompaña</h2>
                  <p data-rise>Paquetes de viaje seleccionados por la agencia para disfrutar en familia, en pareja o en grupo.</p>
                </div>
                <ul class="tur-intro-list">
                  ${beneficios.map(([icono, titulo, texto]) => `<li data-rise><span class="tur-intro-icon" aria-hidden="true"><span class="material-symbols-outlined">${icono}</span></span><strong>${titulo}</strong><p>${texto}</p></li>`).join("")}
                </ul>
              </div>
            </section>

            <section class="tur-featured" id="turismo-catalogo" aria-labelledby="tur-featured-title">
              <div class="eaa-wrap">
                <div class="tur-featured-head">
                  <h2 id="tur-featured-title" data-split>Paquetes destacados</h2>
                  ${packages.length ? `<a class="eaa-link tur-featured-all" href="#/turismo/paquetes">Ver todos los paquetes ${arrow}</a>` : ""}
                </div>
                <div class="tur-grid" data-turismo-package-grid>
                  ${destacados.length ? destacados.map(renderTurismoPackageCard).join("") : renderTurismoEmptyState(true)}
                </div>
                ${packages.length ? `<div class="tur-more"><a class="eaa-button eaa-button-ink" href="#/turismo/paquetes">Ver todos los paquetes ${arrow}</a></div>` : ""}
              </div>
            </section>

            <section class="eaa-process eaa-dark" aria-labelledby="tur-process-title">
              <div class="eaa-wrap">
                <h2 id="tur-process-title" data-split>Te ayudamos a elegir sin vueltas</h2>
                <ol class="eaa-process-list">
                  ${pasos.map(([n, titulo, texto]) => `<li data-process-row><span class="eaa-n" aria-hidden="true">${n}</span><div><h3>${titulo}</h3><p>${texto}</p></div><span class="eaa-process-note">Con la agencia</span></li>`).join("")}
                </ol>
                <div class="eaa-actions" data-rise><a class="eaa-button eaa-button-fill" href="${whatsappLink("Hola, quiero consultar por un viaje turístico con El Ángel Azul. Busco opciones según fecha, presupuesto y cantidad de personas.")}" target="_blank" rel="noopener">Consultar por un viaje ${arrow}</a></div>
              </div>
            </section>
          </div>
        `;
        document.querySelector("[data-disable-turismo-preview]")?.addEventListener("click", () => {
          setTurismoPublicPreviewMode(false);
          renderTurismo();
        });
        bindTurismoAnimations();
      }

      function renderPackageDetail(packageItem) {
        const gallery = packageItem.gallery?.length ? packageItem.gallery : [packageItem.image];
        const whatsappHref = turismoWhatsappForPackage(packageItem);
        const itinerario = Array.isArray(packageItem.itinerario) ? packageItem.itinerario : [];
        const formasPago = Array.isArray(packageItem.formasPago) ? packageItem.formasPago : [];
        const incluye = Array.isArray(packageItem.incluye) ? packageItem.incluye : [];
        const noIncluye = Array.isArray(packageItem.noIncluye) ? packageItem.noIncluye : [];
        const fechasSalida = [packageItem.fechaSalida, packageItem.fechaRegreso].filter(Boolean).join(" al ");
        const titulo = packageItem.titulo || packageItem.destino;
        const precio = packageItem.precioDesde && packageItem.precioDesde !== "Consultar" ? packageItem.precioDesde : "";
        const moneda = escapeHtml(packageItem.moneda || "");
        const relacionados = turismoPackages().filter((item) => item.slug !== packageItem.slug).slice(0, 3);
        const arrow = TURISMO_ARROW_SVG;
        const heroImage = escapeHtml(safeMediaUrl(packageItem.image || gallery[0]));
        const desglose = [
          packageItem.precioBaseDoble ? ["Base doble", `${moneda} ${escapeHtml(packageItem.precioBaseDoble)}`] : null,
          packageItem.suplementoSingle ? ["Suplemento single", `+ ${moneda} ${escapeHtml(packageItem.suplementoSingle)}`] : null,
          packageItem.precioMenor ? ["Precio menor", `${moneda} ${escapeHtml(packageItem.precioMenor)}`] : null
        ].filter(Boolean);
        const datos = [
          fechasSalida ? ["Fechas", fechasSalida] : null,
          ["Duración", packageItem.duracion || "A confirmar"],
          ["Destino", packageItem.destino],
          packageItem.temporada?["Temporada", packageItem.temporada]:null,
          ["Tipo", packageItem.tipo],
          ["Disponibilidad",turismoDisponibilidad(packageItem)],
          packageItem.salidaGarantizada ? ["Estado", "Salida garantizada"] : null
        ].filter(Boolean);

        document.getElementById("app").innerHTML = `
          <div class="eaa-home eaa-turismo-page tur-d">
            <section class="tur-d-hero eaa-dark" aria-labelledby="tur-d-title">
              <img class="tur-d-hero-img" src="${heroImage}" alt="">
              <div class="eaa-grain" aria-hidden="true"></div>
              <div class="tur-d-hero-shade" aria-hidden="true"></div>
              <div class="eaa-wrap tur-d-hero-inner">
                <nav class="tur-crumbs" aria-label="Ruta"><a href="#/turismo">Turismo</a><span aria-hidden="true">/</span><a href="#/turismo/paquetes">Paquetes</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(packageItem.destino)}</span></nav>
                <h1 id="tur-d-title" class="tur-d-title">${escapeHtml(titulo)}</h1>
                <ul class="tur-d-pills" aria-label="Datos principales">
                  ${packageItem.duracion ? `<li>${escapeHtml(packageItem.duracion)}</li>` : ""}
                  ${fechasSalida ? `<li>${escapeHtml(fechasSalida)}</li>` : ""}
                  ${packageItem.temporada ? `<li>${escapeHtml(packageItem.temporada)}</li>` : ""}
                  <li>${escapeHtml(turismoDisponibilidad(packageItem))}</li>
                  ${packageItem.salidaGarantizada ? `<li class="is-accent">Salida garantizada</li>` : ""}
                </ul>
              </div>
            </section>

            <section class="tur-d-body">
              <div class="eaa-wrap tur-d-grid">
                <div class="tur-d-main">
                  <section class="tur-d-block" aria-labelledby="tur-d-about">
                    <h2 id="tur-d-about">Sobre el viaje</h2>
                    <p class="tur-d-lead">${escapeHtml(packageItem.descripcion || packageItem.resumen || "")}</p>
                  </section>

                  ${gallery.length > 1 ? `
                  <section class="tur-d-block" aria-label="Fotos de ${escapeHtml(packageItem.destino)}">
                    <div class="tur-d-gallery">
                      ${gallery.slice(0, 5).map((image, index) => `<img class="${index === 0 ? "is-main" : ""}" src="${escapeHtml(safeMediaUrl(image))}" alt="${escapeHtml(packageItem.destino)} ${index + 1}" loading="lazy">`).join("")}
                    </div>
                  </section>` : ""}

                  ${packageItem.alojamiento||packageItem.transporte||packageItem.regimenComidas?`<section class="tur-d-block"><h2>Servicios del paquete</h2><dl class="tur-services">${[["Alojamiento",packageItem.alojamiento],["Transporte",packageItem.transporte],["Comidas",packageItem.regimenComidas]].filter(([,value])=>value).map(([label,value])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></section>`:""}
                  ${packageItem.promocion?`<section class="tur-d-block tur-d-promotion"><h2>Promoción del viaje</h2><p>${escapeHtml(packageItem.promocion)}</p></section>`:""}
                  ${turismoVideoUrl(packageItem.videoUrl)?`<section class="tur-d-block"><h2>Conocé el viaje</h2><div class="tur-video" data-tur-video><p>El video se reproduce desde ${turismoVideoUrl(packageItem.videoUrl).includes("vimeo.com")?"Vimeo":"YouTube"} al abrirlo.</p><button type="button" class="eaa-button eaa-button-fill" data-tur-video-open data-video-src="${escapeHtml(turismoVideoUrl(packageItem.videoUrl))}" data-video-title="${escapeHtml(packageItem.titulo||packageItem.destino)}">Ver video del viaje</button></div></section>`:""}

                  ${incluye.length || noIncluye.length ? `
                  <section class="tur-d-block tur-d-lists">
                    ${incluye.length ? `<div><h2>Qué incluye</h2><ul class="tur-d-checks">${incluye.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
                    ${noIncluye.length ? `<div><h2>Qué no incluye</h2><ul class="tur-d-checks is-off">${noIncluye.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
                  </section>` : ""}

                  ${itinerario.length ? `
                  <section class="tur-d-block" aria-labelledby="tur-d-prog">
                    <h2 id="tur-d-prog">Itinerario día por día</h2>
                    <div class="tur-d-days" data-itinerario-accordion>
                      ${itinerario.map((dia, index) => `
                        <div class="package-itinerario-item${index === 0 ? " is-open" : ""}" data-itinerario-item>
                          <button type="button" class="package-itinerario-toggle" data-itinerario-toggle aria-expanded="${index === 0 ? "true" : "false"}">
                            <span class="package-itinerario-num">${escapeHtml(String(dia.dia || index + 1).padStart(2, "0"))}</span>
                            <span class="package-itinerario-toggle-text"><strong>${escapeHtml(dia.titulo)}</strong></span>
                            <span class="tur-d-chevron" aria-hidden="true">+</span>
                          </button>
                          ${dia.descripcion ? `<div class="package-itinerario-body"><p>${escapeHtml(dia.descripcion)}</p></div>` : ""}
                        </div>`).join("")}
                    </div>
                  </section>` : ""}

                  ${formasPago.length || packageItem.condicionVenta ? `
                  <section class="tur-d-block" aria-labelledby="tur-d-pago">
                    <h2 id="tur-d-pago">Reserva y pago</h2>
                    ${formasPago.length ? `<ul class="tur-d-checks">${formasPago.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
                    ${packageItem.condicionVenta ? `<p class="tur-d-note"><strong>Condición de venta.</strong> ${escapeHtml(packageItem.condicionVenta)}</p>` : ""}
                  </section>` : ""}
                </div>

                <aside class="tur-d-aside" aria-label="Precio y reserva">
                  <div class="tur-d-card">
                    <p class="tur-d-from">${precio ? "Desde" : "Precio"}</p>
                    <p class="tur-d-price">${precio ? escapeHtml(precio) : "A consultar"}</p>

                    ${desglose.length ? `<dl class="tur-d-breakdown">${desglose.map(([etiqueta, valor]) => `<div><dt>${etiqueta}</dt><dd>${valor}</dd></div>`).join("")}</dl>` : ""}
                    <dl class="tur-d-facts">${datos.map(([etiqueta, valor]) => `<div><dt>${etiqueta}</dt><dd>${escapeHtml(valor)}</dd></div>`).join("")}</dl>
                    <a class="eaa-button eaa-button-fill" href="${whatsappHref}" target="_blank" rel="noopener">Consultar disponibilidad ${arrow}</a>
                    <a class="eaa-button eaa-button-ink" href="#/turismo/paquetes">Ver todos los paquetes</a>
                  </div>
                </aside>
              </div>
            </section>

            ${relacionados.length ? `
            <section class="tur-related" aria-labelledby="tur-related-title">
              <div class="eaa-wrap">
                <div class="tur-featured-head">
                  <h2 id="tur-related-title">Otros viajes que te pueden gustar</h2>
                  <a class="eaa-link tur-featured-all" href="#/turismo/paquetes">Ver todos los paquetes ${arrow}</a>
                </div>
                <div class="tur-grid">${relacionados.map(renderTurismoPackageCard).join("")}</div>
              </div>
            </section>` : ""}
          </div>

          <!-- Barra fija inferior (solo en pantallas chicas): precio + WhatsApp siempre a mano -->
          <div class="package-sticky-bar">
            <div><span>${precio ? "Desde" : "Precio"}</span><strong>${precio ? escapeHtml(precio) : "A consultar"}</strong></div>
            <a href="${whatsappHref}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          </div>
        `;
        bindPackageDetailItinerario();
        bindTurismoVideos();
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
        condicionVenta: "",
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
        orden: 1,
        alojamiento:"",transporte:"",regimenComidas:"",disponibilidad:"a_confirmar",cupos:"",promocion:"",videoUrl:"",archivado:false
      };

      let adminTurismoTrips = loadAdminTurismoTrips();
      let adminTurismoEditingId = adminTurismoTrips[0]?.id || null;
      let adminTurismoEditorOpen = false;
      let adminTurismoEditorDraft = null;
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
        const config = window.ElAngelAzulPersistence.readGoogleSheetsConfig();
        if (!config.enabled || !config.endpoint) {
          adminTurismoSaveFeedback = { ok: false, message: "Guardado solo en este navegador. La base de datos no está conectada." };
          return false;
        }
        try {
          const rows = googleSheetsTurismoRows(new Date().toISOString());
          await window.ElAngelAzulPersistence.writeGoogleSheetRows("TURISMO", rows, deleteIds);
          localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(adminTurismoTrips.map(normalizeAdminTurismoTrip)));
          adminTurismoSaveFeedback = { ok: true, message: "Cambios confirmados en la base de datos." };
          turismoPublicPackagesCache = null;
          return true;
        } catch (error) {
          adminTurismoSaveFeedback = { ok: false, message: `No se pudo guardar en la base de datos: ${error.message || "error desconocido"}.` };
          if (error.status === 401) handleAdminSessionLost();
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
          alojamiento:trip.alojamiento,transporte:trip.transporte,regimen_comidas:trip.regimenComidas,disponibilidad:trip.disponibilidad,cupos:trip.cupos,promocion:trip.promocion,video_url:trip.videoUrl,archivado:trip.archivado?"TRUE":"FALSE",
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
          alojamiento:row.alojamiento,transporte:row.transporte,regimenComidas:row.regimen_comidas,disponibilidad:row.disponibilidad,cupos:row.cupos??"",promocion:row.promocion,videoUrl:row.video_url,archivado:String(row.archivado).toUpperCase()==="TRUE",
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
        if (adminTurismoEditorDraft?.id === adminTurismoEditingId) return adminTurismoEditorDraft;
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
          precioDesde: String(trip.precioDesde ?? "").trim(),
          precioValor,
          moneda,
          precioBaseDoble: String(trip.precioBaseDoble || "").trim(),
          suplementoSingle: String(trip.suplementoSingle || "").trim(),
          precioMenor: String(trip.precioMenor || "").trim(),
          condicionVenta: String(trip.condicionVenta || "").trim(),
          alojamiento:String(trip.alojamiento||"").trim(),transporte:String(trip.transporte||"").trim(),regimenComidas:String(trip.regimenComidas||"").trim(),disponibilidad:trip.disponibilidad||"a_confirmar",cupos:String(trip.cupos??"").trim(),promocion:String(trip.promocion||"").trim(),videoUrl:String(trip.videoUrl||"").trim(),archivado:trip.archivado===true||String(trip.archivado).toUpperCase()==="TRUE",
          categorias: normalizeAdminTurismoCategories(trip.categorias || trip.categoria),
          descripcionCorta: String(trip.descripcionCorta || "").trim(),
          descripcionLarga: String(trip.descripcionLarga || "").trim(),
          incluye: linesToArray(trip.incluye),
          noIncluye: linesToArray(trip.noIncluye),
          formasPago: linesToArray(trip.formasPago),
          itinerario: Array.isArray(trip.itinerario)
            ? trip.itinerario.map((d) => ({ dia: String(d.dia || "").trim(), titulo: String(d.titulo || "").trim(), descripcion: String(d.descripcion || "").trim() })).filter((d) => d.dia || d.titulo || d.descripcion)
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
        return [
          { label: "Destino cargado", ok: Boolean(trip.destino) },
          { label: "Título comercial", ok: Boolean(trip.titulo) },
          { label: "Slug válido", ok: validSlug },
          { label: "Descripción corta", ok: Boolean(trip.descripcionCorta) },
          { label: "Al menos 1 foto", ok: trip.fotos.length >= 1 },
          { label: "Duración cargada", ok: Boolean(trip.duracion) }
        ];
      }


      function adminTurismoReadiness(trip) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        const checklist = adminTurismoPublicationChecklist(normalizedTrip);
        const missing = checklist.filter((item) => !item.ok);
        const isPublished = normalizedTrip.estado === "activo" && missing.length === 0;
        const today = new Date().toLocaleDateString("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"});
        if(normalizedTrip.archivado)return {key:"archivado",label:"Archivado",tone:"neutral",canPublish:false,isPublished:false,missing,checklist,message:"El paquete está archivado. Restauralo como borrador para volver a publicarlo."};
        if (normalizedTrip.estado === "activo" && ((normalizedTrip.fechaSalida && normalizedTrip.fechaSalida < today) || (normalizedTrip.fechaRegreso && normalizedTrip.fechaRegreso < today))) {
          return { key: "vencido", label: "Salida vencida", tone: "neutral", canPublish: false, isPublished: false, missing, checklist, message: "La fecha de este paquete ya pasó. No aparece en el catálogo; actualizá las fechas o despublicalo." };
        }


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
            message: "Este viaje está publicado desde la base de datos. Los cambios se aplican al guardar."
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
            message: "El viaje tiene el contenido necesario. Publicalo para que aparezca en la web."
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
                <strong>${readiness.isPublished ? "Estado: Publicado en la web" : "Estado: " + readiness.label}</strong>
                <span>Los cambios se publican cuando la base de datos confirma el guardado.</span>
              </div>
              <button type="button" class="admin-turismo-btn-guardar" data-admin-guardar-viaje>
                Guardar cambios
              </button>
            </div>
            <div class="admin-turismo-action-buttons">
              ${trip.archivado?"":`<button type="button" data-admin-publish>${esActivo ? "Guardar y mantener publicado" : "Guardar y publicar en la web"}</button>`}
              ${window.ElAngelAzulPersistence.adminSheetVersion("TURISMO",trip.id)?`<button type="button" data-admin-archive="${trip.archivado?"restaurar":"archivar"}">${trip.archivado?"Restaurar como borrador":"Archivar paquete"}</button>`:""}
              ${esActivo ? '<button type="button" data-admin-deactivate>Despublicar</button>' : ""}
              ${window.ElAngelAzulPersistence.adminSheetVersion("TURISMO", trip.id) ? '<button type="button" data-admin-duplicate>Duplicar como borrador</button>' : ""}
            </div>
            ${fb ? `<div role="status" class="admin-turismo-save-feedback ${fb.ok ? "is-ok" : "is-error"}">${fb.ok ? "✓" : "⚠️"} ${escapeHtml(fb.message)}</div>` : ""}
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
                <div class="admin-turismo-real-card-preview eaa-home">
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
                ${adminCanDelete() ? `<button type="button" data-admin-delete="${trip.id}">Eliminar</button>` : ""}
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
            <input type="hidden" name="archivado" value="${trip.archivado?"TRUE":"FALSE"}">
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
                    <input name="estado" type="radio" value="${value}" ${(trip.estado || "borrador") === value ? "checked" : ""} ${trip.archivado&&value==="activo"?"disabled":""}>
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
                ${field("Fecha de salida", `<input type="date" name="fechaSalida" value="${escapeHtml(trip.fechaSalida || "")}" placeholder="Ej: 28 de diciembre de 2026">`, "Opcional para paquetes sin salida definida.", false)}
                ${field("Fecha de regreso", `<input type="date" name="fechaRegreso" value="${escapeHtml(trip.fechaRegreso || "")}" placeholder="Ej: 4 de enero de 2027">`, "")}
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
            `, statusBadge(fechasComplete, true))}

            ${block("Precio", "Valor visible para el cliente y condición de venta.", `
              <div class="admin-turismo-form-grid admin-turismo-form-grid--compact">
                ${field("Precio visible", `<input type="number" min="0" step="0.01" name="precioDesde" value="${escapeHtml(trip.precioDesde || "")}" placeholder="Ej: 1436.50">`, "Solo el importe. La moneda se muestra por separado; vacío significa consultar.", false)}
                ${field("Moneda", `
                  <select name="moneda">
                    ${adminTurismoCurrencies.map((c) => `<option value="${c}" ${(trip.moneda || "USD") === c ? "selected" : ""}>${c}</option>`).join("")}
                  </select>
                `)}
                ${field("Precio base doble (número)", `<input name="precioBaseDoble" value="${escapeHtml(trip.precioBaseDoble || "")}" placeholder="Ej: 1436">`, "Por persona en habitación doble.")}
                ${field("Suplemento single", `<input name="suplementoSingle" value="${escapeHtml(trip.suplementoSingle || "")}" placeholder="Ej: 320">`, "Diferencia para habitación individual.")}
                ${field("Precio menor", `<input name="precioMenor" value="${escapeHtml(trip.precioMenor || "")}" placeholder="Ej: 980">`, "Opcional.")}
              </div>
              ${field("Condición de venta", `<textarea name="condicionVenta" rows="2">${escapeHtml(trip.condicionVenta || "")}</textarea>`, "Aparece al pie del detalle del paquete.")}
            `, statusBadge(priceComplete, true))}

            ${block("Servicios y disponibilidad", "Información comercial confirmada por la agencia.", `
              <div class="admin-turismo-form-grid admin-turismo-form-grid--compact">
                ${field("Alojamiento",`<textarea name="alojamiento" rows="2" maxlength="2000">${escapeHtml(trip.alojamiento||"")}</textarea>`,"Opcional.")}
                ${field("Transporte",`<textarea name="transporte" rows="2" maxlength="2000">${escapeHtml(trip.transporte||"")}</textarea>`,"Opcional.")}
                ${field("Régimen de comidas",`<textarea name="regimenComidas" rows="2" maxlength="2000">${escapeHtml(trip.regimenComidas||"")}</textarea>`,"Opcional.")}
                ${field("Disponibilidad",`<select name="disponibilidad">${Object.entries({a_confirmar:"A confirmar",disponible:"Disponible",sin_cupo:"Sin cupos"}).map(([value,text])=>`<option value="${value}" ${trip.disponibilidad===value?'selected':''}>${text}</option>`).join("")}</select>`,"Se informa al cliente; la consulta no reserva lugares.")}
                ${field("Cupos disponibles · opcional",`<input type="number" name="cupos" min="0" step="1" value="${escapeHtml(trip.cupos??"")}">`,"Dejá vacío si se confirma con la agencia.")}
                ${field("Promoción · opcional",`<textarea name="promocion" rows="2" maxlength="2000">${escapeHtml(trip.promocion||"")}</textarea>`,"Ingresá el beneficio y sus condiciones confirmadas.")}
                ${field("Video · opcional",`<input type="url" name="videoUrl" value="${escapeHtml(trip.videoUrl||"")}">`,"Pegá el enlace de YouTube o Vimeo.")}
              </div>
            `,statusBadge(Boolean(trip.alojamiento||trip.transporte||trip.regimenComidas||trip.promocion||trip.videoUrl||trip.cupos!==""),true))}

            ${block("Fotos", "Cargá fotos desde tu dispositivo y elegí la portada.", `
              <div class="catalog-file-upload" data-catalog-photo-upload></div>
              <div class="admin-turismo-fotos-list" data-admin-turismo-fotos-list>
                ${photos.length ? photos.map((photo, index) => `
                  <div class="admin-turismo-foto-row">
                    <div class="admin-turismo-foto-preview">
                      <img src="${escapeHtml(safeMediaUrl(photo.url))}" alt="Foto ${index + 1}" data-admin-catalog-photo>
                      <div class="admin-turismo-foto-error" hidden>No pudimos cargar esta foto.</div>
                    </div>
                    <div class="admin-turismo-foto-fields">
                      ${photo.url.startsWith("/api/public/catalogo/media/")?`<input type="hidden" name="foto_url_${index}" value="${escapeHtml(photo.url)}">`:`<label>Dirección de la imagen<input class="admin-turismo-foto-url" name="foto_url_${index}" value="${escapeHtml(photo.url)}" data-foto-index="${index}"></label>`}
                      <label>Descripción de la foto · opcional<input name="foto_alt_${index}" value="${escapeHtml(photo.alt || "")}" maxlength="200"></label>
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
                <details class="catalog-photo-url"><summary>Agregar una foto por enlace</summary><div class="admin-turismo-foto-row admin-turismo-foto-row--new">
                  <div class="admin-turismo-foto-preview admin-turismo-foto-preview--empty" id="new-foto-preview">
                    <span>Preview</span>
                  </div>
                  <div class="admin-turismo-foto-fields">
                    <input class="admin-turismo-foto-url" id="new-foto-url" placeholder="Pegá la URL de la imagen aquí" data-nueva-foto>
                    <input id="new-foto-alt" placeholder="Descripción (opcional)">
                  </div>
                  <button type="button" class="admin-turismo-primary-button" data-add-foto>+ Agregar foto</button>
                </div></details>
              </div>
              <p class="admin-field-hint">La foto marcada como "Principal" aparece de portada en la card y el detalle.</p>
              <input type="hidden" name="fotos_count" value="${photos.length}">
            `, statusBadge(photosComplete))}

            ${block("Incluye / No incluye", "Qué cubre el paquete y qué no.", `
              <div class="admin-turismo-form-grid">
                ${field("Qué incluye", `<textarea name="incluye" rows="7" placeholder="Un servicio confirmado por línea">${escapeHtml(arrayToLines(trip.incluye))}</textarea>`, "Un ítem por línea. Cargá únicamente los servicios acordados.", false)}
                ${field("Qué no incluye", `<textarea name="noIncluye" rows="5" placeholder="Gastos personales&#10;Excursiones opcionales&#10;Seguro de viaje">${escapeHtml(arrayToLines(trip.noIncluye))}</textarea>`, "Un ítem por línea.")}
              </div>
              ${field("Formas de pago", `<textarea name="formasPago" rows="4" placeholder="Cargá las formas y condiciones de pago confirmadas para este paquete">${escapeHtml(arrayToLines(trip.formasPago))}</textarea>`, "Un ítem por línea. Aparece en la página de detalle.")}
            `, statusBadge(includesComplete, true))}

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
          id: "colegios",
          label: "Colegios",
          path: "/admin/colegios",
          icon: "school"
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
          school: '<path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3ZM5 13.2v4L12 21l7-3.8v-4L12 17l-7-3.8Z"/>',
          person: '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-9 9v-2c0-3.3 4-5 9-5s9 1.7 9 5v2H3Z"/>',
          payments: '<path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 10h2V9H6v1Zm10 5h2v-1h-2v1Z"/>',
          flight: '<path d="m2 16 8-3V4.5a2 2 0 1 1 4 0V13l8 3v2l-8-1v3l2 1.5V23l-4-1-4 1v-1.5l2-1.5v-3l-8 1v-2Z"/>',
          settings: '<path d="m19.4 13 .1-1-.1-1 2.1-1.6-2-3.4-2.6 1a8 8 0 0 0-1.7-1L15 3h-4l-.4 3a8 8 0 0 0-1.7 1L6.3 6 4.3 9.4 6.4 11l-.1 1 .1 1-2.1 1.6 2 3.4 2.6-1a8 8 0 0 0 1.7 1l.4 3h4l.4-3a8 8 0 0 0 1.7-1l2.6 1 2-3.4-2.3-1.6ZM13 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/>',
          account_circle: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 13a8 8 0 0 1-6.3-3.1C7.1 15.7 9.3 15 12 15s4.9.7 6.3 1.9A8 8 0 0 1 12 20Z"/>'
        };
        const path = paths[name] || paths.space_dashboard;
        return `<svg class="admin-inline-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
      }


      // Solo el administrador elimina registros (el servidor también lo exige); la agencia crea y edita.
      function adminCanDelete() {
        return String(adminSession?.role || "").toLowerCase() === "admin";
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
      const ADMIN_SESION_PERDIDA_KEY = "eaa-admin-sesion-perdida";
      let adminLoginNotice = "";
      try {
        if (sessionStorage.getItem(ADMIN_SESION_PERDIDA_KEY)) {
          adminLoginNotice = "Tu sesión terminó (venció o se abrió en otro lugar). El último cambio no se guardó: ingresá de nuevo y repetilo.";
          sessionStorage.removeItem(ADMIN_SESION_PERDIDA_KEY);
        }
      } catch (_) { /* sin sessionStorage el login se muestra igual, solo sin el aviso */ }

      // El servidor respondió 401 a un guardado: la sesión venció o se abrió en otro lugar
      // con el mismo usuario y el cambio no se guardó. Se recarga en vez de dibujar el login
      // acá: quien llamó al guardado vuelve a dibujar el panel por su cuenta y lo taparía, y
      // un arranque limpio vuelve a leer la base en lugar de dejar el cambio sin guardar.
      function handleAdminSessionLost() {
        try { sessionStorage.setItem(ADMIN_SESION_PERDIDA_KEY, "1"); } catch (_) { /* ver arriba */ }
        location.reload();
      }

      window.addEventListener("eaa-admin-session-lost", handleAdminSessionLost);

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
                <div class="admin-login-panel-top">
                  <a class="admin-login-logo-link" href="#/" aria-label="El Ángel Azul - Inicio">
                    <img src="assets/img/logo-completo-azul.svg" alt="El Ángel Azul">
                  </a>
                </div>
                <div class="admin-login-brand">
                  <h1>Gestión completa de tus viajes</h1>
                  <p>Operá inscripciones, pasajeros, pagos y turismo desde un panel privado.</p>
                </div>
                <div class="admin-login-highlights" aria-label="Módulos disponibles">
                  ${adminModules.filter((module) => module.id !== "home").map((module) => `<span>${adminIconSvg(module.icon)}${escapeHtml(module.label)}</span>`).join("")}
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
                      <input id="admin-password-field" name="password" type="password" autocomplete="current-password" placeholder="Contraseña" required>
                      <button type="button" data-admin-password-toggle aria-label="Mostrar contraseña" aria-controls="admin-password-field" aria-pressed="false" title="Mostrar contraseña">
                        <svg class="admin-password-eye" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
                          <circle cx="12" cy="12" r="3"/>
                          <path class="admin-password-eye-slash" d="m3 3 18 18"/>
                        </svg>
                      </button>
                    </span>
                  </label>
                  ${errorMessage || adminLoginNotice ? `<p class="admin-login-error" role="alert">${escapeHtml(errorMessage || adminLoginNotice)}</p>` : ""}
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
          toggle.title = shouldShow ? "Ocultar contraseña" : "Mostrar contraseña";
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
          const button = form.querySelector('button[type="submit"]');
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
            adminLoginNotice = "";
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
                <button type="button" class="admin-nav-toggle" data-admin-nav-toggle aria-expanded="false" aria-controls="admin-module-nav">
                  <span>${escapeHtml(adminVisibleModules().find((module) => module.id === moduleId)?.label || "Navegación")}</span>
                  <span class="admin-nav-toggle-hint">Cambiar sección</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <nav id="admin-module-nav">
                  ${adminVisibleModules().map((module) => `
                    <a class="${module.id === moduleId ? "active" : ""}" ${module.id === moduleId ? 'aria-current="page"' : ""} href="${adminRouteHref(module.path)}">
                      ${adminIconSvg(module.icon, "admin-nav-icon")}
                      <span>${module.label}</span>
                    </a>
                  `).join("")}
                </nav>
              </aside>
              <main class="admin-main">
                ${googleSheetsSyncState.status === "error" ? `<section class="admin-turismo-panel admin-form-error" role="alert"><strong>Revisá la conexión antes de seguir</strong><p>${escapeHtml(googleSheetsSyncState.message)}</p><p>Conservá lo que escribiste. Si el error indica que otro usuario modificó el registro, recargá la página antes de volver a editar.</p></section>` : ""}
                ${contentHtml}
              </main>
            </div>
          </div>
        `;
      }

      function bindAdminShell() {
        document.querySelectorAll("[data-admin-payment-for]").forEach((button) => button.addEventListener("click", () => {
          adminPagoDraft = { ...newAdminPagoDraft(), pasajeroId: button.dataset.adminPaymentFor };
          location.hash = "/admin/pagos";
        }));
        const sidebar = document.querySelector(".admin-sidebar");
        const toggle = sidebar?.querySelector("[data-admin-nav-toggle]");
        toggle?.addEventListener("click", () => {
          const open = toggle.getAttribute("aria-expanded") !== "true";
          toggle.setAttribute("aria-expanded", String(open));
          sidebar.classList.toggle("is-open", open);
        });
        sidebar?.addEventListener("keydown", (event) => {
          if (event.key !== "Escape" || toggle?.getAttribute("aria-expanded") !== "true") return;
          toggle.setAttribute("aria-expanded", "false");
          sidebar.classList.remove("is-open");
          toggle.focus();
        });
        document.querySelector("[data-admin-logout]")?.addEventListener("click", async () => {
          try {
            await fetch("/api/admin/logout", {
              method: "POST",
              credentials: "same-origin"
            });
          } catch (error) {
            // Si falla el logout remoto, se limpia igual la sesión visual.
          }
          window.ElAngelAzulPersistence.clearPrivateCollections();
          window.ElAngelAzulAccounts?.clear();
          window.ElAngelAzulAcademic?.clear();
          window.ElAngelAzulDocuments?.clear("admin");
          window.ElAngelAzulCatalogMedia?.clear();
          adminPasajerosDemo = [];
          adminContratosDemo = [];
          adminFichasTutor = [];
          adminPasajerosSelectedDni = "";
          adminPasajerosSelectedKey = "";
          adminTutorReviewDrafts.clear();
          adminPagos = [];
          adminCuentas.clear();
          adminCuentasLoaded = false;
          adminPagosLoaded = false;
          googleSheetsHydrated = false;
          adminSession = null;
          adminSessionChecked = true;
          adminLoginNotice = "";
          renderAdminLogin();
        });
      }


      function renderAdminHome() {
        const fichas = loadFichasAdhesionDemo();
        const passengerRows = adminPasajerosRows();
        const paymentRows = passengerRows.map(({ passenger }) => passengerPaymentData(passenger));
        const fichasNuevas = fichas.filter((ficha) => (ficha.estadoRevision || "pendiente") === "pendiente").length;
        const pasajerosActivos = passengerRows.filter(({ passenger }) => String(passenger.estado || "").toLowerCase().includes("activo")).length;
        const pasajerosConCobros = paymentRows.filter((payment) => payment.registros > 0).length;
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
                <span>Pasajeros con cobros</span>
                <strong>${adminPagosLoaded ? pasajerosConCobros : "Sin consultar"}</strong>
                <small>Con pagos registrados</small>
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
          id: passenger.id || `pasajero-${passenger.dni || sheetMigrationSlug(passenger.nombre || "sin-dni")}-${group.id}`,
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
        if (!adminExportReady()) return;
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

      // ABM de colegios (lista que usa la inscripción pública). Baja lógica:
      // activo = FALSE los saca de la inscripción pero conserva fichas y grupos.
      let adminColegiosEditId = "";
      let adminColegiosMessage = "";
      let adminColegiosVerInactivos = false;

      async function saveAdminColegios(nuevos, mensajeOk) {
        const anteriores = adminColegios;
        adminColegios = nuevos;
        const guardado = await queueGoogleSheetsWrite(["COLEGIOS"]);
        if (guardado) {
          adminColegiosMessage = mensajeOk;
        } else {
          adminColegios = anteriores;
          adminColegiosMessage = googleSheetsSyncState.message;
        }
        return guardado;
      }

      function renderAdminColegios() {
        const sinVincular = loadFichasAdhesionDemo().filter((ficha) => !ficha.colegioVinculado && ficha.colegioTexto).length;
        const editando = adminColegios.find((colegio) => colegio.id === adminColegiosEditId) || null;
        const provincias = window.ElAngelAzulFichaValidation.PROVINCIAS;
        const filas = [...adminColegios]
          .filter((colegio) => adminColegiosVerInactivos || colegio.activo === "TRUE")
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        document.getElementById("app").innerHTML = renderAdminShell("colegios", `
          <section class="admin-turismo-panel admin-colegios">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Colegios</h2>
                <p>Lista que ven las familias al inscribirse. ${sinVincular ? `<strong>${sinVincular} ficha(s)</strong> tienen un colegio escrito a mano sin vincular (se resuelven desde Inscripciones).` : "No hay colegios escritos a mano pendientes de vincular."}</p>
              </div>
              <label class="admin-colegios-toggle"><input type="checkbox" data-admin-colegios-inactivos ${adminColegiosVerInactivos ? "checked" : ""}> Mostrar dados de baja</label>
            </div>
            ${adminColegiosMessage ? `<div class="admin-fichas-assigned-note" role="status" tabindex="-1" data-admin-colegios-status>${escapeHtml(adminColegiosMessage)}</div>` : ""}
            <form class="admin-pasajeros-form admin-colegios-form" data-admin-colegios-form novalidate>
              <fieldset>
                <legend>${editando ? "Editar colegio" : "Nuevo colegio"}</legend>
                <label>Nombre <span class="admin-pasajeros-required">*</span>
                  <input name="nombre" value="${escapeHtml(editando?.nombre || "")}" maxlength="120" required>
                </label>
                <label>Provincia
                  <select name="provincia">
                    <option value="">Sin indicar</option>
                    ${provincias.map((provincia) => `<option value="${escapeHtml(provincia)}" ${provincia === (editando ? editando.provincia : "Corrientes") ? "selected" : ""}>${escapeHtml(provincia)}</option>`).join("")}
                  </select>
                </label>
                <label>Localidad
                  <input name="localidad" value="${escapeHtml(editando?.localidad || "")}" maxlength="80">
                </label>
              </fieldset>
              <div class="admin-colegios-error" id="admin-colegios-error" data-admin-colegios-error role="alert" hidden></div>
              <div class="admin-pasajeros-form-actions">
                <button type="submit" class="admin-pasajeros-primary-button">${editando ? "Guardar cambios" : "Agregar colegio"}</button>
                ${editando ? `<button type="button" class="admin-pasajeros-secondary-button" data-admin-colegios-cancelar>Cancelar</button>` : ""}
              </div>
            </form>
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-colegios-table">
                <thead><tr><th>Nombre</th><th>Provincia</th><th>Localidad</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
                <tbody>
                  ${filas.length ? filas.map((colegio) => `
                    <tr>
                      <td>${escapeHtml(colegio.nombre)}</td>
                      <td>${escapeHtml(colegio.provincia || "—")}</td>
                      <td>${escapeHtml(colegio.localidad || "—")}</td>
                      <td><span class="admin-pasajeros-status ${colegio.activo === "TRUE" ? "is-ok" : "is-alert"}">${colegio.activo === "TRUE" ? "Activo" : "De baja"}</span></td>
                      <td class="admin-colegios-actions">
                        <button type="button" class="admin-pasajeros-secondary-button" data-admin-colegios-editar="${escapeHtml(colegio.id)}" aria-label="Editar ${escapeHtml(colegio.nombre)}">Editar</button>
                        <button type="button" class="admin-pasajeros-secondary-button" data-admin-colegios-estado="${escapeHtml(colegio.id)}" aria-label="${colegio.activo === "TRUE" ? "Dar de baja" : "Reactivar"} ${escapeHtml(colegio.nombre)}">${colegio.activo === "TRUE" ? "Dar de baja" : "Reactivar"}</button>
                      </td>
                    </tr>
                  `).join("") : `<tr><td colspan="5">Todavía no hay colegios cargados.</td></tr>`}
                </tbody>
              </table>
            </div>
          </section>
        `);
        bindAdminShell();
        document.querySelector("[data-admin-colegios-inactivos]")?.addEventListener("change", (event) => {
          adminColegiosVerInactivos = event.target.checked;
          renderAdminColegios();
        });
        document.querySelector("[data-admin-colegios-cancelar]")?.addEventListener("click", () => {
          adminColegiosEditId = "";
          adminColegiosMessage = "";
          renderAdminColegios();
        });
        document.querySelectorAll("[data-admin-colegios-editar]").forEach((button) => {
          button.addEventListener("click", () => {
            adminColegiosEditId = button.dataset.adminColegiosEditar;
            adminColegiosMessage = "";
            renderAdminColegios();
            document.querySelector("[data-admin-colegios-form] [name=nombre]")?.focus();
          });
        });
        document.querySelectorAll("[data-admin-colegios-estado]").forEach((button) => {
          button.addEventListener("click", async () => {
            const colegio = adminColegios.find((item) => item.id === button.dataset.adminColegiosEstado);
            if (!colegio) return;
            const baja = colegio.activo === "TRUE";
            if (baja && !confirm(`¿Dar de baja “${colegio.nombre}”? Deja de aparecer en la inscripción; las fichas y grupos existentes se conservan.`)) return;
            await saveAdminColegios(
              adminColegios.map((item) => (item.id === colegio.id ? { ...item, activo: baja ? "FALSE" : "TRUE" } : item)),
              baja ? `“${colegio.nombre}” dado de baja.` : `“${colegio.nombre}” reactivado.`
            );
            renderAdminColegios();
            document.querySelector("[data-admin-colegios-status]")?.focus();
          });
        });
        document.querySelector("[data-admin-colegios-form]")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const errorBox = form.querySelector("[data-admin-colegios-error]");
          const datos = new FormData(form);
          const nombre = String(datos.get("nombre") || "").replace(/\s+/g, " ").trim();
          const mostrarError = (texto) => {
            form.closest("section")?.querySelector("[data-admin-colegios-status]")?.remove();
            errorBox.hidden = false;
            errorBox.textContent = texto;
            const campoNombre = form.querySelector("[name=nombre]");
            campoNombre.setAttribute("aria-invalid", "true");
            campoNombre.setAttribute("aria-describedby", "admin-colegios-error");
            campoNombre.focus();
          };
          if (nombre.length < 3) return mostrarError("El nombre del colegio es muy corto (mínimo 3 letras).");
          const repetido = adminColegios.find((colegio) => colegio.id !== adminColegiosEditId && normalizeFichaSearchText(colegio.nombre) === normalizeFichaSearchText(nombre));
          if (repetido) return mostrarError(`Ya existe un colegio con ese nombre${repetido.activo === "TRUE" ? "" : " (está dado de baja: reactivalo)"}.`);
          const campos = { nombre, provincia: String(datos.get("provincia") || ""), localidad: String(datos.get("localidad") || "").replace(/\s+/g, " ").trim() };
          const nuevos = editando
            ? adminColegios.map((colegio) => (colegio.id === editando.id ? { ...colegio, ...campos } : colegio))
            : [...adminColegios, { id: crypto.randomUUID(), codigo_oficial: "", activo: "TRUE", ...campos }];
          const guardado = await saveAdminColegios(nuevos, editando ? `“${nombre}” actualizado.` : `“${nombre}” agregado.`);
          if (guardado) adminColegiosEditId = "";
          renderAdminColegios();
          if (!guardado) {
            // Conservar el borrador visible aunque se haya rechazado el
            // guardado. La tabla mantiene el estado anterior, sin fingir éxito.
            const nuevoForm = document.querySelector("[data-admin-colegios-form]");
            for (const [campo, valor] of Object.entries(campos)) nuevoForm.elements.namedItem(campo).value = valor;
          }
          document.querySelector("[data-admin-colegios-status]")?.focus();
        });
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
              <p>Pagos permite registrar cobros manuales y consultar su historial. El precio y el cronograma de cuotas del contrato siguen pendientes. Los cambios de contraseñas y servidor no se realizan desde este panel.</p>
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
        privateData: true,
        seed: () => [],
        normalize: normalizeAdminPasajerosGroup
      });

      const contratosCollection = window.ElAngelAzulPersistence.collection({
        key: CONTRATOS_STORAGE_KEY,
        privateData: true,
        seed: () => [],
        normalize: (contract) => ({
          ...contract,
          id: String(contract.id || "").trim(),
          codigo_contrato: String(contract.codigo_contrato || contract.codigoContrato || "").trim(),
          grupo_id: String(contract.grupo_id || contract.grupoId || "").trim()
        })
      });

      const fichaAdhesionCollection = window.ElAngelAzulPersistence.collection({
        key: FICHA_ADHESION_STORAGE_KEY,
        privateData: true,
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
        if (!googleSheetsHydrating) return queueGoogleSheetsWrite(["PASAJEROS"]).then(async saved => {
          if (saved) await loadAdminPagos();
          return saved;
        });
        return Promise.resolve(true);
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

      async function createAdminPasajerosGroup({ nivel, viaje, colegio, colegioId = "", curso, division, pasajerosEsperados = 0 }) {
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
          if (!await saveAdminGruposDemo()) {
            adminPasajerosDemo = adminPasajerosCollection.save(adminPasajerosDemo.filter(item => item.id !== group.id));
            return false;
          }
        }
        adminPasajerosNivel = group.nivel;
        adminPasajerosViaje = group.viaje;
        adminPasajerosColegio = group.colegio;
        adminPasajerosGrupoId = group.id;
        adminPasajerosShowForm = false;
        adminPasajerosFormError = "";
        renderAdminPasajeros();
        return true;
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
      let adminPasajerosSelectedKey = "";
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
      const adminTutorReviewDrafts = new Map();
      let adminTutorReviewSaving = false;
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
        const previous = fichaAdhesionCollection.load();
        fichaAdhesionCollection.save(fichas);
        if (!googleSheetsHydrating) return queueGoogleSheetsWrite(["FICHAS_ADHESION"]).then(saved => {
          if (!saved) fichaAdhesionCollection.save(previous);
          return saved;
        });
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
          estado: row.estado || "Activo",
          pasajerosEsperados: Number(row.pasajeros_esperados || 0),
          pasajeros: []
        });
      }

      function sheetPassengerFromRow(row = {}) {
        return {
          id: row.id || "",
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
          if (adminEntry) {
            const capture = window.ElAngelAzulPersistence.captureAdminSheet;
            capture("GRUPOS", googleSheetsGroupRows(), grupos);
            capture("CONTRATOS", googleSheetsContratoRows(), contratos);
            capture("PASAJEROS", googleSheetsPassengerRows(), pasajerosRows);
            capture("FICHAS_ADHESION", googleSheetsFichaRows(), fichasRows);
            capture("TURISMO", googleSheetsTurismoRows(), turismo);
            capture("FICHAS_TUTOR", adminFichasTutor, fichasTutor);
            capture("COLEGIOS", adminColegios, colegios);
            capture("PLANES_PAGO", adminPlanesPago, planesPago);
          }
          if (adminEntry) await loadAdminPagos();
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

      function queueGoogleSheetsWrite(sheets = [], deleteIdsBySheet = {}, pinnedVersionsBySheet = {}) {
        const config = window.ElAngelAzulPersistence.readGoogleSheetsConfig();
        if (!config.enabled || !config.endpoint) {
          googleSheetsSyncState = {
            status: "local",
            message: "Guardado local. La base de datos no está conectada."
          };
          return Promise.resolve(false);
        }
        if (!googleSheetsHydrated) {
          googleSheetsSyncState = { status: "error", message: "No se guardó el cambio porque faltó cargar la base completa. Recargá la página y volvé a intentar." };
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
            await window.ElAngelAzulPersistence.writeGoogleSheetRows(sheet, rowsByTab[sheet] || [], deleteIdsBySheet[sheet] || [], pinnedVersionsBySheet[sheet] || {});
          }
          googleSheetsSyncState = {
            status: "ok",
            message: "Cambios guardados en la base de datos."
          };
          return true;
        }).catch((error) => {
          googleSheetsSyncState = {
            status: "error",
            message: `No se pudo guardar en la base de datos: ${error.message || "error desconocido"}`
          };
          if (error.status === 401) handleAdminSessionLost();
          return false;
        });
        return googleSheetsWriteQueue;
      }

      function adminFichasSaveMessage(ok, successText = "Guardado en la base de datos.") {
        adminFichasMessage = ok
          ? successText
          : googleSheetsSyncState.status === "local"
            ? googleSheetsSyncState.message
            : googleSheetsSyncState.message || "Error al guardar en la base de datos.";
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
        return /^(data:image\/png;base64,[a-z0-9+/=]+|\/api\/admin\/fichas\/[0-9a-f-]{36}\/firma)$/i.test(value) ? value : "";
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
          .filter(({ passenger: item, group }) => normalizeFichaDni(item.dni) === dni && !(item.observaciones === `Creado desde ficha de adhesión ${ficha.id}.` && group.id === fichaAssignmentContext(ficha).grupoId && item.contratoId === fichaAssignmentContext(ficha).contratoId))
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

      function fichaTutoresAdicionales(dni, pasajeroId = "") {
        const documento = normalizeFichaDni(dni);
        if (!documento) return [];
        // Un mismo tutor puede registrarse más de una vez: se muestra una sola
        // vez, con su registro más reciente (las filas llegan ordenadas así).
        const vistos = new Set();
        return adminFichasTutor.filter((tutor) => {
          if (!pasajeroId || tutor.estado_revision !== "revisada" || tutor.pasajero_id !== pasajeroId || normalizeFichaDni(tutor.pasajero_dni) !== documento) return false;
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
                  ${renderFichaValue("Tutor", fichaNombreCompleto(ficha.responsableApellido, ficha.responsableNombre))}
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
        const resumedPassenger = group.pasajeros.find(passenger => normalizeFichaDni(passenger.dni) === dni && passenger.observaciones === `Creado desde ficha de adhesión ${id}.` && passenger.contratoId === context.contratoId);
        const duplicatedDni = adminPasajerosDemo.some((adminGroup) => (
          adminGroup.pasajeros.some((passenger) => normalizeFichaDni(passenger.dni) === dni)
        ));
        if (duplicatedDni && !resumedPassenger) {
          adminFichasMessage = "Ese DNI ya existe en pasajeros. No se creó un pasajero duplicado.";
          renderAdminFichasRecibidas();
          return;
        }
        const previous = structuredClone(adminPasajerosDemo);
        if (!resumedPassenger) group.pasajeros.push({
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
          observaciones: `Creado desde ficha de adhesión ${id}.`
        });
        if (!resumedPassenger && !await saveAdminPasajerosDemo()) {
          adminPasajerosDemo = adminPasajerosCollection.save(previous);
          adminFichasMessage = `No se aprobó la ficha: ${googleSheetsSyncState.message}`;
          renderAdminFichasRecibidas();
          return;
        }
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
        if (!saved) {
          fichaAdhesionCollection.save(fichas);
          adminFichasMessage = `El pasajero quedó guardado, pero falta confirmar la aprobación de la ficha. Volvé a aprobar para completar el paso sin duplicarlo. ${googleSheetsSyncState.message}`;
          renderAdminFichasRecibidas();
          return;
        }
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

      function renderTutorReviewForm(tutor) {
        if (!adminTutorReviewDrafts.has(tutor.id)) adminTutorReviewDrafts.set(tutor.id, {
          estado_revision:tutor.estado_revision,pasajero_id:tutor.pasajero_id||"",observaciones:tutor.observaciones||"",identidad_verificada:false,version:window.ElAngelAzulPersistence.adminSheetVersion("FICHAS_TUTOR",tutor.id),open:false
        });
        const draft=adminTutorReviewDrafts.get(tutor.id);
        const matches=adminPasajerosDemo.flatMap(group=>(group.pasajeros||[]).filter(passenger=>normalizeFichaDni(passenger.dni)===normalizeFichaDni(tutor.pasajero_dni)).map(passenger=>({group,passenger})));
        const label=({group})=>`${group.viaje} · ${group.colegio} · ${group.curso} ${group.division||""}`;
        const current=matches.find(({passenger,group})=>passengerPaymentKey(passenger,group)===draft.pasajero_id);
        return `<strong>${escapeHtml({pendiente:"Pendiente",revisada:"Verificado y vinculado",observada:"Requiere corrección",rechazada:"Rechazado"}[tutor.estado_revision]||tutor.estado_revision)}</strong><details class="admin-tutor-review-details" ${draft.open?"open":""}><summary>Revisar y vincular al viaje</summary><form class="admin-tutor-review" data-tutor-review="${escapeHtml(tutor.id)}"><fieldset ${adminTutorReviewSaving?"disabled":""}>
          <label>Pasajero y viaje<select name="pasajero_id"><option value="">Elegí el viaje del pasajero</option>${matches.map(entry=>`<option value="${escapeHtml(passengerPaymentKey(entry.passenger,entry.group))}" ${passengerPaymentKey(entry.passenger,entry.group)===draft.pasajero_id?'selected':''}>${escapeHtml(label(entry))}</option>`).join("")}</select></label>
          <p data-tutor-trip-context>${escapeHtml(current?label(current):matches.length?"Se muestran únicamente los viajes del DNI indicado.":"Primero registrá al pasajero en su grupo y viaje.")}</p>
          <label>Estado<select name="estado_revision">${Object.entries({pendiente:"Pendiente",revisada:"Verificado y vinculado",observada:"Requiere corrección",rechazada:"Rechazado"}).map(([value,text])=>`<option value="${value}" ${draft.estado_revision===value?'selected':''}>${text}</option>`).join("")}</select></label>
          <label class="admin-tutor-check"><input type="checkbox" name="identidad_verificada" ${draft.identidad_verificada?'checked':''}>Verifiqué la identidad y autorización de esta persona como responsable del viaje elegido.</label>
          <label>Observaciones<textarea name="observaciones" rows="2" maxlength="1000">${escapeHtml(draft.observaciones)}</textarea></label>
          <div class="admin-actions-row"><button type="submit">Guardar revisión del tutor</button><button type="button" data-tutor-discard="${escapeHtml(tutor.id)}">Descartar cambios</button><button type="button" data-tutor-refresh>Volver a consultar tutores</button></div>
          <p role="${draft.error?"alert":"status"}" data-tutor-review-message>${escapeHtml(draft.error||"")}</p>
        </fieldset></form></details>`;
      }

      // Solicitudes del formulario de Tutor: se verifican y vinculan a un
      // pasajero/viaje concreto antes de aparecer como responsables.
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
            <table class="admin-pasajeros-table admin-fichas-table admin-tutor-table">
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Pasajero a cargo</th>
                  <th>Contacto</th>
                  <th>Verificación y viaje</th>
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
${renderTutorReviewForm(tutor)}
                    </td>
                  </tr>
                `).join("") : `<tr><td colspan="4">No hay fichas de tutor.</td></tr>`}
              </tbody>
            </table>
          </div>
        `;
      }

      function parseAdminMoney(value) {
        return window.ElAngelAzulPayments.parseMoney(value);
      }

      function formatAdminMoney(value, missing = "Sin definir") {
        if (value === null || value === undefined || value === "") return missing;
        return parseAdminMoney(value).toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      function passengerPaymentKey(passenger, group) {
        return adminPagoPassengerIds.get(`${group?.id}|${passenger.dni}`) || passenger.id || `pasajero-${passenger.dni || sheetMigrationSlug(passenger.nombre || "sin-dni")}-${group?.id || ""}`;
      }

      function passengerPaymentData(passenger) {
        const group = adminPasajerosDemo.find((item) => item.pasajeros.includes(passenger));
        const key = passengerPaymentKey(passenger, group);
        const payment = window.ElAngelAzulPayments.paymentData({ ...passenger, cuenta: adminCuentas.get(key), cobros: adminPagos.filter((pago) => pago.pasajero_legacy_id === key) });
        return adminPagosLoaded ? { ...payment, cuentaConsultada: adminCuentasLoaded } : { ...payment, cuentaConsultada: false, pagado: null, saldo: null, registros: 0 };
      }

      function passengerInstallments(passenger) {
        const group = adminPasajerosDemo.find(item => item.pasajeros.includes(passenger));
        return window.ElAngelAzulPayments.installments({ ...passenger, cuenta: adminCuentas.get(passengerPaymentKey(passenger, group)) });
      }

      function installmentSummary(passenger) {
        const rows = passengerInstallments(passenger);
        return rows.length ? `${rows.filter(row => row.status === "Pagada").length}/${rows.length} pagadas` : "Cronograma pendiente";
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
          ${cells || '<span class="admin-installment-pill is-neutral">Cronograma pendiente</span>'}
          ${hiddenCount > 0 ? `<span class="admin-installment-pill is-neutral">+${hiddenCount} cuotas en detalle</span>` : ""}
        `;
      }

      function passengerPaymentHistory(passenger) {
        const group = adminPasajerosDemo.find((item) => item.pasajeros.includes(passenger));
        return window.ElAngelAzulPayments.paymentHistory({ ...passenger, cobros: adminPagos.filter((pago) => pago.pasajero_legacy_id === passengerPaymentKey(passenger, group)) });
      }

      function renderPaymentHistoryCells(passenger) {
        const history = passengerPaymentHistory(passenger);
        if (!history.length) return '<span>Sin pagos registrados</span>';
        return history.map((item) => `
          <div class="admin-payment-history-item">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.concept)} · ${escapeHtml(formatAdminMoney(item.amount))}</strong>
            <small>${escapeHtml(item.method)} · ${escapeHtml(item.status)}</small>
          </div>
        `).join("");
      }

      function adminStatusClass(value) {
        const normalized = String(value || "").toLowerCase();
        if (normalized.includes("inactivo") || normalized.includes("inactiva") || normalized.includes("anulado")) return "is-neutral";
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

      // Exporta las filas filtradas en pantalla. Los datos de domicilio y tutor
      // salen de la ficha con el mismo DNI (si no hay ficha, quedan vacíos).
      const ADMIN_PASAJEROS_EXPORT_COLUMNS = [
        "Colegio", "Curso", "Grado/Año", "División", "Contrato", "Plan", "Cuotas", "Apellido", "Nombre", "DNI",
        "Nacimiento", "Sexo", "Tutor apellido", "Tutor nombre", "Parentesco", "Tutor DNI", "CUIL/CUIT", "Celular",
        "Email", "Calle y número", "Barrio", "Localidad", "Provincia", "CP", "Estado", "Documentación",
        "Ficha médica", "Estado de pago"
      ];

      function adminPasajerosExportRows(rows) {
        const fichas = loadFichasAdhesionDemo();
        const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
        const sorted = [...rows].sort((a, b) => (
          collator.compare(a.group.colegio, b.group.colegio)
          || collator.compare(a.group.curso, b.group.curso)
          || collator.compare(a.group.division, b.group.division)
          || collator.compare(a.passenger.apellido || "", b.passenger.apellido || "")
        ));
        return sorted.map(({ group, passenger: p, payment }) => {
          const f = fichas.find((item) => item.tipo !== "tutor" && normalizeFichaDni(item.pasajeroNumeroDocumento) === normalizeFichaDni(p.dni) && normalizeFichaSearchText(item.viaje) === normalizeFichaSearchText(group.viaje)) || {};
          return {
            "Colegio": group.colegio, "Curso": group.nivel, "Grado/Año": group.curso, "División": group.division,
            "Contrato": p.codigoContrato || "", "Plan": payment.planPago || p.planNombre || "", "Cuotas": payment.cuotas ?? p.planCuotas ?? "",
            "Apellido": p.apellido || "", "Nombre": p.nombre || "", "DNI": p.dni || "",
            "Nacimiento": p.nacimiento || f.pasajeroNacimiento || "", "Sexo": f.pasajeroSexo || "",
            "Tutor apellido": p.responsableApellido || f.responsableApellido || "",
            "Tutor nombre": p.responsable || f.responsableNombre || "",
            "Parentesco": p.vinculo || f.responsableParentesco || "",
            "Tutor DNI": p.responsableDni || f.responsableNumeroDocumento || "",
            "CUIL/CUIT": p.responsableCuilCuit || f.responsableCuilCuit || "",
            "Celular": f.responsableCelular || p.responsableTelefono || p.telefono || "",
            "Email": p.responsableEmail || f.responsableEmail || "",
            "Calle y número": [f.domicilioCalle, f.domicilioNumero].filter(Boolean).join(" "),
            "Barrio": f.domicilioBarrio || "", "Localidad": f.domicilioLocalidad || "",
            "Provincia": f.domicilioProvincia || "", "CP": f.domicilioCodigoPostal || "",
            "Estado": p.estado || "", "Documentación": p.documentacion || "", "Ficha médica": p.fichaMedica || "",
            "Estado de pago": payment.estadoPago || ""
          };
        });
      }

      function adminExportReady() {
        if (typeof XLSX !== "undefined") return true;
        let notice = document.querySelector("[data-export-error]");
        if (!notice) {
          notice = document.createElement("p");
          notice.dataset.exportError = "";
          notice.className = "admin-form-error";
          notice.setAttribute("role", "alert");
          document.querySelector(".admin-main")?.prepend(notice);
        }
        notice.textContent = "No se pudo cargar la herramienta de Excel. Revisá tu conexión y recargá la página para volver a exportar.";
        return false;
      }

      function exportAdminPasajerosXlsx() {
        if (!adminExportReady()) return;
        const rows = adminPasajerosExportRows(adminPasajerosFilteredRows());
        const sheet = XLSX.utils.json_to_sheet(rows, { header: ADMIN_PASAJEROS_EXPORT_COLUMNS });
        sheet["!cols"] = autoFitColumnWidths(rows, ADMIN_PASAJEROS_EXPORT_COLUMNS);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, "Pasajeros");
        // Fecha local: toISOString() es UTC y de noche en Argentina (UTC-3) ya marca el día siguiente.
        XLSX.writeFile(workbook, `EAA_pasajeros_${new Date().toLocaleDateString("sv-SE")}.xlsx`);
      }

      function adminPasajerosSelectedRecord() {
        const rows=adminPasajerosRows();
        if(adminPasajerosSelectedKey)return rows.find(({passenger,group})=>passengerPaymentKey(passenger,group)===adminPasajerosSelectedKey)||null;
        const matches=rows.filter(({passenger})=>String(passenger.dni)===String(adminPasajerosSelectedDni));
        return matches.length===1?matches[0]:null;
      }

      function renderAdminPasajerosTableRows(rows) {
        return rows.length ? rows.map(({ group, passenger, payment }) => {
          const isSelected = passengerPaymentKey(passenger,group) === adminPasajerosSelectedKey;
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
              <td>${escapeHtml(fichaPlanTexto(payment.planPago, payment.cuotas) || "Pendiente")}</td>
              <td><span class="admin-pasajeros-status ${adminStatusClass(payment.estadoPago)}">${escapeHtml(payment.estadoPago)}</span></td>
              <td><span class="admin-pasajeros-status ${adminStatusClass(passenger.documentacion)}">${escapeHtml(passenger.documentacion)}</span></td>
              <td><span class="admin-pasajeros-status ${adminStatusClass(passenger.estado)}">${escapeHtml(passenger.estado)}</span></td>
              <td>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-open-profile="${escapeHtml(passenger.dni || "")}" data-admin-pasajeros-record="${escapeHtml(passengerPaymentKey(passenger,group))}">
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
            adminPasajerosSelectedKey = button.dataset.adminPasajerosRecord || "";
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
        const account = adminCuentas.get(passengerPaymentKey(passenger, group));
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
                  <p>${escapeHtml(adminPasajeroNombreCompleto(passenger))} · DNI ${escapeHtml(passenger.dni || "Pendiente")}</p>
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
                    ${account ? `<input readonly aria-label="Contrato confirmado" value="${escapeHtml(passengerCodigoContrato(passenger))}"><input type="hidden" name="contratoId" value="${escapeHtml(passenger.contratoId)}">` : `<select name="contratoId" required>
                      <option value="">Seleccionar contrato</option>
                      ${contractOptions.map((c) => `<option value="${escapeHtml(c.id)}" ${c.id === passenger.contratoId ? "selected" : ""}>${escapeHtml(c.codigo_contrato)}</option>`).join("")}
                    </select>`}
                    ${account ? '<small>El contrato y el plan se conservan para mantener el historial de la cuenta confirmada.</small>' : ""}
                  </label>
                  ${contractOptions.length === 0 ? `<p class="admin-pasajeros-modal-note">No hay contratos disponibles para este grupo. Creá uno primero en la sección Contratos.</p>` : ""}
                  <label>Plan de pago
                    ${account ? `<input readonly aria-label="Plan confirmado" value="${escapeHtml(fichaPlanTexto(payment.planPago, payment.cuotas))}"><input type="hidden" name="planPagoId" value="${escapeHtml(passenger.planPagoId)}">` : `<select name="planPagoId">
                      <option value="">Pendiente</option>
                      ${adminPlanesPago.filter((plan) => plan.contrato_id === passenger.contratoId && (plan.activo === "TRUE" || plan.id === passenger.planPagoId)).map((plan) => `<option value="${escapeHtml(plan.id)}" ${plan.id === passenger.planPagoId ? "selected" : ""}>${escapeHtml(fichaPlanTexto(plan.nombre, plan.cuotas))}</option>`).join("")}
                    </select>`}
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
                    ${account ? `<input readonly aria-label="Estado calculado de la cuenta" value="${escapeHtml(payment.estadoPago)}"><input type="hidden" name="pago" value="${escapeHtml(passenger.pago || "Pendiente")}"><small>Se calcula con el saldo y los cobros registrados.</small>` : `<select name="pago">
                      ${["Pendiente", "Al día", "Vencido"].map((opt) => `<option ${passenger.pago === opt ? "selected" : ""}>${opt}</option>`).join("")}
                    </select>`}
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
                <p>${escapeHtml(adminPasajeroNombreCompleto(passenger))} · DNI ${escapeHtml(passenger.dni || "Pendiente")}</p>
              </div>
              <div class="admin-pasajeros-profile-actions">
                <button type="button" class="admin-pasajeros-primary-button" data-admin-pasajeros-open-edit>Editar ficha</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-payment-for="${escapeHtml(passengerPaymentKey(passenger, group))}">Registrar pago</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-close-profile>Cerrar ficha</button>
              </div>
            </div>

            <div class="admin-pasajeros-profile-hero">
              <div>
                <span>Pasajero</span>
                <strong>${escapeHtml(adminPasajeroNombreCompleto(passenger))}</strong>
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
                ${renderFichaValue("Plan", fichaPlanTexto(payment.planPago, payment.cuotas))}
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
                ${fichaTutoresAdicionales(passenger.dni, passengerPaymentKey(passenger, group)).length ? `<dl>${fichaTutoresAdicionales(passenger.dni, passengerPaymentKey(passenger, group)).map((tutor) => `
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
                  <div><dt>Total</dt><dd>${escapeHtml(formatAdminMoney(payment.valorViaje, payment.cuentaConsultada ? "Sin definir" : "Sin consultar"))}</dd></div>
                  <div><dt>Pagado</dt><dd>${escapeHtml(formatAdminMoney(payment.pagado))}</dd></div>
                  <div><dt>Saldo</dt><dd>${escapeHtml(formatAdminMoney(payment.saldo, payment.cuentaConsultada ? "Sin definir" : "Sin consultar"))}</dd></div>
                  <div><dt>Cuotas</dt><dd>${escapeHtml(installmentSummary(passenger))}</dd></div>
                  <div><dt>Estado cuotas</dt><dd>${passengerInstallments(passenger).length ? `${paidInstallments} pagas · ${pendingInstallments} pendientes` : "Cronograma pendiente"}</dd></div>
                </dl>
              </article>
              <article class="admin-payment-wide">
                <h3>Historial de cobros</h3>
                ${adminPagosLoaded ? renderPaymentHistoryCells(passenger) : '<p>No se pudieron consultar los pagos. Entrá en Pagos para volver a intentar.</p>'}
              </article>
              <article class="admin-payment-wide" data-admin-documents data-document-type="pasajeros" data-document-owner="${escapeHtml(passengerPaymentKey(passenger, group))}"></article>
              ${adminCanDelete() ? `<article class="admin-payment-wide portal-admin-access" data-portal-access-admin data-passenger-id="${escapeHtml(passengerPaymentKey(passenger, group))}"></article>` : ""}
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
                <legend>Grupo</legend>
                <label>Grupo (colegio · curso · viaje) <span class="admin-pasajeros-required">*</span>
                  <select name="grupoId" data-admin-pasajeros-form-grupo required>
                    ${adminPasajerosDemo.map((group) => `<option value="${escapeHtml(group.id)}" ${group.id === selectedGroup?.id ? "selected" : ""}>${escapeHtml(`${group.colegio} · ${group.curso} ${group.division} · ${group.viaje} · ${group.nivel}`)}</option>`).join("")}
                  </select>
                </label>
              </fieldset>

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
              <div class="admin-filter-actions">
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-clear-filters>Limpiar</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-admin-pasajeros-export>Exportar a Excel</button>
              </div>
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
              <section class="admin-document-section" data-admin-documents data-document-type="contratos" data-document-owner="${escapeHtml(contract.id)}"></section>
              <section class="enrollment-admin" data-enrollment-admin data-contract-id="${escapeHtml(contract.id)}"></section>
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

      async function submitAdminContratoEdit(form) {
        if (form.dataset.saving) return;
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
          restoreAdminForm(renderAdminContratos, "[data-admin-contrato-edit-form]", formData);
          return;
        }
        const duplicatedCodigo = adminContratosDemo.some((contract, idx) => idx !== index && contract.codigo_contrato === codigo);
        if (duplicatedCodigo) {
          adminContratosEditError = "Ya existe otro contrato con ese código. El código de contrato debe ser único.";
          restoreAdminForm(renderAdminContratos, "[data-admin-contrato-edit-form]", formData);
          return;
        }
        const now = new Date().toISOString();
        lockAdminForm(form);
        adminContratosDemo[index] = {
          ...current,
          codigo_contrato: codigo,
          estado,
          observaciones,
          updated_at: now
        };
        const saved = await saveAdminContratosDemo();
        if (!saved) {
          adminContratosDemo[index] = current;
          contratosCollection.save(adminContratosDemo);
          adminContratosEditError = googleSheetsSyncState.message;
          if (currentPath() === "/admin/contratos") restoreAdminForm(renderAdminContratos, "[data-admin-contrato-edit-form]", formData);
          return;
        }
        adminContratosEditId = "";
        adminContratosEditError = "";
        if (currentPath() === "/admin/contratos") renderAdminContratos();
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
        const enrollmentRoot = document.querySelector("[data-enrollment-admin]");
        window.ElAngelAzulEnrollment?.mountAdmin(enrollmentRoot, enrollmentRoot?.dataset.contractId);
        document.querySelectorAll("[data-admin-documents]").forEach(root => window.ElAngelAzulDocuments?.mount(root, {type:root.dataset.documentType,id:root.dataset.documentOwner}));
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
            const previous = adminPlanesPago;
            button.disabled = true;
            adminPlanesPago = adminPlanesPago.map((plan) => (plan.id === id ? { ...plan, activo: plan.activo === "TRUE" ? "FALSE" : "TRUE" } : plan));
            const guardado = await queueGoogleSheetsWrite(["PLANES_PAGO"]);
            if (!guardado) { adminPlanesPago = previous; adminContratosEditError = googleSheetsSyncState.message; }
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
        const organization = document.createElement("section");
        organization.className = "admin-turismo-panel academic-admin";
        organization.dataset.academicAdmin = "";
        document.querySelector("[data-admin-grupos-filters]")?.closest("section").before(organization);
        window.ElAngelAzulAcademic?.mount(organization);
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
        document.querySelector("[data-admin-grupos-create-form]")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (event.currentTarget.dataset.saving) return;
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
            restoreAdminForm(renderAdminGrupos, "[data-admin-grupos-create-form]", formData);
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
            restoreAdminForm(renderAdminGrupos, "[data-admin-grupos-create-form]", formData);
            return;
          }
          const group = normalizeAdminPasajerosGroup({
            ...payload,
            estado: "Activo",
            pasajeros: []
          });
          const previous = structuredClone(adminPasajerosDemo);
          lockAdminForm(event.currentTarget);
          adminPasajerosDemo.push(group);
          adminPasajerosNivel = group.nivel;
          adminPasajerosViaje = group.viaje;
          adminPasajerosColegio = group.colegio;
          adminPasajerosGrupoId = group.id;
          adminGruposFilterNivel = "";
          adminGruposFilterViaje = "";
          adminGruposFilterColegio = "";
          adminGruposSearch = "";
          const saved = await saveAdminGruposDemo();
          if (!saved) {
            adminPasajerosDemo = adminPasajerosCollection.save(previous);
            adminGruposCreateError = googleSheetsSyncState.message;
            restoreAdminForm(renderAdminGrupos, "[data-admin-grupos-create-form]", formData);
            return;
          }
          adminGruposShowCreateForm = false;
          adminGruposCreateError = "";
          if (currentPath() === "/admin/grupos") renderAdminGrupos();
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

      function restoreAdminForm(renderPage, selector, formData) {
        renderPage();
        const form = document.querySelector(selector);
        for (const [name, value] of formData) {
          const control = form?.elements.namedItem(name);
          if (control && control.type !== "file") control.value = value;
        }
      }

      function lockAdminForm(form) {
        if (form.dataset.saving) return false;
        form.dataset.saving = "true";
        form.querySelectorAll("button,input,select,textarea").forEach(control => control.disabled = true);
        return true;
      }

      function bindAdminPasajeros() {
        document.querySelectorAll("[data-admin-documents]").forEach(root => window.ElAngelAzulDocuments?.mount(root, {type:root.dataset.documentType,id:root.dataset.documentOwner}));
        document.querySelectorAll("[data-portal-access-admin]").forEach(root => window.ElAngelAzulPortalAdmin?.mount(root, root.dataset.passengerId));
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
        document.querySelector("[data-admin-pasajeros-form]")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (event.currentTarget.dataset.saving) return;
          if (!event.currentTarget.reportValidity()) return;
          const formData = new FormData(event.currentTarget);
          const selectedGroup = adminPasajerosDemo.find((group) => group.id === String(formData.get("grupoId") || ""));
          if (!selectedGroup) {
            adminPasajerosFormError = "Elegí un grupo.";
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }
          adminPasajerosNivel = selectedGroup.nivel;
          adminPasajerosViaje = selectedGroup.viaje;
          adminPasajerosColegio = selectedGroup.colegio;
          adminPasajerosGrupoId = selectedGroup.id;
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
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }
          if (!passenger.dni) {
            adminPasajerosFormError = "El DNI del pasajero es obligatorio.";
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }
          if (!passenger.contratoId) {
            adminPasajerosFormError = "Antes de crear el pasajero, asigná un contrato válido.";
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }
          if (!passenger.responsable) {
            adminPasajerosFormError = "El responsable es obligatorio.";
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }
          if (!passenger.responsableTelefono) {
            adminPasajerosFormError = "El teléfono del responsable es obligatorio.";
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }
          const duplicatedDni = adminPasajerosDemo.some((group) => (
            group.pasajeros.some((item) => normalizeFichaDni(item.dni) === normalizeFichaDni(passenger.dni))
          ));
          if (duplicatedDni) {
            adminPasajerosFormError = "Ya existe un pasajero con ese DNI (revisá otros colegios/viajes, el DNI es único en toda la base).";
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }

          const previous = structuredClone(adminPasajerosDemo);
          lockAdminForm(event.currentTarget);
          selectedGroup.pasajeros.push(passenger);
          if (!await saveAdminPasajerosDemo()) {
            adminPasajerosDemo = adminPasajerosCollection.save(previous);
            adminPasajerosFormError = googleSheetsSyncState.message;
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-form]", formData);
            return;
          }
          adminPasajerosShowForm = false;
          adminPasajerosFormError = "";
          renderAdminPasajeros();
        });
        document.querySelector("[data-admin-pasajeros-form-grupo]")?.addEventListener("change", (event) => {
          const group = adminPasajerosDemo.find((item) => item.id === event.currentTarget.value);
          if (!group) return;
          const typed = [...new FormData(event.currentTarget.form)].filter(([name]) => name !== "grupoId" && name !== "contratoId");
          adminPasajerosNivel = group.nivel;
          adminPasajerosViaje = group.viaje;
          adminPasajerosColegio = group.colegio;
          adminPasajerosGrupoId = group.id;
          adminPasajerosFormError = "";
          renderAdminPasajeros();
          const form = document.querySelector("[data-admin-pasajeros-form]");
          typed.forEach(([name, value]) => { if (form?.elements[name]) form.elements[name].value = value; });
          form?.elements.grupoId?.focus();
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
        document.querySelector("[data-admin-pasajeros-group-form]")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (event.currentTarget.dataset.saving) return;
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
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-group-form]", formData);
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
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-group-form]", formData);
            return;
          }
          lockAdminForm(event.currentTarget);
          if (await createAdminPasajerosGroup(payload)) {
            adminPasajerosGroupModal = null;
            renderAdminPasajeros();
          } else {
            adminPasajerosGroupModal = { ...adminPasajerosGroupModal, error: googleSheetsSyncState.message };
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-group-form]", formData);
          }
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
        document.querySelector("[data-admin-pasajeros-export]")?.addEventListener("click", exportAdminPasajerosXlsx);
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
          adminPasajerosSelectedKey = "";
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
        document.querySelector("[data-admin-pasajeros-edit-form]")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (event.currentTarget.dataset.saving) return;
          const record = adminPasajerosSelectedRecord();
          if (!record) return;
          const { group, passenger } = record;
          if (!event.currentTarget.reportValidity()) return;
          const formData = new FormData(event.currentTarget);
          const nombre = String(formData.get("nombre") || "").trim();
          const dni = String(formData.get("dni") || "").trim();
          const responsable = String(formData.get("responsable") || "").trim();
          const responsableTelefono = String(formData.get("responsableTelefono") || "").trim();
          const contratoId = String(formData.get("contratoId") || "").trim();
          if (!nombre) { adminPasajerosEditError = "El nombre del pasajero es obligatorio."; restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-edit-form]", formData); return; }
          if (!dni) { adminPasajerosEditError = "El DNI es obligatorio."; restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-edit-form]", formData); return; }
          if (!responsable) { adminPasajerosEditError = "El nombre del responsable es obligatorio."; restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-edit-form]", formData); return; }
          if (!responsableTelefono) { adminPasajerosEditError = "El teléfono del responsable es obligatorio."; restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-edit-form]", formData); return; }
          if (!contratoId) { adminPasajerosEditError = "Seleccioná un contrato antes de guardar."; restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-edit-form]", formData); return; }
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
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-edit-form]", formData);
            return;
          }
          const planElegido = adminPlanesPago.find((plan) => plan.id === String(formData.get("planPagoId") || ""));
          const previous = structuredClone(adminPasajerosDemo);
          lockAdminForm(event.currentTarget);
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
          if (!await saveAdminPasajerosDemo()) {
            adminPasajerosDemo = adminPasajerosCollection.save(previous);
            adminPasajerosEditError = googleSheetsSyncState.message;
            restoreAdminForm(renderAdminPasajeros, "[data-admin-pasajeros-edit-form]", formData);
            return;
          }
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
        document.querySelectorAll("[data-tutor-review]").forEach(form=>{
          const id=form.dataset.tutorReview,draft=adminTutorReviewDrafts.get(id);
          const details=form.closest("details");details.ontoggle=()=>{draft.open=details.open;};
          const read=()=>{draft.error="";form.querySelector("[data-tutor-review-message]").textContent="";draft.estado_revision=form.elements.estado_revision.value;draft.pasajero_id=form.elements.pasajero_id.value;draft.observaciones=form.elements.observaciones.value;draft.identidad_verificada=form.elements.identidad_verificada.checked;};
          form.oninput=read;
          form.onchange=event=>{
            if(["pasajero_id","estado_revision"].includes(event.target.name)){form.elements.identidad_verificada.checked=false;const option=form.elements.pasajero_id.selectedOptions[0];form.querySelector("[data-tutor-trip-context]").textContent=option?.value?option.textContent:"Elegí el viaje al que corresponde la autorización.";}
            read();
          };
          form.onsubmit=async event=>{
            event.preventDefault();if(adminTutorReviewSaving)return;read();
            const tutor=adminFichasTutor.find(row=>row.id===id),message=form.querySelector("[data-tutor-review-message]");
            if(draft.estado_revision==="revisada"&&(!draft.pasajero_id||((tutor.estado_revision!=="revisada"||tutor.pasajero_id!==draft.pasajero_id)&&!draft.identidad_verificada))){message.textContent="Elegí el viaje y confirmá la verificación de identidad y autorización antes de vincular al tutor.";message.setAttribute("role","alert");return;}
            const previous=adminFichasTutor;
            adminTutorReviewSaving=true;
            document.querySelectorAll("[data-tutor-review] fieldset").forEach(node=>node.disabled=true);
            adminFichasTutor=adminFichasTutor.map(row=>row.id===id?{...row,estado_revision:draft.estado_revision,pasajero_id:draft.pasajero_id,observaciones:draft.observaciones,identidad_verificada:draft.identidad_verificada?"TRUE":""}:row);
            const saved=await queueGoogleSheetsWrite(["FICHAS_TUTOR"],{},{FICHAS_TUTOR:{[id]:draft.version}});
            adminTutorReviewSaving=false;
            if(!saved){adminFichasTutor=previous;draft.error=googleSheetsSyncState.message;}else adminTutorReviewDrafts.delete(id);
            adminFichasMessage=saved?"Revisión del tutor guardada. El vínculo corresponde únicamente al viaje elegido.":googleSheetsSyncState.message;
            if(currentPath().startsWith("/admin/fichas"))renderAdminFichasRecibidas();
          };
          form.querySelector("[data-tutor-refresh]").onclick=async()=>{
            if(adminTutorReviewSaving)return;adminTutorReviewSaving=true;form.querySelector("fieldset").disabled=true;
            try{const source=await window.ElAngelAzulPersistence.fetchGoogleSheetRows("FICHAS_TUTOR");adminFichasTutor=source;window.ElAngelAzulPersistence.captureAdminSheet("FICHAS_TUTOR",source,source);adminFichasMessage="Solicitudes consultadas. Conservamos tus borradores; descartá los cambios para adoptar la versión actual.";}
            catch(error){adminFichasMessage="No pudimos consultar los tutores. Conservamos tus cambios.";if(error.status===401)handleAdminSessionLost();}
            finally{adminTutorReviewSaving=false;if(currentPath().startsWith("/admin/fichas"))renderAdminFichasRecibidas();}
          };
        });
        document.querySelectorAll("[data-tutor-discard]").forEach(button=>button.onclick=()=>{adminTutorReviewDrafts.delete(button.dataset.tutorDiscard);renderAdminFichasRecibidas();});
        document.querySelectorAll("[data-ficha-aprobar]").forEach((button) => {
          button.addEventListener("click", async () => {
            button.disabled = true;
            await approveFichaAdhesionAndCreatePassenger(button.dataset.fichaAprobar);
          });
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

      let adminPagos = [];
      let adminCuentas = new Map();
      let adminCuentasLoaded = false;
      let adminPagoPassengerIds = new Map();
      let adminPagosError = "";
      let adminPagosLoaded = false;
      let adminPagoDraft = null;
      let adminPagoSaving = false;
      let adminPagoMessage = "";
      let adminPagoError = "";
      let adminPagoAnnulError = "";
      let adminPagoSearch = "";
      let adminPagoAnularId = "";
      let adminPagoMotivo = "";
      const adminPagoMedios = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta", otro: "Otro" };

      function newAdminPagoDraft() {
        const today = new Date();
        return { id: crypto.randomUUID(), pasajeroId: "", fecha: new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10), monto: "", medio: "", concepto: "", referencia: "" };
      }

      async function loadAdminCuentas() {
        try {
          const response = await fetch("/api/admin/finanzas/cuentas", { credentials: "same-origin", cache: "no-store" });
          const payload = await response.json();
          if (!response.ok || !payload.ok || !Array.isArray(payload.cuentas)) throw new Error("No se pudieron consultar las cuentas.");
          adminCuentas = new Map(payload.cuentas.flatMap(account => [[account.legacy_id, account], [account.pasajero_id, account]]));
          adminCuentasLoaded = true;
        } catch (_) { adminCuentas.clear(); adminCuentasLoaded = false; }
      }
      window.addEventListener("eaa-cuentas-cambiadas", async () => {
        await loadAdminCuentas();
        if (currentPath() === "/admin/pasajeros" && !adminPasajerosEditMode && !adminPasajerosShowForm && !adminPasajerosGroupModal) renderAdminPasajeros();
      });

      async function loadAdminPagos() {
        try {
          const [response, passengers] = await Promise.all([
            fetch("/api/admin/pagos", { credentials: "same-origin", cache: "no-store" }),
            window.ElAngelAzulPersistence.fetchGoogleSheetRows("PASAJEROS"),
            loadAdminCuentas()
          ]);
          const payload = await response.json();
          if (response.status === 401) handleAdminSessionLost();
          if (!response.ok || !payload.ok || !Array.isArray(payload.pagos)) throw new Error(payload.error || "No se pudo consultar el registro de pagos.");
          const selected = adminPagoDraft?.pasajeroId ? adminPasajerosRows().find(({passenger,group}) => passengerPaymentKey(passenger,group) === adminPagoDraft.pasajeroId) : null;
          adminPagoPassengerIds = new Map(passengers.map(passenger => [`${passenger.grupo_id}|${passenger.dni}`, passenger.id]));
          if (selected) adminPagoDraft.pasajeroId = passengerPaymentKey(selected.passenger, selected.group);
          adminPagos = payload.pagos;
          adminPagosError = "";
          adminPagosLoaded = true;
          return true;
        } catch (error) {
          adminPagosError = error.message || "No se pudo consultar el registro de pagos. Intentá nuevamente.";
          adminPagosLoaded = false;
          return false;
        }
      }

      async function sendAdminPago(url, data) {
        const response = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const payload = await response.json();
        if (response.status === 401) handleAdminSessionLost();
        if (!response.ok || !payload.ok || !payload.pago) throw new Error(payload.error || "No se pudo guardar el pago. Revisá el historial antes de volver a intentar.");
        adminPagos = [payload.pago, ...adminPagos.filter((pago) => pago.id !== payload.pago.id)];
        await loadAdminCuentas();
        return payload;
      }

      function renderAdminPagos() {
        adminPagoDraft ||= newAdminPagoDraft();
        const draft = adminPagoDraft;
        const passengers = adminPasajerosRows();
        const confirmed = adminPagos.filter((pago) => pago.estado === "confirmado");
        const total = confirmed.reduce((sum, pago) => sum + Number(pago.monto_centavos), 0) / 100;
        const filtered = adminPagos.filter((pago) => normalizeFichaSearchText([pago.pasajero_nombre, pago.pasajero_apellido, pago.pasajero_dni, pago.concepto, pago.referencia].join(" ")).includes(normalizeFichaSearchText(adminPagoSearch)));
        const annul = adminPagos.find((pago) => pago.id === adminPagoAnularId);
        const field = (name, label, attributes = "") => `<label>${label}<input name="${name}" value="${escapeHtml(draft[name])}" ${attributes}></label>`;
        document.getElementById("app").innerHTML = renderAdminShell("pagos", `
          <section class="admin-turismo-panel">
            <h1>Pagos</h1>
            <p>Registrá los cobros manuales en pesos argentinos. Cada movimiento conserva su fecha, medio y usuario responsable.</p>
            ${adminPagosLoaded ? `<div class="admin-payment-dashboard">
              <article><strong>${escapeHtml(formatAdminMoney(total))}</strong><span>Total cobrado confirmado</span></article>
              <article><strong>${confirmed.length}</strong><span>Pagos confirmados</span></article>
              <article><strong>${new Set(confirmed.map((pago) => pago.pasajero_legacy_id)).size}</strong><span>Pasajeros con cobros</span></article>
              <article><strong>${adminPagos.length - confirmed.length}</strong><span>Pagos anulados</span></article>
            </div>` : ""}
            <p>Consultá saldos y vencimientos en «Planes, cuotas y saldos». Los cobros se asignan a cuotas de forma manual.</p>
            ${adminPagosError ? `<p role="alert" class="admin-form-error">${escapeHtml(adminPagosError)}</p><button class="admin-pasajeros-secondary" data-payment-retry>Volver a consultar pagos</button>` : ""}
            ${adminPagoMessage ? `<p role="status" class="admin-payment-feedback">${escapeHtml(adminPagoMessage)}</p>` : ""}
          </section>
          ${adminPagosLoaded ? `<section class="admin-turismo-panel">
            <h2>Registrar pago</h2>
            ${passengers.length ? `<form data-payment-form class="admin-pasajeros-form">
              <fieldset class="admin-payment-fields" ${adminPagoSaving ? "disabled" : ""}>
                <label class="admin-payment-wide">Pasajero<select name="pasajeroId" required><option value="">Elegí un pasajero</option>${passengers.map(({passenger,group}) => `<option value="${escapeHtml(passengerPaymentKey(passenger,group))}" ${draft.pasajeroId === passengerPaymentKey(passenger,group) ? "selected" : ""}>${escapeHtml(adminPasajeroNombreCompleto(passenger))} · DNI ${escapeHtml(passenger.dni)} · ${escapeHtml(group.colegio)} · ${escapeHtml(group.curso)} ${escapeHtml(group.division)}</option>`).join("")}</select></label>
                ${field("fecha", "Fecha del cobro", 'type="date" required')}
                ${field("monto", "Importe (ARS)", 'type="text" inputmode="decimal" placeholder="Ej.: 12.500,50" required')}
                <label>Medio de pago<select name="medio" required><option value="">Elegí un medio</option>${Object.entries(adminPagoMedios).map(([key,label])=>`<option value="${key}" ${draft.medio === key ? "selected" : ""}>${label}</option>`).join("")}</select></label>
                ${field("concepto", "Concepto", 'required maxlength="200" placeholder="Ej.: Cuota de marzo"')}
                ${field("referencia", "Referencia o comprobante (opcional)", 'maxlength="120"')}
                <div class="admin-payment-wide"><button class="admin-pasajeros-primary" type="submit">${adminPagoSaving ? "Guardando…" : "Guardar pago"}</button></div>
              </fieldset>
              <p data-payment-error class="admin-form-error" role="alert">${escapeHtml(adminPagoError)}</p>
            </form>` : `<p>Primero cargá o aprobá un pasajero para registrar sus pagos.</p><a href="${adminRouteHref('/admin/pasajeros')}">Ir a Pasajeros</a>`}
          </section>
          <section class="admin-turismo-panel admin-accounts" data-student-accounts></section>
          <section class="admin-turismo-panel admin-pasajeros-table-panel">
            <div class="admin-pasajeros-table-head"><h2>Historial de cobros</h2><button type="button" class="admin-pasajeros-secondary" data-payment-refresh ${adminPagoSaving ? "disabled" : ""}>Actualizar historial</button></div>
            <form data-payment-search-form class="admin-payment-search"><label>Buscar por pasajero, DNI, concepto o referencia<input type="search" name="buscar" value="${escapeHtml(adminPagoSearch)}"></label><button type="submit" class="admin-pasajeros-secondary">Buscar</button></form>
            <p>${filtered.length} movimientos${adminPagoSearch ? " encontrados" : " registrados"}. Los anulados se conservan para poder revisar el historial.</p>
            ${annul ? `<form data-payment-annul-form class="admin-payment-annul"><h3>Anular pago de ${escapeHtml(annul.pasajero_nombre)} ${escapeHtml(annul.pasajero_apellido)}</h3><p>${escapeHtml(formatAdminMoney(Number(annul.monto_centavos) / 100))} · ${escapeHtml(annul.concepto)}. Esta acción excluye el importe del total cobrado.</p><label>Motivo de anulación<textarea name="motivo" required minlength="3" maxlength="500" ${adminPagoSaving ? "disabled" : ""}>${escapeHtml(adminPagoMotivo)}</textarea></label><div class="admin-payment-actions"><button type="submit" class="admin-pasajeros-primary" ${adminPagoSaving ? "disabled" : ""}>${adminPagoSaving ? "Guardando…" : "Confirmar anulación"}</button><button type="button" class="admin-pasajeros-secondary" data-payment-annul-cancel ${adminPagoSaving ? "disabled" : ""}>Cancelar</button></div><p role="alert" data-payment-annul-error class="admin-form-error">${escapeHtml(adminPagoAnnulError)}</p></form>` : ""}
            <div class="admin-pasajeros-table-wrap"><table class="admin-pasajeros-table admin-payment-ledger"><thead><tr><th>Fecha</th><th>Pasajero</th><th>Concepto y referencia</th><th>Medio</th><th>Importe (ARS)</th><th>Estado y responsable</th><th>Acciones</th></tr></thead><tbody>${filtered.map((pago)=>`<tr><td>${escapeHtml(pago.fecha.split('-').reverse().join('/'))}</td><td><strong>${escapeHtml([pago.pasajero_apellido,pago.pasajero_nombre].filter(Boolean).join(', '))}</strong><span>DNI ${escapeHtml(pago.pasajero_dni)}</span></td><td>${escapeHtml(pago.concepto)}<span>${escapeHtml(pago.referencia || "Sin referencia")}</span></td><td>${escapeHtml(adminPagoMedios[pago.medio] || pago.medio)}</td><td>${escapeHtml(formatAdminMoney(Number(pago.monto_centavos)/100))}</td><td><strong>${pago.estado === "anulado" ? "Anulado" : "Confirmado"}</strong><span>Cargó: ${escapeHtml(pago.actor_username)}</span>${pago.estado === "anulado" ? `<span>Anuló: ${escapeHtml(pago.anulado_por)} · ${escapeHtml(pago.motivo_anulacion)}</span>` : ""}</td><td><div class="admin-payment-actions"><button class="admin-pasajeros-secondary" data-payment-profile="${escapeHtml(pago.pasajero_dni)}" data-payment-passenger-id="${escapeHtml(pago.pasajero_legacy_id||pago.pasajero_id)}">Ver ficha</button>${adminCanDelete() && pago.estado === "confirmado" ? `<button class="admin-pasajeros-secondary" data-payment-annul="${escapeHtml(pago.id)}" ${adminPagoSaving ? "disabled" : ""}>Anular pago</button>` : ""}</div></td></tr>`).join("") || `<tr><td colspan="7">${adminPagoSearch ? "No hay movimientos que coincidan con la búsqueda." : "Todavía no hay pagos registrados."}</td></tr>`}</tbody></table></div>
          </section>` : ""}
        `);
        bindAdminShell();
        window.ElAngelAzulAccounts?.mount(document.querySelector("[data-student-accounts]"), { initialPassenger: adminPagoDraft?.pasajeroId || "", onSessionLost: handleAdminSessionLost });
        document.querySelectorAll('[data-payment-retry], [data-payment-refresh]').forEach(button => button.addEventListener('click', async () => { if(adminPagoSaving) return; button.disabled = true; await loadAdminPagos(); if(currentPath() === '/admin/pagos') renderAdminPagos(); }));
        const form = document.querySelector('[data-payment-form]');
        const remember = () => { if(form) Object.assign(adminPagoDraft, Object.fromEntries(new FormData(form))); };
        form?.addEventListener('input', remember);
        form?.addEventListener('change', remember);
        form?.addEventListener('submit', async (event) => {
          event.preventDefault();
          if(adminPagoSaving) return;
          remember();
          const monto = window.ElAngelAzulPayments.amountText(adminPagoDraft.monto);
          const error = form.querySelector('[data-payment-error]');
          if(!monto || Number(monto) <= 0) { error.textContent = 'Ingresá un importe mayor a cero, con hasta dos decimales. Ejemplo: 12.500,50.'; return; }
          adminPagoError = ''; adminPagoMessage = '';
          adminPagoSaving = true;
          form.querySelector('fieldset').disabled = true;
          try {
            await sendAdminPago('/api/admin/pagos', {...adminPagoDraft, monto});
            adminPagoDraft = newAdminPagoDraft();
            adminPagoMessage = 'Pago guardado en la base de datos.';
          } catch (failure) { adminPagoMessage = ''; adminPagoError = failure.message || 'No se pudo confirmar el guardado. Conservamos los datos: revisá el historial y volvé a intentar.'; }
          finally { adminPagoSaving = false; if(form.isConnected) form.querySelector('fieldset').disabled = false; }
          if(currentPath() === '/admin/pagos') renderAdminPagos();
        });
        document.querySelector('[data-payment-search-form]')?.addEventListener('submit', event => { event.preventDefault(); adminPagoSearch = new FormData(event.currentTarget).get('buscar') || ''; renderAdminPagos(); });
        document.querySelectorAll('[data-payment-profile]').forEach(button => button.addEventListener('click',()=> { adminPasajerosSelectedDni = button.dataset.paymentProfile; adminPasajerosSelectedKey = button.dataset.paymentPassengerId; location.hash = '/admin/pasajeros'; }));
        document.querySelectorAll('[data-payment-annul]').forEach(button => button.addEventListener('click',()=> { remember(); adminPagoAnularId = button.dataset.paymentAnnul; adminPagoMotivo = ''; adminPagoAnnulError = ''; renderAdminPagos(); document.querySelector('[name="motivo"]')?.focus(); }));
        document.querySelector('[data-payment-annul-cancel]')?.addEventListener('click',()=> { adminPagoAnularId = ''; renderAdminPagos(); });
        document.querySelector('[data-payment-annul-form]')?.addEventListener('input', event => { adminPagoMotivo = event.currentTarget.elements.motivo.value; });
        document.querySelector('[data-payment-annul-form]')?.addEventListener('submit', async event => {
          event.preventDefault();
          if(adminPagoSaving) return;
          const annulForm = event.currentTarget;
          adminPagoMotivo = annulForm.elements.motivo.value;
          adminPagoAnnulError = ''; adminPagoMessage = '';
          adminPagoSaving = true;
          annulForm.querySelectorAll('button,textarea').forEach(control => control.disabled = true);
          try {
            await sendAdminPago(`/api/admin/pagos/${annul.id}/anular`, {motivo: adminPagoMotivo, version: annul._version});
            adminPagoAnularId = ''; adminPagoMessage = 'Pago anulado. El movimiento original se conserva en el historial.';
          } catch (failure) { adminPagoAnnulError = failure.message || 'No se pudo anular. Volvé a consultar los pagos antes de intentar nuevamente.'; }
          finally { adminPagoSaving = false; annulForm.querySelectorAll('button,textarea').forEach(control => control.disabled = false); }
          if(currentPath() === '/admin/pagos') renderAdminPagos();
        });
      }

      function renderAdminTurismoContent() {
        const trip = adminTurismoCurrentTrip() || {};
        const readiness = adminTurismoReadiness(trip);
        const summary = adminTurismoTrips.reduce((acc, item) => {
          const state = adminTurismoReadiness(item);
          acc.total += 1;
          acc[state.key] = (acc[state.key] || 0) + 1;
          if (state.isPublished) acc.activos += 1;
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
        const photoRoot=document.querySelector("[data-catalog-photo-upload]");
        const photoKey=adminTurismoEditingId;
        window.ElAngelAzulCatalogMedia?.mount(photoRoot,{key:photoKey,onPhoto:photo=>{
          if(currentPath()!=="/admin/turismo"||adminTurismoEditingId!==photoKey)return false;
          const form=document.querySelector("[data-admin-turismo-form]");if(!form||form.dataset.saving)return false;
          const trip=readAdminTurismoForm(form);if(!trip.fotos.some(item=>item.url===photo.url))trip.fotos.push({url:photo.url,alt:(trip.titulo||"Foto del paquete").slice(0,200),principal:!trip.fotos.length});
          adminTurismoEditorDraft=trip;renderAdminTurismo();return true;
        }});
        document.querySelectorAll("[data-admin-catalog-photo]").forEach(image=>{image.addEventListener("error",()=>{image.hidden=true;image.nextElementSibling.hidden=false;});});
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

      function readAdminTurismoForm(form = document.querySelector("[data-admin-turismo-form]")) {
        if (!form) return normalizeAdminTurismoTrip(adminTurismoCurrentTrip());
          const formData = new FormData(form);
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
            alojamiento:formData.get("alojamiento")||"",transporte:formData.get("transporte")||"",regimenComidas:formData.get("regimenComidas")||"",disponibilidad:formData.get("disponibilidad")||"a_confirmar",cupos:formData.get("cupos")??"",promocion:formData.get("promocion")||"",videoUrl:formData.get("videoUrl")||"",archivado:formData.get("archivado")==="TRUE",
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
          nextTrip.fotos = fotosArray.length ? fotosArray : normalizeAdminTurismoPhotos(baseTrip.fotos);
        return nextTrip;
      }

      function showAdminCatalogFeedback(feedback) {
        const panel = document.querySelector(".admin-turismo-flow-actions");
        if (!panel) return;
        let message = panel.querySelector(".admin-turismo-save-feedback");
        if (!message) {
          message = document.createElement("p");
          panel.appendChild(message);
        }
        message.className = `admin-turismo-save-feedback ${feedback.ok ? "is-ok" : "is-error"}`;
        message.setAttribute("role", feedback.ok ? "status" : "alert");
        message.textContent = feedback.message;
      }

      function bindAdminTurismo() {
        document.querySelector("[data-admin-import-public-trips]")?.addEventListener("click", () => {
          importAdminTurismoPublicDefaults();
        });

        document.querySelectorAll("[data-admin-edit], [data-admin-preview]").forEach((button) => {
          button.addEventListener("click", () => {
            adminTurismoEditorDraft = null;
            adminTurismoSaveFeedback = null;
            adminTurismoEditingId = button.dataset.adminEdit || button.dataset.adminPreview;
            adminTurismoEditorOpen = true;
            renderAdminTurismo();
          });
        });

        document.querySelectorAll("[data-admin-delete]").forEach((button) => {
          button.addEventListener("click", async () => {
            const previous = adminTurismoTrips;
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
            button.disabled = true;
            const saved = await saveAdminTurismoTripsWithFeedback([tripId]);
            if (!saved) adminTurismoTrips = previous;
            renderAdminTurismo();
          });
        });

        document.querySelectorAll("[data-admin-new]").forEach((button) => {
          button.addEventListener("click", () => {
            const id = `demo-${Date.now()}`;
            adminTurismoEditorDraft = normalizeAdminTurismoTrip({ ...emptyAdminTurismoTrip, id });
            adminTurismoEditingId = id;
            adminTurismoEditorOpen = true;
            adminTurismoSaveFeedback = null;
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
          const form = document.querySelector("[data-admin-turismo-form]");
          if (!form) return;
          form.elements.estado.value = "activo";
          form.requestSubmit();
        });

        document.querySelector("[data-admin-deactivate]")?.addEventListener("click", () => {
          const form = document.querySelector("[data-admin-turismo-form]");
          if (!form) return;
          form.elements.estado.value = "inactivo";
          form.requestSubmit();
        });

        document.querySelector("[data-admin-archive]")?.addEventListener("click",event=>{
          const form=document.querySelector("[data-admin-turismo-form]");if(!form)return;
          const archived=event.currentTarget.dataset.adminArchive==="archivar";
          form.elements.archivado.value=archived?"TRUE":"FALSE";form.elements.estado.value=archived?"inactivo":"borrador";form.requestSubmit();
        });
        document.querySelector("[data-admin-duplicate]")?.addEventListener("click", async (event) => {
          const trip = adminTurismoCurrentTrip();
          const button = event.currentTarget;
          button.disabled = true;
          button.textContent = "Duplicando…";
          try {
            const response = await fetch(`/api/admin/paquetes/${encodeURIComponent(trip.id)}/duplicar`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ version: window.ElAngelAzulPersistence.adminSheetVersion("TURISMO", trip.id) })
            });
            const payload = await response.json();
            if (!response.ok || !payload.ok) throw new Error(payload.error || "No se pudo duplicar el paquete.");
            // Usar la respuesta confirmada; no repetir el alta si una recarga posterior falla.
            const sourceRows = adminTurismoTrips.map(item => ({ id: item.id, _version: window.ElAngelAzulPersistence.adminSheetVersion("TURISMO", item.id) }));
            adminTurismoTrips = [turismoRowToTrip(payload.paquete), ...adminTurismoTrips];
            sourceRows.unshift(payload.paquete);
            window.ElAngelAzulPersistence.captureAdminSheet("TURISMO", googleSheetsTurismoRows(), sourceRows);
            localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(adminTurismoTrips));
            adminTurismoEditorDraft = null;
            adminTurismoEditingId = payload.paquete.id;
            adminTurismoSaveFeedback = { ok: true, message: "Copia creada como borrador. Editala y publicala cuando esté lista." };
            renderAdminTurismo();
          } catch (error) {
            button.disabled = false;
            button.textContent = "Duplicar como borrador";
            showAdminCatalogFeedback({ ok: false, message: error.message });
          }
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
          const trip = readAdminTurismoForm();
          const newFoto = { url, alt: altInput?.value?.trim() || "", principal: trip.fotos.length === 0 };
          trip.fotos.push(newFoto);
          adminTurismoEditorDraft = trip;
          renderAdminTurismo();
        });

        // --- Quitar foto ---
        document.querySelectorAll("[data-remove-foto]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const fotoIndex = Number(btn.dataset.removeFoto);
            const trip = readAdminTurismoForm();
            trip.fotos.splice(fotoIndex, 1);
            if (trip.fotos.length && !trip.fotos.some((f) => f.principal)) trip.fotos[0].principal = true;
            adminTurismoEditorDraft = trip;
            renderAdminTurismo();
          });
        });

        // --- Agregar día de itinerario ---
        document.querySelector("[data-add-dia]")?.addEventListener("click", () => {
          const trip = readAdminTurismoForm();
          const itinerario = [...(trip.itinerario || []), { dia: String(trip.itinerario.length + 1), titulo: "", descripcion: "" }];
          adminTurismoEditorDraft = { ...trip, itinerario };
          renderAdminTurismo();
        });

        // --- Quitar día de itinerario ---
        document.querySelectorAll("[data-remove-dia]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const diaIndex = Number(btn.dataset.removeDia);
            const trip = readAdminTurismoForm();
            trip.itinerario.splice(diaIndex, 1);
            adminTurismoEditorDraft = trip;
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

        document.querySelector("[data-admin-turismo-form]")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          if (form.dataset.saving) return;
          const previousTrips = adminTurismoTrips.map(trip => ({ ...trip }));
          const nextTrip = readAdminTurismoForm(form);
          const id = nextTrip.id;
          const existingIndex = adminTurismoTrips.findIndex((trip) => trip.id === id);
          if (existingIndex >= 0) {
            adminTurismoTrips[existingIndex] = nextTrip;
          } else {
            adminTurismoTrips.unshift(nextTrip);
          }
          adminTurismoEditingId = id;
          form.dataset.saving = "true";
          const controls = [...document.querySelectorAll(".admin-layout button, .admin-layout input, .admin-layout select, .admin-layout textarea")];
          const disabled = controls.map(control => control.disabled);
          controls.forEach(control => { control.disabled = true; });
          showAdminCatalogFeedback({ ok: true, message: "Guardando cambios…" });
          const saved = await saveAdminTurismoTripsWithFeedback();
          delete form.dataset.saving;
          controls.forEach((control, index) => { control.disabled = disabled[index]; });
          if (!saved) {
            adminTurismoTrips = previousTrips;
            localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(previousTrips));
            showAdminCatalogFeedback(adminTurismoSaveFeedback);
            return;
          }
          adminTurismoEditorDraft = null;
          if (document.body.contains(form)) renderAdminTurismo();
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

      function renderPortalPasajeros() {
        return window.ElAngelAzulPortalPrivate.render(document.getElementById("app"));
      }

      const inscripcionDestinosPorNivel = {
        Primaria: ["Carlos Paz"],
        Secundaria: ["Bariloche", "Carlos Paz", "Camboriú"]
      };
      const inscripcionAnios = ["2026", "2027", "2028"];

      function renderAdhesionSteps(actual) {
        return `<ol class="adhesion-steps" aria-label="Pasos de la ficha de adhesión">
          <li${actual === 1 ? ' aria-current="step"' : ''}><span aria-hidden="true">1</span> Viaje y colegio</li>
          <li${actual === 2 ? ' aria-current="step"' : ''}><span aria-hidden="true">2</span> Datos y firma</li>
        </ol>`;
      }

      function renderInscripcion() {
        document.getElementById("app").innerHTML = `
          <div class="layout portal-layout public-inscripcion-layout adhesion-page">
            <header class="adhesion-intro">
              <h1>Ficha de adhesión</h1>
              <p>Completá la ficha del pasajero y firmala online. Si sos su padre, madre o tutor, cargá los datos en su nombre.</p>
            </header>
            <section class="portal-empty public-inscripcion-card" aria-labelledby="adhesion-tipo-title">
              <div class="inscripcion-section-heading">
                <h2 id="adhesion-tipo-title">¿Qué necesitás completar?</h2>
              </div>
              <div class="inscripcion-tipo-grid" data-inscripcion-tipo>
                <button type="button" data-inscripcion-tipo-pax aria-pressed="false" aria-expanded="false" aria-controls="adhesion-viaje-form">
                  <strong>Ficha del pasajero</strong>
                  <span>Datos del alumno que viaja, su responsable y la firma.</span>
                </button>
                <a href="#/inscripcion/tutor">
                  <strong>Tutor adicional</strong>
                  <span>Sumá otro responsable a la ficha de un pasajero.</span>
                </a>
              </div>
              <form id="adhesion-viaje-form" data-inscripcion-form hidden novalidate>
                ${renderAdhesionSteps(1)}
                <fieldset class="adhesion-selection-fields">
                  <legend tabindex="-1" data-inscripcion-heading>Viaje y colegio</legend>
                  <p class="adhesion-required-note">Completá todos los datos para abrir la ficha del pasajero.</p>
                  <div class="adhesion-trip-grid">
                    <label>Nivel educativo
                      <select data-inscripcion-nivel required>
                        <option>Primaria</option><option selected>Secundaria</option>
                      </select>
                    </label>
                    <label>Destino<select data-inscripcion-destino required></select></label>
                    <label>Año del viaje
                      <select data-inscripcion-anio required>
                        ${inscripcionAnios.map((anio) => `<option>${escapeHtml(anio)}</option>`).join("")}
                      </select>
                    </label>
                  </div>
                  <div class="public-inscripcion-grid">
                    <label class="public-inscripcion-colegio" data-colegio-buscar-wrap>Colegio
                      <input data-inscripcion-colegio-buscar list="colegios-lista" placeholder="Escribí el nombre y elegí una opción" autocomplete="off" aria-describedby="adhesion-colegio-help">
                      <datalist id="colegios-lista"></datalist>
                    </label>
                    <label class="public-inscripcion-colegio" data-colegio-texto-wrap hidden>Nombre completo del colegio
                      <input data-inscripcion-colegio-texto maxlength="120" placeholder="Ej.: Escuela Normal Dr. Juan Pujol" aria-describedby="adhesion-colegio-help">
                    </label>
                    <label class="ficha-adhesion-check public-inscripcion-colegio">
                      <input type="checkbox" data-inscripcion-colegio-no-esta>Mi colegio no está en la lista
                    </label>
                    <label>Grado/Año<select data-inscripcion-grado required></select></label>
                    <label>División<input data-inscripcion-division maxlength="3" autocapitalize="characters" autocomplete="off" placeholder="Ej.: B" required></label>
                  </div>
                  <p id="adhesion-colegio-help" class="inscripcion-field-hint">Si tu colegio no aparece, escribí su nombre completo con la opción de arriba. Administración lo vincula después.</p>
                  <div data-inscripcion-contract-result class="inscripcion-contract-result" role="status" aria-live="polite"></div>
                </fieldset>
                <div class="ficha-adhesion-error" data-inscripcion-error hidden role="alert" tabindex="-1"></div>
                <div class="inscripcion-step-actions">
                  <p>Después completás los datos personales y la firma.</p>
                  <button type="submit" data-inscripcion-next>Completar ficha de adhesión</button>
                </div>
              </form>
            </section>
          </div>
        `;
        bindInscripcion();
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
        const nextButton = document.querySelector("[data-inscripcion-next]");
        const errorMessage = document.querySelector("[data-inscripcion-error]");
        if (!validacion || !tipoPaxButton || !form || !nivelField || !destinoField || !anioField || !colegioBuscar || !gradoField || !divisionField || !contractResult || !nextButton || !errorMessage) return;

        let colegios = [];
        let colegiosCargados = false;
        let colegiosError = false;
        let contratoError = false;
        let contratoEstado = "sin_contrato";
        // undefined = buscando; null = sin contrato; objeto = contrato encontrado.
        let contrato = null;
        let contractRequest = 0;
        let contractTimer = null;
        const requiredMessage = "Revisá el colegio, el grado/año y la división. Completá los datos que falten para abrir la ficha.";

        tipoPaxButton.addEventListener("click", () => {
          tipoPaxButton.setAttribute("aria-pressed", "true");
          tipoPaxButton.classList.add("selected");
          tipoPaxButton.setAttribute("aria-expanded", "true");
          form.hidden = false;
          form.querySelector("[data-inscripcion-heading]").focus();
        });

        const etiquetaColegio = (colegio) => (colegio.localidad ? `${colegio.nombre} — ${colegio.localidad}` : colegio.nombre);
        const comparable = (texto) => String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
        const colegioElegido = () => {
          const valor = comparable(colegioBuscar.value);
          if (!valor) return null;
          return colegios.find((colegio) => comparable(etiquetaColegio(colegio)) === valor || comparable(colegio.nombre) === valor) || null;
        };

        fetch("/api/public/colegios", { cache: "no-store" })
          .then((response) => {
            if (!response.ok) throw new Error("No se pudo cargar la lista de colegios");
            return response.json();
          })
          .then((payload) => {
            colegios = Array.isArray(payload.colegios) ? payload.colegios : [];
            colegiosCargados = true;
            colegiosLista.innerHTML = colegios.map((colegio) => `<option value="${escapeHtml(etiquetaColegio(colegio))}"></option>`).join("");
            refreshContract();
          })
          .catch(() => {
            // Sin lista disponible la familia puede seguir con "Mi colegio no está".
            colegiosCargados = true;
            colegiosError = true;
            update();
          });

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
            if (colegiosError) {
              contractResult.textContent = "No pudimos cargar la lista de colegios. Podés continuar marcando “Mi colegio no está en la lista” y escribiendo su nombre.";
              return;
            }
            if (!colegiosCargados) {
              contractResult.textContent = "Cargando la lista de colegios…";
              return;
            }
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
          if (contratoError) {
            contractResult.textContent = "No pudimos verificar el contrato en este momento. Podés continuar con la ficha; se volverá a consultar antes del envío.";
            return;
          }
          if (["ambiguo","pausada"].includes(contratoEstado)) {
            contractResult.textContent = contratoEstado === "ambiguo" ? "Hay más de un contrato para tu curso. Pedí a la agencia el enlace correcto antes de continuar." : "La inscripción de este grupo está pausada. Consultá con la agencia antes de continuar.";
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
        };

        const refreshContract = () => {
          clearTimeout(contractTimer);
          const requestId = ++contractRequest;
          contratoError = false;
          const s = seleccion();
          if (!s.colegioId || !s.grado || !/^[A-Z0-9]{1,3}$/.test(s.division)) {
            contrato = null;
            update();
            return;
          }
          contrato = undefined;
          update();
          contractTimer = setTimeout(async () => {
            const params = new URLSearchParams({
              colegioId: s.colegioId, nivel: s.nivel, viaje: `${s.destino} ${s.anio}`, grado: s.grado, division: s.division
            });
            try {
              const response = await fetch(`/api/public/inscripcion-context?${params}`, { cache: "no-store" });
              const payload = await response.json();
              if (requestId !== contractRequest) return;
              contratoError = !response.ok || !payload.ok;
              contrato = contratoError ? null : payload.contrato;
              contratoEstado = payload.estado || "sin_contrato";
            } catch (_) {
              if (requestId !== contractRequest) return;
              contrato = null;
              contratoError = true;
            }
            update();
          }, 300);
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
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (nextButton.disabled) return;
          const s = seleccion();
          if (!seleccionValida(s)) {
            errorMessage.textContent = requiredMessage;
            errorMessage.hidden = false;
            errorMessage.focus();
            return;
          }
          if (s.colegioId) {
            nextButton.disabled = true;
            try {
              const query = new URLSearchParams({colegioId:s.colegioId,nivel:s.nivel,viaje:`${s.destino} ${s.anio}`,grado:s.grado,division:s.division});
              const response = await fetch(`/api/public/inscripcion-context?${query}`,{cache:"no-store"});
              const payload = await response.json();
              if (!response.ok || !payload.ok) throw Error("No pudimos verificar el contrato. Revisá tu conexión y volvé a intentar.");
              if (["ambiguo","pausada"].includes(payload.estado)) throw Error(payload.estado === "ambiguo" ? "Hay más de un contrato para este curso. Pedí a la agencia el enlace del grupo correcto." : "La inscripción del grupo está pausada. Consultá con la agencia.");
            } catch (error) {
              errorMessage.textContent = error.message;
              errorMessage.hidden = false;
              errorMessage.focus();
              return;
            } finally { nextButton.disabled = false; }
          }
          location.hash = `/inscripcion/ficha-adhesion?${new URLSearchParams(s).toString()}`;
        });
        form.addEventListener("input", () => { errorMessage.hidden = true; });
        form.addEventListener("change", () => { errorMessage.hidden = true; });
        const prev = fichaAdhesionContextFromParams();
        if ([...nivelField.options].some((option) => option.value === prev.nivel)) nivelField.value = prev.nivel;
        if (inscripcionAnios.includes(prev.anio)) anioField.value = prev.anio;
        update("nivel");
        if (prev.destino && [...destinoField.options].some((option) => option.value === prev.destino)) destinoField.value = prev.destino;
        gradoField.value = prev.grado;
        divisionField.value = prev.division;
        colegioBuscar.value = prev.colegioNombre;
        colegioTexto.value = prev.colegioTexto;
        colegioNoEsta.checked = Boolean(prev.colegioTexto);
        if (prev.colegioId || prev.colegioTexto) {
          tipoPaxButton.setAttribute("aria-pressed", "true");
          tipoPaxButton.setAttribute("aria-expanded", "true");
          tipoPaxButton.classList.add("selected");
          form.hidden = false;
        }
        refreshContract();
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
          division: params.get("division") || "",
          ...(params.get("contrato") ? { inscripcionCodigo: params.get("contrato") } : {})
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
          nodo.id = nodo.id || `error-${campo}`;
          form.querySelectorAll(`[name="${campo}"], [data-error-target="${campo}"], [data-dob-group="${campo}"] input`).forEach((input) => {
            if (mensaje) {
              input.setAttribute("aria-invalid", "true");
              input.setAttribute("aria-describedby", nodo.id);
            } else {
              input.removeAttribute("aria-invalid");
              input.removeAttribute("aria-describedby");
            }
          });
        });
        const campos = Object.keys(errores);
        errorBox.hidden = campos.length === 0;
        errorBox.innerHTML = campos.length
          ? `<strong>Faltan completar o corregir ${campos.length === 1 ? "1 dato" : `${campos.length} datos`}:</strong><ul>${campos.map((campo) => `<li>${escapeHtml(validacion.ETIQUETAS[campo] || campo)}</li>`).join("")}</ul>`
          : "";
        if (!campos.length) return;
        const nodo = form.querySelector(`[data-error-for="${campos[0]}"]`);
        const contenedor = nodo?.closest(".ficha-campo, .ficha-adhesion-signature, label, fieldset, .ficha-adhesion-context") || errorBox;
        contenedor.scrollIntoView({ behavior: "smooth", block: "center" });
        contenedor.querySelector?.("input:not([type=hidden]), select")?.focus({ preventScroll: true });
      }

      // Al corregir un campo se borra su error (no hace falta reenviar para
      // ver que ya está bien). Sirve también para la fecha en 3 partes.
      function limpiarErrorAlEditar(form) {
        // El mensaje de error no puede vivir dentro del <label>: el lector de
        // pantalla lo leería como parte del nombre del campo. Se envuelve
        // label + mensaje en un .ficha-campo y se asocia con aria-describedby.
        form.querySelectorAll("label [data-error-for]").forEach((nodo) => {
          const label = nodo.closest("label");
          const campo = document.createElement("div");
          campo.className = "ficha-campo" + (label.classList.contains("ficha-adhesion-check") ? " ficha-campo--full" : "");
          label.replaceWith(campo);
          campo.append(label, nodo);
        });
        const limpiar = (event) => {
          const contenedor = event.target.closest(".ficha-campo, .ficha-adhesion-signature") || event.target.closest("label");
          const nodo = contenedor?.querySelector("[data-error-for]");
          if (!nodo || nodo.classList.contains("is-sugerencia")) return;
          nodo.hidden = true;
          nodo.textContent = "";
          form.querySelectorAll(`[name="${nodo.dataset.errorFor}"], [data-error-target="${nodo.dataset.errorFor}"]`).forEach((input) => {
            input.removeAttribute("aria-invalid");
            input.removeAttribute("aria-describedby");
          });
        };
        form.addEventListener("input", limpiar);
        form.addEventListener("change", limpiar);
      }

      function renderFichaAdhesion(exito = null) {
        const validacion = window.ElAngelAzulFichaValidation;
        const contexto = fichaAdhesionContextFromParams();
        if (exito) {
          document.getElementById("app").innerHTML = `
            <div class="layout ficha-adhesion-layout adhesion-page">
              <section class="ficha-adhesion-panel ficha-adhesion-success-screen">
                <div class="ficha-adhesion-progress ficha-adhesion-progress--complete" aria-label="Progreso de inscripción">
                  <div>
                    <span>100% completado</span>
                    <strong>Ficha enviada</strong>
                  </div>
                  <i aria-hidden="true"></i>
                </div>
                <div class="ficha-adhesion-success ficha-adhesion-success-large" role="status" tabindex="-1" data-ficha-exito>Recibimos tu ficha correctamente.</div>
                ${exito.emailEstado === "pendiente" && exito.emailDestino ? `<p>La copia por correo está pendiente de envío a <strong>${escapeHtml(exito.emailDestino)}</strong>. Si no llega, consultanos: tu ficha ya quedó guardada.</p>` : ""}
                <p>Queda pendiente de revisión por administración. Te contactaremos si necesitamos validar algún dato.</p>
                <a class="ficha-adhesion-home-link" href="#/inscripcion">Volver al inicio</a>
              </section>
            </div>
          `;
          return;
        }
        document.getElementById("app").innerHTML = `
          <div class="layout ficha-adhesion-layout adhesion-page">
            <section class="ficha-adhesion-hero" data-ficha-hero>
              <h1>Ficha de adhesión</h1>
              <p>Completá los datos del pasajero y de su responsable. Al final, revisá la información y firmá.</p>
              ${renderAdhesionSteps(2)}
            </section>

            <section class="ficha-adhesion-panel">
              <div class="ficha-adhesion-context" data-reveal-light>
                <span>Colegio y viaje</span>
                <strong>${escapeHtml(contexto.colegioNombre)} · ${escapeHtml(contexto.nivel)} ${escapeHtml(contexto.grado)} ${escapeHtml(contexto.division)}</strong>
                <p>${escapeHtml(contexto.destino)} ${escapeHtml(contexto.anio)} · Contrato: <strong data-ficha-contrato>${contexto.colegioId ? "buscando…" : "se vincula en administración"}</strong></p>
                ${["colegio", "nivel", "grado", "division", "destino", "anio"].map(fichaCampoError).join("")}
                <a class="ficha-adhesion-context-edit" href="#/inscripcion?${escapeHtml(contexto.inscripcionCodigo ? new URLSearchParams({contrato:contexto.inscripcionCodigo}).toString() : new URLSearchParams(contexto).toString())}">${contexto.inscripcionCodigo ? "Revisar grupo del enlace" : "Cambiar viaje o colegio"}</a>
              </div>
              <div class="ficha-adhesion-help" data-reveal-light>
                <strong>Antes de empezar</strong>
                <p>Tené a mano el DNI del pasajero y el DNI y CUIL de su responsable. Todos los campos son obligatorios salvo los marcados como opcionales.</p>
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
                  <p class="ficha-fieldset-note">Adulto responsable del pasajero. Usamos estos datos para contactarte sobre la ficha.</p>
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
                  <details class="adhesion-optional-address">
                    <summary>Agregar piso, departamento o barrio (opcional)</summary>
                    <div class="adhesion-optional-fields">
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
                    </div>
                  </details>
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
                  <p class="ficha-fieldset-note">Dibujá tu firma en el recuadro o escribí tu nombre y apellido completos en el campo de abajo.</p>
                  <div class="ficha-adhesion-signature">
                    <span>Firma del padre, madre o tutor</span>
                    <canvas width="720" height="220" role="img" aria-label="Recuadro para dibujar la firma. Alternativa: escribí tu nombre completo en el campo siguiente." data-ficha-signature></canvas>
                    <button type="button" data-ficha-clear-signature>Limpiar firma</button>
                    <label>O escribí tu nombre y apellido completos como firma
                      <input name="firmaTexto" autocomplete="off" maxlength="80" data-error-target="firma" data-ficha-signature-text>
                    </label>
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
        const textoFirma = form.querySelector("[data-ficha-signature-text]");
        // Alternativa sin mouse ni pantalla táctil: el nombre escrito se dibuja
        // en un canvas y sale el mismo PNG que la firma a mano (mismo contrato).
        const firmaDesdeTexto = (texto) => {
          const lienzo = document.createElement("canvas");
          lienzo.width = canvas.width;
          lienzo.height = canvas.height;
          const g = lienzo.getContext("2d");
          g.fillStyle = "#10202b";
          g.textAlign = "center";
          g.textBaseline = "middle";
          let tamano = 96;
          g.font = `italic ${tamano}px "Brush Script MT", "Segoe Script", cursive`;
          while (g.measureText(texto).width > lienzo.width - 40 && tamano > 20) {
            tamano -= 4;
            g.font = `italic ${tamano}px "Brush Script MT", "Segoe Script", cursive`;
          }
          g.fillText(texto, lienzo.width / 2, lienzo.height / 2);
          return lienzo.toDataURL("image/png");
        };
        const nombreFirmaValido = () => textoFirma.value.trim().split(/\s+/).filter(Boolean).length >= 2;
        textoFirma.addEventListener("input", () => {
          if (!textoFirma.value.trim()) return;
          context.clearRect(0, 0, canvas.width, canvas.height);
          hasSignature = false;
        });
        const begin = (event) => {
          event.preventDefault();
          textoFirma.value = "";
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
          textoFirma.value = "";
        });

        // Contrato y planes del curso elegido (si el colegio es de la lista).
        const contextoInscripcion = fichaAdhesionContextFromParams();
        const contratoNode = document.querySelector("[data-ficha-contrato]");
        const planesFieldset = form.querySelector("[data-ficha-planes]");
        const planesOpciones = form.querySelector("[data-ficha-planes-opciones]");
        let planesDisponibles = [];
        // Sin colegio de la lista no hay planes que cargar. Con colegio, el envío
        // espera a que los planes estén cargados: si no, el servidor los exigiría
        // sin que el usuario viera dónde elegirlos.
        let planesCargados = !contextoInscripcion.colegioId;
        let planesEnCurso = null;
        const cargarPlanes = () => {
          if (planesCargados) return Promise.resolve(true);
          if (planesEnCurso) return planesEnCurso;
          const params = new URLSearchParams({
            colegioId: contextoInscripcion.colegioId,
            nivel: contextoInscripcion.nivel,
            viaje: `${contextoInscripcion.destino} ${contextoInscripcion.anio}`,
            grado: contextoInscripcion.grado,
            division: contextoInscripcion.division,
            ...(contextoInscripcion.inscripcionCodigo ? { codigo: contextoInscripcion.inscripcionCodigo } : {})
          });
          planesEnCurso = fetch(`/api/public/inscripcion-context?${params}`, { cache: "no-store" })
            .then((response) => {
              if (!response.ok) throw new Error("contexto");
              return response.json();
            })
            .then((payload) => {
              if (["ambiguo","pausada","enlace_invalido"].includes(payload.estado)) throw new Error(payload.estado === "ambiguo" ? "Hay más de un contrato para tu curso. Pedí a la agencia el enlace de tu grupo." : "La inscripción del grupo está pausada o el enlace ya no está vigente. Consultá con la agencia.");
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
              planesCargados = true;
              return true;
            })
            .catch((error) => {
              if (contratoNode) contratoNode.textContent = error.message === "contexto" ? "no pudimos verificarlo; volvé a intentar" : error.message;
              return false;
            })
            .finally(() => { planesEnCurso = null; });
          return planesEnCurso;
        };
        cargarPlanes();

        // Localidades sugeridas por Georef (API oficial). Si no responde, la
        // localidad se escribe a mano igual.
        const localidadInput = form.querySelector('[name="domicilioLocalidad"]');
        const provinciaSelect = form.querySelector('[name="domicilioProvincia"]');
        const localidadesLista = document.getElementById("localidades-lista");
        let georefTimer = null;
        let georefSeq = 0;
        localidadInput.addEventListener("input", () => {
          clearTimeout(georefTimer);
          const nombre = localidadInput.value.trim();
          if (nombre.length < 2) return;
          georefTimer = setTimeout(async () => {
            const seq = ++georefSeq;
            try {
              const params = new URLSearchParams({ provincia: provinciaSelect.value, nombre, max: "10", campos: "nombre" });
              const response = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?${params}`);
              const payload = await response.json();
              // Respuesta vieja (otra provincia o texto ya cambiado): se descarta.
              if (seq !== georefSeq) return;
              const nombres = [...new Set((payload.localidades || []).map((localidad) => localidad.nombre))];
              localidadesLista.innerHTML = nombres.map((valor) => `<option value="${escapeHtml(valor)}"></option>`).join("");
            } catch (_) {
              // Georef caído: la localidad se escribe a mano.
            }
          }, 250);
        });
        provinciaSelect.addEventListener("change", () => {
          georefSeq += 1;
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
            firma: nombreFirmaValido() ? firmaDesdeTexto(textoFirma.value.trim()) : hasSignature ? canvas.toDataURL("image/png") : ""
          };
        };

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submitButton = form.querySelector(".ficha-adhesion-submit");
          if (submitButton.disabled) return;
          if (!planesCargados) {
            submitButton.disabled = true;
            const cargados = await cargarPlanes();
            submitButton.disabled = false;
            if (!cargados) {
              errorBox.hidden = false;
              errorBox.textContent = "No pudimos cargar los planes de pago. Tus datos siguen cargados: revisá tu internet y volvé a intentar.";
              errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
          }
          const ficha = leerFormulario();
          const local = validacion.validarFichaPax(ficha, { planesDisponibles });
          if (!local.ok) {
            if (local.errores.firma && textoFirma.value.trim()) local.errores.firma = "Escribí nombre y apellido completos para usar tu nombre como firma.";
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
              renderFichaAdhesion({ emailDestino: payload.emailDestino || "", emailEstado: payload.emailEstado || "" });
              window.scrollTo({ top: 0 });
              document.querySelector("[data-ficha-exito]")?.focus({ preventScroll: true });
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
            <div class="layout ficha-adhesion-layout adhesion-page">
              <section class="ficha-adhesion-panel ficha-adhesion-success-screen">
                <div class="ficha-adhesion-success ficha-adhesion-success-large" role="status" tabindex="-1" data-ficha-exito>Registramos tus datos como tutor.</div>
                <p>Administración los vincula con la ficha del pasajero. Te contactaremos si necesitamos validar algún dato.</p>
                <a class="ficha-adhesion-home-link" href="#/inscripcion">Volver al inicio</a>
              </section>
            </div>
          `;
          return;
        }
        document.getElementById("app").innerHTML = `
          <div class="layout ficha-adhesion-layout adhesion-page">
            <section class="ficha-adhesion-hero" data-ficha-hero>
              <h1>Tutor adicional</h1>
              <p>Sumá tus datos como responsable de un pasajero. Si todavía no tiene ficha, completá primero la ficha del pasajero.</p>
            </section>
            <section class="ficha-adhesion-panel">
              <a class="adhesion-back-link" href="#/inscripcion">Volver a la ficha del pasajero</a>
              <p class="adhesion-required-note">Todos los campos son obligatorios.</p>
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
              document.querySelector("[data-ficha-exito]")?.focus({ preventScroll: true });
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
        if (path === "/" || path.startsWith("/turismo")) turismoPublicPackagesCache = null;
        const page = routes[path] || routes["/"];
        document.body.classList.toggle("home-page", path === "/");
        document.body.classList.toggle("portal-private-page", ["/portal-pasajeros", "/pasajeros", "/mi-viaje"].includes(path));
        document.body.classList.toggle("turismo-page", path.startsWith("/turismo"));
        document.body.classList.toggle("turismo-hero-page", path.startsWith("/turismo"));
        if (path !== "/" && path !== "/turismo" && path !== "/turismo/paquetes" && window.EAAHomeMotion) window.EAAHomeMotion.kill();
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
        if (path === "/turismo/paquetes") {
          await renderTurismoPaquetes();
          return;
        }
        if (path.startsWith("/turismo/")) {
          const packageItem = await turismoPackageBySlug(path.replace("/turismo/", ""));
          if (!packageItem && turismoPublicLoadError) {
            document.getElementById("app").innerHTML = `<main class="layout"><h1>No pudimos abrir este viaje</h1>${renderTurismoEmptyState()}</main>`;
            return;
          }
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
        // El portal utiliza una sesión propia; nunca hidrata colecciones del administrador.
        if (path === "/portal-pasajeros" || path === "/pasajeros" || path === "/mi-viaje") {
          await renderPortalPasajeros();
          return;
        }
        // Ficha v2: la inscripción ya no hidrata Grupos/Contratos en el
        // navegador; consulta colegios y contrato exacto en /api/public/*.
        if (path === "/inscripcion") {
          if (currentHashParams().get("contrato")) {
            window.ElAngelAzulEnrollment.open(document.getElementById("app"), currentHashParams().get("contrato"));
            return;
          }
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
        if (path === "/admin/colegios") {
          renderAdminColegios();
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

      document.addEventListener("click", async (event) => {
        const retry = event.target.closest("[data-turismo-retry]");
        if (!retry || retry.disabled) return;
        retry.disabled = true;
        retry.textContent = "Cargando viajes…";
        turismoPublicPackagesCache = null;
        await render();
      });

      function setupPublicInternalAccess() {
        document.querySelectorAll('.footer-internal-access, .site-nav a[href="/admin/"]').forEach(link => link.remove());
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
        const lenis = new Lenis({
          duration: 1.25,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.3
        });
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
          if (window.__lenisInstance && !reduceMotion) {
            window.__lenisInstance.scrollTo(target, { offset: -88, duration: 1.4 });
            return;
          }
          target.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start"
          });
        });
      }

      setupPublicInternalAccess();
      document.querySelector(".eaa-skip-link")?.addEventListener("click", (event) => {
        event.preventDefault();
        const content = document.getElementById("app");
        content.focus({ preventScroll: true });
        content.scrollIntoView({ behavior: "instant" });
      });
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

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
          closeMobileNav();
          navToggle?.focus();
        }
      });
      window.addEventListener("scroll", syncHeaderState, { passive: true });
      window.addEventListener("hashchange", async () => {
        await render();
        if (!isAdminPath(currentPath())) {
          if (window.__lenisInstance) window.__lenisInstance.scrollTo(0, { immediate: true });
          else window.scrollTo({ top: 0, behavior: "instant" });
        }
      });
      render();
      syncHeaderState();
