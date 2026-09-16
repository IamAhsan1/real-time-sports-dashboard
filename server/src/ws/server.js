import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../arcjet.js';

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open. Ready state: ', socket.readyState);
        return;
    }
    socket.send(JSON.stringify(payload));
}

function sendBroadCast(wss, payload) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            sendJson(client, payload);
        }
    });
}

const HEARTBEAT_INTERVAL = 30000; // 30s — adjust as needed

function heartbeat() {
    this.isAlive = true;
}

export function setupWebSocketServer(server) {
    const wss = new WebSocketServer({
        noServer: true,          // we drive the handshake ourselves, below
        maxPayload: 1024 * 1024  // 1MB
    });

    // Guard: runs BEFORE any WebSocket handshake completes
    server.on('upgrade', async (req, socket, head) => {
        const { pathname } = new URL(req.url, `http://${req.headers.host}`);

        if (pathname !== '/ws') {
            socket.destroy();
            return;
        }

        try {
            const decision = await wsArcjet.protect(req);

            if (decision.isErrored()) {
                console.error('Arcjet WS errored, failing open:', decision.reason);
                // falls through to allow — flip this to reject if you'd rather fail closed
            } else if (decision.isDenied()) {
                const isRateLimited = decision.reason.isRateLimit();
                const statusCode = isRateLimited ? 429 : 403;
                const statusText = isRateLimited ? 'Too Many Requests' : 'Forbidden';
                console.log(`WS connection denied (${statusCode}):`, decision.reason);
                socket.write(
                    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
                    (isRateLimited ? 'Retry-After: 2\r\n' : '') +
                    'Connection: close\r\n\r\n'
                );
                socket.destroy();
                return;
            }
        } catch (err) {
            console.error('Arcjet WS error:', err);
            socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (socket, req) => {
        console.log('New WebSocket connection established.');
        sendJson(socket, { message: 'Welcome to the WebSocket server!' });

        socket.isAlive = true;
        socket.on('pong', heartbeat);
        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach(client => {
            if (client.isAlive === false) {
                console.error('Client failed heartbeat check, terminating connection.');
                return client.terminate();
            }
            client.isAlive = false;
            client.ping();
        });
    }, HEARTBEAT_INTERVAL);

    wss.on('close', () => {
        clearInterval(interval);
    });

    function broadcastMatchCreated(match) {
        sendBroadCast(wss, { type: 'matchCreated', match });
    }

    return { broadcastMatchCreated };
}
