import express from "express";
import http from "http";
import matchRouter from "./routes/matches.js";
import { setupWebSocketServer } from "./ws/server.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const { broadcastMatchCreated } = setupWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

//routes 
app.use("/matches", matchRouter);
app.use("/matches", matchRouter);


//Listen to the server
server.listen(port, hostname, () => {

    const baseUrl =
        hostname === '0.0.0.0'
            ? `http://localhost:${port}`
            : `http://${hostname}:${port}`;

    console.log(`Base URL: ${baseUrl}`);
});






























// import { WebSocketServer ,WebSocket} from "ws";

// const wss = new WebSocketServer({ port: 8080 });

// wss.on("connection", (socket,req) => {
//     const clientIP = req.socket.remoteAddress;
//     console.log(`Client connected from IP: ${clientIP}`);


//     socket.on("message", (rawMessage) => {
//         console.log(`Received message: ${rawMessage}`);
//         // Broadcast the message to all connected clients
//         wss.clients.forEach((client)=>{
//             if(client.readyState === WebSocket.OPEN){
//                 client.send(`Server Broadcast: ${rawMessage}`);
//             }
//         })
//     }
//     );

//     socket.on("error", (error) => {
//         console.error(`WebSocket error: ${clientIP} - ${error.message}`);
//     });

//     socket.on("close", () => {
//         console.log(`Client disconnected from IP: ${clientIP}`);
//     });



// })

// console.log("WebSocket server is running on ws://localhost:8080");
