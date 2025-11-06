# 🔄 Flujo de Datos - Sistema de Autenticación

## 📊 Flujo Actual (Sin Servicios)

### 1. **Request llega al servidor**
   - Archivo: `src/index.js`
   - Express recibe la petición HTTP

### 2. **Rutas (Routes)**
   - Archivo: `src/routes/authRoutes.js`
   - Define qué endpoint maneja qué función
   - Ejemplo: `POST /api/auth/login` → `usuarioController.login`

### 3. **Middleware (si aplica)**
   - Archivo: `src/middleware/auth.js`
   - Valida token JWT antes de llegar al controlador
   - Ejemplo: `GET /api/auth/perfil` pasa por `authenticate` primero

### 4. **Controlador (Controller)**
   - Archivo: `src/controllers/usuarioController.js`
   - **Aquí está toda la lógica de negocio actualmente**
   - Valida datos del request
   - Llama al modelo
   - Genera tokens
   - Responde al cliente

### 5. **Modelo (Model)**
   - Archivo: `src/models/Usuario.js`
   - Interactúa con la base de datos (Sequelize)
   - Validaciones de datos
   - Hooks (hash de contraseñas)

### 6. **Base de Datos**
   - MySQL (Docker)
   - Almacenamiento persistente

---

## 🎯 Flujo Actual (Con Capa de Servicios) ✅

### Arquitectura en capas:
```
Request → Routes → Middleware → Controller → Service → Model → Database
```

### ¿Qué hace cada capa?

1. **Routes** (`src/routes/authRoutes.js`)
   - Define endpoints y conecta con controladores

2. **Middleware** (`src/middleware/auth.js`)
   - Autenticación/autorización (verifica token JWT)
   - Ejecuta ANTES del controlador

3. **Controller** (`src/controllers/usuarioController.js`)
   - Maneja request/response HTTP
   - Delega lógica de negocio al servicio
   - Formatea respuestas

4. **Service** (`src/services/usuarioService.js`) ⭐ **NUEVO**
   - Lógica de negocio pura (reutilizable)
   - Validaciones de negocio
   - Manejo de errores de negocio
   - No conoce HTTP

5. **Model** (`src/models/Usuario.js`)
   - Interactúa con la base de datos (Sequelize)
   - Validaciones de datos
   - Hooks (hash de contraseñas)

6. **Database** (MySQL)
   - Persistencia de datos

---

## 📁 Archivos Actuales:

- `src/routes/authRoutes.js` - Rutas
- `src/middleware/auth.js` - Autenticación
- `src/controllers/usuarioController.js` - Controlador (solo HTTP)
- `src/services/usuarioService.js` - Servicio (lógica de negocio) ⭐
- `src/models/Usuario.js` - Modelo
- `src/utils/jwt.js` - Utilidades JWT

---

## 📋 Ejemplo: Flujo de Login

### 1. Request llega
```
POST /api/auth/login
Body: { "email": "root@example.com", "password": "1234" }
```

### 2. Route (`authRoutes.js`)
```javascript
router.post('/login', usuarioController.login)
```
→ Llama al controlador

### 3. Controller (`usuarioController.js`)
```javascript
async login(req, res) {
  const resultado = await usuarioService.loginUsuario(email, password);
  res.json({ success: true, data: resultado });
}
```
→ Extrae datos del request, llama al servicio, formatea respuesta

### 4. Service (`usuarioService.js`)
```javascript
async loginUsuario(email, password) {
  const usuario = await Usuario.findOne({ where: { email } });
  const isValid = await usuario.comparePassword(password);
  const token = generateToken({ id: usuario.id });
  return { usuario, token };
}
```
→ Lógica de negocio: busca usuario, verifica contraseña, genera token

### 5. Model (`Usuario.js`)
```javascript
Usuario.findOne() // Sequelize query
usuario.comparePassword() // Método del modelo
```
→ Acceso a datos y métodos del modelo

### 6. Database (MySQL)
→ Ejecuta query SQL, retorna datos

---

## ✅ Ventajas de esta arquitectura:

- ✅ **Separación de responsabilidades**: Cada capa tiene un propósito claro
- ✅ **Reutilizable**: El servicio se puede usar desde otros lugares
- ✅ **Testeable**: Puedes testear la lógica de negocio sin HTTP
- ✅ **Mantenible**: Fácil de modificar y extender

