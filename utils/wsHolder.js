// wsHolder.js
let wss = null;
let broadcastMessage = null;

module.exports = {
  get wss() {
    return wss;
  },
  set wss(instance) {
    wss = instance;
  },
  get broadcastMessage() {
    return broadcastMessage;
  },
  set broadcastMessage(fn) {
    broadcastMessage = fn;
  },
};
