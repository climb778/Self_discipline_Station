import { formatDate, getToday } from './date'
import { categories, isRealTask } from './tasks'
import { getFocusRecords } from './focus'
import { getPlanStats, getActivePlans } from './plans'

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

function getReportStats(tasks, focusRecords, range, plans, studyLogs) {
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

  const topCategory = categoryStats.length && categoryStats[0].count > 0
    ? categoryStats[0].category
    : '暂无'

  const continuousDays = calcContinuousDays(completed, range)

  const planTaskCompleted = completed.filter(t => t.planId)
  const planIdsWithProgress = new Set(planTaskCompleted.map(t => t.planId))
  const pushedPlanCount = plans ? plans.filter(p => planIdsWithProgress.has(p.id)).length : 0

  const planFocusMinutes = focusIn
    .filter(r => r.taskId && tasks.some(t => t.id === r.taskId && t.planId))
    .reduce((sum, r) => sum + r.actualMinutes, 0)

  let fastestPlan = '暂无'
  if (plans && plans.length > 0) {
    let bestCount = 0
    for (const p of plans) {
      const count = planTaskCompleted.filter(t => t.planId === p.id).length
      if (count > bestCount) {
        bestCount = count
        fastestPlan = p.title
      }
    }
  }

  const logsIn = Array.isArray(studyLogs)
    ? studyLogs.filter(l => {
        if (!l.date) return false
        const logTime = new Date(`${l.date}T00:00:00`).getTime()
        return logTime >= range.start.getTime() && logTime <= range.end.getTime()
      })
    : []
  const studyLogCount = logsIn.length
  const studyLogMinutes = logsIn.reduce((sum, l) => sum + (l.duration || 0), 0)
  const subjectMap = {}
  logsIn.forEach(l => {
    subjectMap[l.subject] = (subjectMap[l.subject] || 0) + 1
  })
  const topStudySubject = Object.keys(subjectMap).length > 0
    ? Object.entries(subjectMap).sort((a, b) => b[1] - a[1])[0][0]
    : '暂无'

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
    totalCompletedForCategory: completed.length,
    pushedPlanCount,
    planTaskCompleted: planTaskCompleted.length,
    planFocusMinutes,
    fastestPlan,
    studyLogCount,
    studyLogMinutes,
    topStudySubject
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

export function getWeeklyReport(tasks, focusRecords, plans, studyLogs) {
  const range = getWeekRange()
  const stats = getReportStats(tasks, focusRecords, range, plans, studyLogs)
  const summary = generateSummary(stats, '周')
  return { ...stats, summary, period: 'week' }
}

export function getMonthlyReport(tasks, focusRecords, plans, studyLogs) {
  const range = getMonthRange()
  const stats = getReportStats(tasks, focusRecords, range, plans, studyLogs)
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
  const { pushedPlanCount, planTaskCompleted, fastestPlan, studyLogCount, studyLogMinutes, topStudySubject } = stats

  if (completedCount === 0 && focusMinutes === 0 && studyLogCount === 0) {
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

  const planParts = []
  if (pushedPlanCount > 0) {
    planParts.push(`推进 ${pushedPlanCount} 个计划`)
  }
  if (planTaskCompleted > 0) {
    planParts.push(`完成 ${planTaskCompleted} 项计划任务`)
  }

  const studyParts = []
  if (studyLogCount > 0) {
    studyParts.push(`记录 ${studyLogCount} 次学习`)
  }
  if (studyLogMinutes > 0) {
    studyParts.push(`学习 ${studyLogMinutes} 分钟`)
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
  const planText = planParts.length > 0 ? `${planParts.join('，')}。` : ''
  const fastestText = fastestPlan !== '暂无' ? `推进最快的是「${fastestPlan}」。` : ''
  const studyText = studyParts.length > 0 ? `${studyParts.join('，')}。` : ''
  const studySubjectText = topStudySubject !== '暂无' ? `学习重点是「${topStudySubject}」。` : ''

  const mainText = parts.length > 0 ? `本${period}${parts.join('，')}。` : `本${period}`
  return `${mainText}${planText}${fastestText}${studyText}${studySubjectText}${catText}${comment}`
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
