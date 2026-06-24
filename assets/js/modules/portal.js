(function () {
  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function statusTone(value) {
    const normalized = normalize(value);
    if (normalized.includes("dia") || normalized.includes("día") || normalized.includes("completo") || normalized.includes("confirmado") || normalized.includes("pagada") || normalized.includes("activo")) return "is-ok";
    if (normalized.includes("vencida") || normalized.includes("vencido") || normalized.includes("baja") || normalized.includes("rechazada") || normalized.includes("observada")) return "is-alert";
    return "is-pending";
  }

  function paymentStatus(record = {}) {
    const installments = record.installments || [];
    if (record.balance <= 0) return "Pagos al día";
    if (installments.some(item => normalize(item.cuota_estado) === "vencida")) return "Cuotas vencidas";
    if (record.hasReview) return "Pago en revisión";
    if (record.nextInstallment) return "Plan en curso";
    return "Saldo pendiente";
  }

  function documentationItems(record = {}) {
    const source = record.documentation || {};
    const items = [
      { label: "Documentación general", status: source.general || source.documentacion || "Pendiente de validar" },
      { label: "Ficha médica", status: source.medical || source.fichaMedica || "Pendiente de validar" },
      { label: "Autorización de viaje", status: source.authorization || source.autorizacion || "Pendiente de validar" }
    ];
    return items.map((item) => {
      const normalized = normalize(item.status);
      const isComplete = normalized.includes("completa") || normalized.includes("cargada") || normalized.includes("aprobada") || normalized.includes("confirmada");
      return { ...item, isComplete };
    });
  }

  function whatsappMessage(record = {}) {
    return [
      "Hola, quiero consultar por el portal de pasajeros.",
      `Pasajero: ${record.name}.`,
      `DNI: ${record.dni}.`,
      `Contrato: ${record.contractCode}.`
    ].join(" ");
  }

  window.ElAngelAzulPortal = {
    statusTone,
    paymentStatus,
    documentationItems,
    whatsappMessage
  };
})();
