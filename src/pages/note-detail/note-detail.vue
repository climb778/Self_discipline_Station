<template>
  <view class="page-shell" :class="themeClass">
    <!-- 标题 -->
    <view class="detail-header card">
      <text class="detail-title">{{ note.title }}</text>
      <view class="detail-meta">
        <view v-if="note.tags" class="detail-tag-chips">
          <text v-for="tg in splitTags(note.tags)" :key="tg" class="detail-tag-chip">#{{ tg }}</text>
        </view>
        <text class="detail-time">{{ formatTime(note.updateTime) }}</text>
      </view>
    </view>

    <!-- Markdown 渲染 -->
    <view class="content-card card">
      <template v-for="(part, index) in contentParts" :key="index">
        <rich-text v-if="part.type === 'html'" :nodes="part.html" />
        <text v-else-if="part.type === 'wikilink'" class="wikilink-text" @tap="handleWikilinkClick(part.title)">[[{{ part.title }}]]</text>
        <text v-else-if="part.type === 'attachment'" class="attachment-text" @tap="openAttachment(part.url)">{{ part.text }}</text>
      </template>
    </view>

    <!-- 反向链接 -->
    <view v-if="!isPreview" class="backlinks-section">
      <text class="section-title">反向链接</text>
      <view v-if="backlinks.length" class="backlink-list">
        <view v-for="b in backlinks" :key="b.id" class="backlink-card card" @tap="goNote(b.id)">
          <text class="backlink-title">{{ b.title }}</text>
          <text class="backlink-summary">{{ b.summary || '无摘要' }}</text>
          <text class="backlink-time">{{ formatTime(b.updateTime) }}</text>
        </view>
      </view>
      <view v-else class="backlink-empty card">
        <text class="backlink-empty-text">暂无反向链接</text>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar">
      <button class="edit-btn" @tap="goEdit">{{ isPreview ? '返回编辑' : '编辑' }}</button>
      <button v-if="!isPreview" class="export-btn" @tap="handleExport">导出 Markdown</button>
    </view>
    <view v-if="!isPreview" class="action-bar">
      <button class="version-btn" @tap="goVersions">版本历史</button>
      <button class="delete-btn" @tap="confirmDelete">删除</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getNoteDetail, getNoteList, createNote, deleteNote } from '../../api/notes'
import { markdownToParts, extractWikilinkTitles } from '../../utils/markdown'
import { exportNoteAsMarkdown } from '../../utils/noteFiles'

const themeClass = ref(getThemeClass())
const noteId = ref('')
const isPreview = ref(false)
const note = ref({
  title: '',
  content: '',
  tags: '',
  updateTime: ''
})
const contentParts = ref([])
const backlinks = ref([])

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

function splitTags(tags) {
  if (!tags) return []
  return tags.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean)
}

async function loadNote() {
  if (isPreview.value) {
    const preview = uni.getStorageSync('SELF_DISCIPLINE_NOTE_PREVIEW')
    if (preview) {
      note.value = {
        title: preview.title || '未命名笔记',
        content: preview.content || '',
        tags: preview.tags || '',
        updateTime: new Date().toISOString()
      }
      contentParts.value = markdownToParts(note.value.content)
    }
    return
  }

  if (!noteId.value) return
  try {
    const res = await getNoteDetail(noteId.value)
    note.value = res.data
    contentParts.value = markdownToParts(res.data.content)
    loadBacklinks()
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 500)
  }
}

async function loadBacklinks() {
  if (!note.value.title) return
  try {
    const res = await getNoteList()
    const allNotes = res.data || []
    const currentTitle = note.value.title
    backlinks.value = allNotes.filter(n => {
      if (Number(n.id) === Number(noteId.value)) return false
      if (!n.content) return false
      return extractWikilinkTitles(n.content).includes(currentTitle)
    })
  } catch (e) {
    backlinks.value = []
  }
}

async function handleWikilinkClick(title) {
  const linkTitle = (title || '').trim()
  if (!linkTitle) return

  try {
    const res = await getNoteList()
    const notes = res.data || []
    const matches = notes.filter(n => n.title === linkTitle)
    if (matches.length === 1) {
      goNote(matches[0].id)
    } else if (matches.length > 1) {
      chooseDuplicateNote(linkTitle, matches)
    } else {
      confirmCreateNote(linkTitle)
    }
  } catch (e) {
    confirmCreateNote(linkTitle)
  }
}

function chooseDuplicateNote(title, matches) {
  const options = matches.slice(0, 6)
  uni.showActionSheet({
    itemList: options.map(item => `#${item.id} ${item.title}`),
    success: (res) => {
      const target = options[res.tapIndex]
      if (target) {
        goNote(target.id)
      }
    },
    fail: () => {
      uni.showToast({ title: `找到 ${matches.length} 篇同名笔记`, icon: 'none' })
    }
  })
}

function confirmCreateNote(title) {
  uni.showModal({
    title: '笔记不存在',
    content: `「${title}」不存在，是否创建？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const createRes = await createNote({ title, content: '', tags: '', folderId: null })
          const newId = createRes.data && createRes.data.id
          if (newId) {
            uni.redirectTo({ url: `/pages/note-edit/note-edit?id=${newId}` })
          }
        } catch (e) { /* request.js 已提示 */ }
      }
    }
  })
}

function goNote(id) {
  uni.redirectTo({ url: `/pages/note-detail/note-detail?id=${id}` })
}

function openAttachment(url) {
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  uni.showToast({ title: '当前端暂不支持打开附件', icon: 'none' })
  // #endif
}

function goEdit() {
  if (isPreview.value) {
    uni.navigateBack()
    return
  }
  uni.redirectTo({ url: `/pages/note-edit/note-edit?id=${noteId.value}` })
}

function handleExport() {
  exportNoteAsMarkdown(note.value)
}

function goVersions() {
  uni.navigateTo({ url: `/pages/note-versions/note-versions?id=${noteId.value}` })
}

function confirmDelete() {
  uni.showModal({
    title: '移入回收站',
    content: `删除后可在回收站恢复，是否删除「${note.value.title}」？`,
    confirmColor: '#e84f4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteNote(noteId.value)
          uni.showToast({ title: '已移入回收站', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 300)
        } catch (e) { /* request.js 已提示 */ }
      }
    }
  })
}

onLoad(options => {
  if (options?.mode === 'preview') {
    isPreview.value = true
    uni.setNavigationBarTitle({ title: '预览笔记' })
  } else if (options?.id) {
    noteId.value = options.id
  }
  loadNote()
})

onShow(() => {
  themeClass.value = getThemeClass()
})
</script>

<style scoped>
.detail-header {
  padding: 30rpx 28rpx;
  margin-bottom: 20rpx;
}

.detail-title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: #172033;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12rpx;
}

.detail-tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.detail-tag-chip {
  font-size: 22rpx;
  color: var(--theme-primary);
  background: var(--theme-soft);
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

.detail-time {
  font-size: 23rpx;
  color: #8491a5;
}

.content-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  min-height: 200rpx;
  line-height: 1.7;
  font-size: 28rpx;
  color: #172033;
  word-break: break-all;
}

.wikilink-text {
  display: inline-block;
  color: #0b4aa2;
  background: #eaf3ff;
  padding: 4rpx 12rpx;
  margin: 4rpx 4rpx 4rpx 0;
  border-radius: 8rpx;
  text-decoration: underline;
}

.attachment-text {
  display: inline-block;
  color: #0b4aa2;
  background: #f0fdf4;
  padding: 4rpx 12rpx;
  margin: 4rpx 4rpx 4rpx 0;
  border-radius: 8rpx;
  text-decoration: underline;
}

.backlinks-section {
  margin-bottom: 20rpx;
}

.backlink-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.backlink-card {
  padding: 22rpx 26rpx;
  transition: transform 0.15s;
}

.backlink-card:active {
  transform: scale(0.98);
}

.backlink-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #172033;
  margin-bottom: 8rpx;
}

.backlink-summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 24rpx;
  color: #66758c;
  line-height: 1.5;
  margin-bottom: 8rpx;
}

.backlink-time {
  display: block;
  font-size: 22rpx;
  color: #8491a5;
}

.backlink-empty {
  padding: 28rpx;
  text-align: center;
}

.backlink-empty-text {
  font-size: 26rpx;
  color: #8491a5;
}

.action-bar {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
}

.edit-btn {
  flex: 2;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
  background: var(--theme-primary);
  border-radius: 24rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx var(--theme-shadow);
}

.edit-btn:active {
  opacity: 0.85;
}

.export-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--theme-primary);
  background: var(--theme-soft);
  border-radius: 24rpx;
  border: none;
}

.export-btn:active {
  opacity: 0.85;
}

.version-btn {
  flex: 2;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  border-radius: 24rpx;
  border: none;
}

.version-btn:active {
  opacity: 0.85;
}

.delete-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #e84f4f;
  background: #fef2f2;
  border-radius: 24rpx;
  border: none;
}

.delete-btn:active {
  opacity: 0.85;
}
</style>
