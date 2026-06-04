export interface VehicleData {
  id: string;
  plate: string;
  status: 'offline' | 'running' | 'stopped';
  lng: number;
  lat: number;
  speed: number;
  taskProgress: number;
  health: 'error' | 'healthy' | 'warning';
  isAlert?: boolean;
  alertMessage?: string;
}

// 设定上海中心点附近作为初始范围
const baseLng = 121.4737;
const baseLat = 31.2304;

export function getMockVehicles(): VehicleData[] {
  return [
    {
      id: 'V001',
      plate: '沪A·A1234',
      status: 'running',
      lng: baseLng + 0.01,
      lat: baseLat + 0.005,
      speed: 45,
      taskProgress: 25,
      health: 'healthy',
    },
    {
      id: 'V002',
      plate: '沪A·B5678',
      status: 'running',
      lng: baseLng - 0.012,
      lat: baseLat + 0.01,
      speed: 30,
      taskProgress: 12,
      health: 'healthy',
    },
    {
      id: 'V003',
      plate: '沪A·C9012',
      status: 'stopped',
      lng: baseLng + 0.02,
      lat: baseLat - 0.015,
      speed: 0,
      taskProgress: 100,
      health: 'warning',
    },
    {
      id: 'V004',
      plate: '沪A·D3456',
      status: 'offline',
      lng: baseLng - 0.005,
      lat: baseLat - 0.008,
      speed: 0,
      taskProgress: 50,
      health: 'error',
    },
    {
      id: 'V005',
      plate: '沪A·E7890',
      status: 'running',
      lng: baseLng + 0.008,
      lat: baseLat - 0.002,
      speed: 55,
      taskProgress: 88,
      health: 'healthy',
    },
  ];
}

const HEALTHS: VehicleData['health'][] = ['healthy', 'warning', 'error'];

/**
 * 生成大批量模拟车辆，用于验证「车辆过多时大屏仍能流畅渲染」。
 *
 * 在上海中心附近 ~0.3° 方框内随机散布，状态按 行驶/停止/离线 加权，
 * 使得初始缩放级别下出现明显的点聚合，放大后能逐级拆分为单车。
 *
 * @param count 车辆数量，默认 1000
 */
export function generateMockVehicles(count = 1000): VehicleData[] {
  const spread = 0.15; // 经纬度散布半径（度）
  const vehicles: VehicleData[] = [];

  for (let i = 0; i < count; i++) {
    // 70% 行驶 / 20% 停止 / 10% 离线，让大屏「动」起来
    const r = Math.random();
    const status: VehicleData['status'] =
      r < 0.7 ? 'running' : (r < 0.9 ? 'stopped' : 'offline');

    vehicles.push({
      id: `V${String(i + 1).padStart(4, '0')}`,
      plate: `沪A·${String.fromCodePoint(65 + (i % 26))}${1000 + (i % 9000)}`,
      status,
      lng: baseLng + (Math.random() - 0.5) * 2 * spread,
      lat: baseLat + (Math.random() - 0.5) * 2 * spread,
      speed: status === 'running' ? Math.floor(Math.random() * 40) + 20 : 0,
      taskProgress: Math.floor(Math.random() * 100),
      health: HEALTHS[Math.floor(Math.random() * HEALTHS.length)]!,
    });
  }

  return vehicles;
}
