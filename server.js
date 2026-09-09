const http = require('http');
const url = require('url');
const PORT = process.env.PORT || 8080;

// Chat Storage
let chatMessages = ["[purple]System: [white]Chat successfully updated!"];
let totalUsers = new Set(); 
let onlineUsers = {};      

// Blueprint Hub and Tactical Records Data Storage
let globalBlueprints = [
    { id: 1, title: "Compact Silicon Factory 3x3", author: "VoTaK", likes: 25, code: "bXNjaAF4nGNgYmBmZmDJS8xNZeF1zktNLlFIy89nYGBgYQCKMtNKS1KZWAD+gQoX" }
];
let globalRecords = [
    { map: "Alpha Sector (Cilistis)", wave: 85, holder: "VoTaK" },
    { map: "Obsidian Craters", wave: 42, holder: "Player_11" }
];

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    // Online counter heartbeat update logic
    const now = Date.now();
    Object.keys(onlineUsers).forEach(user => {
        if (now - onlineUsers[user] > 12000) {
            delete onlineUsers[user];
        }
    });

    const parsedUrl = url.parse(req.url, true);
    const userParam = parsedUrl.query.user;

    if (userParam) {
        totalUsers.add(userParam);
        onlineUsers[userParam] = now;
    }

    // ==========================================
    // 🛰️ ENDPOINT: GET HUB DATA (BLUEPRINTS & RECORDS)
    // ==========================================
    if (parsedUrl.pathname === '/darklife-hub-data' && req.method === 'GET') {
        res.end(JSON.stringify({
            blueprints: globalBlueprints,
            records: globalRecords
        }));
        return;
    }

    // ==========================================
    // 🖥️ ENDPOINT: SHARE NEW BLUEPRINT
    // ==========================================
    if (parsedUrl.pathname === '/darklife-share-blueprint' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.user && data.title && data.code) {
                    const newBlueprint = {
                        id: globalBlueprints.length + 1,
                        title: data.title,
                        author: data.user,
                        likes: 0,
                        code: data.code
                    };
                    globalBlueprints.unshift(newBlueprint);
                    if (globalBlueprints.length > 40) globalBlueprints.pop();
                    res.end(JSON.stringify({ status: "ok" }));
                } else {
                    res.end(JSON.stringify({ error: "Missing fields" }));
                }
            } catch(e) { res.end(JSON.stringify({ error: "Invalid JSON" })); }
        });
        return;
    }

    // ==========================================
    // ♥️ ENDPOINT: LIKE BLUEPRINT
    // ==========================================
    if (parsedUrl.pathname === '/darklife-like-blueprint' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const bp = globalBlueprints.find(b => b.id === parseInt(data.blueprintId));
                if (bp) {
                    bp.likes += 1;
                    res.end(JSON.stringify({ status: "ok", likes: bp.likes }));
                } else {
                    res.end(JSON.stringify({ error: "Not found" }));
                }
            } catch(e) { res.end(JSON.stringify({ error: "Invalid JSON" })); }
        });
        return;
    }

    // ==========================================
    // ⚔️ ENDPOINT: UPDATE TACTICAL WAVE RECORD
    // ==========================================
    if (parsedUrl.pathname === '/darklife-update-record' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.mapName && data.waveCount && data.user) {
                    let record = globalRecords.find(r => r.map.toLowerCase() === data.mapName.toLowerCase());
                    if (record) {
                        if (parseInt(data.waveCount) > record.wave) {
                            record.wave = parseInt(data.waveCount);
                            record.holder = data.user;
                        }
                    } else {
                        globalRecords.push({ map: data.mapName, wave: parseInt(data.waveCount), holder: data.user });
                    }
                    res.end(JSON.stringify({ status: "ok" }));
                } else {
                    res.end(JSON.stringify({ error: "Missing fields" }));
                }
            } catch(e) { res.end(JSON.stringify({ error: "Invalid JSON" })); }
        });
        return;
    }

    // ==========================================
    // 🌐 ENDPOINT: CHAT MAIN ROOT HANDLER
    // ==========================================
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.user) {
                    totalUsers.add(data.user);
                    onlineUsers[data.user] = Date.now();
                }
                if (data.msg) {
                    chatMessages.push(data.msg);
                    if (chatMessages.length > 8) chatMessages.shift();
                }
                res.end(JSON.stringify({ status: "ok" }));
            } catch(e) { res.end(JSON.stringify({ error: "Invalid JSON" })); }
        });
    } else {
        res.end(JSON.stringify({ 
            history: chatMessages,
            total: totalUsers.size,
            online: Object.keys(onlineUsers).length
        }));
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
                
