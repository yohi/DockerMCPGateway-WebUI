import express, { Request, Response, Router } from 'express';
import catalogService from './catalogService';
import serverService from './serverService';

const router: Router = express.Router();

// カタログAPI
router.get('/catalog', async (req: Request, res: Response) => {
  await catalogService.getCatalog(req, res);
});

router.post('/catalog/install', async (req: Request, res: Response) => {
  await catalogService.installServer(req, res);
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

export default router;
