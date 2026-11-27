-- El Ángel Azul — contra el doble envío de fichas (10/11/2026).
-- insertFichaPublica/insertFichaTutor revisan "ya existe" y después insertan:
-- dos envíos simultáneos pasaban los dos. Estos índices cierran esa ventana en
-- la base. Si ya hubiera duplicados vigentes, la migración falla (a propósito):
-- resolverlos a mano antes de reintentar.

-- Una sola inscripción vigente por persona y viaje. Rechazar o marcar duplicada
-- una ficha pasa su inscripción a 'cancelada' (lo hace updateFichasAdmin), así
-- la familia puede volver a cargarla.
create unique index inscripciones_vigente_uk
  on inscripciones (persona_id, viaje_id)
  where estado in ('iniciada', 'ficha_enviada');

-- Un solo tutor vigente por pasajero (DNI) y documento de tutor.
create unique index fichas_tutor_vigente_uk
  on fichas_tutor (pasajero_numero_documento, numero_documento)
  where estado_revision <> 'rechazada';
