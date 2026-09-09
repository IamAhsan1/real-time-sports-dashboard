import express from "express";

const app=express();
app.use(express.json());    


app.get("/Auth_System", (req,res)=>{
    res.send("Auth_System is working");
});

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})






























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
