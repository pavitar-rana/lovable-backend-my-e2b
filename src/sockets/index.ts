import syncFilesHandler from "./syncFiles.handler.ts";
import startChatHandler from "./startChat.handler.ts";

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    syncFilesHandler(io, socket);
    startChatHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export default registerSocketHandlers;
