import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

import { sm2 } from 'sm-crypto';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  const publicKey =
    '04969f1a494fafc1e5075dd0562924d773dbcefb726f11ac45adc4abea445a8fec6ef75266070f9c20782c9b686c992d83b5f5670bfe6f56f5e05a1e9ac53a2a4f';

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      // Encrypt password if present
      let encryptedPassword = params.password;
      if (params.password) {
        encryptedPassword = '04' + sm2.doEncrypt(params.password, publicKey, 0);
      }

      // Prepare login params matching API interface
      const loginParams = {
        account: params.username,
        password: encryptedPassword,
        type: 'account',
        grantType: '', // Leave empty to disable captcha for now, or 'captcha' if implemented
      };

      // For Code Login (if mobile/code passed), adjust params?
      // "type String 登录类型。非必填，web端建议填“account”"
      // If code login, maybe type is different or grantType is different?
      // Interface doc mainly describes account login.
      // Assuming for now this covers account login.

      const { accessToken } = await loginApi(loginParams);

      if (accessToken) {
        accessStore.setAccessToken(accessToken);

        // Fetch user info
        // Fetch user info (which now mocks permissions)
        const [fetchUserInfoResult] = await Promise.all([
          fetchUserInfo(),
          // getAccessCodesApi(), // Skip real API for now
        ]);

        userInfo = fetchUserInfoResult;
        // userStore.setUserInfo(userInfo); // Already done in fetchUserInfo
        // accessStore.setAccessCodes(accessCodes); // Already done in fetchUserInfo        
        // ... rest of success logic

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true, callApi: boolean = true) {
    if (callApi) {
      try {
        await logoutApi();
      } catch {
        // 不做任何处理
      }
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    // Mock UserInfo for now as per user request to "open all permissions"
    const userInfo: UserInfo = {
      userId: '1',
      username: 'admin',
      realName: 'Admin',
      avatar: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
      roles: ['super'],
      homePath: '/dashboard', // Adjust if project has different home
    };
    
    // userInfo = await getUserInfoApi(); // Keep commented as per user edit
    userStore.setUserInfo(userInfo);
    
    // Set global access codes to allow everything
    accessStore.setAccessCodes(['*']);
    
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
