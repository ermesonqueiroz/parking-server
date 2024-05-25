const { Server } = require("socket.io");
const dayjs = require("dayjs");

const io = new Server({
  cors: {
    origin: "*"
  }
});

let players = [];
let parkingLots = [
  [
    { x: 60, y: 90, height: 90, width: 90, player: null },
    { x: 180, y: 90, height: 90, width: 90, player: null },
    { x: 300, y: 90, height: 90, width: 90, player: null },
    { x: 420, y: 90, height: 90, width: 90, player: null },
  ],
  [
    { x: 60, y: 210, height: 90, width: 90, player: null },
    { x: 180, y: 210, height: 90, width: 90, player: null },
    { x: 300, y: 210, height: 90, width: 90, player: null },
    { x: 420, y: 210, height: 90, width: 90, player: null },
  ],
  [
    { x: 60, y: 330, height: 90, width: 90, player: null },
    { x: 180, y: 330, height: 90, width: 90, player: null },
    { x: 300, y: 330, height: 90, width: 90, player: null },
    { x: 420, y: 330, height: 90, width: 90, player: null },
  ],
  [
    { x: 60, y: 450, height: 90, width: 90, player: null },
    { x: 180, y: 450, height: 90, width: 90, player: null },
    { x: 300, y: 450, height: 90, width: 90, player: null },
    { x: 420, y: 450, height: 90, width: 90, player: null },
  ],
];
let tickets = [];

function msToTime(duration) {
  return [
    Math.floor((duration / (1000 * 60 * 60)) % 24),
    Math.floor((duration / (1000 * 60)) % 60),
    Math.floor((duration / 1000) % 60)
  ];
}

io.on("connection", (socket) => {
  const broadcastUpdate = () => {
    parkingLots = parkingLots.map((row) => {
      return row.map(({ x, y, height, width, player, checkIn }) => {
        const playerOnSlot = players.find(
          ({ position }) => position.x >= x
            && position.x <= (x + width) - position.width
            && position.y >= y
            && position.y <= (y + height) - position.height
        )

        if (!player && playerOnSlot) {
          tickets.push({
            player: socket.id,
            checkIn: Date.now(),
            checkOut: null,
            total: null
          })
        }

        if (player && !playerOnSlot) {
          tickets = tickets.map((ticket) => {
            const checkOut = ticket.checkIn + ((Date.now() - ticket.checkIn) * 1000);
            const [hours, minutes] = msToTime(checkOut - ticket.checkIn)

            let total = 0;

            if (hours < 1 && minutes <= 15) total = 0;
            else if (hours < 3) total = 500
            else if (hours >= 3 && minutes < 15) total = 500 + (hours - 3) * 250
            else total = 500 + (hours - 2) * 250

            return ticket?.player === socket.id && !ticket?.checkOut
              ? { ...ticket, checkOut, total }
              : ticket;
          })
        }

        return {
          x,
          y,
          height,
          width,
          player: playerOnSlot?.id,
          checkIn: playerOnSlot ? (player ? checkIn : Date.now()) : null
        }
      })
    })

    io.emit('update', { players, parkingLots, tickets });
  };

  broadcastUpdate()

  socket.on('join', (plate) => {
    players.push({
      id: socket.id,
      plate,
      position: { x: 30 * players.length, y: 30 * players.length, height: 30, width: 30 }
    })

    broadcastUpdate();
  })

  socket.on('down', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, y: Math.min(570, player.position.y + 30) } }
        : player
    )

    broadcastUpdate();
  })

  socket.on('up', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, y: Math.max(0, player.position.y - 30) } }
        : player
    )

    broadcastUpdate();
  })

  socket.on('left', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, x: Math.max(0, player.position.x - 30) } }
        : player
    )

    broadcastUpdate();
  })

  socket.on('right', () => {
    players = players.map(
      (player) => player.id === socket.id
        ? { ...player, position: { ...player.position, x: Math.min(570, player.position.x + 30) } }
        : player
    )

    broadcastUpdate();
  })

  socket.on('disconnect', () => {
    players = players.filter(({ id }) => id !== socket.id);
    broadcastUpdate();
  })
});

io.listen(Number(process.env.PORT) || 4000);
