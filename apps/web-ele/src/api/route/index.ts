// 后端接口就绪后取消下行注释并替换各函数内的 mock 逻辑为 requestClient 调用
// import { requestClient } from '#/api/request';

export namespace RouteApi {
  export interface RoutePoint {
    lng: number;
    lat: number;
  }

  export interface RouteItem {
    id: string;
    name: string;
    code: string;
    type?: string;
    points: RoutePoint[];
    status: number; // 1 启用  0 禁用
    remark?: string;
    createTime?: string;
    updateTime?: string;
  }

  export interface RouteQueryParams {
    current?: number;
    size?: number;
    name?: string;
    code?: string;
    status?: number | string;
    type?: string;
  }
}

// 使用前端内存模拟数据，待后端接口就绪后替换为 requestClient 调用
let mockId = 5;
const mockRoutes: RouteApi.RouteItem[] = [
  {
    id: '1',
    name: '外滩巡检路线',
    code: 'R-WT-001',
    type: '巡检',
    points: [
      { lng: 121.4737, lat: 31.2304 },
      { lng: 121.4837, lat: 31.2354 },
      { lng: 121.4937, lat: 31.2404 },
    ],
    status: 1,
    remark: '沿外滩沿江巡检',
    createTime: '2026-03-01 10:00:00',
    updateTime: '2026-03-01 10:00:00',
  },
  {
    id: '2',
    name: '陆家嘴环卫路线',
    code: 'R-LJZ-002',
    type: '环卫',
    points: [
      { lng: 121.5057, lat: 31.2397 },
      { lng: 121.5157, lat: 31.2447 },
    ],
    status: 1,
    remark: '',
    createTime: '2026-03-05 09:30:00',
    updateTime: '2026-03-05 09:30:00',
  },
  {
    id: '3',
    name: '静安寺清扫路线',
    code: 'R-JAS-003',
    type: '清扫',
    points: [
      { lng: 121.4454, lat: 31.2231 },
      { lng: 121.4504, lat: 31.2281 },
      { lng: 121.4554, lat: 31.2331 },
      { lng: 121.4604, lat: 31.2381 },
    ],
    status: 0,
    remark: '夜间清扫',
    createTime: '2026-03-10 15:20:00',
    updateTime: '2026-03-10 15:20:00',
  },
  {
    id: '4',
    name: '徐家汇运维路线',
    code: 'R-XJH-004',
    type: '运维',
    points: [
      { lng: 121.4366, lat: 31.1982 },
      { lng: 121.4466, lat: 31.2032 },
    ],
    status: 1,
    remark: '',
    createTime: '2026-03-12 11:10:00',
    updateTime: '2026-03-12 11:10:00',
  },
];

function nowStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 获取路线列表（分页 + 过滤）
 */
export async function getRouteListApi(params: RouteApi.RouteQueryParams = {}) {
  // return requestClient.get('/route/list', { params });
  const { current = 1, size = 10, name, code, status, type } = params;

  let data = [...mockRoutes];
  if (name) data = data.filter((r) => r.name.includes(name));
  if (code) data = data.filter((r) => r.code.includes(code));
  if (type) data = data.filter((r) => r.type === type);
  if (status !== undefined && status !== '' && status !== null) {
    data = data.filter((r) => r.status === Number(status));
  }

  const total = data.length;
  const start = (current - 1) * size;
  const records = data.slice(start, start + size);
  return { records, total, current, size };
}

/**
 * 根据 ID 获取路线
 */
export async function getRouteByIdApi(id: string) {
  // return requestClient.get(`/route/${id}`);
  const found = mockRoutes.find((r) => r.id === id);
  return found;
}

/**
 * 新增路线
 */
export async function createRouteApi(data: Partial<RouteApi.RouteItem>) {
  // return requestClient.post('/route/create', data);
  const time = nowStr();
  const item: RouteApi.RouteItem = {
    id: String(++mockId),
    name: data.name || '',
    code: data.code || '',
    type: data.type,
    points: data.points || [],
    status: data.status ?? 1,
    remark: data.remark,
    createTime: time,
    updateTime: time,
  };
  mockRoutes.unshift(item);
  return item;
}

/**
 * 更新路线
 */
export async function updateRouteApi(data: Partial<RouteApi.RouteItem>) {
  // return requestClient.put(`/route/${data.id}`, data);
  const idx = mockRoutes.findIndex((r) => r.id === data.id);
  if (idx !== -1) {
    mockRoutes[idx] = {
      ...mockRoutes[idx],
      ...data,
      updateTime: nowStr(),
    } as RouteApi.RouteItem;
  }
  return mockRoutes[idx];
}

/**
 * 删除路线
 */
export async function deleteRouteApi(id: string) {
  // return requestClient.delete(`/route/${id}`);
  const idx = mockRoutes.findIndex((r) => r.id === id);
  if (idx !== -1) mockRoutes.splice(idx, 1);
  return true;
}

/**
 * 启用 / 禁用路线
 */
export async function toggleRouteStatusApi(id: string, status: number) {
  // return requestClient.post(`/route/${id}/status`, { status });
  const target = mockRoutes.find((r) => r.id === id);
  if (target) {
    target.status = status;
    target.updateTime = nowStr();
  }
  return true;
}
