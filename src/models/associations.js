/**
 * Archivo para definir todas las relaciones entre modelos
 */

const Cliente = require('./Cliente');
const Ubicacion = require('./Ubicacion');
const Sucursal = require('./Sucursal');
const Usuario = require('./Usuario');
const Produccion = require('../modules/production/models/Produccion');
const Producto = require('../modules/products/models/Producto');
const Pedido = require('../modules/orders/models/Pedido');
const PedidoProducto = require('./PedidoProducto');
const Reporte = require('./Reporte');
const Sincronizacion = require('../modules/sales-integration/models/Sincronizacion');

// Relaciones de Cliente
Cliente.hasMany(Ubicacion, {
  foreignKey: 'id_cliente',
  as: 'ubicaciones'
});

Cliente.hasMany(Produccion, {
  foreignKey: 'id_cliente',
  as: 'producciones'
});

Cliente.hasMany(Pedido, {
  foreignKey: 'id_cliente',
  as: 'pedidos'
});

// Relaciones de Ubicacion
Ubicacion.belongsTo(Cliente, {
  foreignKey: 'id_cliente',
  as: 'cliente'
});

// Relaciones de Sucursal
Sucursal.hasMany(Usuario, {
  foreignKey: 'id_sucursal',
  as: 'usuarios'
});

Sucursal.hasMany(Pedido, {
  foreignKey: 'id_sucursal',
  as: 'pedidos'
});

Sucursal.hasMany(Reporte, {
  foreignKey: 'id_sucursal',
  as: 'reportes'
});

Sucursal.hasOne(Sincronizacion, {
  foreignKey: 'id_sucursal',
  as: 'sincronizacion'
});

// Relaciones de Usuario
Usuario.belongsTo(Sucursal, {
  foreignKey: 'id_sucursal',
  as: 'sucursal'
});

Usuario.hasMany(Pedido, {
  foreignKey: 'id_usuario_reportidor',
  as: 'pedidos_reportidos'
});

// Relaciones de Produccion
Produccion.belongsTo(Cliente, {
  foreignKey: 'id_cliente',
  as: 'cliente'
});

// Relaciones de Pedido
Pedido.belongsTo(Cliente, {
  foreignKey: 'id_cliente',
  as: 'cliente'
});

Pedido.belongsTo(Usuario, {
  foreignKey: 'id_usuario_reportidor',
  as: 'usuario_reportidor'
});

Pedido.belongsTo(Sucursal, {
  foreignKey: 'id_sucursal',
  as: 'sucursal'
});

Pedido.belongsToMany(Producto, {
  through: PedidoProducto,
  foreignKey: 'id_pedido',
  otherKey: 'id_producto',
  as: 'productos'
});

// Relaciones de Producto
Producto.belongsToMany(Pedido, {
  through: PedidoProducto,
  foreignKey: 'id_producto',
  otherKey: 'id_pedido',
  as: 'pedidos'
});

// Relaciones de PedidoProducto
PedidoProducto.belongsTo(Pedido, {
  foreignKey: 'id_pedido',
  as: 'pedido'
});

PedidoProducto.belongsTo(Producto, {
  foreignKey: 'id_producto',
  as: 'producto'
});

// Relaciones de Reporte
Reporte.belongsTo(Sucursal, {
  foreignKey: 'id_sucursal',
  as: 'sucursal'
});

// Relaciones de Sincronizacion
Sincronizacion.belongsTo(Sucursal, {
  foreignKey: 'id_sucursal',
  as: 'sucursal'
});

module.exports = {
  Cliente,
  Ubicacion,
  Sucursal,
  Usuario,
  Produccion,
  Producto,
  Pedido,
  PedidoProducto,
  Reporte,
  Sincronizacion
};

