/**
 * Ideal solution is peer to peer but too much trouble
 */

// This server basically forwards all node messages to one another
const WebSocket = require('ws');
const server = new WebSocket.Server({
  port: 8080
});

let sockets = [];
server.on('connection', function(socket) {
    console.log("connection")
    socket.send('Welcome to GrizzCoin conection server')
  // Adicionamos cada nova conexão/socket ao array `sockets`
  // Add new conections to socket array
  sockets.push(socket);
  // Quando você receber uma mensagem, enviamos ela para todos os sockets
  // Forward the message
  socket.on('message', function(msg) {
    console.log(`${sockets.indexOf(socket)} says ${msg}`)
    sockets.forEach(s => (s != socket) ? s.send(msg):null);
  });
  // Quando a conexão de um socket é fechada/disconectada, removemos o socket do array
  // Remove socket when closed
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});