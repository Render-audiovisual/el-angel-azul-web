# Panel Interno protegido

El panel interno ahora tiene entrada real bajo `/admin/`.

## Rutas

- Web publica: `/`
- Turismo publico: `/#/turismo`
- Portal de pasajeros publico: `/#/portal-pasajeros`
- Panel interno: `/admin/`
- Turismo admin: `/admin/turismo/`
- Pasajeros admin: `/admin/pasajeros/`
- Pagos admin: `/admin/pagos/`
- Configuracion admin: `/admin/configuracion/`
- Compatibilidad temporal: `/admin-turismo/`

## Proteccion pendiente en hosting

Proteger por servidor o hosting todo lo que cuelga de:

- `/admin/`
- `/admin-turismo/` si se mantiene la compatibilidad temporal

No guardar usuario ni password en archivos frontend. Las credenciales deben vivir en el hosting, servidor, Cloudflare Access, Basic Auth, Nginx, Hostinger o mecanismo equivalente.

Usuario inicial previsto:

- Agus / Render

## Nota sobre rutas antiguas

Las rutas antiguas con hash, como `/#/admin` y `/#/admin/turismo`, redirigen a la entrada real correspondiente. Esto evita que el panel dependa de rutas hash para el acceso.
