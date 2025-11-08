-- Script para agregar columna imagen a la tabla productos
-- Ejecuta este script en tu base de datos MySQL

-- Agregar la columna imagen (opcional, puede ser NULL)
ALTER TABLE productos 
ADD COLUMN imagen VARCHAR(500) NULL AFTER precio;

