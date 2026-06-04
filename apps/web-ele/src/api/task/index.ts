export namespace TaskApi {
  export interface TaskItem {
    id: string;
    taskSource: string;
    taskName: string;
    taskType: string;
    taskPriority: string;
    taskExecCount: string;
    taskArea: string;
    routeSelection: string;
    dispatchMethod: string;
    vehicle?: string;
    isAssociated: string;
    associatedTask?: string;
    startTime?: string;
    remarks?: string;
    status: number;
    createTime: string;
  }
}

export type { TaskApi as TaskApiNamespace };

/**
 * 模拟获取任务列表
 */
export async function getTaskList() {
  // return requestClient.get<TaskApi.TaskItem[]>('/task/list');
  return [
    {
      id: '1',
      taskSource: 'manual',
      taskName: '测试任务A',
      taskType: 'type1',
      taskPriority: 'high',
      taskExecCount: 'once',
      taskArea: 'area1',
      routeSelection: 'route1',
      dispatchMethod: 'system',
      vehicle: '',
      isAssociated: 'no',
      associatedTask: '',
      startTime: '2026-03-12 10:00:00',
      remarks: '这是一个测试任务',
      status: 1,
      createTime: '2026-03-12 09:00:00',
    },
  ];
}

/**
 * 创建任务
 */
export async function createTask(data: any) {
  // return requestClient.post('/task/create', data);
  return { code: 0, message: 'success', data };
}

/**
 * 更新任务
 */
export async function updateTask(id: string, data: any) {
  // return requestClient.put(`/task/update/${id}`, data);
  return { code: 0, message: 'success', data };
}

/**
 * 删除任务
 */
export async function deleteTask(id: string) {
  // return requestClient.delete(`/task/delete/${id}`);
  return { code: 0, message: 'success', data: id };
}

/**
 * 校验任务名称是否存在
 */
export async function isTaskNameExists(name: string, id?: string) {
  return false;
}
