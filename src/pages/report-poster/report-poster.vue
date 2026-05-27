<template>
  <view class="page-shell" :class="themeClass">
    <view class="poster-wrap">
      <view class="poster-card hero-card">
        <text class="poster-brand">自律小站</text>
        <text class="poster-period">{{ periodLabel }}自律报告</text>

        <view class="poster-stats">
          <view class="poster-stat">
            <text class="poster-num">{{ report.completedCount }}</text>
            <text class="poster-stat-label">完成任务</text>
          </view>
          <view class="poster-divider"></view>
          <view class="poster-stat">
            <text class="poster-num">{{ report.focusMinutes }}</text>
            <text class="poster-stat-label">专注时长</text>
          </view>
          <view class="poster-divider"></view>
          <view class="poster-stat">
            <text class="poster-num">{{ report.completionRate }}%</text>
            <text class="poster-stat-label">完成率</text>
          </view>
        </view>

        <view class="poster-row">
          <view class="poster-row-item">
            <text class="poster-row-label">{{ type === 'week' ? '连续打卡' : '最长连续打卡' }}</text>
            <text class="poster-row-value">{{ streakDays }} 天</text>
          </view>
          <view class="poster-row-item">
            <text class="poster-row-label">最常完成分类</text>
            <text class="poster-row-value">{{ report.topCategory }}</text>
          </view>
        </view>

        <view class="poster-summary-wrap">
          <text class="poster-summary">{{ summaryText }}</text>
        </view>

        <view class="poster-footer">
          <text class="poster-quote">认真生活的每一天，都算数。</text>
          <text class="poster-date">{{ generatedDate }}</text>
        </view>
      </view>
    </view>

    <view class="action-buttons">
      <button class="primary-button" @tap="copyShareText">复制分享文案</button>
      <button class="save-button" @tap="savePoster">保存海报</button>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <canvas
      canvas-id="posterCanvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      class="poster-canvas"
    />
    <!-- #endif -->
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getTasks, getThemeClass, getThemeMeta, generateRepeatTasks } from '../../utils/storage'
import { getFocusRecords } from '../../utils/focus'
import { getPlans } from '../../utils/plans'
import { getWeeklyReport, getMonthlyReport } from '../../utils/report'
import { formatDate } from '../../utils/date'

const type = ref('week')
const themeClass = ref(getThemeClass())
const tasks = ref([])
const focusRecords = ref([])
const plans = ref([])

const periodLabel = computed(() => type.value === 'week' ? '本周' : '本月')

const report = computed(() => {
  if (type.value === 'week') {
    return getWeeklyReport(tasks.value, focusRecords.value, plans.value)
  }
  return getMonthlyReport(tasks.value, focusRecords.value, plans.value)
})

const streakDays = computed(() => {
  return report.value.longestStreak || report.value.continuousDays || 0
})

const summaryText = computed(() => {
  if (report.value.completedCount === 0 && report.value.focusMinutes === 0) {
    return '这段时间还没有太多记录，从今天开始也不晚。'
  }
  return report.value.summary || '继续加油，每一天都在进步。'
})

const generatedDate = computed(() => {
  return formatDate(new Date())
})

const canvasWidth = 600
const canvasHeight = 900

function copyShareText() {
  const lines = [
    `【自律小站 · ${periodLabel.value}报告】`,
    `完成任务：${report.value.completedCount} 个`,
    `专注时长：${report.value.focusMinutes} 分钟`,
    `完成率：${report.value.completionRate}%`,
    `${type.value === 'week' ? '连续打卡' : '最长连续打卡'}：${streakDays.value} 天`,
    `最常完成分类：${report.value.topCategory}`,
    '',
    '认真生活的每一天，都算数。'
  ]
  uni.setClipboardData({
    data: lines.join('\n'),
    success: () => {
      uni.showToast({ title: '已复制分享文案', icon: 'success' })
    }
  })
}

function savePoster() {
  // #ifdef H5
  uni.showToast({ title: '请长按海报卡片截图保存', icon: 'none', duration: 2500 })
  // #endif
  // #ifdef MP-WEIXIN
  drawAndSavePoster()
  // #endif
  // #ifdef APP-PLUS
  uni.showToast({ title: '请截图保存海报', icon: 'none', duration: 2500 })
  // #endif
}

function drawAndSavePoster() {
  uni.showLoading({ title: '生成海报中...' })
  const ctx = uni.createCanvasContext('posterCanvas')
  const w = canvasWidth
  const h = canvasHeight
  const meta = getThemeMeta()

  const primary = meta.primary
  const secondary = meta.secondary
  const r = 32

  ctx.setFillStyle(primary)
  ctx.fillRect(0, 0, w, h)

  ctx.setFillStyle(secondary)
  ctx.beginPath()
  ctx.moveTo(0, h * 0.55)
  ctx.lineTo(w, h * 0.45)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  const cx = 50
  const cy = 80
  const cw = w - 100
  const ch = h - 160
  const cr = 28

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx + cr, cy + cr, cr, Math.PI, Math.PI * 1.5)
  ctx.arc(cx + cw - cr, cy + cr, cr, Math.PI * 1.5, 0)
  ctx.arc(cx + cw - cr, cy + ch - cr, cr, 0, Math.PI * 0.5)
  ctx.arc(cx + cr, cy + ch - cr, cr, Math.PI * 0.5, Math.PI)
  ctx.closePath()
  ctx.setFillStyle('rgba(255,255,255,0.13)')
  ctx.fill()
  ctx.restore()

  ctx.setTextAlign('center')
  ctx.setFillStyle('#ffffff')

  ctx.setFontSize(22)
  ctx.globalAlpha = 0.7
  ctx.fillText('自律小站', w / 2, cy + 48)
  ctx.globalAlpha = 1

  ctx.setFontSize(34)
  ctx.fillText(periodLabel.value + '自律报告', w / 2, cy + 95)

  const statsY = cy + 150
  const colW = cw / 3
  const stats = [
    { value: String(report.value.completedCount), label: '完成任务' },
    { value: String(report.value.focusMinutes), label: '专注时长' },
    { value: report.value.completionRate + '%', label: '完成率' }
  ]

  stats.forEach((s, i) => {
    const sx = cx + colW * i + colW / 2

    ctx.setFontSize(46)
    ctx.fillText(s.value, sx, statsY + 50)

    ctx.setFontSize(18)
    ctx.globalAlpha = 0.7
    ctx.fillText(s.label, sx, statsY + 78)
    ctx.globalAlpha = 1

    if (i < 2) {
      const dx = cx + colW * (i + 1)
      ctx.setStrokeStyle('rgba(255,255,255,0.22)')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(dx, statsY + 10)
      ctx.lineTo(dx, statsY + 75)
      ctx.stroke()
    }
  })

  const rowY = statsY + 110
  ctx.setStrokeStyle('rgba(255,255,255,0.15)')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(cx + 20, rowY)
  ctx.lineTo(cx + cw - 20, rowY)
  ctx.stroke()

  const rowData = [
    { label: type.value === 'week' ? '连续打卡' : '最长连续打卡', value: streakDays.value + ' 天' },
    { label: '最常完成分类', value: report.value.topCategory }
  ]
  const rowColW = cw / 2
  rowData.forEach((r, i) => {
    const rx = cx + rowColW * i + rowColW / 2

    ctx.setFontSize(17)
    ctx.globalAlpha = 0.6
    ctx.fillText(r.label, rx, rowY + 32)
    ctx.globalAlpha = 1

    ctx.setFontSize(26)
    ctx.fillText(r.value, rx, rowY + 65)
  })

  const sumY = rowY + 100
  const sumCx = cx + 24
  const sumCw = cw - 48
  const sumCh = 110
  const sumCr = 18

  ctx.save()
  ctx.beginPath()
  ctx.arc(sumCx + sumCr, sumY + sumCr, sumCr, Math.PI, Math.PI * 1.5)
  ctx.arc(sumCx + sumCw - sumCr, sumY + sumCr, sumCr, Math.PI * 1.5, 0)
  ctx.arc(sumCx + sumCw - sumCr, sumY + sumCh - sumCr, sumCr, 0, Math.PI * 0.5)
  ctx.arc(sumCx + sumCr, sumY + sumCh - sumCr, sumCr, Math.PI * 0.5, Math.PI)
  ctx.closePath()
  ctx.setFillStyle('rgba(255,255,255,0.12)')
  ctx.fill()
  ctx.restore()

  ctx.setTextAlign('center')
  ctx.setFontSize(19)
  ctx.globalAlpha = 0.88

  const maxChars = 18
  const lines = []
  const text = summaryText.value
  for (let i = 0; i < text.length; i += maxChars) {
    lines.push(text.slice(i, i + maxChars))
  }
  const lineH = 28
  const textStartY = sumY + (sumCh - lines.length * lineH) / 2 + lineH - 6
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, textStartY + i * lineH)
  })
  ctx.globalAlpha = 1

  ctx.setTextAlign('center')
  ctx.setFontSize(21)
  ctx.globalAlpha = 0.85
  ctx.fillText('认真生活的每一天，都算数。', w / 2, sumY + sumCh + 50)
  ctx.globalAlpha = 1

  ctx.setFontSize(17)
  ctx.globalAlpha = 0.5
  ctx.fillText(generatedDate.value, w / 2, sumY + sumCh + 82)
  ctx.globalAlpha = 1

  ctx.draw(false, () => {
    setTimeout(() => {
      uni.canvasToTempFilePath({
        canvasId: 'posterCanvas',
        width: w,
        height: h,
        destWidth: w * 2,
        destHeight: h * 2,
        success: (res) => {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.hideLoading()
              uni.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: (err) => {
              uni.hideLoading()
              if (err.errMsg && err.errMsg.indexOf('deny') !== -1) {
                uni.showModal({
                  title: '需要相册权限',
                  content: '请在设置中允许访问相册，以便保存海报图片。',
                  confirmText: '去设置',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      uni.openSetting()
                    }
                  }
                })
              } else {
                uni.showToast({ title: '保存失败，请截图保存', icon: 'none', duration: 2500 })
              }
            }
          })
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '生成图片失败，请截图保存', icon: 'none', duration: 2500 })
        }
      })
    }, 300)
  })
}

function loadData() {
  generateRepeatTasks()
  tasks.value = getTasks()
  focusRecords.value = getFocusRecords()
  plans.value = getPlans()
  themeClass.value = getThemeClass()
}

onLoad(options => {
  if (options?.type === 'month') {
    type.value = 'month'
    uni.setNavigationBarTitle({ title: '本月报告海报' })
  } else {
    type.value = 'week'
    uni.setNavigationBarTitle({ title: '本周报告海报' })
  }
})

onShow(loadData)
</script>

<style scoped>
.poster-wrap {
  display: flex;
  justify-content: center;
  padding: 20rpx 0 10rpx;
}

.poster-card {
  width: 620rpx;
  padding: 48rpx 40rpx;
  text-align: center;
  border-radius: 36rpx;
}

.poster-brand {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  opacity: 0.7;
}

.poster-period {
  display: block;
  margin-top: 14rpx;
  font-size: 40rpx;
  font-weight: 800;
}

.poster-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 44rpx;
  gap: 28rpx;
}

.poster-stat {
  flex: 1;
  text-align: center;
}

.poster-num {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
  line-height: 1.1;
}

.poster-stat-label {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  opacity: 0.7;
}

.poster-divider {
  width: 1rpx;
  height: 70rpx;
  background: rgba(255, 255, 255, 0.22);
}

.poster-row {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-top: 40rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.15);
}

.poster-row-item {
  text-align: center;
}

.poster-row-label {
  display: block;
  font-size: 22rpx;
  opacity: 0.6;
}

.poster-row-value {
  display: block;
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 800;
}

.poster-summary-wrap {
  margin-top: 36rpx;
  padding: 24rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.12);
}

.poster-summary {
  display: block;
  color: rgba(255, 255, 255, 0.88);
  font-size: 25rpx;
  line-height: 1.7;
}

.poster-footer {
  margin-top: 36rpx;
}

.poster-quote {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  opacity: 0.85;
}

.poster-date {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  opacity: 0.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 24rpx 0 40rpx;
}

.save-button {
  height: 96rpx;
  border-radius: 28rpx;
  color: var(--theme-primary);
  font-size: 32rpx;
  font-weight: 700;
  line-height: 96rpx;
  background: var(--theme-soft);
}

.poster-canvas {
  position: fixed;
  left: -9999rpx;
  top: -9999rpx;
  z-index: -1;
}
</style>
