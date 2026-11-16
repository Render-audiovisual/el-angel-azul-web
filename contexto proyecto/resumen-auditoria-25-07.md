# Resumen de auditoría — El Ángel Azul (25/07)

Commits pusheados a `main`: `636b44f`, `616c104`, `478bda5`.

## Qué se auditó

Repo/config, autenticación de las 6 cuentas, PostgreSQL (pool, transacciones,
concurrencia, secretos en errores), el aviso reportado de "No se pudo leer
Pasajeros/Fichas/Turismo", frontend en navegador real (Home, Turismo,
Inscripción, admin Grupos/Contratos/Pasajeros), y flujo completo
ficha→pasajero→inscripción. Todo contra el código real y, para lectura, contra
la base de producción (101 grupos reales, sin tocarlos).

## Lo que fallaba (3 causas raíz, las 3 corregidas)

**1. El aviso reportado — `FICHAS_ADHESION` dependía de Google Sheets incluso con Postgres activo.**
Con `EAA_POSTGRES_MIGRATION_ENABLED=true`, todas las hojas menos Fichas ya
ignoraban Sheets. Fichas se había migrado antes de que existiera esa bandera y
seguía llamando a Sheets sin condición para "no perder fichas viejas" — sin
credenciales configuradas (a propósito, ya no se usan), esa llamada tiraba
"Credenciales de Google Sheets no configuradas" y devolvía 500 en vez de la
lista real de Postgres. Confirmado con la config exacta de Hostinger: 500
antes del fix, 200 después.

**2. Los contratos "editables" de la pantalla de Contratos eran ilusorios.**
Cada uno de los 101 grupos muestra un contrato "base" generado al vuelo
(nunca guardado) para que el equipo tenga algo para empezar a validar. El
botón "Editar" buscaba ese contrato en la lista de contratos *reales*, donde
nunca estaba — clic en "Editar" no hacía absolutamente nada, sin error, en
las 101 filas. Al corregirlo encontré un segundo problema más serio: la
función que arma el guardado usaba la misma lista mezclada, así que guardar
UN contrato real arrastraba los otros 100 placeholders y los escribía como
reales — esto pasó de verdad probando el fix (0→101 contratos falsos en
producción) y lo revertí al toque con tu autorización. Ahora: editar un
contrato persiste solo ese, los otros 100 siguen como borrador sin tocar la
base.

**3. Login/logout aceptaba pedidos sin header `Origin`.**
La protección "mismo origen" trataba la *ausencia* del header como si fuera
válido. Un navegador real siempre manda ese header en pedidos de login/guardado
— el único tráfico que se beneficiaba de aceptarlo sin header era justo el
que esta protección debía bloquear (scripts, CSRF clásico). Ahora se rechaza.

## Lo que se probó y quedó bien

Las 6 cuentas (admin + 5 agentes) autentican y separan roles correctamente,
sin fallback inseguro. Sin SQL injection, sin secretos filtrados en errores
(probado forzando una caída real de conexión). Los 101 grupos reales están
sin duplicados. Home/Turismo/Inscripción cargan sin errores de consola.
Turismo público es independiente de Postgres. No se siembran datos ficticios
con tablas vacías.

## Pendiente, no bloqueante

- El selector de contrato al cargar un pasajero puede mostrar un placeholder;
  si se elige, el guardado falla con mensaje claro (no corrompe nada), pero
  es confuso para quien lo use — no corregido, queda para una próxima ronda.
- Verificar en Hostinger real si la cookie de sesión sale con el flag
  `Secure` (depende de si el proxy de Hostinger manda `x-forwarded-proto:
  https`, igual que hacía Railway) — no lo pude probar sin el deploy real.
