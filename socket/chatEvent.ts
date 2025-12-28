import { Server as SocketIoServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation.js";
import { Types } from "mongoose";
import Message from "../modals/Message.js";

export function registerChatEvents(io: SocketIoServer, socket: Socket) {
  // Listen for newConversation (singular) to match frontend
  socket.on("newConversation", async (data) => {
    console.log("newConversations event:", data);

    try {
      if (data.type == "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: data.participants, $size: 2 },
        })
          .populate({
            path: "participants",
            select: "name  avatar email",
          })
          .lean();

        if (existingConversation) {
          socket.emit("newConversation", {
            success: true,
            data: { ...existingConversation, isNew: false },
          });
          return;
        }
      }
      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || " ",
        avatar: socket.data.userId,
      });

      const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => data.participants.includes(s.data.userId)
      );

      connectedSockets.forEach((participantSocket) => {
        participantSocket.join(conversation._id.toString());
      });

      const populatedConversation = await Conversation.findById(
        conversation._id
      )
        .populate({
          path: "participants",
          select: "name  avatar email",
        })
        .lean();

      if (!populatedConversation) {
        throw new Error("Failed to create new conversation");
      }

      // Emit to the room for all participants
      io.to(conversation._id.toString()).emit("newConversation", {
        success: true,
        data: { ...populatedConversation, isNew: true },
      });

      // Also emit back to the requesting socket
      socket.emit("newConversation", {
        success: true,
        data: { ...populatedConversation, isNew: true },
      });
    } catch (error: any) {
      console.log("Error in newConversation:", error.message);
      socket.emit("newConversation", {
        success: false,
        msg: "Failed to create new conversation",
      });
    }
  });

  // Get all conversations for the current user
  socket.on("getConversations", async () => {
    console.log("getConversations event:", socket.data.userId);

    try {
      const userId = socket.data.userId;
      if (!userId) {
        return socket.emit("getConversations", {
          success: false,
          msg: "Unauthorized",
        });
      }

      const conversations = await Conversation.find({
        participants: { $in: [new Types.ObjectId(userId)] },
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select: "content senderId attachement createdAt",
        })
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .lean();

      socket.emit("getConversations", {
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      console.log("Error in getConversations:", error.message);
      socket.emit("getConversations", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });

  socket.on("newMessage", async (data) => {
    try {
      // Validate required fields
      if (!data.conversationId || !data.sender?.id) {
        return socket.emit("newMessage", {
          success: false,
          msg: "Missing required fields: conversationId and sender are required",
        });
      }

      const message = await Message.create({
        conversationId: data.conversationId,
        senderId: data.sender.id,
        content: data.content || "",
        attachement: data.attachments || data.attachement || null,
      });

      // Emit the new message to all participants in the conversation
      io.to(data.conversationId).emit("newMessage", {
        success: true,
        data: {
          id: message._id,
          content: data.content || "",
          sender: {
            id: data.sender.id,
            name: data.sender.name,
            avatar: data.sender.avatar,
          },
          attachement: data.attachments || data.attachement || null,
          createdAt: message.createdAt || new Date().toISOString(),
          conversationId: data.conversationId,
        },
      });

      // Update conversation with last message
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });
    } catch (error: any) {
      console.log("newMessage error:", error?.message || error);

      socket.emit("newMessage", {
        success: false,
        msg: "Failed to send message",
      });
    }
  });

  socket.on("getMessages", async (data: { conversationId: string }) => {
    console.log("getMessage :", data);
    try {
      const messages = await Message.find({
        conversationId: data.conversationId,
      })
        .sort({ createdAt: -1 })
        .populate<{
          senderId: {
            _id: string;
            name: string;
            avatar: string;
          };
        }>({
          path: "senderId",
          select: "name avatar",
        })
        .lean();

      const messageWithSender = messages.map((message) => ({
        ...message,
        id: message._id,
        sender: {
          id: message.senderId._id,
          name: message.senderId.name,
          avatar: message.senderId.avatar,
        },
      }));

      socket.emit("getMessages", {
        success: true,
        data: messageWithSender,
      });
    } catch (error: any) {
      console.log("newMessage error:", error?.message || error);

      socket.emit("getMessages", {
        success: false,
        msg: "Failed to send message",
      });
    }
  });
}
