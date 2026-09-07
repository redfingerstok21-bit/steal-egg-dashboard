const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database sederhana (in-memory)
const serverData = {};

// Endpoint untuk menerima data dari Roblox
app.post('/api/update', (req, res) => {
    try {
        const { serverId, playerId, playerName, data } = req.body;
        
        if (!serverId || !playerId) {
            return res.status(400).json({ error: 'serverId dan playerId required' });
        }

        if (!serverData[serverId]) {
            serverData[serverId] = { players: {} };
        }

        serverData[serverId].players[playerId] = {
            name: playerName || 'Player',
            data: data || {},
            lastUpdate: new Date().toISOString()
        };

        // Cleanup player tidak aktif (5 menit)
        const now = new Date();
        for (const [pid, pData] of Object.entries(serverData[serverId].players)) {
            const lastUpdate = new Date(pData.lastUpdate);
            if ((now - lastUpdate) > 300000) {
                delete serverData[serverId].players[pid];
            }
        }

        res.json({ success: true, message: `Data ${playerName} updated` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk mendapatkan data
app.get('/api/data', (req, res) => {
    const { serverId } = req.query;
    
    if (!serverId) {
        return res.status(400).json({ error: 'serverId required' });
    }

    const server = serverData[serverId];
    if (!server || Object.keys(server.players).length === 0) {
        return res.json({
            serverId: serverId,
            players: {},
            totalPlayers: 0
        });
    }

    res.json({
        serverId: serverId,
        players: server.players,
        totalPlayers: Object.keys(server.players).length
    });
});

// Endpoint untuk data player spesifik
app.get('/api/player/:playerId', (req, res) => {
    const { playerId } = req.params;
    const { serverId } = req.query;

    if (!serverId) {
        return res.status(400).json({ error: 'serverId required' });
    }

    const server = serverData[serverId];
    if (!server || !server.players[playerId]) {
        return res.status(404).json({ error: 'Player tidak ditemukan' });
    }

    res.json({
        playerId: playerId,
        name: server.players[playerId].name,
        data: server.players[playerId].data,
        lastUpdate: server.players[playerId].lastUpdate
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
