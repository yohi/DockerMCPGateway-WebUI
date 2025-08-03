import express, { Request, Response, Router } from 'express';
import catalogService from './catalogService';
import serverService from './serverService';
import { ConfigManager } from '../utils/configManager';

const router: Router = express.Router();
const configManager = new ConfigManager();

// カタログAPI
router.get('/catalog', async (req: Request, res: Response) => {
  await catalogService.getCatalog(req, res);
});

router.post('/catalog/install', async (req: Request, res: Response) => {
  await catalogService.installServer(req, res);
});

router.post('/catalog/clear-cache', async (req: Request, res: Response) => {
  await catalogService.clearCache(req, res);
});

// カスタムサーバー管理API
router.post('/catalog/custom', async (req: Request, res: Response) => {
  await catalogService.addCustomServer(req, res);
});

router.delete('/catalog/custom/:serverId', async (req: Request, res: Response) => {
  await catalogService.removeCustomServer(req, res);
});

// サーバー管理 API ルート設定
router.get('/servers', async (req: Request, res: Response) => {
  await serverService.getServers(req, res);
});

router.post('/servers/:id/toggle', async (req: Request, res: Response) => {
  await serverService.toggleServer(req, res);
});

router.put('/servers/:id/config', async (req: Request, res: Response) => {
  await serverService.updateServerConfig(req, res);
});

router.post('/servers/:id/test', async (req: Request, res: Response) => {
  await serverService.testServer(req, res);
});

router.get('/servers/:serverId/capabilities', async (req: Request, res: Response) => {
  await serverService.getServerCapabilities(req, res);
});

// サーバーヘルスチェックAPI
router.get('/servers/:serverId/health', async (req: Request, res: Response) => {
  await serverService.checkServerHealth(req, res);
});

// グローバル設定管理API
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await configManager.loadConfig();
    res.json(config);
  } catch (error) {
    console.error('Error loading config:', error);
    res.status(500).json({
      error: {
        code: 'CONFIG_LOAD_ERROR',
        message: '設定の読み込みに失敗しました'
      }
    });
  }
});

router.put('/config', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    console.log('Received config update request:', JSON.stringify(config, null, 2));

    // 設定の検証
    const validation = configManager.validateConfig(config);
    console.log('Config validation result:', validation);
    if (!validation.isValid) {
      console.error('Config validation failed:', validation.errors);
      res.status(400).json({
        error: {
          code: 'INVALID_CONFIG',
          message: '設定の形式が正しくありません',
          details: validation.errors
        }
      });
      return;
    }

    await configManager.saveConfig(config);
    res.json({
      success: true,
      message: '設定が正常に保存されました'
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({
      error: {
        code: 'CONFIG_SAVE_ERROR',
        message: '設定の保存に失敗しました'
      }
    });
  }
});

router.post('/config/backup', async (req: Request, res: Response) => {
  try {
    const backupPath = await configManager.backupConfig();
    const config = await configManager.loadConfig();

    const backupData = {
      timestamp: new Date().toISOString(),
      config: config,
      backupPath: backupPath
    };

    res.json(backupData);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      error: {
        code: 'BACKUP_ERROR',
        message: 'バックアップの作成に失敗しました'
      }
    });
  }
});

router.post('/config/restore', async (req: Request, res: Response) => {
  try {
    const { backupPath } = req.body;
    await configManager.restoreFromBackup(backupPath);
    res.json({
      success: true,
      message: 'バックアップから正常に復元されました'
    });
  } catch (error) {
    console.error('Error restoring from backup:', error);
    res.status(500).json({
      error: {
        code: 'RESTORE_ERROR',
        message: 'バックアップからの復元に失敗しました'
      }
    });
  }
});

export default router;
