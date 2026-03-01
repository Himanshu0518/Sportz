import {WebSocket, WebSocketServer} from 'ws';


export function sendJSON(socket,payload){
    if(socket && socket.readyState === WebSocket.OPEN){
        socket.send(JSON.stringify(payload));
    }
}


export function broadcastJSON(wss,payload){
    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify(payload));
        }
    }); 
}


export function setupWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024, // 1MB
    });

    // Heartbeat interval (ms)
    const HEARTBEAT_INTERVAL = 30000;
    const heartbeat = () => {
        this.isAlive = true;
    };

    // Helper for authentication (replace with real logic)
    function authenticateToken(token) {
        // Example: accept any non-empty token, replace with real validation
        return typeof token === 'string' && token.length > 0;
    }

    wss.on('connection', (socket, req) => {
        // --- AUTHENTICATION ---
        let token = null;
        try {
            // Try to get token from query string
            const url = new URL(req.url, `http://${req.headers.host}`);
            token = url.searchParams.get('token');
        } catch (e) {}
        // Optionally, check headers: req.headers['sec-websocket-protocol'] or custom
        if (!authenticateToken(token)) {
            socket.close(4001, 'Authentication failed');
            return;
        }

        // --- HEARTBEAT ---
        socket.isAlive = true;
        socket.on('pong', function () {
            this.isAlive = true;
        });

        console.log('New WebSocket connection established');
        sendJSON(socket, { message: 'Welcome to the WebSocket server!' });

        socket.on('error', (err) => {
            console.error('WebSocket error:', err);
        });

        socket.on('close', () => {
            // Clean up if needed
        });
    });

    // Heartbeat interval for all clients
    const interval = setInterval(() => {
        wss.clients.forEach((socket) => {
            if (socket.isAlive === false) {
                socket.terminate();
                return;
            }
            socket.isAlive = false;
            socket.ping();
        });
    }, HEARTBEAT_INTERVAL);

    wss.on('close', () => {
        clearInterval(interval);
    });

    function broadcastMatchCreation(update) {
        broadcastJSON(wss, { type: 'match_update', data: update });
    }

    return { broadcastMatchCreation };
}
