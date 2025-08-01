import { NextApiRequest, NextApiResponse } from 'next';

// 動的インポート（サーバーサイドでのみ利用可能）
let mcpParserService: any = null;

// サーバーサイドでのみパーサーサービスを初期化
const getMCPParserService = async () => {
  if (!mcpParserService && typeof window === 'undefined') {
    try {
      const { default: service } = await import('../../../server/mcpParserService');
      mcpParserService = service;
    } catch (error) {
      console.error('Failed to load MCP parser service:', error);
    }
  }
  return mcpParserService;
};

// フォールバック用のOfficial Integrationsデータ
const getOfficialIntegrations = () => {
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
    }
  ];
};

// 公式サーバーデータ
const getOfficialServers = () => {
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
    }
  ];
};

// コミュニティサーバーデータ
const getCommunityServers = () => {
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
    }
  ];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 動的パーサーサービスを取得
    const parserService = await getMCPParserService();

    if (parserService) {
      // 動的パーサーから最新データを取得
      const {
        officialServers,
        officialIntegrations,
        communityServers,
        categories,
        subcategories
      } = await parserService.getAllServers();

      // 全サーバーを結合
      const allServers = [...officialServers, ...officialIntegrations, ...communityServers];

      // 統計情報
      const stats = {
        total: allServers.length,
        official: officialServers.length,
        officialIntegrations: officialIntegrations.length,
        community: communityServers.length,
        custom: 0
      };

      res.status(200).json({
        success: true,
        servers: allServers,
        categories,
        subcategories,
        stats
      });
    } else {
      // フォールバック: 静的データを使用
      const officialServers = getOfficialServers();
      const officialIntegrations = getOfficialIntegrations();
      const communityServers = getCommunityServers();

      // 全サーバーを結合
      const allServers = [...officialServers, ...officialIntegrations, ...communityServers];

      // カテゴリ一覧
      const categories = ['all', 'official', 'official-integration', 'community', 'custom'];

      res.status(200).json({
        success: true,
        servers: allServers,
        categories,
        stats: {
          total: allServers.length,
          official: officialServers.length,
          officialIntegrations: officialIntegrations.length,
          community: communityServers.length,
          custom: 0
        }
      });
    }
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
