<template>
  <view class="page-shell">
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
    <TaskItem v-for="task in todayTasks" :key="task.id" :task="task" @toggle="handleToggle" />
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
import { getTasks, toggleTask } from '../../utils/storage'
import { getRate, getTodayTasks } from '../../utils/tasks'

const tasks = ref([])

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

function loadTasks() {
  tasks.value = getTasks()
}

function handleToggle(id) {
  tasks.value = toggleTask(id)
}

function goAdd() {
  uni.navigateTo({
    url: '/pages/task-form/task-form'
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
  color: #0b4aa2;
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
  background: linear-gradient(90deg, #0b4aa2, #37a2ff);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
  margin-top: 22rpx;
}
</style>
