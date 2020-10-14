import smartsheet from 'smartsheet'
import { Request, Response, NextFunction } from 'express'
import { SimpleSheet } from './SimpleSheet'
import {
  CoreConnector,
  CoreEventHandler,
  Options,
  Reshuffle,
} from './CoreConnector'

type SheetIdType = number | string

interface EventOptions {
  sheetId: SheetIdType
}

const CALLBACK_PATH = '/reshuffle-smartsheet-connector'
const URLRE = /^https?:\/\/[a-zA-Z0-9_\-\.]+(\/[a-zA-Z0-9_\-\.]+)*\/?$/

export class SmartsheetConnector extends CoreConnector {
  private apiKey: string
  private client: any
  private opts: any
  private baseURL?: string
  private newWebhooks: Record<string, boolean> = {}
  private liveWebhooks: Record<string, boolean> = {}

  constructor(app: Reshuffle, options: Options, id?: string) {
    super(app, options, id)

    this.apiKey = options.apiKey || ''
    if (!/^[a-z0-9]{26}$/.test(this.apiKey)) {
      throw new Error(`Invalid API Key: ${this.apiKey}`)
    }
    this.client = smartsheet.createClient({ accessToken: this.apiKey })
    this.opts = { queryParameters: { includeAll: true } }

    if (options.baseURL !== undefined && !URLRE.test(options.baseURL)) {
      throw new Error(`Invalid base URL: ${options.baseURL}`)
    }
    if (options.baseURL) {
      this.baseURL = options.baseURL
      app.registerHTTPDelegate(CALLBACK_PATH, this)
    }
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

  // Events /////////////////////////////////////////////////////////

  public on(
    options: EventOptions,
    handler: CoreEventHandler,
    eventId?: string,
  ) {
    validateId(options.sheetId)
    if (!this.baseURL) {
      throw new Error('Unable to setup event: baseURL not set')
    }
    const sid = parseInt(options.sheetId as string, 10)
    this.setupEvent(sid).catch(console.error)
    const eid = eventId || { apiKey: this.apiKey, sheetId: sid }
    return this.eventManager.addEvent(options, handler, eid)
  }

  private async setupEvent(sheetId: number) {
    const list = await this.client.webhooks.listWebhooks(this.opts)
    let wh = list.data.find((w: any) => w.scopeObjectId === sheetId)
    if (!wh) {
      wh = await this.createWebhook(sheetId)
    }
    if (wh.status === 'NEW_NOT_VERIFIED') {
      this.newWebhooks[wh.id] = true
      wh = await this.updateWebhook(wh.id, true)
      delete this.newWebhooks[wh.id]
    }
    if (wh.status !== 'ENABLED') {
      await this.client.webhooks.deleteWebhook({ webhookId: wh.id })
      throw new Error(`Unable to enable webhook for sheet: ${sheetId}`)
    }
    this.liveWebhooks[wh.id] = true
  }

  private async createWebhook(sheetId: SheetIdType) {
    const res = await this.client.webhooks.createWebhook({
      body: {
        name: `reshuffle-${sheetId}`,
        callbackUrl: `${this.baseURL!}${CALLBACK_PATH}`,
        scope: 'sheet',
        scopeObjectId: sheetId,
        events: ['*.*'],
        version: 1,
      },
      ...this.opts,
    })
    if (res.resultCode !== 0) {
      throw new Error(`Unable to create webhook for sheet: ${sheetId}: ${
        res.resultCode} ${res.message}`)
    }
    return res.result
  }

  private async updateWebhook(webhookId: string, enabled: boolean) {
    const res = await this.client.webhooks.updateWebhook({
      webhookId,
      body: { enabled },
    })
    if (res.resultCode !== 0) {
      throw new Error(`Unable to update webhook: ${webhookId}: ${
        res.resultCode} ${res.message}`)
    }
    return res.result
  }

  public async handle(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'POST' && req.path === CALLBACK_PATH) {
      const webhookId = String(req.body.webhookId)
      if (this.newWebhooks[webhookId] && req.body.challenge) {
        res.json({ webhookId, smartsheetHookResponse: req.body.challenge })
      } else if (this.started && this.liveWebhooks[webhookId]) {
        this.eventManager.fire(
          (ec) => ec.options.sheetId === req.body.scopeObjectId,
          req.body.events,
        ).catch(console.error)
        res.send('')
      }
    }
    next()
    return true
  }

  // Actions ////////////////////////////////////////////////////////

  public async addRows(sheetId: SheetIdType, rows: any[]) {
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

  public async addRowToBottom(sheetId: SheetIdType, cells: any[]) {
    await this.addRows(sheetId, [{ toBottom: true, cells }])
  }

  public async addRowToTop(sheetId: SheetIdType, cells: any[]) {
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

  public async deleteRow(sheetId: SheetIdType, rowId: any) {
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

  public async getSheetById(sheetId: SheetIdType) {
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
    sheetId: SheetIdType,
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

  public async getSimpleSheetById(sheetId: SheetIdType) {
    validateId(sheetId)
    const sheet = await this.getSheetById(sheetId)
    return this.createSimpleSheet(sheet)
  }

  public async getSimpleSheetByName(name: string) {
    validateSheetName(name)
    const sheet = await this.getSheetByName(name)
    return this.createSimpleSheet(sheet)
  }

  public async getRow(sheetId: SheetIdType, rowId: any) {
    validateId(sheetId)
    validateId(rowId)
    return this.client.sheets.getRow({ sheetId, rowId, ...this.opts })
  }

  public async listRows(sheetId: SheetIdType) {
    const sheet = await this.getSheetById(sheetId)
    return sheet.rows.map((row: any) => row.id)
  }

  public async listSheets() {
    const list = await this.client.sheets.listSheets(this.opts)
    return list.data
  }

  public async update(sheetId: SheetIdType, rows: any[]) {
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

function validateId(id: SheetIdType) {
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
