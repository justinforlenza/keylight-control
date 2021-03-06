const { resolve } = require('path')

const { QWidget, QLabel, QPushButton, QSlider, QIcon, QSize, QGridLayout, CursorShape } = require("@nodegui/nodegui")

const debounce = require('lodash/debounce')
const axios = require('axios').default
const chroma = require('chroma-js')


const powerOnIcon = new QIcon(resolve(__dirname, 'assets/power_on.png'))
const powerOffIcon = new QIcon(resolve(__dirname, 'assets/power_off.png'))

const brightnessScale = chroma.scale(['#000000', '#ffffff'])


function toKelvin(value) {
  // Rough equation to get Kelvin value from elgato keylight value for temperature
  return Math.round(((-4100*value) / 201) + 1993300/201)
}



class KeyLight {
  constructor(ip, name) {
    this.ip = ip
    this.name = name
    this.slug = this.name.replace(/ /g, '-')
    this._createMainWidget()
    this.getLightInfo()
  }

  getLightInfo() {
    axios.get(`http://${this.ip}:9123/elgato/lights`).then(response => {
      this.on = response.data.lights[0].on
      this._powerButton.setChecked(this.on)
      this._powerButton.setIcon(this.on ? powerOnIcon : powerOffIcon)
      this.brightness = response.data.lights[0].brightness
      this._brightnessSlider.setSliderPosition(this.brightness)
      this.temperature = response.data.lights[0].temperature
      this._temperatureSlider.setSliderPosition(this.temperature)
    })
  }

  updateLight(temperature, on, brightness) {
    axios.put(`http://${this.ip}:9123/elgato/lights`, {
      numberOfLights: 1,
      lights: [
        {
          on: on !== null ? on : this.on,
          brightness: brightness !== null ? brightness : this.brightness,
          temperature: temperature !== null ? temperature : this.temperature
        }
      ]
    }).then(() => {
      this.temperature = temperature !== null ? temperature : this.temperature

      this.brightness = brightness !== null ? brightness : this.brightness

      this.on = on !== null ? on : this.on
      this._powerButton.setIcon(this.on ? powerOnIcon : powerOffIcon)
    })
  }

  _createBrightnessSlider() {
    `
    Method to create Brightness Slider
    `

    this._brightnessSlider = new QSlider()

    this._brightnessSlider.setRange(0, 100)
    this._brightnessSlider.setOrientation(1)

    this._brightnessSlider.setStyleSheet(this._sliderStyle('#ffffff', '#000000'))

    this._brightnessSlider.addEventListener('valueChanged', v => {
      this._brightnessSlider.setStyleSheet(this._sliderStyle('#ffffff', '#000000', brightnessScale(v/100)))
      this._brightnessLabel.setText(`${v}%`)
    })

    this._brightnessSlider.addEventListener('valueChanged', debounce((v) => this.updateLight(null, null, v), 50))

    return this._brightnessSlider
  }
  
  _createTemperatureSlider() {

    this._temperatureSlider = new QSlider()

    this._temperatureSlider.setRange(143, 344)
    this._temperatureSlider.setOrientation(1)
    this._temperatureSlider.setStyleSheet(this._sliderStyle('#ffb662', '#F3F2FF'))

    this._temperatureSlider.addEventListener('valueChanged', v => {
      this._temperatureSlider.setStyleSheet(this._sliderStyle('#ffb662', '#F3F2FF', chroma.temperature(toKelvin(v)).hex()))
      this._temperatureLabel.setText(`${toKelvin(v)}K`)
    })

    this._temperatureSlider.addEventListener('valueChanged', debounce((v) => this.updateLight(v, null, null), 50))
 
    return this._temperatureSlider
  }

  _createPowerButton() {
    `
    Method to create Control Widgets
    `

    this._powerButton = new QPushButton()
    this._powerButton.setCheckable(true)
    this._powerButton.setIcon(powerOffIcon)
    this._powerButton.addEventListener('clicked', debounce(() => this.updateLight(null, !this.on, null), 50))

    this._powerButton.setIconSize(new QSize(30, 30))
    this._powerButton.setCursor(CursorShape.PointingHandCursor)

    this._powerButton.setStyleSheet(`
      QPushButton {
        background-color:rgba(0,0,0,0);
        color: white;
        border-radius: 16px;
        border-width: 2px;
        border-color: white;
        border-style: solid;
      }
      QPushButton:checked {
        background-color:#fff;
        color: #313131;
      }
    `)

    return this._powerButton

  }

  _createMainWidget() {
    `
    Method to create Main Widget
    `
    const mainWidget = new QWidget()

    mainWidget.setObjectName(this.slug)
    mainWidget.setLayout(new QGridLayout())

    const nameLabel = new QLabel()
    nameLabel.setText(this.name)
    nameLabel.setInlineStyle('color: white;')

    mainWidget.layout.addWidget(nameLabel, 0, 0, 1, 8)

    mainWidget.layout.addWidget(this._createPowerButton(), 1, 0, 2, 1)

    mainWidget.layout.addWidget(this._createBrightnessSlider(), 1, 1, 1, 6)

    this._brightnessLabel = new QLabel()
    this._brightnessLabel.setInlineStyle('color: white;')
    mainWidget.layout.addWidget(this._brightnessLabel, 1, 7)

    mainWidget.layout.addWidget(this._createTemperatureSlider(), 2, 1, 1, 6)

    this._temperatureLabel = new QLabel()
    this._temperatureLabel.setInlineStyle('color: white;')
    mainWidget.layout.addWidget(this._temperatureLabel, 2, 7)

    mainWidget.setInlineStyle(`
      padding: 10px;
      border-bottom: 1px solid #525252;
      background-color: rgba(49,49,49,0.90);
      opacity: 0.5;
      flex-direction: column;
      height: 90px;
    `)

    this.widget = mainWidget

  }

  _sliderStyle(color1, color2, handleColor=null) {
    return `
    QSlider {
      height: 75px
    }
    QSlider::groove:horizontal {
      background: qlineargradient(x1: 1, y1: 0, x2: 0, y2: 0, stop: 0 ${color1}, stop: 1 ${color2} );
      height: 12px;
      border: 1px solid #313131;
      border-radius: 7px;
    }

    QSlider::handle:horizontal {
      border: 2px solid white;
      width: 17px;
      margin: -4px 0;
      border-radius: 10px;
      background-color: ${handleColor};
    }
  `
  }

}


module.exports = KeyLight