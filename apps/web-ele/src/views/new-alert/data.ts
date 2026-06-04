import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

export const priorityOptions = [
  { label: '高', value: '1' },
  { label: '中', value: '2' },
  { label: '低', value: '3' },
];

export const statusOptions = [
  { label: '未处理', value: '1' },
  { label: '处理中', value: '2' },
];

export const categoryOptions = [
  { label: '车辆故障', value: 'fault' },
  { label: '行为异常', value: 'behavior' },
  { label: '任务异常', value: 'task' },
  { label: '安全预警', value: 'safety' },
  { label: '其他', value: 'other' },
];

export const priorityLabelMap: Record<string, string> = {
  1: '高',
  2: '中',
  3: '低',
};

export const priorityTagMap: Record<string, string> = {
  1: 'danger',
  2: 'warning',
  3: 'success',
};

export const statusLabelMap: Record<string, string> = {
  1: '未处理',
  2: '处理中',
};

export const statusTagMap: Record<string, string> = {
  1: 'danger',
  2: 'warning',
};

export const categoryLabelMap: Record<string, string> = {
  fault: '车辆故障',
  behavior: '行为异常',
  task: '任务异常',
  safety: '安全预警',
  other: '其他',
};

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'vehicleName',
      label: '车辆名称',
      componentProps: { placeholder: '请输入车辆名称', clearable: true },
    },
    {
      component: 'Input',
      fieldName: 'vehicleCode',
      label: '车辆编码',
      componentProps: { placeholder: '请输入车辆编码', clearable: true },
    },
    {
      component: 'Input',
      fieldName: 'taskCode',
      label: '任务编码',
      componentProps: { placeholder: '请输入任务编码', clearable: true },
    },
    {
      component: 'Select',
      fieldName: 'priority',
      label: '预警优先级',
      componentProps: {
        clearable: true,
        options: priorityOptions,
        placeholder: '请选择',
      },
    },
    {
      component: 'Select',
      fieldName: 'category',
      label: '预警分类',
      componentProps: {
        clearable: true,
        options: categoryOptions,
        placeholder: '请选择',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        clearable: true,
        options: statusOptions,
        placeholder: '请选择',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'alertTime',
      label: '预警时间',
      componentProps: {
        type: 'daterange',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
  ];
}

export function useColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 70 },
    { field: 'vehicleName', title: '车辆名称', width: 160 },
    { field: 'vehicleCode', title: '车辆编码', width: 160 },
    { field: 'taskCode', title: '任务编码', width: 160 },
    {
      field: 'priority',
      title: '预警优先级',
      width: 110,
      slots: { default: 'priority' },
    },
    {
      field: 'category',
      title: '预警分类',
      width: 120,
      slots: { default: 'category' },
    },
    {
      field: 'content',
      title: '预警内容',
      showOverflow: true,
      minWidth: 240,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'alertTime', title: '时间', width: 180 },
    {
      field: 'operation',
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];
}
