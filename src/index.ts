import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.ts";
import registerSocketHandlers from "./sockets/index.ts";

dotenv.config();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

registerSocketHandlers(io);

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});
