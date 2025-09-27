# 🌤️ AppClima - Aplicación del Tiempo

Una aplicación móvil completa desarrollada con React Native y Expo que proporciona información meteorológica detallada, pronósticos, alertas personalizadas y recomendaciones de vestimenta.

## 📱 Características Principales

- **Clima Actual**: Información meteorológica en tiempo real con ubicación automática
- **Pronóstico Extendido**: Predicciones por horas y días
- **Búsqueda de Ciudades**: Busca el clima de cualquier ciudad del mundo
- **Alertas Personalizadas**: Notificaciones configurables para condiciones específicas
- **Recomendaciones de Vestimenta**: Sugerencias basadas en las condiciones climáticas
- **Calidad del Aire**: Índices de contaminación y UV
- **Datos Astronómicos**: Horarios de amanecer y atardecer
- **Interfaz Adaptativa**: Fondos dinámicos según las condiciones climáticas

## 🏗️ Arquitectura del Proyecto

### 📁 Estructura de Carpetas

```
AppClima/
├── app/                          # Directorio principal de la aplicación
│   ├── (tabs)/                   # Navegación por pestañas
│   │   ├── index.tsx            # Pantalla principal (clima actual)
│   │   └── explore.tsx          # Pantalla de funciones avanzadas
│   ├── _layout.tsx              # Layout raíz con proveedores
│   └── +not-found.tsx           # Pantalla de error 404
├── components/                   # Componentes reutilizables
│   ├── clima/                   # Componentes específicos del clima
│   │   ├── climaactual.tsx     # Muestra información del clima actual
│   │   ├── buscar.tsx          # Buscador de ciudades
│   │   ├── alertas.tsx         # Configuración de alertas
│   │   ├── climaxdias.tsx      # Pronóstico por días
│   │   └── vestimenta.tsx      # Recomendaciones de ropa
│   ├── navigation/              # Componentes de navegación
│   └── ui/                      # Componentes de interfaz
├── context/                     # Contextos de React
│   ├── WeatherContext.tsx       # Estado global del clima
│   └── ThemeContext.tsx         # Tema de la aplicación
├── services/                    # Servicios y APIs
│   ├── weatherApi.ts           # API del clima
│   ├── geolocationService.ts   # Servicio de geolocalización
│   └── notificationService.ts  # Servicio de notificaciones
├── utils/                       # Utilidades
│   └── backgroundSelector.ts   # Selector de fondos dinámicos
├── constants/                   # Constantes de la aplicación
└── assets/                      # Recursos estáticos
```

## 🧩 Componentes Principales

### 📍 Pantallas (app/)

#### `index.tsx` - Pantalla Principal
- **Propósito**: Muestra el clima actual, pronóstico por horas y días
- **Funcionalidades**:
  - Obtiene ubicación automáticamente
  - Muestra temperatura, condiciones y detalles meteorológicos
  - Fondo dinámico según el clima
  - Navegación a funciones avanzadas

#### `explore.tsx` - Funciones Avanzadas
- **Propósito**: Acceso a características adicionales de la aplicación
- **Funcionalidades**:
  - Lista de funciones avanzadas (alertas, vestimenta, UV, calidad del aire)
  - Sistema de modales para cada función
  - Configuración de notificaciones

### 🌡️ Componentes de Clima (components/clima/)

#### `climaactual.tsx` - Clima Actual
- **Propósito**: Renderiza la información meteorológica actual
- **Funcionalidades**:
  - Muestra temperatura, sensación térmica, humedad
  - Información de viento, presión y visibilidad
  - Formateo de fechas según zona horaria
  - Manejo de estados de carga y error

#### `buscar.tsx` - Buscador de Ciudades
- **Propósito**: Permite buscar el clima de cualquier ciudad
- **Funcionalidades**:
  - Búsqueda con debounce para optimizar rendimiento
  - Sugerencias automáticas de ciudades
  - Selección de ciudad para obtener datos meteorológicos
  - Interfaz intuitiva con resultados en tiempo real

#### `alertas.tsx` - Sistema de Alertas
- **Propósito**: Configuración de alertas meteorológicas personalizadas
- **Funcionalidades**:
  - Alertas por temperatura (alta/baja)
  - Alertas de lluvia y viento
  - Alertas de índice UV y calidad del aire
  - Persistencia de configuración con AsyncStorage
  - Integración con sistema de notificaciones

#### `climaxdias.tsx` - Pronóstico Extendido
- **Propósito**: Muestra el pronóstico meteorológico para varios días
- **Funcionalidades**:
  - Pronóstico de 3-7 días
  - Temperaturas máximas y mínimas
  - Condiciones meteorológicas por día
  - Formateo optimizado de fechas

#### `vestimenta.tsx` - Recomendaciones de Vestimenta
- **Propósito**: Sugiere ropa apropiada según el clima
- **Funcionalidades**:
  - Análisis de temperatura y condiciones
  - Recomendaciones específicas de prendas
  - Consideración de factores como lluvia y viento
  - Interfaz visual con iconos representativos

## 🔧 Servicios (services/)

### `weatherApi.ts` - API del Clima
- **Propósito**: Interfaz con la API externa de WeatherAPI
- **Funcionalidades**:
  - Obtención de clima actual por ciudad o coordenadas
  - Búsqueda de ciudades
  - Pronósticos extendidos e históricos
  - Datos astronómicos (amanecer/atardecer)
  - Información de calidad del aire y UV
  - Recomendaciones de vestimenta
  - Sistema de alertas meteorológicas

**Interfaces Principales**:
- `WeatherData`: Datos completos del clima
- `CityData`: Información de ciudades
- `AirQualityData`: Calidad del aire
- `UVData`: Índice ultravioleta
- `ClothingRecommendation`: Recomendaciones de ropa

### `geolocationService.ts` - Servicio de Geolocalización
- **Propósito**: Manejo de ubicación del usuario
- **Funcionalidades**:
  - Solicitud de permisos de ubicación
  - Obtención de coordenadas actuales
  - Seguimiento de ubicación en tiempo real
  - Configuración persistente de preferencias
  - Manejo de errores de ubicación

### `notificationService.ts` - Servicio de Notificaciones
- **Propósito**: Gestión de notificaciones push
- **Funcionalidades**:
  - Configuración de permisos de notificación
  - Envío de alertas meteorológicas
  - Verificaciones periódicas de condiciones
  - Persistencia de configuración
  - Programación de notificaciones locales

## 🎨 Contextos (context/)

### `WeatherContext.tsx` - Estado Global del Clima
- **Propósito**: Manejo centralizado del estado meteorológico
- **Estado Gestionado**:
  - `weatherData`: Datos meteorológicos actuales
  - `loading`: Estados de carga
  - `error`: Manejo de errores
  - `searchResults`: Resultados de búsqueda
  - `astronomyData`: Datos astronómicos

**Funciones Principales**:
- `fetchWeatherByCity()`: Obtiene clima por nombre de ciudad
- `fetchWeatherByCoords()`: Obtiene clima por coordenadas
- `searchCities()`: Busca ciudades
- `fetchExtendedForecast()`: Pronóstico extendido
- `fetchAstronomyData()`: Datos astronómicos

## 🛠️ Utilidades (utils/)

### `backgroundSelector.ts` - Selector de Fondos
- **Propósito**: Selección dinámica de fondos según el clima
- **Funcionalidad**:
  - Mapeo de códigos meteorológicos a imágenes
  - Diferenciación día/noche
  - Fondos optimizados para cada condición climática

## 📦 Dependencias Principales

### Dependencias de Producción
- **React Native & Expo**: Framework base
- **@expo/vector-icons**: Iconografía
- **expo-location**: Servicios de geolocalización
- **expo-notifications**: Sistema de notificaciones
- **@react-native-async-storage/async-storage**: Almacenamiento local
- **react-native-screens**: Optimización de navegación

### Dependencias de Desarrollo
- **TypeScript**: Tipado estático
- **@types/react**: Tipos para React
- **@babel/core**: Transpilación de código

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o yarn
- Expo CLI
- Dispositivo móvil o emulador

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [url-del-repositorio]
   cd AppClima
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar API Key**
   - Registrarse en [WeatherAPI](https://www.weatherapi.com/)
   - Obtener clave API gratuita
   - Configurar en `services/weatherApi.ts`:
   ```typescript
   const API_KEY = 'tu-api-key-aqui';
   ```

4. **Iniciar la aplicación**
   ```bash
   npx expo start
   ```

5. **Ejecutar en dispositivo**
   - Escanear código QR con Expo Go
   - O usar emulador Android/iOS

## 📱 Funcionalidades por Pantalla

### Pantalla Principal (index.tsx)
- **Clima Actual**: Temperatura, condiciones, sensación térmica
- **Detalles**: Humedad, viento, presión, visibilidad
- **Pronóstico por Horas**: Próximas 24 horas
- **Pronóstico por Días**: Próximos 7 días
- **Fondo Dinámico**: Cambia según condiciones climáticas

### Pantalla Explorar (explore.tsx)
- **Alertas Personalizadas**: Configuración de notificaciones
- **Recomendaciones de Vestimenta**: Sugerencias de ropa
- **Índice UV**: Información de radiación solar
- **Calidad del Aire**: Niveles de contaminación
- **Configuración**: Ajustes de notificaciones

## 🔐 Permisos Requeridos

### Android
- `ACCESS_FINE_LOCATION`: Ubicación precisa
- `ACCESS_COARSE_LOCATION`: Ubicación aproximada
- `RECEIVE_BOOT_COMPLETED`: Notificaciones persistentes
- `VIBRATE`: Vibración para alertas

### iOS
- `NSLocationWhenInUseUsageDescription`: Ubicación en uso
- `NSLocationAlwaysAndWhenInUseUsageDescription`: Ubicación siempre
- `UNUserNotificationCenter`: Notificaciones

## 📊 Características Técnicas

### Rendimiento
- **Lazy Loading**: Carga diferida de componentes
- **Memoización**: Optimización de re-renderizados
- **Debounce**: Optimización de búsquedas
- **Caché**: Almacenamiento local de datos

### Accesibilidad
- **Screen Reader**: Soporte para lectores de pantalla
- **Contraste**: Colores accesibles
- **Navegación**: Navegación por teclado
- **Etiquetas**: Etiquetas descriptivas

### Internacionalización
- **Múltiples Idiomas**: Soporte preparado
- **Formatos Locales**: Fechas y números
- **Zonas Horarias**: Manejo automático

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm start                 # Inicia Expo development server
npx expo start           # Alternativa para iniciar
npm run android          # Ejecuta en Android
npm run ios              # Ejecuta en iOS
npm run web              # Ejecuta en navegador

# Construcción
npm run build            # Construye para producción
npx expo build          # Build con Expo

# Utilidades
npm run reset-project    # Reinicia proyecto
npm run lint            # Análisis de código
npm run type-check      # Verificación de tipos
```

## 🔧 Configuración Avanzada

### Variables de Entorno
Crear archivo `.env` en la raíz:
```env
WEATHER_API_KEY=tu_api_key
WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
```

### Configuración de Notificaciones
```typescript
// En notificationService.ts
const notificationConfig = {
  enableAlerts: true,
  checkInterval: 30, // minutos
  alertTypes: ['temperature', 'rain', 'wind', 'uv']
};
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

### Estándares de Código
- Usar TypeScript para tipado
- Seguir convenciones de React Native
- Documentar funciones complejas
- Escribir tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🆘 Soporte

### Problemas Comunes

**Error de API Key**
- Verificar que la API key esté configurada correctamente
- Confirmar que la key tenga permisos suficientes

**Problemas de Ubicación**
- Verificar permisos de ubicación en el dispositivo
- Comprobar que GPS esté activado

**Notificaciones no funcionan**
- Verificar permisos de notificación
- Confirmar configuración en ajustes del dispositivo

### Contacto
- **Issues**: [GitHub Issues](link-to-issues)
- **Documentación**: [Wiki del proyecto](link-to-wiki)
- **Email**: soporte@appclima.com

---

**Desarrollado con ❤️ usando React Native y Expo**
