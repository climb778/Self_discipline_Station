<template>
  <view class="task-card card">
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
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getPriorityClass } from '../utils/tasks'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

defineEmits(['toggle'])

const priorityClass = computed(() => getPriorityClass(props.task.priority))
</script>

<style scoped>
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  margin-bottom: 20rpx;
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
  color: #2674d9;
  background: #edf6ff;
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
