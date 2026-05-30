<template>
  <view class="page-shell" :class="themeClass">
    <!-- 顶卡 -->
    <view class="hero-card">
      <text class="hero-title">回收站</text>
      <text class="hero-sub">已删除的笔记可在这里恢复</text>
    </view>

    <!-- 笔记列表 -->
    <view v-if="notes.length" class="note-list">
      <view v-for="note in notes" :key="note.id" class="note-card card">
        <view class="note-header">
          <text class="note-title">{{ note.title }}</text>
        </view>
        <text v-if="note.summary" class="note-summary">{{ note.summary }}</text>
        <view class="note-meta">
          <text v-if="note.tags" class="note-tags">{{ note.tags }}</text>
          <text class="note-time">{{ formatTime(note.updateTime) }}</text>
        </view>
        <view class="note-actions">
          <text class="action-restore" @tap="handleRestore(note)">恢复</text>
          <text class="action-delete" @tap="handlePermanentDelete(note)">彻底删除</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state card">
      <text class="empty-icon">🗑</text>
      <text class="empty-title">回收站为空</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getTrashNotes, restoreNote, permanentDeleteNote } from '../../api/notes'

const themeClass = ref(getThemeClass())
const notes = ref([])

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${h}:${min}`
}

async function loadTrash() {
  try {
    const res = await getTrashNotes()
    notes.value = res.data || []
  } catch (e) {
    notes.value = []
  }
}

function handleRestore(note) {
  uni.showModal({
    title: '恢复笔记',
    content: `确定恢复「${note.title}」吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await restoreNote(note.id)
        uni.showToast({ title: '恢复成功', icon: 'success' })
        notes.value = notes.value.filter(n => n.id !== note.id)
      } catch (e) { /* request.js 已提示 */ }
    }
  })
}

function handlePermanentDelete(note) {
  uni.showModal({
    title: '彻底删除',
    content: `彻底删除「${note.title}」后将无法恢复，是否继续？`,
    confirmColor: '#e84f4f',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await permanentDeleteNote(note.id)
        uni.showToast({ title: '已彻底删除', icon: 'success' })
        notes.value = notes.value.filter(n => n.id !== note.id)
      } catch (e) { /* request.js 已提示 */ }
    }
  })
}

onShow(() => {
  themeClass.value = getThemeClass()
  loadTrash()
})
</script>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  border-radius: 32rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 40rpx rgba(107, 114, 128, 0.25);
}

.hero-title {
  display: block;
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
}

.hero-sub {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 26rpx;
  margin-top: 8rpx;
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.note-card {
  padding: 28rpx;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.note-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #172033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 26rpx;
  color: #66758c;
  line-height: 1.5;
  margin-bottom: 14rpx;
}

.note-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.note-tags {
  font-size: 22rpx;
  color: var(--theme-primary);
  background: var(--theme-soft);
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-time {
  font-size: 23rpx;
  color: #8491a5;
}

.note-actions {
  display: flex;
  gap: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #edf2f8;
}

.action-restore {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-primary);
  padding: 14rpx 0;
  background: var(--theme-soft);
  border-radius: 16rpx;
}

.action-restore:active {
  opacity: 0.8;
}

.action-delete {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #e84f4f;
  padding: 14rpx 0;
  background: #fef2f2;
  border-radius: 16rpx;
}

.action-delete:active {
  opacity: 0.8;
}

.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #8491a5;
}
</style>
