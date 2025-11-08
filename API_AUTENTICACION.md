# 📋 Estructura de API de Autenticación

## 🔐 Endpoints de Autenticación

### Base URL
```
http://localhost:4000/api/auth
```

---

## 1. **Registro de Usuario**
**POST** `/api/auth/registro`

### Request Body:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "id_sucursal": 1
}
```

### Campos Requeridos:
- `nombre` (string, 2-100 caracteres)
- `email` (string, email válido, único)
- `password` (string, mínimo 6 caracteres)
- `id_sucursal` (integer, ID de la sucursal)

### Response Exitosa (201):
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "id_usuario": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "id_sucursal": 1,
      "activo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (400/409):
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "campo": "email",
      "mensaje": "Este email ya está registrado"
    }
  ]
}
```

---

## 2. **Login de Usuario**
**POST** `/api/auth/login`

### Request Body:
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

### Campos Requeridos:
- `email` (string)
- `password` (string)

### Response Exitosa (200):
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "usuario": {
      "id_usuario": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "id_sucursal": 1,
      "activo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (401):
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

## 3. **Obtener Perfil del Usuario Autenticado**
**GET** `/api/auth/perfil`

### Headers Requeridos:
```
Authorization: Bearer <token>
```

### Response Exitosa (200):
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id_usuario": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "id_sucursal": 1,
      "activo": true
    }
  }
}
```

### Response Error (401):
```json
{
  "success": false,
  "message": "No se proporcionó token de autenticación"
}
```

---

## 4. **Actualizar Perfil**
**PUT** `/api/auth/perfil`

### Headers Requeridos:
```
Authorization: Bearer <token>
```

### Request Body:
```json
{
  "nombre": "Juan Carlos Pérez",
  "email": "juancarlos@example.com"
}
```

### Response Exitosa (200):
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "usuario": {
      "id_usuario": 1,
      "nombre": "Juan Carlos Pérez",
      "email": "juancarlos@example.com",
      "id_sucursal": 1,
      "activo": true
    }
  }
}
```

---

## 📱 Ejemplo de Implementación en Frontend (TypeScript/React Native)

### Configuración de API
```typescript
const API_BASE_URL = 'http://localhost:4000/api';

// Función helper para hacer requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}
```

### Función de Login
```typescript
interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    usuario: {
      id_usuario: number;
      nombre: string;
      email: string;
      id_sucursal: number;
      activo: boolean;
    };
    token: string;
  };
}

async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  return response;
}
```

### Función de Registro
```typescript
interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  id_sucursal: number;
}

async function register(data: RegisterData): Promise<LoginResponse> {
  const response = await apiRequest('/auth/registro', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  return response;
}
```

### Función para Obtener Perfil (con token)
```typescript
async function getProfile(token: string) {
  const response = await apiRequest('/auth/perfil', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response;
}
```

### Ejemplo de Uso en Componente
```typescript
const handleLogin = async () => {
  try {
    setLoading(true);
    
    const response = await login(email, password);
    
    if (response.success) {
      // Guardar token
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      
      // Navegar a pantalla principal
      navigation.navigate('Home');
    }
  } catch (error) {
    console.error('Error de login:', error);
    Alert.alert('Error', error.message || 'Error al iniciar sesión');
  } finally {
    setLoading(false);
  }
};
```

---

## 🔑 Estructura del Token JWT

El token contiene:
```json
{
  "id_usuario": 1,
  "email": "juan@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Duración del token:** 24 horas (configurable en `.env`)

---

## ⚠️ Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error de validación
- `401` - No autenticado / Token inválido
- `403` - Cuenta desactivada
- `409` - Conflicto (email duplicado)
- `500` - Error del servidor

---

## 📝 Notas Importantes

1. **Token de Autenticación:** Debe enviarse en el header `Authorization` con el formato: `Bearer <token>`

2. **Almacenamiento del Token:** Guarda el token de forma segura (AsyncStorage en React Native, localStorage en web)

3. **Manejo de Errores:** Siempre verifica `response.success` antes de usar los datos

4. **Password:** Nunca se retorna en las respuestas por seguridad

5. **id_sucursal:** Es requerido al registrar un usuario. Asegúrate de tener las sucursales creadas primero.

