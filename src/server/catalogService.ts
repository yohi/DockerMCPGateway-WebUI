import { Request, Response } from 'express';
import fetch from 'node-fetch';
import serverService from './serverService';
import { MCPServer, CatalogServer } from '../types/models';
import mcpParserService from './mcpParserService';

/**
 * MCPカタログサービス
 * MCPサーバーの情報を提供するAPIサービス
 */
export class CatalogService {
  // 公式GitHubリポジトリURL
  private readonly GITHUB_REPO_URL = 'https://github.com/modelcontextprotocol/servers';

  // カスタムサーバーの永続化（実際の実装ではデータベースを使用）
  private customServers: CatalogServer[] = [];

  /**
   * 利用可能なMCPサーバーのカタログを取得
   * @param req リクエスト
   * @param res レスポンス
   */
  public async getCatalog(req: Request, res: Response): Promise<void> {
    try {
      // 動的パーサーから最新のサーバー情報を取得
      const {
        officialServers,
        officialIntegrations,
        communityServers,
        categories,
        subcategories
      } = await mcpParserService.getAllServers();

      // 全サーバーを結合（カスタムサーバーも含める）
      const allServers = [...officialServers, ...officialIntegrations, ...communityServers, ...this.customServers];

      // 統計情報を追加
      const stats = {
        total: allServers.length,
        official: officialServers.length,
        officialIntegrations: officialIntegrations.length,
        community: communityServers.length,
        custom: this.customServers.length
      };

      res.json({
        success: true,
        servers: allServers,
        categories,
        subcategories,
        stats
      });
    } catch (error) {
      console.error('Error fetching catalog:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CATALOG_ERROR',
          message: 'カタログの取得中にエラーが発生しました',
        }
      });
    }
  }

  /**
   * カスタムサーバーを追加
   * @param req リクエスト
   * @param res レスポンス
   */
  public async addCustomServer(req: Request, res: Response): Promise<void> {
    try {
      const serverData: CatalogServer = req.body;

      if (!serverData.id || !serverData.name || !serverData.image) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SERVER_DATA',
            message: '必須項目（ID、名前、イメージ）が不足しています'
          }
        });
        return;
      }

      // mcp-remoteサーバーの場合の追加検証
      if (serverData.command === 'npx' && serverData.args?.includes('mcp-remote')) {
        if (!serverData.remoteUrl) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REMOTE_URL',
              message: 'mcp-remoteサーバーにはremoteUrlが必要です'
            }
          });
          return;
        }

        // argsにremoteUrlを追加
        serverData.args = [...(serverData.args || []), serverData.remoteUrl];
      }

      const allServers = [
        ...(await this.getOfficialServers()),
        ...(await this.getOfficialIntegrations()),
        ...(await this.getCommunityServers()),
        ...this.customServers
      ];

      if (allServers.some(server => server.id === serverData.id)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_SERVER_ID',
            message: 'このサーバーIDは既に存在します'
          }
        });
        return;
      }

      const customServer: CatalogServer = {
        ...serverData,
        category: 'custom',
        tags: serverData.tags || []
      };

      this.customServers.push(customServer);

      console.log(`カスタムサーバー ${serverData.id} を追加しました`);

      res.json({
        success: true,
        message: 'カスタムサーバーが正常に追加されました',
        server: customServer
      });
    } catch (error) {
      console.error('Error adding custom server:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ADD_CUSTOM_SERVER_ERROR',
          message: 'カスタムサーバーの追加中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * カスタムサーバーを削除
   * @param req リクエスト
   * @param res レスポンス
   */
  public async removeCustomServer(req: Request, res: Response): Promise<void> {
    try {
      const { serverId } = req.params;

      const index = this.customServers.findIndex(server => server.id === serverId);
      if (index === -1) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: '指定されたカスタムサーバーが見つかりません'
          }
        });
        return;
      }

      const removedServer = this.customServers.splice(index, 1)[0];

      console.log(`カスタムサーバー ${serverId} を削除しました`);

      res.json({
        success: true,
        message: 'カスタムサーバーが正常に削除されました',
        server: removedServer
      });
    } catch (error) {
      console.error('Error removing custom server:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REMOVE_CUSTOM_SERVER_ERROR',
          message: 'カスタムサーバーの削除中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * 公式MCPサーバー一覧を取得（Reference Servers）
   */
  private async getOfficialServers() {
    return [
      {
        id: 'server-everything',
        name: 'Everything MCP Server',
        category: 'official',
        description: 'MCPプロトコルのすべての機能をテストするためのサーバー。プロンプト、ツール、リソースなど様々な機能を実装。',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-everything',
        author: 'Model Context Protocol',
        downloads: 5514,
        tags: ['testing', 'demo', 'comprehensive'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-everything',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-everything'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-everything']
            }
          }
        }
      },
      {
        id: 'server-fetch',
        name: 'Fetch MCP Server',
        category: 'official',
        description: 'Web content fetching and conversion for efficient LLM usage',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-fetch',
        author: 'Model Context Protocol',
        downloads: 3200,
        tags: ['web', 'fetch', 'content'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-fetch',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-fetch'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-fetch']
            }
          }
        }
      },
      {
        id: 'server-filesystem',
        name: 'FileSystem MCP Server',
        category: 'official',
        description: 'Secure file operations with configurable access controls',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-filesystem',
        author: 'Model Context Protocol',
        downloads: 3800,
        tags: ['filesystem', 'files', 'security'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-filesystem'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files']
            }
          }
        }
      },
      {
        id: 'server-git',
        name: 'Git MCP Server',
        category: 'official',
        description: 'Tools to read, search, and manipulate Git repositories',
        version: '2025.7.1',
        image: 'mcp-server-git',
        author: 'Model Context Protocol',
        downloads: 3500,
        tags: ['git', 'version-control', 'repository'],
        documentation: 'https://github.com/modelcontextprotocol/servers',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'mcp-server-git'
            },
            command: {
              type: 'string',
              default: 'uvx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['mcp-server-git', '--repository', 'path/to/git/repo']
            }
          }
        }
      },
      {
        id: 'server-memory',
        name: 'Memory MCP Server',
        category: 'official',
        description: 'Knowledge graph-based persistent memory system',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-memory',
        author: 'Model Context Protocol',
        downloads: 4200,
        tags: ['memory', 'persistence', 'knowledge-graph'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-memory',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-memory'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-memory']
            }
          }
        }
      },
      {
        id: 'server-sequential-thinking',
        name: 'Sequential Thinking MCP Server',
        category: 'official',
        description: 'Dynamic and reflective problem-solving through thought sequences',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-sequentialthinking',
        author: 'Model Context Protocol',
        downloads: 2800,
        tags: ['thinking', 'problem-solving', 'reflection'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-sequentialthinking',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-sequentialthinking'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-sequentialthinking']
            }
          }
        }
      },
      {
        id: 'server-time',
        name: 'Time MCP Server',
        category: 'official',
        description: 'Time and timezone conversion capabilities',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-time',
        author: 'Model Context Protocol',
        downloads: 2100,
        tags: ['time', 'timezone', 'conversion'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-time',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-time'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-time']
            }
          }
        }
      }
    ];
  }

  /**
   * 公式インテグレーションサーバー一覧を取得（Third-Party Official Integrations）
   */
  private async getOfficialIntegrations() {
    return [
      {
        id: 'server-21st-dev-magic',
        name: '21st.dev Magic',
        category: 'official-integration',
        description: 'Create crafted UI components inspired by the best 21st.dev design engineers',
        version: 'latest',
        image: '21st-dev/magic-mcp',
        author: '21st.dev',
        downloads: 1500,
        tags: ['ui', 'design', 'components'],
        documentation: 'https://github.com/21st-dev/magic-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '21st-dev/magic-mcp'
            }
          }
        }
      },
      {
        id: 'server-paragon-actionkit',
        name: 'ActionKit by Paragon',
        category: 'official-integration',
        description: 'Connect to 130+ SaaS integrations (e.g. Slack, Salesforce, Gmail) with Paragon\'s ActionKit API',
        version: 'latest',
        image: 'useparagon/paragon-mcp',
        author: 'Paragon',
        downloads: 2200,
        tags: ['saas', 'integrations', 'automation'],
        documentation: 'https://github.com/useparagon/paragon-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'useparagon/paragon-mcp'
            }
          }
        }
      },
      {
        id: 'server-adfin',
        name: 'Adfin',
        category: 'official-integration',
        description: 'The only platform you need to get paid - all payments in one place, invoicing and accounting reconciliations',
        version: 'latest',
        image: 'Adfin-Engineering/mcp-server-adfin',
        author: 'Adfin',
        downloads: 800,
        tags: ['payments', 'invoicing', 'accounting'],
        documentation: 'https://github.com/Adfin-Engineering/mcp-server-adfin',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'Adfin-Engineering/mcp-server-adfin'
            }
          }
        }
      },
      {
        id: 'server-agentql',
        name: 'AgentQL',
        category: 'official-integration',
        description: 'Enable AI agents to get structured data from unstructured web',
        version: 'latest',
        image: 'tinyfish-io/agentql-mcp',
        author: 'AgentQL',
        downloads: 1200,
        tags: ['web-scraping', 'structured-data', 'ai-agents'],
        documentation: 'https://github.com/tinyfish-io/agentql-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'tinyfish-io/agentql-mcp'
            }
          }
        }
      },
      {
        id: 'server-agentrpc',
        name: 'AgentRPC',
        category: 'official-integration',
        description: 'Connect to any function, any language, across network boundaries',
        version: 'latest',
        image: 'agentrpc/agentrpc',
        author: 'AgentRPC',
        downloads: 900,
        tags: ['rpc', 'functions', 'network'],
        documentation: 'https://github.com/agentrpc/agentrpc',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'agentrpc/agentrpc'
            }
          }
        }
      },
      {
        id: 'server-agentset',
        name: 'Agentset',
        category: 'official-integration',
        description: 'RAG for your knowledge base connected to Agentset',
        version: 'latest',
        image: 'agentset-ai/mcp-server',
        author: 'Agentset',
        downloads: 1100,
        tags: ['rag', 'knowledge-base', 'ai'],
        documentation: 'https://github.com/agentset-ai/mcp-server',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'agentset-ai/mcp-server'
            }
          }
        }
      },
      {
        id: 'server-aiven',
        name: 'Aiven',
        category: 'official-integration',
        description: 'Navigate your Aiven projects and interact with PostgreSQL®, Apache Kafka®, ClickHouse® and OpenSearch® services',
        version: 'latest',
        image: 'Aiven-Open/mcp-aiven',
        author: 'Aiven',
        downloads: 1800,
        tags: ['database', 'kafka', 'postgresql', 'cloud'],
        documentation: 'https://github.com/Aiven-Open/mcp-aiven',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'Aiven-Open/mcp-aiven'
            }
          }
        }
      },
      {
        id: 'server-alation',
        name: 'Alation',
        category: 'official-integration',
        description: 'Unlock the power of the enterprise Data Catalog by harnessing tools provided by the Alation MCP server',
        version: 'latest',
        image: 'Alation/alation-ai-agent-sdk',
        author: 'Alation',
        downloads: 700,
        tags: ['data-catalog', 'enterprise', 'metadata'],
        documentation: 'https://github.com/Alation/alation-ai-agent-sdk',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'Alation/alation-ai-agent-sdk'
            }
          }
        }
      },
      {
        id: 'server-alby-bitcoin',
        name: 'Alby Bitcoin Payments',
        category: 'official-integration',
        description: 'Connect any bitcoin lightning wallet to your agent to send and receive instant payments globally',
        version: 'latest',
        image: 'getAlby/mcp',
        author: 'Alby',
        downloads: 600,
        tags: ['bitcoin', 'lightning', 'payments', 'crypto'],
        documentation: 'https://github.com/getAlby/mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'getAlby/mcp'
            }
          }
        }
      },
      {
        id: 'server-algolia',
        name: 'Algolia',
        category: 'official-integration',
        description: 'Use AI agents to provision, configure, and query your Algolia search indices',
        version: 'latest',
        image: 'algolia/mcp',
        author: 'Algolia',
        downloads: 2500,
        tags: ['search', 'algolia', 'indices'],
        documentation: 'https://github.com/algolia/mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'algolia/mcp'
            }
          }
        }
      },
      {
        id: 'server-alibaba-adb-mysql',
        name: 'Alibaba Cloud AnalyticDB for MySQL',
        category: 'official-integration',
        description: 'Connect to AnalyticDB for MySQL cluster for getting database or table metadata, querying and analyzing data',
        version: 'latest',
        image: 'aliyun/alibabacloud-adb-mysql-mcp-server',
        author: 'Alibaba Cloud',
        downloads: 600,
        tags: ['database', 'mysql', 'analyticdb', 'cloud'],
        documentation: 'https://github.com/aliyun/alibabacloud-adb-mysql-mcp-server',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'aliyun/alibabacloud-adb-mysql-mcp-server'
            }
          }
        }
      },
      {
        id: 'server-alibaba-adb-postgresql',
        name: 'Alibaba Cloud AnalyticDB for PostgreSQL',
        category: 'official-integration',
        description: 'Connect to AnalyticDB for PostgreSQL instances, query and analyze data',
        version: 'latest',
        image: 'aliyun/alibabacloud-adbpg-mcp-server',
        author: 'Alibaba Cloud',
        downloads: 500,
        tags: ['database', 'postgresql', 'analyticdb', 'cloud'],
        documentation: 'https://github.com/aliyun/alibabacloud-adbpg-mcp-server',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'aliyun/alibabacloud-adbpg-mcp-server'
            }
          }
        }
      },
      {
        id: 'server-alibaba-dataworks',
        name: 'Alibaba Cloud DataWorks',
        category: 'official-integration',
        description: 'Manage data development, orchestration, and analytics workflows with DataWorks',
        version: 'latest',
        image: 'aliyun/alibabacloud-dataworks-mcp-server',
        author: 'Alibaba Cloud',
        downloads: 400,
        tags: ['dataworks', 'workflow', 'analytics', 'cloud'],
        documentation: 'https://github.com/aliyun/alibabacloud-dataworks-mcp-server',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'aliyun/alibabacloud-dataworks-mcp-server'
            }
          }
        }
      },
      {
        id: 'server-anthropic-claude',
        name: 'Claude by Anthropic',
        category: 'official-integration',
        description: 'Access Claude AI models and capabilities through MCP',
        version: 'latest',
        image: 'anthropics/anthropic-claude-mcp',
        author: 'Anthropic',
        downloads: 8500,
        tags: ['ai', 'claude', 'anthropic', 'llm'],
        documentation: 'https://github.com/anthropics/anthropic-claude-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'anthropics/anthropic-claude-mcp'
            }
          }
        }
      },
      {
        id: 'server-aws-bedrock',
        name: 'AWS Bedrock',
        category: 'official-integration',
        description: 'Connect to AWS Bedrock for foundation models and generative AI capabilities',
        version: 'latest',
        image: 'aws/aws-bedrock-mcp',
        author: 'Amazon Web Services',
        downloads: 3200,
        tags: ['aws', 'bedrock', 'ai', 'foundation-models'],
        documentation: 'https://github.com/aws/aws-bedrock-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'aws/aws-bedrock-mcp'
            }
          }
        }
      },
      {
        id: 'server-browserbase',
        name: 'Browserbase',
        category: 'official-integration',
        description: 'Browser automation and web scraping capabilities through Browserbase',
        version: 'latest',
        image: 'browserbase/mcp',
        author: 'Browserbase',
        downloads: 1900,
        tags: ['browser', 'automation', 'scraping', 'web'],
        documentation: 'https://github.com/browserbase/mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'browserbase/mcp'
            }
          }
        }
      },
      {
        id: 'server-claude-chat',
        name: 'Claude Chat',
        category: 'official-integration',
        description: 'Direct integration with Claude chat interface and capabilities',
        version: 'latest',
        image: 'anthropics/claude-chat-mcp',
        author: 'Anthropic',
        downloads: 6700,
        tags: ['claude', 'chat', 'conversation', 'ai'],
        documentation: 'https://github.com/anthropics/claude-chat-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'anthropics/claude-chat-mcp'
            }
          }
        }
      },
      {
        id: 'server-discord',
        name: 'Discord',
        category: 'official-integration',
        description: 'Discord bot integration and server management capabilities',
        version: 'latest',
        image: 'discord/discord-mcp',
        author: 'Discord',
        downloads: 4300,
        tags: ['discord', 'bot', 'messaging', 'community'],
        documentation: 'https://github.com/discord/discord-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'discord/discord-mcp'
            }
          }
        }
      },
      {
        id: 'server-duckduckgo',
        name: 'DuckDuckGo',
        category: 'official-integration',
        description: 'Privacy-focused web search capabilities through DuckDuckGo',
        version: 'latest',
        image: 'duckduckgo/duckduckgo-mcp',
        author: 'DuckDuckGo',
        downloads: 2800,
        tags: ['search', 'privacy', 'web', 'duckduckgo'],
        documentation: 'https://github.com/duckduckgo/duckduckgo-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'duckduckgo/duckduckgo-mcp'
            }
          }
        }
      },
      {
        id: 'server-firecrawl',
        name: 'Firecrawl',
        category: 'official-integration',
        description: 'Advanced web scraping and content extraction with Firecrawl',
        version: 'latest',
        image: 'firecrawl/mcp',
        author: 'Firecrawl',
        downloads: 1600,
        tags: ['scraping', 'extraction', 'web', 'content'],
        documentation: 'https://github.com/firecrawl/mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'firecrawl/mcp'
            }
          }
        }
      },
      {
        id: 'server-linear',
        name: 'Linear',
        category: 'official-integration',
        description: 'Issue tracking and project management with Linear integration',
        version: 'latest',
        image: 'linear/linear-mcp',
        author: 'Linear',
        downloads: 3100,
        tags: ['project-management', 'issues', 'linear', 'productivity'],
        documentation: 'https://github.com/linear/linear-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'linear/linear-mcp'
            }
          }
        }
      },
      {
        id: 'server-notion',
        name: 'Notion',
        category: 'official-integration',
        description: 'Notion workspace integration for notes, databases, and collaboration',
        version: 'latest',
        image: 'notion/notion-mcp',
        author: 'Notion',
        downloads: 5200,
        tags: ['notion', 'notes', 'database', 'collaboration'],
        documentation: 'https://github.com/notion/notion-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'notion/notion-mcp'
            }
          }
        }
      },
      {
        id: 'server-openai',
        name: 'OpenAI',
        category: 'official-integration',
        description: 'Direct access to OpenAI models and APIs through MCP',
        version: 'latest',
        image: 'openai/openai-mcp',
        author: 'OpenAI',
        downloads: 9800,
        tags: ['openai', 'gpt', 'ai', 'llm'],
        documentation: 'https://github.com/openai/openai-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'openai/openai-mcp'
            }
          }
        }
      },
      {
        id: 'server-stripe',
        name: 'Stripe',
        category: 'official-integration',
        description: 'Payment processing and financial operations with Stripe',
        version: 'latest',
        image: 'stripe/stripe-mcp',
        author: 'Stripe',
        downloads: 4700,
        tags: ['payments', 'stripe', 'finance', 'billing'],
        documentation: 'https://github.com/stripe/stripe-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'stripe/stripe-mcp'
            }
          }
        }
      },
      {
        id: 'server-supabase',
        name: 'Supabase',
        category: 'official-integration',
        description: 'Backend-as-a-Service integration with Supabase for database and auth',
        version: 'latest',
        image: 'supabase/supabase-mcp',
        author: 'Supabase',
        downloads: 3600,
        tags: ['database', 'auth', 'backend', 'supabase'],
        documentation: 'https://github.com/supabase/supabase-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'supabase/supabase-mcp'
            }
          }
        }
      },
      {
        id: 'server-vercel',
        name: 'Vercel',
        category: 'official-integration',
        description: 'Deployment and hosting management with Vercel platform',
        version: 'latest',
        image: 'vercel/vercel-mcp',
        author: 'Vercel',
        downloads: 2900,
        tags: ['deployment', 'hosting', 'vercel', 'frontend'],
        documentation: 'https://github.com/vercel/vercel-mcp',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: 'vercel/vercel-mcp'
            }
          }
        }
      }
    ];
  }

  /**
   * コミュニティサーバー一覧を取得
   */
  private async getCommunityServers() {
    return [
      {
        id: 'server-github',
        name: 'GitHub MCP Server',
        category: 'community',
        description: 'GitHubリポジトリとの連携機能を提供するMCPサーバー。PRやイシューの管理が可能。',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-github',
        author: 'Model Context Protocol',
        downloads: 4100,
        tags: ['github', 'version-control'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-github',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-github'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-github']
            },
            environment: {
              type: 'object',
              properties: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  type: 'string',
                  description: 'GitHub Personal Access Token'
                }
              },
              required: ['GITHUB_PERSONAL_ACCESS_TOKEN']
            }
          }
        }
      },
      {
        id: 'server-postgres',
        name: 'PostgreSQL MCP Server',
        category: 'community',
        description: 'PostgreSQLデータベースとの連携機能を提供するMCPサーバー。SQLクエリの実行が可能。',
        version: '2025.7.1',
        image: '@modelcontextprotocol/server-postgres',
        author: 'Model Context Protocol',
        downloads: 2800,
        tags: ['database', 'postgresql'],
        documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-postgres',
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: '@modelcontextprotocol/server-postgres'
            },
            command: {
              type: 'string',
              default: 'npx'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb']
            }
          }
        }
      }
    ];
  }

  /**
   * カタログキャッシュをクリア
   * @param req リクエスト
   * @param res レスポンス
   */
  public async clearCache(req: Request, res: Response): Promise<void> {
    try {
      mcpParserService.clearCache();

      res.json({
        success: true,
        message: 'カタログキャッシュをクリアしました'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CACHE_CLEAR_ERROR',
          message: 'キャッシュのクリア中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * カタログからサーバーをインストール
   * @param req リクエスト
   * @param res レスポンス
   */
  public async installServer(req: Request, res: Response): Promise<void> {
    try {
      const { serverId, config } = req.body;

      if (!serverId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'サーバーIDが指定されていません'
          }
        });
        return;
      }

      // カタログからサーバー情報を取得
      const officialServers = await this.getOfficialServers();
      const officialIntegrations = await this.getOfficialIntegrations();
      const communityServers = await this.getCommunityServers();
      const allServers = [...officialServers, ...officialIntegrations, ...communityServers, ...this.customServers];

      const serverInfo = allServers.find(server => server.id === serverId);

      if (!serverInfo) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: `サーバー ${serverId} がカタログに見つかりません`
          }
        });
        return;
      }

      // サーバーリストに追加
      const newServer: MCPServer = {
        id: serverInfo.id,
        name: serverInfo.name,
        description: serverInfo.description,
        version: serverInfo.version,
        status: 'running',
        enabled: true,
        config: config || { image: serverInfo.image },
        lastUpdated: new Date()
      };

      await serverService.addServer(newServer);

      console.log(`サーバー ${serverId} (${serverInfo.name}) をインストールしました`);

      res.json({
        success: true,
        message: `サーバー ${serverId} のインストールに成功しました`,
        serverId
      });
    } catch (error) {
      console.error('Error installing server:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INSTALL_ERROR',
          message: 'サーバーのインストール中にエラーが発生しました'
        }
      });
    }
  }
}

export default new CatalogService();
