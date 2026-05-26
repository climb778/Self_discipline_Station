<template>
  <view class="page-shell" :class="themeClass">
    <view class="calendar-card card">
      <view class="month-head">
        <view class="nav" @tap="changeMonth(-1)">‹</view>
        <view>
          <text class="month-title">{{ currentYear }}年{{ currentMonth + 1 }}月</text>
          <text class="month-sub">用每天的小圆点，看见自己的节奏</text>
        </view>
        <view class="nav" @tap="changeMonth(1)">›</view>
      </view>

      <view class="week-row">
        <text v-for="item in weeks" :key="item">{{ item }}</text>
      </view>

      <view class="day-grid">
        <view v-for="(item, index) in monthDays" :key="index" class="day-cell" :class="{ active: item && item.date === selectedDate }" @tap="item && selectDate(item.date)">
          <text v-if="item">{{ item.day }}</text>
          <view v-if="item && getStatus(item.date)" class="dot" :class="getStatus(item.date)"></view>
        </view>
      </view>
    </view>

    <view class="record-card card">
      <text class="record-date">{{ selectedDate }}</text>
      <view class="record-stats">
        <StatCard label="任务数" :value="selectedStats.total" />
        <StatCard label="完成数" :value="selectedStats.completed" />
        <StatCard label="待办数" :value="selectedStats.todo" />
      </view>
      <text class="record-tip">当天完成率 {{ selectedStats.rate }}%</text>
    </view>

    <text class="section-title">当天任务</text>
    <view v-if="selectedTasks.length" class="day-task-list">
      <view v-for="task in selectedTasks" :key="task.id" class="day-task card" @tap="goDetail(task.id)">
        <view class="day-task-main">
          <text class="day-task-title">{{ task.title }}</text>
          <view class="day-task-meta">
            <text class="tag">{{ task.category }}</text>
            <text class="priority" :class="getPriorityClass(task.priority)">{{ task.priority }}</text>
          </view>
        </view>
        <text class="day-task-status" :class="{ done: task.isCompleted }">{{ task.isCompleted ? '已完成' : '待完成' }}</text>
      </view>
    </view>
    <EmptyState v-else title="当天没有任务" text="选一个有记录的日期，或去新增任务" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '../../components/EmptyState.vue'
import StatCard from '../../components/StatCard.vue'
import { formatDate, getMonthDays, getToday } from '../../utils/date'
import { generateRepeatTasks, getTasks, getThemeClass } from '../../utils/storage'
import { getDayStats, getDayStatus, getPriorityClass, getTasksByDate } from '../../utils/tasks'

const tasks = ref([])
const cursor = ref(new Date())
const selectedDate = ref(getToday())
const themeClass = ref(getThemeClass())
const weeks = ['日', '一', '二', '三', '四', '五', '六']

const currentYear = computed(() => cursor.value.getFullYear())
const currentMonth = computed(() => cursor.value.getMonth())
const monthDays = computed(() => getMonthDays(currentYear.value, currentMonth.value))
const selectedStats = computed(() => getDayStats(tasks.value, selectedDate.value))
const selectedTasks = computed(() => getTasksByDate(tasks.value, selectedDate.value))

function loadTasks() {
  generateRepeatTasks()
  themeClass.value = getThemeClass()
  tasks.value = getTasks()
}

function changeMonth(step) {
  const next = new Date(currentYear.value, currentMonth.value + step, 1)
  cursor.value = next
  selectedDate.value = formatDate(next)
}

function selectDate(date) {
  selectedDate.value = date
}

function getStatus(date) {
  return getDayStatus(tasks.value, date)
}

function goDetail(id) {
  uni.navigateTo({
    url: `/pages/task-detail/task-detail?id=${id}`
  })
}

onShow(loadTasks)
</script>

<style scoped>
.calendar-card {
  padding: 30rpx 24rpx;
}

.month-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 26rpx;
}

.month-title,
.month-sub {
  display: block;
  text-align: center;
}

.month-title {
  color: #172033;
  font-size: 35rpx;
  font-weight: 800;
}

.month-sub {
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 23rpx;
}

.nav {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  color: var(--theme-primary);
  text-align: center;
  font-size: 48rpx;
  line-height: 58rpx;
  background: #eef5ff;
}

.week-row,
.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.week-row {
  color: #8491a5;
  text-align: center;
  font-size: 24rpx;
}

.day-grid {
  margin-top: 14rpx;
  row-gap: 8rpx;
}

.day-cell {
  position: relative;
  height: 76rpx;
  border-radius: 24rpx;
  color: #2c374a;
  text-align: center;
  font-size: 27rpx;
  line-height: 66rpx;
}

.day-cell.active {
  color: #fff;
  font-weight: 800;
  background: var(--theme-primary);
}

.dot {
  position: absolute;
  left: 50%;
  bottom: 10rpx;
  width: 10rpx;
  height: 10rpx;
  transform: translateX(-50%);
  border-radius: 50%;
}

.dot.done {
  background: #29bf7f;
}

.dot.partial {
  background: #f5b642;
}

.dot.none {
  background: #a8b2c2;
}

.record-card {
  margin-top: 24rpx;
}

.record-date {
  color: #172033;
  font-size: 34rpx;
  font-weight: 800;
}

.record-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
  margin-top: 24rpx;
}

.record-tip {
  display: block;
  margin-top: 22rpx;
  color: #8491a5;
  font-size: 25rpx;
  text-align: center;
}

.day-task-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.day-task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin: 0;
}

.day-task-title {
  display: block;
  color: #172033;
  font-size: 30rpx;
  font-weight: 700;
}

.day-task-meta {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.priority {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.priority-high {
  color: #e84f4f;
  background: #fff0f0;
}

.priority-mid {
  color: #d99616;
  background: #fff7e6;
}

.priority-low {
  color: #2e9b68;
  background: #eaf9f2;
}

.day-task-status {
  flex: 0 0 auto;
  color: #8491a5;
  font-size: 25rpx;
  font-weight: 700;
}

.day-task-status.done {
  color: #29bf7f;
}
</style>
