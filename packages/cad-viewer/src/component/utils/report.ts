import ExcelJS from 'exceljs'
import { ElMessage } from 'element-plus'

export interface ViolationItem {
  risk_level: string
  category: string
  articleTitle: string
  description: string
  suggestion: string[]
  ruleName: string
  ruleCode: string
  articleId: string
  origin: string
  allViolations?: any[]
}

export const getRiskText = (level: string): string => {
  switch (level) {
    case 'high':
      return '重大问题'
    case 'medium':
      return '一般问题'
    case 'low':
      return '轻微问题'
    default:
      return level
  }
}

export const exportReport = async (
  data: ViolationItem[],
  projectName: string,
  selection: ViolationItem[] = []
) => {
  const rawData = selection.length > 0 ? selection : data

  if (rawData.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  const groupedData = rawData.reduce(
    (acc, item) => {
      const key = item.articleId
      if (!acc[key]) {
        acc[key] = {
          ...item,
          allViolations: [] // 已初始化为空数组
        }
      }
      if (item.allViolations?.length) {
        // 修复：添加非空断言 ! 确保 TypeScript 知道 allViolations 已定义
        acc[key].allViolations!.push(...item.allViolations)
      }
      return acc
    },
    {} as Record<string, ViolationItem>
  )

  const dataToExport = Object.values(groupedData).map((group: any) => {
    const descriptions = group.allViolations
      .filter((v: any) => v.description)
      .map((v: any, index: number) => `${index + 1}. ${v.description}`)

    const suggestions: string[] = []
    group.allViolations.forEach((v: any, vIndex: number) => {
      if (v.suggestion?.length) {
        suggestions.push(`${vIndex + 1}. ${v.suggestion.join(' ')}`)
      }
    })

    return {
      risk_level: group.risk_level,
      category: group.category,
      articleTitle: group.articleTitle,
      description: descriptions.join('\n') || '审查已通过',
      suggestion: suggestions.join('\n') || '无',
      ruleName: group.ruleName,
      ruleCode: group.ruleCode,
      articleId: group.articleId,
      origin: group.origin
    }
  })

  try {
    const loading = ElMessage({
      message: '正在生成报告...',
      type: 'info',
      duration: 0
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AI审图系统'
    workbook.created = new Date()

    // 样式定义
    const createBorders = (isHeader = false) => ({
      top: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      },
      left: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      },
      bottom: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      },
      right: {
        style: 'thin',
        color: { argb: isHeader ? 'FF000000' : 'FFD9D9D9' }
      }
    })

    const cellStyle = {
      font: { size: 10, name: 'Microsoft YaHei' },
      alignment: {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true
      },
      border: createBorders(false)
    }

    const centerCellStyle = {
      ...cellStyle,
      alignment: { ...cellStyle.alignment, horizontal: 'center' }
    }

    const stripeStyle = {
      ...cellStyle,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    }

    const stripeCenterStyle = {
      ...centerCellStyle,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    }

    const headerStyle = {
      font: {
        bold: true,
        size: 11,
        color: { argb: 'FFFFFFFF' },
        name: 'Microsoft YaHei'
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C3E50' }
      },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: createBorders(true)
    }

    // 主工作表
    const mainSheet = workbook.addWorksheet(`${projectName || '项目'}_审查报告`)
    mainSheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '风险等级', key: 'riskLevel', width: 15 },
      { header: '问题来源', key: 'category', width: 15 },
      { header: '审查内容', key: 'articleTitle', width: 40 },
      { header: '问题描述', key: 'description', width: 50 },
      { header: '处理建议', key: 'suggestion', width: 60 },
      { header: '相关规范', key: 'origin', width: 12 }
    ]

    dataToExport.forEach((item, index) => {
      const row = mainSheet.addRow({
        index: index + 1,
        riskLevel: getRiskText(item.risk_level),
        category: item.category,
        articleTitle: item.articleTitle,
        description: item.description,
        suggestion: item.suggestion,
        origin: item.origin
      })

      const isEvenRow = mainSheet.rowCount % 2 === 0
      const needCenterCols = [1, 2, 3, 7]

      row.eachCell((cell: any, colNumber: number) => {
        cell.style = isEvenRow
          ? needCenterCols.includes(colNumber)
            ? stripeCenterStyle
            : stripeStyle
          : needCenterCols.includes(colNumber)
            ? centerCellStyle
            : cellStyle
      })

      const descLines = (item.description.match(/\n/g) || []).length + 1
      const sugLines = (item.suggestion.match(/\n/g) || []).length + 1
      row.height = Math.max(
        18,
        Math.min(Math.max(descLines, sugLines) * 14, 80)
      )
    })

    mainSheet.getRow(1).eachCell((cell: any) => {
      cell.style = headerStyle
    })
    mainSheet.getRow(1).height = 25

    // 分表
    const riskLevels = [
      { level: 'high', name: '重大问题', color: 'FFDC3545' },
      { level: 'medium', name: '一般问题', color: 'FFD17706' },
      { level: 'low', name: '轻微问题', color: 'FF28A745' }
    ]

    for (const { level, name, color } of riskLevels) {
      const levelData = dataToExport.filter(item => item.risk_level === level)
      if (levelData.length > 0) {
        const sheet = workbook.addWorksheet(`${projectName || '项目'}_${name}`)
        sheet.columns = mainSheet.columns

        levelData.forEach((item, index) => {
          const row = sheet.addRow({
            index: index + 1,
            riskLevel: getRiskText(item.risk_level),
            category: item.category,
            articleTitle: item.articleTitle,
            description: item.description,
            suggestion: item.suggestion,
            origin: item.origin
          })

          const isEvenRow = sheet.rowCount % 2 === 0
          row.eachCell((cell: any, colNumber: number) => {
            cell.style = isEvenRow
              ? [1, 2, 3, 7].includes(colNumber)
                ? stripeCenterStyle
                : stripeStyle
              : [1, 2, 3, 7].includes(colNumber)
                ? centerCellStyle
                : cellStyle
          })
        })

        sheet.getRow(1).eachCell((cell: any) => {
          cell.style = {
            ...headerStyle,
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: color }
            }
          }
        })
        sheet.getRow(1).height = 25
      }
    }

    const timestamp = new Date()
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(/[/:]/g, '-')

    const fileName = `${projectName || '项目'}_审查报告_${timestamp}.xlsx`
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)

    loading.close()
    ElMessage.success({ message: `报告已导出：${fileName}`, duration: 3000 })
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}
