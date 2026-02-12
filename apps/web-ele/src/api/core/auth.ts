import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    account: string; // 账号/手机号
    password?: string; // 加签后密码 (account login)
    code?: string; // 验证码 (code login - implied, though interface focuses on account)
    grantType: string; // 'captcha' for account login with captcha
    type?: string; // 'account'
    key?: string; // Captcha Key
    captcha?: string; // Captcha Code
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    tokenType: string;
    refreshToken: string;
    userId: string;
    tenantId: string;
    oauthId: string;
    avatar: string;
    authority: string;
    userName: string;
    account: string;
    expiresIn: number;
    license: string;
  }

  export interface CaptchaResult {
    key: string;
    image: string;
  }
}

/**
 * 登录
 */
export async function loginApi(
  data: AuthApi.LoginParams,
  headers?: Record<string, string>,
) {
  // Construct URL parameters as per curl example: ?grantType=...&account=...
  // However, usually post body is preferred. The curl shows query params AND body?
  // "post请求head里参数... 入参：... grantType..."
  // It seems it accepts form-urlencoded or query params. Let's try sending as query params for safety as shown in curl URL,
  // or checks if `requestClient` supports form-urlencoded.
  // The interface says "Content-Type String application/x-www-form-urlencoded".
  // Let's use `params` to send as query strings for now, or `data` if we format it.

  return requestClient.post<AuthApi.LoginResult>('/blade-auth/token', null, {
    params: data,
    headers: {
      Authorization: 'Basic c2FiZXI6c2FiZXJfc2VjcmV0',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
  });
}

/**
 * 获取验证码
 */
export async function getCaptchaApi() {
  return requestClient.get<AuthApi.CaptchaResult>('/blade-auth/captcha', {
    headers: {
      Authorization: 'Basic c2FiZXI6c2FiZXJfc2VjcmV0',
    },
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  const accessStore = useAccessStore();
  return requestClient.post('/blade-auth/logout', null, {
    headers: {
      Authorization: 'Basic c2FiZXI6c2FiZXJfc2VjcmV0',
      'Blade-Auth': `bearer ${accessStore.accessToken}`,
    },
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
