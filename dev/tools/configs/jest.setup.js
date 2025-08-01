// グローバル設定
import '@testing-library/jest-dom';

// Socket.IO モック
jest.mock('socket.io-client', () => {
  const emit = jest.fn();
  const on = jest.fn();
  const off = jest.fn();
  const connect = jest.fn();
  const disconnect = jest.fn();

  return {
    __esModule: true,
    default: jest.fn(() => ({
      emit,
      on,
      off,
      connect,
      disconnect,
      io: {
        opts: {}
      }
    })),
    connect,
    emit,
    on,
    off,
    disconnect,
  };
});

// fetch モック
global.fetch = jest.fn();

// コンソールエラーの抑制（不要な場合はコメントアウトしてください）
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};

// LocalStorage モック
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();
