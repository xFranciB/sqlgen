class TypePrompt {
    static #typedesc = document.getElementById('type-description')
    static #typemin = document.getElementById('type-min')
    static #typemax = document.getElementById('type-max')
    static #typesize = document.getElementById('type-size')

    static #typeminhead 
    static #typemaxhead 
    static #typesizehead

    static #settingsContainer = document.getElementById('type-settings')
    static #emptysettings = document.getElementById('empty-settings')

    static #intrange = document.getElementById('int-range')
    static #decimalprec = document.getElementById('decimal-precision')
    static #decimalscale = document.getElementById('decimal-scale')
    static #floatrange = document.getElementById('float-range')
    static #varcharrange = document.getElementById('varchar-range')
    static #textrange = document.getElementById('text-range')

    static #nuddecimalprec = document.getElementById('nud-decimal-precision')
    static #nuddecimalscale = document.getElementById('nud-decimal-scale')
    static #nudfloat = document.getElementById('nud-float-range')
    static #nudvarchar = document.getElementById('nud-varchar-range')

    static #modal
    static #modalConfirmBtn
    static #modalCancelBtn

    static #selectedtype = null
    static #selectedsizes = []
    static #showsizes = []

    static {
        TypePrompt.#typeminhead  = TypePrompt.#typemin.parentElement
        TypePrompt.#typemaxhead  = TypePrompt.#typemax.parentElement
        TypePrompt.#typesizehead = TypePrompt.#typesize.parentElement

        TypePrompt.#modal = new Modal(document.getElementById('modal-rowtype'))
        TypePrompt.#modalConfirmBtn = TypePrompt.#modal.element.querySelector('.confirm')
        TypePrompt.#modalCancelBtn = TypePrompt.#modal.element.querySelector('.cancel')

        document.querySelectorAll('#type-list span:not(.type-category)').forEach(el => {
            el.onclick = TypePrompt.#handleButton
        })

        document.querySelectorAll('#type-tab-selector > div').forEach(el => {
            el.onclick = () => {
                const showid = el.id.split('-btn')[0]
                document.querySelector(`#type-tab-selector > div.active:not(#${escapeQuotes(el.id)})`)?.classList.remove('active')
                document.querySelector(`.type-tab:not(#${showid}):not(.hidden)`)?.classList.add('hidden')

                el.classList.add('active')
                document.getElementById(showid).classList.remove('hidden')
            }
        })

        TypePrompt.#intrange.oninput = () => {
            TypePrompt.#setData(
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
                ][TypePrompt.#intrange.value])
            )

            TypePrompt.#selectedsizes = [TypePrompt.#intrange.value]
            TypePrompt.#showsizes = [['1', '2', '4', '8'][TypePrompt.#intrange.value]]
        }

        TypePrompt.#decimalprec.oninput = () => {
            TypePrompt.#nuddecimalprec.value = TypePrompt.#decimalprec.value
            TypePrompt.#decimalscale.max = TypePrompt.#decimalprec.value
            TypePrompt.#nuddecimalscale.max = TypePrompt.#decimalprec.value
            TypePrompt.#decimalscale.dispatchEvent(new InputEvent('input'))
        }

        TypePrompt.#decimalscale.oninput = () => {
            TypePrompt.#nuddecimalscale.value = TypePrompt.#decimalscale.value
            TypePrompt.#selectedsizes = [TypePrompt.#decimalprec.value, TypePrompt.#decimalscale.value]
            TypePrompt.#showsizes = [TypePrompt.#decimalprec.value, TypePrompt.#decimalscale.value]

            TypePrompt.#setData(
                'Usato per rappresentare un numero decimale con una virgola fissa.',
                false, false,
                [
                    '4 byte',
                    '8 byte'
                ][TypePrompt.#decimalprec.value <= 23? 0 : 1]
            )
        }

        TypePrompt.#nuddecimalprec.oninput = () => {
            TypePrompt.#decimalprec.value = TypePrompt.#nuddecimalprec.value
            TypePrompt.#decimalprec.dispatchEvent(new InputEvent('input'))
        }

        TypePrompt.#nuddecimalscale.oninput = () => {
            TypePrompt.#decimalscale.value = TypePrompt.#nuddecimalscale.value
            TypePrompt.#decimalscale.dispatchEvent(new InputEvent('input'))
        }

        TypePrompt.#floatrange.oninput = () => {
            TypePrompt.#nudfloat.value = TypePrompt.#floatrange.value

            TypePrompt.#setData(
                'Usato per rappresentare un numero decimale con una virgola mobile.',
                false, false,
                [
                    '4 byte',
                    '8 byte'
                ][TypePrompt.#floatrange.value <= 23? 0 : 1]
            )

            TypePrompt.#selectedsizes = [TypePrompt.#floatrange.value]
            TypePrompt.#showsizes = [TypePrompt.#floatrange.value]
        }

        TypePrompt.#nudfloat.oninput = () => {
            TypePrompt.#floatrange.value = TypePrompt.#nudfloat.value
            TypePrompt.#floatrange.dispatchEvent(new InputEvent('input'))
        }

        TypePrompt.#varcharrange.oninput = () => {
            TypePrompt.#nudvarchar.value = TypePrompt.#varcharrange.value

            TypePrompt.#setData(
                'Usato per rappresentare una stringa.',
                false, false,
                `0-${TypePrompt.#varcharrange.value} byte`
            )

            TypePrompt.#selectedsizes = [TypePrompt.#varcharrange.value]
            TypePrompt.#showsizes = [TypePrompt.#varcharrange.value]
        }
        
        TypePrompt.#nudvarchar.oninput = () => {
            TypePrompt.#varcharrange.value = TypePrompt.#nudvarchar.value
            TypePrompt.#varcharrange.dispatchEvent(new InputEvent('input'))
        }

        TypePrompt.#textrange.oninput = () => {
            TypePrompt.#setData(
                'Usato per rappresentare una stringa.',
                false, false,
                `fino a 10^<sup>${[8, 16, 24, 32][TypePrompt.#textrange.value]}</sup> byte`
            )

            TypePrompt.#selectedsizes = [TypePrompt.#textrange.value]
        }
    }

    static #handleButton(e) {
        const type = e.target.id.split('type-')[1]
        TypePrompt.#selectedtype = type
        TypePrompt.#selectedsizes = []
        TypePrompt.#showsizes = []

        TypePrompt.#modal.element.querySelector(`span.active:not(#${escapeQuotes(e.target.id)})`)?.classList.remove('active')
        e.target.classList.add('active')

        const settings = TypePrompt.#settingsContainer.querySelector(`#${escapeQuotes(type)}-settings`)
        if (settings !== null) {
            TypePrompt.#settingsContainer.querySelector(
                `#${escapeQuotes(TypePrompt.#settingsContainer.id)} > div:not(#${escapeQuotes(type)}-settings):not(.hidden)`
            )?.classList.add('hidden')

            settings.classList.remove('hidden')
        } else {
            TypePrompt.#settingsContainer.querySelector(
                `#${escapeQuotes(TypePrompt.#settingsContainer.id)} > div:not(#${escapeQuotes(TypePrompt.#emptysettings.id)}):not(.hidden)`
            )?.classList.add('hidden')

            TypePrompt.#emptysettings.classList.remove('hidden')
        }

        switch (type) {
        case 'bit':
            TypePrompt.#setData(
                'Usato per rappresentare un bit.',
                '0',
                '1',
                '1 byte'
            )
            break

        case 'integer':
            TypePrompt.#intrange.dispatchEvent(new InputEvent('input'))
            break

        case 'decimal':
            TypePrompt.#decimalprec.dispatchEvent(new InputEvent('input'))
            TypePrompt.#decimalscale.dispatchEvent(new InputEvent('input'))
            break

        case 'float':
            TypePrompt.#floatrange.dispatchEvent(new InputEvent('input'))
            break

        case 'date':
            TypePrompt.#setData(
                'Usato per rappresentare una data.',
                '0001 o 1000',
                '9999',
                false
            )
            break

        case 'time':
            TypePrompt.#setData(
                'Usato per rappresentare un orario.',
                '00:00:00',
                '23:59:59',
                false
            )
            break

        case 'datetime':
            TypePrompt.#setData(
                'Usato per rappresentare una data e un orario.',
                '0001 o 1000 / 00:00:00',
                '9999 / 23:59:59',
                false
            )
            break

        case 'char':
            TypePrompt.#setData(
                'Usato per rappresentare un singolo carattere.',
                false,
                false,
                '1 byte'
            )
            break

        case 'varchar':
            TypePrompt.#varcharrange.dispatchEvent(new InputEvent('input'))
            break

        case 'text':
            TypePrompt.#textrange.dispatchEvent(new InputEvent('input'))
            break

        // Premade types
        case 'name':
            TypePrompt.#setData('Il nome di una persona')
            break

        case 'surname':
            TypePrompt.#setData('Il cognome di una persona')
            break

        case 'gender':
            TypePrompt.#setData('Il sesso di una persona')
            break

        case 'birthdate':
            TypePrompt.#setData('La data di nascita di una persona')
            break
            
        case 'email':
            TypePrompt.#setData('L\'email di una persona')
            break

        case 'cf':
            TypePrompt.#setData('Il codice fiscale di una persona')
            break

        case 'username':
            TypePrompt.#setData('Lo username di una persona')
            break

        case 'password':
            TypePrompt.#setData('La password di una persona')
            break

        case 'comune':
            TypePrompt.#setData('Un comune italiano')
            break

        case 'provincia':
            TypePrompt.#setData('La sigla di una provincia italiana')
            break

        case 'cap':
            TypePrompt.#setData('Il codice postale di un comune italiano')
            break

        case 'prefix':
            TypePrompt.#setData('Il prefisso telefonico di un comune italiano')
            break

        case 'codcat':
            TypePrompt.#setData('Il codice catastale di un comune italiano')
            break

        case 'address':
            TypePrompt.#setData('Un indirizzo stradale')
            break

        case 'placetel':
            TypePrompt.#setData('Un numero di telefono fisso')
            break

        case 'placefax':
            TypePrompt.#setData('Un numero di fax')
            break

        case 'nation':
            TypePrompt.#setData('Il nome di una nazione')
            break

        case 'nationality':
            TypePrompt.#setData('Una nazionalità<br>(es. "italiano")')
            break

        case 'iso2':
            TypePrompt.#setData('Il codice a 2 cifre di una nazione<br>(es. "IT")')
            break

        case 'iso3':
            TypePrompt.#setData('Il codice a 3 cifre di una nazione<br>(es. "ITA")')
            break

        case 'chip':
            TypePrompt.#setData('Il numero del chip di un animale')
            break

        case 'animalname':
            TypePrompt.#setData('Il nome di un animale')
            break

        case 'animalspecies':
            TypePrompt.#setData('La specie di un animale')
            break

        case 'animalgender':
            TypePrompt.#setData('Il sesso di un animale')
            break

        case 'animalbirthdate':
            TypePrompt.#setData('La data di nascita di un animale')
            break

        case 'animalweight':
            TypePrompt.#setData('Il peso di un animale')
            break

        case 'animalheight':
            TypePrompt.#setData('L\'altezza di un animale')
            break

        case 'piva':
            TypePrompt.#setData('La partita IVA di un\'azienda')
            break

        case 'companycat':
            TypePrompt.#setData('La categoria di un\'azienda<br>(es. "Ristorante")')
            break

        case 'reason':
            TypePrompt.#setData('La ragione sociale di un\'azienda')
            break

        case 'companytype':
            TypePrompt.#setData('La tipologia di un\'azienda<br>(es. "S.r.l.")')
            break

        case 'workname':
            TypePrompt.#setData('Il nome di un\'opera')
            break

        case 'author':
            TypePrompt.#setData('Il nome dell\'autore di un\'opera')
            break

        case 'isbn':
            TypePrompt.#setData('L\'ISBN di un libro')
            break

        case 'bookgenre':
            TypePrompt.#setData('Il genere di un libro')
            break

        case 'pages':
            TypePrompt.#setData('Il numero di pagine di un libro')
            break

        case 'price':
            TypePrompt.#setData('Il prezzo di un libro')
            break

        case 'isan':
            TypePrompt.#setData('L\'ISAN di un film')
            break

        case 'director':
            TypePrompt.#setData('Il regista di un film')
            break
                
        case 'filmgenre':
            TypePrompt.#setData('Il genere di un film')
            break

        case 'length':
            TypePrompt.#setData('La durata di un film')
            break

        case 'imdb':
            TypePrompt.#setData('Il punteggio IMDB di un film<br>(Da 0.0 a 10.0)')
            break

        case 'circuit':
            TypePrompt.#setData('Il circuito di una carta di credito<br>(es. "VISA")')
            break

        case 'ccnumber':
            TypePrompt.#setData('Il numero di una carta di credito')
            break

        case 'expire':
            TypePrompt.#setData('La scadenza di una carta di credito')
            break

        case 'cvv':
            TypePrompt.#setData('Il CVV di una carta di credito')
            break

        case 'brand':
            TypePrompt.#setData('La marca di un\'automobile')
            break

        case 'model':
            TypePrompt.#setData('Il modello di un\'automobile')
            break

        case 'supply':
            TypePrompt.#setData('Il tipo di alimentazione di un\'automobile<br>(es. "Benzina")')
            break

        case 'licence':
            TypePrompt.#setData('La targa di un\'automobile')
            break

        case 'doorsnum':
            TypePrompt.#setData('Il numero di porte di un\'automobile')
            break

        case 'color':
            TypePrompt.#setData('Un colore\n(es. rosso)')
            break

        case 'colorrgb':
            TypePrompt.#setData('Un colore, in formato RGB\n(es. "FF0000")')
            break

        case 'mobile':
            TypePrompt.#setData('Un numero di telefono cellulare')
            break
        }
    }

    static #setData = (desc, min = false, max = false, size = false) => {
        TypePrompt.#typedesc.innerHTML = desc

        if (min === false) {
            TypePrompt.#typeminhead.classList.add('hidden')
            TypePrompt.#typemin.innerHTML = ''
        } else {
            TypePrompt.#typeminhead.classList.remove('hidden')
            TypePrompt.#typemin.innerHTML = min
        }

        if (max === false) {
            TypePrompt.#typemaxhead.classList.add('hidden')
            TypePrompt.#typemax.innerHTML = ''
        } else {
            TypePrompt.#typemaxhead.classList.remove('hidden')
            TypePrompt.#typemax.innerHTML = max
        }

        if (size === false) {
            TypePrompt.#typesizehead.classList.add('hidden')
            TypePrompt.#typesize.innerHTML = ''
        } else {
            TypePrompt.#typesizehead.classList.remove('hidden')
            TypePrompt.#typesize.innerHTML = size
        }
    }

    static #prepareData(previous) {
        const el = document.getElementById(`type-${FieldType.types[previous.id]}`)

        if (el === null) {
            return
        }

        el.dispatchEvent(new MouseEvent('click'))
        document.getElementById(`${el.parentElement.id}-btn`).dispatchEvent(new MouseEvent('click'))

        requestAnimationFrame(() => {
            if (previous.sizes.length !== 0) {
                const sliders = TypePrompt.#settingsContainer.querySelectorAll(
                    `#${escapeQuotes(TypePrompt.#settingsContainer.id)} > div:not(.hidden) input[type="range"]`
                )

                for (let i = 0; i < Math.min(sliders.length, previous.sizes.length); i++) {
                    sliders[i].value = Number(previous.sizes[i])
                    sliders[i].dispatchEvent(new MouseEvent('input'))
                }
            }

            el.scrollIntoView({behavior: 'auto', block: 'center', inline: 'center'})
        })
    }

    static getType = (previous = {}) => {
        if (previous.id !== undefined) {
            TypePrompt.#prepareData(previous)
        }

        return new Promise((res, rej) => {
            TypePrompt.#modal.setCancel(TypePrompt.#modalCancelBtn, rej)
            TypePrompt.#modal.setConfirm(TypePrompt.#modalConfirmBtn, () => {
                res(new FieldType(
                    FieldType.types[TypePrompt.#selectedtype],
                    TypePrompt.#selectedsizes,
                    TypePrompt.#showsizes
                ))
            })

            TypePrompt.#modal.open()
        })
    }
}
