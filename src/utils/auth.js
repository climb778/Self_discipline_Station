const TOKEN_KEY = 'SELF_DISCIPLINE_TOKEN'
const USER_KEY = 'SELF_DISCIPLINE_AUTH_USER'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

export function removeToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

export function getUserInfo() {
  return uni.getStorageSync(USER_KEY) || null
}

export function setUserInfo(user) {
  uni.setStorageSync(USER_KEY, user)
}

export function removeUserInfo() {
  uni.removeStorageSync(USER_KEY)
}

export function isLogin() {
  return !!getToken()
}

export function logout() {
  removeToken()
  removeUserInfo()
  uni.reLaunch({ url: '/pages/login/login' })
}
