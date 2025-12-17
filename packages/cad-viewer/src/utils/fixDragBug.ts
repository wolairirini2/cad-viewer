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

function fixSinglePalette(element: HTMLElement) {
  const titleBar = element.querySelector(
    '.ml-tool-palette-title-bar'
  ) as HTMLElement
  if (!titleBar || (element as any)._dragFixed) return
  ;(element as any)._dragFixed = true

  let isDragging = false
  let isClick = false
  let startX = 0
  let startY = 0
  let startTime = 0

  // 使用事件委托，不替换元素
  titleBar.addEventListener(
    'mousedown',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // 检查是否是按钮
      const isButton =
        target.closest('.el-icon') ||
        target.closest('.ml-collapse') ||
        target.closest('.ml-tool-palette-dialog-icon')

      if (isButton) {
        console.log('Mouse down on button, allow click')
        isClick = true
        return // 让按钮正常处理点击
      }

      // 对于非按钮区域，准备拖拽
      if (e.button !== 0) return

      e.preventDefault()
      e.stopPropagation()

      // 记录开始时间和位置
      startTime = Date.now()
      startX = e.clientX
      startY = e.clientY

      // 获取元素当前位置
      const computedStyle = window.getComputedStyle(element)
      const currentLeft =
        parseFloat(computedStyle.left) || element.getBoundingClientRect().left
      const currentTop =
        parseFloat(computedStyle.top) || element.getBoundingClientRect().top

      const initialLeft = currentLeft
      const initialTop = currentTop

      element.style.transition = 'none'
      element.style.zIndex = '10000'

      const onMouseMove = (moveEvent: MouseEvent) => {
        // 计算移动距离
        const deltaX = Math.abs(moveEvent.clientX - startX)
        const deltaY = Math.abs(moveEvent.clientY - startY)

        // 如果移动距离超过阈值，认为是拖拽而不是点击
        if (deltaX > 3 || deltaY > 3) {
          isDragging = true
        }

        if (isDragging) {
          const newLeft = initialLeft + (moveEvent.clientX - startX)
          const newTop = initialTop + (moveEvent.clientY - startY)

          // 边界约束
          const constrainedPos = constrainPosition(newLeft, newTop, element)

          element.style.left = `${constrainedPos.left}px`
          element.style.top = `${constrainedPos.top}px`
        }
      }

      const onMouseUp = () => {
        const elapsedTime = Date.now() - startTime

        // 如果不是拖拽且时间很短，可能是按钮点击
        if (!isDragging && elapsedTime < 200) {
          console.log('Short click, might be a button click')
        }

        isDragging = false
        isClick = false
        element.style.transition = ''
        element.style.zIndex = ''

        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    true
  ) // 使用捕获阶段

  // 阻止按钮区域的拖拽事件冒泡
  const buttons = titleBar.querySelectorAll(
    '.el-icon, .ml-collapse, .ml-tool-palette-dialog-icon'
  )
  buttons.forEach(button => {
    button.addEventListener(
      'mousedown',
      e => {
        e.stopPropagation() // 阻止事件冒泡到标题栏
      },
      true
    )
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
