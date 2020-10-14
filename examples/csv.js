const { Reshuffle } = require('reshuffle')
const { SmartsheetConnector } = require('reshuffle-smartsheet-connector')

async function main() {
  const app = new Reshuffle()
  const ssh = new SmartsheetConnector(app, {
    apiKey: process.env.SMARTSHEET_API_KEY,
  })

  const list = await ssh.listSheets()
  if (list.length === 0) {
    console.log('No sheets')
    return
  }

  const sis = await ssh.getSimpleSheetById(list[0].id)
  console.log(sis.toCSV())
}

main()
