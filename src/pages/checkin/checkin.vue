<template>
  <view class="page-shell">
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
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import StatCard from '../../components/StatCard.vue'
import { formatDate, getMonthDays, getToday } from '../../utils/date'
import { getTasks } from '../../utils/storage'
import { getDayStats, getDayStatus } from '../../utils/tasks'

const tasks = ref([])
const cursor = ref(new Date())
const selectedDate = ref(getToday())
const weeks = ['日', '一', '二', '三', '四', '五', '六']

const currentYear = computed(() => cursor.value.getFullYear())
const currentMonth = computed(() => cursor.value.getMonth())
const monthDays = computed(() => getMonthDays(currentYear.value, currentMonth.value))
const selectedStats = computed(() => getDayStats(tasks.value, selectedDate.value))

function loadTasks() {
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
  color: #0b4aa2;
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
  background: #0b4aa2;
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
</style>
