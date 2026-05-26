<template>
  <view class="page-shell" :class="themeClass">
    <view v-if="!isEdit" class="template-section">
      <text class="section-title">常用模板</text>
      <view class="template-tabs">
        <text v-for="cat in templateCategories" :key="cat" class="template-tab" :class="{ active: activeTemplateCat === cat }" @tap="activeTemplateCat = cat">{{ cat }}</text>
      </view>
      <view class="template-grid">
        <view v-for="tpl in currentTemplates" :key="tpl.title" class="template-chip card" @tap="applyTemplate(tpl)">
          <text class="template-title">{{ tpl.title }}</text>
          <text class="template-cat">{{ tpl.category }}</text>
        </view>
      </view>
    </view>

    <view class="form-card card">
      <view class="field">
        <text class="label">任务标题</text>
        <input v-model.trim="form.title" class="input" placeholder="输入你要完成的事" />
      </view>

      <view class="field">
        <text class="label">任务描述</text>
        <textarea v-model.trim="form.description" class="textarea" placeholder="补充目标、步骤或提醒" />
      </view>

      <view class="field">
        <text class="label">分类</text>
        <view class="chips">
          <text v-for="item in categories" :key="item" class="chip" :class="{ active: form.category === item }" @tap="form.category = item">{{ item }}</text>
        </view>
      </view>

      <view class="field">
        <text class="label">截止日期</text>
        <picker mode="date" :value="form.dueDate" @change="form.dueDate = $event.detail.value">
          <view class="picker-value">{{ form.dueDate }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">优先级</text>
        <view class="chips">
          <text v-for="item in priorities" :key="item" class="chip" :class="{ active: form.priority === item }" @tap="form.priority = item">{{ item }}</text>
        </view>
      </view>

      <view class="switch-line">
        <view>
          <text class="label">长期任务</text>
          <text class="hint">长期任务会出现在每日待办中</text>
        </view>
        <switch :checked="form.isLongTerm" :color="themeColor" @change="form.isLongTerm = $event.detail.value" />
      </view>

      <view class="divider"></view>

      <view class="switch-line">
        <view>
          <text class="label">重复任务</text>
          <text class="hint">按规则自动生成每日任务</text>
        </view>
        <switch :checked="form.isRepeat" :color="themeColor" @change="form.isRepeat = $event.detail.value" />
      </view>

      <view v-if="form.isRepeat" class="repeat-options">
        <view class="chips">
          <text v-for="item in repeatTypes" :key="item.value" class="chip" :class="{ active: form.repeatType === item.value }" @tap="form.repeatType = item.value">{{ item.label }}</text>
        </view>

        <view v-if="form.repeatType === 'custom'" class="custom-days">
          <text class="label" style="margin-bottom: 14rpx; margin-top: 18rpx;">选择重复日</text>
          <view class="day-chips">
            <text v-for="d in weekDays" :key="d.value" class="day-chip" :class="{ active: form.repeatDays.includes(d.value) }" @tap="toggleRepeatDay(d.value)">{{ d.label }}</text>
          </view>
        </view>

        <view class="field" style="margin-top: 18rpx;">
          <text class="label">结束日期（可选）</text>
          <picker mode="date" :value="form.repeatEndDate" @change="form.repeatEndDate = $event.detail.value">
            <view class="picker-value">{{ form.repeatEndDate || '不限结束时间' }}</view>
          </picker>
        </view>
      </view>

      <view class="divider"></view>

      <view class="switch-line">
        <view>
          <text class="label">应用内提醒</text>
          <text class="hint">在指定时间提醒你完成任务</text>
        </view>
        <switch :checked="form.enableReminder" :color="themeColor" @change="form.enableReminder = $event.detail.value" />
      </view>

      <view v-if="form.enableReminder" class="field" style="margin-top: 14rpx;">
        <text class="label">提醒时间</text>
        <picker mode="time" :value="form.reminderTime" @change="form.reminderTime = $event.detail.value">
          <view class="picker-value">{{ form.reminderTime || '选择提醒时间' }}</view>
        </picker>
      </view>
    </view>

    <button class="primary-button save" @tap="submit">{{ isEdit ? '保存修改' : '保存任务' }}</button>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getToday } from '../../utils/date'
import { addTask, getTaskById, getThemeClass, getThemeMeta, updateTaskFields } from '../../utils/storage'
import { categories, priorities } from '../../utils/tasks'

const taskId = ref('')
const isEdit = computed(() => Boolean(taskId.value))
const themeClass = ref(getThemeClass())
const themeColor = computed(() => getThemeMeta().primary)

const form = reactive({
  title: '',
  description: '',
  category: '学习',
  dueDate: getToday(),
  priority: '中',
  isLongTerm: false,
  isRepeat: false,
  repeatType: 'daily',
  repeatDays: [],
  repeatEndDate: '',
  enableReminder: false,
  reminderTime: ''
})

const repeatTypes = [
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '自定义', value: 'custom' }
]

const weekDays = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 0 }
]

const taskTemplates = [
  { title: '背单词', category: '学习', priority: '高' },
  { title: '刷题 30 分钟', category: '学习', priority: '中' },
  { title: '复习课堂笔记', category: '学习', priority: '中' },
  { title: '阅读 30 分钟', category: '学习', priority: '中' },
  { title: '早睡', category: '生活', priority: '高' },
  { title: '整理房间', category: '生活', priority: '低' },
  { title: '做饭', category: '生活', priority: '中' },
  { title: '写日报', category: '工作', priority: '中' },
  { title: '整理邮件', category: '工作', priority: '低' },
  { title: '复盘工作', category: '工作', priority: '中' },
  { title: '跑步', category: '运动', priority: '高' },
  { title: '跳绳', category: '运动', priority: '中' },
  { title: '拉伸 15 分钟', category: '运动', priority: '低' }
]

const templateCategories = ['学习', '生活', '工作', '运动']
const activeTemplateCat = ref('学习')

const currentTemplates = computed(() =>
  taskTemplates.filter(t => t.category === activeTemplateCat.value)
)

function applyTemplate(tpl) {
  form.title = tpl.title
  form.category = tpl.category
  form.priority = tpl.priority
}

function toggleRepeatDay(day) {
  const index = form.repeatDays.indexOf(day)
  if (index >= 0) {
    form.repeatDays.splice(index, 1)
  } else {
    form.repeatDays.push(day)
  }
}

function fillForm(task) {
  form.title = task.title || ''
  form.description = task.description || ''
  form.category = task.category || '其他'
  form.dueDate = task.dueDate || getToday()
  form.priority = task.priority || '中'
  form.isLongTerm = Boolean(task.isLongTerm)
  form.isRepeat = Boolean(task.isRepeat)
  form.repeatType = task.repeatType || 'daily'
  form.repeatDays = task.repeatDays ? [...task.repeatDays] : []
  form.repeatEndDate = task.repeatEndDate || ''
  form.enableReminder = Boolean(task.enableReminder)
  form.reminderTime = task.reminderTime || ''
}

function submit() {
  if (!form.title) {
    uni.showToast({
      title: '请填写任务标题',
      icon: 'none'
    })
    return
  }

  if (form.isRepeat && form.repeatType === 'custom' && form.repeatDays.length === 0) {
    uni.showToast({
      title: '请选择重复日',
      icon: 'none'
    })
    return
  }

  if (isEdit.value) {
    updateTaskFields(taskId.value, { ...form })
  } else {
    addTask({ ...form })
  }

  uni.showToast({
    title: isEdit.value ? '已保存' : '已新增',
    icon: 'success'
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 350)
}

onLoad(options => {
  if (!options?.id) return
  taskId.value = options.id
  uni.setNavigationBarTitle({
    title: '编辑任务'
  })
  const task = getTaskById(taskId.value)
  if (!task) {
    uni.showToast({
      title: '任务不存在',
      icon: 'none'
    })
    setTimeout(() => uni.navigateBack(), 500)
    return
  }
  fillForm(task)
})

onShow(() => {
  themeClass.value = getThemeClass()
})
</script>

<style scoped>
.template-section {
  margin-bottom: 24rpx;
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

.template-cat {
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

.switch-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding-top: 4rpx;
}

.divider {
  height: 1rpx;
  margin: 28rpx 0;
  background: #edf2f8;
}

.repeat-options {
  margin-top: 18rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f8fbff;
}

.custom-days {
  margin-top: 14rpx;
}

.day-chips {
  display: flex;
  gap: 14rpx;
}

.day-chip {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  color: #66758c;
  text-align: center;
  font-size: 26rpx;
  line-height: 68rpx;
  background: #eef4fb;
}

.day-chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.save {
  margin-top: 34rpx;
}
</style>
