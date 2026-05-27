<template>
  <view class="page-shell" :class="themeClass">
    <view class="hero-card sl-hero">
      <text class="sl-title">学习记录</text>
      <text class="sl-sub">记录每天学了什么，积累成长轨迹</text>
    </view>

    <view class="filter-bar card">
      <view class="filter-row">
        <picker mode="date" :value="filterDate" @change="filterDate = $event.detail.value">
          <view class="filter-chip" :class="{ active: filterDate }">
            {{ filterDate || '按日期' }}
            <text v-if="filterDate" class="filter-clear" @tap.stop="filterDate = ''">x</text>
          </view>
        </picker>
        <scroll-view scroll-x class="filter-scroll">
          <text
            v-for="s in allSubjects"
            :key="s"
            class="filter-chip"
            :class="{ active: filterSubject === s }"
            @tap="filterSubject = filterSubject === s ? '' : s"
          >{{ s }}</text>
        </scroll-view>
      </view>
      <input
        v-model.trim="searchText"
        class="search-input"
        placeholder="搜索学习主题或内容"
      />
    </view>

    <view v-if="!filteredLogs.length" class="empty-wrap">
      <text class="empty-title">还没有学习记录</text>
      <text class="empty-desc">开始记录今天的学习吧，方便以后复盘</text>
      <button class="primary-button empty-btn" @tap="goAdd">记录一次学习</button>
    </view>

    <view v-for="log in filteredLogs" :key="log.id" class="log-card card" @tap="goEdit(log.id)">
      <view class="log-header">
        <text class="log-subject-tag">{{ log.subject }}</text>
        <text class="log-date">{{ log.date }}</text>
      </view>
      <text class="log-title">{{ log.title }}</text>
      <text class="log-content">{{ log.content.length > 80 ? log.content.slice(0, 80) + '...' : log.content }}</text>
      <view class="log-footer">
        <text class="log-tag">{{ log.duration }} 分钟</text>
        <text class="log-tag mastery" :class="'mastery-' + log.mastery">{{ log.mastery }}</text>
        <text class="log-delete" @tap.stop="confirmDelete(log)">删除</text>
      </view>
    </view>

    <view class="fab" @tap="goAdd">+</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getStudyLogs, deleteStudyLog, subjectOptions } from '../../utils/studyLogs'

const themeClass = ref(getThemeClass())
const allLogs = ref([])
const filterDate = ref('')
const filterSubject = ref('')
const searchText = ref('')
const allSubjects = subjectOptions

const filteredLogs = computed(() => {
  let logs = [...allLogs.value].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })
  if (filterDate.value) {
    logs = logs.filter(l => l.date === filterDate.value)
  }
  if (filterSubject.value) {
    logs = logs.filter(l => l.subject === filterSubject.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    logs = logs.filter(l =>
      l.title.toLowerCase().includes(q) || l.content.toLowerCase().includes(q)
    )
  }
  return logs
})

function loadData() {
  themeClass.value = getThemeClass()
  allLogs.value = getStudyLogs()
}

function goAdd() {
  uni.navigateTo({ url: '/pages/study-log-form/study-log-form' })
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/study-log-form/study-log-form?id=${id}` })
}

function confirmDelete(log) {
  uni.showModal({
    title: '删除学习记录',
    content: `确定删除「${log.title}」吗？`,
    confirmText: '删除',
    confirmColor: '#e84f4f',
    success: res => {
      if (!res.confirm) return
      allLogs.value = deleteStudyLog(log.id)
      uni.showToast({ title: '已删除', icon: 'none' })
    }
  })
}

onShow(loadData)
</script>

<style scoped>
.sl-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.sl-title {
  font-size: 42rpx;
  font-weight: 800;
}

.sl-sub {
  color: rgba(255, 255, 255, 0.78);
  font-size: 26rpx;
}

.filter-bar {
  margin-top: 24rpx;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.filter-scroll {
  flex: 1;
  white-space: nowrap;
}

.filter-chip {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 12rpx;
  border-radius: 999rpx;
  color: #66758c;
  font-size: 25rpx;
  background: #eef4fb;
}

.filter-chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.filter-clear {
  margin-left: 8rpx;
  font-size: 22rpx;
}

.search-input {
  box-sizing: border-box;
  width: 100%;
  height: 82rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  color: #172033;
  font-size: 28rpx;
  background: #f3f7fc;
}

.empty-wrap {
  padding: 80rpx 0;
  text-align: center;
}

.empty-title {
  display: block;
  color: #172033;
  font-size: 32rpx;
  font-weight: 700;
}

.empty-desc {
  display: block;
  margin-top: 14rpx;
  color: #8491a5;
  font-size: 26rpx;
}

.empty-btn {
  margin-top: 40rpx;
  width: 60%;
}

.log-card {
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.log-subject-tag {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 22rpx;
  background: var(--theme-primary);
}

.log-date {
  color: #8491a5;
  font-size: 24rpx;
}

.log-title {
  display: block;
  color: #172033;
  font-size: 30rpx;
  font-weight: 700;
}

.log-content {
  display: block;
  margin-top: 10rpx;
  color: #66758c;
  font-size: 26rpx;
  line-height: 1.6;
}

.log-footer {
  display: flex;
  gap: 14rpx;
  margin-top: 16rpx;
}

.log-tag {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  color: #66758c;
  font-size: 22rpx;
  background: #eef4fb;
}

.log-tag.mastery-低 {
  color: #e84f4f;
  background: #fff0f0;
}

.log-tag.mastery-中 {
  color: #d99616;
  background: #fff8e8;
}

.log-tag.mastery-高 {
  color: #29bf7f;
  background: #eaf9f2;
}

.log-delete {
  margin-left: auto;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  color: #e84f4f;
  font-size: 22rpx;
  background: #fff0f0;
}
</style>
