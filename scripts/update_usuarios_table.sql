-- Script para actualizar la tabla usuarios con las columnas necesarias
-- Ejecuta este script en tu base de datos MySQL
-- IMPORTANTE: Asegúrate de tener al menos una sucursal creada antes de ejecutar esto

-- Verificar y agregar columna email
SET @dbname = DATABASE();
SET @tablename = 'usuarios';
SET @columnname = 'email';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NOT NULL AFTER nombre')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna password
SET @columnname = 'password';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) NOT NULL AFTER email')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna id_sucursal
SET @columnname = 'id_sucursal';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NOT NULL AFTER password')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna activo
SET @columnname = 'activo';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT TRUE AFTER id_sucursal')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice único para email (si no existe)
CREATE UNIQUE INDEX IF NOT EXISTS email_unique ON usuarios(email);

-- Agregar foreign key para id_sucursal (si no existe)
-- Nota: Si ya existe, esto fallará, pero puedes ignorar el error
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuario_sucursal 
FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal);

-- Para usuarios existentes sin sucursal, asignarles la sucursal 1 por defecto
-- (Asegúrate de tener al menos una sucursal creada primero)
-- Descomenta la siguiente línea si necesitas actualizar usuarios existentes:
-- UPDATE usuarios SET id_sucursal = 1 WHERE id_sucursal IS NULL OR id_sucursal = 0;

