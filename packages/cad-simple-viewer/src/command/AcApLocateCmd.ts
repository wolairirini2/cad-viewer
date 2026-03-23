// AcApLocateCmd.ts
import {
  AcDbPolyline,
  AcGePoint2d,
  AcGeBox2d,
  AcCmColor
} from '@mlightcad/data-model'

import { AcApContext, AcApDocManager } from '../app'
import { AcEdCommand, AcEdOpenMode } from '../editor'

/**
 * 定位命令 - 在CAD中创建临时高亮方框标记区域
 */
export class AcApLocateCmd extends AcEdCommand {
  // 静态变量存储当前定位方框的 objectId
  private static _currentLocateBoxId: string | null = null

  // 实例属性存储定位参数
  private extents: {
    min_point: { x: number; y: number }
    max_point: { x: number; y: number }
  }
  private padding: number

  /**
   * 构造函数接收定位参数
   */
  constructor(
    extents: {
      min_point: { x: number; y: number }
      max_point: { x: number; y: number }
    },
    padding: number = 0.5
  ) {
    super()
    this.mode = AcEdOpenMode.Write
    this.extents = extents
    this.padding = padding
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
          db.tables.blockTable.modelSpace.removeEntity(this._currentLocateBoxId)
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

      const { min_point, max_point } = this.extents

      // 创建临时高亮方框
      const polyline = new AcDbPolyline()

      // 创建矩形框的四个顶点（逆时针）
      const p1 = new AcGePoint2d(min_point.x, min_point.y)
      const p2 = new AcGePoint2d(max_point.x, min_point.y)
      const p3 = new AcGePoint2d(max_point.x, max_point.y)
      const p4 = new AcGePoint2d(min_point.x, max_point.y)

      polyline.addVertexAt(0, p1)
      polyline.addVertexAt(1, p2)
      polyline.addVertexAt(2, p3)
      polyline.addVertexAt(3, p4)
      polyline.closed = true

      // 设置样式：红色、线宽
      const color = new AcCmColor()
      color.setRGB(255, 0, 0)
      polyline.color = color
      polyline.lineWeight = 40 // 设置较粗的线宽以便可见

      // 添加到模型空间
      db.tables.blockTable.modelSpace.appendEntity(polyline)

      // 保存 objectId 以便后续清除
      AcApLocateCmd._currentLocateBoxId = polyline.objectId

      console.log('[AcApLocateCmd] 临时定位方框已创建:', polyline.objectId)

      // 缩放到区域
      const box = new AcGeBox2d(
        { x: min_point.x, y: min_point.y },
        { x: max_point.x, y: max_point.y }
      )
      view.zoomTo(box, this.padding)
    } catch (error) {
      console.error('[AcApLocateCmd] 定位失败:', error)
    }
  }

  /**
   * 静态便捷方法：快速定位到指定区域
   */
  static async locate(
    extents: {
      min_point: { x: number; y: number }
      max_point: { x: number; y: number }
    },
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
  extents: {
    min_point: { x: number; y: number }
    max_point: { x: number; y: number }
  },
  padding: number = 0.5
): Promise<boolean> {
  return await AcApLocateCmd.locate(extents, padding)
}
