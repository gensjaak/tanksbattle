class GStorage {
  constructor () {
    if (window.localStorage) {
      this._Storage = window.localStorage
    }
  }

  set (key, val) {
    if (this._Storage.setItem) {
      this._Storage.setItem(key.trim(), val.trim())
    }
  }

  get (key) {
    if (this._Storage.getItem) {
      return this._Storage.getItem(key.trim())
    }
  }

  delete (key) {
    if (this._Storage.removeItem) {
      this._Storage.removeItem(key.trim())
    }
  }

  clear () {
    if (this._Storage.clear) {
      this._Storage.clear()
    }
  }
}

export default new GStorage()
