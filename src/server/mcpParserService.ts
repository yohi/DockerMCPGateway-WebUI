import fetch from 'node-fetch';

/**
 * GitHub READMEからMCPサーバー情報を動的に取得するサービス
 */
export class MCPParserService {
  private readonly GITHUB_RAW_URL = 'https://raw.githubusercontent.com/modelcontextprotocol/servers/refs/heads/main/README.md';
  private cachedData: any = null;
  private lastFetched: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分間キャッシュ

  /**
   * GitHubからREADMEを取得
   */
  private async fetchReadme(): Promise<string> {
    try {
      const response = await fetch(this.GITHUB_RAW_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch README: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching README:', error);
      throw error;
    }
  }

  /**
   * READMEテキストからOfficial Integrationsを抽出
   */
  private parseOfficialIntegrations(readmeContent: string): any[] {
    const integrations: any[] = [];

    // Official Integrations セクションを探す
    const officialIntegrationsMatch = readmeContent.match(/### 🎖️ Official Integrations([\s\S]*?)(?=###|##|$)/);

    if (!officialIntegrationsMatch) {
      console.warn('Official Integrations section not found');
      return integrations;
    }

    const section = officialIntegrationsMatch[1];

    // 各統合のパターンをマッチ
    const integrationPattern = /- .*?\*\*\[(.*?)\]\((.*?)\)\*\* - (.*?)(?=\n- |\n\n|$)/g;
    let match;

    while ((match = integrationPattern.exec(section)) !== null) {
      const [, name, githubUrl, description] = match;

      // 名前をクリーンアップ
      const cleanName = name.trim();

      // IDを生成（小文字、スペースをハイフンに）
      const id = `server-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;

      // タグを説明から推測
      const tags = this.extractTagsFromDescription(description);

      // カテゴリを名前から推測
      const subcategory = this.determineSubcategory(cleanName, description);

      integrations.push({
        id,
        name: cleanName,
        category: 'official-integration',
        subcategory,
        description: description.trim().replace(/\n/g, ' ').replace(/\s+/g, ' '),
        version: 'latest',
        image: this.generateImageName(cleanName, githubUrl),
        author: this.extractAuthor(cleanName, githubUrl),
        downloads: this.estimateDownloads(cleanName),
        tags,
        documentation: githubUrl,
        configSchema: this.generateConfigSchema(cleanName)
      });
    }

    return integrations;
  }

  /**
   * 説明文からタグを抽出
   */
  private extractTagsFromDescription(description: string): string[] {
    const tags: string[] = [];
    const tagKeywords = {
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'claude'],
      'cloud': ['cloud', 'aws', 'azure', 'gcp', 'google cloud'],
      'database': ['database', 'db', 'sql', 'nosql', 'mysql', 'postgresql', 'mongodb'],
      'integration': ['integration', 'api', 'connect', 'saas'],
      'analytics': ['analytics', 'data', 'analysis', 'visualization'],
      'payments': ['payment', 'billing', 'invoice', 'financial'],
      'productivity': ['productivity', 'collaboration', 'workflow'],
      'security': ['security', 'auth', 'authentication'],
      'monitoring': ['monitoring', 'logging', 'observability'],
      'communication': ['chat', 'messaging', 'notification', 'email']
    };

    const lowerDesc = description.toLowerCase();

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        tags.push(tag);
      }
    }

    return tags.length > 0 ? tags : ['integration'];
  }

  /**
   * サブカテゴリを決定
   */
  private determineSubcategory(name: string, description: string): string {
    const lowerName = name.toLowerCase();
    const lowerDesc = description.toLowerCase();

    // AI/ML関連
    if (['openai', 'claude', 'anthropic', 'ai', 'gpt'].some(keyword => lowerName.includes(keyword) || lowerDesc.includes(keyword))) {
      return 'ai-ml';
    }

    // クラウドサービス
    if (['aws', 'azure', 'google', 'alibaba', 'cloud'].some(keyword => lowerName.includes(keyword))) {
      return 'cloud-services';
    }

    // データベース
    if (['database', 'mysql', 'postgresql', 'mongo', 'redis', 'elastic'].some(keyword => lowerName.includes(keyword) || lowerDesc.includes(keyword))) {
      return 'databases';
    }

    // 決済・金融
    if (['stripe', 'payment', 'financial', 'billing', 'invoice'].some(keyword => lowerName.includes(keyword) || lowerDesc.includes(keyword))) {
      return 'payments';
    }

    // コミュニケーション
    if (['slack', 'discord', 'teams', 'chat', 'messaging'].some(keyword => lowerName.includes(keyword) || lowerDesc.includes(keyword))) {
      return 'communication';
    }

    // 開発ツール
    if (['github', 'gitlab', 'git', 'ci', 'cd', 'deploy'].some(keyword => lowerName.includes(keyword) || lowerDesc.includes(keyword))) {
      return 'development';
    }

    // 生産性ツール
    if (['notion', 'productivity', 'workflow', 'automation'].some(keyword => lowerName.includes(keyword) || lowerDesc.includes(keyword))) {
      return 'productivity';
    }

    return 'general';
  }

  /**
   * 画像名を生成
   */
  private generateImageName(name: string, githubUrl: string): string {
    // GitHubのURLからリポジトリ名を抽出
    const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\)]+)/);
    if (repoMatch) {
      const [, org, repo] = repoMatch;
      return `${org}/${repo}`;
    }

    // デフォルトの画像名
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  /**
   * 作者を抽出
   */
  private extractAuthor(name: string, githubUrl: string): string {
    // GitHubのURLから組織名を抽出
    const orgMatch = githubUrl.match(/github\.com\/([^\/]+)/);
    if (orgMatch) {
      return orgMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // 名前から推測
    if (name.includes('by ')) {
      return name.split('by ')[1];
    }

    return 'Community';
  }

  /**
   * ダウンロード数を推定
   */
  private estimateDownloads(name: string): number {
    // 人気度に基づく推定値
    const popularServices = {
      'openai': 15000,
      'claude': 12000,
      'stripe': 10000,
      'notion': 8000,
      'discord': 7000,
      'slack': 6000,
      'github': 5000,
      'aws': 4000
    };

    const lowerName = name.toLowerCase();
    for (const [service, downloads] of Object.entries(popularServices)) {
      if (lowerName.includes(service)) {
        return downloads;
      }
    }

    // デフォルト値
    return Math.floor(Math.random() * 3000) + 500;
  }

  /**
   * 設定スキーマを生成
   */
  private generateConfigSchema(name: string): any {
    return {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          default: this.generateImageName(name, '')
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
          default: ['-y', `mcp-server-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`]
        }
      }
    };
  }

  /**
   * Reference Serversを抽出
   */
  private parseReferenceServers(readmeContent: string): any[] {
    const servers: any[] = [];

    const referenceMatch = readmeContent.match(/## 🌟 Reference Servers([\s\S]*?)(?=###|##|$)/);

    if (!referenceMatch) {
      return servers;
    }

    const section = referenceMatch[1];
    const serverPattern = /- \*\*\[(.*?)\]\(.*?\)\*\* - (.*?)(?=\n- |\n\n|$)/g;
    let match;

    while ((match = serverPattern.exec(section)) !== null) {
      const [, name, description] = match;

      const id = `server-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      servers.push({
        id,
        name: `${name} MCP Server`,
        category: 'official',
        description: description.trim().replace(/\n/g, ' ').replace(/\s+/g, ' '),
        version: '2025.7.1',
        image: `@modelcontextprotocol/server-${name.toLowerCase()}`,
        author: 'Model Context Protocol',
        downloads: Math.floor(Math.random() * 3000) + 2000,
        tags: this.extractTagsFromDescription(description),
        documentation: `https://www.npmjs.com/package/@modelcontextprotocol/server-${name.toLowerCase()}`,
        configSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              default: `@modelcontextprotocol/server-${name.toLowerCase()}`
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
              default: ['-y', `@modelcontextprotocol/server-${name.toLowerCase()}`]
            }
          }
        }
      });
    }

    return servers;
  }

  /**
   * すべてのMCPサーバー情報を取得
   */
  public async getAllServers(): Promise<{
    officialServers: any[];
    officialIntegrations: any[];
    communityServers: any[];
    categories: string[];
    subcategories: { [key: string]: string[] };
  }> {
    // キャッシュをチェック
    const now = Date.now();
    if (this.cachedData && (now - this.lastFetched) < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      console.log('Fetching latest MCP servers from GitHub...');
      const readmeContent = await this.fetchReadme();

      const officialServers = this.parseReferenceServers(readmeContent);
      const officialIntegrations = this.parseOfficialIntegrations(readmeContent);

      // 基本的なコミュニティサーバー（既存のものを維持）
      const communityServers = [
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

      // サブカテゴリを集計
      const subcategoriesMap: { [key: string]: string[] } = {};
      officialIntegrations.forEach(integration => {
        const subcat = integration.subcategory || 'general';
        if (!subcategoriesMap[subcat]) {
          subcategoriesMap[subcat] = [];
        }
        if (!subcategoriesMap[subcat].includes(integration.name)) {
          subcategoriesMap[subcat].push(integration.name);
        }
      });

      const result = {
        officialServers,
        officialIntegrations,
        communityServers,
        categories: ['all', 'official', 'official-integration', 'community', 'custom'],
        subcategories: subcategoriesMap
      };

      // キャッシュを更新
      this.cachedData = result;
      this.lastFetched = now;

      console.log(`Loaded ${officialServers.length} official servers and ${officialIntegrations.length} official integrations`);

      return result;
    } catch (error) {
      console.error('Error parsing MCP servers:', error);

      // エラー時はフォールバック（既存の12個）
      return this.getFallbackData();
    }
  }

  /**
   * フォールバックデータ（ネットワークエラー時など）
   */
  private getFallbackData() {
    return {
      officialServers: [
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
          documentation: 'https://www.npmjs.com/package/@modelcontextprotocol/server-everything'
        }
      ],
      officialIntegrations: [
        {
          id: 'server-openai',
          name: 'OpenAI',
          category: 'official-integration',
          subcategory: 'ai-ml',
          description: 'Direct access to OpenAI models and APIs through MCP',
          version: 'latest',
          image: 'openai/openai-mcp',
          author: 'OpenAI',
          downloads: 9800,
          tags: ['openai', 'gpt', 'ai', 'llm'],
          documentation: 'https://github.com/openai/openai-mcp'
        }
      ],
      communityServers: [],
      categories: ['all', 'official', 'official-integration', 'community', 'custom'],
      subcategories: {
        'ai-ml': ['OpenAI'],
        'general': []
      }
    };
  }

  /**
   * キャッシュをクリア
   */
  public clearCache(): void {
    this.cachedData = null;
    this.lastFetched = 0;
  }
}

export default new MCPParserService();
