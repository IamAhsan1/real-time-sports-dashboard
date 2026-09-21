import express from "express";
import http from "http";
import matchRouter from "./routes/matches.js";
import commentaryRouter from "./routes/commentary.js";
import { setupWebSocketServer } from "./ws/server.js";
import { httpSecurityMiddleware } from "./arcjet.js";

const app = express();
app.use(express.json());

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const { broadcastMatchCreated ,broadcastCommentary} = setupWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary=broadcastCommentary;

app.use(httpSecurityMiddleware);
app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);

server.listen(port, hostname, () => {
    const baseUrl = hostname === '0.0.0.0'
        ? `http://localhost:${port}`
        : `http://${hostname}:${port}`;
    console.log(`Base URL: ${baseUrl}`);
});

