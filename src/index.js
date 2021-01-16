const { QMainWindow, QWidget, QApplication, FlexLayout, QIcon, QSystemTrayIcon, QMenu, QAction, WindowType, QSystemTrayIconActivationReason, QScrollArea, QGridLayout } = require("@nodegui/nodegui");
const bonjour = require('bonjour')()
const resolve = require('path').resolve

const version = require('../package.json').version

const KeyLight = require('./keylight')

var keyLights = []


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

function createTrayIcon() {
  `
  Create and Configure  System Tray Icon
  `
  const icon = new QIcon(resolve(__dirname, 'assets/bulb.png'))
  icon.setIsMask(true)
  const tray = new QSystemTrayIcon()
  const menu = new QMenu()

  tray.setIcon(icon)

  tray.addEventListener('activated', (activationReason) => {
    `
    If tray icon is double clicked open the application
    `
    if (process.platform === 'linux') {
      global.win.show()
      keyLights.forEach(keyLight => keyLight.getLightInfo())
    } else if (activationReason === QSystemTrayIconActivationReason.DoubleClick) {
      global.win.show()
      keyLights.forEach(keyLight => keyLight.getLightInfo())
    }
  })

  tray.setContextMenu(menu)

  const quitAction = new QAction()
  quitAction.setText('Quit')

  quitAction.addEventListener('triggered', () => {
    process.exit(22)
  })
  
  menu.addAction(quitAction)

  const toggleAction = new QAction()
  toggleAction.setText('Show/Hide')

  toggleAction.addEventListener('triggered', () => {
    if (global.win.isVisible()) {
      global.win.hide();
    } else {
      global.win.show();
      keyLights.forEach(keyLight => keyLight.getLightInfo())
    }
  })

  menu.addAction(toggleAction)

  tray.show()
  
  global.tray = tray
}


function createMainWindow () {
  const win = new QMainWindow()


  win.setWindowTitle('Keylight Control')
  win.setFixedSize(400, 200)
  win.setInlineStyle(`background-image: url(${resolve(__dirname, 'assets/bg.png')});`)

  const scrollArea = new QScrollArea()
  scrollArea.setInlineStyle('flex: 1;')
  scrollArea.setInlineStyle('background-color: rgba(0,0,0,0);')

  const view = new QWidget();
  view.setLayout(new FlexLayout());
  view.setInlineStyle(`align-content: stretch; flex-direction: column; background-color: rgba(0,0,0,0);`)

  // view.layout.addWidget(createHeaderWidget())

  const lightFinder = bonjour.find({ type: 'elg' })

  lightFinder.on('up', light => {
    var keyLight = new KeyLight(light.referer.address, light.name)
    view.layout.addWidget(keyLight.widget)
    keyLights.push(keyLight)
  })

  scrollArea.setWidget(view)

  win.setCentralWidget(scrollArea)

  win.setWindowFlag(WindowType.WindowMinimizeButtonHint, false)

  // win.show()

  global.win = win
}


function main() {
  global.app = QApplication.instance()
  global.app.setQuitOnLastWindowClosed(false)

  createTrayIcon()
  createMainWindow()
}


main()
