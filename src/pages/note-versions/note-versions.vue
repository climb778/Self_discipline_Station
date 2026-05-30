<template>
  <view class="page-shell" :class="themeClass">
    <!-- 顶卡 -->
    <view class="hero-card">
      <text class="hero-title">版本历史</text>
      <text class="hero-sub">查看和恢复笔记的历史版本</text>
    </view>

    <!-- 版本列表 -->
    <view v-if="versions.length" class="version-list">
      <view v-for="v in versions" :key="v.id" class="version-card card">
        <view class="version-header" @tap="toggleExpand(v.id)">
          <view class="version-info">
            <text class="version-time">{{ formatTime(v.createTime) }}</text>
            <text class="version-title">{{ v.title || '未命名笔记' }}</text>
          </view>
          <text class="version-chevron">{{ expandedId === v.id ? '▲' : '▼' }}</text>
        </view>
        <text class="version-stats">{{ wordCount(v.content) }} 字</text>

        <!-- 展开预览 -->
        <view v-if="expandedId === v.id" class="version-preview">
          <text class="preview-content">{{ previewText(v.content) }}</text>
        </view>

        <!-- 操作 -->
        <view class="version-actions">
          <text class="action-view" @tap="handleView(v)">查看</text>
          <text class="action-restore" @tap="handleRestore(v)">恢复此版本</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state card">
      <text class="empty-icon">📜</text>
      <text class="empty-title">暂无历史版本</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getNoteVersions, getNoteVersionDetail, restoreNoteVersion } from '../../api/notes'

const themeClass = ref(getThemeClass())
const noteId = ref('')
const versions = ref([])
const expandedId = ref(null)

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const sec = String(d.getSeconds()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${h}:${min}:${sec}`
}

function wordCount(content) {
  if (!content) return 0
  return content.replace(/\s/g, '').length
}

function previewText(content) {
  if (!content) return '（空内容）'
  return content.length > 300 ? content.slice(0, 300) + '...' : content
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

async function loadVersions() {
  if (!noteId.value) return
  try {
    const res = await getNoteVersions(noteId.value)
    versions.value = res.data || []
  } catch (e) {
    versions.value = []
  }
}

async function handleView(version) {
  try {
    const res = await getNoteVersionDetail(noteId.value, version.id)
    const detail = res.data || version
    uni.setStorageSync('SELF_DISCIPLINE_NOTE_PREVIEW', {
      title: detail.title,
      content: detail.content,
      tags: detail.tags || ''
    })
  } catch (e) {
    uni.setStorageSync('SELF_DISCIPLINE_NOTE_PREVIEW', {
      title: version.title,
      content: version.content,
      tags: version.tags || ''
    })
  }
  uni.navigateTo({ url: '/pages/note-detail/note-detail?mode=preview' })
}

function handleRestore(version) {
  uni.showModal({
    title: '恢复版本',
    content: '恢复后当前笔记内容会被该历史版本覆盖，是否继续？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await restoreNoteVersion(noteId.value, version.id)
        uni.showToast({ title: '恢复成功', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({ url: `/pages/note-detail/note-detail?id=${noteId.value}` })
        }, 500)
      } catch (e) { /* request.js 已提示 */ }
    }
  })
}

onLoad(options => {
  if (options?.id) {
    noteId.value = options.id
  }
})

onShow(() => {
  themeClass.value = getThemeClass()
  loadVersions()
})
</script>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 32rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 40rpx rgba(99, 102, 241, 0.25);
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

.version-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.version-card {
  padding: 28rpx;
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.version-info {
  flex: 1;
  min-width: 0;
}

.version-time {
  display: block;
  font-size: 24rpx;
  color: #8491a5;
  margin-bottom: 8rpx;
}

.version-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #172033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-chevron {
  font-size: 24rpx;
  color: #8491a5;
  padding: 12rpx;
}

.version-stats {
  display: block;
  font-size: 23rpx;
  color: #8491a5;
  margin-top: 8rpx;
}

.version-preview {
  margin-top: 16rpx;
  padding: 20rpx;
  background: #f8fafd;
  border-radius: 16rpx;
}

.preview-content {
  display: block;
  font-size: 26rpx;
  color: #66758c;
  line-height: 1.6;
  word-break: break-all;
}

.version-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #edf2f8;
}

.action-view {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-primary);
  padding: 14rpx 0;
  background: var(--theme-soft);
  border-radius: 16rpx;
}

.action-view:active {
  opacity: 0.8;
}

.action-restore {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #e84f4f;
  padding: 14rpx 0;
  background: #fef2f2;
  border-radius: 16rpx;
}

.action-restore:active {
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
