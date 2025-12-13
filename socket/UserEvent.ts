import { Server as SocketIoServers } from "socket.io";
import User from "../modals/User.js";
import { generateToken } from "../utils/token.js";

export function registerUserEvents(io: SocketIoServers, socket: any) {
  // Example event: Join a chat room
  socket.on("TestSocket", (roomId: string) => {
    socket.emit("TestSocketResponse", { msg: "Socket is working fine!" });
  });
  socket.on(
    "UpdateProfile",
    async (data: { name?: string; avatar?: string }) => {
      console.log("updateprofile event:", data);

      const userId = socket.data.userId;

      if (!userId) {
        return socket.emit("UpdateProfileResponse", {
          success: false,
          msg: "User not found",
        });
      }
      try {
        const updateUser = await User.findByIdAndUpdate(
          userId,
          { name: data.name, avatar: data.avatar },
          { new: true }
        );

        if (!updateUser) {
          return socket.emit("updateProfile", {
            success: false,
            msg: "User not found",
          });
        }

        const newToken = generateToken(updateUser);
        socket.emit("updateProfile", {
          success: true,
          data: { token: newToken },
          msg: "Profile is updated successfully",
        });
      } catch (error) {
        console.log("Error updating Profile", error);
        socket.emit("updateProfile", {
          success: false,
          msg: "User not found",
        });
      }
    }
  );
}
