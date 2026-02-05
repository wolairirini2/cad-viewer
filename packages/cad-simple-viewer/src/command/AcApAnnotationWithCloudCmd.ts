// AcApAnnotationWithCloudCmd.ts
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

// Cloud line diameter in pixels
const CLOUD_DIAMETER_PIXELS = 8

/**
 * Converts pixel distance to world distance using view transformation
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
 * Creates a cloud line (revision cloud) along a rectangular path
 */
function updateCloud(
  cloud: AcDbPolyline,
  firstPoint: AcGePoint2dLike,
  secondPoint: AcGePoint2dLike,
  view: AcEdBaseView
) {
  // Reset the polyline
  cloud.reset(false)

  // Calculate rectangle dimensions
  const minX = Math.min(firstPoint.x, secondPoint.x)
  const maxX = Math.max(firstPoint.x, secondPoint.x)
  const minY = Math.min(firstPoint.y, secondPoint.y)
  const maxY = Math.max(firstPoint.y, secondPoint.y)

  const width = maxX - minX
  const height = maxY - minY

  // Convert cloud diameter from pixels to world coordinates
  const centerPoint = new AcGePoint2d((minX + maxX) / 2, (minY + maxY) / 2)
  const cloudDiameter = pixelToWorldDistance(
    view,
    CLOUD_DIAMETER_PIXELS,
    centerPoint
  )

  // Calculate chord length for each arc segment
  const chordLength = cloudDiameter

  // Calculate the number of segments needed along each edge
  const numSegmentsX = Math.max(4, Math.ceil(width / chordLength) * 2)
  const numSegmentsY = Math.max(4, Math.ceil(height / chordLength) * 2)

  // Generate points along the rectangle path with arcs
  const points: AcGePoint2d[] = []
  const bulges: (number | undefined)[] = []
  let segmentIndex = 0

  // Helper function to calculate bulge for a small arc
  const calculateBulge = (outward: boolean): number => {
    return outward ? 0.4 : -0.4
  }

  // Bottom edge (left to right)
  for (let i = 0; i <= numSegmentsX; i++) {
    const t = i / numSegmentsX
    const x = minX + width * t
    const y = minY
    points.push(new AcGePoint2d(x, y))

    if (i < numSegmentsX) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Right edge (bottom to top)
  for (let i = 1; i <= numSegmentsY; i++) {
    const t = i / numSegmentsY
    const x = maxX
    const y = minY + height * t
    points.push(new AcGePoint2d(x, y))

    if (i < numSegmentsY) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Top edge (right to left)
  for (let i = 1; i <= numSegmentsX; i++) {
    const t = 1 - i / numSegmentsX
    const x = minX + width * t
    const y = maxY
    points.push(new AcGePoint2d(x, y))

    if (i < numSegmentsX) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Left edge (top to bottom)
  for (let i = 1; i < numSegmentsY; i++) {
    const t = 1 - i / numSegmentsY
    const x = minX
    const y = minY + height * t
    points.push(new AcGePoint2d(x, y))

    if (i < numSegmentsY - 1) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Add vertices to polyline with bulge values
  for (let i = 0; i < points.length; i++) {
    const bulge = bulges[i]
    cloud.addVertexAt(i, points[i], bulge)
  }

  cloud.closed = true
}

/**
 * Jig for previewing cloud rectangle during dragging
 */
export class AcApAnnotationCloudJig extends AcEdPreviewJig<AcGePoint2dLike> {
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
 * Command to create annotation with cloud border.
 * Process: 1) Draw cloud rectangle -> 2) Input text -> 3) Place text beside cloud
 */
export class AcApAnnotationWithCloudCmd extends AcEdCommand {
  constructor() {
    super()
    this.mode = AcEdOpenMode.Write
  }

  async execute(context: AcApContext) {
    // Step 1: Select first corner of cloud
    const firstPointPrompt = new AcEdPromptPointOptions(
      AcApI18n.t('annotation.cloudFirstPoint') || '指定批注云线第一个角点:'
    )
    const firstPoint =
      await AcApDocManager.instance.editor.getPoint(firstPointPrompt)

    // Step 2: Select second corner with preview
    const secondPointPrompt = new AcEdPromptPointOptions(
      AcApI18n.t('annotation.cloudSecondPoint') || '指定批注云线对角点:'
    )
    secondPointPrompt.jig = new AcApAnnotationCloudJig(context.view, firstPoint)
    secondPointPrompt.useDashedLine = false
    secondPointPrompt.useBasePoint = true
    const secondPoint =
      await AcApDocManager.instance.editor.getPoint(secondPointPrompt)

    // Step 3: Input annotation text
    const textPrompt = new AcEdPromptStringOptions(
      AcApI18n.t('annotation.enterText') || '输入批注文字:'
    )
    const text = await AcApDocManager.instance.editor.getString(textPrompt)

    if (!text || text.trim() === '') {
      return // User cancelled or entered empty text
    }

    // Calculate cloud bounds
    const minX = Math.min(firstPoint.x, secondPoint.x)
    const maxX = Math.max(firstPoint.x, secondPoint.x)
    const maxY = Math.max(firstPoint.y, secondPoint.y)

    // Create cloud polyline (in red)
    const db = context.doc.database

    const cloud = new AcDbPolyline()
    updateCloud(cloud, firstPoint, secondPoint, context.view)

    // Set cloud color to red
    try {
      const cloudColor = new AcCmColor()
      cloudColor.setRGB(255, 0, 0) // Red
      cloud.color = cloudColor
    } catch (e) {
      console.warn('Failed to set cloud color:', e)
    }

    db.tables.blockTable.modelSpace.appendEntity(cloud)

    // Create annotation text beside the cloud (top-right corner)
    const mtext = new AcDbMText()

    // Place text at top-right corner of cloud box, slightly offset
    const textHeight = this.calculateTextHeight()
    const offset = textHeight * 0.5 // Small offset from cloud corner
    mtext.location = {
      x: maxX + offset,
      y: maxY + offset,
      z: 0
    }

    mtext.contents = text.trim()
    mtext.height = textHeight
    mtext.width = textHeight * 25

    // Set attachment to top-left so text extends to the right from insertion point
    mtext.attachmentPoint = AcGiMTextAttachmentPoint.TopLeft
    mtext.styleName = 'Standard'

    // Set text color to red
    try {
      const textColor = new AcCmColor()
      textColor.setRGB(255, 0, 0) // Red
      mtext.color = textColor
    } catch (e) {
      console.warn('Failed to set text color:', e)
    }

    db.tables.blockTable.modelSpace.appendEntity(mtext)

    console.log(
      '[AnnotationWithCloud] Cloud bounds:',
      { minX, maxY },
      'Text:',
      text
    )
  }

  /**
   * Calculate text height based on camera zoom
   */
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
      console.warn('[AnnotationWithCloud] Failed to calculate text height:', e)
    }
    return 10
  }
}
