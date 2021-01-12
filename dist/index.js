const { QMainWindow, QWidget, QLabel, FlexLayout } = require("@nodegui/nodegui");
const bonjour = require('bonjour')()

const KeyLight = require('./keylight')


function createHeaderWidget() {
  const headerWidget = new QWidget()

  headerWidget.setObjectName('headerWidget')
  headerWidget.setLayout(new FlexLayout())

  // const headerTitle = new QLabel()
  // headerTitle.setObjectName('headerTitle')
  // headerTitle.setText('Keylight Control')
  // headerWidget.layout.addWidget(headerTitle)

  headerWidget.setStyleSheet(`
    #headerTitle {
      font-size: 14px;
      color: white;
    }

    #headerWidget {
      flex-direction: 'row';
      padding: 10px;
      align-items: 'center';
      justify-content: 'space-around';
      background-color: #525252;
    }
  `)

  return headerWidget
}


const main = async () => {
  const win = new QMainWindow()


  win.setWindowTitle('Keylight Control')
  win.setFixedSize(400, 200)
  win.setInlineStyle(`background-color: #414141;`)


  const view = new QWidget();
  view.setLayout(new FlexLayout());

  view.layout.addWidget(createHeaderWidget())

  const lightFinder = bonjour.find({ type: 'elg' })


  lightFinder.on('up', light => {
    var keyLight = new KeyLight(light.referer.address, light.name)
    view.layout.addWidget(keyLight.widget)
  })



  win.setCentralWidget(view);
  win.show()

  global.win = win
}

main().catch(console.error)
