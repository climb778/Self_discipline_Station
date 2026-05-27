<template>
  <view class="page-shell" :class="themeClass">
    <view v-if="!isEdit" class="template-section">
      <view class="section-header">
        <text class="section-title">计划模板</text>
        <text class="ai-link" @tap="goAiPlan">从目标生成 ›</text>
      </view>
      <view class="template-tabs">
        <text v-for="cat in templateCategories" :key="cat" class="template-tab" :class="{ active: activeTemplateCat === cat }" @tap="activeTemplateCat = cat">{{ cat }}</text>
      </view>
      <view class="template-grid">
        <view v-for="tpl in currentTemplates" :key="tpl.title" class="template-chip card" @tap="applyTemplate(tpl)">
          <text class="template-title">{{ tpl.title }}</text>
          <text class="template-days">{{ tpl.targetDays }} 天</text>
        </view>
      </view>
    </view>

    <view class="form-card card">
      <view class="field">
        <text class="label">计划名称</text>
        <input v-model.trim="form.title" class="input" placeholder="输入计划名称" />
      </view>

      <view class="field">
        <text class="label">计划描述</text>
        <textarea v-model.trim="form.description" class="textarea" placeholder="描述你的目标和执行方式" />
      </view>

      <view class="field">
        <text class="label">分类</text>
        <view class="chips">
          <text v-for="item in categories" :key="item" class="chip" :class="{ active: form.category === item }" @tap="form.category = item">{{ item }}</text>
        </view>
      </view>

      <view class="field">
        <text class="label">目标天数</text>
        <view class="chips">
          <text v-for="d in targetDaysOptions" :key="d" class="chip" :class="{ active: form.targetDays === d }" @tap="form.targetDays = d">{{ d }} 天</text>
        </view>
      </view>

      <view class="field">
        <text class="label">开始日期</text>
        <picker mode="date" :value="form.startDate" @change="form.startDate = $event.detail.value">
          <view class="picker-value">{{ form.startDate }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">结束日期（可选）</text>
        <picker mode="date" :value="form.endDate" :start="form.startDate" @change="form.endDate = $event.detail.value">
          <view class="picker-value">{{ form.endDate || '自动按目标天数计算' }}</view>
        </picker>
      </view>

      <view v-if="selectedTemplateTasks.length" class="switch-line">
        <view>
          <text class="label">自动生成模板任务</text>
          <text class="hint">创建后自动添加 {{ selectedTemplateTasks.length }} 个关联任务</text>
        </view>
        <switch :checked="autoGenerateTasks" :color="themeColor" @change="autoGenerateTasks = $event.detail.value" />
      </view>
    </view>

    <button class="primary-button save" @tap="submit">{{ isEdit ? '保存修改' : '创建计划' }}</button>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getToday, formatDate } from '../../utils/date'
import { getThemeClass, getThemeMeta, addTask } from '../../utils/storage'
import { addPlan, getPlanById, updatePlan, planTemplates } from '../../utils/plans'

const planId = ref('')
const isEdit = computed(() => Boolean(planId.value))
const themeClass = ref(getThemeClass())
const themeColor = computed(() => getThemeMeta().primary)

const categories = ['学习', '运动', '生活', '工作', '其他']
const targetDaysOptions = [7, 14, 21, 30, 60, 90, 180]

const form = reactive({
  title: '',
  description: '',
  category: '学习',
  targetDays: 30,
  startDate: getToday(),
  endDate: ''
})

const autoGenerateTasks = ref(false)
const selectedTemplateTasks = ref([])

const templateCategories = ['学习', '运动', '生活']
const activeTemplateCat = ref('学习')

const currentTemplates = computed(() =>
  planTemplates.filter(t => t.category === activeTemplateCat.value)
)

function applyTemplate(tpl) {
  form.title = tpl.title
  form.description = tpl.description
  form.category = tpl.category
  form.targetDays = tpl.targetDays
  selectedTemplateTasks.value = tpl.tasks || []
  autoGenerateTasks.value = selectedTemplateTasks.value.length > 0
  const end = new Date(`${form.startDate}T00:00:00`)
  end.setDate(end.getDate() + tpl.targetDays)
  form.endDate = formatDate(end)
}

function fillForm(plan) {
  form.title = plan.title || ''
  form.description = plan.description || ''
  form.category = plan.category || '其他'
  form.targetDays = Number(plan.targetDays) || 30
  form.startDate = plan.startDate || getToday()
  form.endDate = plan.endDate || ''
}

function submit() {
  if (!form.title) {
    uni.showToast({ title: '请填写计划名称', icon: 'none' })
    return
  }

  let endDate = form.endDate
  if (!endDate) {
    const end = new Date(`${form.startDate}T00:00:00`)
    end.setDate(end.getDate() + form.targetDays)
    endDate = formatDate(end)
  }

  if (isEdit.value) {
    updatePlan(planId.value, {
      title: form.title,
      description: form.description,
      category: form.category,
      targetDays: form.targetDays,
      startDate: form.startDate,
      endDate
    })
  } else {
    const newPlan = addPlan({
      title: form.title,
      description: form.description,
      category: form.category,
      targetDays: form.targetDays,
      startDate: form.startDate,
      endDate
    })

    if (autoGenerateTasks.value && selectedTemplateTasks.value.length > 0) {
      const totalDays = form.targetDays || 30
      const count = selectedTemplateTasks.value.length
      const interval = Math.max(1, Math.floor(totalDays / count))
      for (let i = 0; i < count; i++) {
        const due = new Date(`${form.startDate}T00:00:00`)
        due.setDate(due.getDate() + i * interval)
        addTask({
          title: selectedTemplateTasks.value[i],
          category: form.category,
          dueDate: formatDate(due),
          planId: newPlan.id
        })
      }
    }
  }

  uni.showToast({
    title: isEdit.value ? '已保存' : '已创建',
    icon: 'success'
  })
  setTimeout(() => uni.navigateBack(), 350)
}

onLoad(options => {
  if (!options?.id) return
  planId.value = options.id
  uni.setNavigationBarTitle({ title: '编辑计划' })
  const plan = getPlanById(planId.value)
  if (!plan) {
    uni.showToast({ title: '计划不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 500)
    return
  }
  fillForm(plan)
})

function goAiPlan() {
  uni.navigateTo({ url: '/pages/ai-plan/ai-plan' })
}

onShow(() => {
  themeClass.value = getThemeClass()
})
</script>

<style scoped>
.template-section {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-link {
  color: var(--theme-primary);
  font-size: 26rpx;
  font-weight: 700;
}

.ai-link:active {
  opacity: 0.7;
}

.template-tabs {
  display: flex;
  gap: 14rpx;
  margin-top: 14rpx;
  margin-bottom: 18rpx;
}

.template-tab {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  color: #66758c;
  font-size: 25rpx;
  background: #eef4fb;
}

.template-tab.active {
  color: #fff;
  background: var(--theme-primary);
}

.template-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.template-chip {
  padding: 18rpx 24rpx;
  margin: 0;
}

.template-chip:active {
  transform: scale(0.97);
}

.template-title {
  display: block;
  color: #172033;
  font-size: 27rpx;
  font-weight: 700;
}

.template-days {
  display: block;
  margin-top: 6rpx;
  color: #8491a5;
  font-size: 22rpx;
}

.form-card {
  padding: 30rpx;
}

.field {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  color: #172033;
  font-size: 29rpx;
  font-weight: 700;
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
  height: 180rpx;
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

.save {
  margin-top: 34rpx;
}

.switch-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding-top: 4rpx;
}

.hint {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 24rpx;
}
</style>
