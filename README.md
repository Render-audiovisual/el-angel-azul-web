# El Angel Azul Web

Web publica y panel admin de El Angel Azul.

## Arranque local

```bash
npm start
```

El servidor escucha en `PORT` o, si no esta definido, en `8080`.

## Variables de entorno

Configurar estas variables en Railway:

```bash
EAA_ADMIN_PASSWORD=...
EAA_AGENCIA_PASSWORD=...
GOOGLE_SHEETS_SPREADSHEET_ID=17MlFV1VB32PUXm-J7wSocBRDxmepcsmbwRwJa2cGDnI
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

Railway define `PORT` automaticamente. No hace falta cargarlo manualmente salvo que se quiera forzar un puerto en local.

Variables opcionales:

```bash
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=/ruta/local/google-sheets-service-account.json
```

`GOOGLE_APPLICATION_CREDENTIALS` sirve solo para desarrollo local con archivo. En Railway usar `GOOGLE_SHEETS_CREDENTIALS` o `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON`.

## Credenciales de Google Sheets

En local, el servidor puede leer el archivo indicado por `GOOGLE_APPLICATION_CREDENTIALS`.

En Railway no se debe subir el archivo `google-sheets-service-account.json`. En su lugar:

1. Abrir el JSON de service account.
2. Copiar todo el contenido del archivo.
3. Crear la variable `GOOGLE_SHEETS_CREDENTIALS` en Railway.
4. Pegar el JSON completo como valor de esa variable.

La cuenta de servicio debe tener permiso de editor sobre el Google Sheet:

`17MlFV1VB32PUXm-J7wSocBRDxmepcsmbwRwJa2cGDnI`

## Deploy en Railway

1. Subir este proyecto a un repositorio Git.
2. Entrar a Railway.
3. Crear un nuevo proyecto.
4. Elegir "Deploy from GitHub repo".
5. Seleccionar el repo de El Angel Azul.
6. Si el repo contiene mas carpetas, configurar el root directory como:

```text
apps/el-angel-azul-web-v0
```

7. En Variables, cargar:

```text
EAA_ADMIN_PASSWORD
EAA_AGENCIA_PASSWORD
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SHEETS_CREDENTIALS
```

8. Railway detecta `package.json` y ejecuta:

```bash
npm start
```

9. Abrir la URL publica que da Railway.
10. Probar:

```text
/
/#/admin
/api/admin/me
```

## Usuarios admin actuales

El servidor usa estos usuarios:

- `admin` con la password de `EAA_ADMIN_PASSWORD`
- `agencia` con la password de `EAA_AGENCIA_PASSWORD`

## Importante

- No subir `google-sheets-service-account.json`.
- No subir archivos `.env`.
- No subir `node_modules`.
- El endpoint `/api/google-sheets` todavia se protege en una prioridad posterior del admin.
