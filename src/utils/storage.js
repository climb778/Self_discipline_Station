import { formatDate, getToday } from './date'
import { getFocusRecords, saveFocusRecords } from './focus'

const TASK_STORAGE_KEY = 'SELF_DISCIPLINE_TASKS'
const USER_STORAGE_KEY = 'SELF_DISCIPLINE_USER'
const SETTINGS_STORAGE_KEY = 'SELF_DISCIPLINE_SETTINGS'
const ACHIEVEMENT_STORAGE_KEY = 'SELF_DISCIPLINE_ACHIEVEMENTS'

export const APP_NAME = '自律小站'
export const APP_VERSION = '1.5.1'

export const themeOptions = [
  {
    label: '默认蓝',
    value: 'blue',
    primary: '#0b4aa2',
    secondary: '#2674d9',
    soft: '#eaf3ff',
    shadow: 'rgba(11, 74, 162, 0.22)'
  },
  {
    label: '森林绿',
    value: 'forest',
    primary: '#197a55',
    secondary: '#35a77a',
    soft: '#e9f8f1',
    shadow: 'rgba(25, 122, 85, 0.22)'
  },
  {
    label: '暖橙色',
    value: 'orange',
    primary: '#d96b16',
    secondary: '#f09a3e',
    soft: '#fff3e7',
    shadow: 'rgba(217, 107, 22, 0.22)'
  }
]

const defaultUser = {
  nickname: '自律行动家',
  signature: '每天进步一点点，时间会给答案',
  avatar: ''
}

const defaultSettings = {
  theme: 'blue',
  enableReminder: true,
  reminderLeadMinutes: 0,
  defaultFocusDuration: 25,
  enableFocusSound: false
}

function makeTaskFields(overrides = {}) {
  return {
    isRepeat: false,
    repeatType: 'none',
    repeatDays: [],
    repeatEndDate: '',
    enableReminder: false,
    reminderTime: '',
    sourceRepeatTaskId: '',
    generatedDate: '',
    isArchived: false,
    archivedAt: '',
    ...overrides
  }
}

function normalizeTask(task) {
  return {
    ...makeTaskFields(),
    id: task.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: task.title || '未命名任务',
    description: task.description || '',
    category: task.category || '其他',
    priority: task.priority || '中',
    dueDate: task.dueDate || getToday(),
    isLongTerm: Boolean(task.isLongTerm),
    isCompleted: Boolean(task.isCompleted),
    completedAt: task.completedAt || '',
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
    ...task,
    repeatDays: Array.isArray(task.repeatDays) ? task.repeatDays : [],
    repeatType: task.repeatType || 'none',
    repeatEndDate: task.repeatEndDate || '',
    reminderTime: task.reminderTime || '',
    sourceRepeatTaskId: task.sourceRepeatTaskId || '',
    generatedDate: task.generatedDate || '',
    archivedAt: task.archivedAt || '',
    isRepeat: Boolean(task.isRepeat),
    enableReminder: Boolean(task.enableReminder),
    isArchived: Boolean(task.isArchived)
  }
}

const seedTasks = [
  normalizeTask({
    id: 'seed-1',
    title: '晨间阅读 30 分钟',
    description: '保持输入，记录一句收获',
    category: '学习',
    priority: '高',
    dueDate: getToday(),
    isLongTerm: true,
    isCompleted: false,
    createdAt: `${getToday()}T08:00:00`,
    updatedAt: `${getToday()}T08:00:00`
  }),
  normalizeTask({
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
  })
]

export function getTasks() {
  const stored = uni.getStorageSync(TASK_STORAGE_KEY)
  if (Array.isArray(stored)) {
    const normalized = stored.map(normalizeTask)
    saveTasks(normalized)
    return normalized
  }
  uni.setStorageSync(TASK_STORAGE_KEY, seedTasks)
  return seedTasks
}

export function getTaskById(taskId) {
  return getTasks().find(task => task.id === taskId)
}

export function saveTasks(tasks) {
  uni.setStorageSync(TASK_STORAGE_KEY, tasks.map(normalizeTask))
}

export function addTask(payload) {
  const now = new Date().toISOString()
  const isRepeat = Boolean(payload.isRepeat)
  const task = normalizeTask({
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
    updatedAt: now,
    isRepeat,
    repeatType: isRepeat ? payload.repeatType || 'daily' : 'none',
    repeatDays: isRepeat ? payload.repeatDays || [] : [],
    repeatEndDate: isRepeat ? payload.repeatEndDate || '' : '',
    enableReminder: Boolean(payload.enableReminder),
    reminderTime: payload.reminderTime || '',
    sourceRepeatTaskId: payload.sourceRepeatTaskId || '',
    generatedDate: payload.generatedDate || '',
    isArchived: false,
    archivedAt: ''
  })
  const tasks = [task, ...getTasks()]
  saveTasks(tasks)
  return task
}

export function updateTask(taskId, updater) {
  const tasks = getTasks().map(task => {
    if (task.id !== taskId) return task
    const patch = typeof updater === 'function' ? updater(task) : updater
    return normalizeTask({
      ...task,
      ...patch,
      updatedAt: new Date().toISOString()
    })
  })
  saveTasks(tasks)
  return tasks
}

export function updateTaskFields(taskId, payload) {
  const isRepeat = Boolean(payload.isRepeat)
  return updateTask(taskId, {
    title: payload.title,
    description: payload.description || '',
    category: payload.category || '其他',
    priority: payload.priority || '中',
    dueDate: payload.dueDate || getToday(),
    isLongTerm: Boolean(payload.isLongTerm),
    isRepeat,
    repeatType: isRepeat ? payload.repeatType || 'daily' : 'none',
    repeatDays: isRepeat ? payload.repeatDays || [] : [],
    repeatEndDate: isRepeat ? payload.repeatEndDate || '' : '',
    enableReminder: Boolean(payload.enableReminder),
    reminderTime: payload.reminderTime || ''
  })
}

export function deleteTask(taskId) {
  const tasks = getTasks().filter(task => task.id !== taskId)
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

export function setTaskArchived(taskId, isArchived) {
  return updateTask(taskId, {
    isArchived,
    archivedAt: isArchived ? new Date().toISOString() : ''
  })
}

function getWeekdayIndex(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDay()
}

function getRepeatStartDate(task) {
  return task.dueDate || task.createdAt.slice(0, 10)
}

function shouldGenerateToday(task, today) {
  if (!task.isRepeat || task.repeatType === 'none' || task.isArchived) return false
  if (task.repeatEndDate && task.repeatEndDate < today) return false

  const startDate = getRepeatStartDate(task)
  if (startDate > today) return false

  const dayOfWeek = getWeekdayIndex(today)

  switch (task.repeatType) {
    case 'daily':
      return true
    case 'weekly':
      return getWeekdayIndex(startDate) === dayOfWeek
    case 'monthly':
      return new Date(`${today}T00:00:00`).getDate() === new Date(`${startDate}T00:00:00`).getDate()
    case 'custom':
      return task.repeatDays && task.repeatDays.includes(dayOfWeek)
    default:
      return false
  }
}

export function generateRepeatTasks() {
  const today = getToday()
  const tasks = getTasks()
  const repeatTemplates = tasks.filter(
    task => task.isRepeat
      && task.repeatType !== 'none'
      && !task.sourceRepeatTaskId
      && !task.isArchived
  )
  const generated = []

  for (const template of repeatTemplates) {
    if (!shouldGenerateToday(template, today)) continue

    const alreadyExists = getTasks().some(
      task => task.sourceRepeatTaskId === template.id && task.generatedDate === today
    )
    if (alreadyExists) continue

    const newTask = addTask({
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority,
      dueDate: today,
      isLongTerm: false,
      isRepeat: false,
      repeatType: 'none',
      repeatDays: [],
      repeatEndDate: '',
      enableReminder: template.enableReminder,
      reminderTime: template.reminderTime,
      sourceRepeatTaskId: template.id,
      generatedDate: today
    })
    generated.push(newTask)
  }

  return generated
}

export function getUser() {
  return {
    ...defaultUser,
    ...(uni.getStorageSync(USER_STORAGE_KEY) || {})
  }
}

export function saveUser(user) {
  const nextUser = {
    ...getUser(),
    ...user
  }
  uni.setStorageSync(USER_STORAGE_KEY, nextUser)
  return nextUser
}

export function getSettings() {
  return {
    ...defaultSettings,
    ...(uni.getStorageSync(SETTINGS_STORAGE_KEY) || {})
  }
}

export function saveSettings(settings) {
  const nextSettings = {
    ...getSettings(),
    ...settings
  }
  uni.setStorageSync(SETTINGS_STORAGE_KEY, nextSettings)
  return nextSettings
}

export function getThemeMeta(theme = getSettings().theme) {
  return themeOptions.find(item => item.value === theme) || themeOptions[0]
}

export function getThemeClass(theme = getSettings().theme) {
  return `theme-${getThemeMeta(theme).value}`
}

export function applyThemeChrome(theme = getSettings().theme) {
  const meta = getThemeMeta(theme)
  uni.setNavigationBarColor({
    frontColor: '#ffffff',
    backgroundColor: meta.primary
  })
  uni.setTabBarStyle({
    selectedColor: meta.primary,
    backgroundColor: '#ffffff',
    borderStyle: 'white'
  })
}

export function getAchievementUnlocks() {
  return uni.getStorageSync(ACHIEVEMENT_STORAGE_KEY) || {}
}

export function saveAchievementUnlocks(unlocks) {
  uni.setStorageSync(ACHIEVEMENT_STORAGE_KEY, unlocks)
}

export function exportAllData() {
  return {
    appName: APP_NAME,
    version: APP_VERSION,
    exportTime: new Date().toISOString(),
    tasks: getTasks(),
    focusRecords: getFocusRecords(),
    user: getUser(),
    settings: getSettings()
  }
}

export function validateImportData(data) {
  if (!data || typeof data !== 'object') return 'JSON 内容不是有效对象'
  if (!Array.isArray(data.tasks)) return '缺少 tasks 数组'
  if (data.tasks.some(task => !task || typeof task !== 'object')) return 'tasks 中存在无效任务'
  if (data.focusRecords && !Array.isArray(data.focusRecords)) return 'focusRecords 格式不正确'
  if (
    Array.isArray(data.focusRecords)
    && data.focusRecords.some(record => !record || typeof record !== 'object')
  ) {
    return 'focusRecords 中存在无效记录'
  }
  if (data.user && typeof data.user !== 'object') return 'user 格式不正确'
  if (data.settings && typeof data.settings !== 'object') return 'settings 格式不正确'
  return ''
}

export function importAllData(data) {
  const error = validateImportData(data)
  if (error) throw new Error(error)
  saveTasks(data.tasks)
  saveFocusRecords(data.focusRecords || [])
  uni.setStorageSync(USER_STORAGE_KEY, {
    ...defaultUser,
    ...(data.user || {})
  })
  uni.setStorageSync(SETTINGS_STORAGE_KEY, {
    ...defaultSettings,
    ...(data.settings || {})
  })
  saveAchievementUnlocks({})
}

export function clearAllData() {
  saveTasks([])
  saveFocusRecords([])
  uni.setStorageSync(USER_STORAGE_KEY, defaultUser)
  uni.setStorageSync(SETTINGS_STORAGE_KEY, defaultSettings)
  saveAchievementUnlocks({})
}

function createDemoTask(index, overrides) {
  const now = new Date()
  now.setDate(now.getDate() - index)
  const date = formatDate(now)
  return normalizeTask({
    id: `demo-${Date.now()}-${index}`,
    title: overrides.title,
    description: overrides.description || '这是一条用于展示的数据',
    category: overrides.category,
    priority: overrides.priority || '中',
    dueDate: overrides.dueDate || date,
    isLongTerm: Boolean(overrides.isLongTerm),
    isCompleted: Boolean(overrides.isCompleted),
    completedAt: overrides.isCompleted ? `${date}T20:00:00` : '',
    createdAt: `${date}T08:00:00`,
    updatedAt: `${date}T20:00:00`,
    enableReminder: Boolean(overrides.enableReminder),
    reminderTime: overrides.reminderTime || '',
    isArchived: Boolean(overrides.isArchived),
    archivedAt: overrides.isArchived ? `${date}T21:00:00` : '',
    isRepeat: Boolean(overrides.isRepeat),
    repeatType: overrides.repeatType || 'none',
    repeatDays: overrides.repeatDays || [],
    repeatEndDate: overrides.repeatEndDate || ''
  })
}

export function generateDemoData() {
  const today = getToday()
  const tasks = [
    createDemoTask(0, {
      title: '背单词',
      category: '学习',
      priority: '高',
      dueDate: today,
      enableReminder: true,
      reminderTime: '20:30'
    }),
    createDemoTask(0, { title: '跑步 20 分钟', category: '运动', priority: '中', dueDate: today, isCompleted: true }),
    createDemoTask(1, { title: '复习课堂笔记', category: '学习', priority: '中', isCompleted: true }),
    createDemoTask(2, { title: '整理房间', category: '生活', priority: '低', isCompleted: true }),
    createDemoTask(3, { title: '写周报', category: '工作', priority: '高', isCompleted: true }),
    createDemoTask(4, { title: '跳绳', category: '运动', priority: '中', isCompleted: true }),
    createDemoTask(5, { title: '阅读 30 分钟', category: '学习', priority: '中', isCompleted: true, isArchived: true }),
    createDemoTask(0, {
      title: '每日复盘',
      category: '生活',
      priority: '中',
      dueDate: today,
      isRepeat: true,
      repeatType: 'daily',
      enableReminder: true,
      reminderTime: '21:30'
    })
  ]
  saveTasks(tasks)
  saveUser({
    nickname: '自律行动家',
    signature: '把今天过好，就是最稳的长期主义',
    avatar: ''
  })
  saveSettings({
    theme: 'blue',
    enableReminder: true,
    reminderLeadMinutes: 0
  })
  saveAchievementUnlocks({})
  generateRepeatTasks()
  saveFocusRecords([
    {
      taskId: tasks[0].id,
      taskTitle: tasks[0].title,
      duration: 25,
      actualMinutes: 25,
      startedAt: `${today}T20:00:00`,
      endedAt: `${today}T20:25:00`,
      status: 'completed'
    },
    {
      taskId: tasks[1].id,
      taskTitle: tasks[1].title,
      duration: 15,
      actualMinutes: 12,
      startedAt: `${today}T18:00:00`,
      endedAt: `${today}T18:12:00`,
      status: 'stopped'
    }
  ])
}
