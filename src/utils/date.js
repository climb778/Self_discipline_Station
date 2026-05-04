const pad = value => String(value).padStart(2, '0')

export function formatDate(date = new Date()) {
  const target = new Date(date)
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`
}

export function formatMonth(date = new Date()) {
  const target = new Date(date)
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}`
}

export function getToday() {
  return formatDate(new Date())
}

export function getDisplayDate(date = new Date()) {
  const target = new Date(date)
  const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${target.getFullYear()}年${target.getMonth() + 1}月${target.getDate()}日 ${weekMap[target.getDay()]}`
}

export function isBeforeToday(dateString) {
  if (!dateString) return false
  return new Date(`${dateString}T23:59:59`).getTime() < new Date(`${getToday()}T00:00:00`).getTime()
}

export function getMonthDays(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const total = new Date(year, monthIndex + 1, 0).getDate()
  const offset = firstDay.getDay()
  const days = []

  for (let i = 0; i < offset; i += 1) {
    days.push(null)
  }

  for (let day = 1; day <= total; day += 1) {
    days.push({
      day,
      date: formatDate(new Date(year, monthIndex, day))
    })
  }

  return days
}
