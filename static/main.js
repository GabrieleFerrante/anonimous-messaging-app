const socket = io();
const usersList = document.querySelector("#users-list");
const chatModal = document.querySelector("#chat");
const chatBody = chatModal.querySelector("#chat-body");
const chatLabel = chatModal.querySelector("#chat-label");
const chatInputForm = document.querySelector("#chat-input-form");
const chatInput = chatInputForm.querySelector("#chat-input");

let users;
let user;
let chats = {};

socket.on("return-user", (data) => {
  user = data;
  console.log(user);
});

socket.on("updated-users", (data) => {
  users = data.filter((item) => item.id != user.id);
  refreshUsersList();
});

socket.on("update-chat", (data, otherId) => {
  chats[otherId] = data;
  console.log(data);
  refreshChat();
});

chatInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (chatInput.value) {
    socket.emit("send-message", chatInput.value, chatModal.dataset.currentId);
    chatInput.value = "";
  }
});

function refreshUsersList() {
  usersList.innerHTML = "";
  for (let i = 0; i < users.length; i++) {
    let otherUser = users[i];
    let template = document.createElement("template");
    template.innerHTML = `<div class="fs-1 d-flex flex-row"><i class="bi bi-person-fill"></i><span class="mx-2"><a href="#" class="link-underline link-underline-opacity-0" data-bs-toggle="modal" data-bs-target="#chat">${otherUser.name}</a></span><span class="ms-auto me-2 d-flex flex-row-reverse"></span></div>`;
    let div = template.content.firstChild;
    let link = div.childNodes.item(1).firstChild;
    div.style.color = otherUser.color;
    link.style.color = otherUser.color;
    link.onclick = () => {
      updateChat(otherUser.id);
    };
    div.dataset.id = otherUser.id;
    if (i < users.length - 1) {
      div.classList.add("border-bottom");
    }
    usersList.append(div);
  }
}

function updateChat(id) {
  usersList.childNodes.forEach((node) => {
    if (id == node.dataset.id) {
      otherUser = users.filter((item) => item.id == id)[0];
      chatModal.dataset.userColor = otherUser.color;
      chatModal.dataset.currentId = otherUser.id;
      chatLabel.innerText = otherUser.name;
      chatLabel.style.color = chatModal.dataset.userColor;
    }
  });

  refreshChat();
}

function refreshChat() {
  chatBody.innerHTML = "";

  console.log(chats[chatModal.dataset.currentId].messages);

  let lastSender;
  for (let message of chats[chatModal.dataset.currentId].messages) {
    let sender =
      message.sender == user.id
        ? user
        : users.filter((item) => item.id == message.sender)[0];

    if (lastSender != message.sender) {
      let template = document.createElement("template");
      template.innerHTML = `<div class="container fs-5 mb-1"><div class="h4">${sender.name}</div><div>${message.text}</div></div>`;
      let messageDOM = template.content.firstChild;
      messageDOM.firstChild.style.color = sender.color;
      chatBody.append(messageDOM);
    } else {
      let div = document.createElement("div");
      div.innerText = message.text;
      chatBody.lastChild.append(div);
    }
    chatBody.scrollTo({
      left: 0,
      top: chatBody.clientHeight,
      behavior: "smooth",
    });

    lastSender = message.sender;
  }
}
