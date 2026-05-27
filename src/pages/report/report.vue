<template>
  <view class="page-shell" :class="themeClass">
    <view class="hero-card report-hero">
      <text class="report-title">数据报告</text>
      <text class="report-sub">复盘你的自律旅程</text>
    </view>

    <view class="period-tabs">
      <view class="period-tab" :class="{ active: period === 'week' }" @tap="period = 'week'">本周报告</view>
      <view class="period-tab" :class="{ active: period === 'month' }" @tap="period = 'month'">本月报告</view>
    </view>

    <view v-if="isEmpty" class="empty-wrap">
      <EmptyState title="暂无数据" text="完成任务或专注后，这里会展示你的数据报告" />
    </view>

    <view class="poster-entry-wrap">
      <button class="primary-button poster-entry-btn" @tap="goPoster">生成报告海报</button>
    </view>

    <template v-if="!isEmpty">
      <text class="section-title">核心数据</text>
      <view class="dashboard">
        <StatCard label="完成任务" :value="report.completedCount" />
        <StatCard label="新增任务" :value="report.newCount" />
        <StatCard label="过期任务" :value="report.overdueCount" />
        <StatCard label="完成率" :value="`${report.completionRate}%`" />
      </view>
      <view class="dashboard extra-dashboard">
        <StatCard label="专注分钟" :value="report.focusMinutes" />
        <StatCard label="专注次数" :value="report.focusCount" />
        <StatCard :label="period === 'week' ? '连续打卡' : '最长连续'" :value="`${streakDays}天`" />
        <StatCard label="最常分类" :value="report.topCategory" />
      </view>

      <text class="section-title">计划数据</text>
      <view class="dashboard">
        <StatCard label="推进计划数" :value="report.pushedPlanCount" />
        <StatCard label="计划任务完成" :value="report.planTaskCompleted" />
        <StatCard label="计划专注分钟" :value="report.planFocusMinutes" />
        <StatCard label="推进最快" :value="report.fastestPlan" />
      </view>

      <text class="section-title">学习数据</text>
      <view class="dashboard">
        <StatCard label="学习记录数" :value="report.studyLogCount" />
        <StatCard label="学习时长" :value="`${report.studyLogMinutes}分`" />
        <StatCard label="主要科目" :value="report.topStudySubject" />
      </view>

      <text class="section-title">最近 7 天任务完成趋势</text>
      <view class="trend-card card">
        <view v-if="taskTrendMax > 0" class="trend-bars">
          <view v-for="item in taskTrend" :key="item.date" class="trend-col">
            <view class="trend-bar-wrap">
              <view class="trend-bar" :style="{ height: trendBarHeight(item.count, taskTrendMax) }"></view>
            </view>
            <text class="trend-count">{{ item.count || '' }}</text>
            <text class="trend-label">{{ item.label }}</text>
          </view>
        </view>
        <view v-else class="trend-empty">
          <text class="muted">暂无完成记录</text>
        </view>
      </view>

      <text class="section-title">最近 7 天专注时长趋势</text>
      <view class="trend-card card">
        <view v-if="focusTrendMax > 0" class="trend-bars">
          <view v-for="item in focusTrend" :key="item.date" class="trend-col">
            <view class="trend-bar-wrap">
              <view class="trend-bar focus-bar" :style="{ height: trendBarHeight(item.minutes, focusTrendMax) }"></view>
            </view>
            <text class="trend-count">{{ item.minutes || '' }}</text>
            <text class="trend-label">{{ item.label }}</text>
          </view>
        </view>
        <view v-else class="trend-empty">
          <text class="muted">暂无专注记录</text>
        </view>
      </view>

      <text class="section-title">分类统计</text>
      <view class="card category-card">
        <view v-for="item in categoryStatsDisplay" :key="item.category" class="category-row">
          <view class="category-header">
            <text class="category-name">{{ item.category }}</text>
            <text class="category-num">{{ item.count }} 项 {{ item.percent }}%</text>
          </view>
          <view class="category-progress">
            <view class="category-progress-bar" :style="{ width: item.percent + '%' }"></view>
          </view>
        </view>
        <view v-if="!categoryStatsDisplay.length" class="trend-empty">
          <text class="muted">暂无分类数据</text>
        </view>
      </view>

      <text class="section-title">智能总结</text>
      <view class="card summary-card">
        <text class="summary-text">{{ report.summary }}</text>
      </view>

      <text class="section-title">报告卡片</text>
      <view class="card-wrapper">
        <view class="report-card hero-card">
          <text class="rc-brand">自律小站</text>
          <text class="rc-period">{{ period === 'week' ? '本周报告' : '本月报告' }}</text>
          <view class="rc-stats">
            <view class="rc-stat">
              <text class="rc-num">{{ report.completedCount }}</text>
              <text class="rc-label">完成任务</text>
            </view>
            <view class="rc-divider"></view>
            <view class="rc-stat">
              <text class="rc-num">{{ report.focusMinutes }}</text>
              <text class="rc-label">专注分钟</text>
            </view>
            <view class="rc-divider"></view>
            <view class="rc-stat">
              <text class="rc-num">{{ streakDays }}</text>
              <text class="rc-label">连续打卡</text>
            </view>
          </view>
          <text class="rc-category">最常分类：{{ report.topCategory }}</text>
          <text class="rc-quote">每一步坚持，都在靠近更好的自己</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '../../components/EmptyState.vue'
import StatCard from '../../components/StatCard.vue'
import { getTasks, getThemeClass, generateRepeatTasks } from '../../utils/storage'
import { getFocusRecords } from '../../utils/focus'
import { getPlans } from '../../utils/plans'
import { getStudyLogs } from '../../utils/studyLogs'
import { getWeeklyReport, getMonthlyReport, get7DayTaskTrend, get7DayFocusTrend } from '../../utils/report'

const themeClass = ref(getThemeClass())
const tasks = ref([])
const focusRecords = ref([])
const plans = ref([])
const studyLogs = ref([])
const period = ref('week')

const report = computed(() => {
  if (period.value === 'week') {
    return getWeeklyReport(tasks.value, focusRecords.value, plans.value, studyLogs.value)
  }
  return getMonthlyReport(tasks.value, focusRecords.value, plans.value, studyLogs.value)
})

const isEmpty = computed(() => {
  return report.value.completedCount === 0
    && report.value.newCount === 0
    && report.value.overdueCount === 0
    && report.value.focusCount === 0
    && report.value.pushedPlanCount === 0
    && report.value.planTaskCompleted === 0
    && report.value.studyLogCount === 0
})

const streakDays = computed(() => {
  return report.value.longestStreak || report.value.continuousDays
})

const taskTrend = computed(() => get7DayTaskTrend(tasks.value))
const taskTrendMax = computed(() => Math.max(...taskTrend.value.map(i => i.count), 0))

const focusTrend = computed(() => get7DayFocusTrend(focusRecords.value))
const focusTrendMax = computed(() => Math.max(...focusTrend.value.map(i => i.minutes), 0))

const categoryStatsDisplay = computed(() => {
  const stats = report.value.categoryStats || []
  const total = report.value.totalCompletedForCategory || 0
  if (!stats.length) return []
  return stats.map(item => ({
    ...item,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0
  }))
})

function trendBarHeight(value, max) {
  if (!value || !max) return '8rpx'
  const percent = Math.round((value / max) * 100)
  return `${Math.max(percent, 12)}%`
}

function loadData() {
  generateRepeatTasks()
  tasks.value = getTasks()
  focusRecords.value = getFocusRecords()
  plans.value = getPlans()
  studyLogs.value = getStudyLogs()
  themeClass.value = getThemeClass()
}

function goPoster() {
  uni.navigateTo({ url: `/pages/report-poster/report-poster?type=${period.value}` })
}

onShow(loadData)
</script>

<style scoped>
.report-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.report-title {
  font-size: 42rpx;
  font-weight: 800;
}

.report-sub {
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
}

.period-tabs {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.period-tab {
  flex: 1;
  padding: 24rpx 0;
  border-radius: 22rpx;
  text-align: center;
  color: #66758c;
  font-size: 28rpx;
  font-weight: 700;
  background: #f3f7fc;
}

.period-tab.active {
  color: #fff;
  background: var(--theme-primary);
}

.empty-wrap {
  margin-top: 40rpx;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
  margin-top: 16rpx;
}

.extra-dashboard {
  margin-top: 18rpx;
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

.trend-bar.focus-bar {
  background: linear-gradient(180deg, #29bf7f, #5ddba8);
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
  font-size: 20rpx;
}

.trend-empty {
  padding: 40rpx 0;
  text-align: center;
}

.category-card {
  padding: 24rpx;
}

.category-row {
  margin-bottom: 24rpx;
}

.category-row:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.category-name {
  color: #172033;
  font-size: 28rpx;
  font-weight: 700;
}

.category-num {
  color: #8491a5;
  font-size: 24rpx;
}

.category-progress {
  overflow: hidden;
  height: 16rpx;
  border-radius: 16rpx;
  background: #eaf1fb;
}

.category-progress-bar {
  height: 100%;
  border-radius: 16rpx;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  transition: width 0.3s ease;
  min-width: 8rpx;
}

.summary-card {
  padding: 28rpx;
}

.summary-text {
  color: #172033;
  font-size: 28rpx;
  line-height: 1.7;
}

.card-wrapper {
  padding-bottom: 40rpx;
}

.report-card {
  padding: 40rpx 32rpx;
  text-align: center;
}

.rc-brand {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  opacity: 0.7;
}

.rc-period {
  display: block;
  margin-top: 12rpx;
  font-size: 36rpx;
  font-weight: 800;
}

.rc-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 36rpx;
  gap: 24rpx;
}

.rc-stat {
  flex: 1;
  text-align: center;
}

.rc-num {
  display: block;
  font-size: 48rpx;
  font-weight: 800;
}

.rc-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  opacity: 0.7;
}

.rc-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.25);
}

.rc-category {
  display: block;
  margin-top: 28rpx;
  font-size: 24rpx;
  opacity: 0.7;
}

.rc-quote {
  display: block;
  margin-top: 20rpx;
  font-size: 24rpx;
  opacity: 0.6;
  font-style: italic;
}

.poster-entry-wrap {
  padding: 10rpx 0 40rpx;
}

.poster-entry-btn {
  height: 88rpx;
  font-size: 30rpx;
  line-height: 88rpx;
}
</style>
