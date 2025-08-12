class Song {
    constructor(id, title, artist) {
        const thisSong = this;
        thisSong.id = id;
        thisSong.title = title;
        thisSong.artist = artist; 
    }

    getInfoHTML() {
        const thisSong = this;
        return `
            <h3>${thisSong.title}</h3>
            <p><strong>Artist:</strong> ${thisSong.artist}</p>
        `;
    }
}

class SongFactory {
    create(id, title, artist) {
        return new Song(id, title, artist);
    }

    createArrayFromData(songDataArray) {
        const thisCreateArrayFromData = this; 
        return songDataArray.map(data => 
            thisCreateArrayFromData.create(data.id, data.title, data.artist)

        )
    }
}

class PlayerInterface {
    constructor(songsData, songFactory) {
        const thisPlayerInterface = this;
        thisPlayerInterface.dropdown = document.getElementById("songDropdown");
        thisPlayerInterface.info = document.getElementById("songInfo");
        thisPlayerInterface.songs = songFactory.createArrayFromData(songsData);
        thisPlayerInterface.populateDropdown(thisPlayerInterface.dropdown, thisPlayerInterface.songs);
        thisPlayerInterface.addDropdownListener();
    }

    populateDropdown(dropdownElement, songs) {
        songs.forEach(song => {
            const option = document.createElement("option");
            option.value = song.id;
            option.textContent = song.title;
            dropdownElement.appendChild(option);
        });
    }
    addDropdownListener() {
        const thisPlayerInterface = this;
        thisPlayerInterface.dropdown.addEventListener("change", () => {
            const selectedId = parseInt(thisPlayerInterface.dropdown.value, 10);
            const song = thisPlayerInterface.songs.find(song => song.id === selectedId);
            thisPlayerInterface.info.innerHTML = song ? song.getInfoHTML() : "";
        });
    }
}

const songsData = [
    { id: 1, title: "Song One", artist: "Artist A" },
    { id: 2, title: "Song Two", artist: "Artist B" },
    { id: 3, title: "Song Three", artist: "Artist C" }
];

const app = {
    init: function() {
        const thisApp = this;
        const factory = new SongFactory();
        const player = new PlayerInterface(songsData, factory);
    }
}

app.init();



