-- Tablas alineadas con las columnas de la grilla del CRM.
-- listas = una ciudad/pueblo
-- negocios = cada fila importada (nombre, rubro, ubicación, WhatsApp, redes, checks, último mensaje)
-- configuracion = mensaje de WhatsApp y días para recontactar

CREATE TABLE IF NOT EXISTS listas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  archivo_origen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS negocios (
  id TEXT PRIMARY KEY,
  lista_id TEXT NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rubro TEXT NOT NULL DEFAULT '',
  ubicacion TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  redes TEXT NOT NULL DEFAULT '',
  contactado BOOLEAN NOT NULL DEFAULT false,
  respondio_ok BOOLEAN NOT NULL DEFAULT false,
  respuesta_negativa BOOLEAN NOT NULL DEFAULT false,
  ultimo_mensaje TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS negocios_lista_id_idx ON negocios (lista_id);
CREATE INDEX IF NOT EXISTS negocios_nombre_idx ON negocios (nombre);

CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY DEFAULT 1,
  mensaje_whatsapp TEXT NOT NULL,
  dias_recontacto INTEGER NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT configuracion_una_fila CHECK (id = 1)
);

INSERT INTO configuracion (id, mensaje_whatsapp, dias_recontacto)
VALUES (
  1,
  E'Hola {{nombre}}! 👋\nSoy de Mi Turno Digital (https://miturnodigital.com.ar). Vi su {{rubro}} en {{ciudad}} y les escribo porque nuestro sistema de turnos online les puede servir para que sus clientas reserven 24/7 desde el celular, sin mensajes ni llamadas perdidas.\n\n¿Les interesa que les cuente cómo funciona? Es simple de usar y se adapta a peluquerías, centros de estética y peluquerías caninas.',
  15
)
ON CONFLICT (id) DO NOTHING;
