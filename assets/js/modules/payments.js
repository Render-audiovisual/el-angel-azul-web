(function () {
  function parseMoney(value) {
    const normalized = String(value || "").replace(/[^\d.-]/g, "");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function paymentData(passenger = {}) {
    const estadoPago = passenger.pago || "Pendiente";
    const isPaid = estadoPago === "Al día";
    const isOverdue = estadoPago === "Vencido";
    const valorViaje = passenger.valorViaje || (isPaid || isOverdue ? "1200000" : "1100000");
    const pagado = passenger.pagado || (isPaid ? "600000" : isOverdue ? "250000" : "100000");
    const calculatedBalance = Math.max(0, parseMoney(valorViaje) - parseMoney(pagado));

    return {
      planPago: passenger.planPago || (estadoPago === "Pendiente" || isOverdue ? "Especial" : "Regular"),
      valorViaje,
      sena: passenger.sena || (isPaid ? "150000" : "100000"),
      cuotas: passenger.cuotas || (isOverdue ? "10" : estadoPago === "Pendiente" ? "12" : "10"),
      pagado,
      saldo: passenger.saldo || String(calculatedBalance),
      proximaCuota: passenger.proximaCuota || (isOverdue ? "2026-06-10" : "2026-07-10"),
      estadoPago
    };
  }

  function installments(passenger = {}) {
    const payment = paymentData(passenger);
    const cuotas = Math.min(18, Math.max(1, parseInt(payment.cuotas, 10) || 1));
    const valorViaje = parseMoney(payment.valorViaje);
    const sena = parseMoney(payment.sena);
    const pagado = parseMoney(payment.pagado);
    const financedAmount = Math.max(0, valorViaje - sena);
    const installmentAmount = cuotas ? Math.round(financedAmount / cuotas) : financedAmount;
    const paidAfterDeposit = Math.max(0, pagado - sena);
    let remainingPaid = paidAfterDeposit;

    return Array.from({ length: cuotas }, (_, index) => {
      const number = index + 1;
      const amountPaid = Math.min(installmentAmount, remainingPaid);
      remainingPaid = Math.max(0, remainingPaid - installmentAmount);
      const status = amountPaid >= installmentAmount ? "Pagada" : amountPaid > 0 ? "Parcial" : "Pendiente";
      if (payment.estadoPago === "Vencido" && status === "Pendiente" && number === 1) {
        return { number, amount: installmentAmount, amountPaid, status: "Vencida" };
      }
      return { number, amount: installmentAmount, amountPaid, status };
    });
  }

  function installmentSummary(passenger = {}) {
    const rows = installments(passenger);
    const paid = rows.filter((installment) => installment.status === "Pagada").length;
    const partial = rows.filter((installment) => installment.status === "Parcial").length;
    const overdue = rows.filter((installment) => installment.status === "Vencida").length;
    const pending = rows.filter((installment) => installment.status === "Pendiente").length;
    return `${paid}/${rows.length} pagadas${partial ? ` · ${partial} parcial` : ""}${overdue ? ` · ${overdue} vencida` : ""}${pending ? ` · ${pending} pendientes` : ""}`;
  }

  function paymentHistory(passenger = {}) {
    const payment = paymentData(passenger);
    const paid = parseMoney(payment.pagado);
    const deposit = Math.min(parseMoney(payment.sena), paid);
    const paidInstallments = installments(passenger).filter((installment) => installment.amountPaid > 0);
    const history = [];

    if (deposit > 0) {
      history.push({
        date: passenger.senaFecha || "Alta del pasajero",
        concept: "Seña",
        method: passenger.senaMedio || "Pendiente de registrar",
        amount: deposit,
        status: "Confirmado"
      });
    }

    paidInstallments.slice(0, 4).forEach((installment) => {
      history.push({
        date: passenger.proximaCuota || "Fecha pendiente",
        concept: `Cuota ${installment.number}`,
        method: passenger.ultimoMedioPago || "Pendiente de registrar",
        amount: installment.amountPaid,
        status: installment.status === "Pagada" ? "Confirmado" : "Parcial"
      });
    });

    return history.length ? history : [{
      date: "Sin movimientos",
      concept: "Historial preparado",
      method: "A completar cuando se registren pagos reales",
      amount: 0,
      status: "Pendiente"
    }];
  }

  window.ElAngelAzulPayments = {
    parseMoney,
    paymentData,
    installments,
    installmentSummary,
    paymentHistory
  };
})();
