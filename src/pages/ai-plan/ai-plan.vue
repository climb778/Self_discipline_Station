<template>
  <view class="page-shell" :class="themeClass">
    <view class="hero-card ai-hero">
      <text class="ai-title">智能计划生成</text>
      <text class="ai-sub">输入你的目标，自动生成执行方案</text>
    </view>

    <!-- Step 1: Input Form -->
    <template v-if="step === 'input'">
      <text class="section-title">目标信息</text>
      <view class="card form-card">
        <view class="field">
          <text class="label">目标名称</text>
          <input v-model.trim="form.goalName" class="input" placeholder="例如：英语四级考试、减脂 10 斤" />
        </view>
        <view class="field">
          <text class="label">目标描述（可选）</text>
          <textarea v-model.trim="form.goalDescription" class="textarea" placeholder="补充说明你的目标和期望" />
        </view>
        <view class="field">
          <text class="label">计划类型</text>
          <view class="chips">
            <text v-for="item in categoryOptions" :key="item" class="chip" :class="{ active: form.category === item }" @tap="form.category = item">{{ item }}</text>
          </view>
        </view>
      </view>

      <text class="section-title">时间安排</text>
      <view class="card form-card">
        <view class="field">
          <text class="label">开始日期</text>
          <picker mode="date" :value="form.startDate" @change="form.startDate = $event.detail.value">
            <view class="picker-value">{{ form.startDate }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">结束日期</text>
          <picker mode="date" :value="form.endDate" :start="form.startDate" @change="form.endDate = $event.detail.value">
            <view class="picker-value">{{ form.endDate }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">每天可投入时间</text>
          <view class="chips">
            <text v-for="m in minuteOptions" :key="m" class="chip" :class="{ active: form.dailyMinutes === m }" @tap="form.dailyMinutes = m">{{ m }} 分钟</text>
          </view>
        </view>
        <view class="field">
          <text class="label">每周休息天数</text>
          <view class="chips">
            <text v-for="d in restDayOptions" :key="d" class="chip" :class="{ active: form.restDaysPerWeek === d }" @tap="form.restDaysPerWeek = d">{{ d === 0 ? '不休息' : d + ' 天' }}</text>
          </view>
        </view>
      </view>

      <text class="section-title">执行偏好</text>
      <view class="card form-card">
        <view class="field">
          <text class="label">任务强度</text>
          <view class="chips">
            <text v-for="item in intensityOptions" :key="item" class="chip" :class="{ active: form.intensity === item }" @tap="form.intensity = item">{{ item }}</text>
          </view>
          <text class="hint">{{ intensityHint }}</text>
        </view>
        <view class="switch-line">
          <view>
            <text class="label">生成番茄钟专注建议</text>
            <text class="hint">为每日任务推荐专注时长</text>
          </view>
          <switch :checked="form.enableFocusSuggestion" :color="themeColor" @change="form.enableFocusSuggestion = $event.detail.value" />
        </view>
        <view class="switch-line">
          <view>
            <text class="label">生成重复任务</text>
            <text class="hint">任务自动按日重复生成</text>
          </view>
          <switch :checked="form.enableRepeat" :color="themeColor" @change="form.enableRepeat = $event.detail.value" />
        </view>
      </view>

      <button class="primary-button gen-btn" @tap="handleGenerate">生成计划方案</button>
    </template>

    <!-- Step 2: Draft Preview -->
    <template v-if="step === 'draft' && draft">
      <text class="section-title">计划概览</text>
      <view class="card draft-overview">
        <text class="draft-title">{{ draft.title }}</text>
        <text class="draft-desc">{{ draft.description }}</text>
        <view class="draft-meta">
          <view class="dm-item">
            <text class="dm-label">分类</text>
            <text class="dm-value">{{ draft.category }}</text>
          </view>
          <view class="dm-item">
            <text class="dm-label">总天数</text>
            <text class="dm-value">{{ draft.targetDays }} 天</text>
          </view>
          <view class="dm-item">
            <text class="dm-label">任务数</text>
            <text class="dm-value">{{ draft.totalTasks }} 个</text>
          </view>
          <view class="dm-item">
            <text class="dm-label">每日投入</text>
            <text class="dm-value">{{ draft.dailyMinutes }} 分钟</text>
          </view>
        </view>
        <view class="draft-meta" style="margin-top: 14rpx;">
          <view class="dm-item">
            <text class="dm-label">强度</text>
            <text class="dm-value">{{ draft.intensity }}</text>
          </view>
          <view class="dm-item">
            <text class="dm-label">建议专注</text>
            <text class="dm-value">{{ draft.tasks.find(t => !t.isRest)?.focusMinutes || 0 }} 分钟/次</text>
          </view>
          <view v-if="draft.enableRepeat" class="dm-item">
            <text class="dm-label">重复模板</text>
            <text class="dm-value">{{ draft.repeatTemplates.length }} 个</text>
          </view>
        </view>
        <view class="draft-dates">
          <text>{{ draft.startDate }} 至 {{ draft.endDate }}</text>
        </view>
      </view>

      <text class="section-title">阶段安排</text>
      <view class="card">
        <view v-for="(phase, i) in draft.phases" :key="i" class="phase-row">
          <view class="phase-dot" :style="{ background: phaseColor(i) }"></view>
          <view class="phase-info">
            <text class="phase-name">阶段 {{ i + 1 }}：{{ phase.name }}</text>
            <text class="phase-date">{{ phase.startDate }} ~ {{ phase.endDate }}</text>
          </view>
        </view>
      </view>

      <text class="section-title">每日任务预览</text>
      <view class="card">
        <view v-for="(group, idx) in previewGroups" :key="idx" class="preview-group">
          <text class="preview-date">{{ group.date }}{{ group.isRest ? ' （休息日）' : '' }}</text>
          <view v-for="(t, ti) in group.tasks" :key="ti" class="preview-task">
            <text class="preview-task-title">{{ t.title }}</text>
            <view class="preview-task-tags">
              <text class="ptag">{{ t.category }}</text>
              <text v-if="t.focusMinutes" class="ptag focus">专注 {{ t.focusMinutes }} 分钟</text>
              <text v-if="t.isRepeat" class="ptag repeat">重复</text>
            </view>
          </view>
        </view>
        <view v-if="draft.tasks.length > previewLimit" class="preview-more">
          <text class="muted">仅展示前 {{ previewLimit }} 天，共 {{ draft.targetDays }} 天任务</text>
        </view>
      </view>

      <view class="draft-actions">
        <button class="primary-button" @tap="handleSave">保存为目标计划</button>
        <button class="soft-button" @tap="handleRegenerate">重新生成</button>
        <button class="soft-button" @tap="handleClear">清空输入</button>
      </view>
    </template>

    <view v-if="step === 'input' && !draft" class="empty-hint">
      <text class="muted">填写目标信息后，点击「生成计划方案」</text>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getToday, formatDate } from '../../utils/date'
import { getThemeClass, getThemeMeta, addTask } from '../../utils/storage'
import { addPlan } from '../../utils/plans'
import { generateAiPlan, validateAiPlanInput } from '../../utils/aiPlan'

const step = ref('input')
const draft = ref(null)
const themeClass = ref(getThemeClass())
const themeColor = computed(() => getThemeMeta().primary)

const categoryOptions = ['学习', '运动', '生活', '工作', '其他']
const intensityOptions = ['轻松', '标准', '冲刺']
const minuteOptions = [15, 30, 45, 60, 90, 120]
const restDayOptions = [0, 1, 2, 3, 4, 5, 6]
const previewLimit = 5

const defaultEnd = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return formatDate(d)
})()

const form = reactive({
  goalName: '',
  goalDescription: '',
  category: '学习',
  startDate: getToday(),
  endDate: defaultEnd,
  dailyMinutes: 30,
  restDaysPerWeek: 1,
  intensity: '标准',
  enableFocusSuggestion: true,
  enableRepeat: false
})

const intensityHint = computed(() => {
  const map = {
    '轻松': '每天 2 个任务，建议专注 15 分钟',
    '标准': '每天 3 个任务，建议专注 25 分钟',
    '冲刺': '每天 4+ 个任务，建议专注 40 分钟'
  }
  return map[form.intensity] || ''
})

const previewGroups = computed(() => {
  if (!draft.value) return []
  const groups = []
  const tasks = draft.value.tasks
  const dates = [...new Set(tasks.map(t => t.dueDate))].slice(0, previewLimit)
  for (const date of dates) {
    const dayTasks = tasks.filter(t => t.dueDate === date)
    groups.push({
      date,
      isRest: dayTasks.every(t => t.isRest),
      tasks: dayTasks
    })
  }
  return groups
})

function phaseColor(index) {
  const colors = ['#0b4aa2', '#2674d9', '#29bf7f', '#d99616', '#e84f4f']
  return colors[index % colors.length]
}

function handleGenerate() {
  const error = validateAiPlanInput(form)
  if (error) {
    uni.showToast({ title: error, icon: 'none' })
    return
  }
  draft.value = generateAiPlan({ ...form })
  step.value = 'draft'
  uni.pageScrollTo({ scrollTop: 0, duration: 200 })
}

function handleRegenerate() {
  draft.value = generateAiPlan({ ...form })
  uni.pageScrollTo({ scrollTop: 0, duration: 200 })
}

function handleClear() {
  draft.value = null
  step.value = 'input'
  form.goalName = ''
  form.goalDescription = ''
  uni.pageScrollTo({ scrollTop: 0, duration: 200 })
}

function handleSave() {
  if (!draft.value) return
  const workingTasks = draft.value.tasks.filter(t => !t.isRest)
  if (workingTasks.length === 0) {
    uni.showToast({ title: '没有可保存的任务，请调整日期或休息天数', icon: 'none', duration: 2500 })
    return
  }
  try {
    const plan = addPlan({
      title: draft.value.title,
      description: draft.value.description,
      category: draft.value.category,
      startDate: draft.value.startDate,
      endDate: draft.value.endDate,
      targetDays: draft.value.targetDays
    })

    if (draft.value.enableRepeat && draft.value.repeatTemplates && draft.value.repeatTemplates.length > 0) {
      for (const rt of draft.value.repeatTemplates) {
        addTask({
          title: rt.title,
          category: rt.category,
          dueDate: draft.value.startDate,
          priority: rt.priority,
          planId: plan.id,
          isRepeat: true,
          repeatType: 'daily',
          repeatEndDate: rt.repeatEndDate,
          enableReminder: false,
          reminderTime: ''
        })
      }
    } else {
      for (const t of workingTasks) {
        addTask({
          title: t.title,
          category: t.category,
          dueDate: t.dueDate,
          priority: t.priority,
          planId: plan.id,
          enableReminder: false,
          reminderTime: ''
        })
      }
    }

    uni.showToast({ title: '计划已保存', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/plan-detail/plan-detail?id=${plan.id}` })
    }, 500)
  } catch (e) {
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
}

onShow(() => {
  themeClass.value = getThemeClass()
})
</script>

<style scoped>
.ai-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.ai-title {
  font-size: 42rpx;
  font-weight: 800;
}

.ai-sub {
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
}

.form-card {
  padding: 28rpx;
}

.field {
  margin-bottom: 28rpx;
}

.field:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  color: #172033;
  font-size: 29rpx;
  font-weight: 700;
}

.hint {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 24rpx;
}

.input,
.textarea,
.picker-value {
  box-sizing: border-box;
  width: 100%;
  margin-top: 16rpx;
  border-radius: 22rpx;
  color: #172033;
  font-size: 28rpx;
  background: #f3f7fc;
}

.input,
.picker-value {
  height: 92rpx;
  padding: 0 24rpx;
  line-height: 92rpx;
}

.textarea {
  height: 150rpx;
  padding: 24rpx;
  line-height: 1.5;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 18rpx;
}

.chip {
  padding: 16rpx 28rpx;
  border-radius: 999rpx;
  color: #66758c;
  font-size: 26rpx;
  background: #eef4fb;
}

.chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.switch-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 10rpx 0;
}

.gen-btn {
  margin-top: 30rpx;
}

.empty-hint {
  padding: 60rpx 0;
  text-align: center;
}

/* Draft styles */
.draft-overview {
  padding: 28rpx;
}

.draft-title {
  display: block;
  color: #172033;
  font-size: 34rpx;
  font-weight: 800;
}

.draft-desc {
  display: block;
  margin-top: 10rpx;
  color: #8491a5;
  font-size: 26rpx;
  line-height: 1.5;
}

.draft-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 22rpx;
}

.dm-item {
  padding: 12rpx 20rpx;
  border-radius: 16rpx;
  background: #f3f7fc;
}

.dm-label {
  display: block;
  color: #8491a5;
  font-size: 22rpx;
}

.dm-value {
  display: block;
  margin-top: 4rpx;
  color: #172033;
  font-size: 26rpx;
  font-weight: 700;
}

.draft-dates {
  margin-top: 16rpx;
  color: #8491a5;
  font-size: 24rpx;
}

.phase-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #edf2f8;
}

.phase-row:last-child {
  border-bottom: 0;
}

.phase-dot {
  flex: 0 0 auto;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
}

.phase-info {
  flex: 1;
}

.phase-name {
  display: block;
  color: #172033;
  font-size: 28rpx;
  font-weight: 700;
}

.phase-date {
  display: block;
  margin-top: 6rpx;
  color: #8491a5;
  font-size: 23rpx;
}

.preview-group {
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #edf2f8;
}

.preview-group:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: 0;
}

.preview-date {
  display: block;
  margin-bottom: 14rpx;
  color: var(--theme-primary);
  font-size: 26rpx;
  font-weight: 700;
}

.preview-task {
  padding: 12rpx 0;
}

.preview-task-title {
  display: block;
  color: #172033;
  font-size: 27rpx;
  font-weight: 600;
}

.preview-task-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 8rpx;
}

.ptag {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  color: #66758c;
  font-size: 21rpx;
  background: #eef4fb;
}

.ptag.focus {
  color: #29bf7f;
  background: #eaf9f2;
}

.ptag.repeat {
  color: #8b5cf6;
  background: #f3eeff;
}

.preview-more {
  padding: 20rpx 0 0;
  text-align: center;
}

.draft-actions {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 10rpx;
  padding-bottom: 40rpx;
}

.soft-button {
  height: 96rpx;
  border-radius: 28rpx;
  color: var(--theme-primary);
  font-size: 32rpx;
  font-weight: 700;
  line-height: 96rpx;
  background: var(--theme-soft);
}
</style>
