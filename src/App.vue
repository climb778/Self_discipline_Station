<script>
import { applyThemeChrome, generateRepeatTasks } from './utils/storage'

export default {
  onLaunch() {
    generateRepeatTasks()
    applyThemeChrome()
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
