/* eslint-disable no-unused-vars */

import Functions from './Functions.js'
import BaseConfig from './BaseConfig.js'

export default class Spirit {
  constructor (idP, keyP, xP, yP, colorP, containerP) {
    this.id = idP
    this.x = xP
    this.y = yP
    this.key = keyP
    this.color = colorP
    this.container = containerP

    this._draw()
  }

  leaveUs () {
    this.el.remove()
  }

  _draw () {
    let el = document.createElement('canvas')
    el.width = BaseConfig.DIMENS.SQUARE
    el.height = BaseConfig.DIMENS.SQUARE
    el.style.borderRadius = '0px'
    el.style.position = 'absolute'
    el.style.zIndex = '0'
    el.style.boxShadow = this.color + ' 0 0 50px 5px'
    el.style.transition = 'all 0s ease-out 0s'
    el.style.left = (this.x * BaseConfig.DIMENS.SQUARE) + 'px'
    el.style.top = (this.y * BaseConfig.DIMENS.SQUARE) + 'px'
    el.setAttribute('id', this.id)

    let ctx = el.getContext('2d')
    ctx.beginPath()
    ctx.arc(25, 25, 10, 0, 2 * Math.PI)
    ctx.strokeStyle = this.color
    ctx.fillStyle = this.color
    ctx.stroke()
    ctx.fill()

    this.el = el
    this.container.appendChild(el)
  }
}
