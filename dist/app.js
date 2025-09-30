// Verifica con videos.list cuáles IDs son embebibles (evita errores 101/150)
async function filterEmbeddableVideos(items, apiKey) {
    const ids = items.map(i => i.id.videoId).filter(Boolean);
    if (ids.length === 0)
        return [];
    const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${ids.join(',')}&key=${apiKey}`;
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            console.warn('videos.list falló, devolviendo sin filtrar');
            return items;
        }
        const details = await resp.json();
        const allowed = new Set(details.items.filter(v => { var _a; return (_a = v.status) === null || _a === void 0 ? void 0 : _a.embeddable; }).map(v => v.id));
        const filtered = items.filter(i => allowed.has(i.id.videoId));
        // Devolver SOLO los embebibles para evitar errores 101/150
        return filtered;
    }
    catch (e) {
        console.warn('Error filtrando embebibles:', e);
        return items;
    }
}
/** Variables globales */
let player = null;
let currentVideoId = null;
let isPlayerReady = false;
let lastResults = [];
// Importar configuración
import { config } from './config.js';
// Función para obtener la API key
function getApiKey() {
    console.log('API Key cargada:', config.YOUTUBE_API_KEY);
    if (!config.YOUTUBE_API_KEY || config.YOUTUBE_API_KEY === 'TU_API_KEY_AQUI') {
        alert('Por favor configura tu API key de YouTube en src/config.ts antes de buscar');
        return null;
    }
    return config.YOUTUBE_API_KEY;
}
// Función de búsqueda
async function searchVideos(query) {
    var _a;
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API key no configurada');
    }
    // Filtra a videos embebibles para evitar errores 101/150
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&videoEmbeddable=true&videoSyndicated=true&maxResults=10&key=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error ${response.status}: ${((_a = errorData.error) === null || _a === void 0 ? void 0 : _a.message) || response.statusText}`);
        }
        const data = await response.json();
        const filtered = await filterEmbeddableVideos(data.items, apiKey);
        return filtered;
    }
    catch (error) {
        console.error('Error al buscar videos:', error);
        throw error;
    }
}
// Función para mostrar resultados
function displayResults(videos) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    lastResults = videos;
    if (!videos || videos.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No se encontraron videos reproducibles</div>';
        return;
    }
    videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'video-item';
        // Guardamos el ID del video a nivel del contenedor para usar delegación de eventos
        videoElement.setAttribute('data-video-id', video.id.videoId);
        videoElement.innerHTML = `
      <img src="${video.snippet.thumbnails.default.url}" alt="${video.snippet.title}" class="video-thumbnail">
      <div class="video-title">${video.snippet.title}</div>
      <div class="video-actions">
        <button class="action-btn btn-play" aria-label="Reproducir">▶️</button>
        <button class="action-btn btn-pause" aria-label="Pausar">⏸️</button>
        <button class="action-btn btn-stop" aria-label="Detener">⏹️</button>
      </div>
    `;
        resultsContainer.appendChild(videoElement);
    });
}
/** Seleccionar video: carga y reproduce inmediatamente aprovechando el gesto del usuario */
function selectVideo(videoId) {
    console.log('[UI] Seleccionado video:', videoId);
    currentVideoId = videoId;
    if (player) {
        if (!isPlayerReady) {
            console.log('[YT] Player aún no listo, encolando reproducción');
            return;
        }
        try {
            player.loadVideoById(videoId);
            player.playVideo();
        }
        catch (e) {
            console.error('[YT] Error al reproducir:', e);
        }
    }
}
// Inicializar el reproductor de YouTube
function onYouTubeIframeAPIReady() {
    player = new window.YT.Player('player', {
        height: '1',
        width: '1',
        playerVars: { autoplay: 0, playsinline: 1, origin: location.origin },
        events: {
            onReady: () => {
                isPlayerReady = true;
                console.log('Player listo');
                // Si el usuario seleccionó un video antes de que el player estuviera listo, cárgalo y reprodúcelo ahora
                if (currentVideoId) {
                    try {
                        player.loadVideoById(currentVideoId);
                        player.playVideo();
                    }
                    catch (e) {
                        console.error('[YT] Error post-ready al reproducir:', e);
                    }
                }
            },
            onStateChange: (event) => {
                // Manejar cambios de estado si es necesario
            },
            onError: (e) => {
                console.warn('[YT] onError (silencioso):', e === null || e === void 0 ? void 0 : e.data);
                // No mostrar ni auto-saltar. Los videos con error 101/150 ya se intentan filtrar previamente.
            }
        }
    });
}
// Función para reproducir
function playVideo() {
    if (!player)
        return;
    if (!currentVideoId) {
        alert('Primero selecciona un video de la lista');
        return;
    }
    if (!isPlayerReady) {
        console.log('[YT] Player no listo aún; se reproducirá cuando esté listo');
        return;
    }
    try {
        // Nos aseguramos de que el video esté cargado antes de reproducir
        player.loadVideoById(currentVideoId);
        player.playVideo();
    }
    catch (e) {
        console.error('[YT] Error al reproducir:', e);
    }
}
// Función para pausar
function pauseVideo() {
    if (player) {
        player.pauseVideo();
    }
}
// Función para detener
function stopVideo() {
    if (player) {
        player.stopVideo();
    }
}
// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results');
    console.log('[UI] Controles cargados (por canción)');
    searchBtn.addEventListener('click', async () => {
        console.log('[UI] Buscar click');
        const query = searchInput.value.trim();
        if (!query) {
            alert('Por favor ingresa un término de búsqueda');
            return;
        }
        try {
            const videos = await searchVideos(query);
            displayResults(videos);
        }
        catch (error) {
            alert(`Error al buscar videos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    });
    // Delegación de eventos: un solo listener para todos los botones de cada canción
    resultsContainer.addEventListener('click', (ev) => {
        const target = ev.target;
        const item = target.closest('.video-item');
        if (!item)
            return;
        const id = item.getAttribute('data-video-id');
        if (!id)
            return;
        if (target.closest('.btn-play')) {
            ev.stopPropagation();
            selectVideo(id);
            return;
        }
        if (target.closest('.btn-pause')) {
            ev.stopPropagation();
            pauseVideo();
            return;
        }
        if (target.closest('.btn-stop')) {
            ev.stopPropagation();
            stopVideo();
            return;
        }
    });
    // Si la API de YouTube ya cargó antes de que registráramos el callback, inicializa el player ahora
    if (window.YT && window.YT.Player && !player) {
        console.log('[YT] API ya cargada, inicializando player');
        onYouTubeIframeAPIReady();
    }
});
// Hacer onYouTubeIframeAPIReady global para que YouTube la llame
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
// Encuentra el siguiente video candidato para reproducir cuando uno falla con error 101/150
function findNextPlayableVideoId(currentId) {
    if (!lastResults || lastResults.length === 0)
        return null;
    const ids = lastResults.map(v => v.id.videoId).filter(Boolean);
    if (ids.length === 0)
        return null;
    const startIndex = currentId ? ids.indexOf(currentId) : -1;
    const n = ids.length;
    for (let offset = 1; offset < n; offset++) {
        const idx = (startIndex + offset) % n;
        const candidate = ids[idx];
        if (candidate && candidate !== currentId) {
            return candidate;
        }
    }
    return null;
}
