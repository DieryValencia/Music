# MusicWinvale - Reproductor de Música YouTube

Una aplicación web en TypeScript vanilla para buscar y reproducir música desde YouTube.

## Características

- Búsqueda de videos musicales en YouTube
- Reproducción oculta con iframe (sin mostrar video)
- Controles manuales de reproducción (play, pause, stop)
- Interfaz oscura tipo reproductor de música
- Resultados con thumbnails y títulos

## Configuración

1. Obtén una API key de YouTube Data API v3 desde [Google Cloud Console](https://console.cloud.google.com/)

2. Edita `src/config.ts` y reemplaza `'TU_API_KEY_AQUI'` con tu API key real:

```typescript
export const config = {
  YOUTUBE_API_KEY: 'TU_API_KEY_REAL'
};
```

## Instalación y Uso

1. Clona o descarga el proyecto

2. Compila TypeScript:
```bash
tsc
```

3. Sirve los archivos estáticos. Por ejemplo, con Python:
```bash
python -m http.server 8000
```

4. Abre `http://localhost:8000` en tu navegador

## Estructura del Proyecto

- `index.html` - Página principal
- `styles.css` - Estilos CSS oscuros
- `src/app.ts` - Lógica principal en TypeScript
- `dist/app.js` - JavaScript compilado
- `tsconfig.json` - Configuración de TypeScript

## Tecnologías

- TypeScript
- YouTube Data API v3
- YouTube Iframe API
- HTML5/CSS3

## Notas

- La reproducción es oculta (height/width: 0) para enfocarse en el audio
- Los controles son manuales, no automáticos
- Requiere conexión a internet para búsquedas y reproducción