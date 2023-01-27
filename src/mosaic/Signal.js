export function isSignal(x) {
  return x instanceof Signal;
}

export class Signal {
  constructor(value) {
    this._value = value;
    this._listeners = new Map;
  }

  get value() {
    return this._value;
  }

  update(value, { force } = {}) {
    const changed = this._value !== value;
    if (changed) this._value = value;
    if (changed || force) this.emit('value', this.value);
    return this;
  }

  addEventListener(type, callback) {
    let list = this._listeners.get(type) || [];
    if (list.indexOf(callback) < 0) {
      list = list.concat(callback);
    }
    this._listeners.set(type, list);
  }

  removeEventListener(type, callback) {
    const list = this._listeners.get(type);
    if (list?.length) {
      this._listeners.set(type, list.filter(x => x !== callback));
    }
  }

  emit(type, event) {
    this._listeners.get(type)?.forEach(l => l(event));
  }
}
