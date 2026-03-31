// AcApLocateCmd.ts
import {
  AcDbPolyline,
  AcGePoint2d,
  AcCmColor,
  AcDbMText
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
    const circledNumbers = [
      '①',
      '②',
      '③',
      '④',
      '⑤',
      '⑥',
      '⑦',
      '⑧',
      '⑨',
      '⑩',
      '⑪',
      '⑫',
      '⑬',
      '⑭',
      '⑮',
      '⑯',
      '⑰',
      '⑱',
      '⑲',
      '⑳'
    ]
    if (num >= 1 && num <= 20) {
      return circledNumbers[num - 1]
    }
    return num.toString()
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

      // 统一转换为数组处理
      const extentsArray = Array.isArray(this.extents)
        ? this.extents
        : [this.extents]

      // 创建所有临时高亮方框
      const objectIds: string[] = []

      extentsArray.forEach((extent, index) => {
        const { min_point, max_point } = extent

        // 创建矩形的四个角点
        const p1 = new AcGePoint2d(min_point.x, min_point.y)
        const p2 = new AcGePoint2d(max_point.x, min_point.y)
        const p3 = new AcGePoint2d(max_point.x, max_point.y)
        const p4 = new AcGePoint2d(min_point.x, max_point.y)

        // 1. 创建橙色边框线
        const outlinePolyline = new AcDbPolyline()
        outlinePolyline.addVertexAt(0, p1)
        outlinePolyline.addVertexAt(1, p2)
        outlinePolyline.addVertexAt(2, p3)
        outlinePolyline.addVertexAt(3, p4)
        outlinePolyline.closed = true

        // 设置样式：橙色边框、线宽
        const orangeColor = new AcCmColor()
        orangeColor.setRGB(ORANGE_COLOR.r, ORANGE_COLOR.g, ORANGE_COLOR.b)
        outlinePolyline.color = orangeColor
        outlinePolyline.lineWeight = 40 // 设置较粗的线宽以便可见

        // 添加到模型空间
        db.tables.blockTable.modelSpace.appendEntity(outlinePolyline)
        objectIds.push(outlinePolyline.objectId)

        // 2. 在右上角添加序号文本
        const text = new AcDbMText()
        // 位置设置在右上角稍微偏外一点
        const textPosition = new AcGePoint2d(max_point.x + 5, max_point.y + 5)
        text.location = { x: textPosition.x, y: textPosition.y, z: 0 }
        text.contents = this.getCircledNumber(index + 1)
        text.height = 20 // 文字高度
        text.width = 20
        text.styleName = 'Standard'

        // 设置文字颜色为橙色
        const textColor = new AcCmColor()
        textColor.setRGB(ORANGE_COLOR.r, ORANGE_COLOR.g, ORANGE_COLOR.b)
        text.color = textColor

        // 添加到模型空间
        db.tables.blockTable.modelSpace.appendEntity(text)
        objectIds.push(text.objectId)
      })

      // 保存所有 objectId 以便后续清除（逗号分隔）
      AcApLocateCmd._currentLocateBoxId = objectIds.join(',')
      console.log(
        '[AcApLocateCmd] 临时定位方框已创建:',
        objectIds.length / 2,
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
