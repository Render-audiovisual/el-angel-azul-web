# Panel interno protegido

El panel interno funciona como SPA y requiere una sesión válida del servidor.

## Rutas

- Panel: `/admin/` o `/#/admin`
- Inscripciones: `/admin/fichas/`
- Grupos y contratos: `/admin/grupos/`
- Pasajeros: `/admin/pasajeros/`
- Pagos: `/admin/pagos/`
- Turismo: `/admin/turismo/`
- Configuración: `/admin/configuracion/`

## Protección

El servidor usa cookie `HttpOnly`, sesión de 8 horas, validación de mismo origen
y contraseñas definidas únicamente como variables privadas de Hostinger.

El rol `admin` puede entrar a Configuración. Las cuentas `agente1` a `agente5`
no ven esa sección y tampoco pueden abrirla escribiendo la URL directa.

Las rutas con hash se reconocen como entradas privadas, cargan las colecciones
autenticadas y ocultan la navegación pública.
