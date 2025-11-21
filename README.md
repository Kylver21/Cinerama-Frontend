# Cinerama Frontend

Frontend del proyecto Cinerama desarrollado con Angular.

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
# Instalar dependencias
npm install
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

## Build

```bash
# Compilar para producción
npm run build
# o
ng build --configuration production
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/         # Componentes de la aplicación
│   │   ├── guards/              # Guards de rutas
│   │   ├── interceptors/        # Interceptores HTTP
│   │   ├── models/              # Modelos TypeScript
│   │   └── services/            # Servicios Angular
│   ├── environments/           # Configuraciones de entorno
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
└── tsconfig.json
```

## Configuración

Ajusta las URLs de la API en `src/environments/environment.ts` y `environment.prod.ts`







