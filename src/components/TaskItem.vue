<template>
  <view class="task-card card" @tap="$emit('open', task.id)">
    <view class="check" :class="{ checked: task.isCompleted }" @tap.stop="$emit('toggle', task.id)">
      <text v-if="task.isCompleted">✓</text>
    </view>
    <view class="task-main">
      <view class="task-head">
        <text class="task-title" :class="{ completed: task.isCompleted }">{{ task.title }}</text>
        <text class="priority" :class="priorityClass">{{ task.priority }}</text>
      </view>
      <text v-if="task.description" class="task-desc">{{ task.description }}</text>
      <view class="task-meta">
        <text class="tag">{{ task.category }}</text>
        <text class="date">截止 {{ task.dueDate }}</text>
        <text v-if="task.isLongTerm" class="long-term">长期</text>
        <text v-if="task.isRepeat && !task.sourceRepeatTaskId" class="repeat-badge">重复</text>
        <text v-if="task.sourceRepeatTaskId" class="repeat-badge auto">自动</text>
        <text v-if="task.enableReminder && task.reminderTime" class="reminder-badge">⏰ {{ task.reminderTime }}</text>
        <text v-if="showCompletedAt && task.completedAt" class="date">完成 {{ formatDateTime(task.completedAt) }}</text>
        <text v-if="showStatus" class="status" :class="statusClass">{{ statusText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getPriorityClass, getTaskStatus } from '../utils/tasks'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  showCompletedAt: {
    type: Boolean,
    default: false
  },
  showStatus: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle', 'open'])

const priorityClass = computed(() => getPriorityClass(props.task.priority))
const statusText = computed(() => getTaskStatus(props.task))
const statusClass = computed(() => {
  if (props.task.isArchived) return 'status-archived'
  if (props.task.isCompleted) return 'status-done'
  if (statusText.value === '已过期') return 'status-overdue'
  return 'status-todo'
})

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const pad = item => String(item).padStart(2, '0')
  return `${date.getMonth() + 1}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<style scoped>
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  margin-bottom: 20rpx;
  transition: transform 0.16s ease;
}

.task-card:active {
  transform: scale(0.99);
}

.check {
  flex: 0 0 auto;
  width: 44rpx;
  height: 44rpx;
  margin-top: 4rpx;
  border: 4rpx solid #c6d4e6;
  border-radius: 50%;
  color: #fff;
  text-align: center;
  font-size: 28rpx;
  line-height: 40rpx;
  background: #fff;
}

.check.checked {
  border-color: #29bf7f;
  background: #29bf7f;
}

.task-main {
  flex: 1;
  min-width: 0;
}

.task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.task-title {
  flex: 1;
  color: #172033;
  font-size: 31rpx;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-title.completed {
  color: #8b98aa;
  text-decoration: line-through;
}

.task-desc {
  display: block;
  margin-top: 10rpx;
  color: #7c8ba0;
  font-size: 25rpx;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
  margin-top: 18rpx;
}

.date,
.long-term {
  color: #8491a5;
  font-size: 23rpx;
}

.long-term {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  color: var(--theme-primary, #2674d9);
  background: var(--theme-soft, #edf6ff);
}

.repeat-badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  color: #8b5cf6;
  background: #f3eeff;
  font-size: 23rpx;
}

.repeat-badge.auto {
  color: var(--theme-primary, #2674d9);
  background: var(--theme-soft, #edf6ff);
}

.reminder-badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  color: #d99616;
  background: #fff7e6;
  font-size: 23rpx;
}

.status {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
}

.status-done {
  color: #29bf7f;
  background: #eaf9f2;
}

.status-todo {
  color: var(--theme-primary, #0b4aa2);
  background: var(--theme-soft, #eaf3ff);
}

.status-overdue {
  color: #e84f4f;
  background: #fff0f0;
}

.status-archived {
  color: #6b7688;
  background: #eef2f6;
}

.priority {
  flex: 0 0 auto;
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
</style>
