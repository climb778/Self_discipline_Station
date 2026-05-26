import { getToday } from './date'

const FOCUS_STORAGE_KEY = 'SELF_DISCIPLINE_FOCUS_RECORDS'

function normalizeMinutes(value, fallback = 0) {
  const minutes = Number(value)
  if (!Number.isFinite(minutes)) return fallback
  return Math.max(0, Math.ceil(minutes))
}

function normalizeFocusRecord(record = {}) {
  return {
    id: record.id || `focus-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    taskId: record.taskId || '',
    taskTitle: record.taskTitle || '自由专注',
    duration: normalizeMinutes(record.duration, 25) || 25,
    actualMinutes: normalizeMinutes(record.actualMinutes),
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
  const normalizedRecords = Array.isArray(records)
    ? records.map(normalizeFocusRecord)
    : []
  uni.setStorageSync(FOCUS_STORAGE_KEY, normalizedRecords)
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
  return records.filter(record => record.taskId === taskId)
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
    .filter(record => record.endedAt && record.endedAt.slice(0, 10) === today)
    .reduce((sum, record) => sum + record.actualMinutes, 0)
}

export function getWeekFocusMinutes(records = getFocusRecords()) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  const startTime = startOfWeek.getTime()
  return records
    .filter(record => new Date(record.endedAt).getTime() >= startTime)
    .reduce((sum, record) => sum + record.actualMinutes, 0)
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
