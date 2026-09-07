// Konfigurasi
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://steal-egg-api.vercel.app/api';

let currentServerId = '';
let currentPlayerId = '';
let refreshInterval = null;

// DOM Elements
const elements = {
    serverIdInput: document.getElementById('serverIdInput'),
    connectBtn: document.getElementById('connectBtn'),
    connectionInfo: document.getElementById('connectionInfo'),
    serverStatus: document.getElementById('serverStatus'),
    playerCount: document.getElementById('playerCount'),
    playersList: document.getElementById('playersList'),
    playerDetail: document.getElementById('playerDetail'),
    detailPlayerName: document.getElementById('detailPlayerName'),
    detailIncome: document.getElementById('detailIncome'),
    detailMoney: document.getElementById('detailMoney'),
    detailSpeed: document.getElementById('detailSpeed'),
    detailPet: document.getElementById('detailPet'),
    detailPetName: document.getElementById('detailPetName'),
    detailPetRarity: document.getElementById('detailPetRarity'),
    detailPetIncome: document.getElementById('detailPetIncome'),
    connectionStatus: document.getElementById('connectionStatus'),
    statusDot: document.getElementById('statusDot'),
    footerStatus: document.getElementById('footerStatus')
};

// Fungsi koneksi ke server
function connectToServer() {
    const serverId = elements.serverIdInput.value.trim();
    
    if (!serverId) {
        elements.connectionInfo.innerHTML = '<span style="color: #ff6b6b;">⚠️ Masukkan Server ID terlebih dahulu!</span>';
        return;
    }

    currentServerId = serverId;
    elements.connectionInfo.innerHTML = `<span style="color: #69db7c;">✅ Terhubung ke server: ${serverId}</span>`;
    elements.serverStatus.innerHTML = `<i class="fas fa-circle" style="color: #69db7c;"></i> Server #${serverId}`;
    
    // Update status
    elements.connectionStatus.textContent = 'online';
    elements.connectionStatus.style.color = '#69db7c';
    elements.statusDot.className = 'status-dot online';
    elements.footerStatus.textContent = 'Terhubung ke server';
    
    // Fetch data pertama
    fetchServerData();
    
    // Auto refresh setiap 3 detik
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(fetchServerData, 3000);
}

// Fetch data dari server
async function fetchServerData() {
    if (!currentServerId) return;

    try {
        const response = await fetch(`${API_URL}/data?serverId=${currentServerId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        updatePlayersList(data);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        // Tampilkan pesan error di UI
        if (!document.querySelector('.error-state')) {
            elements.playersList.innerHTML = `
                <div class="empty-state error-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                    <p style="color: #ff6b6b;">Gagal menghubungi server</p>
                    <p class="sub-text">Pastikan server backend berjalan</p>
                </div>
            `;
        }
    }
}

// Update daftar player
function updatePlayersList(data) {
    const players = data.players || {};
    const totalPlayers = data.totalPlayers || 0;
    
    // Update counter
    elements.playerCount.textContent = `${totalPlayers} player${totalPlayers !== 1 ? 's' : ''}`;
    
    if (totalPlayers === 0) {
        elements.playersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <p>Belum ada player yang menjalankan script</p>
                <p class="sub-text">Jalankan script Roblox untuk muncul di sini</p>
            </div>
        `;
        return;
    }

    // Render player cards
    let html = '';
    for (const [pid, pData] of Object.entries(players)) {
        const playerName = pData.name || 'Player';
        const playerStats = pData.data || {};
        const income = playerStats.incomePerSecond || 0;
        const speed = playerStats.speed || 0;
        const money = playerStats.money || 0;
        
        html += `
            <div class="player-card" onclick="showPlayerDetail('${pid}')">
                <div class="online-indicator"></div>
                <div class="player-name">${playerName}</div>
                <div class="player-stats">
                    <span>💰 ${income.toFixed(2)} $/s</span>
                    <span>⚡ ${speed} km/h</span>
                </div>
            </div>
        `;
    }
    elements.playersList.innerHTML = html;
}

// Tampilkan detail player
async function showPlayerDetail(playerId) {
    try {
        const response = await fetch(`${API_URL}/player/${playerId}?serverId=${currentServerId}`);
        if (!response.ok) throw new Error('Failed to fetch player data');
        
        const data = await response.json();
        currentPlayerId = playerId;
        
        // Update detail
        elements.detailPlayerName.innerHTML = `<i class="fas fa-user"></i> ${data.name}`;
        
        const stats = data.data || {};
        elements.detailIncome.textContent = `${(stats.incomePerSecond || 0).toFixed(2)} $/s`;
        elements.detailMoney.textContent = `${formatNumber(stats.money || 0)} $`;
        elements.detailSpeed.textContent = `${stats.speed || 0} km/h`;
        
        if (stats.topPet) {
            const pet = stats.topPet;
            elements.detailPet.textContent = `${pet.name || '-'}`;
            elements.detailPetName.textContent = pet.name || '-';
            elements.detailPetRarity.textContent = pet.rarity || '-';
            elements.detailPetIncome.textContent = `${(pet.incomePerSecond || 0).toFixed(2)} $/s`;
        }
        
        // Tampilkan detail panel
        elements.playerDetail.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching player detail:', error);
    }
}

// Tutup detail
function closePlayerDetail() {
    elements.playerDetail.style.display = 'none';
    currentPlayerId = '';
}

// Format angka
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Auto connect dari URL parameter
function autoConnectFromURL() {
    const params = new URLSearchParams(window.location.search);
    const serverId = params.get('server');
    if (serverId) {
        elements.serverIdInput.value = serverId;
        connectToServer();
    }
}

// Auto connect saat load
autoConnectFromURL();
