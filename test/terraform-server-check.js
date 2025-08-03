const { test, expect } = require('@playwright/test');

test('Check Terraform server in MCP server list', async ({ page }) => {
  await page.goto('http://localhost:5310');
  
  // サーバーリストAPIにアクセス
  const response = await page.goto('http://localhost:5311/api/servers');
  const servers = await response.json();
  
  // Terraformサーバーの存在を確認
  const terraformServer = servers.servers.find(server => server.id === 'terraform');
  
  console.log('Terraformサーバー情報:', terraformServer);
  
  // Terraformサーバーが存在することを確認
  expect(terraformServer).toBeDefined();
  
  // Terraformサーバーの詳細を検証
  expect(terraformServer.config.command).toBe('docker');
  expect(terraformServer.config.args).toEqual([
    'run',
    '-i',
    '--rm',
    'hashicorp/terraform-mcp-server'
  ]);
});
