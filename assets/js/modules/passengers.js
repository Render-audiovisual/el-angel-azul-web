(function () {
  function rows(groups = [], paymentData) {
    return groups.flatMap((group) => (
      (group.pasajeros || []).map((passenger) => ({
        group,
        passenger,
        payment: paymentData(passenger)
      }))
    ));
  }

  function filterRows(rowsToFilter = [], filters = {}) {
    const normalizeText = filters.normalizeText || ((value) => String(value || "").toLowerCase());
    const search = normalizeText(filters.search);
    return rowsToFilter.filter(({ group, passenger, payment }) => {
      const searchable = normalizeText([
        passenger.nombre,
        passenger.dni,
        passenger.telefono,
        passenger.responsable,
        passenger.responsableTelefono,
        group.viaje,
        group.colegio,
        group.curso,
        group.division
      ].join(" "));
      if (search && !searchable.includes(search)) return false;
      if (filters.viaje && group.viaje !== filters.viaje) return false;
      if (filters.colegio && group.colegio !== filters.colegio) return false;
      if (filters.curso && `${group.curso} ${group.division}` !== filters.curso) return false;
      if (
        filters.estado &&
        passenger.estado !== filters.estado &&
        payment.estadoPago !== filters.estado &&
        passenger.documentacion !== filters.estado
      ) return false;
      return true;
    });
  }

  function dashboardSummary(rowsToSummarize = []) {
    return rowsToSummarize.reduce((summary, { passenger, payment }) => {
      summary.total += 1;
      if (passenger.estado === "Activo") summary.activos += 1;
      if (payment.estadoPago !== "Al día") summary.pagoPendiente += 1;
      if (passenger.documentacion !== "Completa") summary.documentacionPendiente += 1;
      return summary;
    }, { total: 0, activos: 0, pagoPendiente: 0, documentacionPendiente: 0 });
  }

  window.ElAngelAzulPassengers = {
    rows,
    filterRows,
    dashboardSummary
  };
})();
