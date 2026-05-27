import { formatDate, getToday } from './date'

const PLANS_STORAGE_KEY = 'SELF_DISCIPLINE_PLANS'

export const planTemplates = [
  {
    title: '英语四级计划',
    description: '每天背单词、做真题、练听力，稳步提升英语水平',
    category: '学习',
    targetDays: 90,
    tasks: ['背单词 50 个', '做一篇阅读理解', '练听力 30 分钟']
  },
  {
    title: '期末复习计划',
    description: '系统复习各科重点，整理笔记，刷历年真题',
    category: '学习',
    targetDays: 30,
    tasks: ['整理课堂笔记', '做一套模拟题', '复习重点章节']
  },
  {
    title: '考研学习计划',
    description: '制定长期学习目标，每天坚持复习，分阶段突破',
    category: '学习',
    targetDays: 180,
    tasks: ['刷题 2 小时', '背英语单词', '复习专业课']
  },
  {
    title: '运动减脂计划',
    description: '坚持运动和健康饮食，每周至少运动 4 次',
    category: '运动',
    targetDays: 60,
    tasks: ['跑步 30 分钟', '做力量训练', '记录饮食']
  },
  {
    title: '早睡早起计划',
    description: '养成规律作息，每天 23:00 前睡觉，7:00 起床',
    category: '生活',
    targetDays: 21,
    tasks: ['23:00 前放下手机', '7:00 起床', '午休不超过 30 分钟']
  },
  {
    title: '编程入门计划',
    description: '每天学一点编程，从基础语法到完成小项目',
    category: '学习',
    targetDays: 60,
    tasks: ['看教程 1 小时', '写练习代码', '做小项目']
  }
]

function normalizePlan(plan = {}) {
  return {
    id: plan.id || `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: plan.title || '未命名计划',
    description: plan.description || '',
    category: plan.category || '其他',
    startDate: plan.startDate || getToday(),
    endDate: plan.endDate || '',
    targetDays: Number(plan.targetDays) || 30,
    status: ['active', 'completed', 'stopped'].includes(plan.status) ? plan.status : 'active',
    createdAt: plan.createdAt || new Date().toISOString(),
    updatedAt: plan.updatedAt || plan.createdAt || new Date().toISOString()
  }
}

export function getPlans() {
  const stored = uni.getStorageSync(PLANS_STORAGE_KEY)
  if (!Array.isArray(stored)) return []
  return stored.map(normalizePlan)
}

export function savePlans(plans) {
  uni.setStorageSync(PLANS_STORAGE_KEY, plans.map(normalizePlan))
}

export function getPlanById(planId) {
  return getPlans().find(p => p.id === planId) || null
}

export function addPlan(payload) {
  const now = new Date().toISOString()
  const plan = normalizePlan({
    id: `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: payload.title,
    description: payload.description || '',
    category: payload.category || '其他',
    startDate: payload.startDate || getToday(),
    endDate: payload.endDate || '',
    targetDays: Number(payload.targetDays) || 30,
    status: 'active',
    createdAt: now,
    updatedAt: now
  })
  const plans = [plan, ...getPlans()]
  savePlans(plans)
  return plan
}

export function updatePlan(planId, payload) {
  const plans = getPlans().map(p => {
    if (p.id !== planId) return p
    return normalizePlan({
      ...p,
      ...payload,
      updatedAt: new Date().toISOString()
    })
  })
  savePlans(plans)
  return plans
}

export function deletePlan(planId) {
  const plans = getPlans().filter(p => p.id !== planId)
  savePlans(plans)
  return plans
}

export function setPlanStatus(planId, status) {
  return updatePlan(planId, { status })
}

export function getPlanTasks(planId, allTasks) {
  if (!planId || !Array.isArray(allTasks)) return []
  return allTasks.filter(
    t => t.planId === planId && !(t.isRepeat && !t.sourceRepeatTaskId)
  )
}

export function getPlanStats(planId, allTasks) {
  const tasks = getPlanTasks(planId, allTasks)
  const total = tasks.length
  const completed = tasks.filter(t => t.isCompleted).length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, rate }
}

export function getPlanRemainingDays(plan) {
  if (!plan || !plan.endDate) return -1
  const end = new Date(`${plan.endDate}T23:59:59`)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000)
  return Math.max(0, diff)
}

export function getActivePlans(plans) {
  return plans.filter(p => p.status === 'active')
}

export function getCompletedPlans(plans) {
  return plans.filter(p => p.status === 'completed')
}

export function getStoppedPlans(plans) {
  return plans.filter(p => p.status === 'stopped')
}

export function getMostImportantPlan(plans, allTasks) {
  const active = getActivePlans(plans)
  if (!active.length) return null
  let best = null
  let bestScore = -1
  for (const p of active) {
    const stats = getPlanStats(p.id, allTasks)
    if (stats.total === 0) continue
    const remaining = getPlanRemainingDays(p)
    const urgency = remaining >= 0 && remaining <= 7 ? 2 : remaining >= 0 && remaining <= 14 ? 1 : 0
    const score = stats.rate + urgency * 10
    if (score > bestScore) {
      bestScore = score
      best = p
    }
  }
  if (best) return best
  return [...active].sort((a, b) => {
    const da = a.endDate || a.createdAt
    const db = b.endDate || b.createdAt
    return da < db ? -1 : da > db ? 1 : 0
  })[0]
}

export function getPlanFocusMinutes(planId, focusRecords) {
  if (!planId || !Array.isArray(focusRecords)) return 0
  return focusRecords
    .filter(r => r.taskId && r.actualMinutes > 0)
    .filter(r => {
      return true
    })
    .reduce((sum, r) => sum + r.actualMinutes, 0)
}

export function getPlanFocusMinutesByTasks(planId, allTasks, focusRecords) {
  const planTaskIds = getPlanTasks(planId, allTasks).map(t => t.id)
  if (!planTaskIds.length) return 0
  return focusRecords
    .filter(r => planTaskIds.includes(r.taskId))
    .reduce((sum, r) => sum + r.actualMinutes, 0)
}
