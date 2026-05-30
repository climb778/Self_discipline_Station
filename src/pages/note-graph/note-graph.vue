<template>
  <view class="page-shell" :class="themeClass">
    <!-- 图例 -->
    <view class="legend card">
      <text class="legend-title">知识图谱</text>
      <text class="legend-sub">节点 = 笔记，连线 = [[双向链接]]</text>
    </view>

    <!-- 图谱区域 -->
    <view v-if="nodes.length > 0 && edges.length > 0" class="graph-wrap card">
      <canvas
        canvas-id="noteGraph"
        id="noteGraph"
        class="graph-canvas"
        :style="{ height: canvasHeight + 'px' }"
        @tap="onCanvasTap"
      />
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state card">
      <text class="empty-icon">🕸</text>
      <text class="empty-title">{{ emptyTitle }}</text>
      <text class="empty-text">{{ emptyText }}</text>
    </view>

    <!-- 节点详情弹窗 -->
    <view v-if="selectedNode" class="node-popup card" @tap="goNote(selectedNode.id)">
      <text class="node-popup-title">{{ selectedNode.title }}</text>
      <text class="node-popup-hint">点击进入笔记</text>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getNoteList } from '../../api/notes'
import { extractWikilinkTitles } from '../../utils/markdown'

const themeClass = ref(getThemeClass())
const nodes = ref([])
const edges = ref([])
const selectedNode = ref(null)
const canvasHeight = 600
let ctx = null
let canvasWidth = 0
let nodePositions = []

const emptyTitle = computed(() => nodes.value.length ? '暂无知识链接' : '暂无笔记')
const emptyText = computed(() => nodes.value.length ? '在笔记中使用 [[笔记标题]] 创建关联' : '先创建几篇笔记，再建立双向链接')

async function loadGraph() {
  try {
    const res = await getNoteList()
    const allNotes = res.data || []
    selectedNode.value = null
    if (!allNotes.length) { nodes.value = []; edges.value = []; return }

    // 构建 title->notes 映射。同名标题不自动连线，避免图谱指向不确定。
    const titleMap = {}
    allNotes.forEach(n => {
      if (!titleMap[n.title]) titleMap[n.title] = []
      titleMap[n.title].push(n)
    })

    // 节点：所有笔记
    nodes.value = allNotes

    // 边：笔记 content 中的 [[标题]] 指向存在的笔记
    const edgeSet = new Set()
    const edgeList = []
    allNotes.forEach(source => {
      const titles = extractWikilinkTitles(source.content)
      titles.forEach(targetTitle => {
        const targets = titleMap[targetTitle] || []
        if (targets.length === 1 && targets[0].id !== source.id) {
          const key = `${source.id}->${targets[0].id}`
          if (!edgeSet.has(key)) {
            edgeSet.add(key)
            edgeList.push({ from: source.id, to: targets[0].id })
          }
        }
      })
    })
    edges.value = edgeList

    if (edgeList.length) {
      nextTick(() => {
        setTimeout(drawGraph, 50)
      })
    }
  } catch (e) {
    nodes.value = []
    edges.value = []
  }
}

function drawGraph() {
  ctx = uni.createCanvasContext('noteGraph')
  const query = uni.createSelectorQuery()
  query.select('.graph-canvas').boundingClientRect(rect => {
    if (!rect) return
    canvasWidth = rect.width
    const w = canvasWidth
    const h = canvasHeight
    const cx = w / 2
    const cy = h / 2
    const radius = Math.min(w, h) * 0.35
    const nodeCount = nodes.value.length

    // 圆形布局：计算每个节点位置
    nodePositions = nodes.value.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2
      return {
        id: n.id,
        title: n.title,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      }
    })

    // 清空画布
    ctx.clearRect(0, 0, w, h)

    // 画连线
    ctx.setStrokeStyle('rgba(11, 74, 162, 0.25)')
    ctx.setLineWidth(1.5)
    edges.value.forEach(edge => {
      const from = nodePositions.find(p => p.id === edge.from)
      const to = nodePositions.find(p => p.id === edge.to)
      if (from && to) {
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      }
    })

    // 画节点
    nodePositions.forEach(pos => {
      // 圆点
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI)
      ctx.setFillStyle('#0b4aa2')
      ctx.fill()

      // 标签
      ctx.setFillStyle('#172033')
      ctx.setFontSize(11)
      ctx.setTextAlign('center')
      const label = pos.title.length > 8 ? pos.title.slice(0, 8) + '...' : pos.title
      ctx.fillText(label, pos.x, pos.y + 22)
    })

    ctx.draw()
  }).exec()
}

function onCanvasTap(e) {
  if (!nodePositions.length) return
  const rawX = e.detail?.x ?? e.changedTouches?.[0]?.x
  const rawY = e.detail?.y ?? e.changedTouches?.[0]?.y
  if (rawX == null || rawY == null) return

  const query = uni.createSelectorQuery()
  query.select('.graph-canvas').boundingClientRect(rect => {
    if (!rect) return

    const left = rect.left ?? rect.x ?? 0
    const top = rect.top ?? rect.y ?? 0
    const candidates = [
      { x: rawX, y: rawY },
      { x: rawX - left, y: rawY - top }
    ]

    let hit = null
    for (const point of candidates) {
      hit = nodePositions.find(pos => {
        const dx = pos.x - point.x
        const dy = pos.y - point.y
        return Math.sqrt(dx * dx + dy * dy) < 24
      })
      if (hit) break
    }

    selectedNode.value = hit ? { id: hit.id, title: hit.title } : null
  }).exec()
}

function goNote(id) {
  uni.navigateTo({ url: `/pages/note-detail/note-detail?id=${id}` })
}

onShow(() => {
  themeClass.value = getThemeClass()
  loadGraph()
})
</script>

<style scoped>
.legend {
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
}

.legend-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #172033;
}

.legend-sub {
  display: block;
  font-size: 24rpx;
  color: #8491a5;
  margin-top: 6rpx;
}

.graph-wrap {
  padding: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
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
  color: #172033;
  margin-bottom: 12rpx;
}

.empty-text {
  display: block;
  font-size: 26rpx;
  color: #8491a5;
}

.node-popup {
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  transition: transform 0.15s;
}

.node-popup:active {
  transform: scale(0.98);
}

.node-popup-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #172033;
}

.node-popup-hint {
  display: block;
  font-size: 24rpx;
  color: var(--theme-primary);
  margin-top: 8rpx;
}
</style>
