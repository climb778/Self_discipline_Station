<template>
  <view class="page-shell" :class="themeClass">
    <view class="hero-card user-card">
      <view class="settings-entry" @tap="goSettings">设置</view>
      <image v-if="user.avatar" class="avatar-img" :src="user.avatar" mode="aspectFill" />
      <view v-else class="avatar">{{ avatarText }}</view>
      <view class="user-info">
        <text class="name">{{ authNickname || user.nickname }}</text>
        <text class="sign">{{ user.signature }}</text>
        <view class="user-meta">
          <text>Lv.{{ level }}</text>
          <text>总完成率 {{ totalRate }}%</text>
        </view>
      </view>
    </view>

    <text class="section-title">最近 7 天完成趋势</text>
    <view class="trend-card card">
      <view class="trend-bars">
        <view v-for="item in trend" :key="item.date" class="trend-col">
          <view class="trend-bar-wrap">
            <view class="trend-bar" :style="{ height: barHeight(item.count) }"></view>
          </view>
          <text class="trend-count">{{ item.count || '' }}</text>
          <text class="trend-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <text class="section-title">行动仪表盘</text>
    <view class="dashboard">
      <StatCard label="总体完成率" :value="`${totalRate}%`" />
      <StatCard label="累计任务" :value="activeTasks.length" />
      <StatCard label="连续打卡" :value="`${continuousDays}天`" />
      <StatCard label="已完成" :value="completedCount" />
    </view>

    <view class="dashboard extra-stats">
      <StatCard label="本周完成" :value="weeklyCount" />
      <StatCard label="本月完成" :value="monthlyCount" />
      <StatCard label="最长连续" :value="`${longestStreak}天`" />
      <StatCard label="最常用分类" :value="mostCategory" />
    </view>

    <text class="section-title">我的成就</text>
    <view class="achievement-grid">
      <view
        v-for="item in achievements"
        :key="item.id"
        class="achievement-card card"
        :class="{ unlocked: item.unlocked }"
        @tap="showAchievement(item)"
      >
        <text class="achievement-icon">{{ item.unlocked ? '★' : '☆' }}</text>
        <text class="achievement-name">{{ item.name }}</text>
        <text class="achievement-progress">{{ Math.min(item.progress, item.target) }}/{{ item.target }}</text>
      </view>
    </view>

    <text class="section-title">专注统计</text>
    <view class="dashboard">
      <StatCard label="今日专注" :value="`${todayFocusMinutes}分`" />
      <StatCard label="本周专注" :value="`${weekFocusMinutes}分`" />
      <StatCard label="累计专注" :value="`${totalFocusMinutes}分`" />
      <StatCard label="专注次数" :value="totalFocusCount" />
    </view>

    <text class="section-title">学习记录</text>
    <view class="study-overview card" @tap="goStudyLog">
      <view class="study-stats-row">
        <view class="ss-item">
          <text class="ss-num">{{ todayStudyMinutes }}</text>
          <text class="ss-label">今日(分)</text>
        </view>
        <view class="ss-divider"></view>
        <view class="ss-item">
          <text class="ss-num">{{ weekStudyMinutes }}</text>
          <text class="ss-label">本周(分)</text>
        </view>
        <view class="ss-divider"></view>
        <view class="ss-item">
          <text class="ss-num">{{ totalStudyCount }}</text>
          <text class="ss-label">累计记录</text>
        </view>
        <view class="ss-divider"></view>
        <view class="ss-item">
          <text class="ss-num">{{ recentStudySubject }}</text>
          <text class="ss-label">最近科目</text>
        </view>
      </view>
    </view>

    <text class="section-title">目标计划</text>
    <view class="plan-overview card" @tap="goPlans">
      <view v-if="mostImportantPlan" class="mip-row">
        <text class="mip-label">当前最重要</text>
        <text class="mip-name">{{ mostImportantPlan.title }}</text>
        <text class="mip-rate">{{ mostImportantPlanRate }}%</text>
      </view>
      <view v-else class="mip-row">
        <text class="mip-label">暂无进行中计划</text>
      </view>
      <view class="plan-stats-row">
        <view class="ps-item">
          <text class="ps-num">{{ activePlanCount }}</text>
          <text class="ps-label">进行中</text>
        </view>
        <view class="ps-divider"></view>
        <view class="ps-item">
          <text class="ps-num">{{ completedPlanCount }}</text>
          <text class="ps-label">已完成</text>
        </view>
        <view class="ps-divider"></view>
        <view class="ps-item">
          <text class="ps-num">{{ planCompletionRate }}%</text>
          <text class="ps-label">完成率</text>
        </view>
        <view class="ps-divider"></view>
        <view class="ps-item">
          <text class="ps-num">{{ allPlans.length }}</text>
          <text class="ps-label">总计划</text>
        </view>
      </view>
    </view>

    <text class="section-title">快捷入口</text>
    <view class="quick-row">
      <view class="quick card" @tap="goAdd">
        <text class="quick-icon">+</text>
        <text>新增任务</text>
      </view>
      <view class="quick card" @tap="goTodo">
        <text class="quick-icon">✓</text>
        <text>今日待办</text>
      </view>
      <view class="quick card" @tap="goFocus">
        <text class="quick-icon">⏱</text>
        <text>开始专注</text>
      </view>
      <view class="quick card" @tap="goPlans">
        <text class="quick-icon">🎯</text>
        <text>目标计划</text>
      </view>
      <view class="quick card" @tap="goReport">
        <text class="quick-icon">📊</text>
        <text>数据报告</text>
      </view>
      <view class="quick card" @tap="goRecords">
        <text class="quick-icon">⌕</text>
        <text>过往记录</text>
      </view>
      <view class="quick card" @tap="goAiPlan">
        <text class="quick-icon">✦</text>
        <text>智能计划</text>
      </view>
    </view>

    <text class="section-title">任务概览</text>
    <view class="overview card">
      <view class="overview-line">
        <text>未完成</text>
        <text>{{ todoCount }} 个</text>
      </view>
      <view class="overview-line">
        <text>已过期</text>
        <text>{{ overdueCount }} 个</text>
      </view>
      <view class="overview-line">
        <text>常用分类</text>
        <text>{{ categoryText }}</text>
      </view>
    </view>

    <view class="auth-section card" v-if="authUser">
      <view class="auth-row" @tap="goChangePassword">
        <text>修改密码</text>
        <text class="auth-arrow">›</text>
      </view>
      <view class="auth-row auth-logout" @tap="handleLogout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import StatCard from '../../components/StatCard.vue'
import { getAchievements } from '../../utils/achievements'
import { applyThemeChrome, generateRepeatTasks, getSettings, getTasks, getThemeClass, getUser } from '../../utils/storage'
import { getFocusRecords, getTodayFocusMinutes, getWeekFocusMinutes, getTotalFocusStats } from '../../utils/focus'
import { getPlans, getActivePlans, getCompletedPlans, getPlanStats, getMostImportantPlan } from '../../utils/plans'
import { getStudyLogs, getTodayStudyMinutes, getWeekStudyMinutes, getRecentSubject } from '../../utils/studyLogs'
import { getUserInfo, logout } from '../../utils/auth'
import {
  getActiveTasks,
  getCategorySummary,
  getContinuousCheckin,
  getOverdueTasks,
  getRate,
  get7DayTrend,
  getWeeklyCompletedCount,
  getMonthlyCompletedCount,
  getLongestStreak,
  getMostUsedCategory
} from '../../utils/tasks'

const tasks = ref([])
const focusRecords = ref([])
const allPlans = ref([])
const studyLogs = ref([])
const themeClass = ref(getThemeClass())
const user = reactive(getUser())
const authUser = computed(() => getUserInfo())
const authNickname = computed(() => authUser.value?.nickname || '')

const activeTasks = computed(() => getActiveTasks(tasks.value))
const completedCount = computed(() => activeTasks.value.filter(task => task.isCompleted).length)
const todoCount = computed(() => activeTasks.value.length - completedCount.value)
const overdueCount = computed(() => getOverdueTasks(tasks.value).length)
const totalRate = computed(() => getRate(completedCount.value, activeTasks.value.length))
const continuousDays = computed(() => getContinuousCheckin(tasks.value))
const level = computed(() => Math.max(1, Math.floor(completedCount.value / 5) + 1))
const avatarText = computed(() => (user.nickname || '自').slice(0, 1))
const categoryText = computed(() => {
  const summary = getCategorySummary(tasks.value)
  return summary.length ? summary.map(item => item.category).join('、') : '暂无'
})

const trend = computed(() => get7DayTrend(tasks.value))
const weeklyCount = computed(() => getWeeklyCompletedCount(tasks.value))
const monthlyCount = computed(() => getMonthlyCompletedCount(tasks.value))
const longestStreak = computed(() => getLongestStreak(tasks.value))
const mostCategory = computed(() => getMostUsedCategory(tasks.value))
const achievements = computed(() => getAchievements(tasks.value))

const todayFocusMinutes = computed(() => getTodayFocusMinutes(focusRecords.value))
const weekFocusMinutes = computed(() => getWeekFocusMinutes(focusRecords.value))
const totalFocusStats = computed(() => getTotalFocusStats(focusRecords.value))
const totalFocusMinutes = computed(() => totalFocusStats.value.totalMinutes)
const totalFocusCount = computed(() => totalFocusStats.value.totalCount)

const activePlanCount = computed(() => getActivePlans(allPlans.value).length)
const completedPlanCount = computed(() => getCompletedPlans(allPlans.value).length)
const planCompletionRate = computed(() => {
  const nonStopped = allPlans.value.filter(p => p.status !== 'stopped')
  if (nonStopped.length === 0) return 0
  const rates = nonStopped.map(p => getPlanStats(p.id, tasks.value).rate)
  return Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
})
const mostImportantPlan = computed(() => getMostImportantPlan(allPlans.value, tasks.value))
const mostImportantPlanRate = computed(() => {
  if (!mostImportantPlan.value) return 0
  return getPlanStats(mostImportantPlan.value.id, tasks.value).rate
})

const todayStudyMinutes = computed(() => getTodayStudyMinutes(studyLogs.value))
const weekStudyMinutes = computed(() => getWeekStudyMinutes(studyLogs.value))
const totalStudyCount = computed(() => studyLogs.value.length)
const recentStudySubject = computed(() => getRecentSubject(studyLogs.value))

const maxTrendCount = computed(() => Math.max(...trend.value.map(item => item.count), 1))

function barHeight(count) {
  if (!count) return '8rpx'
  const percent = Math.round((count / maxTrendCount.value) * 100)
  return `${Math.max(percent, 12)}%`
}

function loadData() {
  generateRepeatTasks()
  tasks.value = getTasks()
  focusRecords.value = getFocusRecords()
  allPlans.value = getPlans()
  studyLogs.value = getStudyLogs()
  Object.assign(user, getUser())
  themeClass.value = getThemeClass()
  applyThemeChrome(getSettings().theme)
}

function showAchievement(item) {
  const unlockedText = item.unlockedAt ? `\n解锁时间：${formatDateTime(item.unlockedAt)}` : ''
  uni.showModal({
    title: item.name,
    content: `${item.condition}\n当前进度：${item.progress}/${item.target}${unlockedText}`,
    showCancel: false
  })
}

function formatDateTime(value) {
  const date = new Date(value)
  const pad = item => String(item).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function goSettings() {
  uni.navigateTo({
    url: '/pages/settings/settings'
  })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后需要重新登录才能同步云笔记',
    success(res) {
      if (res.confirm) {
        logout()
      }
    }
  })
}

function goChangePassword() {
  uni.navigateTo({ url: '/pages/change-password/change-password' })
}

function goAdd() {
  uni.navigateTo({
    url: '/pages/task-form/task-form'
  })
}

function goTodo() {
  uni.switchTab({
    url: '/pages/todo/todo'
  })
}

function goRecords() {
  uni.switchTab({
    url: '/pages/records/records'
  })
}

function goFocus() {
  uni.navigateTo({
    url: '/pages/focus/focus'
  })
}

function goReport() {
  uni.navigateTo({
    url: '/pages/report/report'
  })
}

function goPlans() {
  uni.navigateTo({
    url: '/pages/plans/plans'
  })
}

function goAiPlan() {
  uni.navigateTo({
    url: '/pages/ai-plan/ai-plan'
  })
}

function goStudyLog() {
  uni.navigateTo({ url: '/pages/study-log/study-log' })
}

onShow(loadData)
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.settings-entry {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 24rpx;
  background: rgba(255, 255, 255, 0.18);
}

.avatar,
.avatar-img {
  flex: 0 0 auto;
  width: 116rpx;
  height: 116rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.34);
  border-radius: 50%;
}

.avatar {
  text-align: center;
  font-size: 48rpx;
  font-weight: 800;
  line-height: 108rpx;
  background: rgba(255, 255, 255, 0.18);
}

.user-info {
  flex: 1;
  min-width: 0;
  padding-right: 84rpx;
}

.name,
.sign {
  display: block;
}

.name {
  font-size: 36rpx;
  font-weight: 800;
}

.sign {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.user-meta text {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 23rpx;
  background: rgba(255, 255, 255, 0.16);
}

.trend-card {
  padding: 28rpx 16rpx 20rpx;
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 0;
}

.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trend-bar-wrap {
  width: 40rpx;
  height: 180rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 100%;
  min-height: 8rpx;
  border-radius: 10rpx 10rpx 4rpx 4rpx;
  background: linear-gradient(180deg, var(--theme-primary), var(--theme-secondary));
  transition: height 0.3s ease;
}

.trend-count {
  min-height: 30rpx;
  margin-top: 10rpx;
  color: var(--theme-primary);
  font-size: 22rpx;
  font-weight: 700;
}

.trend-label {
  margin-top: 6rpx;
  color: #8491a5;
  font-size: 22rpx;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.extra-stats {
  margin-top: 18rpx;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.achievement-card {
  padding: 24rpx 18rpx;
  text-align: center;
  opacity: 0.58;
  filter: grayscale(1);
}

.achievement-card.unlocked {
  opacity: 1;
  filter: none;
  background: var(--theme-soft);
}

.achievement-icon {
  display: block;
  color: var(--theme-primary);
  font-size: 44rpx;
}

.achievement-name {
  display: block;
  margin-top: 8rpx;
  color: #172033;
  font-size: 28rpx;
  font-weight: 800;
}

.achievement-progress {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 23rpx;
}

.quick-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.quick {
  padding: 26rpx 12rpx;
  text-align: center;
  color: #172033;
  font-size: 25rpx;
  font-weight: 700;
}

.quick-icon {
  display: block;
  width: 62rpx;
  height: 62rpx;
  margin: 0 auto 14rpx;
  border-radius: 24rpx;
  color: #fff;
  font-size: 38rpx;
  line-height: 58rpx;
  background: var(--theme-primary);
}

.overview {
  padding: 8rpx 28rpx;
}

.overview-line {
  display: flex;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #edf2f8;
  color: #172033;
  font-size: 28rpx;
}

.overview-line:last-child {
  border-bottom: 0;
}

.overview-line text:last-child {
  color: var(--theme-primary);
  font-weight: 800;
}

.plan-overview {
  padding: 24rpx 28rpx;
}

.plan-overview:active {
  transform: scale(0.98);
}

.mip-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 20rpx;
}

.mip-label {
  color: #8491a5;
  font-size: 24rpx;
}

.mip-name {
  flex: 1;
  color: #172033;
  font-size: 28rpx;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mip-rate {
  color: var(--theme-primary);
  font-size: 28rpx;
  font-weight: 800;
}

.plan-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 18rpx;
  border-top: 1rpx solid #edf2f8;
}

.ps-item {
  text-align: center;
}

.ps-num {
  display: block;
  color: #172033;
  font-size: 30rpx;
  font-weight: 800;
}

.ps-label {
  display: block;
  margin-top: 6rpx;
  color: #8491a5;
  font-size: 22rpx;
}

.ps-divider {
  width: 1rpx;
  height: 40rpx;
  background: #edf2f8;
}

.study-overview {
  padding: 24rpx 28rpx;
}

.study-overview:active {
  transform: scale(0.98);
}

.study-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.ss-item {
  text-align: center;
}

.ss-num {
  display: block;
  color: #172033;
  font-size: 30rpx;
  font-weight: 800;
}

.ss-label {
  display: block;
  margin-top: 6rpx;
  color: #8491a5;
  font-size: 22rpx;
}

.ss-divider {
  width: 1rpx;
  height: 40rpx;
  background: #edf2f8;
}

.auth-section {
  margin-top: 24rpx;
  padding: 0;
  overflow: hidden;
}

.auth-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  font-size: 28rpx;
  color: #172033;
  border-bottom: 1rpx solid #edf2f8;
}

.auth-row:last-child {
  border-bottom: none;
}

.auth-arrow {
  color: #b0b8c4;
  font-size: 32rpx;
}

.auth-logout {
  color: #e64340;
  justify-content: center;
  font-weight: 600;
}
</style>
