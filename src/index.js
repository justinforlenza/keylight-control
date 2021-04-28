const { resolve } = require('path')

const { QMainWindow, QWidget, QApplication, FlexLayout, QIcon, QSystemTrayIcon, QMenu, QAction, WindowType, QSystemTrayIconActivationReason, QScrollArea, QPushButton, ButtonRole, QMessageBox } = require("@nodegui/nodegui");

const bonjour = require('bonjour')()
const axios = require('axios').default
const open = require('open')

const KeyLight = require('./keylight')


const version = require('../package.json').version;

const appIcon = new QIcon(resolve(__dirname, 'assets/app_icon.png'))

var keyLights = []


function checkVersion() {
  axios.get('https://api.github.com/repos/justinforlenza/keylight-control/releases/latest').then(response => {
    const latestVersion = response.data.tag_name.replace('v', '').split('.')
    const currentVersion = version.split('.')

    for(let [value, index] of currentVersion.entries())  {
      if (value < latestVersion[index]) {
        const messageBox = new QMessageBox()

        messageBox.setWindowTitle('Software Update')

        messageBox.setWindowIcon(appIcon)

        messageBox.setText('A new version of Keylight Controller is avaliable!')
        messageBox.setInformativeText(`Key Controller ${response.data.tag_name.replace('v', '')} is now avaliable—you have ${version.replace('v')}. Would you like to download it now?`)
        

        const downloadButton = new QPushButton()
        downloadButton.setText('Download Now')
        downloadButton.addEventListener('clicked', () => {
          open('https://github.com/justinforlenza/keylight-control/releases/latest')
        })

        messageBox.addButton(downloadButton, ButtonRole.AcceptRole)

        const cancelButton = new QPushButton()
        cancelButton.setText('Remind me Later')
        
        messageBox.addButton(cancelButton, ButtonRole.RejectRole)

        messageBox.exec()
        break;
      }
    }
  }).catch()
}


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
    If tray icon is double clicked open the application-
    `
    if (process.platform === 'linux' || activationReason === QSystemTrayIconActivationReason.DoubleClick) {
      keyLights.forEach(keyLight => keyLight.getLightInfo())
      if (global.win.isVisible()) {
        global.win.activateWindow()
      } else {
        global.win.show()
      }
    }
  })

  tray.setContextMenu(menu)

  const infoAction = new QAction()
  infoAction.setText(`Keylight Controller v${version}`)

  infoAction.setEnabled(false)
  
  menu.addAction(infoAction)

  const seperator = new QAction()
  seperator.setSeparator(true)

  menu.addAction(seperator)

  const toggleAction = new QAction()
  toggleAction.setText('Show Window')

  toggleAction.addEventListener('triggered', () => {
    if (global.win.isVisible()) {
      global.win.activateWindow()
    } else {
      global.win.show()
    }
  })

  menu.addAction(toggleAction)

  const quitAction = new QAction()
  quitAction.setText('Quit')

  quitAction.addEventListener('triggered', () => {
    process.exit(22)
  })
  
  menu.addAction(quitAction)


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
  win.setWindowIcon(appIcon)

  // win.show()

  global.win = win
}


function main() {
  global.app = QApplication.instance()
  global.app.setQuitOnLastWindowClosed(false)

  checkVersion()

  createTrayIcon()
  createMainWindow()
}


main()
