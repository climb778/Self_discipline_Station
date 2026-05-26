<template>
  <view class="page-shell" :class="themeClass">
    <view class="top-stats">
      <StatCard label="已完成" :value="completedTasks.length" />
      <StatCard label="长期任务" :value="longTermTasks.length" />
      <StatCard label="过期任务" :value="overdueTasks.length" />
    </view>

    <view class="search-card card">
      <input v-model.trim="keyword" class="search" placeholder="搜索任务标题、描述或分类" />
    </view>

    <view class="filter-row">
      <text v-for="item in filters" :key="item.value" class="filter" :class="{ active: filter === item.value }" @tap="filter = item.value">{{ item.label }}</text>
    </view>

    <TaskItem
      v-for="task in filteredTasks"
      :key="task.id"
      :task="task"
      show-completed-at
      show-status
      @toggle="handleToggle"
      @open="goDetail"
    />
    <EmptyState v-if="!filteredTasks.length" title="没有匹配记录" text="换个关键词或筛选条件看看" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '../../components/EmptyState.vue'
import StatCard from '../../components/StatCard.vue'
import TaskItem from '../../components/TaskItem.vue'
import { generateRepeatTasks, getTasks, getThemeClass, toggleTask } from '../../utils/storage'
import { getActiveTasks, getArchivedTasks, getCompletedTasks, getOverdueTasks } from '../../utils/tasks'

const tasks = ref([])
const keyword = ref('')
const filter = ref('completed')
const themeClass = ref(getThemeClass())

const filters = [
  { label: '已完成', value: 'completed' },
  { label: '长期任务', value: 'longTerm' },
  { label: '过期任务', value: 'overdue' },
  { label: '已归档', value: 'archived' }
]

const completedTasks = computed(() => getCompletedTasks(tasks.value))
const longTermTasks = computed(() => getActiveTasks(tasks.value).filter(task => task.isLongTerm))
const overdueTasks = computed(() => getOverdueTasks(tasks.value))
const archivedTasks = computed(() => getArchivedTasks(tasks.value))

const filteredTasks = computed(() => {
  const baseMap = {
    completed: completedTasks.value,
    longTerm: longTermTasks.value,
    overdue: overdueTasks.value,
    archived: archivedTasks.value
  }
  const source = baseMap[filter.value] || []
  const word = keyword.value.toLowerCase()
  if (!word) return source
  return source.filter(task => `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(word))
})

function loadTasks() {
  generateRepeatTasks()
  themeClass.value = getThemeClass()
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
  background: var(--theme-primary);
}
</style>
