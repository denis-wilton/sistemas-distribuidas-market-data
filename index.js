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

function createBroker({ sendPriceChange }) {
  const assets = {
    PETR4: createAsset("PETR4"),
    VALE3: createAsset("VALE3"),
    BBDC4: createAsset("BBDC4"),
    ITUB4: createAsset("ITUB4"),
  };

  function tick() {
    for (const asset of Object.values(assets)) {
      if (Math.random() > 0.2) {
        continue;
      }
      const min = 0.001;
      const max = 0.2;
      const positiveOrNegative = Math.random() > 0.5 ? 1 : -1;

      const floatChange = Math.random() * (max - min) + min;

      asset.price =
        asset.price + floatChange * asset.price * positiveOrNegative;
      asset.lastPrice = asset.price;
      asset.lastPriceTime = Date.now();
      sendPriceChange(asset);
    }

    setTimeout(tick, Math.floor(Math.random() * 200) + 30);
  }

  setTimeout(tick, 100);
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
