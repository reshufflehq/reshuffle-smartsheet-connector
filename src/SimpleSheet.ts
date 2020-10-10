export interface SimpleColumn {
  id: string
  title: string
}

export interface SimpleRow {
  id: string
  values: string[]
}

export class SimpleSheetUpdater {
  private updates: any = {}

  constructor(private simpleSheet: any) {
  }

  public addUpdate(columnTitle: string, rowid: number, value: string) {
    const colid = this.simpleSheet.getColumnIdByTitle(columnTitle)
    if (!this.updates[rowid]) {
      this.updates[rowid] = {}
    }
    this.updates[rowid][colid] = value
  }

  public getSheetId() {
    return this.simpleSheet.sheetId
  }

  public getUpdates() {
    return Object.entries(this.updates).map(([id, row]) => ({
      id,
      cells: Object.entries(row as any).map(([columnId, value]) => ({
        columnId,
        value,
      })),
    }))
  }
}

export class SimpleSheet {
  constructor(
    public sheetId: string,
    public name: string,
    public columns: SimpleColumn[],
    public rows: SimpleRow[],
  ) {
  }

  private findColumnIndexByTitle(columnTitle: string) {
    const index = this.columns.findIndex((c) => c.title === columnTitle)
    if (index < 0) {
      throw new Error(`SimpleSheet: Invalid column: ${columnTitle}`)
    }
    return index
  }

  public getColumnIdByTitle(columnTitle: string) {
    const index = this.findColumnIndexByTitle(columnTitle)
    return this.columns[index].id
  }

  public getUpdater() {
    return new SimpleSheetUpdater(this)
  }

  public pivot(
    pivotColumn: string,
    property: string,
    matchColumns?: string[],
    includeRowIDs?: boolean,
  ) {
    const pivotIndex = this.findColumnIndexByTitle(pivotColumn)
    const matchIndices = (matchColumns || []).map(
      (columnTitle) => this.findColumnIndexByTitle(columnTitle)
    )

    const data: any = {}

    for (const { id, values } of this.rows) {

      const key = values[pivotIndex]
      if (key === undefined) {
        throw new Error(
          `SimpleSheet: Undefined pivot value in row: ${id}`
        )
      }

      if (data[key] === undefined) {
        data[key] = {
          [pivotColumn]: key,
          [property]: [],
        }
        for (const mi of matchIndices) {
          data[key][this.columns[mi].title] = values[mi]
        }
      }

      const entry: any = {}
      outer:
      for (let i = 0; i < this.columns.length; i++) {
        if (i === pivotIndex) {
          continue
        }

        for (const mi of matchIndices) {
          if (i === mi) {
            if (data[key][this.columns[mi].title] === undefined) {
              data[key][this.columns[mi].title] = values[mi]
            } else if (values[mi] &&
              data[key][this.columns[mi].title] !== values[mi]) {
              throw new Error(
                `SimpleSheet: Pivot match column mismatch for ${
                  this.columns[mi].title}: ${
                  data[key][this.columns[mi].title]} !== ${values[mi]}`
              )
            }
            continue outer
          }
        }

        entry[this.columns[i].title] = values[i]
      }

      if (includeRowIDs) {
        entry.$rowid = id
      }

      data[key][property].push(entry)
    }

    return data
  }

  public toCSV() {
    const lines = [this.columns.map((c) => c.title).join(',')]
    for (const row of this.rows) {
      lines.push(row.values.join(','))
    }
    return lines.join('\n')
  }
}
