<template>
  <view class="page-shell">
    <view class="hero-card user-card">
      <view class="avatar">自</view>
      <view class="user-info">
        <text class="name">自律行动家</text>
        <text class="sign">每天进步一点点，时间会给答案</text>
        <view class="user-meta">
          <text>Lv.{{ level }}</text>
          <text>总完成率 {{ totalRate }}%</text>
        </view>
      </view>
    </view>

    <text class="section-title">行动仪表盘</text>
    <view class="dashboard">
      <StatCard label="总体完成率" :value="`${totalRate}%`" />
      <StatCard label="累计任务" :value="tasks.length" />
      <StatCard label="连续打卡" :value="`${continuousDays}天`" />
      <StatCard label="已完成" :value="completedCount" />
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
      <view class="quick card" @tap="goRecords">
        <text class="quick-icon">⌕</text>
        <text>过往记录</text>
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
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import StatCard from '../../components/StatCard.vue'
import { getTasks } from '../../utils/storage'
import { getCategorySummary, getContinuousCheckin, getOverdueTasks, getRate } from '../../utils/tasks'

const tasks = ref([])

const completedCount = computed(() => tasks.value.filter(task => task.isCompleted).length)
const todoCount = computed(() => tasks.value.length - completedCount.value)
const overdueCount = computed(() => getOverdueTasks(tasks.value).length)
const totalRate = computed(() => getRate(completedCount.value, tasks.value.length))
const continuousDays = computed(() => getContinuousCheckin(tasks.value))
const level = computed(() => Math.max(1, Math.floor(completedCount.value / 5) + 1))
const categoryText = computed(() => {
  const summary = getCategorySummary(tasks.value)
  return summary.length ? summary.map(item => item.category).join('、') : '暂无'
})

function loadTasks() {
  tasks.value = getTasks()
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

onShow(loadTasks)
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  flex: 0 0 auto;
  width: 116rpx;
  height: 116rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.34);
  border-radius: 50%;
  text-align: center;
  font-size: 48rpx;
  font-weight: 800;
  line-height: 108rpx;
  background: rgba(255, 255, 255, 0.18);
}

.user-info {
  flex: 1;
  min-width: 0;
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

.dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
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
  background: #0b4aa2;
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
  color: #0b4aa2;
  font-weight: 800;
}
</style>
