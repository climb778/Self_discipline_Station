<template>
  <view class="page-shell" :class="themeClass">
    <view v-if="hasDraft" class="draft-banner card" @tap="restoreDraft">
      <text class="draft-text">检测到未保存的草稿，是否恢复？</text>
      <view class="draft-actions">
        <text class="draft-btn" @tap.stop="restoreDraft">恢复</text>
        <text class="draft-btn discard" @tap.stop="discardDraft">丢弃</text>
      </view>
    </view>

    <view class="form-card card">
      <view class="field">
        <text class="label">学习日期</text>
        <picker mode="date" :value="form.date" @change="form.date = $event.detail.value">
          <view class="picker-value">{{ form.date }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">学习科目</text>
        <view class="chips">
          <text v-for="s in subjectOptions" :key="s" class="chip" :class="{ active: form.subject === s }" @tap="form.subject = s">{{ s }}</text>
        </view>
      </view>

      <view class="field">
        <text class="label">学习主题 <text class="required">*</text></text>
        <input v-model.trim="form.title" class="input" placeholder="例如：Java 多线程、数据库索引" @input="onInput" />
      </view>

      <view class="field">
        <text class="label">今天具体学了什么 <text class="required">*</text></text>
        <textarea v-model.trim="form.content" class="textarea textarea-long" placeholder="记录学习内容，方便以后复盘" @input="onInput" />
      </view>

      <view class="field">
        <text class="label">学习时长（分钟）</text>
        <input v-model.number="form.duration" class="input" type="number" placeholder="0" @input="onInput" />
      </view>

      <view class="field">
        <text class="label">掌握程度</text>
        <view class="chips">
          <text v-for="m in masteryOptions" :key="m" class="chip" :class="{ active: form.mastery === m }" @tap="form.mastery = m">{{ m }}</text>
        </view>
      </view>

      <view class="field">
        <text class="label">遇到的问题</text>
        <textarea v-model.trim="form.problems" class="textarea" placeholder="记录难点，下次重点攻克" @input="onInput" />
      </view>

      <view class="field">
        <text class="label">下次复习内容</text>
        <textarea v-model.trim="form.nextReview" class="textarea" placeholder="下次需要继续学习或复习什么" @input="onInput" />
      </view>

      <view v-if="allPlans.length" class="field">
        <text class="label">关联计划（可选）</text>
        <view class="chips">
          <text class="chip" :class="{ active: !form.relatedPlanId }" @tap="form.relatedPlanId = ''">无</text>
          <text v-for="p in allPlans" :key="p.id" class="chip" :class="{ active: form.relatedPlanId === p.id }" @tap="form.relatedPlanId = p.id">{{ p.title }}</text>
        </view>
      </view>

      <view v-if="recentTasks.length" class="field">
        <text class="label">关联任务（可选）</text>
        <view class="chips">
          <text class="chip" :class="{ active: !form.relatedTaskId }" @tap="form.relatedTaskId = ''">无</text>
          <text v-for="t in recentTasks" :key="t.id" class="chip" :class="{ active: form.relatedTaskId === t.id }" @tap="form.relatedTaskId = t.id">{{ t.title }}</text>
        </view>
      </view>
    </view>

    <button class="primary-button save-btn" @tap="submit">{{ isEdit ? '保存修改' : '保存记录' }}</button>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onBackPress, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { getToday } from '../../utils/date'
import { getThemeClass } from '../../utils/storage'
import { getActiveTasks, getTodayTasks } from '../../utils/tasks'
import { getTasks } from '../../utils/storage'
import { getPlans, getActivePlans } from '../../utils/plans'
import { getStudyLogById, addStudyLog, updateStudyLog, subjectOptions, masteryOptions } from '../../utils/studyLogs'

const DRAFT_KEY = 'SELF_DISCIPLINE_STUDY_DRAFT'
const PREFS_KEY = 'SELF_DISCIPLINE_STUDY_PREFS'

const logId = ref('')
const isEdit = computed(() => Boolean(logId.value))
const themeClass = ref(getThemeClass())
const allPlans = ref([])
const recentTasks = ref([])
const hasDraft = ref(false)
const formDirty = ref(false)
let autoSaveTimer = null

const form = reactive({
  date: getToday(),
  subject: '其他',
  title: '',
  content: '',
  duration: 0,
  mastery: '中',
  problems: '',
  nextReview: '',
  relatedTaskId: '',
  relatedPlanId: ''
})

function onInput() {
  formDirty.value = true
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    saveDraft()
  }, 2000)
}

function stopAutoSaveTimer() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

function hasDraftContent() {
  return Boolean(
    form.title
    || form.content
    || form.problems
    || form.nextReview
    || Number(form.duration) > 0
  )
}

function saveDraft() {
  if (isEdit.value || !hasDraftContent()) return
  uni.setStorageSync(DRAFT_KEY, { ...form, savedAt: Date.now() })
}

function loadDraft() {
  return uni.getStorageSync(DRAFT_KEY) || null
}

function restoreDraft() {
  const draft = loadDraft()
  if (!draft) return
  Object.assign(form, {
    date: draft.date || getToday(),
    subject: draft.subject || '其他',
    title: draft.title || '',
    content: draft.content || '',
    duration: draft.duration || 0,
    mastery: draft.mastery || '中',
    problems: draft.problems || '',
    nextReview: draft.nextReview || '',
    relatedTaskId: draft.relatedTaskId || '',
    relatedPlanId: draft.relatedPlanId || ''
  })
  hasDraft.value = false
  formDirty.value = false
}

function discardDraft() {
  uni.removeStorageSync(DRAFT_KEY)
  hasDraft.value = false
}

function clearDraft() {
  uni.removeStorageSync(DRAFT_KEY)
}

function loadPrefs() {
  const prefs = uni.getStorageSync(PREFS_KEY)
  if (!prefs) return
  if (prefs.lastSubject && subjectOptions.includes(prefs.lastSubject)) {
    form.subject = prefs.lastSubject
  }
  if (prefs.lastDuration > 0) {
    form.duration = prefs.lastDuration
  }
  if (prefs.lastPlanId) {
    form.relatedPlanId = prefs.lastPlanId
  }
}

function savePrefs() {
  uni.setStorageSync(PREFS_KEY, {
    lastSubject: form.subject,
    lastDuration: form.duration,
    lastPlanId: form.relatedPlanId
  })
}

function fillForm(log) {
  form.date = log.date || getToday()
  form.subject = log.subject || '其他'
  form.title = log.title || ''
  form.content = log.content || ''
  form.duration = log.duration || 0
  form.mastery = log.mastery || '中'
  form.problems = log.problems || ''
  form.nextReview = log.nextReview || ''
  form.relatedTaskId = log.relatedTaskId || ''
  form.relatedPlanId = log.relatedPlanId || ''
}

function submit() {
  stopAutoSaveTimer()

  if (!form.title) {
    uni.showToast({ title: '请填写学习主题', icon: 'none' })
    return
  }
  if (!form.content) {
    uni.showToast({ title: '请填写学习内容', icon: 'none' })
    return
  }
  if (form.duration < 0) {
    uni.showToast({ title: '学习时长不能为负数', icon: 'none' })
    return
  }

  const payload = { ...form, duration: Math.max(0, Number(form.duration) || 0) }

  if (isEdit.value) {
    updateStudyLog(logId.value, payload)
  } else {
    addStudyLog(payload)
  }

  savePrefs()
  clearDraft()
  formDirty.value = false

  uni.showToast({ title: isEdit.value ? '已保存' : '已记录', icon: 'success' })
  setTimeout(() => uni.redirectTo({ url: '/pages/study-log/study-log' }), 350)
}

function confirmLeaveWithUnsaved() {
  if (!formDirty.value) return false
  if (!isEdit.value && !hasDraftContent()) return false

  stopAutoSaveTimer()
  if (!isEdit.value) saveDraft()

  uni.showModal({
    title: '内容尚未保存',
    content: isEdit.value
      ? '当前修改尚未保存，确定要离开吗？'
      : '当前学习记录尚未保存，已为你保留草稿。确定要离开吗？',
    confirmText: '离开',
    cancelText: '继续编辑',
    success: res => {
      if (!res.confirm) return
      formDirty.value = false
      uni.navigateBack()
    }
  })

  return true
}

onLoad(options => {
  if (options?.id) {
    logId.value = options.id
    uni.setNavigationBarTitle({ title: '编辑学习记录' })
    const log = getStudyLogById(logId.value)
    if (!log) {
      uni.showToast({ title: '记录不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 500)
      return
    }
    fillForm(log)
    formDirty.value = false
  } else {
    const draft = loadDraft()
    if (draft && (draft.title || draft.content)) {
      hasDraft.value = true
    } else {
      loadPrefs()
    }
  }
})

onShow(() => {
  themeClass.value = getThemeClass()
  allPlans.value = getActivePlans(getPlans())
  const today = getToday()
  recentTasks.value = getTodayTasks(getTasks(), today).slice(0, 8)
})

onUnload(() => {
  stopAutoSaveTimer()
  if (!isEdit.value && formDirty.value) {
    saveDraft()
  }
})

onBackPress(() => confirmLeaveWithUnsaved())
</script>

<style scoped>
.draft-banner {
  margin-bottom: 20rpx;
  padding: 22rpx 28rpx;
  background: #fff8e8;
}

.draft-text {
  display: block;
  color: #d99616;
  font-size: 26rpx;
  margin-bottom: 16rpx;
}

.draft-actions {
  display: flex;
  gap: 18rpx;
}

.draft-btn {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 25rpx;
  font-weight: 700;
  background: var(--theme-primary);
}

.draft-btn.discard {
  color: #8491a5;
  background: #eef4fb;
}

.form-card {
  padding: 30rpx;
}

.field {
  margin-bottom: 30rpx;
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

.required {
  color: #e84f4f;
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

.textarea-long {
  height: 280rpx;
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

.save-btn {
  margin-top: 34rpx;
}
</style>
