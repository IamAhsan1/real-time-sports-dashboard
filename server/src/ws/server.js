import { WebSocket ,WebSocketServer} from 'ws';

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open. Ready state: ', socket.readyState);
        return;
    }
    socket.send(JSON.stringify(payload));
}

function sendBroadCast(wss, payload) {
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) {
            return;
        }

        client.send(JSON.stringify(payload));
    });
}
export function setupWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024  // 1MB});
    });

    wss.on('connection', (socket) => {
        console.log('New WebSocket connection established.');
        sendJson(socket, { message: 'Welcome to the WebSocket server!' });

        socket.on('error', console.error);

    })

    function broadcastMatchCreated(match) {
        sendBroadCast(wss, { type: 'matchCreated', match });
    }

    return {
        broadcastMatchCreated
    };
}
