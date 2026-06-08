import { getToken, removeToken, removeUserInfo } from './auth'

// #ifdef APP-PLUS
const CLOUD_URL = 'http://api.apotatoapit.icu'
// #endif
// #ifdef H5
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://api.apotatoapit.icu'
// #endif

// #ifdef APP-PLUS
export { CLOUD_URL as BASE_URL }
// #endif
// #ifdef H5
export { BASE_URL }
// #endif

export function handle401() {
  removeToken()
  removeUserInfo()
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]?.route || ''
  if (current === 'pages/login/login' || current === 'pages/register/register') return
  uni.reLaunch({ url: '/pages/login/login' })
}

// #ifdef H5
export function request(options) {
  const header = {
    'Content-Type': 'application/json',
    ...options.header
  }
  const token = getToken()
  if (token) {
    header['Authorization'] = 'Bearer ' + token
  }

  const url = BASE_URL + options.url
  console.log('[request]', options.method || 'GET', url)

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      timeout: 15000,
      header,
      success: (res) => {
        console.log('[request.ok]', url, 'status=' + res.statusCode, 'code=' + (res.data && res.data.code))
        if (res.statusCode === 401) {
          handle401()
          reject({ code: 401, message: '未登录或登录已过期' })
          return
        }
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          resolve(res.data)
        } else {
          const msg = (res.data && res.data.message) || '请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          reject(res.data || { code: res.statusCode, message: msg })
        }
      },
      fail: (err) => {
        const errMsg = (err && err.errMsg) || '未知错误'
        const isTimeout = errMsg.includes('timeout')
        const message = isTimeout ? '请求超时，请检查网络' : '网络连接失败，请检查网络或服务器'
        console.error('[request.fail]', options.method || 'GET', url, errMsg)
        uni.showToast({ title: message, icon: 'none', duration: 3000 })
        reject({ code: -1, message, detail: errMsg, url })
      }
    })
  })
}
// #endif

// #ifdef APP-PLUS
export function request(options) {
  const header = {
    'Content-Type': 'application/json',
    ...options.header
  }
  const token = getToken()
  if (token) {
    header['Authorization'] = 'Bearer ' + token
  }
  const method = options.method || 'GET'
  const url = CLOUD_URL + options.url
  console.log('[request]', method, url)

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
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
          console.log('[request.ok]', url)
          resolve(res.data)
        } else {
          const msg = (res.data && res.data.message) || '请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          reject(res.data || { code: res.statusCode, message: msg })
        }
      },
      fail: (err) => {
        const errMsg = (err && err.errMsg) || '未知错误'
        const isTimeout = errMsg.includes('timeout')
        const message = isTimeout ? '请求超时，请检查网络' : '网络连接失败，请检查网络或服务器'
        console.error('[request.fail]', method, url, errMsg)
        uni.showToast({ title: message, icon: 'none', duration: 3000 })
        reject({ code: -1, message, detail: errMsg, url })
      }
    })
  })
}
// #endif

/**
 * 检测服务器连通性
 * @returns {Promise<{ok: boolean, message: string, apiUrl: string, loggedIn: boolean, user: object|null}>}
 */
export function checkServer() {
  const token = getToken()
  // #ifdef APP-PLUS
  const apiUrl = CLOUD_URL
  // #endif
  // #ifdef H5
  const apiUrl = BASE_URL
  // #endif
  const result = { ok: false, apiUrl, loggedIn: !!token, user: null, message: '' }

  if (!token) {
    result.message = '未登录'
    return Promise.resolve(result)
  }

  return new Promise((resolve) => {
    uni.request({
      url: apiUrl + '/api/auth/me',
      method: 'GET',
      timeout: 8000,
      header: { Authorization: 'Bearer ' + token },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          result.ok = true
          result.user = res.data.data
          result.message = '连接正常'
        } else if (res.statusCode === 401) {
          result.loggedIn = false
          result.message = '登录已过期'
        } else {
          result.message = '服务器返回异常 (' + res.statusCode + ')'
        }
        resolve(result)
      },
      fail: (err) => {
        const errMsg = (err && err.errMsg) || ''
        result.message = errMsg.includes('timeout') ? '请求超时' : '服务器不可访问'
        resolve(result)
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
