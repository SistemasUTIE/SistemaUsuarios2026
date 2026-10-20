# Usuarios IEEN

Aplicación web para administrar sistemas, perfiles, permisos y cuentas de usuario.

## Requisitos

- Node.js 22.12 o superior (o una versión compatible indicada en `package.json`).
- npm, pnpm o yarn.

## Configuración

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y configura las direcciones de los servicios de tu entorno:

   ```text
   QCLI_API_BASE_URL=
   QCLI_LOGIN_URL=
   QCLI_USER_ACCESS_URL=
   ```

   `QCLI_API_BASE_URL` debe apuntar a la API e incluir la ruta base, por ejemplo `/api`.
   `QCLI_LOGIN_URL` es la dirección a la que se redirige cuando la sesión caduca.
   `QCLI_USER_ACCESS_URL` es la dirección que se muestra en el comprobante de usuario.
   Mantén entre comillas los valores que contengan `#`, como en `.env.example`.

   El archivo `.env` está excluido de Git. Las variables `QCLI_*` se incorporan al
   JavaScript del navegador durante la compilación; no coloques contraseñas, tokens
   ni otras credenciales en ellas.

## Desarrollo

```bash
npm run dev
```

## Verificaciones

```bash
npm run lint:check
npm run build
```

## Publicación

Al compilar para un despliegue, configura las tres variables `QCLI_*` en el entorno
de compilación. No publiques archivos `.env` ni credenciales.
