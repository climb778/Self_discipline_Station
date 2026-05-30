import { getToken, removeToken, removeUserInfo } from './auth'

// 本地开发后端地址
const DEV_BASE_URL = 'http://localhost:8080'
// 小主机线上后端地址
const PROD_BASE_URL = 'https://api.apotatoapit.icu'

// 当前使用线上后端，切回本地开发改为 DEV_BASE_URL
const BASE_URL = PROD_BASE_URL

export { BASE_URL }

export function handle401() {
  removeToken()
  removeUserInfo()
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]?.route || ''
  if (current === 'pages/login/login' || current === 'pages/register/register') return
  uni.reLaunch({ url: '/pages/login/login' })
}

export function request(options) {
  const header = {
    'Content-Type': 'application/json',
    ...options.header
  }
  const token = getToken()
  if (token) {
    header['Authorization'] = 'Bearer ' + token
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      timeout: 15000,
      header,
      success: (res) => {
        if (res.statusCode === 401) {
          handle401()
          reject({ code: 401, message: '未登录或登录已过期' })
          return
        }
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          // 返回 { code, message, data }，页面用 res.data 取业务数据
          resolve(res.data)
        } else {
          const msg = (res.data && res.data.message) || '请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          reject(res.data || { code: res.statusCode, message: msg })
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export function get(options) {
  return request({ ...options, method: 'GET' })
}

export function post(options) {
  return request({ ...options, method: 'POST' })
}

export function put(options) {
  return request({ ...options, method: 'PUT' })
}

export function del(options) {
  return request({ ...options, method: 'DELETE' })
}
