import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';

// 用户基础信息表单 schema（新增/编辑用）
export function useBaseFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Text',
      label: '基本信息',
      fieldName: '',
      labelClass: 'text-[20px] font-bold',
    },
    {
      component: 'Input',
      fieldName: 'taskName',
      label: '任务名称',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入任务名称',
      },
      rules: z
        .string()
        .min(1, '请输入角色名称')
        .max(20, '角色名称最多20个字符')
        .regex(/^[\u{4E00}-\u{9FA5}\w]+$/u, '只能包含中文、英文、数字、下划线'),
    },
    {
      component: 'Select',
      fieldName: 'priority',
      label: '任务优先级',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '高',
            value: '1',
          },
          {
            label: '中',
            value: '2',
          },
          {
            label: '低',
            value: '3',
          },
        ],
      },
      defaultValue: '3',
    },
    {
      component: 'Select',
      fieldName: 'taskType',
      label: '任务类型',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '环卫任务',
            value: '1',
          },
          {
            label: '运维任务',
            value: '2',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
      defaultValue: '1',
    },
    {
      component: 'InputNumber',
      fieldName: 'executeCount',
      label: '任务执行次数',
      defaultValue: 1,
    },
    {
      component: 'Divider',
      fieldName: 'divider1',
      hideLabel: true,
    },
    {
      component: 'Text',
      label: '任务路径',
      fieldName: '',
      labelClass: 'text-[20px] font-bold',
    },
    {
      component: 'Input',
      label: '任务区域',
      fieldName: 'taskArea',
    },
    {
      component: 'Select',
      label: '路线选择',
      fieldName: 'selectRoute',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '上路',
            value: '1',
          },
          {
            label: '中路',
            value: '2',
          },
          {
            label: '下路',
            value: '3',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
      defaultValue: '1',
    },
    {
      component: 'RadioGroup',
      label: '派单方式',
      fieldName: 'dispatchMethod',
      componentProps: {
        options: [
          { label: '系统派单', value: '1' },
          { label: '人工派单', value: '2' },
        ],
      },
      defaultValue: '2',
    },
    {
      component: 'Select',
      label: '',
      fieldName: 'carNo',
      componentProps: {
        options: [
          {
            label: '兰博基尼',
            value: 1,
          },
          {
            label: '布加迪威龙',
            value: 2,
          },
        ],
      },
      defaultValue: 2,
    },
    {
      component: 'Divider',
      fieldName: 'divider1',
      hideLabel: true,
    },
    {
      component: 'RadioGroup',
      fieldName: 'isAssociate',
      label: '是否关联',
      labelClass: 'text-[20px] font-bold',
      componentProps: (_values, formApi) => {
        return {
          options: [
            { label: '是', value: '1' },
            { label: '否', value: '2' },
          ],
          onChange: (val: string) => {
            // 当切换值时，将相反状态下的表单项置空，还原到刚打开的状态
            if (val === '1') {
              // 如果选择了【是】，清理【否】状态下才展示的字段
              formApi?.setValues({
                cycle: '3', // 恢复缺省值
                repeatTime: undefined,
                startTime: undefined,
              });
            } else if (val === '2') {
              // 如果选择了【否】，清理【是】状态下才展示的字段
              formApi?.setValues({
                startTimeType: undefined,
                timeData: '',
              });
            }
          },
        };
      },
      defaultValue: '2',
    },
    {
      component: 'Select',
      fieldName: 'associateTask',
      label: '关联任务',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '环卫任务',
            value: '1',
          },
          {
            label: '运维任务',
            value: '2',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'cycle',
      label: '周期性',
      defaultValue: '3',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '每周',
            value: '1',
          },
          {
            label: '每月',
            value: '2',
          },
          {
            label: '不重复',
            value: '3',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
      dependencies: {
        show: (values) => values.isAssociate === '2',
        triggerFields: ['isAssociate'],
      },
    },
    {
      component: 'Input',
      fieldName: 'repeatTime',
      label: '重复时间',
      dependencies: {
        show: (values) => values.cycle === '1' || values.cycle === '2',
        triggerFields: ['cycle'],
      },
    },
    // 启动设置
    {
      component: 'Select',
      fieldName: 'startTimeType',
      label: '启动设置',
      dependencies: {
        show: (values) => values.isAssociate === '1',
        triggerFields: ['isAssociate'],
      },
    },
    {
      component: 'Input',
      fieldName: 'timeData',
      label: '',
      formItemClass: 'hidden',
      dependencies: {
        show: (values) => values.isAssociate === '1',
        triggerFields: ['isAssociate'],
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'startTime',
      label: '开始时间',
      formItemClass: 'cols-span-1 md:cols-span-1',
      wrapperClass: 'w-full',
      componentProps: {
        type: 'datetime',
        style: { width: '100%' },
      },
      dependencies: {
        show: (values) => values.isAssociate === '2',
        triggerFields: ['isAssociate'],
      },
    },
    {
      component: 'Textarea',
      fieldName: 'taskDesc',
      label: '任务描述',
      componentProps: {
        autoSize: true,
        maxlength: 200,
        placeholder: '请输入任务描述',
      },
      rules: z.string().min(1, '请输入任务描述').max(200, '描述最多200个字符'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '任务名称',
    },
    {
      component: 'Select',
      fieldName: 'taskStatus',
      label: '任务状态',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '正常',
            value: '1',
          },
          {
            label: '告警',
            value: '2',
          },
          {
            label: '已完成',
            value: '3',
          },
          {
            label: '未开启',
            value: '4',
          },
          {
            label: '未执行',
            value: '5',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'taskType',
      label: '任务类型',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '环卫任务',
            value: '1',
          },
          {
            label: '运维任务',
            value: '2',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'priority',
      label: '优先级',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '高',
            value: '1',
          },
          {
            label: '中',
            value: '2',
          },
          {
            label: '低',
            value: '3',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'taskId',
      label: '任务ID',
    },
    {
      component: 'DatePicker',
      fieldName: 'createTime',
      label: '创建时间',
      componentProps: {
        placeholder: '请选择创建时间',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'finishTime',
      label: '完成时间',
      componentProps: {
        placeholder: '请选择完成时间',
      },
    },
  ];
}

export function useColumns(onActionClick: any): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '任务来源', width: 150 },
    { field: 'account', title: '任务状态', width: 100 },
    { field: 'realName', title: '任务类型', width: 200 },
    { field: 'taskName', title: '任务名称', showOverflow: true, width: 200 },
    { field: 'taskId', title: '任务ID', width: 150 },
    {
      field: 'priority',
      title: '优先级',
      slots: { default: 'priority' },
      width: 300,
    },
    {
      field: 'progress',
      title: '完成进度',
      slots: { default: 'progress' },
      width: 200,
    },
    { field: 'startMothed', title: '启动方式', width: 200 },
    { field: 'sendOrder', title: '派单方式', width: 200 },
    { field: 'sendOrderCar', title: '派单车辆', width: 200 },
    { field: 'createTime', title: '创建时间', width: 200 },
    { field: 'finishTime', title: '完成时间', width: 200 },
    {
      align: 'center',
      fixed: 'right',
      width: 150,
      cellRender: {
        attrs: {
          nameField: 'realName',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            type: 'primary',
            label: '详情',
          },
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
        ],
      },
      field: 'operation',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
    },
  ];
}
