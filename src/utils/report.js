import { formatDate, getToday } from './date'
import { categories, isRealTask } from './tasks'
import { getFocusRecords } from './focus'

function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start, end, startDate: formatDate(start) }
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start, end, startDate: formatDate(start) }
}

function filterByRange(items, getDate, range) {
  return items.filter(item => {
    const d = getDate(item)
    if (!d) return false
    const time = new Date(d).getTime()
    return time >= range.start.getTime() && time <= range.end.getTime()
  })
}

function getReportStats(tasks, focusRecords, range) {
  const activeTasks = tasks.filter(t => isRealTask(t) && !t.isArchived)

  const completed = activeTasks.filter(t => {
    if (!t.isCompleted || !t.completedAt) return false
    const time = new Date(t.completedAt).getTime()
    return time >= range.start.getTime() && time <= range.end.getTime()
  })

  const created = activeTasks.filter(t => {
    if (!t.createdAt) return false
    const time = new Date(t.createdAt).getTime()
    return time >= range.start.getTime() && time <= range.end.getTime()
  })

  const overdue = activeTasks.filter(t => {
    if (t.isCompleted || t.isLongTerm || !t.dueDate) return false
    const dueTime = new Date(`${t.dueDate}T23:59:59`).getTime()
    return dueTime < Date.now() && dueTime >= range.start.getTime()
  })

  const focusIn = focusRecords.filter(r => {
    if (!r.endedAt) return false
    const time = new Date(r.endedAt).getTime()
    return time >= range.start.getTime() && time <= range.end.getTime()
  })

  const focusMinutes = focusIn.reduce((sum, r) => sum + r.actualMinutes, 0)
  const focusCount = focusIn.length

  const totalRelevant = completed.length + activeTasks.filter(t => {
    if (t.isCompleted) return false
    if (t.isLongTerm) return false
    if (!t.dueDate) return false
    const dueTime = new Date(`${t.dueDate}T23:59:59`).getTime()
    return dueTime <= range.end.getTime() && dueTime >= range.start.getTime()
  }).length

  const completionRate = totalRelevant > 0 ? Math.round((completed.length / totalRelevant) * 100) : 0

  const categoryMap = {}
  categories.forEach(c => { categoryMap[c] = 0 })
  completed.forEach(t => {
    if (categoryMap[t.category] !== undefined) categoryMap[t.category]++
  })

  const categoryStats = categories
    .map(c => ({ category: c, count: categoryMap[c] }))
    .sort((a, b) => b.count - a.count)

  const topCategory = categoryStats.length ? categoryStats[0].category : '暂无'

  const continuousDays = calcContinuousDays(completed, range)

  return {
    completedCount: completed.length,
    newCount: created.length,
    overdueCount: overdue.length,
    focusMinutes,
    focusCount,
    completionRate,
    continuousDays,
    topCategory,
    categoryStats,
    totalCompletedForCategory: completed.length
  }
}

function calcContinuousDays(completedTasks, range) {
  const completedDates = new Set()
  completedTasks.forEach(t => {
    if (t.completedAt) completedDates.add(formatDate(t.completedAt))
  })

  let count = 0
  const cursor = new Date()
  while (cursor >= range.start) {
    const dateStr = formatDate(cursor)
    if (completedDates.has(dateStr)) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return count
}

export function getWeeklyReport(tasks, focusRecords) {
  const range = getWeekRange()
  const stats = getReportStats(tasks, focusRecords, range)
  const summary = generateSummary(stats, '周')
  return { ...stats, summary, period: 'week' }
}

export function getMonthlyReport(tasks, focusRecords) {
  const range = getMonthRange()
  const stats = getReportStats(tasks, focusRecords, range)
  const longestStreak = calcLongestStreakInRange(tasks, range)
  const enriched = { ...stats, longestStreak }
  const summary = generateSummary(enriched, '月')
  return { ...enriched, summary, period: 'month' }
}

function calcLongestStreakInRange(tasks, range) {
  const activeTasks = tasks.filter(t => isRealTask(t) && !t.isArchived && t.isCompleted && t.completedAt)
  const completedDates = new Set()
  activeTasks.forEach(t => {
    const time = new Date(t.completedAt).getTime()
    if (time >= range.start.getTime() && time <= range.end.getTime()) {
      completedDates.add(formatDate(t.completedAt))
    }
  })
  if (completedDates.size === 0) return 0

  const sorted = Array.from(completedDates).sort()
  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`)
    const curr = new Date(`${sorted[i]}T00:00:00`)
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      currentStreak++
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else if (diff > 1) {
      currentStreak = 1
    }
  }
  return maxStreak
}

function generateSummary(stats, period) {
  const { completedCount, focusMinutes, continuousDays, topCategory, completionRate } = stats
  const longest = stats.longestStreak || continuousDays

  if (completedCount === 0 && focusMinutes === 0) {
    return `本${period}暂无数据，从现在开始行动起来吧！每一天都是新的起点。`
  }

  const parts = []
  if (completedCount > 0) {
    parts.push(`完成 ${completedCount} 项任务`)
  }
  if (focusMinutes > 0) {
    parts.push(`专注 ${focusMinutes} 分钟`)
  }
  if (longest > 0) {
    parts.push(`最长连续打卡 ${longest} 天`)
  }

  let comment = ''
  if (completionRate >= 80) {
    comment = '执行力很强，继续保持！'
  } else if (completionRate >= 50) {
    comment = '稳步前进，争取下个周期更进一步。'
  } else if (completedCount > 0) {
    comment = '每一步都算数，坚持就是胜利。'
  }

  const catText = topCategory !== '暂无' ? `最关注「${topCategory}」领域。` : ''

  return `本${period}${parts.join('，')}。${catText}${comment}`
}

export function get7DayTaskTrend(tasks) {
  const result = []
  const cursor = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)
    const count = tasks.filter(t =>
      isRealTask(t) && t.isCompleted && t.completedAt && formatDate(t.completedAt) === dateStr
    ).length
    const weekMap = ['日', '一', '二', '三', '四', '五', '六']
    result.push({
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekDay: weekMap[d.getDay()],
      count
    })
  }
  return result
}

export function get7DayFocusTrend(focusRecords) {
  const result = []
  const cursor = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)
    const minutes = focusRecords
      .filter(r => r.endedAt && r.endedAt.slice(0, 10) === dateStr)
      .reduce((sum, r) => sum + r.actualMinutes, 0)
    const weekMap = ['日', '一', '二', '三', '四', '五', '六']
    result.push({
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekDay: weekMap[d.getDay()],
      minutes
    })
  }
  return result
}
