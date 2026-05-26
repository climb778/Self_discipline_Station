<template>
  <view class="page-shell" :class="themeClass">
    <view class="focus-hero hero-card">
      <view class="focus-task-info" v-if="taskTitle">
        <text class="focus-task-title">{{ taskTitle }}</text>
        <view class="focus-task-meta">
          <text v-if="taskCategory" class="tag">{{ taskCategory }}</text>
          <text v-if="taskPriority" class="focus-priority" :class="priorityClass">{{ taskPriority }}</text>
        </view>
      </view>
      <view v-else class="focus-task-info">
        <text class="focus-task-title">自由专注</text>
        <text class="focus-task-sub">专注于当下，不被外界打扰</text>
      </view>
    </view>

    <view class="focus-timer-card card">
      <view class="timer-display">
        <text class="timer-minutes">{{ displayMinutes }}</text>
        <text class="timer-sep">:</text>
        <text class="timer-seconds">{{ displaySeconds }}</text>
      </view>
      <view class="timer-progress">
        <view class="timer-progress-bar" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="timer-label">{{ timerLabel }}</text>
    </view>

    <view v-if="status === 'idle'" class="duration-section">
      <text class="section-title">选择专注时长</text>
      <view class="duration-grid">
        <view
          v-for="d in presetDurations"
          :key="d"
          class="duration-chip"
          :class="{ active: selectedDuration === d }"
          @tap="selectDuration(d)"
        >
          <text>{{ d }} 分钟</text>
        </view>
        <view
          class="duration-chip"
          :class="{ active: isCustom }"
          @tap="isCustom = true"
        >
          <text>自定义</text>
        </view>
      </view>
      <view v-if="isCustom" class="custom-duration">
        <input
          v-model.number="customMinutes"
          type="number"
          class="custom-input"
          placeholder="输入分钟数"
        />
      </view>
    </view>

    <view class="control-section">
      <button v-if="status === 'idle'" class="primary-button control-btn" @tap="startFocus">
        开始专注
      </button>
      <view v-else-if="status === 'running'" class="control-row">
        <button class="secondary-button control-btn-half" @tap="pauseFocus">暂停</button>
        <button class="danger-button control-btn-half" @tap="stopFocus">结束</button>
      </view>
      <view v-else-if="status === 'paused'" class="control-row">
        <button class="primary-button control-btn-half" @tap="resumeFocus">继续</button>
        <button class="danger-button control-btn-half" @tap="stopFocus">结束</button>
      </view>
    </view>

    <view v-if="status === 'idle'" class="focus-tip card">
      <text class="tip-title">专注小贴士</text>
      <text class="tip-text">放下手机，关闭无关页面，给自己一段不被打扰的时间。专注的每一分钟都在为未来积累力量。</text>
    </view>

    <view v-if="completionDialog.visible" class="dialog-mask">
      <view class="dialog-card card">
        <text class="dialog-title">专注完成</text>
        <text class="dialog-text">本次专注完成，是否标记任务完成？</text>
        <text class="dialog-sub">已保存 {{ completionDialog.minutes }} 分钟专注记录</text>
        <button class="primary-button dialog-button" @tap="markTaskDone">标记完成</button>
        <button class="secondary-button dialog-button" @tap="keepRecordOnly">只保存专注记录</button>
        <button class="secondary-button dialog-button" @tap="continueFocus">继续专注</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addFocusRecord } from '../../utils/focus'
import { getSettings, getTaskById, getThemeClass, updateTask } from '../../utils/storage'
import { getPriorityClass } from '../../utils/tasks'

const themeClass = ref(getThemeClass())
const settings = ref(getSettings())

const taskId = ref('')
const taskTitle = ref('')
const taskCategory = ref('')
const taskPriority = ref('')

const presetDurations = [15, 25, 45]
const selectedDuration = ref(25)
const customMinutes = ref(30)
const isCustom = ref(false)

const status = ref('idle')
const totalSeconds = ref(25 * 60)
const remainingSeconds = ref(25 * 60)
const startedAt = ref('')
let timer = null

const completionDialog = reactive({
  visible: false,
  minutes: 0
})

const displayMinutes = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  return String(m).padStart(2, '0')
})

const displaySeconds = computed(() => {
  return String(remainingSeconds.value % 60).padStart(2, '0')
})

const progressPercent = computed(() => {
  if (totalSeconds.value <= 0) return 0
  return Math.round(((totalSeconds.value - remainingSeconds.value) / totalSeconds.value) * 100)
})

const timerLabel = computed(() => {
  if (status.value === 'idle') return '准备开始'
  if (status.value === 'running') return '专注中...'
  if (status.value === 'paused') return '已暂停'
  return ''
})

const priorityClass = computed(() => getPriorityClass(taskPriority.value))

const effectiveMinutes = computed(() => {
  return isCustom.value ? (customMinutes.value || 30) : selectedDuration.value
})

function selectDuration(d) {
  selectedDuration.value = d
  isCustom.value = false
}

function startFocus() {
  const mins = effectiveMinutes.value
  if (!mins || mins <= 0) {
    uni.showToast({ title: '请选择专注时长', icon: 'none' })
    return
  }
  totalSeconds.value = mins * 60
  remainingSeconds.value = mins * 60
  startedAt.value = new Date().toISOString()
  status.value = 'running'
  startTimer()
}

function startTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (remainingSeconds.value <= 1) {
      remainingSeconds.value = 0
      clearInterval(timer)
      timer = null
      onTimerComplete()
      return
    }
    remainingSeconds.value--
  }, 1000)
}

function pauseFocus() {
  clearInterval(timer)
  timer = null
  status.value = 'paused'
}

function resumeFocus() {
  status.value = 'running'
  startTimer()
}

function stopFocus() {
  clearInterval(timer)
  timer = null
  const elapsed = totalSeconds.value - remainingSeconds.value
  const actualMinutes = Math.max(0, Math.ceil(elapsed / 60))
  saveRecord(actualMinutes, 'stopped')
  showStoppedDialog(actualMinutes)
}

function onTimerComplete() {
  status.value = 'idle'
  const mins = effectiveMinutes.value
  saveRecord(mins, 'completed')
  showCompletionDialog(mins)
}

function saveRecord(actualMinutes, recordStatus) {
  addFocusRecord({
    taskId: taskId.value,
    taskTitle: taskTitle.value || '自由专注',
    duration: effectiveMinutes.value,
    actualMinutes,
    startedAt: startedAt.value,
    endedAt: new Date().toISOString(),
    status: recordStatus
  })
}

function showCompletionDialog(minutes) {
  const hasTask = !!taskId.value
  if (hasTask) {
    completionDialog.visible = true
    completionDialog.minutes = minutes
  } else {
    uni.showModal({
      title: '专注完成',
      content: `本次专注 ${minutes} 分钟，记录已保存。`,
      confirmText: '好的',
      showCancel: false
    })
  }
}

function resetAfterCompletion() {
  completionDialog.visible = false
  completionDialog.minutes = 0
  remainingSeconds.value = totalSeconds.value
}

function markTaskDone() {
  updateTask(taskId.value, task => ({
    isCompleted: true,
    completedAt: task.completedAt || new Date().toISOString()
  }))
  resetAfterCompletion()
  uni.showToast({ title: '任务已完成', icon: 'success' })
}

function keepRecordOnly() {
  resetAfterCompletion()
  uni.showToast({ title: '专注记录已保存', icon: 'none' })
}

function continueFocus() {
  completionDialog.visible = false
  completionDialog.minutes = 0
  startFocus()
}

function showStoppedDialog(minutes) {
  uni.showModal({
    title: '专注已结束',
    content: `本次实际专注 ${minutes} 分钟，记录已保存。`,
    confirmText: '好的',
    showCancel: false,
    success: () => {
      status.value = 'idle'
      remainingSeconds.value = totalSeconds.value
    }
  })
}

onLoad(options => {
  taskId.value = options?.taskId || options?.id || ''
  if (taskId.value) {
    const task = getTaskById(taskId.value)
    if (task) {
      taskTitle.value = task.title
      taskCategory.value = task.category
      taskPriority.value = task.priority
    }
  }
  const defaultDuration = settings.value.defaultFocusDuration || 25
  selectedDuration.value = defaultDuration
  totalSeconds.value = defaultDuration * 60
  remainingSeconds.value = defaultDuration * 60
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.focus-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.focus-task-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.focus-task-title {
  font-size: 38rpx;
  font-weight: 800;
}

.focus-task-sub {
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
}

.focus-task-meta {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.focus-priority {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
  font-weight: 700;
}

.focus-priority.priority-high {
  color: #e84f4f;
  background: rgba(232, 79, 79, 0.15);
}

.focus-priority.priority-mid {
  color: #d99616;
  background: rgba(217, 150, 22, 0.15);
}

.focus-priority.priority-low {
  color: #2e9b68;
  background: rgba(46, 155, 104, 0.15);
}

.focus-timer-card {
  margin-top: 24rpx;
  padding: 48rpx 32rpx 36rpx;
  text-align: center;
}

.timer-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4rpx;
}

.timer-minutes,
.timer-seconds {
  font-size: 120rpx;
  font-weight: 800;
  color: var(--theme-primary);
  line-height: 1;
}

.timer-sep {
  font-size: 100rpx;
  font-weight: 800;
  color: var(--theme-primary);
  opacity: 0.5;
  margin: 0 4rpx;
}

.timer-progress {
  overflow: hidden;
  height: 14rpx;
  margin-top: 32rpx;
  border-radius: 14rpx;
  background: #eaf1fb;
}

.timer-progress-bar {
  height: 100%;
  border-radius: 14rpx;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  transition: width 1s linear;
}

.timer-label {
  display: block;
  margin-top: 20rpx;
  color: #8491a5;
  font-size: 28rpx;
}

.duration-section {
  margin-top: 28rpx;
}

.duration-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  margin-top: 16rpx;
}

.duration-chip {
  flex: 1;
  min-width: 0;
  padding: 24rpx 0;
  border-radius: 24rpx;
  text-align: center;
  color: #66758c;
  font-size: 28rpx;
  font-weight: 700;
  background: #f3f7fc;
}

.duration-chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.custom-duration {
  margin-top: 18rpx;
}

.custom-input {
  box-sizing: border-box;
  width: 100%;
  height: 92rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  color: #172033;
  font-size: 28rpx;
  background: #f3f7fc;
  text-align: center;
}

.control-section {
  margin-top: 36rpx;
}

.control-btn {
  height: 108rpx;
  font-size: 36rpx;
  border-radius: 32rpx;
}

.control-row {
  display: flex;
  gap: 24rpx;
}

.control-btn-half {
  flex: 1;
  height: 100rpx;
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 100rpx;
}

.secondary-button {
  color: var(--theme-primary);
  background: var(--theme-soft);
}

.danger-button {
  color: #e84f4f;
  background: #fff0f0;
}

.focus-tip {
  margin-top: 28rpx;
  padding: 28rpx;
}

.tip-title {
  display: block;
  color: #172033;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.tip-text {
  display: block;
  color: #8491a5;
  font-size: 25rpx;
  line-height: 1.6;
}

.dialog-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36rpx;
  background: rgba(23, 32, 51, 0.42);
}

.dialog-card {
  width: 100%;
  padding: 36rpx 28rpx;
  text-align: center;
}

.dialog-title {
  display: block;
  color: #172033;
  font-size: 36rpx;
  font-weight: 800;
}

.dialog-text {
  display: block;
  margin-top: 18rpx;
  color: #344157;
  font-size: 28rpx;
  line-height: 1.5;
}

.dialog-sub {
  display: block;
  margin: 10rpx 0 28rpx;
  color: #8491a5;
  font-size: 24rpx;
}

.dialog-button {
  width: 100%;
  margin-top: 18rpx;
}
</style>
