const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8081 });

const clients = [];

function createAsset(name) {
  return {
    name,
    price: Math.random() * 100,
    lastPrice: Math.random() * 100,
    lastPriceTime: Date.now(),
  };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createBroker({ sendPriceChange }) {
  const assets = {
    PETR4: createAsset("PETR4"),
    VALE3: createAsset("VALE3"),
    BBDC4: createAsset("BBDC4"),
    ITUB4: createAsset("ITUB4"),
    B3SA3: createAsset("B3SA3"),
    MGLU3: createAsset("MGLU3"),
  };

  function tick() {
    for (const asset of Object.values(assets)) {
      // 20% de chance de não alterar o ativo
      if (Math.random() > 0.8) continue;

      asset.lastPrice = asset.price;

      asset.price = asset.lastPrice * (1 + randomBetween(-5, 5) / 100);
      asset.lastPriceTime = Date.now();

      // Envia evento de alteração
      sendPriceChange(asset);
    }

    setTimeout(tick, 16.67);
  }

  setTimeout(tick, 16.67);
}

const commands = {
  ping: () => {
    return "pong";
  },
  message: (data) => {
    return "message sent";
  },
};

createBroker({
  sendPriceChange: (asset) => {
    console.log("price change", asset.name, asset.price);
    clients.forEach((client) => {
      client.send(JSON.stringify({ type: "price-change", data: asset }));
    });
  },
});

wss.on("connection", (s) => {
  console.log("Client connected");
  clients.push(s);

  s.on("close", () => {
    clients.splice(clients.indexOf(s), 1);
  });

  s.on("message", (message) => {
    const command = JSON.parse(message);
    const response = commands[command.type](command.data);
    s.send(JSON.stringify(response));
  });

  s.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  s.on("open", () => {
    console.log("Client connected");
  });
});

console.log("WebSocket server running on port 8080");
