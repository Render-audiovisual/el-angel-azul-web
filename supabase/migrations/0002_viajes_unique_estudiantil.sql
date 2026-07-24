-- Auditoría 23/07/2026 - riesgo real de concurrencia encontrado con prueba
-- de carga: findOrCreateViaje() en lib/db.js hacía "buscar, si no existe
-- insertar" en dos pasos separados, igual que findOrCreatePersona() antes
-- de su fix. Bajo una ráfaga real de envíos simultáneos para el MISMO
-- nivel+destino (el caso normal, no un caso raro - varias familias del
-- mismo colegio mandando la ficha para el mismo viaje a la vez), las
-- consultas de "buscar" podían no encontrar nada todavía en varias
-- conexiones a la vez, y cada una insertaba su propio viaje - se
-- confirmó en una prueba real: una ráfaga de 30 fichas para "Bariloche
-- 2026" generó 15 filas de viajes duplicadas en vez de reusar una sola.
--
-- Esta migración agrega el índice único que le faltaba a la tabla
-- (parcial, solo para categoria='estudiantil', que es el caso que se
-- resuelve por nivel+destino en vez de por un identificador propio) y
-- lib/db.js pasa a usar un INSERT ... ON CONFLICT atómico contra este
-- índice, igual que ya se hizo para personas.
create unique index if not exists viajes_estudiantil_nivel_destino_uk
  on viajes (categoria, lower(coalesce(nivel, '')), lower(destino))
  where categoria = 'estudiantil';
