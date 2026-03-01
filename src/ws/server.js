import {WebSocket, WebSocketServer} from 'ws';
import { getWsArcjet } from '../arcjet.js';


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
  

    // Helper for authentication (replace with real logic)
    function authenticateToken(token) {
        // Example: accept any non-empty token, replace with real validation
        return typeof token === 'string' && token.length > 0;
    }

    wss.on('connection', async (socket, req) => {

        try {
            const wsArcjet = getWsArcjet();
            if(wsArcjet){
                const decision = await wsArcjet.protect(req);

                if(decision.isDenied()){
                   const code = decision.reason.isRateLimit() ? 1013 : 1008;
                   const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access denied';
                   socket.close(code, reason);
                   return;
                }
            }
        } catch(err){
            console.error('Error in Arcjet WebSocket protection', err);
            socket.close(1011, 'Service unavailable');
            return;
        }

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
