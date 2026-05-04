<template>
  <view class="page-shell">
    <view class="top-stats">
      <StatCard label="已完成" :value="completedTasks.length" />
      <StatCard label="长期任务" :value="longTermTasks.length" />
      <StatCard label="过期任务" :value="overdueTasks.length" />
    </view>

    <view class="search-card card">
      <input v-model.trim="keyword" class="search" placeholder="搜索任务标题或描述" />
    </view>

    <view class="filter-row">
      <text v-for="item in filters" :key="item.value" class="filter" :class="{ active: filter === item.value }" @tap="filter = item.value">{{ item.label }}</text>
    </view>

    <TaskItem v-for="task in filteredTasks" :key="task.id" :task="task" @toggle="handleToggle" />
    <EmptyState v-if="!filteredTasks.length" title="没有匹配记录" text="换个关键词或筛选条件看看" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '../../components/EmptyState.vue'
import StatCard from '../../components/StatCard.vue'
import TaskItem from '../../components/TaskItem.vue'
import { getTasks, toggleTask } from '../../utils/storage'
import { getCompletedTasks, getOverdueTasks } from '../../utils/tasks'

const tasks = ref([])
const keyword = ref('')
const filter = ref('completed')

const filters = [
  { label: '已完成', value: 'completed' },
  { label: '长期任务', value: 'longTerm' },
  { label: '过期任务', value: 'overdue' }
]

const completedTasks = computed(() => getCompletedTasks(tasks.value))
const longTermTasks = computed(() => tasks.value.filter(task => task.isLongTerm))
const overdueTasks = computed(() => getOverdueTasks(tasks.value))

const filteredTasks = computed(() => {
  const baseMap = {
    completed: completedTasks.value,
    longTerm: longTermTasks.value,
    overdue: overdueTasks.value
  }
  const source = baseMap[filter.value] || []
  const word = keyword.value.toLowerCase()
  if (!word) return source
  return source.filter(task => `${task.title} ${task.description}`.toLowerCase().includes(word))
})

function loadTasks() {
  tasks.value = getTasks()
}

function handleToggle(id) {
  tasks.value = toggleTask(id)
}

onShow(loadTasks)
</script>

<style scoped>
.top-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.search-card {
  margin-top: 24rpx;
  padding: 16rpx 24rpx;
}

.search {
  height: 70rpx;
  color: #172033;
  font-size: 27rpx;
}

.filter-row {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 0;
}

.filter {
  flex: 1;
  height: 76rpx;
  border-radius: 24rpx;
  color: #65758e;
  text-align: center;
  font-size: 26rpx;
  line-height: 76rpx;
  background: #eaf1fb;
}

.filter.active {
  color: #fff;
  font-weight: 700;
  background: #0b4aa2;
}
</style>
