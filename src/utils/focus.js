import { getToday } from './date'

const FOCUS_STORAGE_KEY = 'SELF_DISCIPLINE_FOCUS_RECORDS'

function normalizeFocusRecord(record = {}) {
  return {
    id: record.id || `focus-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    taskId: record.taskId || '',
    taskTitle: record.taskTitle || '自由专注',
    duration: Number(record.duration) || 25,
    actualMinutes: Number(record.actualMinutes) || 0,
    startedAt: record.startedAt || new Date().toISOString(),
    endedAt: record.endedAt || new Date().toISOString(),
    status: record.status === 'stopped' ? 'stopped' : 'completed'
  }
}

export function getFocusRecords() {
  const stored = uni.getStorageSync(FOCUS_STORAGE_KEY)
  if (!Array.isArray(stored)) return []
  return stored.map(normalizeFocusRecord)
}

export function saveFocusRecords(records) {
  uni.setStorageSync(FOCUS_STORAGE_KEY, Array.isArray(records) ? records.map(normalizeFocusRecord) : [])
}

export function addFocusRecord(record) {
  const records = getFocusRecords()
  const newRecord = normalizeFocusRecord(record)
  records.unshift(newRecord)
  saveFocusRecords(records)
  return newRecord
}

export function getFocusRecordsByTask(taskId, records = getFocusRecords()) {
  if (!taskId) return []
  return records.filter(r => r.taskId === taskId)
}

export function getTaskFocusStats(taskId, allRecords = getFocusRecords()) {
  const records = getFocusRecordsByTask(taskId, allRecords)
  const totalMinutes = records.reduce((sum, r) => sum + r.actualMinutes, 0)
  const count = records.length
  const lastRecord = records[0] || null
  return {
    totalMinutes,
    count,
    lastTime: lastRecord ? lastRecord.endedAt : ''
  }
}

export function getTodayFocusMinutes(records = getFocusRecords()) {
  const today = getToday()
  return records
    .filter(r => r.endedAt && r.endedAt.slice(0, 10) === today)
    .reduce((sum, r) => sum + r.actualMinutes, 0)
}

export function getWeekFocusMinutes(records = getFocusRecords()) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  const startTime = startOfWeek.getTime()
  return records
    .filter(r => new Date(r.endedAt).getTime() >= startTime)
    .reduce((sum, r) => sum + r.actualMinutes, 0)
}

export function getTotalFocusStats(records = getFocusRecords()) {
  return {
    totalMinutes: records.reduce((sum, r) => sum + r.actualMinutes, 0),
    totalCount: records.length
  }
}

export function formatFocusTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
