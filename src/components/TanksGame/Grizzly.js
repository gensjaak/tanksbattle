import io from 'socket.io/socket.io'

export default class Grizzly {
  constructor (ip) {
    this.EVENTS = ['connect', 'connect_error', 'connect_timeout', 'getRooms', 'gameResponse']
    this.callbacks = []
    this._ = io('http://' + ip, {
      reconnection: false
    })
    this._listen()
  }

  _listen () {
    this.EVENTS.forEach((event) => {
      this._.on(event, (response) => {
        this.callbacks.filter((callback, index) => {
          if (callback.key === event) {
            return callback
          }
        })[0].callback(response)
      })
    })
  }

  on (event, callback) {
    if (this.EVENTS.indexOf(event) > -1) {
      this.callbacks.push({
        key: event,
        callback: callback
      })
    }
  }

  send (event, args, callback) {
    this._.emit(event, args)
    this.on(event.toString() + 'Response', callback)
  }
}
