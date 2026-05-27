<template>
  <view class="page-shell" :class="themeClass">
    <view v-if="!plan" class="empty-wrap">
      <EmptyState title="计划不存在" text="该计划可能已被删除" />
    </view>

    <template v-else>
      <view class="hero-card plan-hero">
        <view class="plan-status-row">
          <text class="plan-cat-tag">{{ plan.category }}</text>
          <text class="plan-status" :class="`status-${plan.status}`">{{ statusText }}</text>
        </view>
        <text class="plan-title">{{ plan.title }}</text>
        <text v-if="plan.description" class="plan-desc">{{ plan.description }}</text>
        <view class="plan-dates">
          <text>{{ plan.startDate }} 开始</text>
          <text v-if="plan.endDate">{{ plan.endDate }} 结束</text>
          <text v-else>{{ plan.targetDays }} 天目标</text>
        </view>
      </view>

      <text class="section-title">执行进度</text>
      <view class="progress-card card">
        <view class="progress-bar-wrap">
          <view class="progress-bar-bg">
            <view class="progress-bar" :style="{ width: stats.rate + '%' }"></view>
          </view>
          <text class="progress-rate">{{ stats.rate }}%</text>
        </view>
        <view class="progress-stats">
          <view class="ps-item">
            <text class="ps-num">{{ stats.total }}</text>
            <text class="ps-label">总任务</text>
          </view>
          <view class="ps-divider"></view>
          <view class="ps-item">
            <text class="ps-num">{{ stats.completed }}</text>
            <text class="ps-label">已完成</text>
          </view>
          <view class="ps-divider"></view>
          <view class="ps-item">
            <text class="ps-num">{{ focusText }}</text>
            <text class="ps-label">专注时长</text>
          </view>
          <view class="ps-divider"></view>
          <view class="ps-item">
            <text class="ps-num">{{ remainingText }}</text>
            <text class="ps-label">剩余天数</text>
          </view>
        </view>
      </view>

      <text class="section-title">关联任务</text>
      <view v-if="planTasks.length" class="task-list">
        <TaskItem
          v-for="task in planTasks"
          :key="task.id"
          :task="task"
          :show-status="true"
          @toggle="handleToggle"
          @open="goTaskDetail"
        />
      </view>
      <view v-else class="card empty-task-card">
        <text class="muted">暂无关联任务</text>
      </view>

      <view class="add-task-wrap">
        <button class="primary-button add-task-btn" @tap="goAddTask">为此计划添加任务</button>
      </view>

      <text class="section-title">操作</text>
      <view class="action-card card">
        <view class="action-row" @tap="goEdit">
          <text class="action-icon">✏️</text>
          <text class="action-text">编辑计划</text>
          <text class="action-arrow">›</text>
        </view>
        <view v-if="plan.status === 'active'" class="action-row" @tap="confirmComplete">
          <text class="action-icon">✅</text>
          <text class="action-text">标记为已完成</text>
          <text class="action-arrow">›</text>
        </view>
        <view v-if="plan.status === 'active'" class="action-row" @tap="confirmStop">
          <text class="action-icon">⏸</text>
          <text class="action-text">暂停计划</text>
          <text class="action-arrow">›</text>
        </view>
        <view v-if="plan.status !== 'active'" class="action-row" @tap="confirmResume">
          <text class="action-icon">▶️</text>
          <text class="action-text">重新激活</text>
          <text class="action-arrow">›</text>
        </view>
        <view class="action-row danger" @tap="confirmDelete">
          <text class="action-icon">🗑</text>
          <text class="action-text">删除计划</text>
          <text class="action-arrow">›</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import EmptyState from '../../components/EmptyState.vue'
import TaskItem from '../../components/TaskItem.vue'
import { getTasks, getThemeClass, generateRepeatTasks, toggleTask } from '../../utils/storage'
import { getFocusRecords } from '../../utils/focus'
import { getPlanById, setPlanStatus, deletePlan, getPlanStats, getPlanRemainingDays, getPlanFocusMinutesByTasks, getPlanTasks } from '../../utils/plans'

const planId = ref('')
const plan = ref(null)
const tasks = ref([])
const focusRecords = ref([])
const themeClass = ref(getThemeClass())

const stats = computed(() => getPlanStats(planId.value, tasks.value))

const planTasks = computed(() => getPlanTasks(planId.value, tasks.value))

const focusMinutes = computed(() => getPlanFocusMinutesByTasks(planId.value, tasks.value, focusRecords.value))

const focusText = computed(() => {
  const m = focusMinutes.value
  if (m === 0) return '0'
  if (m < 60) return `${m}分`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}时${rem}分` : `${h}时`
})

const remainingText = computed(() => {
  if (!plan.value) return '-'
  const days = getPlanRemainingDays(plan.value)
  if (days < 0) return '未设'
  return `${days}`
})

const statusText = computed(() => {
  if (!plan.value) return ''
  const map = { active: '进行中', completed: '已完成', stopped: '已暂停' }
  return map[plan.value.status] || plan.value.status
})

function handleToggle(taskId) {
  toggleTask(taskId)
  tasks.value = getTasks()
}

function goTaskDetail(taskId) {
  uni.navigateTo({ url: `/pages/task-detail/task-detail?id=${taskId}` })
}

function goEdit() {
  uni.navigateTo({ url: `/pages/plan-form/plan-form?id=${planId.value}` })
}

function goAddTask() {
  uni.navigateTo({ url: `/pages/task-form/task-form?planId=${planId.value}` })
}

function confirmComplete() {
  uni.showModal({
    title: '完成计划',
    content: `确定将「${plan.value.title}」标记为已完成吗？`,
    success: res => {
      if (!res.confirm) return
      setPlanStatus(planId.value, 'completed')
      plan.value = getPlanById(planId.value)
      uni.showToast({ title: '已标记完成', icon: 'success' })
    }
  })
}

function confirmStop() {
  uni.showModal({
    title: '暂停计划',
    content: `确定暂停「${plan.value.title}」吗？`,
    success: res => {
      if (!res.confirm) return
      setPlanStatus(planId.value, 'stopped')
      plan.value = getPlanById(planId.value)
      uni.showToast({ title: '已暂停', icon: 'none' })
    }
  })
}

function confirmResume() {
  setPlanStatus(planId.value, 'active')
  plan.value = getPlanById(planId.value)
  uni.showToast({ title: '已重新激活', icon: 'success' })
}

function confirmDelete() {
  uni.showModal({
    title: '删除计划',
    content: `确定删除「${plan.value.title}」吗？关联的任务不会被删除。`,
    confirmText: '删除',
    confirmColor: '#e84f4f',
    success: res => {
      if (!res.confirm) return
      deletePlan(planId.value)
      uni.showToast({ title: '已删除', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 350)
    }
  })
}

function loadData() {
  generateRepeatTasks()
  tasks.value = getTasks()
  focusRecords.value = getFocusRecords()
  themeClass.value = getThemeClass()
  if (planId.value) {
    plan.value = getPlanById(planId.value)
  }
}

onLoad(options => {
  if (!options?.id) return
  planId.value = options.id
})

onShow(loadData)
</script>

<style scoped>
.plan-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.plan-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.plan-cat-tag {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: rgba(255, 255, 255, 0.9);
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
}

.plan-status {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.status-active {
  color: #fff;
  background: rgba(41, 191, 127, 0.35);
}

.status-completed {
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
}

.status-stopped {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.12);
}

.plan-title {
  font-size: 38rpx;
  font-weight: 800;
}

.plan-desc {
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
  line-height: 1.5;
}

.plan-dates {
  display: flex;
  gap: 24rpx;
  margin-top: 8rpx;
}

.plan-dates text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 23rpx;
}

.empty-wrap {
  margin-top: 40rpx;
}

.progress-card {
  padding: 28rpx;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar-bg {
  flex: 1;
  overflow: hidden;
  height: 18rpx;
  border-radius: 18rpx;
  background: #eaf1fb;
}

.progress-bar {
  height: 100%;
  border-radius: 18rpx;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  transition: width 0.3s ease;
  min-width: 8rpx;
}

.progress-rate {
  flex: 0 0 auto;
  color: var(--theme-primary);
  font-size: 28rpx;
  font-weight: 800;
}

.progress-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #edf2f8;
}

.ps-item {
  text-align: center;
}

.ps-num {
  display: block;
  color: #172033;
  font-size: 34rpx;
  font-weight: 800;
}

.ps-label {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 22rpx;
}

.ps-divider {
  width: 1rpx;
  height: 50rpx;
  background: #edf2f8;
}

.task-list {
  margin-top: 4rpx;
}

.empty-task-card {
  padding: 40rpx;
  text-align: center;
}

.add-task-wrap {
  margin-top: 18rpx;
}

.add-task-btn {
  height: 84rpx;
  font-size: 28rpx;
  line-height: 84rpx;
}

.action-card {
  padding: 8rpx 28rpx;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #edf2f8;
}

.action-row:last-child {
  border-bottom: 0;
}

.action-row:active {
  opacity: 0.7;
}

.action-icon {
  flex: 0 0 auto;
  font-size: 32rpx;
}

.action-text {
  flex: 1;
  color: #172033;
  font-size: 28rpx;
}

.action-row.danger .action-text {
  color: #e84f4f;
}

.action-arrow {
  flex: 0 0 auto;
  color: #c6d4e6;
  font-size: 36rpx;
}
</style>
