<template>
  <view class="login-page">
    <view class="login-header">
      <view class="app-icon">📖</view>
      <text class="app-name">自律小站</text>
      <text class="app-desc">登录后同步你的云笔记</text>
    </view>

    <view class="login-form">
      <view class="input-group">
        <text class="input-label">用户名</text>
        <input
          class="input-field"
          v-model="username"
          placeholder="请输入用户名"
          @confirm="handleLogin"
        />
      </view>

      <view class="input-group">
        <text class="input-label">密码</text>
        <input
          class="input-field"
          v-model="password"
          type="password"
          placeholder="请输入密码"
          @confirm="handleLogin"
        />
      </view>

      <button class="login-btn" :loading="loading" @click="handleLogin">
        登录
      </button>

      <view class="register-link" @tap="goRegister">
        <text>还没有账号？立即注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { login } from '../../api/auth'
import { isLogin, setToken, setUserInfo } from '../../utils/auth'

const username = ref('')
const password = ref('')
const loading = ref(false)

onMounted(() => {
  if (isLogin()) {
    goHome()
  }
})

async function handleLogin() {
  if (!username.value.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!password.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  loading.value = true
  console.log('[login] start, loading=true')
  // 安全超时：20 秒后强制关闭 loading
  const safetyTimer = setTimeout(() => {
    if (loading.value) {
      console.warn('[login] safety timeout, force loading=false')
      loading.value = false
      uni.showToast({ title: '请求超时，请重试', icon: 'none' })
    }
  }, 20000)
  try {
    const res = await login({
      username: username.value.trim(),
      password: password.value
    })
    console.log('[login] success', JSON.stringify(res.data).substring(0, 100))
    setToken(res.data.token)
    setUserInfo(res.data.user)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => goHome(), 500)
  } catch (e) {
    console.error('[login] catch', JSON.stringify(e))
    // request.js 已处理 toast
  } finally {
    clearTimeout(safetyTimer)
    console.log('[login] finally, loading=false')
    loading.value = false
  }
}

function goRegister() {
  uni.redirectTo({ url: '/pages/register/register' })
}

function goHome() {
  uni.switchTab({
    url: '/pages/todo/todo',
    fail() {
      uni.reLaunch({ url: '/pages/todo/todo' })
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0b4aa2 0%, #1565c0 50%, #1976d2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 160rpx;
  margin-bottom: 80rpx;
}

.app-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16rpx;
}

.app-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.login-form {
  width: 100%;
  background: #fff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.15);
}

.input-group {
  margin-bottom: 40rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.input-field {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #0b4aa2;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: #0b4aa2;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 12rpx;
  border: none;
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn::after {
  border: none;
}

.register-link {
  text-align: center;
  margin-top: 28rpx;
  padding: 16rpx 0;
}

.register-link text {
  font-size: 26rpx;
  color: #0b4aa2;
}
</style>
