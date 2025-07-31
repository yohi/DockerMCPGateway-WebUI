import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ApiClient } from '../api/apiClient';
import { SocketClient } from '../api/socketClient';
import { MCPServer, MCPServerConfig } from '../types/models';

// シングルトンインスタンスの作成
const apiClient = new ApiClient();
const socketClient = new SocketClient();

/**
 * サーバー一覧を取得するフック
 */
export function useServers() {
  const queryClient = useQueryClient();

  // ソケット接続の確立
  useEffect(() => {
    socketClient.connect();

    // サーバーステータス変更イベントのリッスン
    socketClient.on('server-status-change', () => {
      // 状態が変更されたらデータを再取得
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    });

    // コンポーネントのクリーンアップ時にイベントリスナーを削除
    return () => {
      socketClient.off('server-status-change');
    };
  }, [queryClient]);

  // サーバー一覧の取得
  return useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await apiClient.getServers();
      return response.servers;
    },
  });
}

/**
 * サーバーの有効/無効を切り替えるフック
 */
export function useToggleServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serverId, enabled }: { serverId: string; enabled: boolean }) => {
      return await apiClient.toggleServer(serverId);
    },
    onSuccess: () => {
      // 成功時にサーバー一覧を再取得
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

/**
 * サーバー設定を更新するフック
 */
export function useUpdateServerConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serverId, config }: { serverId: string; config: MCPServerConfig }) => {
      return await apiClient.updateServerConfig(serverId, config);
    },
    onSuccess: () => {
      // 成功時にサーバー一覧とサーバー設定を再取得
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['serverConfig'] });
    },
  });
}

/**
 * サーバーテストを実行するフック
 */
export function useTestServer() {
  const [testProgress, setTestProgress] = useState<any>(null);

  // ソケット接続の確立とテスト進行状況の監視
  useEffect(() => {
    socketClient.connect();

    socketClient.on('test-progress', (data) => {
      setTestProgress(data);
    });

    return () => {
      socketClient.off('test-progress');
    };
  }, []);

  // テスト実行ミューテーション
  const testMutation = useMutation({
    mutationFn: async ({
      serverId,
      testType,
      parameters,
    }: {
      serverId: string;
      testType: 'connection' | 'tools' | 'resources';
      parameters?: any;
    }) => {
      // テスト開始時にプログレス状態をリセット
      setTestProgress({
        id: serverId,
        testType,
        status: 'running',
      });

      return await apiClient.testServer(serverId);
    },
  });

  return {
    ...testMutation,
    testProgress,
  };
}

/**
 * サーバーカタログを取得するフック
 */
export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const response = await apiClient.getCatalog();
      return response;
    },
  });
}

/**
 * サーバーをインストールするフック
 */
export function useInstallServer() {
  const queryClient = useQueryClient();
  const [installProgress, setInstallProgress] = useState<any>(null);

  // ソケット接続の確立とインストール進行状況の監視
  useEffect(() => {
    socketClient.connect();

    socketClient.on('install-progress', (data) => {
      setInstallProgress(data);
    });

    return () => {
      socketClient.off('install-progress');
    };
  }, []);

  // インストール実行ミューテーション
  const installMutation = useMutation({
    mutationFn: async ({
      serverId,
      config,
    }: {
      serverId: string;
      config?: MCPServerConfig;
    }) => {
      // インストール開始時にプログレス状態をリセット
      setInstallProgress({
        serverId,
        status: 'running',
      });

      return await apiClient.installServer(serverId, config);
    },
    onSuccess: () => {
      // 成功時にサーバー一覧とカタログを再取得
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });

  return {
    ...installMutation,
    installProgress,
  };
}

/**
 * サーバーログをサブスクライブするフック
 * @param serverId サーバーID
 */
export function useServerLogs(serverId: string) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!serverId) return;

    socketClient.connect();
    socketClient.subscribeToLogs(serverId, (newLog) => {
      setLogs((prevLogs) => [...prevLogs, newLog]);
    });

    return () => {
      socketClient.off(`logs-${serverId}`);
    };
  }, [serverId]);

  const clearLogs = () => {
    setLogs([]);
  };

  return {
    logs,
    clearLogs,
  };
}

/**
 * サーバー設定を取得するフック
 * @param serverId サーバーID
 */
export function useServerConfig(serverId: string) {
  const queryClient = useQueryClient();

  // ソケット接続の確立
  useEffect(() => {
    socketClient.connect();

    // 設定更新イベントのリッスン
    socketClient.on('config-update', (data) => {
      if (data.id === serverId || data.global) {
        // 設定が変更されたらデータを再取得
        queryClient.invalidateQueries({ queryKey: ['serverConfig', serverId] });
      }
    });

    return () => {
      socketClient.off('config-update');
    };
  }, [queryClient, serverId]);

  // サーバー設定の取得
  return useQuery({
    queryKey: ['serverConfig', serverId],
    queryFn: async () => {
      try {
        const config = await apiClient.getConfig();
        return config.servers[serverId];
      } catch (error) {
        console.error(`Error fetching config for server ${serverId}:`, error);
        throw error;
      }
    },
    enabled: !!serverId,
  });
}
