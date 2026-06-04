import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'operator',
      label: '操作人',
      componentProps: {
        placeholder: '请输入操作人',
      },
    },
    {
      component: 'Select',
      fieldName: 'operationType',
      label: '操作类型',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          { label: '新增', value: '1' },
          { label: '编辑', value: '2' },
          { label: '删除', value: '3' },
          { label: '查询', value: '4' },
          { label: '导入', value: '5' },
          { label: '导出', value: '6' },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'module',
      label: '操作模块',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          { label: '任务管理', value: '1' },
          { label: '用户管理', value: '2' },
          { label: '角色管理', value: '3' },
          { label: '菜单管理', value: '4' },
          { label: '系统设置', value: '5' },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'result',
      label: '操作结果',
      componentProps: {
        allowClear: true,
        options: [
          { label: '成功', value: '1' },
          { label: '失败', value: '2' },
        ],
        placeholder: '请选择',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'createTime',
      label: '操作时间',
      componentProps: {
        type: 'daterange',
        placeholder: '请选择操作时间',
      },
    },
  ];
}

export function useColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 70 },
    { field: 'operator', title: '操作人', width: 120 },
    {
      field: 'operationType',
      title: '操作类型',
      width: 100,
      slots: { default: 'operationType' },
    },
    { field: 'module', title: '操作模块', width: 120 },
    { field: 'content', title: '操作内容', showOverflow: true, minWidth: 250 },
    { field: 'ip', title: 'IP地址', width: 150 },
    {
      field: 'result',
      title: '操作结果',
      width: 100,
      slots: { default: 'result' },
    },
    { field: 'createTime', title: '操作时间', width: 180 },
  ];
}
