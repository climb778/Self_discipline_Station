<template>
  <view class="page-shell" :class="themeClass">
    <view v-if="task" class="detail-wrap">
      <view class="hero-card detail-hero">
        <view>
          <text class="detail-title">{{ task.title }}</text>
          <text class="detail-desc">{{ task.description || '暂无描述' }}</text>
        </view>
        <text class="status-pill" :class="statusClass">{{ statusText }}</text>
      </view>

      <view class="card info-card">
        <view class="info-line">
          <text>分类</text>
          <text>{{ task.category }}</text>
        </view>
        <view class="info-line">
          <text>优先级</text>
          <text>{{ task.priority }}</text>
        </view>
        <view class="info-line">
          <text>截止日期</text>
          <text>{{ task.dueDate }}</text>
        </view>
        <view class="info-line">
          <text>长期任务</text>
          <text>{{ task.isLongTerm ? '是' : '否' }}</text>
        </view>
        <view v-if="task.isRepeat && !task.sourceRepeatTaskId" class="info-line">
          <text>重复规则</text>
          <text>{{ repeatLabel }}</text>
        </view>
        <view v-if="task.isRepeat && task.repeatType === 'custom' && task.repeatDays && task.repeatDays.length" class="info-line">
          <text>重复日</text>
          <text>{{ repeatDaysText }}</text>
        </view>
        <view v-if="task.isRepeat && task.repeatEndDate" class="info-line">
          <text>重复结束</text>
          <text>{{ task.repeatEndDate }}</text>
        </view>
        <view v-if="task.enableReminder && task.reminderTime" class="info-line">
          <text>提醒时间</text>
          <text>{{ task.reminderTime }}</text>
        </view>
        <view v-if="task.sourceRepeatTaskId" class="info-line">
          <text>来源</text>
          <text>重复任务自动生成</text>
        </view>
        <view v-if="task.generatedDate" class="info-line">
          <text>生成日期</text>
          <text>{{ task.generatedDate }}</text>
        </view>
        <view class="info-line">
          <text>创建时间</text>
          <text>{{ formatDateTime(task.createdAt) }}</text>
        </view>
        <view class="info-line">
          <text>完成时间</text>
          <text>{{ task.completedAt ? formatDateTime(task.completedAt) : '未完成' }}</text>
        </view>
        <view class="info-line">
          <text>当前状态</text>
          <text>{{ statusText }}</text>
        </view>
        <view v-if="task.isArchived && task.archivedAt" class="info-line">
          <text>归档时间</text>
          <text>{{ formatDateTime(task.archivedAt) }}</text>
        </view>
      </view>

      <view class="action-grid">
        <button class="primary-button action-button" @tap="handleToggle">{{ task.isCompleted ? '取消完成' : '标记完成' }}</button>
        <button class="focus-button action-button" @tap="goFocus">开始专注</button>
        <button class="secondary-button action-button" @tap="goEdit">编辑任务</button>
        <button class="secondary-button action-button" @tap="confirmArchive">{{ task.isArchived ? '取消归档' : '归档任务' }}</button>
        <button class="danger-button action-button" @tap="confirmDelete">删除任务</button>
      </view>

      <text class="section-title">专注统计</text>
      <view class="card focus-stats-card">
        <view class="focus-stats-row">
          <view class="focus-stat-item">
            <text class="focus-stat-num">{{ focusStats.totalMinutes }}</text>
            <text class="focus-stat-label">累计分钟</text>
          </view>
          <view class="focus-stat-item">
            <text class="focus-stat-num">{{ focusStats.count }}</text>
            <text class="focus-stat-label">专注次数</text>
          </view>
          <view class="focus-stat-item">
            <text class="focus-stat-num">{{ focusLastTime }}</text>
            <text class="focus-stat-label">最近专注</text>
          </view>
        </view>
      </view>

      <view v-if="focusRecords.length" class="focus-records-section">
        <text class="section-title">专注记录</text>
        <view v-for="record in focusRecords" :key="record.id" class="card focus-record-item">
          <view class="focus-record-row">
            <text class="focus-record-title">{{ record.taskTitle }}</text>
            <text class="focus-record-status" :class="record.status === 'completed' ? 'status-completed' : 'status-stopped'">
              {{ record.status === 'completed' ? '完成' : '中途结束' }}
            </text>
          </view>
          <view class="focus-record-detail">
            <text>{{ record.actualMinutes }} 分钟</text>
            <text>{{ formatFocusTime(record.endedAt) }}</text>
          </view>
        </view>
      </view>
    </view>

    <EmptyState v-else title="任务不存在" text="它可能已经被删除或移动" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import EmptyState from '../../components/EmptyState.vue'
import { deleteTask, getTaskById, getThemeClass, setTaskArchived, toggleTask } from '../../utils/storage'
import { getTaskStatus, getRepeatLabel } from '../../utils/tasks'
import { getFocusRecords, getTaskFocusStats, getFocusRecordsByTask, formatFocusTime } from '../../utils/focus'

const taskId = ref('')
const task = ref(null)
const themeClass = ref(getThemeClass())
const allFocusRecords = ref([])

const statusText = computed(() => (task.value ? getTaskStatus(task.value) : ''))
const repeatLabel = computed(() => (task.value ? getRepeatLabel(task.value) : ''))
const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const repeatDaysText = computed(() => {
  if (!task.value || !task.value.repeatDays) return ''
  return task.value.repeatDays.map(d => weekDayNames[d]).join('、')
})
const statusClass = computed(() => {
  if (!task.value) return ''
  if (task.value.isArchived) return 'status-archived'
  if (task.value.isCompleted) return 'status-done'
  if (statusText.value === '已过期') return 'status-overdue'
  return 'status-todo'
})

const focusStats = computed(() => getTaskFocusStats(taskId.value, allFocusRecords.value))
const focusRecords = computed(() => getFocusRecordsByTask(taskId.value, allFocusRecords.value).slice(0, 5))
const focusLastTime = computed(() => {
  const t = focusStats.value.lastTime
  if (!t) return '无'
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

function loadTask() {
  if (!taskId.value) return
  themeClass.value = getThemeClass()
  task.value = getTaskById(taskId.value) || null
  allFocusRecords.value = getFocusRecords()
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const pad = item => String(item).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function handleToggle() {
  toggleTask(taskId.value)
  loadTask()
  uni.showToast({
    title: task.value?.isCompleted ? '已完成' : '已取消',
    icon: 'none'
  })
}

function goEdit() {
  uni.navigateTo({
    url: `/pages/task-form/task-form?id=${taskId.value}`
  })
}

function confirmDelete() {
  uni.showModal({
    title: '删除任务',
    content: '确定要删除这个任务吗？删除后无法恢复。',
    confirmText: '删除',
    confirmColor: '#e84f4f',
    success: res => {
      if (!res.confirm) return
      deleteTask(taskId.value)
      uni.showToast({
        title: '已删除',
        icon: 'none'
      })
      setTimeout(() => uni.navigateBack(), 350)
    }
  })
}

function goFocus() {
  uni.navigateTo({
    url: `/pages/focus/focus?taskId=${taskId.value}`
  })
}

function confirmArchive() {
  const nextArchived = !task.value?.isArchived
  uni.showModal({
    title: nextArchived ? '归档任务' : '取消归档',
    content: nextArchived ? '归档后任务不再出现在每日待办中，仍可在过往记录中查看。确定归档吗？' : '确定要取消归档这个任务吗？',
    confirmText: nextArchived ? '归档' : '取消归档',
    success: res => {
      if (!res.confirm) return
      setTaskArchived(taskId.value, nextArchived)
      loadTask()
      uni.showToast({
        title: nextArchived ? '已归档' : '已取消归档',
        icon: 'none'
      })
    }
  })
}

onLoad(options => {
  taskId.value = options?.id || ''
  loadTask()
})

onShow(loadTask)
</script>

<style scoped>
.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22rpx;
}

.detail-title,
.detail-desc {
  display: block;
}

.detail-title {
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.25;
}

.detail-desc {
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
  line-height: 1.55;
}

.status-pill {
  flex: 0 0 auto;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
}

.info-card {
  padding: 8rpx 28rpx;
}

.info-line {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #edf2f8;
  color: #172033;
  font-size: 28rpx;
}

.info-line:last-child {
  border-bottom: 0;
}

.info-line text:first-child {
  flex: 0 0 auto;
  color: #8491a5;
}

.info-line text:last-child {
  min-width: 0;
  text-align: right;
  font-weight: 700;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;
}

.action-button {
  width: 100%;
  margin: 0;
}

.secondary-button,
.danger-button {
  height: 96rpx;
  border-radius: 28rpx;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 96rpx;
}

.secondary-button {
  color: var(--theme-primary);
  background: var(--theme-soft);
}

.danger-button {
  color: #e84f4f;
  background: #fff0f0;
}

.status-done {
  color: #dffbed;
}

.status-todo {
  color: #fff;
}

.status-overdue {
  color: #ffe2e2;
}

.status-archived {
  color: #e8ecf3;
}

.focus-button {
  color: #fff;
  background: var(--theme-primary);
}

.focus-button,
.secondary-button,
.danger-button {
  height: 96rpx;
  border-radius: 28rpx;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 96rpx;
}

.focus-stats-card {
  padding: 24rpx;
}

.focus-stats-row {
  display: flex;
  align-items: center;
}

.focus-stat-item {
  flex: 1;
  text-align: center;
}

.focus-stat-num {
  display: block;
  color: var(--theme-primary);
  font-size: 36rpx;
  font-weight: 800;
}

.focus-stat-label {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 23rpx;
}

.focus-records-section {
  margin-top: 8rpx;
}

.focus-record-item {
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
}

.focus-record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.focus-record-title {
  color: #172033;
  font-size: 28rpx;
  font-weight: 700;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-record-status {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  flex: 0 0 auto;
}

.status-completed {
  color: #29bf7f;
  background: #eaf9f2;
}

.status-stopped {
  color: #d99616;
  background: #fff7e6;
}

.focus-record-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
  color: #8491a5;
  font-size: 24rpx;
}
</style>
