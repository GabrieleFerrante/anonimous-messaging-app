const express = require("express");
const ejs = require("ejs");
const fs = require("node:fs");
const { Server } = require("socket.io");
const { createServer } = require("node:http");

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = 3000;

let possibleNames;
let users = [];
let chats = [];

app.set("view engine", "ejs");

app.use(express.static("static"));

app.get("/", (req, res) => {
  res.render("index");
});

fs.readFile("static/names.json", "utf8", (error, data) => {
  if (error) {
    console.log(error);
    return;
  }
  possibleNames = JSON.parse(data);
});

io.on("connection", (socket) => {
  let user = generateUser();
  user.id = socket.id;
  io.to(socket.id).emit("return-user", user);
  users.push(user);
  io.emit("updated-users", users);

  console.log(user.name + " connected!");

  socket.on("send-message", (message, targetId) => {
    let chat = chats.filter(
      (item) => item.users.includes(socket.id) && item.users.includes(targetId)
    )[0];
    if (!chat) {
      chat = {
        users: [socket.id, targetId],
        messages: [],
      };
      chats.push(chat);
    }
    chat.messages.push({ text: message, sender: socket.id });
    io.to(socket.id).emit("update-chat", chat, targetId);
    io.to(targetId).emit("update-chat", chat, socket.id);
  });

  socket.on("disconnect", () => {
    users = users.filter((item) => item.id != user.id);
    io.emit("updated-users", users);
    console.log(user.name + " disconnected!");
  });
});

server.listen(port, () =>
  console.log(`App listening on http://127.0.0.1:${port}`)
);

function generateUser() {
  let colorIndex = Math.floor(Math.random() * possibleNames.first.length);
  let color = possibleNames.colors[colorIndex];
  let name =
    possibleNames.first[colorIndex] +
    " " +
    possibleNames.last[Math.floor(Math.random() * possibleNames.last.length)];
  return {
    name,
    color,
  };
}
