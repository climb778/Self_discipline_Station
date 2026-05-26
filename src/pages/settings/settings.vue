<template>
  <view class="page-shell" :class="themeClass">
    <view class="hero-card settings-hero">
      <text class="settings-title">设置</text>
      <text class="settings-sub">管理你的资料、主题和本地数据</text>
    </view>

    <text class="section-title">个人信息设置</text>
    <view class="card form-card">
      <view class="avatar-line">
        <image v-if="userForm.avatar" class="avatar-img" :src="userForm.avatar" mode="aspectFill" />
        <view v-else class="avatar-fallback">{{ avatarText }}</view>
        <button class="mini-button" @tap="chooseAvatar">修改头像</button>
      </view>
      <view class="field">
        <text class="label">昵称</text>
        <input v-model.trim="userForm.nickname" class="input" placeholder="输入昵称" />
      </view>
      <view class="field">
        <text class="label">个性签名</text>
        <textarea v-model.trim="userForm.signature" class="textarea" placeholder="写一句鼓励自己的话" />
      </view>
      <button class="primary-button save-button" @tap="saveProfile">保存个人信息</button>
    </view>

    <text class="section-title">主题设置</text>
    <view class="card theme-card">
      <view
        v-for="item in themeOptions"
        :key="item.value"
        class="theme-option"
        :class="{ active: settingsForm.theme === item.value }"
        @tap="selectTheme(item.value)"
      >
        <view class="theme-dot" :style="{ background: item.primary }"></view>
        <text>{{ item.label }}</text>
      </view>
    </view>

    <text class="section-title">数据管理</text>
    <view class="card data-card">
      <view class="button-grid">
        <button class="soft-button" @tap="exportData">导出 JSON</button>
        <button class="soft-button" @tap="generateDemo">生成演示数据</button>
        <button class="danger-soft-button" @tap="confirmClear">清空全部数据</button>
      </view>
      <textarea v-model="dataText" class="data-textarea" placeholder="导出的 JSON 会显示在这里，也可以粘贴 JSON 后导入" />
      <button class="primary-button save-button" @tap="confirmImport">导入 JSON</button>
    </view>

    <text class="section-title">提醒设置</text>
    <view class="card remind-card">
      <view class="switch-line">
        <view>
          <text class="label">应用内提醒</text>
          <text class="hint">只在应用内展示提醒卡片，不做系统推送</text>
        </view>
        <switch :checked="settingsForm.enableReminder" :color="themeColor" @change="updateReminderSwitch" />
      </view>
    </view>

    <text class="section-title">专注设置</text>
    <view class="card focus-card">
      <view class="field">
        <text class="label">默认专注时长</text>
        <view class="focus-duration-grid">
          <view
            v-for="d in focusDurations"
            :key="d"
            class="focus-duration-chip"
            :class="{ active: settingsForm.defaultFocusDuration === d }"
            @tap="selectFocusDuration(d)"
          >
            <text>{{ d }} 分钟</text>
          </view>
        </view>
      </view>
      <view class="switch-line">
        <view>
          <text class="label">专注结束提示音</text>
          <text class="hint">专注完成时播放提示音（第一版仅保留开关）</text>
        </view>
        <switch :checked="settingsForm.enableFocusSound" :color="themeColor" @change="updateFocusSoundSwitch" />
      </view>
    </view>

    <text class="section-title">关于应用</text>
    <view class="card about-card">
      <view class="about-line">
        <text>应用名称</text>
        <text>自律小站</text>
      </view>
      <view class="about-line">
        <text>当前版本</text>
        <text>V1.4.1</text>
      </view>
      <view class="about-line">
        <text>数据位置</text>
        <text>本地存储</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  applyThemeChrome,
  clearAllData,
  exportAllData,
  generateDemoData,
  getSettings,
  getThemeClass,
  getThemeMeta,
  getUser,
  importAllData,
  saveSettings,
  saveUser,
  themeOptions,
  validateImportData
} from '../../utils/storage'

const userForm = reactive({
  nickname: '',
  signature: '',
  avatar: ''
})

const settingsForm = reactive({
  theme: 'blue',
  enableReminder: true,
  reminderLeadMinutes: 0,
  defaultFocusDuration: 25,
  enableFocusSound: false
})

const focusDurations = [15, 25, 45]

const themeClass = ref(getThemeClass())
const dataText = ref('')

const avatarText = computed(() => (userForm.nickname || '自').slice(0, 1))
const themeColor = computed(() => getThemeMeta(settingsForm.theme).primary)

function loadData() {
  Object.assign(userForm, getUser())
  Object.assign(settingsForm, getSettings())
  themeClass.value = getThemeClass(settingsForm.theme)
  applyThemeChrome(settingsForm.theme)
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: res => {
      userForm.avatar = res.tempFilePaths[0]
    }
  })
}

function saveProfile() {
  if (!userForm.nickname) {
    uni.showToast({
      title: '请填写昵称',
      icon: 'none'
    })
    return
  }
  saveUser({ ...userForm })
  uni.showToast({
    title: '已保存',
    icon: 'success'
  })
}

function selectTheme(theme) {
  settingsForm.theme = theme
  saveSettings({ ...settingsForm })
  themeClass.value = getThemeClass(theme)
  applyThemeChrome(theme)
}

function updateReminderSwitch(event) {
  settingsForm.enableReminder = event.detail.value
  saveSettings({ ...settingsForm })
}

function selectFocusDuration(d) {
  settingsForm.defaultFocusDuration = d
  saveSettings({ ...settingsForm })
}

function updateFocusSoundSwitch(event) {
  settingsForm.enableFocusSound = event.detail.value
  saveSettings({ ...settingsForm })
}

function exportData() {
  dataText.value = JSON.stringify(exportAllData(), null, 2)
  uni.setClipboardData({
    data: dataText.value,
    success: () => {
      uni.showToast({
        title: '已复制 JSON',
        icon: 'none'
      })
    }
  })
}

function confirmImport() {
  let parsed
  try {
    parsed = JSON.parse(dataText.value)
  } catch (error) {
    uni.showToast({
      title: 'JSON 格式不正确',
      icon: 'none'
    })
    return
  }
  const error = validateImportData(parsed)
  if (error) {
    uni.showToast({
      title: error,
      icon: 'none'
    })
    return
  }
  uni.showModal({
    title: '导入数据',
    content: '导入会覆盖当前本地数据，确定继续吗？',
    success: res => {
      if (!res.confirm) return
      importAllData(parsed)
      loadData()
      uni.showToast({
        title: '导入完成',
        icon: 'success'
      })
    }
  })
}

function confirmClear() {
  uni.showModal({
    title: '清空数据',
    content: '确定要清空全部本地数据吗？清空后无法恢复。',
    confirmText: '清空',
    confirmColor: '#e84f4f',
    success: res => {
      if (!res.confirm) return
      clearAllData()
      dataText.value = ''
      loadData()
      uni.showToast({
        title: '已清空',
        icon: 'none'
      })
    }
  })
}

function generateDemo() {
  uni.showModal({
    title: '生成演示数据',
    content: '演示数据会覆盖当前任务、用户和设置，确定继续吗？',
    success: res => {
      if (!res.confirm) return
      generateDemoData()
      loadData()
      uni.showToast({
        title: '已生成',
        icon: 'success'
      })
    }
  })
}

onShow(loadData)
</script>

<style scoped>
.settings-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.settings-title {
  font-size: 42rpx;
  font-weight: 800;
}

.settings-sub {
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
}

.form-card,
.data-card,
.theme-card,
.remind-card,
.focus-card,
.about-card {
  margin-top: 0;
}

.avatar-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.avatar-img,
.avatar-fallback {
  width: 112rpx;
  height: 112rpx;
  border-radius: 56rpx;
}

.avatar-fallback {
  color: #fff;
  text-align: center;
  font-size: 48rpx;
  font-weight: 800;
  line-height: 112rpx;
  background: var(--theme-primary);
}

.mini-button {
  width: 190rpx;
  height: 70rpx;
  margin: 0;
  border-radius: 22rpx;
  color: var(--theme-primary);
  font-size: 26rpx;
  line-height: 70rpx;
  background: var(--theme-soft);
}

.field {
  margin-bottom: 28rpx;
}

.label {
  display: block;
  color: #172033;
  font-size: 29rpx;
  font-weight: 700;
}

.hint {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 24rpx;
}

.input,
.textarea,
.data-textarea {
  box-sizing: border-box;
  width: 100%;
  margin-top: 16rpx;
  border-radius: 22rpx;
  color: #172033;
  font-size: 28rpx;
  background: #f3f7fc;
}

.input {
  height: 92rpx;
  padding: 0 24rpx;
}

.textarea {
  height: 150rpx;
  padding: 24rpx;
}

.save-button {
  margin-top: 18rpx;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx;
  border-radius: 22rpx;
  color: #66758c;
  background: #f3f7fc;
}

.theme-option.active {
  color: var(--theme-primary);
  font-weight: 800;
  background: var(--theme-soft);
}

.theme-dot {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.soft-button,
.danger-soft-button {
  height: 82rpx;
  border-radius: 24rpx;
  font-size: 27rpx;
  line-height: 82rpx;
}

.soft-button {
  color: var(--theme-primary);
  background: var(--theme-soft);
}

.danger-soft-button {
  color: #e84f4f;
  background: #fff0f0;
}

.data-textarea {
  height: 260rpx;
  padding: 20rpx;
  line-height: 1.45;
}

.switch-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.about-line {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #edf2f8;
  color: #172033;
  font-size: 27rpx;
}

.about-line:last-child {
  border-bottom: 0;
}

.about-line text:first-child {
  color: #8491a5;
}

.about-line text:last-child {
  color: var(--theme-primary);
  font-weight: 800;
}

.focus-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.focus-duration-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.focus-duration-chip {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 20rpx;
  text-align: center;
  color: #66758c;
  font-size: 27rpx;
  font-weight: 700;
  background: #f3f7fc;
}

.focus-duration-chip.active {
  color: #fff;
  background: var(--theme-primary);
}
</style>
