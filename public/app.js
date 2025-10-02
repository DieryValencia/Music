import { DoublyLinkedList, Song } from './playlist.js';
// Importar configuración
import { config } from './config.js';
const playlist = new DoublyLinkedList();
let lastResults = [];
let repeatMode = 'off';
let isPlaying = false;
let volume = 50;
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
        <button class="action-btn btn-add-options" aria-label="Opciones de agregar">➕</button>
        <button class="action-btn btn-play" aria-label="Reproducir">▶️</button>
      </div>
      <div class="add-options" style="display: none;">
        <button class="add-option-btn" data-position="beginning">Al inicio</button>
        <button class="add-option-btn" data-position="end">Al final</button>
        <input type="number" class="position-input" placeholder="Posición" min="0">
        <button class="add-option-btn" data-position="position">En posición</button>
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
function nextSong() {
    playlist.next();
    updateCurrentSong();
    if (isPlaying) {
        playSong();
    }
}
function previousSong() {
    playlist.previous();
    updateCurrentSong();
    if (isPlaying) {
        playSong();
    }
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
        isPlaying = true;
        updatePlayPauseButtons();
    }
    else if (current) {
        alert(`Reproduciendo: ${current.title} - ${current.artist}`);
        isPlaying = true;
        updatePlayPauseButtons();
    }
    else {
        alert('No hay canción seleccionada');
    }
}
function pauseSong() {
    if (player) {
        player.pauseVideo();
    }
    isPlaying = false;
    updatePlayPauseButtons();
}
function updatePlayPauseButtons() {
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    if (isPlaying) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
    }
    else {
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    }
}
function toggleRepeat() {
    if (repeatMode === 'off') {
        repeatMode = 'all';
    }
    else if (repeatMode === 'all') {
        repeatMode = 'one';
    }
    else {
        repeatMode = 'off';
    }
    const repeatBtn = document.getElementById('repeat-btn');
    repeatBtn.textContent = repeatMode === 'off' ? '🔁 Repeat' : repeatMode === 'all' ? '🔁 Repeat All' : '🔂 Repeat One';
    if (repeatMode !== 'off') {
        repeatBtn.classList.add('active');
    }
    else {
        repeatBtn.classList.remove('active');
    }
}
function setVolume(value) {
    volume = value;
    if (player) {
        player.setVolume(volume);
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
                player.setVolume(volume);
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
                if (event.data === 0) { // ENDED
                    if (repeatMode === 'one') {
                        playSong(); // Repetir la misma canción
                    }
                    else if (repeatMode === 'all' || playlist.getSize() > 1) {
                        nextSong();
                    }
                    else {
                        isPlaying = false;
                        updatePlayPauseButtons();
                    }
                }
                else if (event.data === 1) { // PLAYING
                    isPlaying = true;
                    updatePlayPauseButtons();
                }
                else if (event.data === 2) { // PAUSED
                    isPlaying = false;
                    updatePlayPauseButtons();
                }
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
    const prevBtn = document.getElementById('prev-btn');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const volumeSlider = document.getElementById('volume-slider');
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
    prevBtn.addEventListener('click', previousSong);
    playBtn.addEventListener('click', playSong);
    pauseBtn.addEventListener('click', pauseSong);
    nextBtn.addEventListener('click', nextSong);
    repeatBtn.addEventListener('click', toggleRepeat);
    volumeSlider.addEventListener('input', (e) => setVolume(parseInt(e.target.value)));
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
        if (target.closest('.btn-add-options')) {
            ev.stopPropagation();
            const options = item.querySelector('.add-options');
            options.style.display = options.style.display === 'none' ? 'block' : 'none';
            return;
        }
        if (target.closest('.add-option-btn')) {
            ev.stopPropagation();
            const position = target.getAttribute('data-position');
            if (position === 'beginning') {
                const song = new Song(video.snippet.title, video.snippet.channelTitle, '', false, video.id.videoId);
                playlist.addAtBeginning(song);
            }
            else if (position === 'end') {
                addSongFromSearch(video);
            }
            else if (position === 'position') {
                const posInput = item.querySelector('.position-input');
                const pos = parseInt(posInput.value);
                if (isNaN(pos) || pos < 0 || pos > playlist.getSize()) {
                    alert('Posición inválida');
                    return;
                }
                const song = new Song(video.snippet.title, video.snippet.channelTitle, '', false, video.id.videoId);
                playlist.addAtPosition(song, pos);
            }
            updatePlaylistDisplay();
            // Ocultar opciones después de agregar
            const options = item.querySelector('.add-options');
            options.style.display = 'none';
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
