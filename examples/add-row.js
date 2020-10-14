const { Reshuffle } = require('reshuffle')
const { SmartsheetConnector } = require('reshuffle-smartsheet-connector')

const NAMES = [
  'Bruce Banner',
  'Carol Danvers',
  'Natasha Romanoff',
  'Peter Quill',
  'Steve Rogers',
  'Tony Stark',
]

const CITIES = [ 'Asgard', 'Malibu', 'New York' ]

const oneOf = (array) => array[Math.round(Math.random() * (array.length - 1))]

async function main() {
  const app = new Reshuffle()
  const ssh = new SmartsheetConnector(app, {
    apiKey: process.env.SMARTSHEET_API_KEY,
  })

  const sheet = await ssh.findOrCreateSheet('Reshuffle Add Row Example', [
    { title: 'Name', type: 'TEXT_NUMBER', primary: true },
    { title: 'City', type: 'TEXT_NUMBER' },
  ])

  await ssh.addRowToBottom(sheet.sheetId, [
    { columnId: sheet.columns[0].id, value: oneOf(NAMES) },
    { columnId: sheet.columns[1].id, value: oneOf(CITIES) },
  ])
}

;(async () => {
  try {
    await main()
  } catch (e) {
    console.error('Unhandled exception:')
    console.error(e)
  }
})()
