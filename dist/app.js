import { DoublyLinkedList, Song } from './playlist.js';
// Importar configuración
import { config } from './config.js';
const playlist = new DoublyLinkedList();
let lastResults = [];
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
        <button class="action-btn btn-add-to-playlist" aria-label="Agregar a lista">➕</button>
        <button class="action-btn btn-play" aria-label="Reproducir">▶️</button>
      </div>
    `;
        resultsContainer.appendChild(videoElement);
    });
}
function updatePlaylistDisplay() {
    const playlistContainer = document.getElementById('playlist');
    playlistContainer.innerHTML = '';
    const songs = playlist.getAllSongs();
    songs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
      <div class="song-info">
        <div class="song-title">${song.title}</div>
        <div class="song-artist">${song.artist} ${song.duration ? `(${song.duration})` : ''}</div>
      </div>
      <div class="song-actions">
        <button class="favorite-btn ${song.isFavorite ? 'favorited' : ''}" data-index="${index}">❤️</button>
        <button class="action-btn btn-select" data-index="${index}">Seleccionar</button>
        <button class="action-btn btn-remove" data-index="${index}">Eliminar</button>
      </div>
    `;
        playlistContainer.appendChild(songElement);
    });
}
function updateCurrentSong() {
    const currentSongElement = document.getElementById('current-song');
    const current = playlist.getCurrent();
    currentSongElement.textContent = current ? `${current.title} - ${current.artist}` : 'Ninguna canción seleccionada';
}
function addSong() {
    const titleInput = document.getElementById('title-input');
    const artistInput = document.getElementById('artist-input');
    const durationInput = document.getElementById('duration-input');
    const positionSelect = document.getElementById('position-select');
    const positionInput = document.getElementById('position-input');
    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();
    const duration = durationInput.value.trim();
    if (!title || !artist) {
        alert('Por favor ingresa título y artista');
        return;
    }
    const song = new Song(title, artist, duration);
    const position = positionSelect.value;
    if (position === 'beginning') {
        playlist.addAtBeginning(song);
    }
    else if (position === 'end') {
        playlist.addAtEnd(song);
    }
    else if (position === 'position') {
        const pos = parseInt(positionInput.value);
        if (isNaN(pos) || pos < 0 || pos > playlist.getSize()) {
            alert('Posición inválida');
            return;
        }
        playlist.addAtPosition(song, pos);
    }
    updatePlaylistDisplay();
    titleInput.value = '';
    artistInput.value = '';
    durationInput.value = '';
    positionInput.value = '';
}
function nextSong() {
    playlist.next();
    updateCurrentSong();
}
function previousSong() {
    playlist.previous();
    updateCurrentSong();
}
function addSongFromSearch(video) {
    const song = new Song(video.snippet.title, video.snippet.channelTitle, '', false, video.id.videoId);
    playlist.addAtEnd(song);
    updatePlaylistDisplay();
}
function toggleFavorite(index) {
    const songs = playlist.getAllSongs();
    songs[index].isFavorite = !songs[index].isFavorite;
    updatePlaylistDisplay();
}
// Variables globales para YouTube
let player = null;
let currentVideoId = null;
let isPlayerReady = false;
// Función para reproducir
function playSong() {
    const current = playlist.getCurrent();
    if (current && current.videoId) {
        selectVideo(current.videoId);
    }
    else if (current) {
        alert(`Reproduciendo: ${current.title} - ${current.artist}`);
    }
    else {
        alert('No hay canción seleccionada');
    }
}
// Seleccionar video: carga y reproduce inmediatamente aprovechando el gesto del usuario
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
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results');
    const addBtn = document.getElementById('add-btn');
    const prevBtn = document.getElementById('prev-btn');
    const playBtn = document.getElementById('play-btn');
    const nextBtn = document.getElementById('next-btn');
    const positionSelect = document.getElementById('position-select');
    const positionInput = document.getElementById('position-input');
    const playlistContainer = document.getElementById('playlist');
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
    addBtn.addEventListener('click', addSong);
    prevBtn.addEventListener('click', previousSong);
    playBtn.addEventListener('click', playSong);
    nextBtn.addEventListener('click', nextSong);
    positionSelect.addEventListener('change', () => {
        positionInput.style.display = positionSelect.value === 'position' ? 'block' : 'none';
    });
    resultsContainer.addEventListener('click', (ev) => {
        const target = ev.target;
        const item = target.closest('.video-item');
        if (!item)
            return;
        const id = item.getAttribute('data-video-id');
        if (!id)
            return;
        const video = lastResults.find(v => v.id.videoId === id);
        if (!video)
            return;
        if (target.closest('.btn-add-to-playlist')) {
            ev.stopPropagation();
            addSongFromSearch(video);
            return;
        }
        if (target.closest('.btn-play')) {
            ev.stopPropagation();
            selectVideo(id);
            return;
        }
    });
    playlistContainer.addEventListener('click', (ev) => {
        const target = ev.target;
        const index = parseInt(target.getAttribute('data-index') || '-1');
        if (index === -1)
            return;
        if (target.classList.contains('favorite-btn')) {
            toggleFavorite(index);
        }
        else if (target.classList.contains('btn-select')) {
            const songs = playlist.getAllSongs();
            playlist.setCurrent(songs[index]);
            updateCurrentSong();
        }
        else if (target.classList.contains('btn-remove')) {
            const songs = playlist.getAllSongs();
            playlist.remove(songs[index]);
            updatePlaylistDisplay();
            updateCurrentSong();
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
