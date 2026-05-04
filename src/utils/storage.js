import { getToday } from './date'

const TASK_STORAGE_KEY = 'SELF_DISCIPLINE_TASKS'

const seedTasks = [
  {
    id: 'seed-1',
    title: '晨间阅读 30 分钟',
    description: '保持输入，记录一句收获',
    category: '学习',
    priority: '高',
    dueDate: getToday(),
    isLongTerm: true,
    isCompleted: false,
    completedAt: '',
    createdAt: `${getToday()}T08:00:00`,
    updatedAt: `${getToday()}T08:00:00`
  },
  {
    id: 'seed-2',
    title: '完成今日运动',
    description: '至少 20 分钟有氧或力量训练',
    category: '运动',
    priority: '中',
    dueDate: getToday(),
    isLongTerm: false,
    isCompleted: true,
    completedAt: `${getToday()}T09:30:00`,
    createdAt: `${getToday()}T08:10:00`,
    updatedAt: `${getToday()}T09:30:00`
  }
]

export function getTasks() {
  const stored = uni.getStorageSync(TASK_STORAGE_KEY)
  if (Array.isArray(stored)) return stored
  uni.setStorageSync(TASK_STORAGE_KEY, seedTasks)
  return seedTasks
}

export function saveTasks(tasks) {
  uni.setStorageSync(TASK_STORAGE_KEY, tasks)
}

export function addTask(payload) {
  const now = new Date().toISOString()
  const task = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: payload.title,
    description: payload.description || '',
    category: payload.category || '其他',
    priority: payload.priority || '中',
    dueDate: payload.dueDate || getToday(),
    isLongTerm: Boolean(payload.isLongTerm),
    isCompleted: false,
    completedAt: '',
    createdAt: now,
    updatedAt: now
  }
  const tasks = [task, ...getTasks()]
  saveTasks(tasks)
  return task
}

export function updateTask(taskId, updater) {
  const tasks = getTasks().map(task => {
    if (task.id !== taskId) return task
    const patch = typeof updater === 'function' ? updater(task) : updater
    return {
      ...task,
      ...patch,
      updatedAt: new Date().toISOString()
    }
  })
  saveTasks(tasks)
  return tasks
}

export function toggleTask(taskId) {
  return updateTask(taskId, task => {
    const nextCompleted = !task.isCompleted
    return {
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : ''
    }
  })
}
