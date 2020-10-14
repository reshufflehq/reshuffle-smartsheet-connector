const { Reshuffle } = require('reshuffle')
const { SmartsheetConnector } = require('reshuffle-smartsheet-connector')

async function main() {
  const app = new Reshuffle()
  const ssh = new SmartsheetConnector(app, {
    apiKey: process.env.SMARTSHEET_API_KEY,
    baseURL: process.env.RESHUFFLE_RUNTIME_BASE_URL,
  })

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

  ssh.on({ sheetId: sheet.sheetId }, async (event) => {
    console.log('Smartsheet event:', event)
  })

  app.start(8000)
}

;(async () => {
  try {
    await main()
  } catch (e) {
    console.error('Unhandled exception:')
    console.error(e)
  }
})()
