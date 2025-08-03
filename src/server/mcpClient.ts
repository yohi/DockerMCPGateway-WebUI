import { spawn, ChildProcess } from 'child_process';
import { Socket } from 'net';
import { MCPTool, MCPResource, MCPPrompt, MCPCapabilities } from '../types/models';

/**
 * MCPプロトコルメッセージの型定義
 */
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

/**
 * MCPサーバーとの通信を管理するクライアント
 */
export class MCPClient {
  private process: ChildProcess | null = null;
  private socket: Socket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private connected = false;
  private serverId: string;
  private serverConfig: any;

  constructor(serverId: string, serverConfig: any) {
    this.serverId = serverId;
    this.serverConfig = serverConfig;
  }

  /**
   * MCPサーバーに接続
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // TCP接続かstdio接続かを判定
        console.log(`Connecting to server ${this.serverId}, config:`, JSON.stringify(this.serverConfig));

        if (this.serverConfig.transport === 'tcp') {
          console.log(`Using TCP connection for ${this.serverId}`);
          this.connectTCP(resolve, reject);
        } else {
          console.log(`Using process connection for ${this.serverId}`);
          this.connectProcess(resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * バッファからJSONメッセージを処理
   */
  private processBuffer(buffer: string): void {
    const lines = buffer.split('\n');

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse MCP message:', line, error);
        }
      }
    }
  }

  /**
   * MCPメッセージを処理
   */
  private handleMessage(message: MCPResponse | MCPNotification): void {
    console.log(`Handling message from ${this.serverId}:`, JSON.stringify(message));

    if ('id' in message) {
      // レスポンスメッセージ
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          console.error(`MCP Error from ${this.serverId}:`, message.error);
          pending.reject(new Error(`MCP Error: ${message.error.message}`));
        } else {
          console.log(`MCP Success from ${this.serverId}:`, message.result);
          pending.resolve(message.result);
        }
      } else {
        console.warn(`No pending request found for id ${message.id} from ${this.serverId}`);
      }
    } else {
      // 通知メッセージ
      console.log(`MCP Notification from ${this.serverId}:`, message.method, message.params);
    }
  }

  /**
   * MCPリクエストを送信
   */
  private async sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected || (!this.socket && !this.process?.stdin)) {
        reject(new Error('MCP server not connected'));
        return;
      }

      const id = ++this.requestId;
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      console.log(`Sending request to ${this.serverId}:`, JSON.stringify(request));

      // タイムアウトを設定
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 10000); // 10秒タイムアウト

      this.pendingRequests.set(id, { resolve, reject, timeout });

      // リクエストを送信
      const message = JSON.stringify(request) + '\n';
      if (this.socket) {
        this.socket.write(message);
      } else if (this.process?.stdin) {
        this.process.stdin.write(message);
      } else {
        reject(new Error('No connection available'));
      }
    });
  }

  /**
   * MCPサーバーを初期化
   */
  private async initialize(): Promise<void> {
    const result = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: {
          listChanged: true
        },
        sampling: {}
      },
      clientInfo: {
        name: 'DockerMCPGateway-WebUI',
        version: '1.0.0'
      }
    });

    console.log(`MCP Server ${this.serverId} initialized:`, result);

    // initialized通知を送信
    const notification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    };
    const notificationMessage = JSON.stringify(notification) + '\n';

    if (this.socket) {
      this.socket.write(notificationMessage);
    } else if (this.process?.stdin) {
      this.process.stdin.write(notificationMessage);
    }
  }

  /**
   * 利用可能なツール一覧を取得
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      const result = await this.sendRequest('tools/list');
      return result.tools || [];
    } catch (error) {
      console.error(`Failed to list tools for ${this.serverId}:`, error);
      return [];
    }
  }

  /**
   * 利用可能なリソース一覧を取得
   */
  async listResources(): Promise<MCPResource[]> {
    try {
      const result = await this.sendRequest('resources/list');
      return result.resources || [];
    } catch (error) {
      console.error(`Failed to list resources for ${this.serverId}:`, error);
      return [];
    }
  }

  /**
   * 利用可能なプロンプト一覧を取得
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    try {
      const result = await this.sendRequest('prompts/list');
      return result.prompts || [];
    } catch (error) {
      console.error(`Failed to list prompts for ${this.serverId}:`, error);
      return [];
    }
  }

  /**
   * サーバーの全機能情報を取得
   */
  async getCapabilities(): Promise<MCPCapabilities> {
    try {
      const [tools, resources, prompts] = await Promise.all([
        this.listTools(),
        this.listResources(),
        this.listPrompts()
      ]);

      return {
        tools,
        resources,
        prompts,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Failed to get capabilities for ${this.serverId}:`, error);
      throw error;
    }
  }

  /**
   * 接続を切断
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.connected = false;

    // 保留中のリクエストをすべてキャンセル
    this.pendingRequests.forEach((pending, id) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }

  /**
   * 接続状態を確認
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * TCP接続での接続
   */
  private connectTCP(resolve: (value: void) => void, reject: (error: any) => void): void {
    const host = this.serverConfig.host || 'localhost';
    const port = this.serverConfig.port || 5000;

    console.log(`Connecting to MCP server via TCP: ${host}:${port}`);

    this.socket = new Socket();

    this.socket.on('connect', () => {
      console.log(`Connected to MCP server ${this.serverId} via TCP`);
      this.connected = true;

      // MCP initialize handshake
      this.initialize()
        .then(() => {
          console.log(`MCP server ${this.serverId} initialized successfully`);
          resolve();
        })
        .catch(error => {
          console.error(`MCP server ${this.serverId} initialization failed:`, error);
          reject(error);
        });
    });

    this.socket.on('error', (error) => {
      console.error(`TCP connection error for ${this.serverId}:`, error);
      reject(error);
    });

    this.socket.on('close', () => {
      console.log(`TCP connection closed for ${this.serverId}`);
      this.connected = false;
    });

    let buffer = '';
    this.socket.on('data', (data: Buffer) => {
      const newData = data.toString();
      console.log(`Received data from ${this.serverId}:`, newData);
      buffer += newData;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          console.log(`Processing line from ${this.serverId}:`, trimmed);
          try {
            const message = JSON.parse(trimmed);
            this.handleMessage(message);
          } catch (error) {
            console.error(`Failed to parse MCP message from ${this.serverId}:`, trimmed, error);
          }
        }
      }
    });

    this.socket.connect(port, host);
  }

  /**
   * プロセス起動での接続
   */
  private connectProcess(resolve: (value: void) => void, reject: (error: any) => void): void {
    // サーバー設定に基づいてプロセスを起動
    const command = this.serverConfig.command || 'node';
    const args = this.serverConfig.args || [];

    console.log(`Starting MCP server: ${command} ${args.join(' ')}`);

    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...this.serverConfig.env }
    });

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error('Failed to create process pipes');
    }

    // 出力を監視してメッセージを処理
    let buffer = '';
    this.process.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      console.log(`Received data from ${this.serverId}:`, chunk);
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          console.log(`Processing line from ${this.serverId}:`, trimmed);
          try {
            const message = JSON.parse(trimmed);
            this.handleMessage(message);
          } catch (error) {
            console.error(`Failed to parse MCP message from ${this.serverId}:`, trimmed, error);
          }
        }
      }
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error(`MCP Server ${this.serverId} stderr:`, data.toString());
    });

    this.process.on('error', (error) => {
      console.error(`Failed to start MCP server ${this.serverId}:`, error);
      this.connected = false;
      reject(error);
    });

    this.process.on('exit', (code, signal) => {
      console.log(`MCP server ${this.serverId} exited with code ${code}, signal ${signal}`);
      this.connected = false;
    });

    // プロセスがstdioの準備をする時間を待つ
    setTimeout(() => {
      console.log(`MCP server ${this.serverId} marked as connected, starting initialization`);

      // stdio準備後にconnectedをtrueに設定（sendRequestで使用可能にする）
      this.connected = true;

      // MCP initialize handshake
      this.initialize()
        .then(() => {
          console.log(`MCP server ${this.serverId} initialized successfully`);
          resolve();
        })
        .catch((error) => {
          console.error(`MCP server ${this.serverId} initialization failed:`, error);
          this.connected = false;
          reject(error);
        });
    }, 1000); // 1秒待機
  }
}
