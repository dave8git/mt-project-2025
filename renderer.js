const songs = [
  { id: 1, title: "Bohemian Rhapsody", artist: "Queen" },
  { id: 2, title: "Imagine", artist: "John Lennon" },
  { id: 3, title: "Hotel California", artist: "Eagles" },
];

const dropdown = document.getElementById("songDropdown");
const info = document.getElementById("songInfo");

// Populate dropdown
songs.forEach((song) => {
  const option = document.createElement("option");
  option.value = song.id;
  option.textContent = song.title;
  dropdown.appendChild(option);
});

// Handle selection
dropdown.addEventListener("change", () => {
  const selectedId = parseInt(dropdown.value);
  const song = songs.find((s) => s.id === selectedId);

  if (song) {
    info.innerHTML = `
      <h3>${song.title}</h3>
      <p><strong>Artist:</strong> ${song.artist}</p>
    `;
  } else {
    info.innerHTML = "";
  }
});