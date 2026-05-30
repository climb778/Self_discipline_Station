<template>
  <view class="page">
    <view class="form-card card">
      <view class="input-group">
        <text class="label">旧密码</text>
        <input class="input" v-model="oldPassword" type="password" placeholder="请输入旧密码" />
      </view>
      <view class="input-group">
        <text class="label">新密码</text>
        <input class="input" v-model="newPassword" type="password" placeholder="至少 6 位" />
      </view>
      <view class="input-group">
        <text class="label">确认新密码</text>
        <input class="input" v-model="confirmPassword" type="password" placeholder="再次输入新密码" />
      </view>
      <button class="submit-btn" :loading="loading" @click="handleSubmit">确认修改</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { changePassword } from '../../api/auth'
import { logout } from '../../utils/auth'

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!oldPassword.value) {
    uni.showToast({ title: '请输入旧密码', icon: 'none' })
    return
  }
  if (newPassword.value.length < 6) {
    uni.showToast({ title: '新密码至少 6 位', icon: 'none' })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
    return
  }

  loading.value = true
  try {
    await changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    })
    uni.showModal({
      title: '修改成功',
      content: '密码已修改，请重新登录',
      showCancel: false,
      success() {
        logout()
      }
    })
  } catch (e) {
    // request.js 已处理 toast
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f8fc;
  padding: 24rpx 32rpx;
}

.form-card {
  padding: 40rpx 32rpx;
}

.input-group {
  margin-bottom: 36rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 600;
}

.input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.input:focus {
  border-color: #0b4aa2;
}

.submit-btn {
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

.submit-btn::after {
  border: none;
}
</style>
