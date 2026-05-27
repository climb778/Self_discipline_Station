import { formatDate } from './date'

const taskBank = {
  '学习': {
    phases: ['基础入门', '深入学习', '强化练习', '综合冲刺'],
    tasks: {
      '基础入门': ['阅读教材', '整理笔记', '观看教学视频', '梳理知识框架'],
      '深入学习': ['精读重点章节', '做课后习题', '总结难点', '小组讨论'],
      '强化练习': ['刷专项练习题', '错题回顾', '模拟测试', '查漏补缺'],
      '综合冲刺': ['全真模拟', '重点回顾', '限时训练', '考前复盘']
    }
  },
  '运动': {
    phases: ['适应期', '提升期', '强化期', '巩固期'],
    tasks: {
      '适应期': ['热身运动', '基础训练', '拉伸放松', '记录体能数据'],
      '提升期': ['热身运动', '核心训练', '有氧运动', '拉伸放松', '记录体重'],
      '强化期': ['动态热身', '高强度训练', '力量训练', '有氧运动', '拉伸恢复'],
      '巩固期': ['热身运动', '综合训练', '柔韧性训练', '运动复盘']
    }
  },
  '生活': {
    phases: ['习惯养成', '规律执行', '深度优化', '长期坚持'],
    tasks: {
      '习惯养成': ['早起打卡', '执行今日习惯', '记录饮食', '整理环境'],
      '规律执行': ['早起打卡', '执行今日习惯', '记录饮食', '适量运动', '阅读'],
      '深度优化': ['早起打卡', '执行今日习惯', '记录饮食', '运动锻炼', '学习新技能', '复盘总结'],
      '长期坚持': ['早起打卡', '执行今日习惯', '记录饮食', '运动锻炼', '复盘总结']
    }
  },
  '工作': {
    phases: ['调研准备', '执行推进', '优化完善', '总结交付'],
    tasks: {
      '调研准备': ['收集资料', '整理需求', '制定方案', '列出待办清单'],
      '执行推进': ['执行核心任务', '进度跟踪', '沟通协调', '处理待办事项'],
      '优化完善': ['检查质量', '优化细节', '测试验证', '修复问题'],
      '总结交付': ['整理成果', '撰写总结', '复盘改进', '归档资料']
    }
  },
  '其他': {
    phases: ['规划阶段', '执行阶段', '检查阶段', '改进阶段'],
    tasks: {
      '规划阶段': ['明确目标', '拆解任务', '制定计划', '准备资源'],
      '执行阶段': ['执行核心任务', '记录进展', '解决障碍', '保持节奏'],
      '检查阶段': ['检查进度', '评估效果', '收集反馈', '调整方向'],
      '改进阶段': ['优化方法', '总结经验', '制定下阶段计划', '成果归档']
    }
  }
}

const intensityConfig = {
  '轻松': { baseTasks: 1, extraTasksPer30: 0.5, focusRatio: 0.8 },
  '标准': { baseTasks: 2, extraTasksPer30: 1, focusRatio: 1 },
  '冲刺': { baseTasks: 3, extraTasksPer30: 1.5, focusRatio: 1.2 }
}

function getPhasesForCategory(category) {
  return taskBank[category] || taskBank['其他']
}

function getWeekDay(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDay()
}

function isRestDay(dateStr, restDays) {
  if (restDays <= 0) return false
  const day = getWeekDay(dateStr)
  if (restDays >= 6) return day !== 0
  if (restDays === 1) return day === 0
  if (restDays === 2) return day === 0 || day === 6
  return day === 0 || (day === 6 && restDays >= 2) || (day === 3 && restDays >= 3)
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function pickTasks(taskList, count) {
  const result = []
  const pool = [...taskList]
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = i % pool.length
    result.push(pool[idx])
  }
  return result
}

export function generateAiPlan(input) {
  const {
    goalName,
    goalDescription,
    category,
    startDate,
    endDate,
    dailyMinutes,
    restDaysPerWeek,
    intensity,
    enableFocusSuggestion,
    enableRepeat
  } = input

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1

  const phaseInfo = getPhasesForCategory(category)
  const phases = phaseInfo.phases
  const taskTemplates = phaseInfo.tasks
  const config = intensityConfig[intensity] || intensityConfig['标准']
  const taskCount = Math.max(1, Math.min(5, Math.round(config.baseTasks + (dailyMinutes / 30) * config.extraTasksPer30)))
  const focusMinutes = enableFocusSuggestion
    ? Math.max(10, Math.round((dailyMinutes / taskCount) * config.focusRatio))
    : 0

  const phaseLength = Math.max(1, Math.floor(totalDays / phases.length))
  const phaseArr = phases.map((name, i) => {
    const phaseStart = addDays(startDate, i * phaseLength)
    const phaseEnd = i === phases.length - 1 ? endDate : addDays(startDate, (i + 1) * phaseLength - 1)
    return { name, startDate: phaseStart, endDate: phaseEnd }
  })

  const tasks = []
  let currentDate = startDate
  let dayIndex = 0

  while (currentDate <= endDate) {
    if (isRestDay(currentDate, restDaysPerWeek)) {
      tasks.push({
        title: '休息日 — 放松身心',
        category: category,
        dueDate: currentDate,
        priority: '低',
        isRest: true,
        focusMinutes: 0
      })
      currentDate = addDays(currentDate, 1)
      dayIndex++
      continue
    }

    const phaseIdx = Math.min(Math.floor(dayIndex / phaseLength), phases.length - 1)
    const phaseName = phases[phaseIdx]
    const templates = taskTemplates[phaseName] || taskTemplates[phases[0]]

    const count = Math.min(taskCount, templates.length)
    const dayTasks = pickTasks(templates, count)
    for (const title of dayTasks) {
      tasks.push({
        title,
        category,
        dueDate: currentDate,
        priority: intensity === '冲刺' ? '高' : intensity === '标准' ? '中' : '低',
        isRest: false,
        focusMinutes
      })
    }

    currentDate = addDays(currentDate, 1)
    dayIndex++
  }

  const workingTasks = tasks.filter(t => !t.isRest)
  const totalFocusMinutes = workingTasks.reduce((sum, t) => sum + t.focusMinutes, 0)

  const repeatTemplates = []
  if (enableRepeat) {
    const uniqueTitles = [...new Set(workingTasks.map(t => t.title))]
    for (const title of uniqueTitles) {
      repeatTemplates.push({
        title,
        category,
        priority: intensity === '冲刺' ? '高' : intensity === '标准' ? '中' : '低',
        focusMinutes,
        repeatEndDate: endDate
      })
    }
  }

  return {
    title: goalName,
    description: goalDescription || `为期 ${totalDays} 天的${category}计划`,
    category,
    startDate,
    endDate,
    targetDays: totalDays,
    phases: phaseArr,
    tasks,
    repeatTemplates,
    totalTasks: workingTasks.length,
    totalFocusMinutes,
    intensity,
    restDaysPerWeek,
    dailyMinutes,
    enableFocusSuggestion,
    enableRepeat
  }
}

export function validateAiPlanInput(input) {
  if (!input.goalName || !input.goalName.trim()) return '请填写目标名称'
  if (!input.startDate) return '请选择开始日期'
  if (!input.endDate) return '请选择结束日期'
  if (input.endDate < input.startDate) return '结束日期不能早于开始日期'
  if (Number(input.dailyMinutes) < 10) return '每天可投入时间不能少于 10 分钟'
  if (Number(input.restDaysPerWeek) > 6) return '每周休息天数不能超过 6 天'
  if (Number(input.restDaysPerWeek) < 0) return '每周休息天数不能为负数'
  return ''
}
