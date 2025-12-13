import { Server as SocketIoServers } from "socket.io";

export function registerUserEvents(io: SocketIoServers, socket: any) {
  // Example event: Join a chat room
  socket.on("TestSocket", (roomId: string) => {
    socket.emit("TestSocketResponse", { msg: "Socket is working fine!" });
  });
}
