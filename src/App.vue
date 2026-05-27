<script>
import { applyThemeChrome, generateRepeatTasks, getSettings, migrateData } from './utils/storage'

const PAGE_MAP = {
  todo: { url: '/pages/todo/todo', tab: true },
  study: { url: '/pages/study-log/study-log', tab: false },
  profile: { url: '/pages/profile/profile', tab: true },
  plans: { url: '/pages/plans/plans', tab: false }
}

let defaultLaunchHandled = false

function getRoutePath(url) {
  return url.replace(/^\//, '')
}

function goFallbackPage() {
  uni.switchTab({
    url: PAGE_MAP.todo.url,
    fail() {
      uni.reLaunch({ url: PAGE_MAP.todo.url })
    }
  })
}

function openPage(page) {
  const options = {
    url: page.url,
    fail: goFallbackPage
  }

  if (page.tab) {
    uni.switchTab(options)
    return
  }
  uni.reLaunch(options)
}

function openDefaultLaunchPage(retry = 0) {
  if (defaultLaunchHandled) return

  const pages = getCurrentPages()
  if (!pages.length && retry < 5) {
    setTimeout(() => openDefaultLaunchPage(retry + 1), 80)
    return
  }

  defaultLaunchHandled = true
  const settings = getSettings()
  const page = PAGE_MAP[settings.defaultLaunchPage] || PAGE_MAP.todo
  const currentRoute = pages[pages.length - 1]?.route || ''

  if (currentRoute === getRoutePath(page.url)) return
  openPage(page)
}

export default {
  onLaunch() {
    migrateData()
    generateRepeatTasks()
    applyThemeChrome()

    try {
      setTimeout(() => openDefaultLaunchPage(), 80)
    } catch (e) {
      goFallbackPage()
    }
  },
  onShow() {
    generateRepeatTasks()
    applyThemeChrome()
  }
}
</script>

<style>
@import './styles/common.css';

page {
  min-height: 100%;
  background: #f5f8fc;
  color: #172033;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>
