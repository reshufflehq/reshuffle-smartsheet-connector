# SmartSheet Connector

This package contains a [Resshufle](https://github.com/reshufflehq/reshuffle)
connector to access to online spreadsheets at
[smartsheet.com](https://smartsheet.com).

All actions throw in case of an error.

_Actions_:

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

_SDK_:

[sdk](#sdk) Get direct SDK access

## Construction

```js
const app = new Reshuffle()
const smartsheetConnector = new SmaetsheetConnector(app, {
  apiKey: process.env.SMARTSHEET_API_KEY,
})
```

## Action Details

### <a name="addRows"></a>Add Rows action

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

Add rows to a sheet.

### <a name="addRowToBottom"></a>Add Row To Bottom action

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

Add one row after the last row of a sheet.

### <a name="addRowToTop"></a>Add Row To Top action

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

Add one row before the first row of a sheet.

### <a name="createSheet"></a>Create Sheet action

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
Create a new sheet.

### <a name="deleteRow"></a>Delete Row action

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
Delete a single row from the specified sheet.

### <a name="findOrCreateSheet"></a>Find Or Create Sheet action

_Definition:_

```ts
(
  sheetId: number | string,
  rowId: number | string,
) => { created: boolean, sheetId: number, columns: object[] }
```

_Usage:_

```js
await smartsheetConnector.findOrCreateSheet('My Sheet', [
  { title: 'Name', type: 'TEXT_NUMBER', primary: true },
  { title: 'City', type: 'TEXT_NUMBER' },
])
```

This action offers the same interface as [createSheet](#createSheet) above,
but checks first whether a sheet with the specified `name` exists. If so,
that sheet is returned. Otherwise, a new one is created.

### <a name="getImage"></a>Get Image action

_Definition:_

```ts
(
  sheetId: number | string,
  rowId: number | string,
  columnIdOrIndex: number | string,
  width?: number, // optional
  height?: number, // optional
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

Get an image stored in a sheet cell. `sheetId` and `rowId` specify the
specific row to query. `columnIdOrIndex` is treated as an index if it is
a number smaller than 1024, otherwise it is treated as a column id.

The returned image include a unique ID, the alternative text (uaully the
original file name) and a download URL. The URL is valid for half an hour.

Use the optional `width` and `height` arguments to get a link to a resized
image.

### <a name="getSheetById"></a>Get Sheet By ID action

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

Get full
[sheet data](https://smartsheet-platform.github.io/api-docs/?javascript#get-sheet)
for the sheet with the specified `id`.

### <a name="getSheetIdByName"></a>Get Sheet ID By Name action

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

Get a sheet ID number for the sheet with the specified name. If a sheet
with that name is not found then an Error is thrown.

### <a name="getSheetByName"></a>Get Sheet By Name action

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

Get full
[sheet data](https://smartsheet-platform.github.io/api-docs/?javascript#get-sheet)
for the sheet with the specified `name`. If a sheet with that name is not
found then an Error is thrown.

### <a name="getSimpleSheetById"></a>Get Simple Sheet By ID action

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

Get a `SimpleSheet` object to representing the sheet with the specified
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

### <a name="getSimpleSheetByName"></a>Get Simple Sheet By Name action

_Definition:_

```ts
(
  name: string,
) => object
```

Get a `SimpleSheet` object representing the sheet the the specified
`name`. See [getSimpleSheetById](#getSimpleSheetById) for details.

### <a name="getRow"></a>Get Row action

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

Get information about the specified row in the specified sheet. Row
information is detailed [here](https://smartsheet-platform.github.io/api-docs/#get-row).

### <a name="listRows"></a>List Rows action

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

Get a list of row IDs in the specified sheet.

### <a name="listSheets"></a>List Sheets action

_Definition:_

```ts
() => object[]
```

_Usage:_

```js
const sheets = await smartsheetConnector.listSheets()
```

Get a list of all sheets in the connected Smartsheet account. For each sheet,
the following information is returned:

* *id* - Sheet ID
* *name* - Sheet name
* *accessLevel* - Usually 'OWNER'
* *permalink* - Link to sheet online page
* *createdAt* - Cretion time stamp
* *modifiedAt* - Modification time stamp

### <a name="update"></a>Update action

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

Update the data in a sheet. The update object uses the format defined
[here](https://smartsheet-platform.github.io/api-docs/?javascript#update-rows)
. You can use the [Simple Sheet objet](#getSimpleSheetByName) to create
an updater object that will construct the rows array.

## SDK Details

### <a name="sdk"></a>SDK action

_Definition:_

```ts
() => object
```

_Usage:_

```js
const client = await smartsheetConnector.sdk()
```

Get the underlying SDK object.
