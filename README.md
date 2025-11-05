# Proyecto Integradora

## 🚀 Configuración de Base de Datos MySQL

### Instalación de dependencias

```bash
npm install
```

### Configuración de variables de entorno

#### 📝 Para Desarrollo Local (`.env`)

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=integradora_db
DB_PORT=3306
PORT=4000
```

**Notas:**
- Si usas **Docker**: Usa `appuser` / `apppassword` (ver docker-compose.yml)
- Si usas **XAMPP**: Deja `DB_PASSWORD` vacío (sin contraseña por defecto)
- Si usas **MySQL Community Server**: Pon tu contraseña de `root` aquí
- Cambia `DB_NAME` por el nombre de tu base de datos

#### 🚀 Para Producción

Cuando despliegues tu app, las plataformas (Railway, Render, etc.) te permiten configurar variables de entorno directamente en su dashboard.

**Ejemplo de variables para producción (Railway/PlanetScale):**
```env
DB_HOST=tu-host-de-railway.mysql.railway.app
DB_USER=root
DB_PASSWORD=tu-password-de-produccion
DB_NAME=railway
DB_PORT=3306
PORT=4000
```

**⚠️ IMPORTANTE:** 
- **NUNCA** subas tu archivo `.env` a GitHub
- Asegúrate de tener `.env` en tu `.gitignore`
- Las plataformas de deployment tienen su propio sistema de variables de entorno

### 📋 Configuración en DBeaver (Paso a Paso)

#### Paso 1: Abrir DBeaver y crear nueva conexión
1. Abre **DBeaver**
2. En la barra superior, haz clic en el ícono **"Nueva Conexión de Base de Datos"** (icono de enchufe/plug) 
   - O ve a: **Database** → **New Database Connection** (o presiona `Ctrl + Shift + N`)

#### Paso 2: Seleccionar MySQL
1. En la ventana que se abre, busca y selecciona **MySQL**
2. Haz clic en **Next** (Siguiente)

#### Paso 3: Configurar los datos de conexión
En la pestaña **"Main"** (Principal), completa los siguientes campos:

- **Server Host:** `localhost`
  - (Si tu MySQL está en otra máquina, pon la IP o dominio)
  
- **Port:** `3306`
  - (Este es el puerto por defecto de MySQL, si no lo cambiaste, déjalo así)

- **Database:** 
  - Si ya tienes una base de datos creada, escribe su nombre aquí
  - Si aún no la tienes, déjala vacía por ahora (puedes crearla después)

- **Username:** `root`
  - (O el usuario que tengas configurado en MySQL)

- **Password:** 
  - Ingresa tu contraseña de MySQL
  - ✅ Marca la casilla **"Save password"** si quieres que DBeaver la recuerde

#### Paso 4: Probar la conexión
1. Haz clic en el botón **"Test Connection"** (Probar Conexión)
2. Si es la primera vez, DBeaver te pedirá descargar el driver de MySQL - haz clic en **"Download"**
3. Espera a que descargue e instale el driver
4. Deberías ver un mensaje verde: ✅ **"Connected"** o **"Conectado"**

#### Paso 5: Finalizar
1. Si la conexión fue exitosa, haz clic en **"Finish"** (Finalizar)
2. Verás tu nueva conexión en el panel izquierdo de DBeaver

#### Paso 6: Crear la base de datos (si no la tienes)
1. Expande tu conexión MySQL en el panel izquierdo
2. Haz clic derecho en **"Databases"** → **Create New Database** (Crear Nueva Base de Datos)
3. Escribe el nombre de tu base de datos (ej: `integradora_db`)
4. Selecciona el charset: `utf8mb4` (recomendado)
5. Selecciona el collation: `utf8mb4_unicode_ci` (recomendado)
6. Haz clic en **OK**

#### Paso 7: Actualizar el archivo .env
Ahora que ya tienes la base de datos creada, asegúrate de que tu archivo `.env` tenga el mismo nombre:

```env
DB_NAME=integradora_db  # O el nombre que le pusiste
```

#### ⚠️ Notas importantes:
- Los valores en DBeaver deben ser **exactamente los mismos** que en tu archivo `.env`
- Si cambias la contraseña en MySQL, actualiza tanto DBeaver como el `.env`
- Si tienes problemas de conexión, verifica que el servicio de MySQL esté corriendo

### 🔧 Solución de Problemas: "Connection refused"

Si ves el error **"Connection refused: no further information"**, significa que **MySQL no está corriendo**. Aquí te explico cómo solucionarlo:

#### Opción 1: Si tienes MySQL instalado directamente

**Paso 1: Verificar si el servicio está corriendo**
1. Presiona `Windows + R`
2. Escribe `services.msc` y presiona Enter
3. Busca **"MySQL"** o **"MySQL80"** en la lista
4. Verifica el **Estado**:
   - Si dice **"En ejecución"** → El problema es otro (ver abajo)
   - Si dice **"Detenido"** → Haz clic derecho → **Iniciar**

**Paso 2: Si no aparece el servicio MySQL**
- MySQL no está instalado → Ve a la Opción 2 o 3

#### Opción 2: Si tienes XAMPP instalado

**Paso 1: Iniciar MySQL desde XAMPP**
1. Abre **XAMPP Control Panel**
2. Busca **MySQL** en la lista
3. Haz clic en **Start** (Iniciar)
4. Deberías ver que el botón cambia a verde

**Paso 2: Configurar en DBeaver**
- Tu configuración está correcta (`localhost:3306`)
- Solo necesitas que XAMPP esté corriendo

#### Opción 3: Si tienes WAMP instalado

**Paso 1: Iniciar MySQL desde WAMP**
1. Abre **WAMP**
2. Verifica que el ícono esté **verde** (no naranja ni rojo)
3. Si está naranja/rojo, haz clic en el ícono → **Put Online**

**Paso 2: Configurar en DBeaver**
- Tu configuración está correcta (`localhost:3306`)

#### Opción 4: Instalar MySQL (si no tienes ninguno)

### 🎯 **RECOMENDACIÓN PARA TU PROYECTO (App Móvil + Deployment):**

Como tu proyecto necesita **desplegarse en producción**, aquí está la mejor estrategia:

---

## 📱 **PARA DESARROLLO LOCAL (Tu computadora):**

### ✨ **XAMPP (RECOMENDADO para desarrollo)**

**¿Por qué XAMPP para desarrollo?**
- ✅ **Súper fácil de instalar** - Solo descarga e instala
- ✅ **No necesitas contraseña por defecto** - Facilita el desarrollo
- ✅ **Incluye phpMyAdmin** - Interfaz web para gestionar tu BD
- ✅ **Control Panel visual** - Inicias/Detienes MySQL con un clic
- ✅ **Perfecto para probar localmente** antes de desplegar

**Pasos para instalar XAMPP:**
1. Ve a: **https://www.apachefriends.org/**
2. Descarga **XAMPP para Windows** (versión más reciente)
3. Ejecuta el instalador
   - Durante la instalación, desmarca **Apache** si solo necesitas MySQL
   - O déjalo marcado si quieres usarlo después
4. Una vez instalado, abre **XAMPP Control Panel**
5. Haz clic en **Start** junto a **MySQL**
6. Listo! MySQL está corriendo en `localhost:3306`

**Configuración en DBeaver (desarrollo):**
- **Server Host:** `localhost`
- **Port:** `3306`
- **Username:** `root`
- **Password:** (déjalo vacío - XAMPP no tiene contraseña por defecto)
- **Database:** `integradora_db` (o créala después)

---

## 🚀 **PARA PRODUCCIÓN (Despliegue):**

**⚠️ IMPORTANTE:** XAMPP NO es para producción. Necesitas una base de datos en la nube.

### **Opción 1: Railway (RECOMENDADO - Más fácil) ⭐**

**¿Por qué Railway?**
- ✅ **Gratis para empezar** (con límites generosos)
- ✅ **Super fácil de configurar** - Solo conectas tu repo
- ✅ **Incluye MySQL** - Te crea la BD automáticamente
- ✅ **Deploy automático** - Conectas GitHub y listo
- ✅ **Perfecto para proyectos estudiantiles/integradora**

**Pasos:**
1. Ve a: **https://railway.app/**
2. Crea cuenta con GitHub
3. Crea nuevo proyecto → **Add MySQL**
4. Railway te da las credenciales automáticamente
5. Usa esas credenciales en tu `.env` de producción

**Costo:** Gratis hasta cierto uso, luego ~$5/mes

---

### **Opción 2: PlanetScale (Base de datos MySQL en la nube)**

**¿Por qué PlanetScale?**
- ✅ **Gratis para desarrollo** (1 base de datos gratis)
- ✅ **MySQL compatible** - Tu código funciona igual
- ✅ **Escalable** - Crece con tu app
- ✅ **Muy fácil de usar**

**Pasos:**
1. Ve a: **https://planetscale.com/**
2. Crea cuenta gratis
3. Crea nueva base de datos
4. Obtén las credenciales de conexión
5. Usa esas credenciales en producción

**Costo:** Gratis para desarrollo, planes desde $29/mes para producción

---

### **Opción 3: Render (Hosting + Base de datos)**

**¿Por qué Render?**
- ✅ **Gratis para empezar** (con sleep después de inactividad)
- ✅ **Hosting de tu API** + Base de datos MySQL
- ✅ **Deploy automático desde GitHub**

**Pasos:**
1. Ve a: **https://render.com/**
2. Crea cuenta
3. Crea **PostgreSQL** (o MySQL si está disponible)
4. O crea **Web Service** para tu API Node.js
5. Conecta tu repositorio de GitHub

**Costo:** Gratis con limitaciones, $7/mes para plan pago

---

### **Opción 4: AWS RDS / Azure Database (Más profesional)**

**¿Cuándo usar?**
- Si necesitas más control
- Si tu proyecto crecerá mucho
- Si tienes experiencia con cloud

**Costo:** Variable, desde ~$15/mes

---

### **Opción 5: VPS con MySQL (Más técnico)**

**¿Cuándo usar?**
- Si quieres control total
- Si tienes experiencia con servidores
- Si necesitas configuración específica

**Opciones:** DigitalOcean, Linode, Vultr, etc.
**Costo:** Desde $5-10/mes

---

## 🎯 **RECOMENDACIÓN FINAL ACTUALIZADA:**

### 🐳 **DOCKER (MEJOR OPCIÓN) ⭐⭐⭐**

**¿Por qué Docker es la mejor opción para tu proyecto?**

✅ **Entorno idéntico** - Tu desarrollo local = producción  
✅ **No necesitas instalar MySQL** - Todo corre en contenedores  
✅ **Fácil deployment** - Railway, Render, AWS, etc. soportan Docker  
✅ **Más profesional** - Estándar de la industria  
✅ **Fácil de compartir** - Cualquiera puede clonar y correr tu proyecto  
✅ **Escalable** - Perfecto para cuando tu app crezca  
✅ **Aislamiento** - No contamina tu sistema operativo  

**Ventajas específicas para tu proyecto:**
- Tu app móvil necesitará un backend confiable
- Deployment será más fácil (Railway/Render usan Docker)
- Mismo entorno en tu máquina y en producción = menos bugs
- Tu equipo puede trabajar con la misma configuración

---

### **Estrategia con Docker:**

1. **Desarrollo local:** Docker Compose (MySQL + tu API)
2. **Producción:** Deploy con Docker (Railway, Render, etc.)

---

## 🐳 **GUÍA COMPLETA DE DOCKER**

### **Paso 1: Instalar Docker Desktop**

1. Descarga Docker Desktop para Windows: **https://www.docker.com/products/docker-desktop/**
2. Instálalo y reinicia tu computadora
3. Abre Docker Desktop y verifica que esté corriendo (ícono en la bandeja del sistema)

### **Paso 2: Configurar tu proyecto**

Ya tienes los archivos necesarios creados:
- ✅ `docker-compose.yml` - Configuración de MySQL y API
- ✅ `Dockerfile` - Configuración de tu aplicación Node.js
- ✅ `.dockerignore` - Archivos a ignorar

### **Paso 3: Actualizar tu archivo `.env` para Docker**

Crea o actualiza tu archivo `.env`:

```env
# Para Docker (desarrollo local)
DB_HOST=localhost
DB_USER=appuser
DB_PASSWORD=apppassword
DB_NAME=integradora_db
DB_PORT=3306
PORT=4000
```

**Nota:** Si solo quieres MySQL en Docker y correr tu API fuera, usa:
- `DB_HOST=localhost` (así se conecta al MySQL en Docker)

Si quieres correr TODO en Docker, las variables están en `docker-compose.yml`.

### **Paso 4: Iniciar MySQL con Docker**

**Opción A: Solo MySQL (Recomendado para desarrollo)**

```bash
# Iniciar solo MySQL
docker-compose up mysql -d

# Ver logs
docker-compose logs mysql

# Detener MySQL
docker-compose down
```

**Opción B: MySQL + API (Todo en Docker)**

```bash
# Iniciar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down
```

### **Paso 5: Conectar DBeaver a MySQL en Docker**

Configura DBeaver con:
- **Server Host:** `localhost`
- **Port:** `3306`
- **Username:** `appuser`
- **Password:** `apppassword`
- **Database:** `integradora_db`

### **Comandos Docker útiles**

```bash
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Ver logs de MySQL
docker-compose logs mysql

# Entrar al contenedor de MySQL
docker exec -it integradora_mysql mysql -u appuser -p
# Password: apppassword

# Reiniciar servicios
docker-compose restart

# Eliminar todo (¡cuidado! borra datos)
docker-compose down -v
```

### **Paso 6: Desarrollo con Docker**

**Opción 1: MySQL en Docker + API en tu máquina (Recomendado)**
```bash
# Inicia MySQL
docker-compose up mysql -d

# Corre tu API normalmente
npm run dev
```

**Opción 2: Todo en Docker**
```bash
# Inicia todo
docker-compose up -d

# Ver logs de la API
docker-compose logs -f api
```

### **Paso 7: Deployment a producción con Docker**

**Railway (Recomendado):**
1. Ve a **https://railway.app/**
2. Crea cuenta con GitHub
3. Crea nuevo proyecto → **Deploy from GitHub repo**
4. Railway detecta tu `Dockerfile` automáticamente
5. Agrega MySQL service → Railway te da las credenciales
6. Configura las variables de entorno en Railway dashboard
7. ¡Listo! Tu API está desplegada

**Render:**
1. Ve a **https://render.com/**
2. Crea cuenta
3. New → **Web Service**
4. Conecta tu repositorio GitHub
5. Render detecta Docker automáticamente
6. Agrega PostgreSQL/MySQL service
7. Configura variables de entorno

### **Ventajas de usar Docker en tu proyecto:**

✅ **Desarrollo local = Producción** - Mismo entorno  
✅ **No necesitas instalar MySQL** - Todo en contenedores  
✅ **Fácil onboarding** - Cualquiera puede clonar y correr  
✅ **Deployment sencillo** - Railway/Render soportan Docker  
✅ **Escalable** - Fácil agregar más servicios  
✅ **Profesional** - Estándar de la industria  

---

## 📋 **Alternativas (Si prefieres no usar Docker):**

### **Opción 1: XAMPP (Más simple, menos profesional)**
- ✅ Fácil de instalar
- ❌ Diferente de producción
- ❌ Más difícil de compartir con tu equipo

### **Opción 2: MySQL directo + Cloud BD**
- ✅ Más control
- ❌ Más configuración
- ❌ Entorno diferente en dev vs prod

---

**Alternativa para desarrollo: MySQL Community Server**

Si prefieres instalar MySQL directamente (sin XAMPP):

**Pasos:**
1. Ve a: https://dev.mysql.com/downloads/mysql/
2. Descarga **MySQL Installer for Windows**
3. Durante la instalación:
   - Elige **"Developer Default"** o **"Server only"**
   - Configura una contraseña para el usuario `root`
   - **¡GUARDA ESTA CONTRASEÑA!**
4. El servicio se iniciará automáticamente

**Ventaja:** Más "limpio", solo MySQL
**Desventaja:** Más configuración inicial

#### Verificar que MySQL está corriendo

**Método 1: Desde Windows**
1. Abre **Administrador de tareas** (`Ctrl + Shift + Esc`)
2. Ve a la pestaña **"Servicios"**
3. Busca **MySQL** y verifica que esté **"En ejecución"**

**Método 2: Desde la línea de comandos**
```bash
# Abre CMD o PowerShell como Administrador
sc query MySQL80
# O si tienes otro nombre:
sc query MySQL
```

**Método 3: Probar conexión**
Una vez que inicies MySQL, vuelve a DBeaver y haz clic en **"Test Connection"** de nuevo. Debería funcionar.

#### Si el error persiste después de iniciar MySQL:

1. **Verifica el puerto:**
   - Asegúrate de que el puerto sea `3306` en DBeaver
   - Si usas XAMPP, verifica que no haya conflictos de puerto

2. **Verifica la contraseña:**
   - Si es la primera vez, puede que no tengas contraseña
   - Intenta dejar el campo de contraseña vacío en DBeaver

3. **Verifica el firewall:**
   - Windows puede estar bloqueando la conexión
   - Ve a Configuración → Firewall → Permite MySQL

4. **Reinicia el servicio:**
   - Detén MySQL y vuelve a iniciarlo

### Uso de la conexión

El módulo de conexión está en `src/config/database.js` y ya está configurado para usar un pool de conexiones (más eficiente).

#### Ejemplo de uso en tus rutas:

```javascript
const { query } = require('./config/database');

// Consulta simple
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await query('SELECT * FROM usuarios');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Consulta con parámetros (seguro contra SQL injection)
app.get('/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarios = await query('SELECT * FROM usuarios WHERE id = ?', [id]);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Insert
app.post('/usuario', async (req, res) => {
  try {
    const { nombre, email } = req.body;
    const result = await query(
      'INSERT INTO usuarios (nombre, email) VALUES (?, ?)',
      [nombre, email]
    );
    res.json({ id: result.insertId, mensaje: 'Usuario creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Probar la conexión

1. Inicia el servidor:
```bash
npm run dev
```

2. Visita en tu navegador: `http://localhost:4000/test-db`

Si ves un mensaje de éxito, la conexión está funcionando correctamente.

### Ventajas de usar mysql2

- ✅ Soporte para promesas (async/await)
- ✅ Pool de conexiones (mejor rendimiento)
- ✅ Protección contra SQL injection con parámetros
- ✅ Más rápido y moderno que el paquete `mysql` antiguo

### Consejos

- **Siempre usa parámetros** en tus queries: `query('SELECT * FROM tabla WHERE id = ?', [id])`
- **Nunca concatenes strings** directamente en SQL
- El pool de conexiones se maneja automáticamente
- Para transacciones complejas, usa `getConnection()` del módulo database

