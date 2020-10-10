import smartsheet from 'smartsheet'
import { BaseConnector, Reshuffle } from 'reshuffle-base-connector'
import { SimpleSheet } from './SimpleSheet'

type Options = Record<string, any>

export class SmartsheetConnector extends BaseConnector {
  private client: any
  private opts: any

  constructor(app: Reshuffle, options: Options = {}, id?: string) {
    super(app, options, id)
    const accessToken = options.apiKey
    if (!/^[a-z0-9]{26}$/.test(accessToken)) {
      throw new Error(`Invalid API Key: ${accessToken}`)
    }
    this.client = smartsheet.createClient({ accessToken })
    this.opts = { queryParameters: { includeAll: true } }
  }

  private createSimpleSheet(sheet: any) {
    const columns = sheet.columns.map((c: any) => ({
      id: c.id,
      title: c.title,
    }))

    const rows = sheet.rows.map((r: any) => ({
      id: r.id,
      values: r.cells.map((c: any) =>
        c.displayValue === undefined ? c.value : c.displayValue
      ),
    })).filter((r: any) =>
      0 < r.values.filter((v: any) => v !== undefined).length
    )

    return new SimpleSheet(sheet.id, sheet.name, columns, rows)
  }

  // Actions ////////////////////////////////////////////////////////

  public async addRows(sheetId: any, rows: any[]) {
    validateId(sheetId)
    const res = await this.client.sheets.addRows({
      sheetId,
      body: rows,
      ...this.opts,
    })
    if (res.resultCode !== 0) {
      throw new Error(`Error adding rows to sheet ${sheetId}: ${
        res.resultCode} ${res.message}`)
    }
  }

  public async addRowToBottom(sheetId: any, cells: any[]) {
    await this.addRows(sheetId, [{ toBottom: true, cells }])
  }

  public async addRowToTop(sheetId: any, cells: any[]) {
    await this.addRows(sheetId, [{ toTop: true, cells }])
  }

  public async createSheet(name: string, columns: any[]) {
    validateSheetName(name)
    const res = await this.client.sheets.createSheet({
      body: { name, columns },
      ...this.opts,
    })
    if (res.resultCode !== 0) {
      throw new Error(`Error creating sheet ${name}: ${
        res.resultCode} ${res.message}`)
    }
    return res.result
  }

  public async deleteRow(sheetId: any, rowId: any) {
    validateId(sheetId)
    validateId(rowId)
    const res = await this.client.sheets.deleteRow({
      sheetId,
      rowId,
      ...this.opts,
    })
    if (res.resultCode !== 0) {
      throw new Error(`Error deleting row ${rowId} in sheet ${sheetId}: ${
        res.resultCode} ${res.message}`)
    }
  }

  public async findOrCreateSheet(name: string, columns: any[]) {
    const common = (sheet: any) => ({
      accessLevel: sheet.accessLevel,
      columns: sheet.columns,
      name: sheet.name,
      permalink: sheet.permalink,
      sheetId: sheet.id,
    })
    try {
      const sheet = await this.getSheetByName(name)
      return { created: false, ...common(sheet) }
    } catch {
      const sheet = await this.createSheet(name, columns)
      return { created: true, ...common(sheet) }
    }
  }

  public async getSheetById(sheetId: any) {
    validateId(sheetId)
    const sheet = await this.client.sheets.getSheet(
      { id: sheetId, ...this.opts }
    )
    return sheet
  }

  public async getSheetIdByName(name: string) {
    validateSheetName(name)
    const list = await this.client.sheets.listSheets(this.opts)
    const desc = list.data.find((d: any) => d.name === name)
    if (!desc) {
      throw new Error(`SmartSheet: Sheet not found: ${name}`)
    }
    return desc.id
  }

  public async getSheetByName(name: string) {
    validateSheetName(name)
    const id = await this.getSheetIdByName(name)
    return this.getSheetById(id)
  }

  public async getImage(
    sheetId: any,
    rowId: any,
    columnIdOrIndex: any,
    width?: number,
    height?: number,
  ) {
    const row = await this.getRow(sheetId, rowId)

    let index
    if (typeof columnIdOrIndex === 'number' && columnIdOrIndex < 1024) {
      index = columnIdOrIndex
    } else {
      validateId(columnIdOrIndex)
      index = row.cells.findIndex(
        (cell: any) => cell.columnId === columnIdOrIndex
      )
      if (index < 0) {
        throw new Error(`Column ID not found: ${columnIdOrIndex}`)
      }
    }

    const cell = row.cells[index]
    if (!cell.image) {
      throw new Error(`No image in row ${rowId} col ${cell.columnId}`)
    }

    const req: any = { imageId: cell.image.id }
    if (width !== undefined) {
      req.width = width
    }
    if (height !== undefined) {
      req.height = height
    }
    const res = await this.client.images.listImageUrls({
      body: [req],
    })

    return {
      id: cell.image.id,
      text: cell.image.altText,
      url: res.imageUrls[0].url,
    }
  }

  public async getSimpleSheetById(sheetId: any) {
    validateId(sheetId)
    const sheet = await this.getSheetById(sheetId)
    return this.createSimpleSheet(sheet)
  }

  public async getSimpleSheetByName(name: string) {
    validateSheetName(name)
    const sheet = await this.getSheetByName(name)
    return this.createSimpleSheet(sheet)
  }

  public async getRow(sheetId: any, rowId: any) {
    validateId(sheetId)
    validateId(rowId)
    return this.client.sheets.getRow({ sheetId, rowId, ...this.opts })
  }

  public async listRows(sheetId: any) {
    const sheet = await this.getSheetById(sheetId)
    return sheet.rows.map((row: any) => row.id)
  }

  public async listSheets() {
    const list = await this.client.sheets.listSheets(this.opts)
    return list.data
  }

  public async update(sheetId: any, rows: any[]) {
    validateId(sheetId)
    if (!Array.isArray(rows)) {
      throw new Error(`Invalid rows: ${rows}`)
    }
    if (0 < rows.length) {
      await this.client.sheets.updateRow(
        { sheetId, body: rows, ...this.opts }
      )
    }
  }

  // SDK ////////////////////////////////////////////////////////////

  public sdk() {
    return this.client
  }
}

function validateId(id: any) {
  if (typeof id === 'number' && 0 < id) {
    return
  }
  if (typeof id === 'string' && 0 < id.length) {
    return
  }
  throw new Error(`Invalid sheet id: ${id}`)
}

function validateSheetName(name: any) {
  if (typeof name === 'string' && 0 < name.length) {
    return
  }
  throw new Error(`Invalid sheet name: ${name}`)
}
