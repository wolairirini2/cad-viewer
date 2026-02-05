// AcApAnnotationCmd.ts
import {
  AcDbMText,
  AcGePoint3dLike,
  AcGiMTextAttachmentPoint,
  AcCmColor
} from '@mlightcad/data-model'

import { AcApContext, AcApDocManager } from '../app'
import { AcEdCommand, AcEdOpenMode, AcEdPromptPointOptions } from '../editor'
import { AcApI18n } from '../i18n'

/**
 * Command to create a text annotation at specified point.
 * This command is designed to be triggered by right-click context menu.
 */
export class AcApAnnotationCmd extends AcEdCommand {
  private _annotationText: string
  private _insertionPoint?: AcGePoint3dLike

  constructor(text: string = '') {
    super()
    this.mode = AcEdOpenMode.Write
    this._annotationText = text
  }

  /**
   * Set the annotation text before executing command
   */
  setAnnotationText(text: string) {
    this._annotationText = text
  }

  /**
   * Set the insertion point (if already known from right-click)
   */
  setInsertionPoint(point: AcGePoint3dLike) {
    this._insertionPoint = point
  }

  async execute(context: AcApContext) {
    let insertionPoint: AcGePoint3dLike

    // If insertion point not provided, prompt user to pick a point
    if (this._insertionPoint) {
      insertionPoint = this._insertionPoint
    } else {
      const pointPrompt = new AcEdPromptPointOptions(
        AcApI18n.t('annotation.pickPoint') || '指定批注插入点:'
      )
      insertionPoint =
        await AcApDocManager.instance.editor.getPoint(pointPrompt)
    }

    // If no text provided, command cannot complete
    if (!this._annotationText || this._annotationText.trim() === '') {
      throw new Error('Annotation text is required')
    }

    // Create MText entity for annotation
    const db = context.doc.database
    const mtext = new AcDbMText()

    // Set insertion point (使用 location 而不是 setPosition)
    mtext.location = insertionPoint

    // Set text content
    mtext.contents = this._annotationText

    // Set text properties for annotation style
    mtext.height = 2.5 // 默认文字高度

    // 注意：AcDbMText 使用 width 而不是 textWidth
    mtext.width = 100 // 默认宽度，自动换行

    // 使用 AcGiMTextAttachmentPoint 枚举
    // TopLeft = 1, TopCenter = 2, TopRight = 3,
    // MiddleLeft = 4, MiddleCenter = 5, MiddleRight = 6,
    // BottomLeft = 7, BottomCenter = 8, BottomRight = 9
    mtext.attachmentPoint = AcGiMTextAttachmentPoint.TopLeft

    // 使用 styleName 设置文字样式
    mtext.styleName = 'Standard'

    // 设置文字颜色为红色
    const color = new AcCmColor()
    color.setRGB(255, 0, 0) //
    mtext.color = color
    // 设置背景填充使批注更明显
    mtext.backgroundFill = true
    mtext.backgroundFillColor = 0xffee00 // 黄色背景
    mtext.backgroundScaleFactor = 1.5

    // Add to model space (appendEntity 而不是 addEntity)
    db.tables.blockTable.modelSpace.appendEntity(mtext)

    // Regen to show the new entity
    // context.doc.database.regen()
  }
}
