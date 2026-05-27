<template>
  <view class="page-shell" :class="themeClass">
    <view class="hero-card plans-hero">
      <text class="plans-title">目标计划</text>
      <text class="plans-sub">设定目标，坚持执行，见证成长</text>
    </view>

    <view v-if="!hasPlans" class="empty-wrap">
      <EmptyState title="暂无计划" text="点击右下角 + 创建你的第一个目标计划" />
    </view>

    <template v-else>
      <text v-if="activePlans.length" class="section-title">进行中</text>
      <view v-for="plan in activePlans" :key="plan.id" class="plan-card card" @tap="goDetail(plan.id)">
        <view class="plan-header">
          <view class="plan-info">
            <text class="plan-name">{{ plan.title }}</text>
            <text class="plan-desc">{{ plan.description }}</text>
          </view>
          <view class="plan-tag" :class="`cat-${plan.category}`">{{ plan.category }}</view>
        </view>
        <view class="plan-progress-wrap">
          <view class="plan-progress-bg">
            <view class="plan-progress-bar" :style="{ width: planStats(plan.id).rate + '%' }"></view>
          </view>
          <text class="plan-rate">{{ planStats(plan.id).rate }}%</text>
        </view>
        <view class="plan-meta">
          <text class="meta-item">{{ planStats(plan.id).completed }}/{{ planStats(plan.id).total }} 任务</text>
          <text class="meta-item">{{ planFocusText(plan.id) }}</text>
          <text class="meta-item">{{ remainingText(plan) }}</text>
        </view>
      </view>

      <text v-if="stoppedPlans.length" class="section-title">已暂停</text>
      <view v-for="plan in stoppedPlans" :key="plan.id" class="plan-card card stopped-card" @tap="goDetail(plan.id)">
        <view class="plan-header">
          <view class="plan-info">
            <text class="plan-name">{{ plan.title }}</text>
            <text class="plan-desc">{{ plan.description }}</text>
          </view>
          <text class="stopped-badge">已暂停</text>
        </view>
        <view class="plan-meta">
          <text class="meta-item">{{ planStats(plan.id).completed }}/{{ planStats(plan.id).total }} 任务</text>
          <text class="meta-item">{{ planFocusText(plan.id) }}</text>
        </view>
      </view>

      <text v-if="completedPlans.length" class="section-title">已完成</text>
      <view v-for="plan in completedPlans" :key="plan.id" class="plan-card card completed-card" @tap="goDetail(plan.id)">
        <view class="plan-header">
          <view class="plan-info">
            <text class="plan-name">{{ plan.title }}</text>
            <text class="plan-desc">{{ plan.description }}</text>
          </view>
          <text class="done-badge">已完成</text>
        </view>
        <view class="plan-meta">
          <text class="meta-item">{{ planStats(plan.id).completed }}/{{ planStats(plan.id).total }} 任务</text>
          <text class="meta-item">{{ planFocusText(plan.id) }}</text>
        </view>
      </view>
    </template>

    <view class="ai-entry-wrap">
      <button class="ai-entry-btn" @tap="goAiPlan">智能生成计划</button>
    </view>

    <view class="fab" @tap="goAdd">+</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '../../components/EmptyState.vue'
import { getTasks, getThemeClass, generateRepeatTasks } from '../../utils/storage'
import { getFocusRecords } from '../../utils/focus'
import { getPlans, getPlanStats, getPlanRemainingDays, getActivePlans, getCompletedPlans, getStoppedPlans, getPlanFocusMinutesByTasks } from '../../utils/plans'

const themeClass = ref(getThemeClass())
const plans = ref([])
const tasks = ref([])
const focusRecords = ref([])

const activePlans = computed(() => getActivePlans(plans.value))
const completedPlans = computed(() => getCompletedPlans(plans.value))
const stoppedPlans = computed(() => getStoppedPlans(plans.value))
const hasPlans = computed(() => plans.value.length > 0)

function planStats(planId) {
  return getPlanStats(planId, tasks.value)
}

function planFocusText(planId) {
  const minutes = getPlanFocusMinutesByTasks(planId, tasks.value, focusRecords.value)
  if (minutes === 0) return '暂无专注'
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} 时 ${m} 分` : `${h} 小时`
}

function remainingText(plan) {
  const days = getPlanRemainingDays(plan)
  if (days < 0) return '未设截止'
  if (days === 0) return '今日到期'
  return `剩余 ${days} 天`
}

function goDetail(planId) {
  uni.navigateTo({ url: `/pages/plan-detail/plan-detail?id=${planId}` })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/plan-form/plan-form' })
}

function goAiPlan() {
  uni.navigateTo({ url: '/pages/ai-plan/ai-plan' })
}

function loadData() {
  generateRepeatTasks()
  plans.value = getPlans()
  tasks.value = getTasks()
  focusRecords.value = getFocusRecords()
  themeClass.value = getThemeClass()
}

onShow(loadData)
</script>

<style scoped>
.plans-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.plans-title {
  font-size: 42rpx;
  font-weight: 800;
}

.plans-sub {
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
}

.empty-wrap {
  margin-top: 40rpx;
}

.plan-card {
  margin-top: 18rpx;
  padding: 28rpx;
}

.plan-card:active {
  transform: scale(0.98);
}

.completed-card {
  opacity: 0.72;
}

.stopped-card {
  opacity: 0.85;
}

.stopped-badge {
  flex: 0 0 auto;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: #d99616;
  font-size: 22rpx;
  font-weight: 700;
  background: #fff7e6;
}

.plan-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.plan-info {
  flex: 1;
  min-width: 0;
}

.plan-name {
  display: block;
  color: #172033;
  font-size: 30rpx;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-desc {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-tag {
  flex: 0 0 auto;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: var(--theme-primary);
  font-size: 22rpx;
  font-weight: 700;
  background: var(--theme-soft);
}

.done-badge {
  flex: 0 0 auto;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: #197a55;
  font-size: 22rpx;
  font-weight: 700;
  background: #e9f8f1;
}

.plan-progress-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 22rpx;
}

.plan-progress-bg {
  flex: 1;
  overflow: hidden;
  height: 14rpx;
  border-radius: 14rpx;
  background: #eaf1fb;
}

.plan-progress-bar {
  height: 100%;
  border-radius: 14rpx;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  transition: width 0.3s ease;
  min-width: 8rpx;
}

.plan-rate {
  flex: 0 0 auto;
  color: var(--theme-primary);
  font-size: 24rpx;
  font-weight: 800;
}

.plan-meta {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
}

.meta-item {
  color: #8491a5;
  font-size: 22rpx;
}

.ai-entry-wrap {
  margin-top: 24rpx;
  padding-bottom: 20rpx;
}

.ai-entry-btn {
  height: 88rpx;
  border-radius: 28rpx;
  color: var(--theme-primary);
  font-size: 30rpx;
  font-weight: 700;
  line-height: 88rpx;
  background: var(--theme-soft);
}
</style>
