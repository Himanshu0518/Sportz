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

    function broadcastMatchCreation(update) {
        broadcastJSON(wss, { type: 'match_update', data: update });
    }

    wss.on('connection', (socket) => {
        console.log('New WebSocket connection established');
        sendJSON(socket, { message: 'Welcome to the WebSocket server!' });

        socket.on('error', (err) => {
            console.error('WebSocket error:', err);
        });
    });

    return { broadcastMatchCreation };
}
