import { requestClient } from '#/api/request';

export namespace OperationLogApi {
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
    operator?: string;
    operationType?: string;
    module?: string;
    result?: string;
    startTime?: string;
    endTime?: string;
  }
}

/**
 * 获取操作记录列表
 */
export async function getOperationLogListApi(
  params: OperationLogApi.LogListParams,
) {
  return requestClient.get('/operationLog/page', { params });
}
