const messages = document.querySelectorAll(".message");
const wrapper = document.querySelector(".wrapper");
const messageInfo = document.querySelector(".message-info");
const reciever = document.querySelector("#reciever");
const sender = document.querySelector("#sender");
const messageTime = document.querySelector("#time");
const messageContent =document.querySelector(".massage-content p");
const profile = document.querySelector(".rel");


const getMessageData = async e => {
    const messageType = e.currentTarget.parentElement.id;

    const response = await fetch(`/${messageType}/` + e.currentTarget.id);
    const data = await response.json();

    reciever.textContent = "From: " + data.reciever;
    sender.textContent = "To: " + data.sender;
    messageContent.textContent = data.content;
    messageTime.textContent = "Time: " + data.messageTime;

    wrapper.classList.remove("hidden");
    document.querySelector(".call-to-action").classList.remove("hidden");
}

if (messages) {
    messages.forEach(message => {
        message.addEventListener("click", getMessageData);
    })
}


if (wrapper) {
    wrapper.addEventListener("toggle", () => {
        const currentText = document.querySelector("summary");
        if (currentText.textContent === "Show") {
            currentText.textContent = "Hide";
        } else {
            currentText.textContent = "Show"
        }
    });
}

if (profile) {
    profile.addEventListener("click", () => {
        document.querySelector(".cont").classList.toggle("hidden");
    });
}
