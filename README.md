# reshuffle-smartsheet-connector

[Code](https://github.com/reshufflehq/reshuffle-smartsheet-connector) |
[npm](https://www.npmjs.com/package/reshuffle-smartsheet-connector) |
[Code sample](https://github.com/reshufflehq/reshuffle-smartsheet-connector/tree/master/examples)

`npm install reshuffle-smartsheet-connector`

### Reshuffle Smartsheet Connector

This package contains a [Reshuffle](https://reshuffle.com)
connector to access to online spreadsheets at
[smartsheet.com](https://smartsheet.com).

The following example tracks changes to an online spreadtsheet. Changes are
reported at the sheet level, row level and cell level:

```js
const { Reshuffle } = require('reshuffle')
const { SmartsheetConnector } = require('reshuffle-smartsheet-connector')

const app = new Reshuffle()

const ssh = new SmartsheetConnector(app, {
  apiKey: process.env.SMARTSHEET_API_KEY,
  baseURL: process.env.RESHUFFLE_RUNTIME_BASE_URL,
})

ssh.on({ sheetId: sheet.sheetId }, async (event) => {
  console.log('Smartsheet event:', event)
})

async function main() {

  const sheet = await ssh.findOrCreateSheet('Reshuffle Events Example', [
    { title: 'Name', type: 'TEXT_NUMBER', primary: true },
    { title: 'Quest', type: 'TEXT_NUMBER' },
    { title: 'Color', type: 'TEXT_NUMBER' },
  ])

  if (sheet.created) {
    await ssh.addRowToBottom(sheet.sheetId, [
      { columnId: sheet.columns[0].id, value: 'Arthur' },
      { columnId: sheet.columns[1].id, value: 'Find the Holy Grail' },
      { columnId: sheet.columns[2].id, value: 'Blue' },
    ])
  }

  console.log(`Please visit ${sheet.permalink} and make some changes`)
}

app.start()
main().catch(console.error)
```

### Table of Contents

[Configuration](#configuration) Configuration options

#### Connector events

[sheetChanged](#sheetChanged) Sheet changed

#### Connector actions

[addRows](#addRows) Add rows to a sheet

[addRowToBottom](#addRowToBottom) Add one row at the bottom of a sheet

[addRowToTop](#addRowToTop) Add one row at the top of a sheet

[createSheet](#createSheet) Create a new sheet

[deleteRow](#deleteRow) Delete one row

[findOrCreateSheet](#findOrCreateSheet) Find or create a sheet

[getImage](#getImage) Get image from a sheet cell

[getSheetById](#getSheetById) Get sheet data by sheet id

[getSheetIdByName](#getSheetIdByName) Find sheet id by its name

[getSheetByName](#getSheetByName) Get sheet data by sheet name

[getSimpleSheetById](#getSimpleSheetById) Get a simple sheet object by ID

[getSimpleSheetByName](#getSimpleSheetByName) Get a simple sheet object by name

[getRow](#getRow) Get row information

[listSheets](#listSheets) List all sheets

[listRows](#listRows) List rows in a sheet

[update](#update) Update a sheet

[sdk](#sdk) Get direct SDK access

### <a name="configuration"></a>Configuration options

```js
const app = new Reshuffle()
const smartsheetConnector = new SmaetsheetConnector(app, {
  apiKey: process.env.SMARTSHEET_API_KEY,
  baseURL: process.env.RESHUFFLE_RUNTIME_BASE_URL, // optional but required
                                                   // for events
})
```

### Connector events

#### <a name="sheetChanged"></a> Sheet Changed event

_Example:_

```js
async (event) => {
  console.log('Smartsheet event:', event)
})
```

This event is fired when a Smartsheet webhook is triggered. Triggers include
sheet update, row update, cell update and more.

See
[event.js](https://github.com/reshufflehq/reshuffle-smartsheet-connector/examples/events.js)
for an example of defining and handling sheet events.

### Connector actions

#### <a name="addRows"></a> Add Rows action

Add rows to a sheet.

_Definition:_

```ts
(
  sheetId: number | string,
  rows: object,
) => void
```

_Usage:_

```js
await smartsheetConnector.addRows(4583173393803140, [
  {
    toTop: true,
    cells: [
      {
        columnId: 7960873114331012,
        value: true,
      },
      {
        columnId: 642523719853956,
        value: 'New status',
        strict: false,
      },
    ],
  },
  {
    toBottom: true,
    cells: [
      {
        columnId: 7960873114331012,
        value: true,
      },
      {
        columnId: 642523719853956,
        value: 'New status',
        strict: false,
      },
    ],
  },
])
```

#### <a name="addRowToBottom"></a> Add Row To Bottom action

Add one row after the last row of a sheet.

_Definition:_

```ts
(
  sheetId: number | string,
  cells: object[],
) => void
```

_Usage:_

```js
await smartsheetConnector.addRowToBottom(4583173393803140, {
  { columnId: 7960873114331012, value: true },
  { columnId: 642523719853956, value: 'New status' }
})
```

#### <a name="addRowToTop"></a> Add Row To Top action

Add one row before the first row of a sheet.

_Definition:_

```ts
(
  sheetId: number | string,
  cells: object[],
) => void
```

_Usage:_

```js
await smartsheetConnector.addRowToTop(4583173393803140, {
  { columnId: 7960873114331012, value: true },
  { columnId: 642523719853956, value: 'New status' }
})
```

#### <a name="createSheet"></a> Create Sheet action

Create a new sheet.

_Definition:_

```ts
(
  name: string,
  columns: object[]
) => object
```

_Usage:_

```js
await smartsheetConnector.createSheet('My Sheet', [
  { title: 'Name', type: 'TEXT_NUMBER', primary: true },
  { title: 'City', type: 'TEXT_NUMBER' },
])
```

#### <a name="deleteRow"></a> Delete Row action

Delete a single row from the specified sheet.

_Definition:_

```ts
(
  sheetId: number | string,
  rowId: number | string,
) => void
```

_Usage:_

```js
await smartsheetConnector.deleteRow(4583173393803140, 1234567890123456)
```

#### <a name="findOrCreateSheet"></a> Find Or Create Sheet action

This action offers the same interface as [createSheet](#createSheet) above,
but checks first whether a sheet with the specified `name` exists. If so,
that sheet is returned. Otherwise, a new one is created.

The action returns an object with the following fields:

```ts
  accessLevel: string
  columns: object[]
  created: boolean
  name: string
  permalink: string
  sheetId: number
```

_Definition:_

```ts
(
  sheetId: number | string,
  rowId: number | string,
) => object
```

_Usage:_

```js
await smartsheetConnector.findOrCreateSheet('My Sheet', [
  { title: 'Name', type: 'TEXT_NUMBER', primary: true },
  { title: 'City', type: 'TEXT_NUMBER' },
])
```

#### <a name="getImage"></a> Get Image action

Get an image stored in a sheet cell. `sheetId` and `rowId` specify the
specific row to query. `columnIdOrIndex` is treated as an index if it is
a number smaller than 1024, otherwise it is treated as a column id.

The returned image data includes a unique ID, the alternative text (usually the
original file name) and a download URL. The URL is valid for half an hour.

Use the optional `width` and `height` arguments to get a link to a resized
image.

_Definition:_

```ts
(
  sheetId: number | string,
  rowId: number | string,
  columnIdOrIndex: number | string,
  width?: number,
  height?: number,
) => object
```

_Usage:_

```js
const img = await smartsheetConnector.getImage(
  4583173393803140,
  000000000000000,
  3,
)
console.log(img.id, img.text, img.url)
```

#### <a name="getSheetById"></a> Get Sheet By ID action

Get full [sheet data](https://smartsheet-platform.github.io/api-docs/?javascript#get-sheet)
for the sheet with the specified `id`.

_Definition:_

```ts
(
  sheetId: number | string,
) => object
```

_Usage:_

```js
const sheetData = await smartsheetConnector.getSheetById(4583173393803140)
```

#### <a name="getSheetIdByName"></a> Get Sheet ID By Name action

Lookup the sheet ID for the sheet with the specified name. If a sheet
with that name is not found then an Error is thrown.

_Definition:_

```ts
(
  name: string,
) => number
```

_Usage:_

```js
const sheetId = await smartsheetConnector.getSheetIdByName('My Sheet')
```

#### <a name="getSheetByName"></a> Get Sheet By Name action

Get full [sheet data](https://smartsheet-platform.github.io/api-docs/?javascript#get-sheet)
for the sheet with the specified `name`. If a sheet with that name is not
found then an Error is thrown.

_Definition:_

```ts
(
  name: string,
) => object
```

_Usage:_

```js
const sheetData = await smartsheetConnector.getSheetByName('My Sheet')
```

#### <a name="getSimpleSheetById"></a>Get Simple Sheet By ID action

Get a `SimpleSheet` object representing the sheet with the specified
`id`. This object provides the following methods:

```ts
getColumnIdByTitle(
  columnTitle: string,
): number // Get column ID by column title
getUpdater(): object // Create an updater object
pivot(
  pivotColumn: string,
  property: string,
  matchColumns: string[],
  includeRowIDs?: boolean,
): object // Build a pivot table
toSCV(): string // Create a CSV representation
```

An updater object provides the following methods:

```ts
addUpdate(
  columnTitle: string,
  rowId: number | string,
  value: string,
) // Add a cell value to be updated
getSheetId(): number // Get the sheet ID
getUpdates(): object // Get the updates for using with the update action
```

_Definition:_

```ts
(
  sheetId: number | string,
) => object
```

_Usage:_

```js
const sheet = await smartsheetConnector.getSimpleSheetById(4583173393803140)
const updater = sheet.getUpdater()
updater.addUpdate('My Column', 000000000000000, 'New Value')
await smartsheetConnector.update(updater.getSheetId(), updater.getUpdates())
```

#### <a name="getSimpleSheetByName"></a> Get Simple Sheet By Name action

Get a `SimpleSheet` object representing the sheet with the specified
`name`. See [getSimpleSheetById](#getSimpleSheetById) for details.

_Definition:_

```ts
(
  name: string,
) => object
```

#### <a name="getRow"></a> Get Row action

Get information about the specified row in the specified sheet. Row
information is detailed [here](https://smartsheet-platform.github.io/api-docs/#get-row).

_Definition:_

```ts
(
  sheetId: number | string,
  rowId: number | string,
) => object
```

_Usage:_

```js
const row = await smartsheetConnector.getRow(
  4583173393803140,
  1234567890123456,
)
```

#### <a name="listRows"></a> List Rows action

Get a list of row Ids in the specified sheet.

_Definition:_

```ts
(
  sheetId: number | string,
) => number[]
```

_Usage:_

```js
const rowIds = await smartsheetConnector.listRows(4583173393803140)
```

#### <a name="listSheets"></a> List Sheets action

Get a list of all sheets in the connected Smartsheet account. For each sheet,
the following information is returned:

* *id* - Sheet ID
* *name* - Sheet name
* *accessLevel* - Usually 'OWNER'
* *permalink* - Link to the sheet's online page
* *createdAt* - Creation time stamp
* *modifiedAt* - Modification time stamp

_Definition:_

```ts
() => object[]
```

_Usage:_

```js
const sheets = await smartsheetConnector.listSheets()
```

#### <a name="update"></a> Update action

Update the data in a sheet. The update object uses the format defined
[here](https://smartsheet-platform.github.io/api-docs/?javascript#update-rows). 
You can use the [Simple Sheet object](#getSimpleSheetByName) to create
an updater object that will construct the rows array.

_Definition:_

```ts
(
  sheetId: number | string,
  rows: object[],
) => void
```

_Usage:_

```js
await smartsheetConnector.update(
  4583173393803140,
  [
    {
      id: '0000000000000000',
      cells: [
        {
          columnId: '0000000000000000',
          value: 'My Value',
        },
      ],
    },
  ],
)
```

#### <a name="sdk"></a> sdk action

Get the underlying SDK object.

_Definition:_

```ts
() => object
```

_Usage:_

```js
const client = await smartsheetConnector.sdk()
```
