/* eslint-disable no-extend-native */

export default {
  rand: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
  },

  removeAt: (array, position) => {
    return array.filter((el, index) => {
      return index !== position
    })
  },

  pxToNumber: (pxVal) => {
    return parseFloat(pxVal.replace('px', ''))
  }
}
