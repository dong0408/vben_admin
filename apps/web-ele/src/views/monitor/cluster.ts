import type { VehicleData } from './mock';

import * as maptalks from 'maptalks';

/**
 * 一个聚合簇（多辆车在屏幕上靠得很近时被合并成的气泡）
 */
export interface ClusterGroup {
  /** 网格单元 key（容器像素网格坐标），用于增量 diff */
  key: string;
  /** 簇质心经度 */
  lng: number;
  /** 簇质心纬度 */
  lat: number;
  /** 簇内车辆数量 */
  count: number;
  /** 簇内车辆 id 列表 */
  ids: string[];
  /** 簇内是否含报警车辆，用于把气泡标红 */
  hasAlert: boolean;
}

/**
 * 一次聚合计算的产物：
 * - singles：需要以单车形式独立渲染的车辆
 * - clusters：需要以聚合气泡渲染的簇
 */
export interface ClusterResult {
  singles: VehicleData[];
  clusters: ClusterGroup[];
}

/**
 * 屏幕像素网格聚合 + 视野裁剪。
 *
 * 这是一个纯函数：只借助 `map` 做经纬度 → 容器像素的投影，不做任何
 * maptalks 渲染副作用，便于单测与复用。
 *
 * 算法：
 * 1. 取当前可视范围（向外扩 20% 缓冲，避免边缘车辆在平移时闪烁），
 *    范围外的车辆直接丢弃（视野裁剪）——这是大数据量下的第一道减负。
 * 2. 把每辆车投影到容器像素坐标，按 `cellSizePx` 大小的网格分桶。
 *    用屏幕像素网格（而非经纬度网格）保证聚合的视觉密度在任意缩放级别都均匀。
 * 3. 桶内只有 1 辆 → 单车渲染；≥2 辆 → 合并成一个簇（取质心）。
 *
 * @param map        maptalks 地图实例
 * @param vehicles   全量车辆数据（可成百上千）
 * @param cellSizePx 网格单元边长（容器像素），越大聚合越激进
 */
export function buildClusters(
  map: maptalks.Map,
  vehicles: VehicleData[],
  cellSizePx = 64,
): ClusterResult {
  const singles: VehicleData[] = [];
  const clusters: ClusterGroup[] = [];

  // 地图尚未就绪时直接返回空结果，调用方无需额外判空
  const ext = map.getExtent();
  if (!ext) return { singles, clusters };

  // 视野裁剪：在可视范围基础上向外扩约 20%，避免边缘车辆在平移时反复进出
  const marginX = (ext.xmax - ext.xmin) * 0.2;
  const marginY = (ext.ymax - ext.ymin) * 0.2;
  const xmin = ext.xmin - marginX;
  const xmax = ext.xmax + marginX;
  const ymin = ext.ymin - marginY;
  const ymax = ext.ymax + marginY;

  const grid = new Map<string, VehicleData[]>();

  for (const v of vehicles) {
    // 1. 视野裁剪：缓冲范围外的车辆不参与渲染
    if (v.lng < xmin || v.lng > xmax || v.lat < ymin || v.lat > ymax) {
      continue;
    }

    // 2. 投影到容器像素并落入网格桶
    const point = map.coordinateToContainerPoint(
      new maptalks.Coordinate(v.lng, v.lat),
    );
    const key = `${Math.floor(point.x / cellSizePx)}_${Math.floor(point.y / cellSizePx)}`;

    const bucket = grid.get(key);
    if (bucket) {
      bucket.push(v);
    } else {
      grid.set(key, [v]);
    }
  }

  // 3. 分桶结果归类为单车 / 簇
  for (const [key, members] of grid) {
    if (members.length === 1) {
      singles.push(members[0]!);
      continue;
    }

    let sumLng = 0;
    let sumLat = 0;
    let hasAlert = false;
    const ids: string[] = [];
    for (const m of members) {
      sumLng += m.lng;
      sumLat += m.lat;
      hasAlert = hasAlert || Boolean(m.isAlert);
      ids.push(m.id);
    }

    clusters.push({
      key,
      lng: sumLng / members.length,
      lat: sumLat / members.length,
      count: members.length,
      ids,
      hasAlert,
    });
  }

  return { singles, clusters };
}
