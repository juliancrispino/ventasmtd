# CRM Mi Turno Digital

Página de administración para cargar listas de peluquerías, centros de estética y peluquerías caninas, contactarlas por WhatsApp y hacer seguimiento comercial de [miturnodigital.com.ar](https://miturnodigital.com.ar).

## Qué hace

- Base de datos simple, vacía al inicio, guardada en el navegador.
- Importa CSV (o Excel) con las columnas del **molde**.
- Descarga el molde desde la página para no errar los campos.
- Agrupa por la columna `ciudad`.
- Abre WhatsApp con un mensaje precargado.
- Marca contactado, respondió OK y respuesta negativa.
- Pinta en amarillo si pasaron más de 15 días sin respuesta.

## Cómo importar

1. Descargá **Molde CSV**.
2. Completá las filas (o usá `datos-prueba-mar-del-plata.csv` para probar).
3. Importar CSV → se crean las listas por ciudad.

El molde usa punto y coma (`;`), el separador que espera Excel en español:

`ciudad;nombre;rubro;ubicacion;numero de telefono;redes sociales;contactado;respondio ok;respuesta negativa;ultimo mensaje enviado`

Los datos viven en este navegador. En *Mensaje y ajustes* podés vaciar la base o descargar un backup JSON.

## Cómo correrla en local

```bash
npm install
npm run dev
```

La app queda en [http://localhost:43221](http://localhost:43221).

## Cómo publicarla en Vercel

1. Importá el repo en [vercel.com/new](https://vercel.com/new).
2. Framework: Next.js. Build: `next build`.
3. Deploy. No hace falta variable de entorno.
