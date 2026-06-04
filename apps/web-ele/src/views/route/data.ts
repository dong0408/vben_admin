import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';

// 路线类型常量，便于后端对齐
export const ROUTE_TYPES = [
  { label: '巡检', value: '巡检' },
  { label: '环卫', value: '环卫' },
  { label: '清扫', value: '清扫' },
  { label: '运维', value: '运维' },
];

export const ROUTE_STATUS = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

/**
 * 路线表单 schema（新增 / 编辑）
 * 注意：points 字段为地图选点数组，使用自定义 slot 渲染
 */
export function useBaseFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '路线名称',
      componentProps: {
        maxlength: 30,
        placeholder: '请输入路线名称',
      },
      rules: z
        .string()
        .min(1, '请输入路线名称')
        .max(30, '路线名称最多 30 个字符'),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '路线编码',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入路线编码',
      },
      rules: z.string().min(1, '请输入路线编码'),
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '路线类型',
      componentProps: {
        allowClear: true,
        clearable: true,
        filterable: true,
        options: ROUTE_TYPES,
        placeholder: '请选择路线类型',
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '状态',
      defaultValue: 1,
      componentProps: {
        options: ROUTE_STATUS,
      },
    },
    // 地图选点自定义渲染
    {
      component: 'Input',
      fieldName: 'points',
      label: '路线点位',
      formItemClass: 'col-span-2',
      rules: z
        .array(
          z.object({
            lng: z.number(),
            lat: z.number(),
          }),
        )
        .min(1, '请在地图上至少选取一个点位')
        .default([]),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      formItemClass: 'col-span-2',
      componentProps: {
        autosize: { minRows: 3, maxRows: 6 },
        maxlength: 200,
        placeholder: '请输入备注（选填）',
      },
    },
  ];
}

/**
 * 表格顶部搜索 schema
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '路线名称',
      componentProps: {
        clearable: true,
        placeholder: '请输入路线名称',
      },
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '路线编码',
      componentProps: {
        clearable: true,
        placeholder: '请输入路线编码',
      },
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '路线类型',
      componentProps: {
        clearable: true,
        options: ROUTE_TYPES,
        placeholder: '请选择',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        clearable: true,
        options: ROUTE_STATUS,
        placeholder: '请选择',
      },
    },
  ];
}

/**
 * 表格列
 */
export function useColumns(onActionClick: any): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 60 },
    { field: 'name', title: '路线名称', minWidth: 160 },
    { field: 'code', title: '路线编码', width: 150 },
    { field: 'type', title: '类型', width: 100 },
    {
      field: 'points',
      title: '点位数',
      width: 90,
      slots: { default: 'points' },
    },
    {
      field: 'status',
      title: '状态',
      width: 110,
      slots: { default: 'status' },
    },
    { field: 'remark', title: '备注', minWidth: 160, showOverflow: true },
    { field: 'createTime', title: '创建时间', width: 170 },
    { field: 'updateTime', title: '更新时间', width: 170 },
    {
      align: 'center',
      fixed: 'right',
      field: 'operation',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      width: 220,
      slots: { default: 'action' },
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
      },
    },
  ];
}
