/* eslint-disable no-unused-vars */

import Functions from './Functions.js'
import BaseConfig from './BaseConfig.js'

export default class Bullet {
  constructor (bulletIdP, containerP, shooterP) {
    this.bulletId = bulletIdP
    this.container = containerP
    this.shooter = shooterP
    this.w = 50
    this.h = 50
    this.intervalId = null
    this.shootEffects = [ BaseConfig.SHOOTEFFECTS.DECREASE_LIFE ]

    this._draw()
  }

  acheminate () {
    let Bullet = this
    let startAt
    let i

    switch (this.direction) {
      case BaseConfig.DIRECTIONS.TOP:
        i = startAt = Functions.pxToNumber(this.el.style.top)
        Bullet.intervalId = setInterval(() => {
          if (i <= -5) {
            Bullet.inhibe()
          } else {
            this.el.style.top = i + 'px'
            this._updateLaserJet()
          }
          i -= 5
        }, 1)
        break
      case BaseConfig.DIRECTIONS.RIGHT:
        i = startAt = Functions.pxToNumber(this.el.style.left)
        Bullet.intervalId = setInterval(() => {
          if (i >= (parseInt(BaseConfig.DIMENS.WIDTH) - this.w + 5)) {
            Bullet.inhibe()
          } else {
            this.el.style.left = i + 'px'
            this._updateLaserJet()
          }
          i += 5
        }, 1)
        break
      case BaseConfig.DIRECTIONS.BOTTOM:
        i = startAt = Functions.pxToNumber(this.el.style.top)
        Bullet.intervalId = setInterval(() => {
          if (i >= (BaseConfig.DIMENS.HEIGHT - (this.h) + 5)) {
            Bullet.inhibe()
          } else {
            this.el.style.top = i + 'px'
            this._updateLaserJet()
          }
          i += 5
        }, 1)
        break
      case BaseConfig.DIRECTIONS.LEFT:
        i = startAt = Functions.pxToNumber(this.el.style.left)
        Bullet.intervalId = setInterval(() => {
          if (i <= -5) {
            Bullet.inhibe()
          } else {
            this.el.style.left = i + 'px'
            this._updateLaserJet()
          }
          i -= 5
        }, 1)
        break
    }
  }

  inhibe () {
    this._destroy()
  }

  _draw () {
    this.el = document.createElement('canvas')
    this.el.width = this.w
    this.el.height = this.h
    this.el.style.borderRadius = '50%'
    this.el.style.position = 'absolute'
    this.el.style.zIndex = '0'
    this.el.style.transition = 'all 0s ease-out 0s'
    this.el.style.left = Functions.pxToNumber(this.shooter.el.style.left) + 'px'
    this.el.style.top = Functions.pxToNumber(this.shooter.el.style.top) + 'px'
    this.el.setAttribute('id', this.bulletId.toString().trim())
    this.direction = this.shooter.getFace()

    switch (this.direction) {
      case BaseConfig.DIRECTIONS.TOP:
        this.el.style.transform = 'rotate(0) translateX(0) translateY(-100%)'
        break
      case BaseConfig.DIRECTIONS.RIGHT:
        this.el.style.transform = 'rotate(0) translateX(100%) translateY(0%)'
        break
      case BaseConfig.DIRECTIONS.BOTTOM:
        this.el.style.transform = 'rotate(0) translateX(0px) translateY(100%)'
        break
      case BaseConfig.DIRECTIONS.LEFT:
        this.el.style.transform = 'rotate(0) translateX(-100%) translateY(0%)'
        break
    }

    let ctx = this.el.getContext('2d')
    ctx.beginPath()
    ctx.arc(25, 25, 7, 0, 2 * Math.PI)
    ctx.strokeStyle = BaseConfig.COLORS.BULLET_COLOR
    ctx.fillStyle = BaseConfig.COLORS.BULLET_COLOR
    ctx.stroke()
    ctx.fill()
    this.container.appendChild(this.el)
  }

  _destroy () {
    let BulletInstance = this

    clearInterval(BulletInstance.intervalId)

    BulletInstance.el.style.transform += 'scale(.01)'
    BulletInstance.el.remove()
  }

  _detTrajectoire (x, y, face) {
    let response
    switch (face) {
      case BaseConfig.DIRECTIONS.TOP:
        response = new Array(y + 2).fill([x, y]).map((el, index) => {
          return (x + ':' + (el[1] - index))
        })
        break
      case BaseConfig.DIRECTIONS.RIGHT:
        response = new Array((BaseConfig.DIMENS.WIDTH / BaseConfig.DIMENS.SQUARE) - x + 1).fill([x, y]).map((el, index) => {
          return ((el[0] + index) + ':' + y)
        })
        break
      case BaseConfig.DIRECTIONS.BOTTOM:
        response = new Array((BaseConfig.DIMENS.HEIGHT / BaseConfig.DIMENS.SQUARE) - y + 1).fill([x, y]).map((el, index) => {
          return (x + ':' + (el[1] + index))
        })
        break
      case BaseConfig.DIRECTIONS.LEFT:
        response = new Array(x + 2).fill([x, y]).map((el, index) => {
          return ((el[0] - index) + ':' + y)
        })
        break
    }
    return response
  }

  _updateLaserJet () {
    let gridX = Math.round(Functions.pxToNumber(this.el.style.left) / BaseConfig.DIMENS.SQUARE)
    let gridY = Math.round(Functions.pxToNumber(this.el.style.top) / BaseConfig.DIMENS.SQUARE)
    if (this.direction === BaseConfig.DIRECTIONS.TOP) {
      gridY -= 1
    }
    if (this.direction === BaseConfig.DIRECTIONS.LEFT) {
      gridX -= 1
    }
    if (this.direction === BaseConfig.DIRECTIONS.BOTTOM) {
      gridY += 1
    }
    this.laserJet = this._detTrajectoire(gridX, gridY, this.direction)
    // Ne pas supprimer this.laserJet mm si xa sert a rien actu. Pttr plustard dans la prédition
    this.shooter.GameInstance.punchPlayersWith(this, this.laserJet)
  }
}
