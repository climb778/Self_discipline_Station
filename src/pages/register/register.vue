<template>
  <view class="register-page">
    <view class="register-header">
      <view class="app-icon">📖</view>
      <text class="app-name">注册账号</text>
      <text class="app-desc">邀请码注册，同步云笔记</text>
    </view>

    <view class="register-form">
      <view class="input-group">
        <text class="input-label">用户名</text>
        <input
          class="input-field"
          v-model="form.username"
          placeholder="3-20位，字母数字下划线"
          @confirm="handleRegister"
        />
      </view>

      <view class="input-group">
        <text class="input-label">昵称 <text class="optional">（选填）</text></text>
        <input
          class="input-field"
          v-model="form.nickname"
          placeholder="不填则使用用户名"
          @confirm="handleRegister"
        />
      </view>

      <view class="input-group">
        <text class="input-label">密码</text>
        <input
          class="input-field"
          v-model="form.password"
          type="password"
          placeholder="至少 6 位"
          @confirm="handleRegister"
        />
      </view>

      <view class="input-group">
        <text class="input-label">确认密码</text>
        <input
          class="input-field"
          v-model="form.confirmPassword"
          type="password"
          placeholder="再次输入密码"
          @confirm="handleRegister"
        />
      </view>

      <view class="input-group">
        <text class="input-label">邀请码</text>
        <input
          class="input-field"
          v-model="form.inviteCode"
          placeholder="请输入邀请码"
          @confirm="handleRegister"
        />
      </view>

      <button class="register-btn" :loading="loading" @click="handleRegister">
        注册
      </button>

      <view class="login-link" @tap="goLogin">
        <text>已有账号？返回登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { register } from '../../api/auth'
import { isLogin, setToken, setUserInfo } from '../../utils/auth'

const form = ref({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  inviteCode: ''
})
const loading = ref(false)

onMounted(() => {
  if (isLogin()) {
    goHome()
  }
})

async function handleRegister() {
  const f = form.value
  if (!f.username.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.username.trim())) {
    uni.showToast({ title: '用户名只允许字母、数字、下划线', icon: 'none' })
    return
  }
  if (f.password.length < 6) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' })
    return
  }
  if (f.password !== f.confirmPassword) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return
  }
  if (!f.inviteCode.trim()) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const res = await register({
      username: f.username.trim(),
      nickname: f.nickname.trim(),
      password: f.password,
      confirmPassword: f.confirmPassword,
      inviteCode: f.inviteCode.trim()
    })
    setToken(res.data.token)
    setUserInfo(res.data.user)
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => goHome(), 500)
  } catch (e) {
    // request.js 已处理 toast
  } finally {
    loading.value = false
  }
}

function goLogin() {
  uni.redirectTo({ url: '/pages/login/login' })
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
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0b4aa2 0%, #1565c0 50%, #1976d2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100rpx;
  margin-bottom: 60rpx;
}

.app-icon {
  font-size: 72rpx;
  margin-bottom: 16rpx;
}

.app-name {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
}

.app-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
}

.register-form {
  width: 100%;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.15);
}

.input-group {
  margin-bottom: 32rpx;
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 600;
}

.optional {
  font-weight: 400;
  color: #999;
  font-size: 22rpx;
}

.input-field {
  width: 100%;
  height: 84rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #0b4aa2;
}

.register-btn {
  width: 100%;
  height: 88rpx;
  background: #0b4aa2;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 12rpx;
  border: none;
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-btn::after {
  border: none;
}

.login-link {
  text-align: center;
  margin-top: 28rpx;
  padding: 16rpx 0;
}

.login-link text {
  font-size: 26rpx;
  color: #0b4aa2;
}
</style>
