import { io, Socket } from 'socket.io-client';

/**
 * リアルタイム通信用クライアント
 */
export class SocketClient {
  private socket: Socket | null = null;
  private url: string;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimeout: number = 1000;

  /**
   * コンストラクタ
   * @param url SocketIOサーバーURL
   */
  constructor(url: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5310') {
    this.url = url;
  }

  /**
   * 接続を初期化
   */
  connect(): void {
    if (this.socket) {
      return;
    }

    this.socket = io(this.url);

    this.socket.on('connect', () => {
      console.log('SocketIO connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`SocketIO disconnected: ${reason}`);

      if (reason === 'io server disconnect') {
        // サーバーによる切断の場合は再接続を試みる
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketIO connection error:', error);

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    });

    // リスナーの初期化
    this.listeners.forEach((handlers, event) => {
      if (this.socket) {
        handlers.forEach(handler => {
          this.socket.on(event, handler);
        });
      }
    });
  }

  /**
   * 再接続を試みる
   */
  private reconnect(): void {
    this.reconnectAttempts++;
    console.log(`SocketIO reconnecting... Attempt ${this.reconnectAttempts}`);

    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1));
  }

  /**
   * 切断する
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * イベントを送信
   * @param event イベント名
   * @param data データ
   */
  emit(event: string, data?: any): void {
    if (!this.socket) {
      this.connect();
    }

    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * イベントをサブスクライブ
   * @param event イベント名
   * @param handler ハンドラー関数
   */
  on(event: string, handler: (data: any) => void): void {
    // リスナーのリストに追加
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);

    // 既存のソケットに接続
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * イベントのサブスクライブを解除
   * @param event イベント名
   * @param handler ハンドラー関数（省略時は全てのハンドラーを削除）
   */
  off(event: string, handler?: (data: any) => void): void {
    if (handler) {
      // 特定のハンドラーを削除
      const handlers = this.listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
          this.listeners.set(event, handlers);

          if (this.socket) {
            this.socket.off(event, handler);
          }
        }
      }
    } else {
      // イベントの全てのハンドラーを削除
      this.listeners.delete(event);

      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  /**
   * サーバーステータス更新をサブスクライブ
   * @param serverId サーバーID
   * @param handler ハンドラー関数
   */
  subscribeToServerStatus(serverId: string, handler: (data: any) => void): void {
    this.emit('subscribe-server-status', serverId);
    this.on(`server-status-${serverId}`, handler);
  }

  /**
   * サーバーログをサブスクライブ
   * @param serverId サーバーID
   * @param handler ハンドラー関数
   */
  subscribeToLogs(serverId: string, handler: (data: any) => void): void {
    this.emit('subscribe-logs', serverId);
    this.on(`logs-${serverId}`, handler);
  }
}
