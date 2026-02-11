// AcApAnnotationCmd.ts
import {
  AcDbMText,
  AcDbPolyline,
  AcGePoint2d,
  AcGePoint2dLike,
  AcGiMTextAttachmentPoint,
  AcCmColor
} from '@mlightcad/data-model'

import { AcApContext, AcApDocManager } from '../app'
import {
  AcEdBaseView,
  AcEdCommand,
  AcEdOpenMode,
  AcEdPreviewJig,
  AcEdPromptPointOptions,
  AcEdPromptStringOptions
} from '../editor'
import { AcApI18n } from '../i18n'

// 批注类型：文本、云线、箭头
export type AnnotationType = 'text' | 'cloud' | 'arrow'

// 简化的批注数据接口 - 统一使用 objectId
export interface AnnotationData {
  id: string
  type: 'annotation'
  annotationType: AnnotationType
  // 文本批注
  text?: string
  textPosition?: { x: number; y: number; z: number }
  textHeight?: number
  // 云线批注
  cloudBounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  // 箭头批注
  arrowPoints?: {
    start: { x: number; y: number; z: number }
    end: { x: number; y: number; z: number }
  }
  createdAt: string
  // 统一的实体ID
  objectId?: string
}

// 常量
const CLOUD_DIAMETER_PIXELS = 8
const ARROW_HEAD_SIZE = 10

/**
 * 像素距离转世界距离
 */
function pixelToWorldDistance(
  view: AcEdBaseView,
  pixelDistance: number,
  referencePoint: AcGePoint2dLike
): number {
  const screenPoint1 = view.worldToScreen(referencePoint)
  const screenPoint2 = new AcGePoint2d(
    screenPoint1.x + pixelDistance,
    screenPoint1.y
  )
  const worldPoint2 = view.screenToWorld(screenPoint2)
  return Math.abs(worldPoint2.x - referencePoint.x)
}

/**
 * 创建箭头形状
 */
function createArrowPolyline(
  polyline: AcDbPolyline,
  start: AcGePoint2dLike,
  end: AcGePoint2dLike,
  view: AcEdBaseView
): void {
  polyline.reset(false)

  const dx = end.x - start.x
  const dy = end.y - start.y
  const angle = Math.atan2(dy, dx)
  const length = Math.sqrt(dx * dx + dy * dy)

  // 避免除以零
  if (length === 0) {
    polyline.addVertexAt(0, new AcGePoint2d(start.x, start.y))
    return
  }

  const headSize = pixelToWorldDistance(view, ARROW_HEAD_SIZE, start)
  const headLength = headSize * 2
  const headWidth = headSize

  // 主线段终点（留出箭头位置）
  const mainEndX = end.x - (dx / length) * headLength * 0.5
  const mainEndY = end.y - (dy / length) * headLength * 0.5

  // 箭头头部两侧点
  const arrowLeftX =
    end.x -
    headLength * Math.cos(angle) +
    headWidth * Math.cos(angle + Math.PI / 2)
  const arrowLeftY =
    end.y -
    headLength * Math.sin(angle) +
    headWidth * Math.sin(angle + Math.PI / 2)

  const arrowRightX =
    end.x -
    headLength * Math.cos(angle) +
    headWidth * Math.cos(angle - Math.PI / 2)
  const arrowRightY =
    end.y -
    headLength * Math.sin(angle) +
    headWidth * Math.sin(angle - Math.PI / 2)

  // 使用 AcGePoint2d 创建点
  polyline.addVertexAt(0, new AcGePoint2d(start.x, start.y))
  polyline.addVertexAt(1, new AcGePoint2d(mainEndX, mainEndY))
  polyline.addVertexAt(2, new AcGePoint2d(arrowLeftX, arrowLeftY))
  polyline.addVertexAt(3, new AcGePoint2d(end.x, end.y))
  polyline.addVertexAt(4, new AcGePoint2d(arrowRightX, arrowRightY))
  polyline.addVertexAt(5, new AcGePoint2d(mainEndX, mainEndY))

  polyline.closed = false
}

/**
 * 更新云线形状
 */
export function updateCloud(
  cloud: AcDbPolyline,
  firstPoint: AcGePoint2dLike,
  secondPoint: AcGePoint2dLike,
  view: AcEdBaseView
) {
  cloud.reset(false)

  const minX = Math.min(firstPoint.x, secondPoint.x)
  const maxX = Math.max(firstPoint.x, secondPoint.x)
  const minY = Math.min(firstPoint.y, secondPoint.y)
  const maxY = Math.max(firstPoint.y, secondPoint.y)

  const width = maxX - minX
  const height = maxY - minY

  const centerPoint = new AcGePoint2d((minX + maxX) / 2, (minY + maxY) / 2)
  const cloudDiameter = pixelToWorldDistance(
    view,
    CLOUD_DIAMETER_PIXELS,
    centerPoint
  )

  const chordLength = cloudDiameter
  const numSegmentsX = Math.max(4, Math.ceil(width / chordLength) * 2)
  const numSegmentsY = Math.max(4, Math.ceil(height / chordLength) * 2)

  const points: AcGePoint2d[] = []
  const bulges: (number | undefined)[] = []
  let segmentIndex = 0

  const calculateBulge = (outward: boolean): number => (outward ? 0.4 : -0.4)

  // Bottom edge
  for (let i = 0; i <= numSegmentsX; i++) {
    const t = i / numSegmentsX
    points.push(new AcGePoint2d(minX + width * t, minY))
    bulges.push(
      i < numSegmentsX ? calculateBulge(segmentIndex++ % 2 === 0) : undefined
    )
  }

  // Right edge
  for (let i = 1; i <= numSegmentsY; i++) {
    const t = i / numSegmentsY
    points.push(new AcGePoint2d(maxX, minY + height * t))
    bulges.push(
      i < numSegmentsY ? calculateBulge(segmentIndex++ % 2 === 0) : undefined
    )
  }

  // Top edge
  for (let i = 1; i <= numSegmentsX; i++) {
    const t = 1 - i / numSegmentsX
    points.push(new AcGePoint2d(minX + width * t, maxY))
    bulges.push(
      i < numSegmentsX ? calculateBulge(segmentIndex++ % 2 === 0) : undefined
    )
  }

  // Left edge
  for (let i = 1; i < numSegmentsY; i++) {
    const t = 1 - i / numSegmentsY
    points.push(new AcGePoint2d(minX, minY + height * t))
    bulges.push(
      i < numSegmentsY - 1
        ? calculateBulge(segmentIndex++ % 2 === 0)
        : undefined
    )
  }

  for (let i = 0; i < points.length; i++) {
    cloud.addVertexAt(i, points[i], bulges[i])
  }

  cloud.closed = true
}

/**
 * 云线预览 Jig
 */
export class AcApCloudJig extends AcEdPreviewJig<AcGePoint2dLike> {
  private _cloud: AcDbPolyline
  private _firstPoint: AcGePoint2d
  private _view: AcEdBaseView

  constructor(view: AcEdBaseView, start: AcGePoint2dLike) {
    super(view)
    this._cloud = new AcDbPolyline()
    this._firstPoint = new AcGePoint2d(start)
    this._view = view
  }

  get entity(): AcDbPolyline {
    return this._cloud
  }

  update(secondPoint: AcGePoint2dLike) {
    updateCloud(this._cloud, this._firstPoint, secondPoint, this._view)
  }
}

/**
 * 箭头预览 Jig
 */
export class AcApArrowJig extends AcEdPreviewJig<AcGePoint2dLike> {
  private _arrow: AcDbPolyline
  private _startPoint: AcGePoint2d
  private _view: AcEdBaseView

  constructor(view: AcEdBaseView, start: AcGePoint2dLike) {
    super(view)
    this._arrow = new AcDbPolyline()
    this._startPoint = new AcGePoint2d(start)
    this._view = view
  }

  get entity(): AcDbPolyline {
    return this._arrow
  }

  update(endPoint: AcGePoint2dLike) {
    createArrowPolyline(this._arrow, this._startPoint, endPoint, this._view)
  }
}

/**
 * 批注命令 - 支持文本、云线、箭头三种类型
 */
export class AcApAnnotationCmd extends AcEdCommand {
  private static _lastAnnotationData?: AnnotationData
  private _annotationType: AnnotationType = 'text'

  static getLastAnnotationData(): AnnotationData | undefined {
    const data = this._lastAnnotationData
    this._lastAnnotationData = undefined
    return data
  }

  setAnnotationType(type: AnnotationType) {
    this._annotationType = type
  }

  /**
   * 静态方法：渲染批注到图纸 - 统一返回 objectId
   */
  static renderAnnotationToDb(
    ann: AnnotationData,
    view: AcEdBaseView,
    db: any
  ): {
    success: boolean
    objectId?: string
    error?: string
  } {
    try {
      let entity: any

      if (ann.annotationType === 'text') {
        // 渲染文本
        const mtext = new AcDbMText()
        mtext.location = ann.textPosition!
        mtext.contents = ann.text!
        mtext.height = ann.textHeight!
        mtext.width = ann.textHeight! * 25
        mtext.attachmentPoint = AcGiMTextAttachmentPoint.TopLeft
        mtext.styleName = 'Standard'

        const color = new AcCmColor()
        color.setRGB(255, 0, 0)
        mtext.color = color
        db.tables.blockTable.modelSpace.appendEntity(mtext)
        entity = mtext
      } else if (ann.annotationType === 'arrow') {
        // 渲染箭头
        const arrow = new AcDbPolyline()
        createArrowPolyline(
          arrow,
          ann.arrowPoints!.start,
          ann.arrowPoints!.end,
          view
        )

        const color = new AcCmColor()
        color.setRGB(255, 0, 0)
        arrow.color = color

        db.tables.blockTable.modelSpace.appendEntity(arrow)
        entity = arrow
      } else if (ann.annotationType === 'cloud') {
        // 渲染云线
        const firstPoint: AcGePoint2dLike = {
          x: ann.cloudBounds!.minX,
          y: ann.cloudBounds!.minY
        }
        const secondPoint: AcGePoint2dLike = {
          x: ann.cloudBounds!.maxX,
          y: ann.cloudBounds!.maxY
        }

        const cloud = new AcDbPolyline()
        updateCloud(cloud, firstPoint, secondPoint, view)

        const color = new AcCmColor()
        color.setRGB(255, 0, 0)
        cloud.color = color

        db.tables.blockTable.modelSpace.appendEntity(cloud)
        entity = cloud
      } else {
        return { success: false, error: 'Unknown annotation type' }
      }

      return {
        success: true,
        objectId: entity.objectId
      }
    } catch (error) {
      console.error('[renderAnnotationToDb] 渲染失败:', error)
      return { success: false, error: String(error) }
    }
  }

  constructor() {
    super()
    this.mode = AcEdOpenMode.Write
  }

  async execute(context: AcApContext) {
    switch (this._annotationType) {
      case 'text':
        return this.executeText(context)
      case 'cloud':
        return this.executeCloud(context)
      case 'arrow':
        return this.executeArrow(context)
    }
  }

  /**
   * 执行文本批注
   */
  private async executeText(context: AcApContext) {
    const pointPrompt = new AcEdPromptPointOptions(
      AcApI18n.t('annotation.textPosition') || '指定文本位置:'
    )
    const position = await AcApDocManager.instance.editor.getPoint(pointPrompt)

    const textPrompt = new AcEdPromptStringOptions(
      AcApI18n.t('annotation.enterText') || '输入批注文字:'
    )
    const text = await AcApDocManager.instance.editor.getString(textPrompt)

    if (!text || text.trim() === '') {
      return
    }

    const textHeight = this.calculateTextHeight()
    const db = context.doc.database

    const mtext = new AcDbMText()
    mtext.location = { x: position.x, y: position.y, z: 0 }
    mtext.contents = text.trim()
    mtext.height = textHeight
    mtext.width = textHeight * 25
    mtext.attachmentPoint = AcGiMTextAttachmentPoint.TopLeft
    mtext.styleName = 'Standard'

    const color = new AcCmColor()
    color.setRGB(255, 0, 0)
    mtext.color = color

    db.tables.blockTable.modelSpace.appendEntity(mtext)

    AcApAnnotationCmd._lastAnnotationData = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'annotation',
      annotationType: 'text',
      text: text.trim(),
      textPosition: { x: position.x, y: position.y, z: 0 },
      textHeight,
      createdAt: new Date().toISOString(),
      objectId: mtext.objectId
    }

    return AcApAnnotationCmd._lastAnnotationData
  }

  /**
   * 执行云线批注
   */
  private async executeCloud(context: AcApContext) {
    const firstPointPrompt = new AcEdPromptPointOptions(
      AcApI18n.t('annotation.cloudFirstPoint') || '指定云线第一个角点:'
    )
    const firstPoint =
      await AcApDocManager.instance.editor.getPoint(firstPointPrompt)

    const secondPointPrompt = new AcEdPromptPointOptions(
      AcApI18n.t('annotation.cloudSecondPoint') || '指定云线对角点:'
    )
    secondPointPrompt.jig = new AcApCloudJig(context.view, firstPoint)
    secondPointPrompt.useDashedLine = false
    secondPointPrompt.useBasePoint = true
    const secondPoint =
      await AcApDocManager.instance.editor.getPoint(secondPointPrompt)

    const minX = Math.min(firstPoint.x, secondPoint.x)
    const maxX = Math.max(firstPoint.x, secondPoint.x)
    const minY = Math.min(firstPoint.y, secondPoint.y)
    const maxY = Math.max(firstPoint.y, secondPoint.y)

    const db = context.doc.database
    const cloud = new AcDbPolyline()
    updateCloud(cloud, firstPoint, secondPoint, context.view)

    const color = new AcCmColor()
    color.setRGB(255, 0, 0)
    cloud.color = color

    db.tables.blockTable.modelSpace.appendEntity(cloud)

    AcApAnnotationCmd._lastAnnotationData = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'annotation',
      annotationType: 'cloud',
      cloudBounds: { minX, maxX, minY, maxY },
      createdAt: new Date().toISOString(),
      objectId: cloud.objectId
    }

    return AcApAnnotationCmd._lastAnnotationData
  }

  /**
   * 执行箭头批注
   */
  private async executeArrow(context: AcApContext) {
    const startPointPrompt = new AcEdPromptPointOptions(
      AcApI18n.t('annotation.arrowStart') || '指定箭头起点:'
    )
    const startPoint =
      await AcApDocManager.instance.editor.getPoint(startPointPrompt)

    const endPointPrompt = new AcEdPromptPointOptions(
      AcApI18n.t('annotation.arrowEnd') || '指定箭头终点:'
    )
    endPointPrompt.jig = new AcApArrowJig(context.view, startPoint)
    endPointPrompt.useDashedLine = false
    endPointPrompt.useBasePoint = true
    const endPoint =
      await AcApDocManager.instance.editor.getPoint(endPointPrompt)

    const db = context.doc.database
    const arrow = new AcDbPolyline()
    createArrowPolyline(arrow, startPoint, endPoint, context.view)

    const color = new AcCmColor()
    color.setRGB(255, 0, 0)
    arrow.color = color

    db.tables.blockTable.modelSpace.appendEntity(arrow)

    AcApAnnotationCmd._lastAnnotationData = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'annotation',
      annotationType: 'arrow',
      arrowPoints: {
        start: { x: startPoint.x, y: startPoint.y, z: 0 },
        end: { x: endPoint.x, y: endPoint.y, z: 0 }
      },
      createdAt: new Date().toISOString(),
      objectId: arrow.objectId
    }

    return AcApAnnotationCmd._lastAnnotationData
  }

  private calculateTextHeight(): number {
    try {
      const view = AcApDocManager.instance.curView as any
      const layoutView = view?.activeLayoutView
      if (layoutView?._camera) {
        const zoom = layoutView._camera.zoom || 1
        const baseTextHeight = 30
        const textHeight = baseTextHeight / zoom
        return Math.max(Math.min(textHeight, 1000), 0.1)
      }
    } catch (e) {
      console.warn('[AnnotationCmd] Failed to calculate text height:', e)
    }
    return 10
  }
}
