class Functions {
  rand (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  randInArray (arr) {
    return arr[this.rand(0, (arr.length - 1))]
  }

  removeAt (array, position) {
    return array.filter((el, index) => {
      return index !== position
    })
  }

  pxToNumber (pxVal) {
    return parseFloat(pxVal.replace('px', ''))
  }

  last (arr) {
    return arr[arr.length - 1]
  }

  empty (HTMLElement) {
    HTMLElement.innerHTML = ''
  }

  twoDigits (param) {
    param = param.toString()
    return (param.length <= 1) ? ('0' + param) : (param)
  }
}

export default new Functions()
