# CRM Mi Turno Digital

Página de administración para cargar listas de peluquerías, centros de estética y peluquerías caninas, contactarlas por WhatsApp y hacer seguimiento comercial de [miturnodigital.com.ar](https://miturnodigital.com.ar).

## Qué hace

- Carga CSV o Excel por ciudad o pueblo.
- Arma una tabla con nombre, rubro, ubicación, WhatsApp y redes.
- Abre WhatsApp con un mensaje precargado para presentar Mi Turno Digital.
- Marca **contactado**, **respondió OK** y **respuesta negativa**.
- Guarda la fecha del último mensaje y pinta en amarillo los negocios con más de 15 días sin respuesta.

Los datos se guardan en el navegador (IndexedDB / localStorage). No hace falta base de datos ni login. Si cambiás de computadora, usá **Mensaje y ajustes → Descargar backup**.

## Cómo correrla en local

```bash
npm install
npm run dev
```

La app queda en [http://localhost:43221](http://localhost:43221).

## Cómo publicarla en Vercel

1. Subí este repositorio a GitHub.
2. En [vercel.com](https://vercel.com) importá el repo.
3. Framework: Next.js. Build: `next build`. No hace falta variable de entorno.
4. Deploy.

## Formato de archivo

La plantilla está en `public/plantilla-negocios.csv`. Columnas reconocidas:

| Columna | Alias aceptados |
| --- | --- |
| nombre | name, negocio |
| rubro | categoria, tipo |
| ubicacion | direccion, address |
| numero de telefono | telefono, whatsapp, celular |
| redes sociales | instagram, redes, ig |
| contactado | contacted |
| respondio ok | interesado |
| respuesta negativa | negativo |
| ultimo mensaje enviado | fecha |

Al subir un archivo pedí el **título de la ciudad** para separar Mar del Plata, Tandil, Balcarce, etc.

## Mensaje de WhatsApp

Se edita en **Mensaje y ajustes**. Variables disponibles:

- `{{nombre}}`
- `{{rubro}}`
- `{{ciudad}}`
- `{{direccion}}`
