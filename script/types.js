const elements = document.querySelectorAll('#type-list > span:not(.type-category)')
const typedesc = document.getElementById('type-description')
const typemin = document.getElementById('type-min')
const typemax = document.getElementById('type-max')
const typesize = document.getElementById('type-size')

const typeminhead = typemin.parentElement
const typemaxhead = typemax.parentElement
const typesizehead = typesize.parentElement

const emptysettings = document.getElementById('empty-settings')
const intsettings = document.getElementById('integer-settings')
const decimalsettings = document.getElementById('decimal-settings')
const floatsettings = document.getElementById('float-settings')
const varcharsettings = document.getElementById('varchar-settings')
const textsettings = document.getElementById('text-settings')

const intrange = document.getElementById('int-range')
const decimalprec = document.getElementById('decimal-precision')
const decimalscale = document.getElementById('decimal-scale')
const floatrange = document.getElementById('float-range')
const varcharrange = document.getElementById('varchar-range')
const textrange = document.getElementById('text-range')

const nuddecimalprec = document.getElementById('nud-decimal-precision')
const nuddecimalscale = document.getElementById('nud-decimal-scale')
const nudfloat = document.getElementById('nud-float-range')
const nudvarchar = document.getElementById('nud-varchar-range')

const modalEl = document.getElementById('modal-rowtype')
let selectedtype = null
let selectedsizes = []
let showsizes = []

const getType = () => {
    return new Promise((res, rej) => {
        const modalRowType = new Modal(modalEl)
        modalRowType.setCancel(modalEl.querySelector('#rowtype-cancel'), rej)
        modalRowType.setConfirm(modalEl.querySelector('#rowtype-confirm'), () => {
            res({type: selectedtype, showsizes: [], sizes: selectedsizes, showsizes: showsizes})
        })

        modalRowType.open()
    })
}

const formatType = (type) => {
    return ({
        bit: 'Bit',
        integer: 'Intero',
        decimal: 'Virgola fissa',
        float: 'Virgola mobile',
        date: 'Data',
        time: 'Ora',
        datetime: 'Data e Ora',
        char: 'Carattere',
        varchar: 'Testo variabile',
        text: 'Testo fisso',
    })[type]
}

let removecallback = null

const setData = (desc, min, max, size) => {
    typedesc.innerHTML = desc

    if (min === false) {
        typeminhead.classList.add('hidden')
        typemin.innerHTML = ''
    } else {
        typeminhead.classList.remove('hidden')
        typemin.innerHTML = min
    }

    if (max === false) {
        typemaxhead.classList.add('hidden')
        typemax.innerHTML = ''
    } else {
        typemaxhead.classList.remove('hidden')
        typemax.innerHTML = max
    }

    if (size === false) {
        typesizehead.classList.add('hidden')
        typesize.innerHTML = ''
    } else {
        typesizehead.classList.remove('hidden')
        typesize.innerHTML = size
    }
}

const types = {
    bit: callback => {
        setData(
            'Usato per rappresentare un bit.',
            '0',
            '1',
            '1 byte'
        )

        removecallback = callback
    },
    integer: callback => {
        emptysettings.classList.add('hidden')
        intsettings.classList.remove('hidden')

        intrange.oninput = e => {
            setData(
                'Usato per rappresentare un numero intero con segno.',
                ...([
                    [
                        '-2<sup>8</sup>',
                        '2<sup>8</sup>-1',
                        '1 byte'
                    ],
                    [
                        '-2<sup>16</sup>',
                        '2<sup>16</sup>-1',
                        '2 byte'
                    ],
                    [
                        '-2<sup>32</sup>',
                        '2<sup>32</sup>-1',
                        '4 byte'
                    ],
                    [
                        '-2<sup>64</sup>',
                        '2<sup>64</sup>-1',
                        '8 byte'
                    ]
                ][intrange.value])
            )
            selectedsizes = [intrange.value]
            showsizes = [['1', '2', '4', '8'][intrange.value]]
        }

        intrange.dispatchEvent(new InputEvent('input'))

        removecallback = () => {
            emptysettings.classList.remove('hidden')
            intsettings.classList.add('hidden')
            callback()
        }
    },
    decimal: callback => {
        emptysettings.classList.add('hidden')
        decimalsettings.classList.remove('hidden')

        const updatedata = () => {
            setData(
                'Usato per rappresentare un numero decimale con una virgola fissa.',
                ...([
                    [
                        `-10<sup>${decimalprec.value - decimalscale.value}</sup>`,
                        `10<sup>${decimalprec.value - decimalscale.value}</sup>-1`,
                    ],
                    [
                        '0',
                        '1'
                    ]
                ][decimalprec.value - decimalscale.value == 0? 1 : 0]),
                [
                    '4 byte',
                    '8 byte'
                ][decimalprec.value <= 23? 0 : 1]
            )

        }

        decimalprec.oninput = () => {
            nuddecimalprec.value = decimalprec.value
            decimalscale.max = decimalprec.value
            nuddecimalscale.max = decimalprec.value
            decimalscale.dispatchEvent(new InputEvent('input'))
        }

        decimalscale.oninput = () => {
            nuddecimalscale.value = decimalscale.value
            selectedsizes = [decimalprec.value, decimalscale.value]
            showsizes = [decimalprec.value, decimalscale.value]
            updatedata()
        }

        decimalprec.dispatchEvent(new InputEvent('input'))
        decimalscale.dispatchEvent(new InputEvent('input'))
        
        nuddecimalprec.oninput = () => {
            decimalprec.value = nuddecimalprec.value
            decimalprec.dispatchEvent(new InputEvent('input'))
        }

        nuddecimalscale.oninput = () => {
            decimalscale.value = nuddecimalscale.value
            decimalscale.dispatchEvent(new InputEvent('input'))
        }

        removecallback = () => {
            emptysettings.classList.remove('hidden')
            decimalsettings.classList.add('hidden')
            callback()
        }
    },
    float: callback => {
        emptysettings.classList.add('hidden')
        floatsettings.classList.remove('hidden')

        floatrange.oninput = () => {
            nudfloat.value = floatrange.value

            setData(
                'Usato per rappresentare un numero decimale con una virgola mobile.',
                ...([
                    [
                        `-10<sup>${floatrange.value - 1}</sup>`,
                        `10<sup>${floatrange.value - 1}</sup>-1`
                    ],
                    [
                        '0',
                        '1'
                    ]
                ][floatrange.value == 1? 1 : 0]),
                [
                    '4 byte',
                    '8 byte'
                ][floatrange.value <= 23? 0 : 1]
            )
            selectedsizes = [floatrange.value]
            showsizes = [floatrange.value]
        }

        floatrange.dispatchEvent(new InputEvent('input'))

        nudfloat.oninput = () => {
            floatrange.value = nudfloat.value
            floatrange.dispatchEvent(new InputEvent('input'))
        }

        removecallback = () => {
            emptysettings.classList.remove('hidden')
            floatsettings.classList.add('hidden')
            callback()
        }
    },
    date: callback => {
        setData(
            'Usato per rappresentare una data.',
            '0001 o 1000',
            '9999',
            false
        )
        removecallback = callback
    },
    time: callback => {
        setData(
            'Usato per rappresentare un orario.',
            '00:00:00',
            '23:59:59',
            false
        )
        removecallback = callback
    },
    datetime: callback => {
        setData(
            'Usato per rappresentare una data e un orario.',
            '0001 o 1000 / 00:00:00',
            '9999 / 23:59:59',
            false
        )
        removecallback = callback
    },
    char: callback => {
        setData(
            'Usato per rappresentare un singolo carattere.',
            false,
            false,
            '1 byte'
        )
        removecallback = callback
    },
    varchar: callback => {
        emptysettings.classList.add('hidden')
        varcharsettings.classList.remove('hidden')

        varcharrange.oninput = () => {
            nudvarchar.value = varcharrange.value

            setData(
                'Usato per rappresentare una stringa.',
                false, false,
                `0-${varcharrange.value} byte`
            )

            selectedsizes = [varcharrange.value]
            showsizes = [varcharrange.value]
        }

        varcharrange.dispatchEvent(new InputEvent('input'))

        nudvarchar.oninput = () => {
            varcharrange.value = nudvarchar.value
            varcharrange.dispatchEvent(new InputEvent('input'))
        }

        removecallback = () => {
            emptysettings.classList.remove('hidden')
            varcharsettings.classList.add('hidden')
            callback()
        }
    },
    text: callback => {
        emptysettings.classList.add('hidden')
        textsettings.classList.remove('hidden')

        textrange.oninput = () => {
            setData(
                'Usato per rappresentare una stringa.',
                false, false,
                `fino a 10^<sup>${[8, 16, 24, 32][textrange.value]}</sup> byte`
            )

            selectedsizes = [textrange.value]
        }

        textrange.dispatchEvent(new InputEvent('input'))

        removecallback = () => {
            emptysettings.classList.remove('hidden')
            textsettings.classList.add('hidden')
            callback()
        }
    }
}

for (let el of elements) {
    el.onclick = () => {
        if (removecallback !== null) removecallback()
        el.classList.add('active')
        selectedtype = el.id.split('type-')[1]
        selectedsizes = []
        showsizes = []
        types[el.id.split('type-')[1]](() => el.classList.remove('active'))
    }
}