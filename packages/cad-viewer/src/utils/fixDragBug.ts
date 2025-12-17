// utils/fixDragBug.ts

const PALETTE_POSITION_KEY = 'ml_palette_transform_offsets'
let globalObserver: MutationObserver | null = null

// 保存/读取偏移量函数（保持不变）
function saveOffset(paletteId: string, offsetX: number, offsetY: number) {
  const offsets = JSON.parse(localStorage.getItem(PALETTE_POSITION_KEY) || '{}')
  offsets[paletteId] = { x: offsetX, y: offsetY }
  localStorage.setItem(PALETTE_POSITION_KEY, JSON.stringify(offsets))
}

function getOffset(paletteId: string) {
  const offsets = JSON.parse(localStorage.getItem(PALETTE_POSITION_KEY) || '{}')
  return offsets[paletteId]
}

export function fixToolPaletteDragBug() {
  if (globalObserver) {
    globalObserver.disconnect()
  }

  globalObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            if (element.classList?.contains('ml-tool-palette-dialog')) {
              // 关键：立即修复，不延迟
              fixSinglePalette(element)
            }

            const toolPalettes = element.querySelectorAll?.(
              '.ml-tool-palette-dialog'
            )
            toolPalettes?.forEach(palette => {
              fixSinglePalette(palette as HTMLElement)
            })
          }
        })
      }
    })
  })

  globalObserver.observe(document.body, {
    childList: true,
    subtree: true
  })

  document.querySelectorAll('.ml-tool-palette-dialog').forEach(palette => {
    fixSinglePalette(palette as HTMLElement)
  })

  return globalObserver
}

function fixSinglePalette(element: HTMLElement) {
  const titleBar = element.querySelector(
    '.ml-tool-palette-title-bar'
  ) as HTMLElement
  if (!titleBar || (element as any)._dragFixed) return

  ;(element as any)._dragFixed = true

  const paletteId =
    element.id || element.getAttribute('data-palette-id') || 'default'
  if (!element.id) element.id = paletteId

  // 核心优化：预先隐藏并定位
  const savedOffset = getOffset(paletteId)

  if (savedOffset) {
    // 1. 立即隐藏元素（防止闪现）
    const originalTransition = element.style.transition
    element.style.transition = 'none'
    element.style.opacity = '0'

    // 2. 立即应用变换到目标位置
    element.style.transform = `translate(${savedOffset.x}px, ${savedOffset.y}px)`
    ;(element as any)._offset = savedOffset

    // 3. 在下一帧恢复可见性（确保在渲染前完成）
    requestAnimationFrame(() => {
      element.style.opacity = ''
      // 延迟恢复transition，避免影响初次显示
      setTimeout(() => {
        element.style.transition = originalTransition
      }, 0)
    })
  } else {
    ;(element as any)._offset = { x: 0, y: 0 }
  }

  // 拖拽逻辑（保持不变）
  let isDragging = false
  let isClick = false
  let startX = 0
  let startY = 0
  let startOffsetX = 0
  let startOffsetY = 0

  titleBar.addEventListener(
    'mousedown',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isButton =
        target.closest('.el-icon') ||
        target.closest('.ml-collapse') ||
        target.closest('.ml-tool-palette-dialog-icon')
      if (isButton) {
        isClick = true
        return
      }

      if (e.button !== 0) return

      e.preventDefault()
      e.stopPropagation()

      startX = e.clientX
      startY = e.clientY
      const currentOffset = (element as any)._offset || { x: 0, y: 0 }
      startOffsetX = currentOffset.x
      startOffsetY = currentOffset.y
      isDragging = false

      element.style.transition = 'none'
      element.style.zIndex = '10000'

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = Math.abs(moveEvent.clientX - startX)
        const deltaY = Math.abs(moveEvent.clientY - startY)

        if (deltaX > 3 || deltaY > 3) {
          isDragging = true
        }

        if (isDragging) {
          const newOffsetX = startOffsetX + (moveEvent.clientX - startX)
          const newOffsetY = startOffsetY + (moveEvent.clientY - startY)

          const constrained = constrainOffset(newOffsetX, newOffsetY, element)
          element.style.transform = `translate(${constrained.x}px, ${constrained.y}px)`
          ;(element as any)._offset = constrained
        }
      }

      const onMouseUp = () => {
        if (isDragging) {
          const offset = (element as any)._offset
          saveOffset(paletteId, offset.x, offset.y)
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
  )

  const buttons = titleBar.querySelectorAll(
    '.el-icon, .ml-collapse, .ml-tool-palette-dialog-icon'
  )
  buttons.forEach(button => {
    button.addEventListener(
      'mousedown',
      e => {
        e.stopPropagation()
      },
      true
    )
  })
}

function constrainOffset(
  offsetX: number,
  offsetY: number,
  element: HTMLElement
) {
  const rect = element.getBoundingClientRect()
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  const computedStyle = window.getComputedStyle(element)
  const originalLeft = parseFloat(computedStyle.left) || 0
  const originalTop = parseFloat(computedStyle.top) || 0

  const actualLeft = originalLeft + offsetX
  const actualTop = originalTop + offsetY
  const actualRight = actualLeft + rect.width
  const actualBottom = actualTop + rect.height

  let adjustX = 0
  let adjustY = 0

  if (actualLeft < 0) adjustX = -actualLeft
  if (actualTop < 0) adjustY = -actualTop
  if (actualRight > windowWidth) adjustX = windowWidth - actualRight
  if (actualBottom > windowHeight) adjustY = windowHeight - actualBottom

  return { x: offsetX + adjustX, y: offsetY + adjustY }
}

export function cleanupDragBugFix() {
  if (globalObserver) {
    globalObserver.disconnect()
    globalObserver = null
  }
}
