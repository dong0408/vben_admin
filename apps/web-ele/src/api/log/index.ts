import { requestClient } from '#/api/request';

export namespace LogApi {
  /** 日志类型：vehicle-车辆日志，task-任务日志 */
  export type LogType = 'task' | 'vehicle';

  export interface LogItem {
    id: string;
    operator: string;
    operationType: string;
    module: string;
    content: string;
    ip: string;
    result: string;
    createTime: string;
  }

  export interface LogListParams {
    current: number;
    size: number;
    logType: LogType;
    operator?: string;
    operationType?: string;
    module?: string;
    result?: string;
    startTime?: string;
    endTime?: string;
  }
}

/**
 * 获取日志列表
 */
export async function getLogListApi(params: LogApi.LogListParams) {
  return requestClient.get('/log/page', { params });
}
