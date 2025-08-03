#!/usr/bin/env node

const net = require('net');
const { randomUUID } = require('crypto');

/**
 * シンプルなTCP-based MCPサーバー
 * デモ目的で基本的なMCPプロトコルを実装
 */
class SimpleMCPServer {
  constructor(port = 5400) {
    this.port = port;
    this.tools = [
      {
        name: 'echo',
        description: 'Echo back the input message',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to echo' }
          },
          required: ['message']
        }
      },
      {
        name: 'timestamp',
        description: 'Get current timestamp',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];

    this.resources = [
      {
        uri: 'simple://info',
        name: 'Server Info',
        description: 'Basic server information',
        mimeType: 'application/json'
      }
    ];

    this.prompts = [
      {
        name: 'greeting',
        description: 'Generate a greeting message',
        arguments: [
          { name: 'name', description: 'Name to greet', required: true }
        ]
      }
    ];
  }

  start() {
    const server = net.createServer((socket) => {
      console.log('Client connected');

      let buffer = '';

      socket.on('data', (data) => {
        buffer += data.toString();
        buffer = this.processBuffer(buffer, socket);
      });

      socket.on('end', () => {
        console.log('Client disconnected');
      });
    });

    server.listen(this.port, () => {
      console.log(`Simple MCP Server listening on port ${this.port}`);
    });
  }

  processBuffer(buffer, socket) {
    const lines = buffer.split('\n');
    // 最後の（未完了の）行以外を処理
    const completedLines = lines.slice(0, -1);
    const incompleteLastLine = lines[lines.length - 1];

    for (const line of completedLines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          const message = JSON.parse(trimmed);
          this.handleMessage(message, socket);
        } catch (error) {
          console.error('Failed to parse message:', trimmed, error);
        }
      }
    }

    // 未完了の行をバッファに戻す
    return incompleteLastLine;
  }

  handleMessage(message, socket) {
    console.log('Received message:', message);

    if (message.method === 'initialize') {
      this.sendResponse(socket, message.id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          resources: { listChanged: true },
          prompts: { listChanged: true }
        },
        serverInfo: {
          name: 'Simple MCP Server',
          version: '1.0.0'
        }
      });
    } else if (message.method === 'tools/list') {
      this.sendResponse(socket, message.id, { tools: this.tools });
    } else if (message.method === 'resources/list') {
      this.sendResponse(socket, message.id, { resources: this.resources });
    } else if (message.method === 'prompts/list') {
      this.sendResponse(socket, message.id, { prompts: this.prompts });
    } else if (message.method === 'tools/call') {
      this.handleToolCall(message, socket);
    } else if (message.method === 'notifications/initialized') {
      console.log('Client initialized');
    } else {
      this.sendError(socket, message.id, -32601, 'Method not found');
    }
  }

  handleToolCall(message, socket) {
    const toolName = message.params?.name;
    const args = message.params?.arguments || {};

    if (toolName === 'echo') {
      this.sendResponse(socket, message.id, {
        content: [
          {
            type: 'text',
            text: `Echo: ${args.message || 'No message provided'}`
          }
        ]
      });
    } else if (toolName === 'timestamp') {
      this.sendResponse(socket, message.id, {
        content: [
          {
            type: 'text',
            text: `Current timestamp: ${new Date().toISOString()}`
          }
        ]
      });
    } else {
      this.sendError(socket, message.id, -32602, 'Tool not found');
    }
  }

  sendResponse(socket, id, result) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      result: result
    };
    socket.write(JSON.stringify(response) + '\n');
  }

  sendError(socket, id, code, message) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      error: {
        code: code,
        message: message
      }
    };
    socket.write(JSON.stringify(response) + '\n');
  }
}

// サーバーを起動
const port = process.env.PORT || 5400;
const server = new SimpleMCPServer(port);
server.start();
