-- Script SIMPLE para actualizar la tabla usuarios
-- Ejecuta este script en tu base de datos MySQL
-- IMPORTANTE: Si alguna columna ya existe, el script fallará en esa línea
-- Puedes comentar las líneas de columnas que ya existen

-- 1. Agregar columna email
ALTER TABLE usuarios 
ADD COLUMN email VARCHAR(100) NOT NULL AFTER nombre;

-- 2. Agregar columna password
ALTER TABLE usuarios 
ADD COLUMN password VARCHAR(255) NOT NULL AFTER email;

-- 3. Agregar columna id_sucursal
-- NOTA: Si tienes usuarios existentes, primero asigna un valor por defecto
ALTER TABLE usuarios 
ADD COLUMN id_sucursal INT NOT NULL AFTER password;

-- 4. Agregar columna activo
ALTER TABLE usuarios 
ADD COLUMN activo BOOLEAN DEFAULT TRUE AFTER id_sucursal;

-- 5. Agregar índice único para email
CREATE UNIQUE INDEX email_unique ON usuarios(email);

-- 6. Agregar foreign key para id_sucursal
-- IMPORTANTE: Asegúrate de tener al menos una sucursal creada
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuario_sucursal 
FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal);

-- 7. Si tienes usuarios existentes, actualiza sus valores:
-- Primero crea una sucursal si no existe:
-- INSERT INTO sucursales (id_sucursal, gerente, ubicacion) VALUES (1, 'Gerente Default', 'Ubicación Default');

-- Luego actualiza los usuarios existentes:
-- UPDATE usuarios SET id_sucursal = 1 WHERE id_sucursal IS NULL OR id_sucursal = 0;
-- UPDATE usuarios SET email = CONCAT('usuario', id_usuario, '@example.com') WHERE email IS NULL OR email = '';
-- UPDATE usuarios SET password = '$2a$10$defaultHash' WHERE password IS NULL OR password = '';
-- UPDATE usuarios SET activo = TRUE WHERE activo IS NULL;

