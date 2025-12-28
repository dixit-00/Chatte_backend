import dotenv from "dotenv";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import { Server as SocketIoServer, Socket } from "socket.io";
import { registerUserEvents } from "./UserEvent.js";
import { registerChatEvents } from "./chatEvent.js";
import Conversation from "../modals/Conversation.js";

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

  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} , username:${socket.data.name} `);

    registerUserEvents(io, socket);
    registerChatEvents(io, socket);

    try {
      const Conversations = await Conversation.find({
        participants: userId,
      }).select("_id");

      Conversations.forEach((Conversation) => {
        socket.join(Conversation._id.toString());
      });
    } catch (error: any) {
      console.log("Error joining connection", error);
    }

    socket.on("disconnect", () => {
      console.log(
        `User disconnected: ${userId} , username:${socket.data.name}`
      );
    });
  });
  return io;
}
