(function () {
  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function groupId(nivel, viaje, colegio, curso, division) {
    return slug(`${nivel}-${viaje}-${colegio}-${curso}-${division}`);
  }

  function normalizeGroup(group = {}) {
    const nivel = group.nivel || "Secundaria";
    const viaje = group.viaje || "Bariloche 2026";
    const colegio = group.colegio || "Colegio pendiente";
    const curso = group.curso || "5to";
    const division = group.division || "A";
    return {
      id: group.id || groupId(nivel, viaje, colegio, curso, division),
      nombre: group.nombre || `${colegio} - ${curso} ${division} - ${viaje}`,
      nivel,
      viaje,
      colegio,
      curso,
      division,
      pasajerosEsperados: Number(group.pasajerosEsperados) || 0,
      pasajeros: Array.isArray(group.pasajeros) ? group.pasajeros : []
    };
  }

  window.ElAngelAzulGroups = {
    groupId,
    normalizeGroup
  };
})();
