import { get, post } from '../utils/request'

/** 登录 */
export function login(data) {
  return post({ url: '/api/auth/login', data })
}

/** 注册 */
export function register(data) {
  return post({ url: '/api/auth/register', data })
}

/** 获取当前用户信息 */
export function getMe() {
  return get({ url: '/api/auth/me' })
}

/** 修改密码 */
export function changePassword(data) {
  return post({ url: '/api/auth/change-password', data })
}
