<template>
  <view class="page-shell" :class="themeClass">
    <!-- 顶卡 -->
    <view class="hero-card">
      <view class="hero-row">
        <view>
          <text class="hero-title">云笔记</text>
          <text class="hero-sub">记录学习、复盘和灵感</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions card">
      <view class="quick-item" @tap="handleImport">
        <text class="quick-icon">📥</text>
        <text class="quick-label">导入</text>
      </view>
      <view class="quick-item" @tap="handleExportBackup">
        <text class="quick-icon">📤</text>
        <text class="quick-label">备份</text>
      </view>
      <view class="quick-item" @tap="handleRestore">
        <text class="quick-icon">📋</text>
        <text class="quick-label">恢复</text>
      </view>
      <view class="quick-item" @tap="goGraph">
        <text class="quick-icon">🕸</text>
        <text class="quick-label">图谱</text>
      </view>
      <view class="quick-item" @tap="goFolders">
        <text class="quick-icon">📁</text>
        <text class="quick-label">文件夹</text>
      </view>
      <view class="quick-item" @tap="goTrash">
        <text class="quick-icon">🗑</text>
        <text class="quick-label">回收站</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar card">
      <input v-model.trim="keyword" class="search-input" placeholder="搜索笔记标题或内容" @confirm="loadNotes" @input="onSearchInput" />
      <text v-if="keyword" class="search-clear" @tap="keyword = ''; loadNotes()">清除</text>
    </view>

    <!-- 筛选标签栏 -->
    <view class="filter-tabs">
      <text class="filter-tab" :class="{ active: activeTab === 'all' }" @tap="switchTab('all')">全部</text>
      <text class="filter-tab" :class="{ active: activeTab === 'pinned' }" @tap="switchTab('pinned')">置顶</text>
      <text class="filter-tab" :class="{ active: activeTab === 'folder' }" @tap="switchTab('folder')">文件夹</text>
      <text class="filter-tab" :class="{ active: activeTab === 'tag' }" @tap="switchTab('tag')">标签</text>
    </view>

    <!-- 排序 -->
    <view class="sort-bar">
      <text class="sort-label">排序</text>
      <text class="sort-chip" :class="{ active: sortBy === 'updateTime' }" @tap="changeSort('updateTime')">最近编辑</text>
      <text class="sort-chip" :class="{ active: sortBy === 'createTime' }" @tap="changeSort('createTime')">创建时间</text>
      <text class="sort-chip" :class="{ active: sortBy === 'title' }" @tap="changeSort('title')">标题</text>
    </view>

    <!-- 文件夹筛选 -->
    <view v-if="activeTab === 'folder' && folders.length" class="folder-filter">
      <scroll-view scroll-x class="folder-scroll">
        <text class="folder-chip" :class="{ active: !currentFolderId }" @tap="currentFolderId = null; loadNotes()">全部</text>
        <text v-for="f in folders" :key="f.id" class="folder-chip" :class="{ active: currentFolderId === f.id }" @tap="currentFolderId = f.id; loadNotes()">{{ f.name }}</text>
      </scroll-view>
      <text class="folder-manage" @tap="goFolders">管理</text>
    </view>

    <!-- 标签筛选 -->
    <view v-if="activeTab === 'tag' && tagStats.length" class="tag-filter">
      <scroll-view scroll-x class="tag-scroll">
        <text class="tag-chip" :class="{ active: !selectedTag }" @tap="selectedTag = ''; loadNotes()">全部</text>
        <text v-for="t in tagStats" :key="t.name" class="tag-chip" :class="{ active: selectedTag === t.name }" @tap="selectedTag = t.name; loadNotes()">#{{ t.name }} ({{ t.count }})</text>
      </scroll-view>
    </view>
    <view v-if="activeTab === 'tag' && !tagStats.length" class="tag-empty">
      <text class="tag-empty-text">暂无标签，编辑笔记时添加标签即可筛选</text>
    </view>

    <!-- 笔记列表 -->
    <view v-if="notes.length" class="note-list">
      <view v-for="note in notes" :key="note.id" class="note-card card" @tap="goDetail(note.id)">
        <view class="note-header">
          <view class="note-title-wrap">
            <block v-for="(seg, si) in highlightTitle(note.title)" :key="si">
              <text v-if="seg.hit" class="title-highlight">{{ seg.text }}</text>
              <text v-else>{{ seg.text }}</text>
            </block>
          </view>
          <text v-if="note.isPinned" class="pin-badge">置顶</text>
        </view>
        <text v-if="note.summary" class="note-summary">{{ note.summary }}</text>
        <view class="note-meta">
          <view v-if="note.tags" class="note-tag-chips">
            <text v-for="tg in splitTags(note.tags)" :key="tg" class="note-tag-chip" @tap.stop="filterByTag(tg)">#{{ tg }}</text>
          </view>
          <text v-if="folderMap[note.folderId]" class="note-folder-name">{{ folderMap[note.folderId] }}</text>
          <text class="note-time">{{ formatTime(note.updateTime) }}</text>
          <text class="note-del" @tap.stop="confirmDelete(note)">删除</text>
        </view>
      </view>
    </view>

    <!-- 空状态（上下文感知） -->
    <view v-else class="empty-state">
      <text class="empty-icon">📝</text>
      <text class="empty-title">{{ emptyTitle }}</text>
      <text class="empty-text">{{ emptyText }}</text>
    </view>

    <!-- 新建按钮 -->
    <view class="fab" @tap="goCreate">+</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getNoteList, getFolderList, getNoteTags, deleteNote } from '../../api/notes'
import { importMarkdownFile, exportAllNotesAsJson, restoreFromJsonBackup } from '../../utils/noteFiles'

const themeClass = ref(getThemeClass())
const keyword = ref('')
const currentFolderId = ref(null)
const notes = ref([])
const folders = ref([])
const tagStats = ref([])
const activeTab = ref('all')
const selectedTag = ref('')
const sortBy = ref('updateTime')
const folderMap = ref({})
let searchTimer = null

/* ---------- 上下文感知空状态 ---------- */
const emptyTitle = computed(() => {
  if (keyword.value) return '没有找到匹配的笔记'
  if (activeTab.value === 'pinned') return '暂无置顶笔记'
  if (activeTab.value === 'tag' && selectedTag.value) return `没有标签为「${selectedTag.value}」的笔记`
  if (activeTab.value === 'folder' && currentFolderId.value) return '该文件夹暂无笔记'
  return '还没有笔记'
})
const emptyText = computed(() => {
  if (keyword.value) return '换个关键词试试'
  if (activeTab.value === 'pinned') return '长按笔记卡片可置顶'
  return '点击右下角按钮开始记录'
})

/* ---------- 工具函数 ---------- */
function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}月${day}日 ${h}:${min}`
}

function splitTags(tags) {
  if (!tags) return []
  return tags.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean)
}

function highlightTitle(title) {
  if (!keyword.value || !title) return [{ text: title || '', hit: false }]
  const kw = keyword.value.toLowerCase()
  const lower = title.toLowerCase()
  const segments = []
  let last = 0
  let idx = lower.indexOf(kw, last)
  while (idx !== -1) {
    if (idx > last) segments.push({ text: title.slice(last, idx), hit: false })
    segments.push({ text: title.slice(idx, idx + kw.length), hit: true })
    last = idx + kw.length
    idx = lower.indexOf(kw, last)
  }
  if (last < title.length) segments.push({ text: title.slice(last), hit: false })
  return segments.length ? segments : [{ text: title, hit: false }]
}

/* ---------- 筛选逻辑 ---------- */
function switchTab(tab) {
  activeTab.value = tab
  if (tab !== 'folder') currentFolderId.value = null
  if (tab !== 'tag') selectedTag.value = ''
  loadNotes()
}

function changeSort(field) {
  sortBy.value = field
  loadNotes()
}

function filterByTag(tag) {
  activeTab.value = 'tag'
  selectedTag.value = tag
  currentFolderId.value = null
  loadNotes()
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadNotes(), 300)
}

/* ---------- 数据加载 ---------- */
async function loadNotes() {
  try {
    const params = {}
    if (keyword.value) params.keyword = keyword.value
    if (currentFolderId.value) params.folderId = currentFolderId.value
    if (activeTab.value === 'pinned') params.pinned = 1
    if (selectedTag.value) params.tag = selectedTag.value
    if (sortBy.value) params.sort = sortBy.value
    const res = await getNoteList(params)
    notes.value = res.data || []
  } catch (e) {
    notes.value = []
  }
}

async function loadFolders() {
  try {
    const res = await getFolderList()
    folders.value = res.data || []
    const map = {}
    folders.value.forEach(f => { map[f.id] = f.name })
    folderMap.value = map
  } catch (e) {
    folders.value = []
    folderMap.value = {}
  }
}

async function loadTagStats() {
  try {
    const res = await getNoteTags()
    tagStats.value = res.data || []
  } catch (e) {
    tagStats.value = []
  }
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/note-detail/note-detail?id=${id}` })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/note-edit/note-edit' })
}

function goFolders() {
  uni.navigateTo({ url: '/pages/note-folders/note-folders' })
}

function goGraph() {
  uni.navigateTo({ url: '/pages/note-graph/note-graph' })
}

function goTrash() {
  uni.navigateTo({ url: '/pages/note-trash/note-trash' })
}

function confirmDelete(note) {
  uni.showModal({
    title: '移入回收站',
    content: `删除后可在回收站恢复，是否删除「${note.title}」？`,
    confirmColor: '#e84f4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteNote(note.id)
          uni.showToast({ title: '已移入回收站', icon: 'success' })
          loadNotes()
        } catch (e) { /* request.js 已提示 */ }
      }
    }
  })
}

async function handleImport() {
  const newNote = await importMarkdownFile()
  if (newNote && newNote.id) {
    uni.navigateTo({ url: `/pages/note-edit/note-edit?id=${newNote.id}` })
  } else if (newNote) {
    loadNotes()
    loadTagStats()
  }
}

async function handleExportBackup() {
  await exportAllNotesAsJson()
}

async function handleRestore() {
  const result = await restoreFromJsonBackup()
  if (result) {
    const parts = []
    if (result.folderSuccess > 0) parts.push(`文件夹成功 ${result.folderSuccess} 个`)
    parts.push(`笔记成功 ${result.noteSuccess} 条`)
    if (result.noteFail > 0) parts.push(`失败 ${result.noteFail} 条`)
    uni.showToast({
      title: '恢复完成：' + parts.join('，'),
      icon: 'none',
      duration: 2500
    })
    loadNotes()
    loadFolders()
    loadTagStats()
  }
}

onShow(() => {
  themeClass.value = getThemeClass()
  loadNotes()
  loadFolders()
  loadTagStats()
})
</script>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 32rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 40rpx var(--theme-shadow);
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

.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: 24rpx 16rpx;
  margin-bottom: 20rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 8rpx;
  border-radius: 16rpx;
  min-width: 100rpx;
}

.quick-item:active {
  background: #eef4fb;
}

.quick-icon {
  font-size: 44rpx;
}

.quick-label {
  font-size: 22rpx;
  color: #66758c;
  font-weight: 600;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #172033;
}

.search-clear {
  color: #8491a5;
  font-size: 26rpx;
  padding: 12rpx;
}

.filter-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.filter-tab {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  font-size: 25rpx;
  color: #66758c;
  background: #eef4fb;
  font-weight: 600;
}

.filter-tab.active {
  color: #fff;
  background: var(--theme-primary);
}

.sort-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.sort-label {
  font-size: 24rpx;
  color: #8491a5;
  font-weight: 600;
  white-space: nowrap;
}

.sort-chip {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
  color: #66758c;
  background: #eef4fb;
}

.sort-chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.tag-filter {
  margin-bottom: 20rpx;
}

.tag-scroll {
  white-space: nowrap;
}

.tag-chip {
  display: inline-block;
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #66758c;
  background: #eef4fb;
  margin-right: 12rpx;
}

.tag-chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.tag-empty {
  margin-bottom: 20rpx;
  padding: 16rpx 28rpx;
  background: #f0f5ff;
  border-radius: 22rpx;
}

.tag-empty-text {
  color: #5b7fb5;
  font-size: 25rpx;
}

.folder-filter {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  gap: 16rpx;
}

.folder-scroll {
  flex: 1;
  white-space: nowrap;
}

.folder-chip {
  display: inline-block;
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  font-size: 25rpx;
  color: #66758c;
  background: #eef4fb;
  margin-right: 12rpx;
}

.folder-chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.folder-manage {
  color: var(--theme-primary);
  font-size: 25rpx;
  font-weight: 600;
  padding: 14rpx 8rpx;
  white-space: nowrap;
}

.folder-empty {
  margin-bottom: 20rpx;
  padding: 20rpx 28rpx;
  background: #fffbe6;
  border-radius: 22rpx;
}

.folder-empty-text {
  color: #d99616;
  font-size: 26rpx;
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.note-card {
  padding: 28rpx;
  transition: transform 0.15s;
}

.note-card:active {
  transform: scale(0.98);
}

.note-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.note-title-wrap {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #172033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-highlight {
  color: var(--theme-primary);
  background: var(--theme-soft);
  border-radius: 4rpx;
  padding: 0 2rpx;
}

.pin-badge {
  font-size: 20rpx;
  color: #d96b16;
  background: #fff3e7;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
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
  flex-wrap: wrap;
  gap: 8rpx;
}

.note-tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.note-tag-chip {
  font-size: 21rpx;
  color: var(--theme-primary);
  background: var(--theme-soft);
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-folder-name {
  font-size: 21rpx;
  color: #8491a5;
  background: #f0f4fa;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  white-space: nowrap;
}

.note-time {
  font-size: 23rpx;
  color: #8491a5;
}

.note-del {
  font-size: 23rpx;
  color: #e84f4f;
  padding: 6rpx 12rpx;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
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
  color: #172033;
  margin-bottom: 12rpx;
}

.empty-text {
  display: block;
  font-size: 26rpx;
  color: #8491a5;
}

.fab {
  position: fixed;
  right: 36rpx;
  bottom: calc(140rpx + env(safe-area-inset-bottom));
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: var(--theme-primary);
  color: #fff;
  font-size: 56rpx;
  text-align: center;
  line-height: 112rpx;
  box-shadow: 0 12rpx 32rpx var(--theme-shadow);
  z-index: 100;
}

.fab:active {
  transform: scale(0.92);
}
</style>
