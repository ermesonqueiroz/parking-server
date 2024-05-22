const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "*"
  }
});

let players = [];

io.on("connection", (socket) => {
  players.push({
    id: socket.id,
    position: { x: 30 * players.length, y: 30 * players.length }
  })
  
  io.emit('update', players)

  socket.on('down', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, y: Math.min(470, player.position.y + 10) } }
        : player
    )

    io.emit('update', players)
  })

  socket.on('up', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, y: Math.min(470, player.position.y - 10) } }
        : player
    )

    io.emit('update', players)
  })

  socket.on('left', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, x: Math.max(0, player.position.x - 10) } }
        : player
    )

    io.emit('update', players)
  })

  socket.on('right', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, x: Math.max(0, player.position.x + 10) } }
        : player
    )

    io.emit('update', players)
  })

  socket.on('disconnect', () => {
    players = players.filter(({ id }) => id !== socket.id);
    io.emit('update', players)
  })
});

io.listen(process.env.PORT || 4000);
