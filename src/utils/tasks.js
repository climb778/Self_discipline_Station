import { formatDate, getToday, isBeforeToday } from './date'

export const categories = ['学习', '生活', '工作', '运动', '其他']
export const priorities = ['高', '中', '低']

export function isRepeatTemplate(task) {
  return Boolean(task.isRepeat && task.repeatType !== 'none' && !task.sourceRepeatTaskId)
}

export function isRealTask(task) {
  return !isRepeatTemplate(task)
}

export function getActiveTasks(tasks) {
  return tasks.filter(task => isRealTask(task) && !task.isArchived)
}

export function getArchivedTasks(tasks) {
  return tasks.filter(task => task.isArchived)
}

export function getTodayTasks(tasks, today = getToday()) {
  return getActiveTasks(tasks).filter(task => task.dueDate === today || task.isLongTerm || task.generatedDate === today)
}

export function getTasksByDate(tasks, date) {
  return getActiveTasks(tasks).filter(task => task.dueDate === date || (task.isLongTerm && task.createdAt.slice(0, 10) <= date))
}

export function getCompletedTasks(tasks) {
  return getActiveTasks(tasks).filter(task => task.isCompleted)
}

export function getOverdueTasks(tasks) {
  return getActiveTasks(tasks).filter(task => !task.isCompleted && !task.isLongTerm && isBeforeToday(task.dueDate))
}

export function getRate(completed, total) {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

export function getDayStats(tasks, date) {
  const dayTasks = getTasksByDate(tasks, date)
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
    const hasCompleted = tasks.some(task => isRealTask(task) && task.isCompleted && task.completedAt && formatDate(task.completedAt) === date)
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
      count: tasks.filter(task => isRealTask(task) && task.category === category).length
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

export function getTaskStatus(task) {
  if (task.isArchived) return '已归档'
  if (task.isCompleted) return '已完成'
  if (!task.isLongTerm && isBeforeToday(task.dueDate)) return '已过期'
  return '待完成'
}

export function get7DayTrend(tasks) {
  const result = []
  const cursor = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)
    const completed = tasks.filter(
      task => isRealTask(task) && task.isCompleted && task.completedAt && formatDate(task.completedAt) === dateStr
    ).length
    const weekMap = ['日', '一', '二', '三', '四', '五', '六']
    result.push({
      date: dateStr,
      label: weekMap[d.getDay()],
      count: completed
    })
  }
  return result
}

export function getWeeklyCompletedCount(tasks) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)

  return tasks.filter(task => {
    if (!isRealTask(task) || !task.isCompleted || !task.completedAt) return false
    const completedDate = new Date(task.completedAt)
    return completedDate >= startOfWeek
  }).length
}

export function getMonthlyCompletedCount(tasks) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  return tasks.filter(task => {
    if (!isRealTask(task) || !task.isCompleted || !task.completedAt) return false
    const d = new Date(task.completedAt)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
}

export function getMostUsedCategory(tasks) {
  const summary = getCategorySummary(tasks)
  return summary.length ? summary[0].category : '暂无'
}

export function getLongestStreak(tasks) {
  const completedDates = new Set()
  tasks.forEach(task => {
    if (isRealTask(task) && task.isCompleted && task.completedAt) {
      completedDates.add(formatDate(task.completedAt))
    }
  })
  if (completedDates.size === 0) return 0

  const sorted = Array.from(completedDates).sort()
  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`)
    const curr = new Date(`${sorted[i]}T00:00:00`)
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000
    if (diffDays === 1) {
      currentStreak += 1
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else if (diffDays > 1) {
      currentStreak = 1
    }
  }

  return maxStreak
}

export function getRepeatLabel(task) {
  if (!task.isRepeat) return ''
  const map = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    custom: '自定义'
  }
  return map[task.repeatType] || ''
}

export function getReminderInfo(task) {
  if (!task.enableReminder || !task.reminderTime) return null
  const now = new Date()
  const [h, m] = task.reminderTime.split(':').map(Number)
  const reminderDate = new Date(now)
  reminderDate.setHours(h, m, 0, 0)
  const diffMs = reminderDate.getTime() - now.getTime()
  if (diffMs < 0) return { time: task.reminderTime, passed: true, text: '已过' }
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return { time: task.reminderTime, passed: false, text: `${diffMin}分钟后` }
  const diffHour = Math.floor(diffMin / 60)
  const remainMin = diffMin % 60
  return { time: task.reminderTime, passed: false, text: `${diffHour}小时${remainMin}分钟后` }
}
