import { getToday } from './date'

const STUDY_LOG_STORAGE_KEY = 'SELF_DISCIPLINE_STUDY_LOGS'

export const subjectOptions = ['英语', 'Java', '数据库', '论文', '比赛项目', '其他']
export const masteryOptions = ['低', '中', '高']

function normalizeStudyLog(log = {}) {
  const now = new Date().toISOString()
  return {
    id: log.id || `study-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: log.date || getToday(),
    subject: log.subject || '其他',
    title: log.title || '',
    content: log.content || '',
    duration: Math.max(0, Number(log.duration) || 0),
    mastery: log.mastery || '中',
    problems: log.problems || '',
    nextReview: log.nextReview || '',
    relatedTaskId: log.relatedTaskId || '',
    relatedPlanId: log.relatedPlanId || '',
    createdAt: log.createdAt || now,
    updatedAt: log.updatedAt || now
  }
}

export function getStudyLogs() {
  const stored = uni.getStorageSync(STUDY_LOG_STORAGE_KEY)
  if (!Array.isArray(stored)) return []
  return stored.map(normalizeStudyLog)
}

export function saveStudyLogs(logs) {
  const normalized = Array.isArray(logs) ? logs.map(normalizeStudyLog) : []
  uni.setStorageSync(STUDY_LOG_STORAGE_KEY, normalized)
}

export function addStudyLog(payload) {
  const logs = getStudyLogs()
  const now = new Date().toISOString()
  const log = normalizeStudyLog({
    ...payload,
    id: `study-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: now,
    updatedAt: now
  })
  logs.unshift(log)
  saveStudyLogs(logs)
  return log
}

export function updateStudyLog(id, patch) {
  const logs = getStudyLogs()
  const idx = logs.findIndex(l => l.id === id)
  if (idx === -1) return null
  logs[idx] = normalizeStudyLog({
    ...logs[idx],
    ...patch,
    id: logs[idx].id,
    createdAt: logs[idx].createdAt,
    updatedAt: new Date().toISOString()
  })
  saveStudyLogs(logs)
  return logs[idx]
}

export function deleteStudyLog(id) {
  const logs = getStudyLogs().filter(l => l.id !== id)
  saveStudyLogs(logs)
  return logs
}

export function getStudyLogsByDate(date, logs = getStudyLogs()) {
  return logs.filter(l => l.date === date)
}

export function getTodayStudyLogs(logs = getStudyLogs()) {
  return getStudyLogsByDate(getToday(), logs)
}

export function getTodayStudyMinutes(logs = getStudyLogs()) {
  return getTodayStudyLogs(logs).reduce((sum, l) => sum + l.duration, 0)
}

export function getWeekStudyMinutes(logs = getStudyLogs()) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  const startTime = startOfWeek.getTime()
  return logs
    .filter(l => new Date(`${l.date}T00:00:00`).getTime() >= startTime)
    .reduce((sum, l) => sum + l.duration, 0)
}

export function getMonthStudyMinutes(logs = getStudyLogs()) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const startTime = startOfMonth.getTime()
  return logs
    .filter(l => new Date(`${l.date}T00:00:00`).getTime() >= startTime)
    .reduce((sum, l) => sum + l.duration, 0)
}

export function getRecentSubject(logs = getStudyLogs()) {
  if (!logs.length) return '暂无'
  const sorted = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return sorted[0].subject
}

export function getStudyLogById(id) {
  return getStudyLogs().find(l => l.id === id) || null
}
