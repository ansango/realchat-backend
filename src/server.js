const express = require("express");
const app = express();
const socket = require("socket.io");
const color = require("colors");
const cors = require("cors");
const { getCurrentUser, userDisconnect, joinUser } = require("./dummyUser");
const PORT = 8000;

app.use(express());
app.use(cors());

const server = app.listen(
  PORT,
  console.log(`Server is running on the port no: ${PORT} `.green)
);

const io = socket(server);

//initializing the socket io connection
io.on("connection", (socket) => {
  //for a new user joining the room
  socket.on("joinRoom", ({ userName, roomName }) => {
    //* create user
    const user = joinUser(socket.id, userName, roomName);
    console.log(socket.id, "=id");
    socket.join(user.room);

    //display a welcome message to the user who have joined a room
    socket.emit("message", {
      userId: user.id,
      userName: user.userName,
      text: `Welcome ${user.userName}`,
    });

    //displays a joined room message to all other room users except that particular user
    socket.broadcast.to(user.room).emit("message", {
      userId: user.id,
      userName: user.userName,
      text: `${user.userName} has joined the chat`,
    });
  });

  //user sending message
  socket.on("chat", (text) => {
    //gets the room user and the message sent
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", {
      userId: user.id,
      userName: user.userName,
      text: text,
    });
  });

  //when the user exits the room
  socket.on("disconnect", () => {
    //the user is deleted from array of users and a left room message displayed
    const user = userDisconnect(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        userId: user.id,
        userName: user.userName,
        text: `${user.userName} has left the room`,
      });
    }
  });

  socket.on("forceDisconnect", () => {
    socket.disconnect();
  });
});
