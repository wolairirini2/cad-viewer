// utils/fixDragBug.ts
export function fixToolPaletteDragBug() {
  // 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            // 检查是否是工具面板
            if (element.classList?.contains('ml-tool-palette-dialog')) {
              // 延迟修复，确保组件完全加载
              setTimeout(() => fixSinglePalette(element), 100)
            }

            // 检查子元素
            const toolPalettes = element.querySelectorAll?.(
              '.ml-tool-palette-dialog'
            )
            toolPalettes.forEach(palette => {
              setTimeout(() => fixSinglePalette(palette as HTMLElement), 100)
            })
          }
        })
      }
    })
  })

  // 开始观察整个文档
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // 修复已存在的面板
  document.querySelectorAll('.ml-tool-palette-dialog').forEach(palette => {
    setTimeout(() => fixSinglePalette(palette as HTMLElement), 100)
  })

  return observer
}

// utils/fixDragBug.ts
function fixSinglePalette(element: HTMLElement) {
  const titleBar = element.querySelector('.ml-tool-palette-title-bar')
  if (!titleBar) return

  // 标记已经修复过
  if ((element as any)._dragFixed) return
  ;(element as any)._dragFixed = true

  let isDragging = false
  let startX = 0
  let startY = 0
  let initialLeft = 0
  let initialTop = 0

  // 清除原有的事件监听器
  const newTitleBar = titleBar.cloneNode(true) as HTMLElement
  titleBar.parentNode?.replaceChild(newTitleBar, titleBar)

  // 添加新的事件监听
  newTitleBar.addEventListener('mousedown', (e: MouseEvent) => {
    // 检查是否点击了图标
    const target = e.target as HTMLElement
    if (
      target.closest('.ml-tool-palette-dialog-icon') ||
      target.closest('.ml-collapse')
    ) {
      return // 让图标正常处理点击
    }

    e.preventDefault()
    e.stopPropagation()

    // 关键修复：获取元素当前的 left/top 值
    // 使用 computedStyle 而不是 getBoundingClientRect
    const computedStyle = window.getComputedStyle(element)

    // 注意：getBoundingClientRect() 返回的是相对于视口的绝对位置
    // 而我们需要的是元素相对于其定位容器的位置（left/top）
    const rect = element.getBoundingClientRect()

    // 记录鼠标初始位置
    startX = e.clientX
    startY = e.clientY

    // 记录元素初始位置 - 这里的关键是使用 getBoundingClientRect()
    initialLeft = rect.left
    initialTop = rect.top

    // 获取元素的当前 left/top 样式值（如果有的话）
    let currentLeft = parseFloat(computedStyle.left) || initialLeft
    let currentTop = parseFloat(computedStyle.top) || initialTop

    // 如果元素之前没有设置 left/top，我们需要设置它
    if (computedStyle.left === 'auto' || computedStyle.left === '') {
      element.style.left = `${initialLeft}px`
      currentLeft = initialLeft
    }

    if (computedStyle.top === 'auto' || computedStyle.top === '') {
      element.style.top = `${initialTop}px`
      currentTop = initialTop
    }

    isDragging = true

    // 设置拖拽样式
    element.style.transition = 'none'
    element.style.zIndex = '10000'
    element.style.cursor = 'move'

    // 鼠标移动事件
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return

      // 计算移动距离
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      // 计算新的绝对位置
      const newLeft = currentLeft + deltaX
      const newTop = currentTop + deltaY

      // 应用边界约束
      const constrainedPos = constrainPosition(newLeft, newTop, element)

      // 直接应用 left/top，不要使用 transform
      element.style.left = `${constrainedPos.left}px`
      element.style.top = `${constrainedPos.top}px`

      // 更新拖拽位置，用于下一次计算
      startX = moveEvent.clientX
      startY = moveEvent.clientY
      currentLeft = constrainedPos.left
      currentTop = constrainedPos.top
    }

    // 鼠标抬起事件 - 简化版本
    const onMouseUp = () => {
      if (!isDragging) return

      isDragging = false

      // 清理样式
      element.style.transition = ''
      element.style.zIndex = ''
      element.style.cursor = ''

      // 移除事件监听
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    // 添加事件监听
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })
}

// 修复边界约束函数
function constrainPosition(left: number, top: number, element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  // 确保元素不会移出窗口
  let constrainedLeft = left
  let constrainedTop = top

  // 检查左边和上边边界
  if (constrainedLeft < 0) constrainedLeft = 0
  if (constrainedTop < 0) constrainedTop = 0

  // 检查右边和下边边界
  if (constrainedLeft + rect.width > windowWidth) {
    constrainedLeft = windowWidth - rect.width
  }
  if (constrainedTop + rect.height > windowHeight) {
    constrainedTop = windowHeight - rect.height
  }

  return { left: constrainedLeft, top: constrainedTop }
}
