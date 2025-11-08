-- Script para agregar id_sucursal como llave foránea a la tabla usuarios
-- Ejecuta este script en tu base de datos MySQL

-- 1. Agregar la columna id_sucursal (opcional, puede ser NULL)
ALTER TABLE usuarios 
ADD COLUMN id_sucursal INT NULL AFTER password;

-- 2. Agregar la llave foránea
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuario_sucursal 
FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal);

-- Si quieres hacer la columna obligatoria después de asignar valores:
-- Primero actualiza los usuarios existentes con una sucursal por defecto:
-- UPDATE usuarios SET id_sucursal = 1 WHERE id_sucursal IS NULL;
-- 
-- Luego cambia la columna a NOT NULL:
-- ALTER TABLE usuarios MODIFY COLUMN id_sucursal INT NOT NULL;

