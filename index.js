const { QMainWindow, QLabel } = require("@nodegui/nodegui");
const {ElgatoLightAPI} = require('elgato-light-api')

const lightApi = new ElgatoLightAPI();





const main = async () => {
  const win = new QMainWindow()


  win.setWindowTitle('Keylight Control')
  win.setFixedSize(350, 200)
  win.setInlineStyle('background-color: #1a1a2e;')


  lightApi.on('newLight', newLight => {
    console.log(newLight);
  })

  win.show()

  global.win = win
}

main().catch(console.error)
