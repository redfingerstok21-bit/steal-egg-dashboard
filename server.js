const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Storage untuk data player per server
const serverData = {};

// Endpoint untuk menerima data dari Roblox
app.post('/api/update', (req, res) => {
    try {
        const { serverId, playerId, playerName, data } = req.body;
        
        // Validasi
        if (!serverId || !playerId) {
            return res.status(400).json({ 
                error: 'serverId dan playerId required' 
            });
        }

        // Inisialisasi server jika belum ada
        if (!serverData[serverId]) {
            serverData[serverId] = {
                players: {},
                lastUpdate: new Date().toISOString()
            };
        }

        // Update data player
        serverData[serverId].players[playerId] = {
            name: playerName || 'Player',
            data: data || {},
            lastUpdate: new Date().toISOString()
        };

        // Cleanup: hapus player yang sudah tidak aktif (5 menit)
        const now = new Date();
        for (const [pid, pData] of Object.entries(serverData[serverId].players)) {
            const lastUpdate = new Date(pData.lastUpdate);
            if ((now - lastUpdate) > 300000) { // 5 menit
                delete serverData[serverId].players[pid];
            }
        }

        res.json({ 
            success: true, 
            message: `Data ${playerName} updated`,
            serverId: serverId,
            playerId: playerId
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk mendapatkan data dashboard
app.get('/api/data', (req, res) => {
    const { serverId } = req.query;
    
    if (!serverId) {
        return res.status(400).json({ 
            error: 'serverId required' 
        });
    }

    const server = serverData[serverId];
    if (!server || Object.keys(server.players).length === 0) {
        return res.json({
            serverId: serverId,
            players: {},
            totalPlayers: 0,
            message: 'Tidak ada player di server ini'
        });
    }

    // Ambil semua player dan data mereka
    const players = {};
    for (const [pid, pData] of Object.entries(server.players)) {
        players[pid] = {
            name: pData.name,
            data: pData.data,
            lastUpdate: pData.lastUpdate
        };
    }

    res.json({
        serverId: serverId,
        players: players,
        totalPlayers: Object.keys(players).length,
        lastUpdate: server.lastUpdate
    });
});

// Endpoint untuk mendapatkan data spesifik player (untuk dashboard)
app.get('/api/player/:playerId', (req, res) => {
    const { playerId } = req.params;
    const { serverId } = req.query;

    if (!serverId) {
        return res.status(400).json({ error: 'serverId required' });
    }

    const server = serverData[serverId];
    if (!server || !server.players[playerId]) {
        return res.status(404).json({ 
            error: 'Player tidak ditemukan' 
        });
    }

    const player = server.players[playerId];
    res.json({
        playerId: playerId,
        name: player.name,
        data: player.data,
        lastUpdate: player.lastUpdate
    });
});

// Health check
app.get('/api/health', (req, res) => {
    const totalServers = Object.keys(serverData).length;
    let totalPlayers = 0;
    for (const sid of Object.keys(serverData)) {
        totalPlayers += Object.keys(serverData[sid].players).length;
    }
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        totalServers: totalServers,
        totalPlayers: totalPlayers
    });
});

// Cleanup server kosong setiap 10 menit
setInterval(() => {
    const now = new Date();
    for (const [sid, server] of Object.entries(serverData)) {
        if (Object.keys(server.players).length === 0) {
            delete serverData[sid];
        }
    }
}, 600000);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
