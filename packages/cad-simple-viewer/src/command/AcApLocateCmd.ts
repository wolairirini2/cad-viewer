// AcApLocateCmd.ts
import {
  AcGePoint2d,
  AcCmColor,
  AcDbMText,
  AcDbHatch,
  AcGeLoop2d,
  AcGeLine2d
} from '@mlightcad/data-model'

import { AcApContext, AcApDocManager } from '../app'
import { AcEdCommand, AcEdOpenMode } from '../editor'

export interface SingleExtent {
  min_point: { x: number; y: number }
  max_point: { x: number; y: number }
}

// 橙色定义
const ORANGE_COLOR = { r: 255, g: 165, b: 0 }

/**
 * 定位命令 - 在CAD中创建临时高亮方框标记区域
 */
export class AcApLocateCmd extends AcEdCommand {
  // 静态变量存储当前定位方框的 objectId
  private static _currentLocateBoxId: string | null = null

  // 实例属性存储定位参数
  private extents: SingleExtent | SingleExtent[]
  private padding: number

  /**
   * 构造函数接收定位参数
   */
  constructor(extents: SingleExtent | SingleExtent[], padding: number = 0.5) {
    super()
    this.mode = AcEdOpenMode.Write
    this.extents = extents
    this.padding = padding
    console.log(this.padding)
  }

  /**
   * 获取当前定位方框的 objectId
   */
  static getCurrentLocateBoxId(): string | null {
    return this._currentLocateBoxId
  }

  /**
   * 清除当前的临时定位方框
   */
  static clearLocateBox(): void {
    if (this._currentLocateBoxId) {
      try {
        const db = AcApDocManager.instance.curDocument?.database
        if (db) {
          // 支持清除多个方框（逗号分隔的 objectId）
          const objectIds = this._currentLocateBoxId.split(',')
          for (const objectId of objectIds) {
            if (objectId) {
              try {
                db.tables.blockTable.modelSpace.removeEntity(objectId)
              } catch (e) {
                // 单个实体可能已不存在，忽略错误继续清除其他
              }
            }
          }
        }
      } catch (e) {
        // 实体可能已不存在，忽略错误
      }
      this._currentLocateBoxId = null
    }
  }

  /**
   * 检查是否存在临时定位方框
   */
  static hasLocateBox(): boolean {
    return this._currentLocateBoxId !== null
  }

  /**
   * 获取带圈数字字符
   * @param num 序号 (1-20)
   * @returns 带圈数字字符如 ①, ②, ③
   */
  private getCircledNumber(num: number): string {
    const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
    if (num >= 1 && num <= 10) {
      return circledNumbers[num - 1]
    }
    return num.toString()
  }

  /**
   * 创建矩形边界环
   */
  private createRectangularLoop(
    min_point: { x: number; y: number },
    max_point: { x: number; y: number }
  ): AcGeLoop2d {
    // 创建矩形的四个角点
    const p1 = new AcGePoint2d(min_point.x, min_point.y)
    const p2 = new AcGePoint2d(max_point.x, min_point.y)
    const p3 = new AcGePoint2d(max_point.x, max_point.y)
    const p4 = new AcGePoint2d(min_point.x, max_point.y)

    // 创建四条边（AcGeLine2d）
    const line1 = new AcGeLine2d(p1, p2) // 底边
    const line2 = new AcGeLine2d(p2, p3) // 右边
    const line3 = new AcGeLine2d(p3, p4) // 顶边
    const line4 = new AcGeLine2d(p4, p1) // 左边

    // 创建闭合环
    const loop = new AcGeLoop2d([line1, line2, line3, line4])
    return loop
  }
  /**
   * 创建带边框的 Hatch（外环是边框，内环挖空）
   */
  private createBorderHatch(
    min_point: { x: number; y: number },
    max_point: { x: number; y: number },
    borderWidth: number,
    borderColor: AcCmColor
  ): string {
    const db = AcApDocManager.instance.curDocument?.database
    if (!db) return ''

    // 创建空心边框 Hatch
    const borderHatch = new AcDbHatch()
    borderHatch.isSolidFill = true
    borderHatch.color = borderColor

    // 外边界（大一圈，形成边框外沿）
    const outerMinX = min_point.x - borderWidth
    const outerMinY = min_point.y - borderWidth
    const outerMaxX = max_point.x + borderWidth
    const outerMaxY = max_point.y + borderWidth

    // 外环（顺时针）
    const outerLoop = this.createRectangularLoop(
      { x: outerMinX, y: outerMinY },
      { x: outerMaxX, y: outerMaxY }
    )
    borderHatch.add(outerLoop)

    // 内环（挖空，逆时针或顺时针，与外环方向相反形成空心）
    const innerLoop = this.createRectangularLoop(
      { x: min_point.x, y: min_point.y },
      { x: max_point.x, y: max_point.y }
    )
    borderHatch.add(innerLoop)

    db.tables.blockTable.modelSpace.appendEntity(borderHatch)
    return borderHatch.objectId
  }

  /**
   * 计算基于屏幕像素的CAD世界坐标尺寸（带上下限保护）
   */
  private calculatePixelSizeInWorld(pixelSize: number): number {
    try {
      const view = AcApDocManager.instance.curView as any
      const layoutView = view?.activeLayoutView

      if (layoutView?._camera) {
        // 获取视图范围（世界坐标）
        const viewExtents = layoutView._camera.viewExtents
        if (viewExtents) {
          // 视图对角线长度
          const dx = viewExtents.max.x - viewExtents.min.x
          const dy = viewExtents.max.y - viewExtents.min.y
          const diagonal = Math.sqrt(dx * dx + dy * dy)

          // 返回对角线的固定比例
          return diagonal * pixelSize
        }
      }
    } catch (e) {
      console.warn('[AcApLocateCmd] Failed to calculate view relative size:', e)
    }

    // 默认回退值
    return 1
  }

  /**
   * 获取当前视图下的标准尺寸配置（带比例保护）
   */
  private getViewDependentSizes(): {
    borderWidth: number
    textHeight: number
    textOffset: number
  } {
    // 基础像素尺寸
    const BORDER_WIDTH_PIXELS = 1 // 边框 3 像素
    const TEXT_HEIGHT_PIXELS = 14 // 文字 14 像素（与边框保持 4.67:1 比例）
    const TEXT_OFFSET_PIXELS = 6 // 文字偏移 6 像素

    const borderWidth = this.calculatePixelSizeInWorld(BORDER_WIDTH_PIXELS)
    const textHeight = this.calculatePixelSizeInWorld(TEXT_HEIGHT_PIXELS)
    const textOffset = this.calculatePixelSizeInWorld(TEXT_OFFSET_PIXELS)

    // 确保文字和边框的比例始终合理（文字高度约为边框宽度的 4-5 倍）
    const ratio = textHeight / borderWidth
    if (ratio < 3 || ratio > 8) {
      // 比例失调时，强制调整文字高度
      const adjustedTextHeight = borderWidth * 4.5
      return {
        borderWidth,
        textHeight: adjustedTextHeight,
        textOffset: adjustedTextHeight * 0.4
      }
    }

    return { borderWidth, textHeight, textOffset }
  }
  /**
   * 执行定位命令（符合基类签名：仅一个context参数）
   */
  execute(context: AcApContext): void {
    try {
      const view = context.view
      const db = context.doc.database

      if (!view || !db) {
        console.error('[AcApLocateCmd] 无法获取视图或数据库')
        return
      }

      // 先清除上次的临时方框
      AcApLocateCmd.clearLocateBox()

      const extentsArray = Array.isArray(this.extents)
        ? this.extents
        : [this.extents]

      const objectIds: string[] = []

      // 获取当前视图下的统一尺寸
      const { borderWidth, textHeight, textOffset } =
        this.getViewDependentSizes()

      extentsArray.forEach((extent, index) => {
        const { min_point, max_point } = extent

        // 定义边框颜色（深橙色）
        const borderColor = new AcCmColor()
        borderColor.setRGB(255, 140, 0)

        // 创建空心边框 Hatch（使用统一的 borderWidth）
        const borderId = this.createBorderHatch(
          min_point,
          max_point,
          borderWidth, // 统一计算后的边框宽度
          borderColor
        )
        if (borderId) {
          objectIds.push(borderId)
        }

        // 添加序号文本（使用统一的 textHeight 和 textOffset）
        const text = new AcDbMText()

        // 位置设置在右上角，使用统一的偏移量
        const textPosition = new AcGePoint2d(
          max_point.x + textOffset,
          max_point.y + textOffset
        )

        text.location = { x: textPosition.x, y: textPosition.y, z: 0 }
        text.contents = this.getCircledNumber(index + 1)
        text.height = textHeight // 统一计算后的文字高度
        text.width = textHeight * 1.2 // 宽度与高度成比例
        text.styleName = 'Standard'

        // 设置文字颜色为橙色
        const textColor = new AcCmColor()
        textColor.setRGB(ORANGE_COLOR.r, ORANGE_COLOR.g, ORANGE_COLOR.b)
        text.color = textColor

        db.tables.blockTable.modelSpace.appendEntity(text)
        objectIds.push(text.objectId)
      })

      AcApLocateCmd._currentLocateBoxId = objectIds.join(',')
      console.log(
        '[AcApLocateCmd] 临时定位方框已创建:',
        extentsArray.length,
        '个'
      )
    } catch (error) {
      console.error('[AcApLocateCmd] 定位失败:', error)
    }
  }

  /**
   * 静态便捷方法：快速定位到指定区域
   */
  static async locate(
    extents: SingleExtent | SingleExtent[],
    padding: number = 0.5
  ): Promise<boolean> {
    const context = AcApDocManager.instance.context
    if (!context) {
      console.error('[AcApLocateCmd] 无法获取CAD上下文')
      return false
    }

    const cmd = new AcApLocateCmd(extents, padding)
    try {
      cmd.execute(context) // 执行同步方法
      return true
    } catch (e) {
      return false
    }
  }
}

/**
 * 便捷函数：清除临时定位方框
 */
export function clearLocateBox(): void {
  AcApLocateCmd.clearLocateBox()
}

/**
 * 便捷函数：执行定位
 */
export async function locateInCad(
  extents: SingleExtent | SingleExtent[],
  padding: number = 0.5
): Promise<boolean> {
  return await AcApLocateCmd.locate(extents, padding)
}
