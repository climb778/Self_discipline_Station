<template>
  <view class="page-shell" :class="themeClass">
    <view class="hero-card todo-hero">
      <view>
        <text class="hello">{{ greeting }}</text>
        <text class="date">{{ displayDate }}</text>
      </view>
      <view class="date-badge">
        <text class="day">{{ day }}</text>
        <text class="month">{{ month }}月</text>
      </view>
    </view>

    <view v-if="showReminder" class="reminder-card card">
      <view class="reminder-header">
        <text class="reminder-icon">🔔</text>
        <text class="reminder-title">今日提醒</text>
      </view>
      <view class="reminder-stats">
        <view class="reminder-item">
          <text class="reminder-num" :class="{ warn: uncompletedCount > 0 }">{{ uncompletedCount }}</text>
          <text class="reminder-label">未完成</text>
        </view>
        <view class="reminder-divider"></view>
        <view class="reminder-item">
          <text class="reminder-num" :class="{ danger: overdueCount > 0 }">{{ overdueCount }}</text>
          <text class="reminder-label">已过期</text>
        </view>
        <view class="reminder-divider"></view>
        <view class="reminder-item">
          <text class="reminder-num next">{{ nextReminderText }}</text>
          <text class="reminder-label">最近提醒</text>
        </view>
      </view>
    </view>

    <view class="rate-card card">
      <view>
        <text class="rate-label">今日完成率</text>
        <text class="rate-value">{{ todayRate }}%</text>
      </view>
      <view class="progress">
        <view class="progress-inner" :style="{ width: `${todayRate}%` }"></view>
      </view>
    </view>

    <view class="stats-grid">
      <StatCard label="全部任务" :value="todayTasks.length" />
      <StatCard label="已完成" :value="completedCount" />
      <StatCard label="待办任务" :value="todoCount" />
    </view>

    <text class="section-title">今日任务</text>
    <view v-for="task in todayTasks" :key="task.id" class="task-row">
      <TaskItem :task="task" @toggle="handleToggle" @open="goDetail" />
      <view v-if="!task.isCompleted" class="focus-entry" @tap.stop="goFocus(task.id)">
        <text>专注</text>
      </view>
    </view>
    <EmptyState v-if="!todayTasks.length" title="今日很清爽" text="添加一个小目标，给今天一个明确方向" />

    <view class="fab" @tap="goAdd">+</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TaskItem from '../../components/TaskItem.vue'
import StatCard from '../../components/StatCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import { getDisplayDate, getToday } from '../../utils/date'
import { generateRepeatTasks, getSettings, getTasks, getThemeClass, toggleTask } from '../../utils/storage'
import { getRate, getReminderInfo, getTodayTasks, getOverdueTasks } from '../../utils/tasks'

const tasks = ref([])
const themeClass = ref(getThemeClass())
const settings = ref(getSettings())

const now = new Date()
const day = String(now.getDate()).padStart(2, '0')
const month = now.getMonth() + 1
const displayDate = getDisplayDate(now)
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好，今天也稳稳向前'
  if (hour < 18) return '下午好，把节奏握在手里'
  return '晚上好，给今天一个漂亮收尾'
})

const todayTasks = computed(() => getTodayTasks(tasks.value, getToday()))
const completedCount = computed(() => todayTasks.value.filter(task => task.isCompleted).length)
const todoCount = computed(() => todayTasks.value.length - completedCount.value)
const todayRate = computed(() => getRate(completedCount.value, todayTasks.value.length))

const uncompletedCount = computed(() => todoCount.value)
const overdueCount = computed(() => getOverdueTasks(tasks.value).length)

const nextReminderText = computed(() => {
  const reminderTasks = todayTasks.value.filter(t => t.enableReminder && t.reminderTime && !t.isCompleted)
  if (!reminderTasks.length) return '无'
  const infos = reminderTasks
    .map(t => getReminderInfo(t))
    .filter(Boolean)
    .filter(info => !info.passed)
    .sort((a, b) => a.time.localeCompare(b.time))
  if (!infos.length) return '已过'
  return infos[0].text
})

const showReminder = computed(() => {
  return settings.value.enableReminder && (uncompletedCount.value > 0 || overdueCount.value > 0 || nextReminderText.value !== '无')
})

function loadTasks() {
  generateRepeatTasks()
  themeClass.value = getThemeClass()
  settings.value = getSettings()
  tasks.value = getTasks()
}

function handleToggle(id) {
  tasks.value = toggleTask(id)
}

function goDetail(id) {
  uni.navigateTo({
    url: `/pages/task-detail/task-detail?id=${id}`
  })
}

function goAdd() {
  uni.navigateTo({
    url: '/pages/task-form/task-form'
  })
}

function goFocus(taskId) {
  uni.navigateTo({
    url: `/pages/focus/focus?taskId=${taskId}`
  })
}

onShow(loadTasks)
</script>

<style scoped>
.todo-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hello,
.date {
  display: block;
}

.hello {
  font-size: 36rpx;
  font-weight: 800;
}

.date {
  margin-top: 14rpx;
  color: rgba(255, 255, 255, 0.8);
  font-size: 25rpx;
}

.date-badge {
  width: 122rpx;
  height: 132rpx;
  border-radius: 28rpx;
  text-align: center;
  background: rgba(255, 255, 255, 0.16);
}

.day {
  display: block;
  margin-top: 20rpx;
  font-size: 46rpx;
  font-weight: 800;
}

.month {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
}

.reminder-card {
  margin-top: 24rpx;
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.reminder-icon {
  font-size: 32rpx;
}

.reminder-title {
  color: #172033;
  font-size: 28rpx;
  font-weight: 700;
}

.reminder-stats {
  display: flex;
  align-items: center;
}

.reminder-item {
  flex: 1;
  text-align: center;
}

.reminder-divider {
  width: 1rpx;
  height: 56rpx;
  background: #edf2f8;
}

.reminder-num {
  display: block;
  color: var(--theme-primary);
  font-size: 36rpx;
  font-weight: 800;
}

.reminder-num.warn {
  color: #d99616;
}

.reminder-num.danger {
  color: #e84f4f;
}

.reminder-num.next {
  font-size: 28rpx;
}

.reminder-label {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 23rpx;
}

.rate-card {
  margin-top: 24rpx;
}

.rate-label,
.rate-value {
  display: block;
}

.rate-label {
  color: #8491a5;
  font-size: 25rpx;
}

.rate-value {
  margin-top: 8rpx;
  color: var(--theme-primary);
  font-size: 54rpx;
  font-weight: 800;
}

.progress {
  overflow: hidden;
  height: 18rpx;
  margin-top: 24rpx;
  border-radius: 18rpx;
  background: #eaf1fb;
}

.progress-inner {
  height: 100%;
  border-radius: 18rpx;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
  margin-top: 22rpx;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.focus-entry {
  flex: 0 0 auto;
  padding: 14rpx 22rpx;
  border-radius: 20rpx;
  color: var(--theme-primary);
  font-size: 24rpx;
  font-weight: 700;
  background: var(--theme-soft);
  margin-bottom: 20rpx;
}
</style>
