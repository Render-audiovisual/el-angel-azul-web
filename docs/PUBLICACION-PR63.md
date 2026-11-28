# Publicación del PR #63 — 28/11/2026

Autorización explícita del dueño: integrar PR #63, aplicar migraciones en la base oficial y publicar en el dominio principal. Después autorizó validar las cinco restricciones heredadas y crear/revisar una ficha ficticia con acceso de prueba al portal. No autorizó cobros ni correos de prueba y no se realizaron.

## Publicación

- PR #63 integrado mediante merge; commit `bb8bff8919cf232d3c024981115706b455ab4a89`.
- Repositorio `el-angel-azul/el-angel-azul-web`, rama main; comprobaciones de GitHub aprobadas.
- Hostinger principal: `https://elangelazulturrender.rendercorrientes.com/`. Implementación automática, estado Completado, commit bb8bff89, Node 22.x, directorio raíz ./, 17 segundos de despliegue. No se modificaron variables ni credenciales.
- «Fuente Render-audiovisual» es el nombre de la conexión de GitHub mostrado por Hostinger; el enlace de commit/repositorio apunta a la organización el-angel-azul.

## Base oficial

Proyecto `kfjtvazbcaypzuethxav`, El Ángel Azul - Pruebas, organización El Ángel Azul. No se accedió a la base anterior de Franco.

Migraciones 0009–0017 aplicadas juntas mediante editor SQL, dentro de BEGIN/COMMIT y con tiempo de espera de bloqueo limitado. Se comprobó que el texto ejecutado coincidiera exactamente con los nueve archivos del repositorio. No se crearon condiciones económicas ni cuentas automáticamente.

Aplicación manual de SQL, no mediante Supabase CLI: este despliegue no creó un historial estándar de migraciones de CLI. No volver a ejecutar los archivos ni usar una sincronización automática sin reconciliar previamente esquema e historial.

Se verificaron las trece tablas nuevas con RLS activa y los buckets documentos/catalogo privados, límite 5 MB. No había políticas de acceso directo en storage. Las cinco restricciones inicialmente NOT VALID se validaron con autorización específica: no quedaron restricciones públicas sin validar. La lectura previa no encontró incompatibilidades de grupo/viaje, contrato/viaje o plan/contrato, ni principales duplicados.

El editor de Supabase mostró un error de traducción del navegador tras confirmar la ejecución: `Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.` Se recargó y se confirmó que el lote ya estaba aplicado; no se repitió la migración.

## Comprobación sobre el dominio principal

| Control | Resultado |
|---|---|
| Home, home.css y turismo.css | 200 |
| Colegios y paquetes públicos | 200; conexión a base operativa con el nuevo servidor que exige TLS verificado |
| CONFIG sin sesión | 401 |
| Portal sin sesión | 401 |
| HTML actual | Módulo de requisitos/avisos presente; sin Acceso interno en el pie público |
| Admin | Ingreso del dueño; grupos, contratos, ficha, pasajero y Pagos cargados |
| Adhesión | Validación de vacíos y apellidos; envío desde enlace de contrato; confirmación visible y fila persistida |
| Vínculos de adhesión | Colegio, grupo, contrato y plan presentes en la inscripción de prueba |
| Revisión y alta | Ficha marcada en revisión, aprobada y un único pasajero creado |
| PDF | Descarga desde admin y portal; ambos PDF válidos de una página comprobados con pdf-lib |
| Portal | Invitación individual de un uso para responsable ficticio; solo su pasajero visible; sin acceso por DNI |
| Persistencia y salida | Recarga conserva la sesión; cerrar sesión retira información y revoca la sesión de prueba |

Registro ficticio: Pasajero / Prueba Sesenta y Tres, responsable del mismo apellido, domicilio y firma identificados PR63. Quedó aprobado en el contrato ficticio PRUEBA-001, colegio de prueba, 5° B, Bariloche 2027, plan Contado de prueba. Es una comprobación operativa, sin deuda o aceptación comercial real.

Antes: dos pasajeros, dos fichas, cero cobros. Después: tres pasajeros, tres fichas, cero cobros, cero sesiones de portal activas y cero restricciones pendientes de validación. La ficha de prueba se conserva en el historial; no se borraron datos anteriores. No se enviaron correos y no se registraron pagos.

## Límites que continúan

El portal informa correctamente que todavía no hay importes/vencimientos confirmados para el pasajero ficticio. El envío automático por correo sigue sin configurar. No se probó una subida de archivos a Storage en esta publicación: se verificaron los buckets, la configuración disponible y las lecturas de metadatos, sin crear documentos de prueba adicionales.

La empresa todavía debe configurar condiciones reales, requisitos documentales y consentimientos, revisar vínculos de responsables heredados antes de emitir accesos reales, y definir conservación/antivirus/conciliación de archivos. El PDF conserva el límite tipográfico de caracteres extranjeros documentado en la auditoría. No se modificaron esas políticas ni se incorporaron dependencias.
