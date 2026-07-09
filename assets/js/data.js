      const routes = {
        "/": {
          title: "Home",
          description: "Entrada principal. El usuario elige entre Turismo o Viajes Estudiantiles.",
          links: [
            ["Turismo", "#/turismo"],
            ["Estudiantil", "#/estudiantil"],
            ["Nosotros", "#/nosotros"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Hero principal",
            "Accesos a Turismo y Estudiantil",
            "Destinos destacados",
            "Beneficios",
            "Testimonios",
            "CTA final"
          ]
        },
        "/turismo": {
          title: "Turismo",
          description: "Listado de paquetes turísticos. En V0 solo se valida el recorrido.",
          links: [
            ["Bariloche", "#/turismo/bariloche"],
            ["Mendoza", "#/turismo/mendoza"],
            ["Cataratas", "#/turismo/cataratas"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Catálogo de paquetes",
            "Filtros de intención",
            "Acceso a detalle por destino",
            "Consulta por paquete"
          ]
        },
        "/estudiantil": {
          title: "Estudiantil",
          description: "Índice de Viajes Estudiantiles. Divide Primaria y Secundaria.",
          links: [
            ["Primaria Carlos Paz", "#/estudiantil/primaria-carlos-paz"],
            ["Secundaria Bariloche", "#/estudiantil/secundaria-bariloche"],
            ["Secundaria Carlos Paz", "#/estudiantil/secundaria-carlos-paz"]
          ],
          map: [
            "Camino Primaria",
            "Camino Secundaria",
            "Accesos por producto estudiantil"
          ]
        },
        "/estudiantil/primaria-carlos-paz": {
          title: "Primaria Carlos Paz",
          description: "Página propia para producto de primaria.",
          links: [
            ["Volver a Estudiantil", "#/estudiantil"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Presentación",
            "Experiencia",
            "Itinerario",
            "Beneficios",
            "Consulta"
          ]
        },
        "/estudiantil/secundaria-bariloche": {
          title: "Secundaria Bariloche",
          description: "Página propia para producto de secundaria.",
          links: [
            ["Volver a Estudiantil", "#/estudiantil"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Experiencia",
            "Itinerario",
            "Financiación",
            "Beneficios",
            "Testimonios",
            "Consulta"
          ]
        },
        "/estudiantil/secundaria-carlos-paz": {
          title: "Secundaria Carlos Paz",
          description: "Página propia para producto de secundaria.",
          links: [
            ["Volver a Estudiantil", "#/estudiantil"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Experiencia",
            "Itinerario",
            "Financiación",
            "Beneficios",
            "Testimonios",
            "Consulta"
          ]
        },
        "/nosotros": {
          title: "Nosotros",
          description: "Página institucional básica.",
          links: [
            ["Home", "#/"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Quiénes somos",
            "Experiencia",
            "Trayectoria",
            "Confianza"
          ]
        },
        "/contacto": {
          title: "Contacto",
          description: "Página de contacto. En V0 solo marca el lugar del recorrido.",
          links: [
            ["Home", "#/"],
            ["Turismo", "#/turismo"],
            ["Estudiantil", "#/estudiantil"]
          ],
          map: [
            "WhatsApp",
            "Formulario",
            "Redes sociales"
          ]
        },
        "/portal-pasajeros": {
          title: "Mi viaje",
          description: "Consulta del estado de inscripción, viaje, documentación y pagos.",
          links: [
            ["Home", "#/"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Acceso por DNI + contrato demo",
            "Resumen de viaje",
            "Estado de pagos",
            "Consulta por WhatsApp"
          ]
        },
        "/inscripcion": {
          title: "Inscripción",
          description: "Inicio público para completar la ficha de adhesión digital.",
          links: [
            ["Completar ficha de adhesión", "#/inscripcion/ficha-adhesion"],
            ["Estudiantil", "#/estudiantil"],
            ["Contacto", "#/contacto"]
          ],
          map: [
            "Inicio de inscripción",
            "Ficha de adhesión",
            "Firma del tutor",
            "Envío a administración"
          ]
        },
        "/admin-portal": {
          title: "Admin portal",
          description: "Vista interna demo para validar estructura de viajes, grupos, pasajeros, cuotas y pagos.",
          links: [
            ["Portal de pasajeros", "#/portal-pasajeros"]
          ],
          map: [
            "Listado de viajes",
            "Grupos",
            "Pasajeros",
            "Resumen de pagos"
          ]
        }
      };

      const whatsappBase = "https://wa.me/5493794331380?text=";

      function whatsappLink(message) {
        return `${whatsappBase}${encodeURIComponent(message)}`;
      }

      function formatCurrency(value) {
        return new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0
        }).format(value);
      }

      function formatDate(date) {
        if (!date) return "Sin fecha";
        if (date instanceof Date) {
          return new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }).format(date);
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(date))) return date;
        return new Intl.DateTimeFormat("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }).format(new Date(`${date}T00:00:00`));
      }

      function parseDateValue(value) {
        if (value instanceof Date) return value;
        const text = String(value || "").trim();
        const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00`);
        return new Date(`${text}T00:00:00`);
      }

      function normalizeText(value) {
        return String(value || "").trim();
      }

      function normalizeCode(value) {
        return normalizeText(value).toUpperCase();
      }

      function normalizeDni(value) {
        return normalizeText(value).replace(/\D/g, "");
      }

      function normalizeStatus(value) {
        return normalizeText(value).toLowerCase();
      }

      function parseNumber(value) {
        if (typeof value === "number") return value;
        const clean = normalizeText(value).replace(/\$/g, "").replace(/\./g, "").replace(",", ".");
        const parsed = Number(clean);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      const portalExcelFile = "portal_pasajeros_excel_simulado_v1.xlsx";
      let portalExcelData = null;

      async function loadPortalExcelData() {
        if (portalExcelData) return portalExcelData;
        const response = await fetch(portalExcelFile);
        if (!response.ok) {
          throw new Error("No se pudo cargar el Excel simulado del portal.");
        }
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const sheetToRows = name => XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" });
        portalExcelData = {
          passengers: sheetToRows("PASAJEROS"),
          tripsGroups: sheetToRows("VIAJES_GRUPOS"),
          installments: sheetToRows("CUOTAS"),
          payments: sheetToRows("PAGOS")
        };
        return portalExcelData;
      }

      function getPortalGroup(passenger, data) {
        const tripCode = normalizeCode(passenger.viaje_codigo);
        const groupCode = normalizeCode(passenger.grupo_codigo);
        return data.tripsGroups.find(group => (
          normalizeCode(group.viaje_codigo) === tripCode &&
          normalizeCode(group.grupo_codigo) === groupCode
        ));
      }

      function getPassengerInstallments(passenger, data) {
        const dni = normalizeDni(passenger.pasajero_dni);
        const contract = normalizeCode(passenger.contrato_codigo);
        return data.installments.filter(installment => (
          normalizeDni(installment.pasajero_dni) === dni &&
          normalizeCode(installment.contrato_codigo) === contract
        ));
      }

      function getPassengerPayments(passenger, data) {
        const dni = normalizeDni(passenger.pasajero_dni);
        const contract = normalizeCode(passenger.contrato_codigo);
        return data.payments.filter(payment => (
          normalizeDni(payment.pasajero_dni) === dni &&
          normalizeCode(payment.contrato_codigo) === contract
        ));
      }

      function getNextInstallment(installments) {
        const pendingStatuses = ["pendiente", "vencida", "en_revision"];
        return installments
          .filter(installment => pendingStatuses.includes(normalizeStatus(installment.cuota_estado)))
          .sort((a, b) => parseDateValue(a.cuota_vencimiento) - parseDateValue(b.cuota_vencimiento))[0] || null;
      }

      function getGeneralStatus(passenger, installments, payments, balance) {
        const passengerStatus = normalizeStatus(passenger.estado_pasajero);
        const hasExpiredInstallment = installments.some(installment => normalizeStatus(installment.cuota_estado) === "vencida");
        const hasReview = payments.some(payment => normalizeStatus(payment.pago_estado) === "en_revision") ||
          installments.some(installment => normalizeStatus(installment.cuota_estado) === "en_revision");
        const nextInstallment = getNextInstallment(installments);
        if (passengerStatus === "baja") return "Baja / consultar";
        if (hasExpiredInstallment) return "Tiene cuotas vencidas";
        if (hasReview) return "Información en revisión";
        if (balance <= 0) return "Pagos al día / completo";
        if (nextInstallment) return "Plan de pago en curso";
        return "Consultar estado";
      }

      function getPassengerPortalRecord(passenger, data) {
        const group = getPortalGroup(passenger, data);
        const installments = getPassengerInstallments(passenger, data);
        const payments = getPassengerPayments(passenger, data);
        const totalPersonalizado = parseNumber(passenger.total_personalizado);
        const total = totalPersonalizado > 0 ? totalPersonalizado : parseNumber(group?.total_viaje);
        const paid = payments
          .filter(payment => normalizeStatus(payment.pago_estado) === "confirmado")
          .reduce((sum, payment) => sum + parseNumber(payment.pago_monto), 0);
        const balance = total - paid;
        const nextInstallment = getNextInstallment(installments);
        const hasReview = payments.some(payment => normalizeStatus(payment.pago_estado) === "en_revision");
        return {
          contractCode: normalizeCode(passenger.contrato_codigo),
          name: normalizeText(passenger.pasajero_nombre),
          dni: normalizeDni(passenger.pasajero_dni),
          passengerStatus: normalizeText(passenger.estado_pasajero),
          trip: {
            code: normalizeCode(passenger.viaje_codigo),
            name: normalizeText(group?.viaje_nombre),
            destination: normalizeText(group?.destino),
            type: normalizeText(group?.tipo_viaje),
            status: normalizeText(group?.estado_grupo)
          },
          group: {
            code: normalizeCode(passenger.grupo_codigo),
            name: normalizeText(group?.grupo_nombre),
            school: normalizeText(group?.colegio),
            course: normalizeText(group?.curso)
          },
          documentation: {
            general: normalizeText(passenger.documentacion_estado || passenger.estado_documentacion || passenger.documentacion || "Pendiente de validar"),
            medical: normalizeText(passenger.ficha_medica || passenger.estado_ficha_medica || "Pendiente de validar"),
            authorization: normalizeText(passenger.autorizacion_viaje || passenger.estado_autorizacion || "Pendiente de validar")
          },
          installments,
          payments,
          total,
          paid,
          balance,
          nextInstallment,
          hasReview,
          generalStatus: getGeneralStatus(passenger, installments, payments, balance)
        };
      }

      const companyData = {
        logo: "assets/img/logo-completo-azul.svg",
        mark: "assets/img/esfera-rosa.svg",
        colors: {
          blue: "#0d69a1",
          pink: "#eb3e8f"
        },
        packageExampleImages: [
          "assets/img/paquete-ejemplo-1.png",
          "assets/img/paquete-ejemplo-2.png",
          "assets/img/paquete-ejemplo-3.png"
        ],
        brandingImages: {
          turismo: "assets/img/brand-turismo-destinos.png",
          estudiantil: "assets/img/brand-estudiantil-egresados.png"
        },
        instagram: {
          estudiantil: "https://www.instagram.com/elangelazul.estudiantil/",
          turismo: "https://www.instagram.com/turismoelangelazul/"
        },
        whatsapp: "5493794331380",
        address: "Córdoba 6660, Corrientes Capital",
        email: "contacto@elangelazul.com.ar",
        temporaryData: {
          email: true
        },
        pending: [
          "email oficial confirmado",
          "años de experiencia si corresponde",
          "habilitaciones o datos de confianza si corresponde",
          "texto corto de quiénes son"
        ]
      };

      const contentComponentSchemas = {
        gallery: {
          title: "Texto de título",
          photos: "Lista de fotos con src, alt y caption"
        },
        video: {
          title: "Texto de título",
          url: "Link o archivo del video",
          poster: "Imagen de portada opcional"
        },
        testimonials: {
          title: "Texto de título",
          items: "Lista de testimonios reales con text y author"
        },
        itinerary: {
          title: "Texto de título",
          items: "Lista de etapas, días o momentos con title y text"
        },
        faq: {
          title: "Texto de título",
          questions: "Lista de preguntas reales con question y answer"
        }
      };

      const internalMaterialsChecklist = {
        title: "MATERIALES NECESARIOS",
        turismo: [
          "paquetes disponibles",
          "destino",
          "precio desde",
          "temporada",
          "duración",
          "qué incluye",
          "fotos",
          "videos si hay"
        ],
        estudiantil: {
          "Primaria Carlos Paz": [
            "itinerario real",
            "servicios incluidos",
            "financiación",
            "fotos reales",
            "videos reales",
            "testimonios",
            "preguntas frecuentes"
          ],
          "Secundaria Bariloche": [
            "itinerario real",
            "servicios incluidos",
            "financiación",
            "fotos reales",
            "videos reales",
            "testimonios",
            "preguntas frecuentes"
          ],
          "Secundaria Carlos Paz": [
            "itinerario real",
            "servicios incluidos",
            "financiación",
            "fotos reales",
            "videos reales",
            "testimonios",
            "preguntas frecuentes"
          ]
        },
        empresa: [
          "logo",
          "colores",
          "redes",
          "WhatsApp",
          "dirección",
          "años de experiencia si corresponde",
          "habilitaciones o datos de confianza si corresponde"
        ],
        recibidos: {
          logo: companyData.logo,
          branding: companyData.brandingImages,
          instagramEstudiantil: companyData.instagram.estudiantil,
          instagramTurismo: companyData.instagram.turismo,
          whatsapp: companyData.whatsapp,
          paqueteEjemplo: companyData.packageExampleImages
        }
      };

      const trustSectionData = {
        title: "¿POR QUÉ ELEGIR EL ÁNGEL AZUL?",
        cards: [
          {
            title: "Experiencia",
            text: "Propuestas pensadas para que cada viaje tenga una organización clara desde el inicio."
          },
          {
            title: "Acompañamiento",
            text: "Atención durante el proceso de consulta, planificación y coordinación del viaje."
          },
          {
            title: "Financiación",
            text: "Opciones de pago para adaptar la propuesta a cada grupo, familia o viajero."
          },
          {
            title: "Atención personalizada",
            text: "Comunicación directa para resolver dudas y orientar cada consulta según la necesidad."
          }
        ]
      };

      const homeData = {
        hero: {
          title: "EL MEJOR VIAJE DE TU VIDA",
          subtitle: "Experiencias únicas, destinos inolvidables y momentos que vas a recordar para siempre.",
          buttons: [
            ["Ver viajes estudiantiles", "#/estudiantil"],
            ["Ver turismo", "#/turismo"],
            ["Consultar por WhatsApp", "#/contacto"]
          ]
        },
        paths: [
          {
            title: "Viajes Estudiantiles",
            text: "Primaria y secundaria con destinos pensados para vivir una experiencia inolvidable.",
            button: ["Ver estudiantiles", "#/estudiantil"]
          },
          {
            title: "Turismo",
            text: "Paquetes nacionales e internacionales para viajar solo, en pareja, en familia o en grupo.",
            button: ["Ver paquetes", "#/turismo"]
          }
        ],
        featured: [
          ["Primaria Carlos Paz", "#/estudiantil/primaria-carlos-paz"],
          ["Secundaria Bariloche", "#/estudiantil/secundaria-bariloche"],
          ["Turismo Nacional", "#/turismo"]
        ],
        benefits: [
          "Atención personalizada",
          "Financiación disponible",
          "Destinos nacionales",
          "Acompañamiento para grupos"
        ],
        finalCta: {
          title: "Tu viaje de egresados empieza con una charla",
          text: "Escribinos por WhatsApp y diseñamos juntos una experiencia inolvidable para tu grupo, con destinos, financiación y acompañamiento real en cada etapa.",
          button: ["Consultar por WhatsApp", "#/contacto"]
        }
      };

      const turismoData = {
        hero: {
          title: "Paquetes turísticos nacionales e internacionales",
          subtitle: "Encontrá opciones para viajar solo, en pareja, en familia o en grupo. Consultá disponibilidad y formas de pago por WhatsApp.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero consultar por paquetes turísticos de El Ángel Azul.")]
        },
        filters: ["Todos", "Nacionales", "Internacionales"],
        packages: [
          {
            destino: "Destino destacado",
            tipo: "Turismo",
            temporada: "Consultá disponibilidad",
            precio: "Precio desde: consultar",
            image: "assets/img/turismo/package-bariloche-destino.webp",
            gallery: ["assets/img/turismo/package-bariloche-destino.webp"]
          },
          {
            destino: "Bariloche",
            slug: "bariloche",
            tipo: "Nacional",
            categoria: "Nieve",
            intenciones: ["nieve", "familiar", "pareja", "grupo"],
            duracion: "6 días · 5 noches",
            resumen: "Ideal para quienes buscan nieve, paisajes y una experiencia completa.",
            descripcion: "Una propuesta para vivir la Patagonia con paisajes de montaña, nieve, lago y excursiones coordinadas.",
            incluye: ["Traslado", "Alojamiento", "Excursiones"],
            noIncluye: ["Comidas no especificadas", "Gastos personales", "Excursiones opcionales", "Extras no detallados"],
            formasPago: ["Efectivo / transferencia", "Financiación a consultar", "Reserva sujeta a disponibilidad"],
            temporada: "Temporada 2026",
            precio: "Consultar disponibilidad",
            precioDesde: "$ 450.000",
            image: "assets/img/turismo/package-bariloche-destino.webp",
            gallery: ["assets/img/turismo/package-bariloche-destino.webp", "assets/img/turismo/hero/nieve-montana.webp", "assets/img/turismo/hero/montana-patagonia.webp"],
            imageSource: "Wikimedia Commons - File:Parque Nacional Nahuel Huapi 1994 12.jpg",
            imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Parque_Nacional_Nahuel_Huapi_1994_12.jpg"
          },
          {
            destino: "Mendoza",
            slug: "mendoza",
            tipo: "Nacional",
            categoria: "Escapada",
            intenciones: ["escapada", "pareja", "grupo"],
            duracion: "4 días · 3 noches",
            resumen: "Una salida para descansar, recorrer paisajes y vivir una experiencia distinta.",
            descripcion: "Un viaje para bajar el ritmo, recorrer viñedos, ver montaña y disfrutar una escapada con todo acompañado.",
            incluye: ["Traslado", "Alojamiento", "Excursiones"],
            noIncluye: ["Comidas no especificadas", "Gastos personales", "Excursiones opcionales", "Extras no detallados"],
            formasPago: ["Efectivo / transferencia", "Financiación a consultar", "Reserva sujeta a disponibilidad"],
            temporada: "Temporada 2026",
            precio: "Consultar disponibilidad",
            precioDesde: "$ 390.000",
            image: "assets/img/turismo/package-mendoza-destino.webp",
            gallery: ["assets/img/turismo/package-mendoza-destino.webp", "assets/img/turismo/package-mendoza-bodega.webp", "assets/img/turismo/package-mendoza-salentein.webp"],
            imageSource: "Wikimedia Commons - File:Vineyard in Mendoza, Argentina.jpg",
            imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Vineyard_in_Mendoza,_Argentina.jpg"
          },
          {
            destino: "Cataratas",
            slug: "cataratas",
            tipo: "Nacional",
            categoria: "Familiar",
            intenciones: ["familiar", "grupo", "escapada"],
            duracion: "5 días · 4 noches",
            resumen: "Pensado para familias o grupos que quieren naturaleza, paseo y comodidad.",
            descripcion: "Una experiencia de naturaleza intensa para conocer Cataratas, recorrer paisajes únicos y viajar con organización.",
            incluye: ["Traslado", "Alojamiento", "Excursiones"],
            noIncluye: ["Comidas no especificadas", "Gastos personales", "Excursiones opcionales", "Extras no detallados"],
            formasPago: ["Efectivo / transferencia", "Financiación a consultar", "Reserva sujeta a disponibilidad"],
            temporada: "Temporada 2026",
            precio: "Consultar disponibilidad",
            precioDesde: "$ 420.000",
            image: "assets/img/turismo/package-cataratas-destino.webp",
            gallery: ["assets/img/turismo/package-cataratas-destino.webp", "assets/img/turismo/hero/cataratas-iguazu.webp", "assets/img/turismo/package-cataratas-garganta.webp"],
            imageSource: "Wikimedia Commons - File:Rainbows at Iguazu Falls frrom Argentina.jpg",
            imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Rainbows_at_Iguazu_Falls_frrom_Argentina.jpg"
          },
          {
            destino: "Brasil",
            slug: "brasil",
            tipo: "Internacional",
            categoria: "Playa",
            intenciones: ["playa", "familiar", "pareja", "grupo"],
            duracion: "7 días · 6 noches",
            resumen: "Una opción de playa para cortar la rutina y viajar con todo acompañado.",
            descripcion: "Una alternativa para quienes buscan playa, descanso y una experiencia internacional simple de consultar.",
            incluye: ["Traslado", "Alojamiento", "Excursiones"],
            noIncluye: ["Comidas no especificadas", "Gastos personales", "Excursiones opcionales", "Extras no detallados"],
            formasPago: ["Efectivo / transferencia", "Financiación a consultar", "Reserva sujeta a disponibilidad"],
            temporada: "Temporada 2026",
            precio: "Consultar disponibilidad",
            precioDesde: "$ 690.000",
            image: "assets/img/turismo/package-brasil-destino.webp",
            gallery: ["assets/img/turismo/package-brasil-destino.webp", "assets/img/turismo/package-brasil-fernando.webp", "assets/img/turismo/package-brasil-joaquina.webp"],
            imageSource: "Wikimedia Commons - File:Lençóis Maranhenses 2019.jpg",
            imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Len%C3%A7%C3%B3is_Maranhenses_2019.jpg"
          },
          {
            destino: "Río de Janeiro",
            slug: "rio-de-janeiro",
            tipo: "Internacional",
            categoria: "Pareja",
            intenciones: ["playa", "pareja", "grupo", "escapada"],
            duracion: "6 días · 5 noches",
            resumen: "Ideal para quienes quieren playa, ciudad, paseos y una experiencia vibrante.",
            descripcion: "Una propuesta para combinar playa, ciudad, paisajes reconocibles y una salida con ritmo turístico completo.",
            incluye: ["Traslado", "Alojamiento", "Excursiones"],
            noIncluye: ["Comidas no especificadas", "Gastos personales", "Excursiones opcionales", "Extras no detallados"],
            formasPago: ["Efectivo / transferencia", "Financiación a consultar", "Reserva sujeta a disponibilidad"],
            temporada: "Temporada 2026",
            precio: "Consultar disponibilidad",
            precioDesde: "$ 720.000",
            image: "assets/img/turismo/package-rio-destino.webp",
            gallery: ["assets/img/turismo/package-rio-destino.webp", "assets/img/turismo/hero/ciudad-rio.webp", "assets/img/turismo/hero/playa-rio.webp"],
            imageSource: "Wikimedia Commons - File:Copacabana vista pao acucar.jpg",
            imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Copacabana_vista_pao_acucar.jpg"
          },
          {
            destino: "Caribe",
            slug: "caribe",
            tipo: "Internacional",
            categoria: "Grupo",
            intenciones: ["playa", "familiar", "pareja", "grupo"],
            duracion: "8 días · 7 noches",
            resumen: "Una propuesta para viajar en grupo, descansar y disfrutar playas soñadas.",
            descripcion: "Un viaje pensado para descansar, disfrutar playas claras y consultar una opción internacional con asesoramiento.",
            incluye: ["Traslado", "Alojamiento", "Excursiones"],
            noIncluye: ["Comidas no especificadas", "Gastos personales", "Excursiones opcionales", "Extras no detallados"],
            formasPago: ["Efectivo / transferencia", "Financiación a consultar", "Reserva sujeta a disponibilidad"],
            temporada: "Temporada 2026",
            precio: "Consultar disponibilidad",
            precioDesde: "$ 950.000",
            image: "assets/img/turismo/package-caribe-destino.webp",
            gallery: ["assets/img/turismo/package-caribe-destino.webp", "assets/img/turismo/package-caribe-beach.webp", "assets/img/turismo/package-caribe-sunset.webp"],
            imageSource: "Wikimedia Commons - File:Punta Cana Beach 01.jpg",
            imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Punta_Cana_Beach_01.jpg"
          }
        ],
        finalCta: {
          title: "¿No encontraste el destino que buscabas?",
          text: "Escribinos y te ayudamos a encontrar una opción para tu viaje.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero consultar por un destino turístico de El Ángel Azul.")]
        }
      };

      const estudiantilData = {
        hero: {
          title: "Viajes estudiantiles para vivir experiencias inolvidables.",
          subtitle: "Propuestas para primaria y secundaria con acompañamiento, organización y experiencias pensadas para cada etapa.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero consultar por viajes estudiantiles de El Ángel Azul.")]
        },
        paths: [
          {
            title: "Primaria",
            text: "Viajes diseñados para que los chicos disfruten, aprendan y compartan experiencias únicas junto a sus compañeros.",
            button: ["Ver viajes de primaria", "#/estudiantil/primaria-carlos-paz"]
          },
          {
            title: "Secundaria",
            text: "Experiencias de egresados y viajes estudiantiles pensados para crear recuerdos que duran toda la vida.",
            button: ["Ver viajes de secundaria", "#/estudiantil/secundaria-bariloche"]
          }
        ],
        benefits: [
          "Acompañamiento durante todo el viaje",
          "Experiencia en turismo estudiantil",
          "Opciones de financiación",
          "Atención personalizada"
        ],
        finalCta: {
          title: "¿Querés recibir información para tu curso o colegio?",
          text: "Escribinos y te ayudamos a encontrar la mejor opción.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero recibir información para mi curso o colegio con El Ángel Azul.")]
        }
      };

      const primariaCarlosPazData = {
        hero: {
          title: "Viaje de primaria a Carlos Paz",
          subtitle: "Una experiencia pensada para que los chicos disfruten, aprendan y compartan momentos inolvidables junto a sus compañeros.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero consultar por el viaje de primaria a Carlos Paz de El Ángel Azul.")]
        },
        experience: {
          title: "Experiencia",
          text: "Una propuesta para compartir convivencia, diversión, aprendizaje y actividades grupales en un viaje pensado para primaria."
        },
        itinerary: {
          title: "Itinerario del viaje",
          text: "Próximamente se cargará el detalle completo de actividades y cronograma."
        },
        benefits: [
          "Acompañamiento",
          "Organización",
          "Seguridad",
          "Atención personalizada"
        ],
        finalCta: {
          title: "¿Querés información para tu colegio?",
          text: "Escribinos y te contamos todos los detalles del viaje.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero información para mi colegio sobre el viaje de primaria a Carlos Paz de El Ángel Azul.")]
        }
      };

      const cenaDeVelasGallery = [
        "assets/img/bariloche/cena-de-velas/dsc6901.webp",
        "assets/img/bariloche/cena-de-velas/dsc6987.webp",
        "assets/img/bariloche/cena-de-velas/dsc7015.webp"
      ];

      const fiestaFluoGallery = [
        "assets/img/bariloche/fiesta-fluo/dsc6675.webp",
        "assets/img/bariloche/fiesta-fluo/dsc6681.webp",
        "assets/img/bariloche/fiesta-fluo/dsc6695.webp"
      ];

      const secundariaBarilocheData = {
        hero: {
          title: "Viaje de egresados a Bariloche",
          subtitle: "Una experiencia única para compartir con amigos y crear recuerdos que acompañan toda la vida.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero consultar por el viaje de egresados a Bariloche de El Ángel Azul.")]
        },
        experiences: [
          {
            title: "EXCURSIONES",
            items: [
              { name: "Cerro Catedral", description: "", gallerySlots: 3 },
              { name: "Cerro Otto", description: "", gallerySlots: 3 },
              { name: "Circuito Chico", description: "", gallerySlots: 3 },
              { name: "City Tour", description: "", gallerySlots: 3 }
            ]
          },
          {
            title: "ACTIVIDADES",
            items: [
              { name: "Fourtrax", description: "", gallerySlots: 3 },
              { name: "Paintball", description: "", gallerySlots: 3 }
            ]
          },
          {
            title: "NOCHES TEMÁTICAS",
            items: [
              {
                name: "Cena de Velas",
                description: "Una noche especial para compartir con amigos, disfrutar un ambiente único y vivir uno de los momentos más recordados del viaje a Bariloche.",
                cover: "assets/img/bariloche/cena-de-velas/cover.webp",
                gallery: cenaDeVelasGallery,
                videos: []
              },
              { name: "Fiesta Bizarra", description: "", gallerySlots: 3 },
              { name: "Fiesta del Estudiante", description: "", gallerySlots: 3 },
              {
                name: "Fiesta Fluo",
                description: "",
                cover: "assets/img/bariloche/fiesta-fluo/cover.webp",
                gallery: fiestaFluoGallery,
                videos: []
              },
              { name: "Pasiones", description: "", gallerySlots: 3 },
              { name: "Pijamada Real", description: "", gallerySlots: 3 }
            ]
          },
          {
            title: "EVENTO ESPECIAL",
            items: [
              { name: "Tom Wesley", description: "", gallerySlots: 3 }
            ]
          }
        ],
        finalCta: {
          title: "¿Querés información para tu curso?",
          text: "Escribinos y te contamos todos los detalles del viaje.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero información para mi curso sobre el viaje de egresados a Bariloche de El Ángel Azul.")]
        }
      };

      const secundariaCarlosPazData = {
        hero: {
          title: "Viaje de egresados a Carlos Paz",
          subtitle: "Una experiencia para compartir con el curso, disfrutar actividades grupales y vivir el viaje de egresados de una forma única.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero consultar por el viaje de egresados a Carlos Paz de El Ángel Azul.")]
        },
        experience: {
          title: "Experiencia",
          text: "Una propuesta de viaje de egresados para compartir en grupo, disfrutar con amigos y vivir actividades compartidas con el curso."
        },
        information: {
          title: "Información del viaje",
          text: "Próximamente se cargará el detalle completo del programa, actividades y servicios incluidos."
        },
        benefits: [
          "Financiación",
          "Acompañamiento",
          "Organización",
          "Atención personalizada"
        ],
        finalCta: {
          title: "¿Querés información para tu curso?",
          text: "Escribinos y te contamos todos los detalles del viaje.",
          button: ["Consultar por WhatsApp", whatsappLink("Hola, quiero información para mi curso sobre el viaje de egresados a Carlos Paz de El Ángel Azul.")]
        }
      };
