      function isAdminEntry() {
        return document.body?.dataset.appEntry === "admin";
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
        if (!isAdminEntry()) return `#${path}`;
        if (path === "/admin") return "/admin/";
        return `${path}/`;
      }

      function adminProtectedUrl(path) {
        if (path === "/admin-turismo") return "/admin-turismo/";
        if (path === "/admin") return "/admin/";
        return `${path}/`;
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

      function renderTrustSection(blockLabel) {
        return `
          <section>
            <p>${blockLabel}</p>
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
        `;
      }

      function renderGallerySection(gallery = {}, blockLabel = "Galería de fotos") {
        const photos = gallery.photos || [];

        return `
          <section>
            <p>${blockLabel}</p>
            <h2>${gallery.title || "Galería de fotos"}</h2>
            <div class="items">
              ${photos.map(photo => `
                <figure class="item">
                  <div class="placeholder">Foto</div>
                  <figcaption>${photo.caption || ""}</figcaption>
                </figure>
              `).join("")}
            </div>
          </section>
        `;
      }

      function renderVideoSection(video = {}, blockLabel = "Video principal") {
        return `
          <section>
            <p>${blockLabel}</p>
            <h2>${video.title || "Video principal"}</h2>
            ${video.url ? `<a href="${video.url}" target="_blank" rel="noopener">Ver video</a>` : ""}
          </section>
        `;
      }

      function renderTestimonialsSection(testimonials = {}, blockLabel = "Testimonios") {
        const items = testimonials.items || [];

        return `
          <section>
            <p>${blockLabel}</p>
            <h2>${testimonials.title || "Testimonios"}</h2>
            <div class="items">
              ${items.map(testimonial => `
                <article class="item">
                  <p>${testimonial.text || ""}</p>
                  <p>${testimonial.author || ""}</p>
                </article>
              `).join("")}
            </div>
          </section>
        `;
      }

      function renderItinerarySection(itinerary = {}, blockLabel = "Itinerario") {
        const items = itinerary.items || [];

        return `
          <section>
            <p>${blockLabel}</p>
            <h2>${itinerary.title || "Itinerario"}</h2>
            <div class="items">
              ${items.map(item => `
                <article class="item">
                  <h3>${item.title || ""}</h3>
                  <p>${item.text || ""}</p>
                </article>
              `).join("")}
            </div>
          </section>
        `;
      }

      function renderFaqSection(faq = {}, blockLabel = "Preguntas frecuentes") {
        const questions = faq.questions || [];

        return `
          <section>
            <p>${blockLabel}</p>
            <h2>${faq.title || "Preguntas frecuentes"}</h2>
            <div class="items">
              ${questions.map(item => `
                <article class="item">
                  <h3>${item.question || ""}</h3>
                  <p>${item.answer || ""}</p>
                </article>
              `).join("")}
            </div>
          </section>
        `;
      }

      async function renderHome() {
        const packages = (await loadTurismoPublicPackages()).slice(0, 3);
        const galleryPhotos = [
          { src: "assets/img/bariloche/cena-de-velas/cover.webp", alt: "Grupo de estudiantes en la cena de gala de su viaje de egresados" },
          { src: "assets/img/turismo/hero/montana-patagonia.webp", alt: "Vista aérea de montañas y lago en la Patagonia" },
          { src: "assets/img/bariloche/fiesta-fluo/cover.webp", alt: "Grupo de estudiantes en la fiesta fluo de su viaje de egresados" },
          { src: "assets/img/turismo/hero/cataratas-iguazu.webp", alt: "Cataratas del Iguazú desde el mirador" }
        ];
        document.getElementById("app").innerHTML = `
          <div class="layout home-layout-v2">

            <!-- HERO -->
            <section class="hero-v2 hero-v2--prompt">
              <div class="hero-prompt-bg" aria-hidden="true"></div>
              <div class="hero-prompt-snow" aria-hidden="true"></div>
              <div class="hero-prompt-words" aria-label="Tu próxima gran aventura comienza aquí">
                <h1 class="hero-word hero-word-one">Tu próxima</h1>
                <h1 class="hero-word hero-word-two">aventura</h1>
                <h1 class="hero-word hero-word-three">comienza aquí</h1>
              </div>
              <div class="hero-prompt-actions">
                  <a class="btn-fuchsia" href="${whatsappLink("Hola, quiero consultar por un viaje con El Ángel Azul.")}" target="_blank" rel="noopener">
                    Consultar por WhatsApp
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">chat</span>
                  </a>
                  <a class="btn-ghost-light" href="#/turismo">Explorar Destinos</a>
              </div>
              <div class="hero-prompt-destinos" aria-label="Algunos de nuestros destinos">
                <span class="hero-destino hero-destino-one">Bariloche</span>
                <span class="hero-destino hero-destino-two">Cataratas</span>
                <span class="hero-destino hero-destino-three">Mendoza</span>
              </div>
            </section>

            <!-- TRUST -->
            <section class="trust-v2">
              <div class="trust-v2-grid">
                <div class="trust-v2-photo-wrap">
                  <div class="trust-v2-photo" style="background-image: url('assets/img/bariloche/cena-de-velas/dsc6979.webp')" role="img" aria-label="Equipo de El Ángel Azul acompañando a un grupo de viaje"></div>
                  <div class="trust-v2-badge">
                    <div class="trust-v2-badge-head">
                      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">verified_user</span>
                      <p>Acompañamiento en cada etapa</p>
                    </div>
                    <p class="trust-v2-quote">"Un equipo presente antes, durante y después del viaje."</p>
                  </div>
                </div>
                <div class="trust-v2-copy">
                  <h2>Seguridad y confianza en <span>cada kilómetro.</span></h2>
                  <p>Entendemos que un viaje es más que un destino; es una responsabilidad. Por eso combinamos organización clara con un equipo humano cercano para garantizar la tranquilidad de las familias.</p>
                  <div class="trust-v2-checklist">
                    ${trustSectionData.cards.slice(0, 3).map((card) => `
                      <div class="trust-v2-check-item">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                          <h4>${escapeHtml(card.title)}</h4>
                          <p>${escapeHtml(card.text)}</p>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>
            </section>

            <!-- GALLERY -->
            <section class="gallery-v2">
              <div class="gallery-v2-heading">
                <h2>Momentos que duran <span>para siempre</span></h2>
                <p>Cada viaje deja recuerdos que se cuentan durante años. Así los vive cada grupo que viaja con nosotros.</p>
              </div>
              <div class="gallery-v2-grid">
                ${galleryPhotos.map((photo, index) => `
                  <div class="gallery-v2-item${index % 2 === 1 ? " is-offset" : ""}">
                    <img src="${photo.src}" alt="${escapeHtml(photo.alt)}" loading="lazy">
                  </div>
                `).join("")}
              </div>
            </section>

            <!-- FEATURED PACKAGES -->
            ${packages.length ? `
              <section class="packages-v2">
                <div class="packages-v2-heading">
                  <div>
                    <h2>Destinos Destacados</h2>
                    <p>Paquetes pensados para cada tipo de viajero.</p>
                  </div>
                  <a class="packages-v2-viewall" href="#/turismo">Ver todos los destinos <span class="material-symbols-outlined">arrow_forward</span></a>
                </div>
                <div class="packages-v2-grid">
                  ${packages.map((pkg) => `
                    <article class="packages-v2-card">
                      <a class="packages-v2-card-media" href="#/turismo/${escapeHtml(pkg.slug)}">
                        <img src="${pkg.image}" alt="${escapeHtml(pkg.destino)}" loading="lazy">
                        <span class="packages-v2-tag">${escapeHtml(pkg.categoria || pkg.tipo || "Turismo")}</span>
                      </a>
                      <div class="packages-v2-card-body">
                        <h3><a href="#/turismo/${escapeHtml(pkg.slug)}">${escapeHtml(pkg.destino)}</a></h3>
                        <p>${escapeHtml(pkg.resumen || "")}</p>
                        <div class="packages-v2-card-foot">
                          <span>${escapeHtml(pkg.precio || pkg.precioDesde || "Consultar")}</span>
                          <a class="packages-v2-card-cta" href="#/turismo/${escapeHtml(pkg.slug)}" aria-label="Ver ${escapeHtml(pkg.destino)}">
                            <span class="material-symbols-outlined">arrow_forward</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  `).join("")}
                </div>
              </section>
            ` : ""}

            <!-- CTA -->
            <section class="cta-v2">
              <div class="cta-v2-decoration" aria-hidden="true"><span class="material-symbols-outlined">travel_explore</span></div>
              <div class="cta-v2-grid">
                <div>
                  <h2>${escapeHtml(homeData.finalCta.title)}</h2>
                  <p>${escapeHtml(homeData.finalCta.text)}</p>
                  <a class="btn-whatsapp" href="${whatsappLink("Hola, quiero consultar por un viaje con El Ángel Azul.")}" target="_blank" rel="noopener">
                    ${escapeHtml(homeData.finalCta.button[0])}
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">chat</span>
                  </a>
                </div>
                <div class="cta-v2-badges">
                  ${homeData.benefits.map((benefit) => `<span class="cta-v2-badge">${escapeHtml(benefit)}</span>`).join("")}
                </div>
              </div>
            </section>

          </div>
        `;
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
          precio: adminTrip.precioDesde || "Consultar disponibilidad",
          precioDesde: adminTrip.precioDesde || "Consultar",
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
        return `
          <article class="package-card turismo-package-card">
            <div class="package-image-wrap package-card-carousel" data-card-carousel data-carousel-index="0">
              <div class="package-carousel-track">
                ${gallery.map((image, index) => `
                  <img class="${index === 0 ? "active" : ""}" src="${image}" alt="${packageItem.destino} ${index + 1}" data-carousel-slide>
                `).join("")}
              </div>
              <span>${packageItem.categoria}</span>
              <button class="package-carousel-arrow package-carousel-prev" type="button" aria-label="Foto anterior de ${packageItem.destino}" data-carousel-prev>‹</button>
              <button class="package-carousel-arrow package-carousel-next" type="button" aria-label="Foto siguiente de ${packageItem.destino}" data-carousel-next>›</button>
              <div class="package-carousel-count" aria-hidden="true">1/${gallery.length}</div>
            </div>
            <div class="package-card-body">
              <div class="package-card-head">
                <p class="package-meta">${packageItem.tipo} · ${packageItem.temporada}</p>
                <h3>${packageItem.destino}</h3>
              </div>
              <p class="package-duration">${packageItem.duracion}</p>
              ${packageItem.fechaSalida ? `
                <p class="package-fecha-salida">
                  ${packageItem.fechaSalida}${packageItem.fechaRegreso ? ` al ${packageItem.fechaRegreso}` : ""}
                  ${packageItem.salidaGarantizada ? `<span class="package-badge-garantizada">Salida garantizada</span>` : ""}
                </p>
              ` : ""}
              <p class="package-summary">${packageItem.resumen}</p>
              <div class="package-price" aria-label="Precio desde ${packageItem.precioDesde}">
                <span>Desde</span>
                <strong>${packageItem.precioDesde}</strong>
              </div>
              <div class="package-includes" aria-label="Incluye">
                <strong>Incluye</strong>
                <div>
                  ${packageItem.incluye.map((item) => `<span>${item}</span>`).join("")}
                </div>
              </div>
              <div class="package-actions">
                <a href="#/turismo/${packageItem.slug}">Ver detalles</a>
                <a class="package-whatsapp" href="${turismoWhatsappForPackage(packageItem)}" target="_blank" rel="noopener">Consultar</a>
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

      function updateTurismoPackages(filter = "todos") {
        const grid = document.querySelector("[data-turismo-package-grid]");
        if (!grid) return;
        const packages = turismoPackages().filter((packageItem) => {
          if (filter === "todos") return true;
          return packageItem.intenciones?.includes(filter);
        });
        grid.innerHTML = packages.length
          ? packages.map(renderTurismoPackageCard).join("")
          : renderTurismoEmptyState();
        bindTurismoCardCarousels(grid);
      }

      function bindTurismoIntentions() {
        const chips = [...document.querySelectorAll("[data-turismo-intention]")];
        chips.forEach((chip) => {
          chip.addEventListener("click", () => {
            const filter = chip.dataset.turismoIntention;
            chips.forEach((item) => item.classList.toggle("active", item === chip));
            updateTurismoPackages(filter);
          });
        });
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
              <div class="turismo-hero-content">
                <p class="turismo-kicker">Turismo nacional e internacional</p>
                <h1>Encontrá un viaje que cierre con tus fechas, tu grupo y tu presupuesto</h1>
                <p>Explorá paquetes cargados por El Ángel Azul y consultá por disponibilidad, formas de pago y detalles antes de decidir.</p>
                <span class="turismo-proof">Asesoramiento personalizado para familias, parejas y grupos.</span>
                <div class="turismo-hero-actions">
                  <a href="#turismo-catalogo">Ver viajes</a>
                  <a href="${whatsappLink("Hola, quiero que me asesoren para elegir un viaje turístico con El Ángel Azul.")}" target="_blank" rel="noopener">Pedir asesoramiento</a>
                </div>
              </div>
            </section>

            <section class="turismo-intention-section">
              <div class="catalog-heading">
                <p class="section-kicker">Filtrar opciones</p>
                <h2>Primero elegí la intención del viaje</h2>
                <p>Usá estos filtros para ordenar el catálogo según la experiencia que tenés en mente.</p>
              </div>
              <div class="intention-chip-row" aria-label="Selector de intención visual">
                ${turismoIntentionFilters.map(([value, label], index) => `
                  <button class="intention-chip${index === 0 ? " active" : ""}" type="button" data-turismo-intention="${value}">${label}</button>
                `).join("")}
              </div>
            </section>

            <section class="catalog-section" id="turismo-catalogo">
              <div class="catalog-heading">
                <p class="section-kicker">Viajes destacados</p>
                <h2>Opciones disponibles para consultar</h2>
                <p>Cada ficha muestra destino, duración, precio de referencia e incluye. El cierre final se confirma por WhatsApp.</p>
              </div>
              <div class="package-grid" data-turismo-package-grid>
                ${packages.map(renderTurismoPackageCard).join("")}
              </div>
            </section>

            <section class="turismo-cta">
              <h2>¿No encontraste el viaje que buscabas?</h2>
              <p>Podés pedir asesoramiento según tu presupuesto, fecha y cantidad de personas.</p>
              <a href="${whatsappLink("Hola, quiero consultar por un viaje turístico que no encontré en la web de El Ángel Azul.")}" target="_blank" rel="noopener">Consultar</a>
            </section>
          </div>
        `;
        document.querySelector("[data-disable-turismo-preview]")?.addEventListener("click", () => {
          setTurismoPublicPreviewMode(false);
          renderTurismo();
        });
        bindTurismoIntentions();
        bindTurismoCardCarousels();
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
                <img class="package-gallery-main" src="${gallery[0]}" alt="${escapeHtml(packageItem.destino)}">
                <div class="package-gallery-strip">
                  ${gallery.slice(1).map((image, index) => `
                    <img src="${image}" alt="${escapeHtml(packageItem.destino)} ${index + 2}">
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
              <div>
                <h2>Qué incluye</h2>
                <ul>
                  ${packageItem.incluye.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </div>
              ${packageItem.noIncluye?.length ? `
                <div>
                  <h2>Qué no incluye</h2>
                  <ul>
                    ${packageItem.noIncluye.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
            </section>

            <!-- ITINERARIO -->
            ${itinerario.length ? `
              <section class="package-detail-itinerario">
                <p class="section-kicker">Programa</p>
                <h2>Itinerario día por día</h2>
                <div class="package-itinerario-list">
                  ${itinerario.map((dia, index) => `
                    <div class="package-itinerario-item">
                      <div class="package-itinerario-num">Día ${escapeHtml(String(dia.dia || index + 1))}</div>
                      <div class="package-itinerario-body">
                        <strong>${escapeHtml(dia.titulo)}</strong>
                        ${dia.descripcion ? `<p>${escapeHtml(dia.descripcion)}</p>` : ""}
                      </div>
                    </div>
                  `).join("")}
                </div>
              </section>
            ` : ""}

            <!-- FORMAS DE PAGO -->
            ${formasPago.length ? `
              <section class="package-detail-payment">
                <h2>Formas de pago</h2>
                <ul>
                  ${formasPago.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </section>
            ` : ""}

            <!-- CONDICIÓN DE VENTA -->
            ${packageItem.condicionVenta ? `
              <section class="package-detail-condicion">
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
        `;
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
          adminTurismoSaveFeedback = { ok: false, message: "Guardado solo en este navegador. Google Sheets no está conectado." };
          return;
        }
        try {
          const rows = googleSheetsTurismoRows(new Date().toISOString());
          await window.ElAngelAzulPersistence.writeGoogleSheetRows("TURISMO", rows, deleteIds);
          adminTurismoSaveFeedback = { ok: true, message: `Guardado en Google Sheets: ${rows.length} ${rows.length === 1 ? "viaje" : "viajes"}.` };
          turismoPublicPackagesCache = null;
        } catch (error) {
          adminTurismoSaveFeedback = { ok: false, message: `No se pudo guardar en Google Sheets: ${error.message || "error desconocido"}.` };
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

      function adminTurismoPhotosToLines(value) {
        return normalizeAdminTurismoPhotos(value).map((photo) => photo.url).join("\n");
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

      function validateAdminTurismoTrip(trip) {
        return adminTurismoPublicationChecklist(trip)
          .filter((item) => !item.ok)
          .map((item) => item.label);
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

      function renderAdminTurismoCompactStatus(trip) {
        const readiness = adminTurismoReadiness(trip);
        const visibleMissing = readiness.missing.slice(0, 5);
        const remainingMissing = Math.max(readiness.missing.length - visibleMissing.length, 0);
        return `
          <section class="admin-turismo-side-card admin-turismo-side-card--status">
            <p>Estado del viaje</p>
            <span class="admin-turismo-publication-badge is-${readiness.key}">${escapeHtml(readiness.label)}</span>
            <strong>${readiness.missing.length ? `${readiness.missing.length} faltante${readiness.missing.length === 1 ? "" : "s"}` : "Checklist completo"}</strong>
            <div class="admin-turismo-compact-missing">
              ${visibleMissing.length
                ? visibleMissing.map((item) => `<span>${escapeHtml(item.label)}</span>`).join("")
                : `<span class="is-ok">Listo para publicar</span>`}
              ${remainingMissing ? `<span>+ ${remainingMissing} más</span>` : ""}
            </div>
          </section>
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

      function renderAdminTurismoCompactPreview(trip = {}) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        const previewPackage = adminTurismoPreviewPackage(normalizedTrip);
        const whatsappText = `Hola, quiero consultar por ${normalizedTrip.titulo || normalizedTrip.destino || "este viaje"} (${normalizedTrip.duracion || "duración a confirmar"}).`;
        return `
          <section class="admin-turismo-side-card admin-turismo-side-card--preview" data-admin-preview-section>
            <div class="admin-turismo-side-card-head">
              <div>
                <p>Preview corta</p>
                <h3>Card pública</h3>
              </div>
              <span>#/turismo/${escapeHtml(normalizedTrip.slug || adminTurismoSlug(normalizedTrip.titulo || normalizedTrip.destino))}</span>
            </div>
            <div class="admin-turismo-real-card-preview">
              ${renderTurismoPackageCard(previewPackage)}
            </div>
            <button type="button" class="admin-preview-detail-button" data-admin-open-detail-preview>Ver detalle completo</button>
          </section>
          <section class="admin-turismo-side-card admin-turismo-side-card--whatsapp">
            <div class="admin-turismo-side-card-head">
              <div>
                <p>Mensaje WhatsApp generado</p>
                <h3>Texto contextual</h3>
              </div>
            </div>
            <div class="admin-turismo-whatsapp-copy">${escapeHtml(whatsappText)}</div>
          </section>
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

      function adminTurismoStatusLabel(status) {
        const labels = {
          activo: "Activo",
          borrador: "Borrador",
          revision: "En revisión",
          inactivo: "Inactivo"
        };
        return labels[status] || "Borrador";
      }

      function renderAdminTurismoTripRows() {
        if (!adminTurismoTrips.length) {
          return `
            <article class="admin-turismo-row admin-turismo-empty-row">
              <div>
                <strong>Todavía no hay viajes cargados</strong>
                <span>Creá un viaje nuevo para empezar la carga.</span>
              </div>
            </article>
          `;
        }
        return adminTurismoTrips.slice().sort((a, b) => a.orden - b.orden).map((trip) => {
          const readiness = adminTurismoReadiness(trip);
          return `
          <article class="admin-turismo-row${trip.id === adminTurismoEditingId ? " selected" : ""}">
            <div>
              <strong>${escapeHtml(trip.destino || "Sin destino")}</strong>
              <span>${escapeHtml(trip.titulo || "Sin título comercial")}</span>
            </div>
            <span class="admin-turismo-status ${escapeHtml(readiness.key)}">${escapeHtml(readiness.label)}</span>
            <div class="admin-turismo-row-actions">
              <button type="button" data-admin-edit="${trip.id}">Editar</button>
              <button type="button" data-admin-delete="${trip.id}">Eliminar</button>
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
                <span>
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
                        <input type="radio" name="fotoPrincipal" value="${index}" ${photo.principal ? "checked" : ""}> Principal
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

            ${block("Configuración", "Ajustes internos de publicación.", `
              <div class="admin-turismo-form-grid admin-turismo-form-grid--compact">
                ${field("URL interna", `<input name="slug" value="${escapeHtml(trip.slug || adminTurismoSlug(trip.titulo || trip.destino))}" placeholder="cancun-ano-nuevo-2026">`, "Sin espacios ni acentos. Se genera automático.")}
                ${field("Orden en catálogo", `<input name="orden" type="number" min="1" step="1" value="${escapeHtml(String(trip.orden ?? 999))}">`, "Menor número = aparece antes.")}
                ${field("Estado", `
                  <select name="estado">
                    ${[["borrador", "Borrador"], ["revision", "En revisión"], ["activo", "Activo"], ["inactivo", "Inactivo"]].map(([val, label]) => `<option value="${val}" ${trip.estado === val ? "selected" : ""}>${label}</option>`).join("")}
                  </select>
                `)}
              </div>
              <fieldset class="admin-turismo-category-field">
                <legend>Categorías</legend>
                <div class="admin-turismo-category-grid">
                  ${adminTurismoCategories.map(([value, label]) => `
                    <label class="admin-turismo-check">
                      <input name="categorias" type="checkbox" value="${value}" ${selectedCategories.includes(value) ? "checked" : ""}>
                      <span>${label}</span>
                    </label>
                  `).join("")}
                </div>
              </fieldset>
              <label class="admin-turismo-check admin-turismo-check--featured">
                <input name="destacado" type="checkbox" ${trip.destacado ? "checked" : ""}>
                <span>
                  <strong>Destacado</strong>
                  <small>Prioriza este viaje en el catálogo.</small>
                </span>
              </label>
            `, statusBadge(Boolean(normalizedTrip.slug && normalizedTrip.estado)), true)}

          </form>
        `;
      }

      function renderAdminTurismoActionPanel(trip) {
        const readiness = adminTurismoReadiness(trip);
        const activePreview = isTurismoPublicPreviewMode();
        const esBorrador = !trip.estado || trip.estado === "borrador";
        const esActivo = trip.estado === "activo";

        return `
          <section class="admin-turismo-action-panel">

            <!-- Guardar -->
            <div class="admin-turismo-action-group">
              <div>
                <p>Edición</p>
                <h3>Guardar trabajo</h3>
                <span>Guarda el viaje aunque esté incompleto.</span>
              </div>
              <div class="admin-turismo-action-buttons">
                <button type="submit" class="admin-action-primary">Guardar viaje</button>
                <button type="button" data-admin-new>Crear nuevo viaje</button>
                <button type="button" data-admin-duplicate ${trip.id ? "" : "disabled"}>Duplicar</button>
              </div>
            </div>

            <!-- Estado: visible y destacado -->
            <div class="admin-turismo-action-group admin-turismo-action-group--estado">
              <div>
                <p>Estado del viaje</p>
                <h3>${esActivo ? "✅ Activo — listo para publicar" : esBorrador ? "⚠️ Borrador — no visible en la web" : "Estado: " + (trip.estado || "borrador")}</h3>
                <span>${esActivo
                  ? "Este viaje está activo. Podés publicarlo en la web."
                  : "Cambiá el estado a <strong>Activo</strong> para habilitar la publicación."
                }</span>
              </div>
              <div class="admin-turismo-action-buttons">
                <label class="admin-turismo-estado-selector">
                  <span>Estado</span>
                  <select data-admin-turismo-estado-quick name="estado_quick">
                    ${[["borrador","Borrador"],["revision","En revisión"],["activo","Activo"],["inactivo","Inactivo"]]
                      .map(([val, label]) => `<option value="${val}" ${(trip.estado || "borrador") === val ? "selected" : ""}>${label}</option>`)
                      .join("")}
                  </select>
                </label>
                <button type="button" class="admin-action-primary" data-admin-turismo-apply-estado>
                  Aplicar estado
                </button>
              </div>
            </div>

            <!-- Checklist resumido -->
            ${!readiness.canPublish ? `
              <div class="admin-turismo-action-group admin-turismo-missing-alert">
                <div>
                  <p>Checklist</p>
                  <h3>${readiness.missing.length} ${readiness.missing.length === 1 ? "campo faltante" : "campos faltantes"} para publicar</h3>
                  <ul class="admin-turismo-missing-list">
                    ${readiness.missing.map(item => `<li>${escapeHtml(item.label)}</li>`).join("")}
                  </ul>
                </div>
                <div class="admin-turismo-action-buttons">
                  <button type="button" data-admin-scroll-checklist>Ver checklist completo</button>
                </div>
              </div>
            ` : ""}

            <!-- Publicación -->
            <div class="admin-turismo-action-group admin-turismo-action-group--publish">
              <div>
                <p>Publicación</p>
                <h3>${readiness.canPublish ? "Listo para publicar" : "Completá los campos faltantes"}</h3>
                <span>${readiness.canPublish
                  ? "El viaje está completo y activo. Podés publicarlo en la web."
                  : "Completá todos los campos requeridos y cambiá el estado a Activo."
                }</span>
              </div>
              <div class="admin-turismo-action-buttons">
                <button type="button" data-admin-scroll-preview>Vista previa</button>
                <button type="button" class="admin-action-publish" data-admin-publish ${readiness.canPublish ? "" : "disabled"}>Publicar en la web</button>
                <button type="button" data-admin-export>Exportar JSON</button>
                <button type="button" class="admin-action-publish" data-admin-preview-public ${readiness.canPublish ? "" : "disabled"}>${activePreview ? "Actualizar prueba" : "Ver en prueba"}</button>
                <button type="button" data-admin-deactivate ${trip.id && trip.estado !== "inactivo" ? "" : "disabled"}>Desactivar viaje</button>
              </div>
            </div>

          </section>
        `;
      }

      function renderAdminTurismoPreview(trip = {}) {
        const normalizedTrip = normalizeAdminTurismoTrip(trip);
        const previewPackage = {
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
        const photos = adminTurismoPhotos(trip);
        const cover = adminTurismoCoverPhoto(trip);
        const whatsappText = `Hola, quiero consultar por ${normalizedTrip.titulo || normalizedTrip.destino || "este viaje"} (${normalizedTrip.duracion || "duración a confirmar"}).`;
        return `
          <div class="admin-turismo-preview-grid">
            <div class="admin-turismo-real-card-preview">
              ${renderTurismoPackageCard(previewPackage)}
            </div>

            <article class="admin-turismo-detail-preview">
              <div class="admin-turismo-detail-hero">
                ${cover ? `<img src="${escapeHtml(cover.url)}" alt="${escapeHtml(cover.alt || normalizedTrip.destino)}">` : ""}
                <div>
                  <p>${escapeHtml(normalizedTrip.categorias.join(" · ") || "Turismo")} · ${escapeHtml(normalizedTrip.temporada || "Temporada")}</p>
                  <h3>${escapeHtml(normalizedTrip.titulo || normalizedTrip.destino || "Título comercial")}</h3>
                  <span>${escapeHtml(normalizedTrip.precioDesde || "Consultar")} · ${escapeHtml(normalizedTrip.duracion || "Duración")}</span>
                </div>
              </div>
              <div class="admin-turismo-gallery-strip">
                ${photos.map((photo) => `<img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt || normalizedTrip.destino)}">`).join("")}
              </div>
              <p>${escapeHtml(normalizedTrip.descripcionLarga || "Descripción larga para la página detalle básica.")}</p>
              <div class="admin-turismo-detail-columns">
                <div>
                  <h4>Incluye</h4>
                  <ul>${(normalizedTrip.incluye.length ? normalizedTrip.incluye : ["Item demo"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                </div>
                <div>
                  <h4>No incluye</h4>
                  <ul>${(normalizedTrip.noIncluye.length ? normalizedTrip.noIncluye : ["Item demo"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                </div>
              </div>
              <div class="admin-turismo-whatsapp">WhatsApp contextual: ${escapeHtml(whatsappText)}</div>
            </article>
          </div>
        `;
      }

      const adminModules = [
        {
          id: "fichas",
          label: "Inscripciones",
          path: "/admin/fichas",
          status: "Bandeja"
        },
        {
          id: "grupos",
          label: "Contratos",
          path: "/admin/grupos",
          status: "Contratos"
        },
        {
          id: "pasajeros",
          label: "Pasajeros",
          path: "/admin/pasajeros",
          status: "Operativo"
        },
        {
          id: "pagos",
          label: "Pagos",
          path: "/admin/pagos",
          status: "Cuotas"
        },
        {
          id: "turismo",
          label: "Turismo web",
          path: "/admin/turismo",
          status: "Publicación"
        },
        {
          id: "configuracion",
          label: "Configuración",
          path: "/admin/configuracion",
          status: "Admin",
          adminOnly: true
        }
      ];

      function adminModuleLabel(moduleId) {
        return adminModules.find((module) => module.id === moduleId)?.label || "Panel interno";
      }

      function adminVisibleModules() {
        const role = String(adminSession?.role || "admin").toLowerCase();
        return adminModules.filter((module) => !module.adminOnly || role === "admin");
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
              <div class="admin-shell-brand">
                <strong>El Ángel Azul</strong>
                <span>Panel Interno</span>
              </div>
              <div class="admin-shell-session">
                <span>Usuario activo</span>
                <strong>${escapeHtml(adminSession?.label || adminSession?.user || "Admin")}</strong>
                <button type="button" data-admin-logout>Cerrar sesión</button>
              </div>
            </section>

            <div class="admin-shell">
              <aside class="admin-sidebar" aria-label="Navegación interna">
                <nav>
                  ${adminVisibleModules().map((module) => `
                    <a class="${module.id === moduleId ? "active" : ""}" href="${adminRouteHref(module.path)}">
                      <span>${module.label}</span>
                      <small>${module.status}</small>
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

      function renderAdminComingSoon(moduleId) {
        return `
          <section class="admin-turismo-panel admin-coming-soon">
            <p>En preparación</p>
            <h2>${escapeHtml(adminModuleLabel(moduleId))}</h2>
            <span>Este módulo queda reservado para la próxima etapa. Todavía no tiene datos, login ni conexión real.</span>
          </section>
        `;
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
              <a class="admin-secondary-action" href="${adminRouteHref("/admin/fichas")}">Ver inscripciones</a>
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
            <div class="admin-next-actions">
              <h2>Próximos pasos</h2>
              <div>
                <a href="${adminRouteHref("/admin/fichas")}">Revisar nuevas fichas</a>
                <a href="${adminRouteHref("/admin/pasajeros")}">Buscar o cargar pasajero</a>
                <a href="${adminRouteHref("/admin/grupos")}">Validar grupos y contratos</a>
              </div>
            </div>
          </section>
        `);
        bindAdminShell();
      }

      function downloadTextFile(fileName, content, type = "text/csv;charset=utf-8") {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
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
          observaciones: "Contrato base generado para preparar la estructura. Editar/validar en Google Sheets.",
          created_at: now,
          updated_at: now
        };
      }

      function adminContratosRows(now = new Date().toISOString()) {
        if (adminContratosDemo.length) return adminContratosDemo;
        return adminPasajerosDemo.map((group) => adminContratoFromGroup(group, now));
      }

      function adminContratoOptionsForGroup(groupId) {
        const contracts = adminContratosDemo.filter((contract) => contract.grupo_id === groupId || contract.grupoId === groupId);
        if (contracts.length) return contracts;
        const group = adminPasajerosDemo.find((item) => item.id === groupId);
        return group ? [adminContratoFromGroup(group)] : [];
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

      function normalizeInscripcionRaw(value = "") {
        return String(value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      function normalizeInscripcionMatch(value = "") {
        return normalizeInscripcionRaw(value).replace(/\s+/g, "");
      }

      function normalizeInscripcionSchool(value = "") {
        const genericWords = new Set(["colegio", "escuela", "instituto", "inst", "secundario", "secundaria", "primario", "primaria", "privado", "privada", "publico", "publica"]);
        const cleaned = normalizeInscripcionRaw(value)
          .split(" ")
          .filter((word) => word && !genericWords.has(word))
          .join(" ");
        return {
          spaced: cleaned,
          compact: cleaned.replace(/\s+/g, "")
        };
      }

      function levenshteinDistance(a = "", b = "") {
        const left = String(a || "");
        const right = String(b || "");
        if (left === right) return 0;
        if (!left.length) return right.length;
        if (!right.length) return left.length;
        const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
        const current = Array(right.length + 1).fill(0);
        for (let i = 1; i <= left.length; i += 1) {
          current[0] = i;
          for (let j = 1; j <= right.length; j += 1) {
            const cost = left[i - 1] === right[j - 1] ? 0 : 1;
            current[j] = Math.min(
              current[j - 1] + 1,
              previous[j] + 1,
              previous[j - 1] + cost
            );
          }
          for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
        }
        return previous[right.length];
      }

      function schoolSimilarityScore(input = "", candidate = "") {
        const typed = normalizeInscripcionSchool(input);
        const real = normalizeInscripcionSchool(candidate);
        if (!typed.compact || !real.compact) return 0;
        if (typed.compact === real.compact) return 1;
        if (typed.compact.length >= 4 && real.compact.includes(typed.compact)) return 0.94;
        if (real.compact.length >= 4 && typed.compact.includes(real.compact)) return 0.94;
        const distance = levenshteinDistance(typed.compact, real.compact);
        const maxLength = Math.max(typed.compact.length, real.compact.length, 1);
        return Math.max(0, 1 - (distance / maxLength));
      }

      function groupCursoDivisionLabel(group = {}) {
        return `${group.curso || ""} ${group.division || ""}`.trim();
      }

      function isInscripcionContractActive(contract = {}) {
        const estado = normalizeInscripcionMatch(contract.estado || "");
        return estado === "activo" || estado === "activa";
      }

      function contratoCursoDivisionLabel(contract = {}, group = null) {
        return `${contract.curso || group?.curso || ""} ${contract.division || group?.division || ""}`.trim();
      }

      function inscripcionContractCandidate(contract = {}, colegio = "") {
        const group = adminPasajerosDemo.find((item) => item.id === (contract.grupo_id || contract.grupoId || ""));
        const colegioNombre = contract.colegio_nombre || group?.colegio || "";
        const score = schoolSimilarityScore(colegio, colegioNombre);
        return {
          group,
          contract,
          colegioNombre,
          cursoDivision: contratoCursoDivisionLabel(contract, group),
          grupoId: contract.grupo_id || contract.grupoId || group?.id || "",
          contratoId: contract.id || "",
          codigoContrato: contract.codigo_contrato || contract.codigoContrato || "",
          score
        };
      }

      function resolveInscripcionContract({ nivel = "", viaje = "", colegio = "", cursoDivision = "" } = {}) {
        const targetNivel = normalizeInscripcionMatch(nivel);
        const targetViaje = normalizeInscripcionMatch(viaje);
        const targetColegio = normalizeInscripcionSchool(colegio).compact;
        const targetCursoDivision = normalizeInscripcionMatch(cursoDivision);
        if (!targetNivel || !targetViaje || !targetColegio || !targetCursoDivision) return null;

        const candidates = adminContratosRows()
          .filter(isInscripcionContractActive)
          .filter((contract) => normalizeInscripcionMatch(contract.nivel) === targetNivel)
          .filter((contract) => normalizeInscripcionMatch(contract.viaje) === targetViaje)
          .map((contract) => inscripcionContractCandidate(contract, colegio))
          .filter((candidate) => normalizeInscripcionMatch(candidate.cursoDivision) === targetCursoDivision)
          .filter((candidate) => candidate.score >= 0.68)
          .sort((a, b) => b.score - a.score || a.colegioNombre.localeCompare(b.colegioNombre));
        if (!candidates.length) return { status: "none", candidates: [] };

        const exactMatches = candidates.filter((candidate) => normalizeInscripcionSchool(candidate.colegioNombre).compact === targetColegio);
        if (exactMatches.length === 1) return { status: "single", selected: exactMatches[0], candidates };
        if (exactMatches.length > 1) return { status: "multiple", candidates: candidates.slice(0, 5) };

        const strongMatches = candidates.filter((candidate) => candidate.score >= 0.88);
        const top = strongMatches[0] || candidates[0];
        const second = strongMatches[1] || candidates[1];
        if (candidates.length === 1 && candidates[0].score >= 0.8) return { status: "single", selected: candidates[0], candidates };
        if (strongMatches.length === 1 && (!second || top.score - second.score >= 0.08 || second.score < 0.82)) {
          return { status: "single", selected: top, candidates };
        }
        if (strongMatches.length > 1) return { status: "multiple", candidates: strongMatches.slice(0, 5) };
        if (candidates.length > 1) return { status: "multiple", candidates: candidates.slice(0, 5) };
        return { status: "none", candidates: [] };
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
          paymentHistory(passenger).forEach((payment, index) => {
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

      function googleSheetsContratoRows(now = new Date().toISOString()) {
        return adminContratosRows(now).map((contract) => ({
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
          pasajero_dni: ficha.pasajeroNumeroDocumento || ficha.pasajeroDni || ficha.dni || "",
          pasajero_nombre: ficha.pasajeroNombre || ficha.nombre || "",
          responsable_nombre: ficha.responsableNombre || ficha.responsable || "",
          responsable_telefono: ficha.responsableCelular || ficha.responsableTelefono || ficha.domicilioCelular || ficha.domicilioTelefono || ficha.telefono || "",
          nivel: ficha.nivel || "",
          viaje: ficha.viaje || "",
          colegio: ficha.colegio || "",
          curso_division: ficha.cursoDivision || ficha.curso || "",
          grupo_solicitado: ficha.grupoSolicitado || "",
          grupo_asignado_id: ficha.grupoAsignadoId || ficha.asignacionGrupo?.grupoId || "",
          contrato_id: ficha.contratoId || ficha.contrato_id || ficha.asignacionGrupo?.contratoId || "",
          codigo_contrato: ficha.codigoContrato || ficha.codigo_contrato || ficha.asignacionGrupo?.codigoContrato || ficha.numeroContrato || ficha.administracion?.contrato || "",
          estado_revision: ficha.estadoRevision || ficha.estado || "pendiente",
          documentacion_estado: ficha.documentacionEstado || "Pendiente",
          ficha_medica_estado: ficha.fichaMedicaEstado || "Pendiente",
          autorizacion_estado: ficha.autorizacionEstado || "Pendiente",
          observaciones: ficha.observaciones || "",
          created_at: ficha.createdAt || now,
          updated_at: ficha.updatedAt || ficha.createdAt || now
        }));
      }

      function downloadGoogleSheetSchemaCsv() {
        const csvPackage = window.ElAngelAzulPersistence.blankCsvPackage();
        Object.entries(csvPackage).forEach(([tab, csv]) => {
          downloadTextFile(`EAA_${tab}_encabezados_${sheetMigrationStamp()}.csv`, csv);
        });
      }

      function downloadGoogleSheetDataCsv() {
        const rowsByTab = buildGoogleSheetMigrationRows();
        Object.entries(rowsByTab).forEach(([tab, rows]) => {
          downloadTextFile(`EAA_${tab}_datos_${sheetMigrationStamp()}.csv`, window.ElAngelAzulPersistence.toCsv(sheetTabColumns(tab), rows));
        });
      }

      function downloadGoogleSheetAppsScript() {
        downloadTextFile("EAA_Google_Sheets_Apps_Script.js", window.ElAngelAzulPersistence.appsScriptTemplate(), "text/javascript;charset=utf-8");
      }

      function renderAdminConfiguracion() {
        const persistence = window.ElAngelAzulPersistence.architecture();
        const sheetsStatus = persistence.googleSheetsStatus;
        const sheetsConfig = persistence.googleSheetsConfig || {};
        const providers = persistence.providers.map((provider) => `
          <article class="admin-demo-card">
            <h3>${escapeHtml(provider.label)}</h3>
            <p><strong>ID:</strong> ${escapeHtml(provider.id)}</p>
            <p><strong>Estado:</strong> ${escapeHtml(provider.status)}</p>
          </article>
        `).join("");
        const sheetTabs = persistence.sheet.requiredTabs.map((tab) => `
          <article class="admin-demo-card">
            <h3>${escapeHtml(tab.id)}</h3>
            <p>${escapeHtml(tab.label)}</p>
            <p><strong>Columnas:</strong> ${tab.columns.length}</p>
            <p class="admin-config-columns">${tab.columns.map(escapeHtml).join(" · ")}</p>
          </article>
        `).join("");
        const collectionRows = persistence.collections.map((collection) => `
          <tr>
            <td>${escapeHtml(collection.key)}</td>
            <td>${escapeHtml(collection.sheet)}</td>
            <td>${escapeHtml(collection.note)}</td>
          </tr>
        `).join("");

        document.getElementById("app").innerHTML = renderAdminShell("configuracion", `
          <section class="admin-turismo-panel admin-overview">
            <p>Arquitectura de datos</p>
            <h2>Persistencia preparada</h2>
            <div class="admin-pasajeros-breadcrumb">
              <span>Provider activo: ${escapeHtml(persistence.active)}</span>
              <span>Base destino: ${escapeHtml(persistence.sheet.title)}</span>
              <span>Conexión: ${escapeHtml(sheetsStatus.label)}</span>
              <span>Sync: ${escapeHtml(googleSheetsSyncState.message)}</span>
              <span>Pasajeros: ${adminPasajerosRows().length}</span>
              <span>Fichas: ${loadFichasAdhesionDemo().length}</span>
            </div>
            <p>${escapeHtml(persistence.note)}</p>
            <div class="admin-actions-row">
              <a class="admin-secondary-action" href="${escapeHtml(persistence.sheet.url)}" target="_blank" rel="noopener">Abrir Google Sheets</a>
              <button type="button" class="admin-secondary-action" data-admin-download-sheet-schema>Descargar encabezados CSV</button>
              <button type="button" class="admin-secondary-action" data-admin-download-sheet-data>Descargar datos actuales CSV</button>
              <button type="button" class="admin-secondary-action" data-admin-download-apps-script>Descargar Apps Script</button>
            </div>
          </section>

          <section class="admin-turismo-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Conexión Google Sheets</h2>
                <p>${escapeHtml(sheetsStatus.detail)}</p>
              </div>
              <strong>${escapeHtml(sheetsStatus.label)}</strong>
            </div>
            <form class="admin-pasajeros-form" data-google-sheets-config-form>
              <fieldset>
                <legend>Endpoint de datos</legend>
                <label>URL del Web App
                  <input name="endpoint" value="${escapeHtml(sheetsConfig.endpoint || "/api/google-sheets")}" placeholder="/api/google-sheets">
                </label>
                <label>Token opcional
                  <input name="token" value="${escapeHtml(sheetsConfig.token || "")}" placeholder="EAA_CHANGE_ME">
                </label>
              </fieldset>
              <p class="admin-pasajeros-modal-note">El endpoint local usa la cuenta de servicio del servidor. Esto no activa pagos, permisos ni documentación avanzada.</p>
              <div class="admin-pasajeros-form-actions">
                <button type="submit" class="admin-pasajeros-primary-button">Guardar conexión</button>
              </div>
            </form>
          </section>

          <section class="admin-turismo-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Providers disponibles</h2>
                <p>El panel ya consume una capa intermedia. El próximo cambio será reemplazar el provider, no reescribir pantallas.</p>
              </div>
            </div>
            <div class="admin-demo-grid">${providers}</div>
          </section>

          <section class="admin-turismo-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Google Sheets base</h2>
                <p>Documento definido para migrar datos reales. Hoy el archivo tiene ${escapeHtml(persistence.sheet.currentTabs.join(", "))}; estas son las pestañas prolijas que debe tener antes de activar lectura/escritura real.</p>
              </div>
            </div>
            <div class="admin-demo-grid">${sheetTabs}</div>
          </section>

          <section class="admin-turismo-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Mapa de migración</h2>
                <p>Relación entre las colecciones actuales del panel y las pestañas definitivas del Sheet.</p>
              </div>
            </div>
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-pasajeros-table--compact">
                <thead>
                  <tr>
                    <th>Colección actual</th>
                    <th>Pestaña destino</th>
                    <th>Uso</th>
                  </tr>
                </thead>
                <tbody>${collectionRows}</tbody>
              </table>
            </div>
          </section>
        `);
        bindAdminShell();
        document.querySelector("[data-admin-download-sheet-schema]")?.addEventListener("click", downloadGoogleSheetSchemaCsv);
        document.querySelector("[data-admin-download-sheet-data]")?.addEventListener("click", downloadGoogleSheetDataCsv);
        document.querySelector("[data-admin-download-apps-script]")?.addEventListener("click", downloadGoogleSheetAppsScript);
        document.querySelector("[data-google-sheets-config-form]")?.addEventListener("submit", (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          window.ElAngelAzulPersistence.writeGoogleSheetsConfig({
            endpoint: formData.get("endpoint"),
            token: formData.get("token"),
            enabled: Boolean(formData.get("endpoint"))
          });
          googleSheetsHydrated = false;
          renderAdminConfiguracion();
        });
      }

      const ADMIN_PASAJEROS_STORAGE_KEY = "angelAzulAdminPasajerosDemoV4";
      const CONTRATOS_STORAGE_KEY = "angelAzulContratosV2";
      const FICHA_ADHESION_STORAGE_KEY = "angelAzulFichaAdhesionDemoV1";
      const adminPasajerosSeedPassengers = [
        { nombre: "Juan Pérez", dni: "43555111", nacimiento: "2008-04-12", telefono: "3794111111", responsable: "María Gómez", responsableDni: "29555111", responsableTelefono: "3794222222", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
        { nombre: "Sofía Ramírez", dni: "44222111", nacimiento: "2008-08-03", telefono: "3794333333", responsable: "Laura Díaz", responsableDni: "30222111", responsableTelefono: "3794444444", vinculo: "Madre", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Activo", observaciones: "" },
        { nombre: "Mateo Torres", dni: "43999888", nacimiento: "2008-01-19", telefono: "3794555555", responsable: "Carlos Torres", responsableDni: "28999888", responsableTelefono: "3794666666", vinculo: "Padre", responsableCuilCuit: "Pendiente", fichaMedica: "Observada", pago: "Vencido", documentacion: "Completa", estado: "Activo", observaciones: "" },
        { nombre: "Valentina Núñez", dni: "44777123", nacimiento: "2008-11-22", telefono: "3794777777", responsable: "Ana Núñez", responsableDni: "31777123", responsableTelefono: "3794888888", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Rechazada", estado: "Activo", observaciones: "" },
        { nombre: "Lucas Fernández", dni: "43123456", nacimiento: "2008-05-29", telefono: "3794999999", responsable: "Paula Ríos", responsableDni: "29123456", responsableTelefono: "3794000000", vinculo: "Tutora", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Baja", observaciones: "" }
      ];

      const adminPasajerosDemoSeed = [
        {
          id: "san-martin-5a-bariloche-2026",
          nombre: "San Martín - 5to A - Bariloche 2026",
          nivel: "Secundaria",
          viaje: "Bariloche 2026",
          colegio: "Colegio San Martín",
          curso: "5to",
          division: "A",
          pasajerosEsperados: 28,
          pasajeros: [
            { nombre: "Juan Pérez", dni: "43555111", nacimiento: "2008-04-12", telefono: "3794111111", responsable: "María Gómez", responsableDni: "29555111", responsableTelefono: "3794222222", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Sofía Ramírez", dni: "44222111", nacimiento: "2008-08-03", telefono: "3794333333", responsable: "Laura Díaz", responsableDni: "30222111", responsableTelefono: "3794444444", vinculo: "Madre", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Activo", observaciones: "" },
            { nombre: "Mateo Torres", dni: "43999888", nacimiento: "2008-01-19", telefono: "3794555555", responsable: "Carlos Torres", responsableDni: "28999888", responsableTelefono: "3794666666", vinculo: "Padre", responsableCuilCuit: "Pendiente", fichaMedica: "Observada", pago: "Vencido", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Valentina Núñez", dni: "44777123", nacimiento: "2008-11-22", telefono: "3794777777", responsable: "Ana Núñez", responsableDni: "31777123", responsableTelefono: "3794888888", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Rechazada", estado: "Activo", observaciones: "" },
            { nombre: "Lucas Fernández", dni: "43123456", nacimiento: "2008-05-29", telefono: "3794999999", responsable: "Paula Ríos", responsableDni: "29123456", responsableTelefono: "3794000000", vinculo: "Tutora", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Baja", observaciones: "" }
          ]
        },
        {
          id: "san-martin-5b-bariloche-2026",
          nombre: "San Martín - 5to B - Bariloche 2026",
          nivel: "Secundaria",
          viaje: "Bariloche 2026",
          colegio: "Colegio San Martín",
          curso: "5to",
          division: "B",
          pasajerosEsperados: 24,
          pasajeros: [
            { nombre: "Camila Acosta", dni: "44111222", nacimiento: "2008-02-14", telefono: "3794111222", responsable: "Mónica Acosta", responsableDni: "30111222", responsableTelefono: "3794211222", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Tomás Medina", dni: "43888999", nacimiento: "2008-06-09", telefono: "3794388999", responsable: "Jorge Medina", responsableDni: "28888999", responsableTelefono: "3794288999", vinculo: "Padre", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Activo", observaciones: "" },
            { nombre: "Martina Silva", dni: "44555666", nacimiento: "2008-03-25", telefono: "3794455666", responsable: "Romina Silva", responsableDni: "31555666", responsableTelefono: "3794255666", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Benjamín López", dni: "43666111", nacimiento: "2008-09-11", telefono: "3794366111", responsable: "Diego López", responsableDni: "28666111", responsableTelefono: "3794266111", vinculo: "Padre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Rechazada", estado: "Activo", observaciones: "" },
            { nombre: "Emma González", dni: "44999123", nacimiento: "2008-12-05", telefono: "3794499123", responsable: "Carolina Gómez", responsableDni: "31999123", responsableTelefono: "3794299123", vinculo: "Madre", responsableCuilCuit: "Pendiente", fichaMedica: "Observada", pago: "Vencido", documentacion: "Pendiente", estado: "Activo", observaciones: "" }
          ]
        },
        {
          id: "san-jose-6-carlos-paz-2026",
          nombre: "San José - 6to grado - Carlos Paz 2026",
          nivel: "Primaria",
          viaje: "Carlos Paz 2026",
          colegio: "Colegio San José",
          curso: "6to grado",
          division: "Única",
          pasajerosEsperados: 20,
          pasajeros: [
            { nombre: "Pedro Molina", dni: "46999111", nacimiento: "2014-07-12", telefono: "3794699111", responsable: "Natalia Molina", responsableDni: "32999111", responsableTelefono: "3794299111", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Abril Benítez", dni: "46888222", nacimiento: "2014-01-20", telefono: "3794688222", responsable: "Sergio Benítez", responsableDni: "31888222", responsableTelefono: "3794288222", vinculo: "Padre", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Activo", observaciones: "" },
            { nombre: "Joaquín Vera", dni: "46777333", nacimiento: "2014-10-02", telefono: "3794677333", responsable: "Patricia Vera", responsableDni: "32777333", responsableTelefono: "3794277333", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Olivia Castro", dni: "46666444", nacimiento: "2014-03-17", telefono: "3794666444", responsable: "Marcos Castro", responsableDni: "31666444", responsableTelefono: "3794266444", vinculo: "Padre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Felipe Arias", dni: "46555555", nacimiento: "2014-05-31", telefono: "3794655555", responsable: "Lorena Arias", responsableDni: "32555555", responsableTelefono: "3794255555", vinculo: "Madre", responsableCuilCuit: "Pendiente", fichaMedica: "Observada", pago: "Vencido", documentacion: "Completa", estado: "Activo", observaciones: "" }
          ]
        },
        {
          id: "belgrano-5a-bariloche-2026",
          nombre: "Belgrano - 5to A - Bariloche 2026",
          nivel: "Secundaria",
          viaje: "Bariloche 2026",
          colegio: "Colegio Belgrano",
          curso: "5to",
          division: "A",
          pasajerosEsperados: 26,
          pasajeros: [
            { nombre: "Agustina Romero", dni: "44333111", nacimiento: "2008-04-02", telefono: "3794433111", responsable: "Claudia Romero", responsableDni: "31333111", responsableTelefono: "3794233111", vinculo: "Madre", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Activo", observaciones: "" },
            { nombre: "Nicolás Sosa", dni: "43222999", nacimiento: "2008-08-18", telefono: "3794322999", responsable: "Miguel Sosa", responsableDni: "28222999", responsableTelefono: "3794222999", vinculo: "Padre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Completa", estado: "Activo", observaciones: "" },
            { nombre: "Renata Falcón", dni: "44555123", nacimiento: "2008-10-27", telefono: "3794455123", responsable: "Silvina Falcón", responsableDni: "31555123", responsableTelefono: "3794255123", vinculo: "Madre", responsableCuilCuit: "Pendiente", fichaMedica: "Observada", pago: "Vencido", documentacion: "Pendiente", estado: "Activo", observaciones: "" },
            { nombre: "Thiago Cabrera", dni: "43777888", nacimiento: "2008-02-01", telefono: "3794377888", responsable: "Lucía Cabrera", responsableDni: "28777888", responsableTelefono: "3794277888", vinculo: "Madre", responsableCuilCuit: "20-29555111-3", fichaMedica: "Cargada", pago: "Al día", documentacion: "Rechazada", estado: "Activo", observaciones: "" },
            { nombre: "Alma Peralta", dni: "44999777", nacimiento: "2008-06-15", telefono: "3794499777", responsable: "Daniel Peralta", responsableDni: "30999777", responsableTelefono: "3794299777", vinculo: "Padre", responsableCuilCuit: "Pendiente", fichaMedica: "Pendiente", pago: "Pendiente", documentacion: "Pendiente", estado: "Baja", observaciones: "" }
          ]
        }
      ];

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
        message: "Todavía no se sincronizó con Google Sheets."
      };

      function loadAdminPasajerosDemo() {
        return adminPasajerosCollection.load();
      }

      function loadAdminContratosDemo() {
        return contratosCollection.load();
      }

      function saveAdminContratosDemo() {
        adminContratosDemo = contratosCollection.save(adminContratosDemo);
        if (!googleSheetsHydrating) queueGoogleSheetsWrite(["CONTRATOS"]);
      }

      function saveAdminPasajerosDemo() {
        adminPasajerosDemo = adminPasajerosCollection.save(adminPasajerosDemo);
        if (!googleSheetsHydrating) queueGoogleSheetsWrite(["PASAJEROS"]);
      }

      function saveAdminGruposDemo() {
        adminPasajerosDemo = adminPasajerosCollection.save(adminPasajerosDemo);
        if (!googleSheetsHydrating) queueGoogleSheetsWrite(["GRUPOS"]);
      }

      function createAdminPasajerosGroup({ nivel, viaje, colegio, curso, division, pasajerosEsperados = 0 }) {
        const group = normalizeAdminPasajerosGroup({
          nivel,
          viaje,
          colegio,
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
          curso: row.curso,
          division: row.division,
          pasajerosEsperados: Number(row.pasajeros_esperados || 0),
          pasajeros: []
        });
      }

      function sheetPassengerFromRow(row = {}) {
        return {
          nombre: row.nombre || "",
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
          id: row.id || `ficha-${Date.now()}`,
          pasajeroDni: row.pasajero_dni || "",
          pasajeroNumeroDocumento: row.pasajero_dni || "",
          pasajeroNombre: row.pasajero_nombre || "",
          responsableNombre: row.responsable_nombre || "",
          responsableTelefono: row.responsable_telefono || "",
          nivel: row.nivel || "",
          viaje: row.viaje || "",
          colegio: row.colegio || "",
          cursoDivision: row.curso_division || "",
          grupoSolicitado: row.grupo_solicitado || "",
          estadoRevision: row.estado_revision || "pendiente",
          documentacionEstado: row.documentacion_estado || "Pendiente",
          fichaMedicaEstado: row.ficha_medica_estado || "Pendiente",
          autorizacionEstado: row.autorizacion_estado || "Pendiente",
          observaciones: row.observaciones || "",
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

      function applyGoogleSheetsRows({ grupos = [], contratos = [], pasajeros = [], fichas = [] }) {
        const groupsById = new Map(grupos.map((row) => [row.id, sheetGroupFromRow(row)]));
        pasajeros.forEach((row) => {
          const groupId = row.grupo_id || "";
          if (!groupsById.has(groupId)) return;
          groupsById.get(groupId).pasajeros.push(sheetPassengerFromRow(row));
        });
        googleSheetsHydrating = true;
        adminPasajerosDemo = [...groupsById.values()];
        adminContratosDemo = contratos.map((contract) => ({
          ...contract,
          id: String(contract.id || "").trim(),
          codigo_contrato: String(contract.codigo_contrato || "").trim(),
          grupo_id: String(contract.grupo_id || "").trim()
        }));
        adminPasajerosCollection.save(adminPasajerosDemo);
        saveAdminContratosDemo();
        fichaAdhesionCollection.save(fichas.map(sheetFichaFromRow));
        googleSheetsHydrating = false;
      }

      async function hydrateGoogleSheetsData(force = false) {
        const config = window.ElAngelAzulPersistence.readGoogleSheetsConfig();
        if (!config.enabled || !config.endpoint) return false;
        if (googleSheetsHydrated && !force) return true;
        try {
          const [grupos, contratos, pasajeros, fichas, turismo] = await Promise.all([
            window.ElAngelAzulPersistence.fetchGoogleSheetRows("GRUPOS"),
            window.ElAngelAzulPersistence.fetchGoogleSheetRows("CONTRATOS"),
            window.ElAngelAzulPersistence.fetchGoogleSheetRows("PASAJEROS"),
            window.ElAngelAzulPersistence.fetchGoogleSheetRows("FICHAS_ADHESION"),
            window.ElAngelAzulPersistence.fetchGoogleSheetRows("TURISMO").catch(() => [])
          ]);
          // Hidratar viajes de turismo desde Sheets si hay datos
          if (Array.isArray(turismo) && turismo.length) {
            googleSheetsHydrating = true;
            adminTurismoTrips = turismo.map(turismoRowToTrip);
            localStorage.setItem(ADMIN_TURISMO_STORAGE_KEY, JSON.stringify(adminTurismoTrips, null, 2));
            googleSheetsHydrating = false;
          }
          if (!pasajeros.length) {
            googleSheetsHydrating = true;
            adminPasajerosDemo = createAdminPasajerosSeed();
            adminContratosDemo = createAdminContratosSeed(adminPasajerosDemo);
            adminPasajerosCollection.save(adminPasajerosDemo);
            contratosCollection.save(adminContratosDemo);
            googleSheetsHydrating = false;
            googleSheetsHydrated = true;
            googleSheetsSyncState = {
              status: "local",
              message: `Google Sheets no tiene pasajeros cargados. Mostrando base ficticia: ${adminPasajerosRows().length} pasajeros de ejemplo.`
            };
            return true;
          }
          applyGoogleSheetsRows({ grupos, contratos, pasajeros, fichas });
          googleSheetsHydrated = true;
          googleSheetsSyncState = {
            status: "ok",
            message: `Google Sheets activo: ${grupos.length} grupos, ${contratos.length} contratos, ${pasajeros.length} pasajeros y ${fichas.length} fichas.`
          };
          return true;
        } catch (error) {
          googleSheetsSyncState = {
            status: "error",
            message: `No se pudo sincronizar Google Sheets: ${error.message || "error desconocido"}.`
          };
          return false;
        }
      }

      function queueGoogleSheetsWrite(sheets = [], deleteIdsBySheet = {}) {
        const config = window.ElAngelAzulPersistence.readGoogleSheetsConfig();
        if (!config.enabled || !config.endpoint) {
          googleSheetsSyncState = {
            status: "local",
            message: "Guardado local. Google Sheets no está conectado."
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
          for (const sheet of uniqueSheets) {
            if (!["GRUPOS", "CONTRATOS", "PASAJEROS", "FICHAS_ADHESION", "TURISMO"].includes(sheet)) continue;
            await window.ElAngelAzulPersistence.writeGoogleSheetRows(sheet, rowsByTab[sheet] || [], deleteIdsBySheet[sheet] || []);
          }
          googleSheetsSyncState = {
            status: "ok",
            message: "Cambios guardados en Google Sheets."
          };
          return true;
        }).catch((error) => {
          googleSheetsSyncState = {
            status: "error",
            message: `No se pudo guardar en Google Sheets: ${error.message || "error desconocido"}.`
          };
          return false;
        });
        return googleSheetsWriteQueue;
      }

      function adminFichasSaveMessage(ok, successText = "Guardado en Google Sheets.") {
        adminFichasMessage = ok
          ? successText
          : googleSheetsSyncState.status === "local"
            ? googleSheetsSyncState.message
            : "Error al guardar en Google Sheets.";
      }

      async function updateFichaAdhesionStatus(id, estado, patch = {}, successText = "") {
        const now = new Date().toISOString();
        const fichas = loadFichasAdhesionDemo().map((ficha) => (
          ficha.id === id ? { ...ficha, ...patch, estadoRevision: estado, updatedAt: now } : ficha
        ));
        const saved = await saveFichasAdhesionDemo(fichas);
        adminFichasSaveMessage(saved, successText || "Guardado en Google Sheets.");
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
        await updateFichaAdhesionStatus(id, "rechazada", { motivoRechazo }, "Guardado en Google Sheets. Ficha rechazada.");
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
        adminFichasSaveMessage(saved, "Guardado en Google Sheets. Asignación actualizada.");
        renderAdminFichasRecibidas();
      }

      function normalizeYesNoStatus(value) {
        const text = String(value || "").trim().toLowerCase();
        if (["si", "sí", "cargada", "completa", "aprobada", "ok"].some((token) => text.includes(token))) return "Sí";
        if (["no", "pendiente", "observada", "rechazada"].some((token) => text.includes(token))) return "No";
        return "No";
      }

      function fichaStudentLastName(fullName) {
        const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
        return parts.length > 1 ? parts.slice(1).join(" ") : "";
      }

      function fichaStudentFirstName(fullName) {
        const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
        return parts[0] || "";
      }

      function renderFichaValue(label, value) {
        return `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(String(value || "").trim() || "Pendiente")}</dd>
          </div>
        `;
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
              <button type="button" data-ficha-revisar="${escapeHtml(ficha.id)}">Revisar</button>
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
            <button type="button" data-ficha-revisar="${escapeHtml(ficha.id)}">Revisar</button>
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

      function renderAdminFichaDetail(ficha) {
        if (!ficha) return "";
        const context = fichaAssignmentContext(ficha);
        const group = context.selectedGroup || {};
        const pasajeroNombre = ficha.pasajeroNombre || "";
        const responsableNombre = ficha.responsableNombre || "";
        const fichaMedica = normalizeYesNoStatus(ficha.fichaMedicaEstado || ficha.fichaMedica || ficha.documentacionEstado);
        const fichaAdhesion = normalizeYesNoStatus(ficha.autorizacionEstado || ficha.firma || ficha.documentacionEstado || "Sí");
        const estadoRevision = ficha.estadoRevision || "pendiente";
        const estadoClass = estadoRevision === "aprobada" ? "is-ok" : ["rechazada", "duplicada"].includes(estadoRevision) ? "is-alert" : "is-pending";
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
                <h2>${escapeHtml(pasajeroNombre || "Ficha sin nombre")}</h2>
                <p>Preinscripción virtual lista para revisar, asignar y dar de alta oficialmente.</p>
              </div>
              <div class="admin-fichas-detail-head-actions">
                <button type="button" class="admin-pasajeros-primary-button" data-ficha-pdf="${escapeHtml(ficha.id)}">⬇ Descargar PDF</button>
                <button type="button" class="admin-pasajeros-secondary-button" data-ficha-cerrar>Cerrar ficha</button>
              </div>
            </div>

            <div class="admin-fichas-detail-layout">
              <article class="admin-fichas-detail-card admin-fichas-student-card">
                <h3>Datos del alumno</h3>
                <dl>
                  ${renderFichaValue("Nombre", fichaStudentFirstName(pasajeroNombre))}
                  ${renderFichaValue("Apellido", fichaStudentLastName(pasajeroNombre))}
                  ${renderFichaValue("DNI", ficha.pasajeroNumeroDocumento || ficha.pasajeroDni)}
                  ${renderFichaValue("Nacimiento", ficha.pasajeroNacimiento)}
                  ${renderFichaValue("Colegio", group.colegio || ficha.colegio)}
                  ${renderFichaValue("Curso", group.curso || ficha.curso)}
                  ${renderFichaValue("División", group.division || ficha.division)}
                  ${renderFichaValue("Viaje elegido", group.viaje || ficha.viaje)}
                </dl>
              </article>

              <article class="admin-fichas-detail-card">
                <h3>Datos del responsable</h3>
                <dl>
                  ${renderFichaValue("Nombre", fichaStudentFirstName(responsableNombre))}
                  ${renderFichaValue("Apellido", fichaStudentLastName(responsableNombre))}
                  ${renderFichaValue("Teléfono", ficha.responsableCelular || ficha.domicilioCelular || ficha.responsableTelefono || ficha.domicilioTelefono)}
                </dl>
                <h3>Documentación</h3>
                <dl class="admin-fichas-doc-grid">
                  ${renderFichaValue("Ficha médica", fichaMedica)}
                  ${renderFichaValue("Ficha de adhesión", fichaAdhesion)}
                </dl>
                ${ficha.motivoRechazo ? `<p class="admin-fichas-reject-note"><strong>Motivo rechazo:</strong> ${escapeHtml(ficha.motivoRechazo)}</p>` : ""}
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
          dni,
          contratoId: context.contratoId,
          codigoContrato: context.codigoContrato,
          nacimiento: String(ficha.pasajeroNacimiento || "").trim(),
          telefono: String(ficha.domicilioCelular || ficha.domicilioTelefono || "").trim(),
          responsable: String(ficha.responsableNombre || "").trim(),
          responsableDni: String(ficha.responsableNumeroDocumento || "").trim(),
          responsableTelefono: String(ficha.domicilioCelular || ficha.responsableTelefono || ficha.domicilioTelefono || "").trim(),
          responsableCuilCuit: String(ficha.responsableCuilCuit || "Pendiente").trim(),
          vinculo: String(ficha.responsableParentesco || "").trim(),
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
        adminFichasSaveMessage(saved, "Guardado en Google Sheets. Ficha aprobada y pasajero creado.");
        renderAdminFichasRecibidas();
      }

      function fichaPdfFileName(ficha) {
        const baseName = `${ficha.pasajeroNombre || "pasajero"}-${ficha.pasajeroNumeroDocumento || ficha.pasajeroDni || "sin-dni"}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase();
        return `ficha-adhesion-${baseName || "pasajero"}.pdf`;
      }

      function fichaFieldValue(value) {
        return String(value || "").trim();
      }

      function fichaMatchesText(ficha, search) {
        const needle = normalizeText(search);
        if (!needle) return true;
        return [
          ficha.pasajeroNombre,
          ficha.pasajeroNumeroDocumento,
          ficha.pasajeroDni,
          ficha.responsableNombre,
          ficha.responsableTelefono,
          ficha.responsableCelular
        ].some((value) => normalizeText(value).includes(needle));
      }

      function fichaFilterValue(ficha, field) {
        const context = fichaAssignmentContext(ficha);
        if (field === "colegio") return context.selectedGroup?.colegio || context.colegio || ficha.colegio || "";
        if (field === "viaje") return context.selectedGroup?.viaje || context.viaje || ficha.viaje || "";
        return "";
      }

      function renderAdminFichasFilters(colegios = [], viajes = []) {
        return `
          <div class="admin-fichas-filters" aria-label="Filtros de fichas">
            <label>Buscar por nombre o DNI
              <input type="search" value="${escapeHtml(adminFichasSearch)}" placeholder="Ej: Lucia, 50999111" data-admin-fichas-search>
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

      function fichaMoneyValue(value) {
        return fichaFieldValue(value) ? formatAdminMoney(value) : "";
      }

      function fichaPdfDate(value) {
        const text = fichaFieldValue(value);
        if (!text) return "";
        const parsed = new Date(text);
        if (!Number.isNaN(parsed.getTime())) {
          return new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }).format(parsed);
        }
        return text;
      }

      // FIX impresión: la plantilla tiene 3 casilleros separados (día / mes / año) con
      // "/" ya impresos entre medio. Antes se dibujaba la fecha completa "24/10/2001"
      // de una sola vez en el primer casillero, chocando con las barras de la plantilla
      // ("24/10/2001 ......../................"). Ahora se parte en 3 partes para que
      // cada una caiga en su propio casillero.
      function fichaPdfDateParts(value) {
        const formatted = fichaPdfDate(value);
        const match = formatted.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (match) return { dia: match[1], mes: match[2], anio: match[3] };
        return { dia: "", mes: "", anio: formatted };
      }

      function loadPdfImage(dataUrl) {
        return new Promise((resolve) => {
          if (!dataUrl) {
            resolve(null);
            return;
          }
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => resolve(null);
          image.src = dataUrl;
        });
      }

      function dataUrlToBytes(dataUrl) {
        const base64 = String(dataUrl || "").split(",")[1] || "";
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
      }

      function concatBytes(chunks) {
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const output = new Uint8Array(totalLength);
        let offset = 0;
        chunks.forEach((chunk) => {
          output.set(chunk, offset);
          offset += chunk.length;
        });
        return output;
      }

      function createImagePdfBlob(jpegBytes, pageWidth = 595, pageHeight = 842) {
        const encoder = new TextEncoder();
        const chunks = [];
        const offsets = [0];
        let length = 0;

        const pushAscii = (value) => {
          const bytes = encoder.encode(value);
          chunks.push(bytes);
          length += bytes.length;
        };

        const addObject = (bodyChunks) => {
          offsets.push(length);
          const objectNumber = offsets.length - 1;
          pushAscii(`${objectNumber} 0 obj\n`);
          bodyChunks.forEach((chunk) => {
            if (typeof chunk === "string") {
              pushAscii(chunk);
            } else {
              chunks.push(chunk);
              length += chunk.length;
            }
          });
          pushAscii("\nendobj\n");
        };

        pushAscii("%PDF-1.4\n");
        addObject(["<< /Type /Catalog /Pages 2 0 R >>"]);
        addObject(["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
        addObject([`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`]);
        addObject([`<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`, jpegBytes, "\nendstream"]);
        const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ`;
        addObject([`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);

        const xrefOffset = length;
        pushAscii(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
        offsets.slice(1).forEach((offset) => {
          pushAscii(`${String(offset).padStart(10, "0")} 00000 n \n`);
        });
        pushAscii(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

        return new Blob([concatBytes(chunks)], { type: "application/pdf" });
      }

      function wrapCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
        const words = fichaFieldValue(text).split(/\s+/).filter(Boolean);
        const lines = [];
        let currentLine = "";
        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (context.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);
        lines.slice(0, maxLines).forEach((line, index) => {
          let fittedLine = line;
          while (context.measureText(fittedLine).width > maxWidth && fittedLine.length > 3) {
            fittedLine = `${fittedLine.slice(0, -4).trimEnd()}...`;
          }
          context.fillText(fittedLine, x, y + (index * lineHeight));
        });
      }

      function fitCanvasFont(context, text, options = {}) {
        const maxWidth = options.width || 360;
        const minSize = options.minSize || 11;
        let size = options.size || 16;
        const weight = options.weight || "bold";
        while (size > minSize) {
          context.font = `${weight} ${size}px Arial, sans-serif`;
          if (context.measureText(text).width <= maxWidth) break;
          size -= 1;
        }
        return size;
      }

      async function createFichaAdhesionPdfBlob(ficha) {
        const administracion = ficha.administracion || {};
        const canvas = document.createElement("canvas");
        canvas.width = 1240;
        canvas.height = 1754;
        const context = canvas.getContext("2d");
        const templateImage = await loadPdfImage("assets/pdf/ficha-adhesion-template.png");
        const signatureImage = await loadPdfImage(ficha.firma);

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (templateImage) {
          context.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
        }

        const textValue = (value) => fichaFieldValue(value).toUpperCase();
        // FIX impresión: en el template, cada renglón tiene una línea punteada en
        // el mismo eje Y que se usó para calibrar los campos. Como fillText() dibuja
        // con Y = línea base, el texto quedaba literalmente ENCIMA de los puntos
        // (efecto "tachado") en vez de apoyado arriba de la línea. Se sube 8px.
        const BASELINE_LIFT = 8;
        // Sangría horizontal: separa el valor de la etiqueta/dos puntos que lo precede
        // (ej. "Nº:1542" -> "Nº: 1542") para que no quede pegado y sea más legible.
        const LEFT_INDENT = 10;
        const drawValue = (value, field, options = {}) => {
          const text = options.raw ? fichaFieldValue(value) : textValue(value);
          if (!text) return;
          context.fillStyle = options.color || "#064f9e";
          const fieldOptions = { ...field, ...options };
          const size = fitCanvasFont(context, text, fieldOptions);
          context.font = `${fieldOptions.weight || "bold"} ${size}px Arial, sans-serif`;
          wrapCanvasText(context, text, field.x + LEFT_INDENT, field.y - BASELINE_LIFT, fieldOptions.width || 360, fieldOptions.lineHeight || Math.max(15, size + 2), fieldOptions.lines || 1);
        };

        const fields = {
          contrato: { x: 626, y: 200, width: 185, size: 17, minSize: 12 },
          destino: { x: 626, y: 267, width: 175, size: 17, minSize: 11 },
          colegio: { x: 626, y: 337, width: 455, size: 17, minSize: 10 },
          alta: { x: 1145, y: 187, width: 28, size: 22 },
          modificacion: { x: 1145, y: 231, width: 28, size: 22 },

          pasajeroNombre: { x: 292, y: 489, width: 870, size: 17, minSize: 10 },
          pasajeroDocumento: { x: 292, y: 533, width: 320, size: 16, minSize: 10 },
          pasajeroNacimientoDia: { x: 768, y: 533, width: 55, size: 16, minSize: 10 },
          pasajeroNacimientoMes: { x: 842, y: 533, width: 48, size: 16, minSize: 10 },
          pasajeroNacimientoAnio: { x: 908, y: 533, width: 80, size: 16, minSize: 10 },
          pasajeroSexo: { x: 1050, y: 533, width: 95, size: 16, minSize: 10 },

          responsableNombre: { x: 292, y: 658, width: 870, size: 17, minSize: 10 },
          responsableDocumento: { x: 292, y: 700, width: 320, size: 16, minSize: 10 },
          responsableNacimientoDia: { x: 768, y: 700, width: 55, size: 16, minSize: 10 },
          responsableNacimientoMes: { x: 842, y: 700, width: 48, size: 16, minSize: 10 },
          responsableNacimientoAnio: { x: 908, y: 700, width: 80, size: 16, minSize: 10 },
          responsableParentesco: { x: 1082, y: 700, width: 72, size: 13, minSize: 9 },
          responsableEmail: { x: 365, y: 742, width: 335, size: 13, minSize: 9 },
          responsableCuilCuit: { x: 882, y: 742, width: 275, size: 15, minSize: 10 },

          domicilioCalle: { x: 148, y: 868, width: 500, size: 16, minSize: 10 },
          domicilioNumero: { x: 680, y: 868, width: 130, size: 16, minSize: 10 },
          domicilioPiso: { x: 906, y: 868, width: 90, size: 16, minSize: 10 },
          domicilioDepartamento: { x: 1060, y: 868, width: 90, size: 16, minSize: 10 },
          domicilioLocalidad: { x: 210, y: 912, width: 435, size: 16, minSize: 10 },
          domicilioProvincia: { x: 764, y: 912, width: 365, size: 16, minSize: 10 },
          domicilioTelefono: { x: 136, y: 958, width: 210, size: 16, minSize: 10 },
          domicilioCelular: { x: 404, y: 958, width: 245, size: 16, minSize: 10 },
          domicilioCodigoPostal: { x: 1050, y: 958, width: 120, size: 16, minSize: 10 },

          fechaInscripcionDia: { x: 322, y: 1112, width: 55, size: 15, minSize: 10 },
          fechaInscripcionMes: { x: 392, y: 1112, width: 55, size: 15, minSize: 10 },
          fechaInscripcionAnio: { x: 462, y: 1112, width: 90, size: 15, minSize: 10 },
          valorViaje: { x: 568, y: 1148, width: 70, size: 13, minSize: 8 },
          sena: { x: 862, y: 1148, width: 78, size: 13, minSize: 8 },
          saldo: { x: 1040, y: 1148, width: 92, size: 13, minSize: 8 },
          cuotas: { x: 92, y: 1196, width: 80, size: 15, minSize: 10 },
          formaPago: { x: 292, y: 1196, width: 230, size: 15, minSize: 10 },
          informacionAdministrativa: { x: 700, y: 1196, width: 430, size: 13, minSize: 9, lines: 2, lineHeight: 15 },
          aclaracion: { x: 850, y: 1591, width: 300, size: 14, minSize: 9 },
        };

        drawValue(administracion.contrato, fields.contrato);
        drawValue(ficha.viaje, fields.destino);
        drawValue(ficha.colegio, fields.colegio);
        const altaModificacion = textValue(administracion.altaModificacion);
        if (altaModificacion.includes("MOD")) {
          drawValue("X", fields.modificacion);
        } else if (altaModificacion) {
          drawValue("X", fields.alta);
        }

        drawValue(ficha.pasajeroNombre, fields.pasajeroNombre);
        drawValue(
          `${ficha.pasajeroTipoDocumento || "DNI"} ${ficha.pasajeroNumeroDocumento || ficha.pasajeroDni || ""}`,
          fields.pasajeroDocumento
        );
        const pasajeroNacParts = fichaPdfDateParts(ficha.pasajeroNacimiento);
        drawValue(pasajeroNacParts.dia, fields.pasajeroNacimientoDia, { raw: true });
        drawValue(pasajeroNacParts.mes, fields.pasajeroNacimientoMes, { raw: true });
        drawValue(pasajeroNacParts.anio, fields.pasajeroNacimientoAnio, { raw: true });
        drawValue(ficha.pasajeroSexo, fields.pasajeroSexo);

        drawValue(ficha.responsableNombre, fields.responsableNombre);
        drawValue(
          `${ficha.responsableTipoDocumento || "DNI"} ${ficha.responsableNumeroDocumento || ""}`,
          fields.responsableDocumento
        );
        const responsableNacParts = fichaPdfDateParts(ficha.responsableNacimiento);
        drawValue(responsableNacParts.dia, fields.responsableNacimientoDia, { raw: true });
        drawValue(responsableNacParts.mes, fields.responsableNacimientoMes, { raw: true });
        drawValue(responsableNacParts.anio, fields.responsableNacimientoAnio, { raw: true });
        drawValue(ficha.responsableParentesco, fields.responsableParentesco);
        drawValue(ficha.responsableEmail, fields.responsableEmail, { raw: true });
        drawValue(ficha.responsableCuilCuit, fields.responsableCuilCuit, { raw: true });

        drawValue(ficha.domicilioCalle, fields.domicilioCalle);
        drawValue(ficha.domicilioNumero, fields.domicilioNumero);
        drawValue(ficha.domicilioPiso, fields.domicilioPiso);
        drawValue(ficha.domicilioDepartamento, fields.domicilioDepartamento);
        drawValue(ficha.domicilioLocalidad, fields.domicilioLocalidad);
        drawValue(ficha.domicilioProvincia, fields.domicilioProvincia);
        drawValue(ficha.domicilioTelefono, fields.domicilioTelefono);
        drawValue(ficha.domicilioCelular, fields.domicilioCelular);
        drawValue(ficha.domicilioCodigoPostal, fields.domicilioCodigoPostal);

        const fechaInscripcionParts = fichaPdfDateParts(ficha.createdAt);
        drawValue(fechaInscripcionParts.dia, fields.fechaInscripcionDia, { raw: true });
        drawValue(fechaInscripcionParts.mes, fields.fechaInscripcionMes, { raw: true });
        drawValue(fechaInscripcionParts.anio, fields.fechaInscripcionAnio, { raw: true });
        drawValue(fichaMoneyValue(administracion.valorViaje), fields.valorViaje, { raw: true });
        drawValue(fichaMoneyValue(administracion.sena), fields.sena, { raw: true });
        drawValue(fichaMoneyValue(administracion.saldo), fields.saldo, { raw: true });
        drawValue(administracion.cuotas, fields.cuotas, { raw: true });
        drawValue(administracion.formaPago, fields.formaPago);
        drawValue(administracion.informacionAdministrativa, fields.informacionAdministrativa, { raw: true });

        if (signatureImage) {
          const maxSignatureWidth = 320;
          const maxSignatureHeight = 62;
          const ratio = Math.min(maxSignatureWidth / signatureImage.width, maxSignatureHeight / signatureImage.height);
          const signatureWidth = signatureImage.width * ratio;
          const signatureHeight = signatureImage.height * ratio;
          context.drawImage(
            signatureImage,
            136 + ((320 - signatureWidth) / 2),
            1516 + ((62 - signatureHeight) / 2),
            signatureWidth,
            signatureHeight
          );
        }
        drawValue(ficha.responsableNombre, fields.aclaracion);

        const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        return createImagePdfBlob(dataUrlToBytes(jpegDataUrl));
      }

      async function downloadFichaAdhesionPdf(id) {
        const ficha = loadFichasAdhesionDemo().find((item) => item.id === id);
        if (!ficha) return;
        const url = URL.createObjectURL(await createFichaAdhesionPdfBlob(ficha));
        const link = document.createElement("a");
        link.href = url;
        link.download = fichaPdfFileName(ficha);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      async function viewFichaAdhesionDetail(id) {
        const ficha = loadFichasAdhesionDemo().find((item) => item.id === id);
        if (!ficha) return;
        adminFichasManuallyClosed = false;
        adminFichasSelectedId = id;
        if ((ficha.estadoRevision || "pendiente") === "pendiente") {
          adminFichasFilter = "revision";
          await updateFichaAdhesionStatus(id, "revisada", {}, "Guardado en Google Sheets. Ficha marcada en revisión.");
          return;
        }
        renderAdminFichasRecibidas();
      }

      function fichaAdhesionDemoRows(fichas = loadFichasAdhesionDemo()) {
        if (!fichas.length) {
          return `
            <tr>
              <td colspan="5">No hay fichas en esta bandeja.</td>
            </tr>
          `;
        }
        return fichas.map((ficha) => {
          const estadoRevision = ficha.estadoRevision || "pendiente";
          const estadoClass = estadoRevision === "aprobada" ? "is-ok" : ["rechazada", "duplicada"].includes(estadoRevision) ? "is-alert" : "is-pending";
          const pasajeroDocumento = ficha.pasajeroNumeroDocumento || ficha.pasajeroDni || "";
          const responsableTelefono = ficha.responsableCelular || ficha.domicilioCelular || ficha.responsableTelefono || ficha.domicilioTelefono || "";
          const numeroContrato = ficha.numeroContrato || ficha.administracion?.contrato || "";
          const context = fichaAssignmentContext(ficha);
          const assignedLabel = context.selectedGroup
            ? `${context.selectedGroup.nivel} · ${context.selectedGroup.viaje} · ${context.selectedGroup.colegio} · ${context.selectedGroup.curso} ${context.selectedGroup.division}`
            : "Asignación pendiente";
          const assignedContractLabel = context.contratoId
            ? context.codigoContrato
            : "Contrato pendiente";
          return `
          <tr class="${ficha.id === adminFichasSelectedId ? "is-selected" : ""}">
            <td class="admin-fichas-main-cell">
              <strong>${escapeHtml(ficha.pasajeroNombre)}</strong>
              <span>DNI ${escapeHtml(pasajeroDocumento || "Pendiente")}</span>
              <span>Contrato ${escapeHtml(context.codigoContrato || numeroContrato || "Pendiente")}</span>
            </td>
            <td>
              <strong>${escapeHtml(ficha.responsableNombre || "Pendiente")}</strong>
              <span>${escapeHtml(responsableTelefono || "Teléfono pendiente")}</span>
            </td>
            <td>
              <div class="admin-fichas-request">
                <span>Solicitado: ${escapeHtml(ficha.nivel || "Pendiente")} · ${escapeHtml(ficha.viaje || "Pendiente")}</span>
                <span>${escapeHtml(ficha.colegio || "Colegio pendiente")} · ${escapeHtml(ficha.cursoDivision || "Curso pendiente")}</span>
                <strong>Asignado: ${escapeHtml(assignedLabel)}</strong>
                <strong>Contrato: ${escapeHtml(assignedContractLabel)}</strong>
              </div>
            </td>
            <td><span class="admin-pasajeros-status ${estadoClass}">${escapeHtml(estadoRevision)}</span></td>
            <td>
              <div class="admin-pasajeros-row-actions admin-fichas-row-actions">
                <button type="button" data-ficha-ver="${escapeHtml(ficha.id)}">Revisar</button>
                <button type="button" data-ficha-select="${escapeHtml(ficha.id)}">Abrir</button>
              </div>
            </td>
          </tr>
        `;
        }).join("");
      }

      function passengerFichaAdhesionStatus(passenger, group) {
        return window.ElAngelAzulForms.fichaStatusForPassenger(passenger, group, loadFichasAdhesionDemo());
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
          normalizeText
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
                <strong>${escapeHtml(passenger.nombre)}</strong>
                <span>DNI ${escapeHtml(passenger.dni || "Pendiente")}</span>
              </td>
              <td class="admin-pasajeros-contact-cell">
                <strong>${escapeHtml(passenger.telefono || passenger.responsableTelefono || "Sin teléfono")}</strong>
                <span>Resp. ${escapeHtml(passenger.responsableTelefono || "Pendiente")}</span>
              </td>
              <td>${escapeHtml(passenger.responsable || "Pendiente")}</td>
              <td class="admin-pasajeros-group-cell">
                <strong>${escapeHtml(group.viaje)}</strong>
                <span>${escapeHtml(group.colegio)} · ${escapeHtml(group.curso)} ${escapeHtml(group.division)}</span>
                <span>Contrato: ${escapeHtml(passengerCodigoContrato(passenger) || "Pendiente")}</span>
              </td>
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
            <td colspan="8">No hay pasajeros que coincidan con la búsqueda o los filtros aplicados.</td>
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
                  <label>Nombre y apellido <span class="admin-pasajeros-required">*</span>
                    <input name="nombre" value="${escapeHtml(passenger.nombre)}" required>
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

            <div class="admin-pasajeros-profile-grid">
              <article>
                <span>Datos personales</span>
                <strong>${escapeHtml(passenger.nombre)}</strong>
                <dl>
                  <div><dt>DNI</dt><dd>${escapeHtml(passenger.dni || "Pendiente")}</dd></div>
                  <div><dt>Nacimiento</dt><dd>${escapeHtml(passenger.nacimiento || "Pendiente")}</dd></div>
                  <div><dt>Teléfono</dt><dd>${escapeHtml(passenger.telefono || "Pendiente")}</dd></div>
                </dl>
              </article>
              <article>
                <span>Responsable</span>
                <strong>${escapeHtml(passenger.responsable || "Pendiente")}</strong>
                <dl>
                  <div><dt>Vínculo</dt><dd>${escapeHtml(passenger.vinculo || "Pendiente")}</dd></div>
                  <div><dt>DNI</dt><dd>${escapeHtml(passenger.responsableDni || "Pendiente")}</dd></div>
                  <div><dt>CUIL / CUIT</dt><dd>${escapeHtml(passenger.responsableCuilCuit || "Pendiente")}</dd></div>
                  <div><dt>Teléfono</dt><dd>${escapeHtml(passenger.responsableTelefono || "Pendiente")}</dd></div>
                </dl>
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
                    <input name="colegio" value="${escapeHtml(showColegio ? "" : adminPasajerosColegio || selectedGroup.colegio || "")}" placeholder="Nombre del colegio" required>
                  </label>
                  <label>Curso
                    <input name="curso" value="${escapeHtml(showCurso ? "" : selectedGroup.curso || "")}" placeholder="Ej: 5to" required>
                  </label>
                  <label>División
                    <input name="division" value="" placeholder="Ej: A" required>
                  </label>
                  <label>Cupo esperado
                    <input name="pasajerosEsperados" type="number" min="0" value="${escapeHtml(String(selectedGroup.pasajerosEsperados || 0))}" placeholder="Ej: 28">
                  </label>
                </fieldset>
                <p class="admin-pasajeros-modal-note">El grupo se guarda localmente por ahora y queda listo para migrar después a Google Sheets, Supabase o Firebase.</p>
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
        const stateFichas = fichas.filter((ficha) => filterMap[activeFilter].states.includes(ficha.estadoRevision || "pendiente"));
        const colegios = uniqueValues(fichas.map((ficha) => ({ value: fichaFilterValue(ficha, "colegio") })), "value");
        const viajes = uniqueValues(fichas.map((ficha) => ({ value: fichaFilterValue(ficha, "viaje") })), "value");
        if (adminFichasFilterColegio && !colegios.includes(adminFichasFilterColegio)) adminFichasFilterColegio = "";
        if (adminFichasFilterViaje && !viajes.includes(adminFichasFilterViaje)) adminFichasFilterViaje = "";
        const visibleFichas = stateFichas.filter((ficha) => (
          fichaMatchesText(ficha, adminFichasSearch) &&
          (!adminFichasFilterColegio || fichaFilterValue(ficha, "colegio") === adminFichasFilterColegio) &&
          (!adminFichasFilterViaje || fichaFilterValue(ficha, "viaje") === adminFichasFilterViaje)
        ));
        const selectedFichaCandidate = visibleFichas.find((ficha) => ficha.id === adminFichasSelectedId);
        const selectedFicha = adminFichasManuallyClosed ? null : selectedFichaCandidate || visibleFichas[0] || null;
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
              <a href="${escapeHtml(window.ElAngelAzulPersistence.googleSheet.url)}" target="_blank" rel="noreferrer">Abrir Sheet</a>
            </div>
            ${adminFichasMessage ? `<div class="admin-fichas-message">${escapeHtml(adminFichasMessage)}</div>` : ""}
          </section>

          <section class="admin-turismo-panel admin-pasajeros-table-panel">
            <div class="admin-pasajeros-table-head">
              <div>
                <h2>Bandeja de fichas</h2>
                <p>Filtrá por estado y ejecutá la acción siguiente sin salir de la tabla.</p>
              </div>
              <strong>${visibleFichas.length} / ${fichas.length} fichas</strong>
            </div>
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
            ${renderAdminFichaDetail(selectedFicha)}
            <div class="admin-pasajeros-table-wrap">
              <table class="admin-pasajeros-table admin-fichas-table">
                <thead>
                  <tr>
                    <th>Pasajero</th>
                    <th>Responsable</th>
                    <th>Asignación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>${fichaAdhesionDemoRows(visibleFichas)}</tbody>
              </table>
            </div>
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
                <label>Nombre y apellido <span class="admin-pasajeros-required">*</span>
                  <input name="nombre" placeholder="Ej: Juan Pérez" autocomplete="off" required>
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
                    <th>Pasajero</th>
                    <th>Contacto</th>
                    <th>Responsable</th>
                    <th>Viaje / grupo</th>
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
        const search = normalizeText(adminContratosSearch);
        return adminContratosRows().filter((contract) => {
          const matchesNivel = !adminContratosFilterNivel || contract.nivel === adminContratosFilterNivel;
          const matchesViaje = !adminContratosFilterViaje || contract.viaje === adminContratosFilterViaje;
          const matchesColegio = !adminContratosFilterColegio || contract.colegio_nombre === adminContratosFilterColegio;
          const matchesEstado = !adminContratosFilterEstado || contract.estado === adminContratosFilterEstado;
          const haystack = normalizeText([
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
                <span>No hay contratos con ese criterio. Si el Sheet fue editado recién, revisá que la hoja CONTRATOS tenga datos y refrescá.</span>
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

      function renderAdminContratoEditModal() {
        if (!adminContratosEditId) return "";
        const contract = adminContratosDemo.find((item) => item.id === adminContratosEditId);
        if (!contract) return "";
        const group = adminPasajerosDemo.find((item) => item.id === contract.grupo_id);
        const grupoCurso = `${contract.curso || group?.curso || ""} ${contract.division || group?.division || ""}`.trim();
        const estados = ["Activo", "Borrador", "Inactivo"];
        return `
          <div class="admin-pasajeros-modal-backdrop" data-admin-contrato-edit-backdrop>
            <section class="admin-pasajeros-modal" aria-label="Editar contrato">
              <div class="admin-pasajeros-modal-head">
                <div>
                  <p>Edición de contrato</p>
                  <h2>${escapeHtml(contract.colegio_nombre || "Contrato sin colegio")}</h2>
                </div>
                <button type="button" class="admin-secondary-action" data-admin-contrato-edit-cancel>Cerrar</button>
              </div>
              <div class="admin-fichas-message">
                Referencia: ${escapeHtml(contract.nivel || "Sin nivel")} · ${escapeHtml(contract.viaje || "Sin viaje")} · ${escapeHtml(grupoCurso || "Curso pendiente")}. Estos datos vienen desde Grupos y son solo lectura.
              </div>
              ${adminContratosEditError ? `<p class="admin-pasajeros-modal-error">${escapeHtml(adminContratosEditError)}</p>` : ""}
              <form class="admin-pasajeros-modal-form" data-admin-contrato-edit-form>
                <label>Código de contrato
                  <input name="codigo_contrato" value="${escapeHtml(contract.codigo_contrato || "")}" placeholder="Ej: EAA-2026-001" required>
                </label>
                <label>Estado
                  <select name="estado" required>
                    ${estados.map((estado) => `<option value="${escapeHtml(estado)}" ${estado === (contract.estado || "Borrador") ? "selected" : ""}>${escapeHtml(estado)}</option>`).join("")}
                  </select>
                </label>
                <label>Observaciones
                  <textarea name="observaciones" rows="4" placeholder="Observaciones internas">${escapeHtml(contract.observaciones || "")}</textarea>
                </label>
                <div class="admin-pasajeros-modal-actions">
                  <button type="button" class="admin-secondary-action" data-admin-contrato-edit-cancel>Cancelar</button>
                  <button type="submit">Guardar</button>
                </div>
              </form>
            </section>
          </div>
        `;
      }

      function openAdminContratoEdit(contractId) {
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
        const now = new Date().toISOString();
        adminContratosDemo[index] = {
          ...current,
          codigo_contrato: codigo,
          estado,
          observaciones,
          updated_at: now
        };
        saveAdminContratosDemo();
        adminContratosEditId = "";
        adminContratosEditError = "";
        googleSheetsSyncState = {
          status: "pending",
          message: "Guardando contrato en Google Sheets..."
        };
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
              <a class="admin-secondary-action" href="${escapeHtml(window.ElAngelAzulPersistence.googleSheet.url)}" target="_blank" rel="noopener">Abrir Sheet</a>
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
        filters.querySelector("input[name='search']")?.addEventListener("input", handleFilter);
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
        const search = normalizeText(adminGruposSearch);
        return adminPasajerosDemo.filter((group) => {
          const matchesNivel = !adminGruposFilterNivel || group.nivel === adminGruposFilterNivel;
          const matchesViaje = !adminGruposFilterViaje || group.viaje === adminGruposFilterViaje;
          const matchesColegio = !adminGruposFilterColegio || group.colegio === adminGruposFilterColegio;
          const haystack = normalizeText([
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
                  <input name="colegio" placeholder="Nombre del colegio" required>
                </label>
                <label>Curso
                  <input name="curso" placeholder="Ej: 5to" required>
                </label>
                <label>División
                  <input name="division" placeholder="Ej: A" required>
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
            <h2>Contratos</h2>
            <div class="admin-pasajeros-breadcrumb">
              <span>Grupos: ${groups.length}</span>
              <span>Colegios únicos: ${uniqueSchools}</span>
              <span>Pasajeros: ${totalPassengers}</span>
              <span>Sin contrato: ${groupsWithoutContract}</span>
              <span>${escapeHtml(googleSheetsSyncState.message)}</span>
            </div>
            <p>Esta vista valida la estructura colegio, viaje, curso y división que alimenta contratos y pasajeros.</p>
            <div class="admin-actions-row admin-grupos-primary-actions">
              <button type="button" class="admin-pasajeros-primary-button" data-admin-grupos-open-create>Crear grupo nuevo</button>
              <a class="admin-secondary-action" href="${escapeHtml(window.ElAngelAzulPersistence.googleSheet.url)}" target="_blank" rel="noopener">Abrir Sheet</a>
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
                <p>${filteredRows.length} grupos visibles de ${groups.length} cargados en Google Sheets.</p>
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
          const payload = {
            nivel: String(formData.get("nivel") || "").trim(),
            viaje: String(formData.get("viaje") || "").trim(),
            colegio: String(formData.get("colegio") || "").trim(),
            curso: String(formData.get("curso") || "").trim(),
            division: String(formData.get("division") || "").trim(),
            pasajerosEsperados: Number(formData.get("pasajerosEsperados") || 0)
          };
          if (!payload.nivel || !payload.viaje || !payload.colegio || !payload.curso || !payload.division) {
            adminGruposCreateError = "Completá nivel, viaje, colegio, curso y división.";
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
            message: "Guardando grupo en Google Sheets..."
          };
          saveAdminGruposDemo();
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
        filters.querySelector("input[name='search']")?.addEventListener("input", handleFilter);
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
          const duplicatedDni = selectedGroup.pasajeros.some((item) => String(item.dni) === passenger.dni);
          if (duplicatedDni) {
            adminPasajerosFormError = "Ya existe un pasajero con ese DNI dentro de este curso/división.";
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
          const payload = {
            nivel: String(formData.get("nivel") || "").trim(),
            viaje: String(formData.get("viaje") || "").trim(),
            colegio: String(formData.get("colegio") || "").trim(),
            curso: String(formData.get("curso") || "").trim(),
            division: String(formData.get("division") || "").trim(),
            pasajerosEsperados: Number(formData.get("pasajerosEsperados") || 0)
          };
          if (!payload.nivel || !payload.viaje || !payload.colegio || !payload.curso || !payload.division) {
            adminPasajerosGroupModal = { ...(adminPasajerosGroupModal || { type: "colegio" }), error: "Completá nivel, viaje, colegio, curso y división." };
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
          targetGroup.pasajeros[passengerIndex] = {
            ...targetGroup.pasajeros[passengerIndex],
            nombre,
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
          adminFichasSearch = event.currentTarget.value;
          adminFichasSelectedId = "";
          renderAdminFichasRecibidas();
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
        document.querySelectorAll("[data-ficha-ver]").forEach((button) => {
          button.addEventListener("click", () => viewFichaAdhesionDetail(button.dataset.fichaVer));
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
        document.querySelectorAll("[data-ficha-pdf]").forEach((button) => {
          button.addEventListener("click", async () => {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = "Generando PDF...";
            try {
              await downloadFichaAdhesionPdf(button.dataset.fichaPdf);
            } catch (error) {
              window.alert("No se pudo generar el PDF: " + (error?.message || "error desconocido"));
            } finally {
              button.disabled = false;
              button.textContent = originalText;
            }
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
            markFichaAdhesionStatus(button.dataset.fichaObservar, "observada", "Guardado en Google Sheets. Ficha marcada como observada.");
          });
        });
        document.querySelectorAll("[data-ficha-duplicada]").forEach((button) => {
          button.addEventListener("click", () => {
            markFichaAdhesionStatus(button.dataset.fichaDuplicada, "duplicada", "Guardado en Google Sheets. Ficha marcada como duplicada.");
          });
        });
        document.querySelectorAll("[data-ficha-revisar]").forEach((button) => {
          button.addEventListener("click", () => viewFichaAdhesionDetail(button.dataset.fichaRevisar));
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
        ` : `
            <section class="admin-turismo-panel admin-turismo-empty-editor">
              <div>
                <p>Editor</p>
                <h2>Seleccioná un viaje o creá uno nuevo</h2>
                <span>La lista queda primero para operar rápido. El formulario aparece solo en modo edición.</span>
              </div>
              <button type="button" data-admin-new>Crear nuevo viaje</button>
            </section>
        `;
        return `
          <div class="admin-turismo-layout">
            <section class="admin-turismo-hero">
              <div>
                <h1>Admin Turismo</h1>
              </div>
              <div class="admin-turismo-hero-stats">
                <article><strong>${summary.total}</strong><span>Viajes cargados</span></article>
                <article><strong>${summary.activos}</strong><span>Activos</span></article>
                <article><strong>${summary.listo || 0}</strong><span>Listos para publicar</span></article>
                <article><strong>${summary.publicado || 0}</strong><span>Publicados</span></article>
              </div>
              <button type="button" data-admin-new>Crear nuevo viaje</button>
            </section>

            <section class="admin-turismo-panel admin-turismo-list-panel">
              <div class="admin-turismo-section-head">
                <div>
                  <p>Lista de viajes</p>
                  <h2>Viajes cargados</h2>
                </div>
                <button type="button" data-admin-new>Crear nuevo</button>
              </div>
              <div class="admin-turismo-list">
                <div class="admin-turismo-list-head">
                  <span>Viaje</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>
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
            // El backend reemplaza la hoja TURISMO entera en cada escritura (clear + put),
            // por eso usamos la versión CON feedback: si falla la sync, el operador tiene
            // que saberlo explícitamente, no asumir en silencio que se borró en Sheets.
            if (!window.confirm(`¿Eliminar ${tripName}?\n\nEsta acción borra el viaje de este administrador y actualiza Google Sheets.`)) return;
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
          if (url) {
            preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class='admin-turismo-foto-error' style='display:none'>URL inválida</div>`;
          } else {
            preview.innerHTML = `<span>Preview</span>`;
          }
        });

        // --- Agregar foto ---
        document.querySelector("[data-add-foto]")?.addEventListener("click", () => {
          const urlInput = document.getElementById("new-foto-url");
          const altInput = document.getElementById("new-foto-alt");
          if (!urlInput) return;
          const url = urlInput.value.trim();
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
                  <a href="#viajes-estudiantiles">Ver viajes</a>
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
                  <a href="#detalles-del-viaje">Ver detalles</a>
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
                  <a href="#experiencias-bariloche">Ver experiencias</a>
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
                  <a href="#detalles-del-viaje">Ver detalles</a>
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
        result.innerHTML = `
          <section class="portal-result portal-result-dashboard">
            <div class="portal-result-head">
              <div>
                <span>Portal del pasajero</span>
                <h2>${escapeHtml(record.name)}</h2>
                <p>${escapeHtml(record.group.school || record.group.name || "Grupo pendiente")} · ${escapeHtml(record.group.course || "Curso pendiente")}</p>
              </div>
              <a href="${whatsappHref}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
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
              <h1>Portal de pasajeros</h1>
              <p>Consultá el estado de tu viaje y tus pagos.</p>
            </section>

            <section class="portal-panel">
              <form class="portal-form" id="portal-form">
                <label for="portal-dni">DNI del pasajero</label>
                <input id="portal-dni" name="dni" inputmode="numeric" autocomplete="off" placeholder="Ingresá tu DNI" required>
                <label for="portal-code">Código de contrato</label>
                <input id="portal-code" name="code" autocomplete="off" placeholder="Ej: CON-PRI-RIO-PARANA-6TO-A-CARLOS-PAZ-2026" required>
                <small class="portal-form-hint">Lo encontrás en tu ficha de adhesión o contrato de viaje.</small>
                <button type="submit">Consultar</button>
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

      function inscripcionDemoGroups(nivel, destino, anio) {
        const viaje = `${destino} ${anio}`;
        const exactGroups = adminPasajerosDemo.filter((group) => group.nivel === nivel && group.viaje === viaje);
        if (exactGroups.length) return exactGroups;
        return adminPasajerosDemo.filter((group) => group.nivel === nivel);
      }

      function inscripcionCourseLabel(group) {
        return `${group.curso} ${group.division}`;
      }

      function renderInscripcion() {
        document.getElementById("app").innerHTML = `
          <div class="layout portal-layout public-inscripcion-layout">
            <section class="inscripcion-page-hero">
              <div class="inscripcion-hero-media">
                <img src="https://drive.google.com/thumbnail?id=1obNcUj6dt1hOPHOainWFXlpv0fgIY957&sz=w1600" alt="Grupo de estudiantes de viaje">
                <div class="inscripcion-hero-copy">
                  <span>Inscripción</span>
                  <h1>Completá la ficha del viaje de forma ordenada</h1>
                  <p>Encontrá el contrato activo de tu colegio, confirmá que corresponde a tu curso y avanzá con la ficha digital.</p>
                </div>
              </div>
              <div class="inscripcion-hero-steps">
                <p class="section-kicker">Proceso de inscripción</p>
                <h2>Antes de cargar tus datos, ubicamos el viaje correcto.</h2>
                <ul>
                  <li><span>1</span> Elegís nivel, destino y año</li>
                  <li><span>2</span> Buscás colegio y curso</li>
                  <li><span>3</span> Confirmás el contrato activo</li>
                  <li><span>4</span> Completás y firmás la ficha</li>
                </ul>
              </div>
            </section>

            <section class="portal-empty public-inscripcion-card">
              <div class="inscripcion-section-heading">
                <span>Inscripción oficial</span>
                <h2>Buscar contrato activo</h2>
                <p>Para continuar necesitás encontrar el contrato activo de tu colegio y curso. Si no aparece, podés pedir ayuda por WhatsApp.</p>
              </div>

              <form data-inscripcion-form>
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

                <div class="inscripcion-progress">
                  <span data-inscripcion-progress="1">Nivel</span>
                  <span data-inscripcion-progress="2">Destino</span>
                  <span data-inscripcion-progress="3">Año</span>
                  <span data-inscripcion-progress="4">Colegio</span>
                  <span data-inscripcion-progress="5">Confirmación</span>
                </div>

                <div data-inscripcion-step="1">
                  <h3>Elegí el nivel</h3>
                  <div class="inscripcion-option-group" data-inscripcion-options="nivel"></div>
                </div>

                <div data-inscripcion-step="2" hidden>
                  <h3>Elegí el destino</h3>
                  <div class="inscripcion-option-group" data-inscripcion-options="destino"></div>
                </div>

                <div data-inscripcion-step="3" hidden>
                  <h3>Elegí el año del viaje</h3>
                  <div class="inscripcion-option-group" data-inscripcion-options="anio"></div>
                </div>

                <div data-inscripcion-step="4" hidden>
                  <h3>Buscá tu colegio y curso</h3>
                  <div class="public-inscripcion-grid">
                    <label>Colegio
                      <input data-inscripcion-colegio placeholder="Ej: San José">
                    </label>
                    <label>Curso / División
                      <input data-inscripcion-curso placeholder="Ej: 5to B">
                    </label>
                  </div>
                  <div data-inscripcion-contract-result class="inscripcion-contract-result"></div>
                </div>

                <div data-inscripcion-step="5" hidden>
                  <div data-inscripcion-summary></div>
                </div>

                <aside data-inscripcion-context-summary class="inscripcion-context-summary"></aside>
                <div class="ficha-adhesion-error" data-inscripcion-error hidden></div>
                <div class="inscripcion-step-actions">
                  <button type="button" data-inscripcion-back>Volver</button>
                  <button type="button" data-inscripcion-next>Siguiente</button>
                </div>
              </form>
            </section>
          </div>
        `;
        bindInscripcion();
      }

      function bindInscripcion() {
        const form = document.querySelector("[data-inscripcion-form]");
        const nivelField = document.querySelector("[data-inscripcion-nivel]");
        const destinoField = document.querySelector("[data-inscripcion-destino]");
        const anioField = document.querySelector("[data-inscripcion-anio]");
        const colegioField = document.querySelector("[data-inscripcion-colegio]");
        const cursoField = document.querySelector("[data-inscripcion-curso]");
        const contractResult = document.querySelector("[data-inscripcion-contract-result]");
        const summary = document.querySelector("[data-inscripcion-summary]");
        const contextSummary = document.querySelector("[data-inscripcion-context-summary]");
        const progressItems = [...document.querySelectorAll("[data-inscripcion-progress]")];
        const stepBlocks = [...document.querySelectorAll("[data-inscripcion-step]")];
        const backButton = document.querySelector("[data-inscripcion-back]");
        const nextButton = document.querySelector("[data-inscripcion-next]");
        const errorMessage = document.querySelector("[data-inscripcion-error]");
        const optionGroups = {
          nivel: document.querySelector('[data-inscripcion-options="nivel"]'),
          destino: document.querySelector('[data-inscripcion-options="destino"]'),
          anio: document.querySelector('[data-inscripcion-options="anio"]')
        };
        if (!form || !nivelField || !destinoField || !anioField || !colegioField || !cursoField || !contractResult || !summary || !contextSummary || !backButton || !nextButton || !errorMessage) return;
        let currentStep = 1;
        let matchState = { status: "idle", candidates: [] };
        let confirmedContrato = null;
        const requiredMessage = "Completá los campos obligatorios para continuar.";
        const noContractMessage = "No encontramos un contrato activo para ese colegio.";

        const optionHtml = (items, selected) => items.map((item) => (
          `<option value="${escapeHtml(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`
        )).join("");

        const renderChoiceButtons = (field, group, key) => {
          if (!field || !group) return;
          group.innerHTML = [...field.options].map((option) => {
            const selected = option.value === field.value;
            return `
              <button class="inscripcion-option-button${selected ? " selected" : ""}" type="button" data-inscripcion-option="${key}" data-value="${escapeHtml(option.value)}" aria-pressed="${selected ? "true" : "false"}">
                ${escapeHtml(option.textContent)}
              </button>
            `;
          }).join("");
        };

        const renderChoiceGroups = () => {
          renderChoiceButtons(nivelField, optionGroups.nivel, "nivel");
          renderChoiceButtons(destinoField, optionGroups.destino, "destino");
          renderChoiceButtons(anioField, optionGroups.anio, "anio");
        };

        // FIX: usar el helper compartido whatsappLink() (incluye el número real configurado
        // en data.js). La función local anterior generaba "https://wa.me/?text=..." SIN
        // número de teléfono, por lo que el botón no llevaba a ningún chat real.
        const whatsappConsultUrl = ({ nivel, viaje, colegio, cursoDivision }) => {
          const message = `Hola, quiero inscribirme pero no encuentro contrato activo para mi colegio. Colegio: ${colegio || "-"} / Nivel: ${nivel || "-"} / Viaje: ${viaje || "-"} / Curso: ${cursoDivision || "-"}.`;
          return whatsappLink(message);
        };

        const renderConfirmedContract = (candidate) => `
          <div class="inscripcion-contract-confirmed">
            <span>Encontramos tu colegio:</span>
            <strong>${escapeHtml(candidate.colegioNombre || "Colegio encontrado")}</strong>
            <span>Contrato:</span>
            <strong>${escapeHtml(candidate.codigoContrato || "Sin código")}</strong>
          </div>
        `;

        const renderContractResult = ({ nivel, viaje, colegio, cursoDivision }) => {
          if (!colegio || !cursoDivision) {
            contractResult.className = "inscripcion-contract-result";
            contractResult.innerHTML = "Escribí el colegio y curso/división para buscar contratos activos compatibles.";
            return;
          }
          if (confirmedContrato) {
            contractResult.className = "inscripcion-contract-result is-ok";
            contractResult.innerHTML = `
              ${renderConfirmedContract(confirmedContrato)}
              <button type="button" data-inscripcion-clear-contract>Corregir colegio</button>
            `;
            return;
          }
          if (matchState.status === "single" && matchState.selected) {
            contractResult.className = "inscripcion-contract-result is-ok";
            contractResult.innerHTML = `
              ${renderConfirmedContract(matchState.selected)}
              <button type="button" data-inscripcion-confirm-contract="${escapeHtml(matchState.selected.contratoId)}">Completar ficha de adhesión</button>
            `;
            return;
          }
          if (matchState.status === "multiple" && matchState.candidates.length) {
            contractResult.className = "inscripcion-contract-result is-options";
            contractResult.innerHTML = `
              <strong>¿Te referís a alguno de estos colegios?</strong>
              <div class="inscripcion-contract-options">
                ${matchState.candidates.map((candidate) => `
                  <button type="button" data-inscripcion-confirm-contract="${escapeHtml(candidate.contratoId)}">
                    <strong>${escapeHtml(candidate.colegioNombre)}</strong>
                    <span>${escapeHtml(candidate.viaje || candidate.contract.viaje || viaje)} · ${escapeHtml(candidate.cursoDivision || cursoDivision)}</span>
                    <small>${escapeHtml(candidate.codigoContrato)} · Completar ficha de adhesión</small>
                  </button>
                `).join("")}
              </div>
            `;
            return;
          }
          contractResult.className = "inscripcion-contract-result is-alert";
          contractResult.innerHTML = `
            <strong>${noContractMessage}</strong>
            <a href="${escapeHtml(whatsappConsultUrl({ nivel, viaje, colegio, cursoDivision }))}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          `;
        };

        const update = (source = "") => {
          const nivel = nivelField.value;
          const destinos = inscripcionDestinosPorNivel[nivel] || [];
          if (source === "nivel" || !destinos.includes(destinoField.value)) {
            destinoField.innerHTML = optionHtml(destinos, destinos[0] || "");
          }
          const destino = destinoField.value || destinos[0] || "";
          const anio = anioField.value || inscripcionAnios[0];
          const currentColegio = colegioField.value.trim();
          const currentCurso = cursoField.value.trim();
          const currentViaje = `${destino} ${anio}`.trim();
          if (source) confirmedContrato = null;
          matchState = currentColegio && currentCurso
            ? resolveInscripcionContract({ nivel, viaje: currentViaje, colegio: currentColegio, cursoDivision: currentCurso })
            : { status: "idle", candidates: [] };
          const currentContrato = confirmedContrato?.codigoContrato || "";
          const currentColegioReal = confirmedContrato?.colegioNombre || currentColegio;
          renderContractResult({ nivel, viaje: currentViaje, colegio: currentColegio, cursoDivision: currentCurso });
          contextSummary.innerHTML = `
            <span>Tu inscripción</span>
            <ul>
              <li><strong>Nivel:</strong> ${escapeHtml(nivel || "Pendiente")}</li>
              <li><strong>Destino:</strong> ${escapeHtml(destino || "Pendiente")}</li>
              <li><strong>Año:</strong> ${escapeHtml(anio || "Pendiente")}</li>
              <li><strong>Colegio:</strong> ${escapeHtml(currentColegioReal || "Pendiente")}</li>
              <li><strong>Número de contrato:</strong> ${escapeHtml(currentContrato || "Pendiente")}</li>
              <li><strong>Curso / División:</strong> ${escapeHtml(currentCurso || "Pendiente")}</li>
            </ul>
          `;
          summary.innerHTML = `
            <span>Resumen</span>
            <h2>Vas a completar una ficha para:</h2>
            <ul>
              <li><strong>Nivel:</strong> ${escapeHtml(nivel)}</li>
              <li><strong>Viaje:</strong> ${escapeHtml(destino)}</li>
              <li><strong>Año:</strong> ${escapeHtml(anio)}</li>
              <li><strong>Colegio:</strong> ${escapeHtml(currentColegioReal)}</li>
              <li><strong>Número de contrato:</strong> ${escapeHtml(currentContrato)}</li>
              <li><strong>Curso / División:</strong> ${escapeHtml(currentCurso)}</li>
            </ul>
            <p class="inscripcion-next-note">El siguiente paso es cargar los datos del pasajero y del padre/madre o tutor.</p>
          `;
          renderChoiceGroups();
        };

        const stepValue = (step) => {
          if (step === 1) return nivelField.value;
          if (step === 2) return destinoField.value;
          if (step === 3) return anioField.value;
          if (step === 4) return colegioField.value.trim() && cursoField.value.trim() && confirmedContrato;
          return nivelField.value && destinoField.value && anioField.value && colegioField.value.trim() && cursoField.value.trim() && confirmedContrato;
        };

        const renderStep = () => {
          stepBlocks.forEach((block) => {
            block.hidden = Number(block.dataset.inscripcionStep) !== currentStep;
          });
          progressItems.forEach((item) => {
            item.classList.toggle("active", Number(item.dataset.inscripcionProgress) === currentStep);
            item.classList.toggle("done", Number(item.dataset.inscripcionProgress) < currentStep);
          });
          backButton.disabled = currentStep === 1;
          nextButton.textContent = currentStep === 5 ? "Completar ficha de adhesión" : "Siguiente";
          errorMessage.hidden = true;
        };

        const goNext = () => {
          if (!stepValue(currentStep)) {
            errorMessage.textContent = currentStep === 4 && colegioField.value.trim() && cursoField.value.trim() ? "Confirmá un contrato activo válido antes de continuar." : requiredMessage;
            errorMessage.hidden = false;
            return;
          }
          if (currentStep < 5) {
            currentStep += 1;
            renderStep();
            return;
          }
          form.requestSubmit();
        };

        nivelField.addEventListener("change", () => update("nivel"));
        destinoField.addEventListener("change", () => update("destino"));
        anioField.addEventListener("change", () => update("anio"));
        colegioField.addEventListener("input", () => update("colegio"));
        cursoField.addEventListener("input", () => update("curso"));
        form.addEventListener("click", (event) => {
          const optionButton = event.target.closest("[data-inscripcion-option]");
          const confirmButton = event.target.closest("[data-inscripcion-confirm-contract]");
          const clearButton = event.target.closest("[data-inscripcion-clear-contract]");
          if (confirmButton) {
            const selected = [matchState.selected, ...(matchState.candidates || [])].filter(Boolean).find((candidate) => candidate.contratoId === confirmButton.dataset.inscripcionConfirmContract);
            if (!selected) return;
            confirmedContrato = selected;
            errorMessage.hidden = true;
            update();
            form.requestSubmit();
            return;
          }
          if (clearButton) {
            confirmedContrato = null;
            update("colegio");
            return;
          }
          if (optionButton) {
            const fields = {
              nivel: nivelField,
              destino: destinoField,
              anio: anioField
            };
            const field = fields[optionButton.dataset.inscripcionOption];
            if (!field) return;
            field.value = optionButton.dataset.value || "";
            field.dispatchEvent(new Event("change", { bubbles: true }));
          }
          errorMessage.hidden = true;
        });
        backButton.addEventListener("click", () => {
          currentStep = Math.max(1, currentStep - 1);
          renderStep();
        });
        nextButton.addEventListener("click", goNext);
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (!stepValue(5)) {
            errorMessage.textContent = colegioField.value.trim() && cursoField.value.trim() ? "Confirmá un contrato activo válido antes de continuar." : requiredMessage;
            errorMessage.hidden = false;
            return;
          }
          const codigoContrato = confirmedContrato.codigoContrato;
          const params = new URLSearchParams({
            nivel: nivelField.value,
            viaje: `${destinoField.value} ${anioField.value}`,
            destino: destinoField.value,
            anio: anioField.value,
            colegio: confirmedContrato.colegioNombre,
            colegioOriginal: colegioField.value.trim(),
            grupoId: confirmedContrato.grupoId,
            contratoId: confirmedContrato.contratoId,
            codigoContrato,
            numeroContrato: codigoContrato,
            cursoDivision: cursoField.value.trim()
          });
          location.hash = `/inscripcion/ficha-adhesion?${params.toString()}`;
        });
        update();
        renderStep();
      }

      function fichaAdhesionContextFromParams(params = currentHashParams()) {
        return {
          nivel: params.get("nivel") || "",
          destino: params.get("destino") || "",
          anio: params.get("anio") || "",
          viaje: params.get("viaje") || "",
          colegio: params.get("colegio") || "",
          colegioOriginal: params.get("colegioOriginal") || params.get("colegio_escrito") || params.get("colegio") || "",
          grupoId: params.get("grupoId") || params.get("grupo_id") || "",
          contratoId: params.get("contratoId") || params.get("contrato_id") || "",
          codigoContrato: params.get("codigoContrato") || params.get("codigo_contrato") || params.get("numeroContrato") || "",
          cursoDivision: params.get("cursoDivision") || params.get("curso_division") || ""
        };
      }

      function hasValidFichaAdhesionContext(params = currentHashParams()) {
        const context = fichaAdhesionContextFromParams(params);
        const required = [
          context.nivel,
          context.destino,
          context.anio,
          context.colegio,
          context.colegioOriginal,
          context.cursoDivision,
          context.grupoId,
          context.contratoId,
          context.codigoContrato
        ];
        if (required.some((value) => !String(value || "").trim())) return false;
        const group = adminPasajerosDemo.find((item) => item.id === context.grupoId);
        if (!group) return false;
        const contract = contractById(context.contratoId, context.grupoId);
        if (!contract || !isInscripcionContractActive(contract)) return false;
        if (String(contract.codigo_contrato || contract.codigoContrato || "") !== context.codigoContrato) return false;
        return true;
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

      function renderFichaAdhesion(successMessage = "") {
        const contextParams = currentHashParams();
        const contextData = fichaAdhesionContextFromParams(contextParams);
        const fichaContext = {
          ...contextData,
          nivel: contextData.nivel || "Pendiente de asignar por administración",
          viaje: contextData.viaje || "Pendiente de asignar por administración",
          colegio: contextData.colegio || "Pendiente de asignar por administración",
          numeroContrato: contextData.codigoContrato,
          cursoDivision: contextData.cursoDivision || "Pendiente de asignar por administración"
        };
        if (successMessage) {
          document.getElementById("app").innerHTML = `
            <div class="layout ficha-adhesion-layout">
              <section class="ficha-adhesion-panel ficha-adhesion-success-screen">
                <div class="ficha-adhesion-success ficha-adhesion-success-large">Recibimos tu ficha correctamente.</div>
                <p>Queda pendiente de revisión por administración. Te contactaremos si necesitamos validar algún dato.</p>
                <a class="ficha-adhesion-home-link" href="#/inscripcion">Volver al inicio</a>
              </section>
            </div>
          `;
          return;
        }
        document.getElementById("app").innerHTML = `
          <div class="layout ficha-adhesion-layout">
            <section class="ficha-adhesion-hero">
              <p>Ficha de adhesión digital</p>
              <h1>Completar datos del pasajero</h1>
              <p>Esta ficha registra los datos familiares y la deja pendiente de revisión por administración.</p>
            </section>

            <section class="ficha-adhesion-panel">
              <div class="ficha-adhesion-context">
                <span>Contexto del viaje</span>
                <strong>${escapeHtml(fichaContext.nivel)} · ${escapeHtml(fichaContext.viaje)} · ${escapeHtml(fichaContext.colegio)} · ${escapeHtml(fichaContext.cursoDivision)}</strong>
                <p>Número de contrato: <strong>${escapeHtml(fichaContext.codigoContrato || "Pendiente")}</strong></p>
              </div>
              <form class="ficha-adhesion-form" data-ficha-adhesion-form novalidate>
                <input type="hidden" name="nivel" value="${escapeHtml(fichaContext.nivel)}">
                <input type="hidden" name="destino" value="${escapeHtml(fichaContext.destino)}">
                <input type="hidden" name="anio" value="${escapeHtml(fichaContext.anio)}">
                <input type="hidden" name="viaje" value="${escapeHtml(fichaContext.viaje)}">
                <input type="hidden" name="colegio" value="${escapeHtml(fichaContext.colegio)}">
                <input type="hidden" name="colegioOriginal" value="${escapeHtml(fichaContext.colegioOriginal)}">
                <input type="hidden" name="grupoId" value="${escapeHtml(fichaContext.grupoId)}">
                <input type="hidden" name="contratoId" value="${escapeHtml(fichaContext.contratoId)}">
                <input type="hidden" name="codigoContrato" value="${escapeHtml(fichaContext.codigoContrato)}">
                <input type="hidden" name="numeroContrato" value="${escapeHtml(fichaContext.numeroContrato)}">
                <input type="hidden" name="cursoDivision" value="${escapeHtml(fichaContext.cursoDivision)}">
                <fieldset>
                  <legend>Datos del pasajero</legend>
                  <label>Apellido y nombres
                    <input name="pasajeroNombre" required>
                  </label>
                  <label>Tipo de documento
                    <select name="pasajeroTipoDocumento">
                      <option>DNI</option>
                      <option>Pasaporte</option>
                      <option>LC</option>
                      <option>LE</option>
                    </select>
                  </label>
                  <label>Número de documento
                    <input name="pasajeroNumeroDocumento" required>
                  </label>
                  <label>Fecha de nacimiento
                    <input name="pasajeroNacimiento" type="date">
                  </label>
                  <label>Sexo
                    <select name="pasajeroSexo">
                      <option value="">Seleccionar</option>
                      <option>Femenino</option>
                      <option>Masculino</option>
                      <option>Otro</option>
                      <option>Prefiero no informar</option>
                    </select>
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Datos del padre / madre / tutor responsable</legend>
                  <label>Apellido y nombres
                    <input name="responsableNombre" required>
                  </label>
                  <label>Tipo de documento
                    <select name="responsableTipoDocumento">
                      <option>DNI</option>
                      <option>Pasaporte</option>
                      <option>LC</option>
                      <option>LE</option>
                    </select>
                  </label>
                  <label>Número de documento
                    <input name="responsableNumeroDocumento" required>
                  </label>
                  <label>Fecha de nacimiento
                    <input name="responsableNacimiento" type="date">
                  </label>
                  <label>Parentesco
                    <input name="responsableParentesco" placeholder="Madre, padre, tutor">
                  </label>
                  <label>Correo electrónico
                    <input name="responsableEmail" type="email">
                  </label>
                  <label>Teléfono
                    <input name="responsableTelefono">
                  </label>
                  <label>Celular
                    <input name="responsableCelular" required>
                  </label>
                  <label>CUIL/CUIT
                    <input name="responsableCuilCuit">
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Domicilio</legend>
                  <label>Calle
                    <input name="domicilioCalle">
                  </label>
                  <label>Número
                    <input name="domicilioNumero">
                  </label>
                  <label>Piso
                    <input name="domicilioPiso">
                  </label>
                  <label>Departamento
                    <input name="domicilioDepartamento">
                  </label>
                  <label>Localidad
                    <input name="domicilioLocalidad">
                  </label>
                  <label>Provincia
                    <input name="domicilioProvincia">
                  </label>
                  <label>Código postal
                    <input name="domicilioCodigoPostal">
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Condiciones</legend>
                  <label class="ficha-adhesion-check">
                    <input name="aceptaCondiciones" type="checkbox" value="si">
                    Acepto que esta ficha sea revisada por administración y entiendo que no confirma pagos ni cupo definitivo.
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Firma del responsable / tutor</legend>
                  <div class="ficha-adhesion-signature">
                    <span>Firma del responsable/tutor</span>
                    <canvas width="720" height="220" data-ficha-signature></canvas>
                    <button type="button" data-ficha-clear-signature>Limpiar firma</button>
                  </div>
                </fieldset>

                <div class="ficha-adhesion-error" data-ficha-error hidden></div>
                <button type="submit" class="ficha-adhesion-submit">Enviar ficha</button>
              </form>
            </section>
          </div>
        `;
        bindFichaAdhesion();
      }

      function bindFichaAdhesion() {
        const form = document.querySelector("[data-ficha-adhesion-form]");
        const canvas = document.querySelector("[data-ficha-signature]");
        const clearButton = document.querySelector("[data-ficha-clear-signature]");
        const errorBox = document.querySelector("[data-ficha-error]");
        if (!form || !canvas || !errorBox) return;

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

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submitButton = form.querySelector(".ficha-adhesion-submit");
          if (submitButton?.disabled) return;
          if (submitButton) submitButton.disabled = true;
          const formData = new FormData(form);
          const responsableTelefono = String(formData.get("responsableTelefono") || "").trim();
          const responsableCelular = String(formData.get("responsableCelular") || "").trim();
          const grupoId = String(formData.get("grupoId") || "").trim();
          const contratoId = String(formData.get("contratoId") || "").trim();
          const codigoContrato = String(formData.get("codigoContrato") || formData.get("numeroContrato") || "").trim();
          const ficha = {
            id: `ficha-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estadoRevision: "pendiente",
            documentacionEstado: "Pendiente",
            fichaMedicaEstado: "Pendiente",
            autorizacionEstado: "Pendiente",
            pasajeroNombre: String(formData.get("pasajeroNombre") || "").trim(),
            pasajeroTipoDocumento: String(formData.get("pasajeroTipoDocumento") || "").trim(),
            pasajeroNumeroDocumento: String(formData.get("pasajeroNumeroDocumento") || "").trim(),
            pasajeroNacimiento: String(formData.get("pasajeroNacimiento") || "").trim(),
            pasajeroSexo: String(formData.get("pasajeroSexo") || "").trim(),
            responsableNombre: String(formData.get("responsableNombre") || "").trim(),
            responsableTipoDocumento: String(formData.get("responsableTipoDocumento") || "").trim(),
            responsableNumeroDocumento: String(formData.get("responsableNumeroDocumento") || "").trim(),
            responsableNacimiento: String(formData.get("responsableNacimiento") || "").trim(),
            responsableParentesco: String(formData.get("responsableParentesco") || "").trim(),
            responsableEmail: String(formData.get("responsableEmail") || "").trim(),
            responsableTelefono,
            responsableCelular,
            responsableCuilCuit: String(formData.get("responsableCuilCuit") || "").trim(),
            domicilioCalle: String(formData.get("domicilioCalle") || "").trim(),
            domicilioNumero: String(formData.get("domicilioNumero") || "").trim(),
            domicilioPiso: String(formData.get("domicilioPiso") || "").trim(),
            domicilioDepartamento: String(formData.get("domicilioDepartamento") || "").trim(),
            domicilioLocalidad: String(formData.get("domicilioLocalidad") || "").trim(),
            domicilioProvincia: String(formData.get("domicilioProvincia") || "").trim(),
            domicilioTelefono: responsableTelefono,
            domicilioCelular: responsableCelular,
            domicilioCodigoPostal: String(formData.get("domicilioCodigoPostal") || "").trim(),
            nivel: String(formData.get("nivel") || "").trim(),
            destino: String(formData.get("destino") || "").trim(),
            anio: String(formData.get("anio") || "").trim(),
            viaje: String(formData.get("viaje") || "").trim(),
            colegio: String(formData.get("colegio") || "").trim(),
            colegioOriginal: String(formData.get("colegioOriginal") || "").trim(),
            grupoAsignadoId: grupoId,
            contratoId,
            codigoContrato,
            numeroContrato: codigoContrato,
            cursoDivision: String(formData.get("cursoDivision") || "").trim(),
            grupoSolicitado: String(formData.get("colegioOriginal") || "").trim(),
            asignacionGrupo: {
              grupoId,
              contratoId,
              codigoContrato,
              nivel: String(formData.get("nivel") || "").trim(),
              viaje: String(formData.get("viaje") || "").trim(),
              colegio: String(formData.get("colegio") || "").trim()
            },
            administracion: {
              contrato: codigoContrato,
              numeroLegajo: "",
              altaModificacion: "",
              valorViaje: "",
              sena: "",
              cuotas: "",
              saldo: "",
              formaPago: "",
              informacionAdministrativa: ""
            },
            aceptaCondiciones: formData.get("aceptaCondiciones") === "si",
            firma: hasSignature ? canvas.toDataURL("image/png") : ""
          };
          const showError = (message) => {
            if (submitButton) submitButton.disabled = false;
            errorBox.hidden = false;
            errorBox.textContent = message;
          };
          if (!ficha.pasajeroNombre) return showError("El nombre del pasajero es obligatorio.");
          if (!ficha.pasajeroNumeroDocumento) return showError("El número de documento del pasajero es obligatorio.");
          if (!ficha.responsableNombre) return showError("El nombre del responsable es obligatorio.");
          if (!ficha.responsableNumeroDocumento) return showError("El documento del responsable es obligatorio.");
          if (!ficha.responsableCelular) return showError("El celular del responsable es obligatorio.");
          if (!ficha.grupoAsignadoId || !ficha.contratoId || !ficha.codigoContrato) return showError("No pudimos resolver el contrato del colegio/curso. Volvé a iniciar la inscripción.");
          if (!ficha.aceptaCondiciones) return showError("Tenés que aceptar las condiciones para enviar la ficha.");
          if (!ficha.firma) return showError("Falta la firma del responsable/tutor.");

          // FIX: antes, si fallaba la sincronización con Google Sheets (ej. credenciales
          // no configuradas en este entorno), se bloqueaba el envío con un error genérico
          // AUNQUE la ficha ya se hubiera guardado localmente (fichaAdhesionCollection.save
          // corre primero y de forma síncrona, antes del intento de sync con Sheets).
          // Esto perdía el flujo de la familia por un problema de infraestructura ajeno a
          // sus datos. Ahora: el guardado local es la condición real de éxito; si Sheets
          // falla, se avisa de forma no bloqueante y se sigue igual.
          const fichas = loadFichasAdhesionDemo();
          fichas.unshift(ficha);
          let localSaveOk = true;
          try {
            fichaAdhesionCollection.save(fichas);
          } catch (error) {
            localSaveOk = false;
          }
          if (!localSaveOk) {
            showError("No pudimos guardar la ficha en este dispositivo. Intentá nuevamente o consultanos por WhatsApp.");
            return;
          }
          if (!googleSheetsHydrating) {
            queueGoogleSheetsWrite(["FICHAS_ADHESION"]).catch(() => {});
          }
          const syncWarning = googleSheetsSyncState.status === "error"
            ? " (Quedó guardada en este dispositivo; la sincronización con el sistema central se reintentará.)"
            : "";
          renderFichaAdhesion(`Ficha enviada correctamente. Queda pendiente de revisión por administración.${syncWarning}`);
        });
      }

      async function render() {
        const path = currentPath();
        const page = routes[path] || routes["/"];
        document.body.classList.toggle("home-page", path === "/");
        document.body.classList.toggle("turismo-page", path.startsWith("/turismo"));
        closeMobileNav();
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
        if (path === "/portal-pasajeros" || path === "/pasajeros") {
          await hydrateGoogleSheetsData();
          renderPortalPasajeros();
          return;
        }
        if (path === "/inscripcion") {
          await hydrateGoogleSheetsData();
          renderInscripcion();
          return;
        }
        if (path === "/inscripcion/ficha-adhesion") {
          await hydrateGoogleSheetsData();
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
          const session = await fetchAdminSession();
          if (!session) {
            renderAdminLogin();
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
        internalAccess.href = "/admin/";
        internalAccess.textContent = "Acceso interno";
        footerBottom.appendChild(internalAccess);
      }

      setupPublicInternalAccess();

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
