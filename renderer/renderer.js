let currentSongs = []; // loaded songs
let currentIndex = -1; 
const audioPlayer = document.getElementById('audioPlayer');
const nowPlayingDisplay = document.querySelector('.display');

function showStatus(message, type = 'success') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return 'Unknown';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function playSong(index) {
  if (index < 0 || index >= currentSongs.length) return;
  currentIndex = index;
  const song = currentSongs[index];
  audioPlayer.src = song.filePath;

  try {
      audioPlayer.play();
    nowPlayingDisplay.textContent = `Now Playing: "${song.title} by ${song.artist}`;
  } catch (err) {
    console.warn("Playback failed:", err);
  }

}

function playNext() {
  if (currentSongs.length === 0) return;
  let nextIndex = (currentIndex + 1) % currentSongs.length;
  playSong(nextIndex);
}

function playPrev() {
  if (currentSongs.length === 0) return;
  let prevIndex = (currentIndex - 1 + currentSongs.length) % currentSongs.length;
  playSong(prevIndex);

}

function togglePlayPause() {
  if(!audioPlayer.src) {
    if(currentSongs.length > 0) {
      playSong(0);
    }
    return;
  }
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
}

function displaySongs(songs){
  const list = document.getElementById('songList');
  list.innerHTML = '';

  if (songs.length === 0) {
    list.innerHTML = '<li>No MP3 files found in the music folder.</li>';
    return;
  }

  songs.forEach(song => {
    const li = document.createElement('li');
    
    const songInfo = document.createElement('div');
    songInfo.className = 'song-info';
    
    const title = document.createElement('div');
    title.className = 'song-title';
    title.textContent = song.title;
    
    const details = document.createElement('div');
    details.className = 'song-details';
    details.textContent = `${song.artist} • ${song.album} • ${formatDuration(song.duration)} • ${song.year || 'Unknown Year'}`;
    
    songInfo.appendChild(title);
    songInfo.appendChild(details);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = async () => {
      if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
        const success = await window.electronAPI.deleteMp3File(song.fileName);
        if (success) {
          showStatus(`Deleted "${song.title}" successfully!`);
          loadAllSongs(); // Refresh the listb
        } else {
          showStatus(`Failed to delete "${song.title}"`, 'error');
        }
      }
    };
    
    li.appendChild(songInfo);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

async function loadAllSongs() {
  try {
    const songs = await window.electronAPI.loadAllMp3Files();
    currentSongs = songs;
    displaySongs(songs);
    showStatus(`Loaded ${songs.length} songs from music folder`);
  } catch (error) {
    console.error('Error loading songs:', error);
    showStatus('Error loading songs', 'error');
  }
}

document.getElementById('min-btn').addEventListener('click', () => {
  window.electronAPI.minimize();
});

document.getElementById('max-btn').addEventListener('click', () => {
  window.electronAPI.maximize();
});

document.getElementById('close-btn').addEventListener('click', () => {
  window.electronAPI.close();
});

document.getElementById('uploadFiles').addEventListener('click', async () => {
  try {
    const uploadedFiles = await window.electronAPI.uploadMp3Files();
    if (uploadedFiles.length > 0) {
      showStatus(`Uploaded ${uploadedFiles.length} file(s) successfully!`);
      // Automatically refresh the song list after upload
      setTimeout(() => {
        loadAllSongs();
      }, 500);
    } else {
      showStatus('No files were uploaded', 'error');
    }
  } catch (error) {
    console.error('Error uploading files:', error);
    showStatus('Error uploading files', 'error');
  }
});

document.getElementById('loadSongs').addEventListener('click', loadAllSongs);

document.querySelectorAll('.controls .btn')[0].addEventListener('click', playPrev);
document.querySelectorAll('.controls .btn')[1].addEventListener('click', togglePlayPause);
document.querySelectorAll('.controls .btn')[2].addEventListener('click', playNext);

audioPlayer.addEventListener('ended', playNext);

window.addEventListener('DOMContentLoaded', () => {
  loadAllSongs();
});