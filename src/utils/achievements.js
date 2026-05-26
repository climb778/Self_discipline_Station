import { getAchievementUnlocks, saveAchievementUnlocks } from './storage'
import { getLongestStreak, isRealTask } from './tasks'

export const achievementDefinitions = [
  {
    id: 'first_action',
    name: '初次行动',
    condition: '完成第 1 个任务',
    target: 1,
    getProgress: tasks => tasks.filter(task => isRealTask(task) && task.isCompleted).length
  },
  {
    id: 'three_days',
    name: '坚持三天',
    condition: '连续打卡 3 天',
    target: 3,
    getProgress: tasks => getLongestStreak(tasks)
  },
  {
    id: 'seven_days',
    name: '坚持一周',
    condition: '连续打卡 7 天',
    target: 7,
    getProgress: tasks => getLongestStreak(tasks)
  },
  {
    id: 'efficiency_master',
    name: '效率达人',
    condition: '累计完成 50 个任务',
    target: 50,
    getProgress: tasks => tasks.filter(task => isRealTask(task) && task.isCompleted).length
  },
  {
    id: 'hundred_plan',
    name: '百日计划',
    condition: '累计完成 100 个任务',
    target: 100,
    getProgress: tasks => tasks.filter(task => isRealTask(task) && task.isCompleted).length
  },
  {
    id: 'study_star',
    name: '学习标兵',
    condition: '完成学习类任务 20 个',
    target: 20,
    getProgress: tasks => tasks.filter(task => isRealTask(task) && task.isCompleted && task.category === '学习').length
  },
  {
    id: 'sport_master',
    name: '运动达人',
    condition: '完成运动类任务 10 个',
    target: 10,
    getProgress: tasks => tasks.filter(task => isRealTask(task) && task.isCompleted && task.category === '运动').length
  }
]

export function getAchievements(tasks) {
  const unlocks = { ...getAchievementUnlocks() }
  let changed = false

  const achievements = achievementDefinitions.map(item => {
    const progress = item.getProgress(tasks)
    const unlocked = progress >= item.target || Boolean(unlocks[item.id])
    if (unlocked && !unlocks[item.id]) {
      unlocks[item.id] = new Date().toISOString()
      changed = true
    }

    return {
      ...item,
      progress,
      unlocked,
      unlockedAt: unlocks[item.id] || ''
    }
  })

  if (changed) {
    saveAchievementUnlocks(unlocks)
  }

  return achievements
}
