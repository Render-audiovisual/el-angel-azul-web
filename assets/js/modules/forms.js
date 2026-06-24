(function () {
  function fichaStatusForPassenger(passenger = {}, group = {}, fichas = []) {
    const passengerDni = String(passenger.dni || "").trim();
    if (!passengerDni) return "No cargada";

    const ficha = fichas.find((item) => {
      const fichaDni = String(item.pasajeroNumeroDocumento || item.pasajeroDni || "").trim();
      if (fichaDni !== passengerDni) return false;
      const sameNivel = !item.nivel || item.nivel === group.nivel || item.nivel.includes("Pendiente");
      const sameViaje = !item.viaje || item.viaje === group.viaje || item.viaje.includes("Pendiente");
      const sameColegio = !item.colegio || item.colegio === group.colegio || item.colegio.includes("Pendiente");
      const sameCurso = !item.cursoDivision || item.cursoDivision === `${group.curso} ${group.division}` || item.cursoDivision.includes("Pendiente");
      return sameNivel && sameViaje && sameColegio && sameCurso;
    });

    return ficha ? ficha.estadoRevision || "pendiente" : "No cargada";
  }

  window.ElAngelAzulForms = {
    fichaStatusForPassenger
  };
})();
