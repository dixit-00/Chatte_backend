import dotenv from "dotenv";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import { Server as SocketIoServer, Socket } from "socket.io";
import { registerUserEvents } from "./UserEvent.js";

dotenv.config();

export function intializeSocket(server: any): SocketIoServer {
  const io = new SocketIoServer(server, {
    cors: {
      origin: "*",
    },
  });
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: any, decoded: any) => {
        if (err) {
          return next(new Error("Authentication error: Invalid token"));
        }
        let userData = decoded.user;
        socket.data = userData;
        socket.data.userId = userData.id;
        next();
      }
    );
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} , username:${socket.data.name} `);

    registerUserEvents(io, socket);

    socket.on("disconnect", () => {
      console.log(
        `User disconnected: ${userId} , username:${socket.data.name}`
      );
    });
  });
  return io;
}
