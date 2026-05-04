import { formatDate, getToday, isBeforeToday } from './date'

export const categories = ['学习', '生活', '工作', '运动', '其他']
export const priorities = ['高', '中', '低']

export function getTodayTasks(tasks, today = getToday()) {
  return tasks.filter(task => task.dueDate === today || task.isLongTerm)
}

export function getCompletedTasks(tasks) {
  return tasks.filter(task => task.isCompleted)
}

export function getOverdueTasks(tasks) {
  return tasks.filter(task => !task.isCompleted && !task.isLongTerm && isBeforeToday(task.dueDate))
}

export function getRate(completed, total) {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

export function getDayStats(tasks, date) {
  const dayTasks = tasks.filter(task => task.dueDate === date || (task.isLongTerm && task.createdAt.slice(0, 10) <= date))
  const completed = dayTasks.filter(task => {
    if (!task.isCompleted) return false
    if (!task.completedAt) return task.dueDate === date
    return formatDate(task.completedAt) === date || task.dueDate === date
  }).length
  return {
    total: dayTasks.length,
    completed,
    todo: Math.max(dayTasks.length - completed, 0),
    rate: getRate(completed, dayTasks.length)
  }
}

export function getDayStatus(tasks, date) {
  const stats = getDayStats(tasks, date)
  if (!stats.total) return ''
  if (stats.completed === stats.total) return 'done'
  if (stats.completed > 0) return 'partial'
  return 'none'
}

export function getContinuousCheckin(tasks) {
  let count = 0
  const cursor = new Date(`${getToday()}T00:00:00`)

  while (true) {
    const date = formatDate(cursor)
    const hasCompleted = tasks.some(task => task.isCompleted && task.completedAt && formatDate(task.completedAt) === date)
    if (!hasCompleted) break
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return count
}

export function getCategorySummary(tasks) {
  const summary = categories
    .map(category => ({
      category,
      count: tasks.filter(task => task.category === category).length
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)

  return summary.slice(0, 3)
}

export function getPriorityClass(priority) {
  return {
    高: 'priority-high',
    中: 'priority-mid',
    低: 'priority-low'
  }[priority] || 'priority-mid'
}
