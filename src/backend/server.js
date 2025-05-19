const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

let ultimoEstado = [];

io.on("connection", (socket) => {
  console.log("📲 Cliente conectado");
  socket.emit("message", JSON.stringify(ultimoEstado));
});

app.use(express.json());

app.post("/actualizar", (req, res) => {
  ultimoEstado = req.body;
  io.emit("message", JSON.stringify(ultimoEstado));
  res.sendStatus(200);
});

server.listen(5050, () => {
  console.log("🟢 Servidor corriendo en puerto 5050");
});
