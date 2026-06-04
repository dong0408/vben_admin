import { requestClient } from '#/api/request';

export namespace AlertApi {
  /** 预警优先级：1-高，2-中，3-低 */
  export type AlertPriority = '1' | '2' | '3';

  /** 预警状态：1-未处理，2-处理中 */
  export type AlertStatus = '1' | '2';

  export interface AlertItem {
    id: string;
    vehicleName: string;
    vehicleCode: string;
    taskCode: string;
    priority: AlertPriority;
    category: string;
    content: string;
    status: AlertStatus;
    alertTime: string;
    faultCode?: string;
    faultDescription?: string;
  }

  export interface AlertListParams {
    current: number;
    size: number;
    vehicleName?: string;
    vehicleCode?: string;
    taskCode?: string;
    priority?: AlertPriority;
    category?: string;
    status?: AlertStatus;
    startTime?: string;
    endTime?: string;
  }
}

/**
 * 获取实时预警列表
 */
export async function getAlertListApi(params: AlertApi.AlertListParams) {
  return requestClient.get('/alert/page', { params });
}

/**
 * 获取预警历史列表
 */
export async function getAlertHistoryListApi(params: AlertApi.AlertListParams) {
  return requestClient.get('/alert/history/page', { params });
}
