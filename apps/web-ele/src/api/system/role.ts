import { requestClient } from '../request';

export const getRoleListApi = () => {
  return requestClient.get('/system/role/list');
};

export const getRoleByIdApi = (id: string) => {
  return requestClient.get(`/system/role/${id}`);
};

export const createRoleApi = (data: any) => {
  return requestClient.post('/system/role/create', data);
};

export const updateRoleApi = (id: string, data: any) => {
  return requestClient.put(`/system/role/${id}`, data);
};

export const deleteRoleApi = (id: string) => {
  return requestClient.delete(`/system/role/${id}`);
};

export const assignPermissionsApi = (roleId: string, permissionIds: string[]) => {
  return requestClient.post(`/system/role/${roleId}/permissions`, { permissionIds });
};

export const getRolePermissionsApi = (roleId: string) => {
  return requestClient.get(`/system/role/${roleId}/permissions`);
};

export const getPermissionListApi = () => {
  return requestClient.get('/system/permission/list');
};
