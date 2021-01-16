const { QWidget, QLabel, FlexLayout, QPushButton, QSlider, QIcon, QSize } = require("@nodegui/nodegui")

const _ = require('lodash')
const axios = require('axios').default
const resolve = require('path').resolve

const powerOnIcon = new QIcon(resolve(__dirname, 'assets/power_on.png'))
const powerOffIcon = new QIcon(resolve(__dirname, 'assets/power_off.png'))


function lightTemperatureConvert(value) {
  // Function to convert light temperature in Kelvin to the value the keylight understands
  return Math.round(987007 * value ** -0.999)
}


function toLightTemperature(value) {
  // Function to convert keylight temperature value to the nearest 50th Kelvin value.
  return Math.round((1000000 * value ** -1))
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
      this.temperature = toLightTemperature(response.data.lights[0].temperature)
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
          temperature: temperature !== null ? lightTemperatureConvert(temperature) : this.temperature
        }
      ]
    }).then(() => {
      this.temperature = temperature !== null ? lightTemperatureConvert(temperature) : this.temperature
      this.brightness = brightness !== null ? brightness : this.brightness
      this.on = on !== null ? on : this.on
      this._powerButton.setIcon(this.on ? powerOnIcon : powerOffIcon)
    })
  }

  _createSlidersWidget() {
    `
    Method to create Temperature and Brightness Sliders Widgets
    `
    const slidersWidget = new QWidget()
    slidersWidget.setLayout(new FlexLayout())
    slidersWidget.setInlineStyle('padding-left: 10px; flex-grow: 1; flex-direction: column')

    this._brightnessSlider = new QSlider()
    this._brightnessSlider.setRange(0, 100)
    this._brightnessSlider.setOrientation(1)

    this._brightnessSlider.addEventListener('valueChanged',_.throttle((v) => this.updateLight(null, null, v), 100))

    this._temperatureSlider = new QSlider()
    this._temperatureSlider.setRange(2900, 7000)
    this._temperatureSlider.setOrientation(1)
    this._temperatureSlider.setInvertedAppearance(true)

    this._temperatureSlider.addEventListener('valueChanged',_.throttle((v) => this.updateLight(v, null, null), 100))


    this._brightnessSlider.setStyleSheet(this._sliderStyle('#ffffff', '#000000'))

    this._temperatureSlider.setStyleSheet(this._sliderStyle('#ffb662', '#c9e2ff'))

    slidersWidget.layout.addWidget(this._brightnessSlider)
    slidersWidget.layout.addWidget(this._temperatureSlider)

    return slidersWidget
  }

  _createControlsWidget() {
    `
    Method to create Control Widgets
    `

    const controlsWidget = new QWidget()
    controlsWidget.setLayout(new FlexLayout())
    controlsWidget.setInlineStyle('flex-direction: row;')

    this._powerButton = new QPushButton()
    this._powerButton.setCheckable(true)
    this._powerButton.setIcon(powerOffIcon)
    this._powerButton.addEventListener('clicked', _.throttle(() => this.updateLight(null, !this.on, null), 100))

    this._powerButton.setIconSize(new QSize(30, 30))

    this._powerButton.setStyleSheet(`
      QPushButton {
        background-color:#313131;
        color: white;
        border-radius: 18px;
        border-width: 3px;
        border-color: white;
        border-style: solid;
      }
      QPushButton:checked {
        background-color:#fff;
        color: #313131;
      }
    `)

    controlsWidget.layout.addWidget(this._powerButton)
    controlsWidget.layout.addWidget(this._createSlidersWidget())

    return controlsWidget

  }

  _createMainWidget() {
    `
    Method to create Main Widget
    `
    const mainWidget = new QWidget()

    mainWidget.setObjectName(this.slug)
    mainWidget.setLayout(new FlexLayout())

    const nameLabel = new QLabel()
    nameLabel.setText(this.name)
    nameLabel.setInlineStyle('color: white')

    mainWidget.layout.addWidget(nameLabel)

    mainWidget.layout.addWidget(this._createControlsWidget())

    mainWidget.setStyleSheet(`
      #${this.slug} {
        flex-direction: 'column';
        padding: 10px;
        border-bottom: 1px solid #525252;
        background-color: #313131;
        width: 398px;
      }
      
    `)

    this.widget = mainWidget

  }

  _sliderStyle(color1, color2) {
    return `
    QSlider {
      height: 30px;
    }
    QSlider::groove:horizontal {
      background: qlineargradient(x1: 1, y1: 0, x2: 0, y2: 0, stop: 0 ${color1}, stop: 1 ${color2} );
      height: 15px;
      border: 1px solid #313131;
      border-radius: 7px;
    }

    QSlider::sub-page:horizontal {
      border: 0;
      height: 18px;
      border-radius: 7px;
    }

    QSlider::add-page:horizontal {
      border: 0;
      height: 20px;
      width: 20px;
      border-radius: 10px;
    }

    QSlider::handle:horizontal {
      border: 2px solid white;
      width: 18px;
      margin-top: -2px;
      margin-bottom: -2px;
      border-radius: 9px;
    }

    QSlider::handle:horizontal:hover {
        border-radius: 9px;
    }
  `
  }

}


module.exports = KeyLight