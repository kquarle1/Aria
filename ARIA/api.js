function LoggedInUser() {
    const publicPages = ['login.html', 'signup.html']; 
    const currentPath = window.location.pathname.split('/').pop();
    const hasSession = localStorage.getItem('user_id');
    
    if (!hasSession && !publicPages.includes(currentPath) && currentPath !== "") {
        window.location.href = 'login.html';
    }
}
LoggedInUser();

class AriaApp {
    constructor() {
        const userEmail = localStorage.getItem("user_id");
        this.key = userEmail ? `ariaData_${userEmail}` : "ariaData";

        this.data = JSON.parse(localStorage.getItem(this.key)) || {
            playlists: { Favorites: [] },
            user: {
                name: "",
                email: "",
                pfp: "https://cobaltsettlements.com/wp-content/uploads/2019/03/blank-profile.jpg",
                phone: "",
                city: "",
                state: "",
            },
        };
    }

    async getSongs(query) {
        if (!query) return;
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=5&entity=song`);
        const json = await res.json();
        const grid = document.getElementById('results');
        if (!grid) return;

        grid.innerHTML = json.results.map(s => `
            <div class="song-card">
                <img src="${s.artworkUrl100}" width="100" style="border-radius:8px">
                <h5>${s.trackName}</h5>
                <audio controls style="width:100%"><source src="${s.previewUrl}"></audio>
                <select onchange="aria.saveToProfile('${s.trackId}', '${s.trackName.replace(/'/g,"")}', '${s.artworkUrl100}', this.value)">
                    <option disabled selected>Add to...</option>
                    ${Object.keys(this.data.playlists).map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>
        `).join('');
    }

    saveToProfile(id, title, img, folder) {
        if (!this.data.playlists[folder].some(s => s.id === id)) {
            this.data.playlists[folder].push({ id, title, img });
            this.save();
            alert("Saved to " + folder);
        }
    }

    createNewList(name) {
        const title = name.trim();
        if (!title || this.data.playlists[title]) return;
        this.data.playlists[title] = [];
        this.save();
        this.updatePlaylistUI();
    }

    deletePlaylist(name) {
        if (name === 'Favorites') {
            alert("You cannot delete the Favorites playlist.");
            return;
        }
        if (confirm(`Are you sure you want to delete the playlist "${name}"?`)) {
            delete this.data.playlists[name];
            this.save();
            this.updatePlaylistUI();
            const view = document.getElementById('playlist-view');
            if (view) view.innerHTML = '<h3>Select a list</h3>';
        }
    }

    removeSong(folder, songId) {
        this.data.playlists[folder] = this.data.playlists[folder].filter(s => s.id !== songId);
        this.save();
        this.openFolder(folder);
    }

    register(name, email, phone, city, state) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }
    
        if (localStorage.getItem(`ariaData_${email}`)) {
            alert("An account with this email already exists.");
            return;
        }
    
        const newUserAccount = {
            playlists: { Favorites: [] },
            user: { name, email, phone, city, state, pfp: "https://cobaltsettlements.com/wp-content/uploads/2019/03/blank-profile.jpg" }
        };
    
        localStorage.setItem(`ariaData_${email}`, JSON.stringify(newUserAccount));
        alert("Account Registered!");
        window.location.href = 'login.html';
    }
    
    updateProfileInfo(phone, city, state) {
        this.data.user.phone = phone;
        this.data.user.city = city;
        this.data.user.state = state;
        this.save();
        alert("Profile Updated!");
        location.reload();
    }

    updatePfp(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.data.user.pfp = e.target.result;
            this.save();
            location.reload();
        };
        reader.readAsDataURL(file);
    }

    save() { 
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    loadProfileData() {
        const d = this.data.user;
        const set = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val || "Not set"; };
        set('prof-name', d.name);
        set('prof-email', d.email);
        set('prof-phone', d.phone);
        set('prof-city', d.city);
        set('prof-state', d.state);
        if (document.getElementById('prof-img') && d.pfp) document.getElementById('prof-img').src = d.pfp;
    }
    
    updatePlaylistUI() {
        const menu = document.getElementById('playlist-menu');
        if (!menu) return;
        menu.innerHTML = '<h4>Your Collections</h4>' + Object.keys(this.data.playlists).map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.1); margin-bottom:5px; border-radius:5px">
                <span style="cursor:pointer; flex-grow:1" onclick="aria.openFolder('${p}')">${p}</span>
                <span style="cursor:pointer; color:#ff4c4c; font-weight:bold; padding:0 5px;" onclick="aria.deletePlaylist('${p}')">×</span>
            </div>
        `).join('') + `
            <div style="margin-top:20px">
                <input id="listInput" placeholder="Name..." style="width:100%; box-sizing:border-box; margin-bottom:10px;">
                <button onclick="aria.createNewList(document.getElementById('listInput').value)" style="width:100%">Create</button>
            </div>
        `;
    }
    //Playlist display
    openFolder(name) {
        const view = document.getElementById('playlist-view');
        if (!view) return;
        view.innerHTML = `<h3>${name}</h3>` + this.data.playlists[name].map(s => `
            <div class="song-card" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; background:rgba(255,255,255,0.1); padding:10px; border-radius:8px; width:100%; box-sizing:border-box;">
                <div style="display:flex; align-items:center;">
                    <img src="${s.img}" width="40" style="margin-right:15px; border-radius:4px;">
                    <span style="font-weight:bold; white-space:nowrap;">${s.title}</span>
                </div>
                <button class="remove-btn" onclick="aria.removeSong('${name}', '${s.id}')" style="background:#ff4c4c; padding:8px 15px; border:none; color:white; border-radius:8px; cursor:pointer; margin-left:auto;">Remove</button>
            </div>
        `).join('');
    }

    logout() {
        localStorage.removeItem('user_id');
        window.location.href = 'login.html';
    }
}

const aria = new AriaApp();
//Profile information
if (window.location.pathname.includes('profile.html')) {
    aria.loadProfileData();
}