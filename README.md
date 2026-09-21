# CRM Mi Turno Digital

Página de administración para cargar listas de peluquerías, centros de estética y peluquerías caninas, contactarlas por WhatsApp y hacer seguimiento comercial de [miturnodigital.com.ar](https://miturnodigital.com.ar).

## Qué hace

- Importa CSV (o Excel) con las columnas del **molde**.
- Guarda cada importación y los ajustes en **Neon** (Postgres gratis, online).
- Agrupa por la columna `ciudad`.
- Abre WhatsApp con un mensaje precargado.
- Marca contactado, respondió OK y respuesta negativa.
- Pinta en amarillo si pasaron más de 15 días sin respuesta.

## Base de datos (Neon, gratis)

Las tablas coinciden con la grilla:

| Tabla | Columnas |
| --- | --- |
| `listas` | ciudad (`titulo`), archivo de origen |
| `negocios` | nombre, rubro, ubicacion, whatsapp, redes, contactado, respondio_ok, respuesta_negativa, ultimo_mensaje |
| `configuracion` | mensaje de WhatsApp y días para recontactar |

### Crear la base (sin tarjeta)

```bash
npm install
npm run db:create
```

Eso crea una base Neon claimable y deja las URLs en `.env.local`. En *Mensaje y ajustes* hay un botón **Quedarte con esta base (gratis)**: abrilo dentro de 72 horas y asociála a tu cuenta de [neon.tech](https://neon.tech) para que no expire.

También podés crear el proyecto a mano en Neon o en [Supabase](https://supabase.com) (Postgres) y pegar el connection string como `DATABASE_URL`. Después corré el SQL de `db/schema.sql`.

En Vercel agregá `DATABASE_URL` (y si existe, `PUBLIC_POSTGRES_CLAIM_URL`) en Environment Variables.

## Cómo importar

1. Descargá **Molde CSV**.
2. Completá las filas (o usá `datos-prueba-mar-del-plata.csv` para probar).
3. Importar CSV → se crean las listas por ciudad y se escriben en Neon.

El molde usa punto y coma (`;`), el separador que espera Excel en español:

`ciudad;nombre;rubro;ubicacion;numero de telefono;redes sociales;contactado;respondio ok;respuesta negativa;ultimo mensaje enviado`

## Cómo correrla en local

```bash
npm install
npm run db:create
npm run dev
```

La app queda en [http://localhost:43221](http://localhost:43221).

## Cómo publicarla en Vercel

1. Importá el repo en [vercel.com/new](https://vercel.com/new).
2. Framework: Next.js. Build: `next build`.
3. Pegá `DATABASE_URL` de Neon en las variables de entorno.
4. Deploy.
