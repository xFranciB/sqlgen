class MySQL {
    static #parsename(name) {
        // TODO: reserved names like "float" should be
        // escaped as well. We just enclose everything
        // because who cares
        //
        if (name.length > 64) {
            throw new Error('')
        }

        // if (name.match(/[^a-zA-Z0-1_]*/g).join('') !== '') {
        //     return `\`${name}\``
        // }
        
        return `\`${name}\``
    }

    static #parsefkconstraint(constraint) {
        return {
            'noaction': 'NO ACTION',
            'cascade': 'CASCADE',
            'setnull': 'SET NULL',
            'setdefault': 'SET DEFAULT'
        }[constraint]
    }

    static #parseconstraints(constraints, primarykeyfields) {
        let res = ['', '', '', '']

        for (let constraint of constraints) {
            if (constraint.id === Constraint.ids.PK && constraint.value && primarykeyfields.length === 1) {
                res[0] = 'PRIMARY KEY'

            } else if (constraint.id === Constraint.ids.AI && constraint.value) {
                res[1] = 'AUTO_INCREMENT'

            } else if (constraint.id === Constraint.ids.NULL && constraint.value) {
                res[2] = 'NOT NULL'

            } else if (constraint.id === Constraint.ids.UNIQUE && constraint.value) {
                res[3] = 'UNIQUE'
            }
        }

        return res.reduce((acc, curr) => (curr !== '')? acc + curr + ' ' : acc, '').trimEnd()
    }

    static #typestr(typeid, size) {
        switch (typeid) {
        case 1:
            return [
                'TINY',
                'SMALL',
                '',
                'BIG'
            ][Number(size[0])] + 'INT'

        case 2:
            return `DECIMAL(${size[0]}, ${size[1]})`

        case 3:
            return `FLOAT(${size[0]})`

        case 8:
            return `VARCHAR(${size[0]})`

        case 9:
            return [
                'TINY',
                '',
                'MEDIUM',
                'LONG'
            ][Number(size[0])] + 'TEXT'

        case 10: // 'Nome (Persona)',
            return 'VARCHAR(50)'
        case 11: // 'Cognome (Persona)',
            return 'VARCHAR(50)'
        case 12: // 'Sesso (Persona)',
            return 'CHAR'
        case 13: // 'Data di nascita (Persona)',
            return 'DATE'
        case 14: // 'Email',
            return 'VARCHAR(50)'
        case 15: // 'Codice Fiscale',
            return 'VARCHAR(16)'
        case 16: // 'Username',
            return 'VARCHAR(50)'
        case 17: // 'Password',
            return 'VARCHAR(50)'
        case 18: // 'Comune',
            return 'VARCHAR(50)'
        case 19: // 'Provincia',
            return 'VARCHAR(2)'
        case 20: // 'CAP',
            return 'VARCHAR(6)'
        case 21: // 'Prefisso telefonico',
            return 'VARCHAR(10)'
        case 22: // 'Codice catastale',
            return 'VARCHAR(4)'
        case 23: // 'Indirizzo',
            return 'VARCHAR(100)'
        case 24: // 'Telefono fisso',
            return 'VARCHAR(15)'
        case 25: // 'Numero fax',
            return 'VARCHAR(15)'
        case 26: // 'Nazione',
            return 'VARCHAR(50)'
        case 27: // 'Nazionalità',
            return 'VARCHAR(50)'
        case 28: // 'ISO2',
            return 'VARCHAR(2)'
        case 29: // 'ISO3',
            return 'VARCHAR(3)'
        case 30: // 'Codice chip',
            return 'INTEGER'
        case 31: // 'Nome (Animale)',
            return 'VARCHAR(50)'
        case 32: // 'Specie',
            return 'VARCHAR(50)'
        case 33: // 'Sesso (Animale)',
            return 'CHAR'
        case 34: // 'Data di nascita (Animale)',
            return 'DATE'
        case 35: // 'Peso',
            return 'FLOAT'
        case 36: // 'Altezza',
            return 'FLOAT'
        case 37: // 'Partita IVA',
            return 'VARCHAR(15)'
        case 38: // 'Categoria azienda',
            return 'VARCHAR(50)'
        case 39: // 'Ragione sociale',
            return 'VARCHAR(100)'
        case 40: // 'Tipologia azienda',
            return 'VARCHAR(50)'
        case 41: // 'Opera',
            return 'VARCHAR(100)'
        case 42: // 'Autore',
            return 'VARCHAR(100)'
        case 43: // 'ISBN',
            return 'VARCHAR(20)'
        case 44: // 'Genere (Libro)',
            return 'VARCHAR(50)'
        case 45: // 'Pagine',
            return 'INT'
        case 46: // 'Prezzo',
            return 'DECIMAL(6, 2)'
        case 47: // 'ISAN',
            return 'VARCHAR(40)'
        case 48: // 'Regista',
            return 'VARCHAR(100)'
        case 49: // 'Genere (Film)',
            return 'VARCHAR(50)'
        case 50: // 'Durata',
            return 'INT'
        case 51: // 'Punteggio IMDB',
            return 'FLOAT'
        case 52: // 'Circuito',
            return 'VARCHAR(20)'
        case 53: // 'Numero (Carta di Credito)',
            return 'VARCHAR(21)'
        case 54: // 'Data di scadenza',
            return 'DATE'
        case 55: // 'CVV',
            return 'VARCHAR(3)'
        case 56: // 'Marca (Automobile)',
            return 'VARCHAR(50)'
        case 57: // 'Modello (Automobile)',
            return 'VARCHAR(50)'
        case 58: // 'Alimentazione (Automobile)',
            return 'VARCHAR(50)'
        case 59: // 'Targa',
            return 'VARCHAR(7)'
        case 60: // 'Numero porte',
            return 'TINYINT'
        case 61: // 'Colore',
            return 'VARCHAR(50)'
        case 62: // 'Colore (RGB)',
            return 'VARCHAR(6)'
        case 63: // 'Cellulare'
            return 'VARCHAR(20)'

        // BIT, DATE, TIME, DATETIME, CHAR
        default:
            return FieldType.types[typeid].toUpperCase()
        }
    }

    static generateInsert(table, amount, prefix = null) {
        // TODO: Make foreign key values make sense with the parent table
        // TODO: Make unique fields actually unique
        // TODO: Make nullable fields sometimes empty

        const primarykeyfields = []
        const foreignkeyfields = []
        const aifields = []

        for (let field of table.fields) {
            for (let constraint of field.constraints) {
                if (constraint.id === Constraint.ids.PK && constraint.value) {
                    primarykeyfields.push(field.name)

                } else if (constraint.id === Constraint.ids.FK) {
                    foreignkeyfields.push(field.name)

                } else if (constraint.id === Constraint.ids.AI && constraint.value) {
                    aifields.push(field.name)
                }
            }
        }

        const fieldtofill = table.fields.filter(field => !aifields.includes(field.name))

        let res = 'INSERT INTO ' +
            (prefix? MySQL.#parsename(prefix) + '.' : '') +
            MySQL.#parsename(table.name) + ' (' +
            fieldtofill.reduce((acc, curr) => acc + (acc !== ''? ', ' : '') + MySQL.#parsename(curr.name), '').trimEnd() + ') VALUES\n'

        const gendata = []

        for (let i = 0; i < amount; i++) {
            const comune = Comune.getRandomItalia()
            const persona = Persona.getRandom(Comune.getRandom())
            const indirizzo = Indirizzo.getRandom(comune)
            const nazione = Nazione.getRandom()
            const animale = Animale.getRandom()
            const azienda = Azienda.getRandom()
            const opera = Opera.getRandom()
            const libro = Libro.getRandom()
            const film = Film.getRandom()
            const cartacredito = CartaCredito.getRandom()
            const automobile = Auto.getRandom()
            const colore = Colore.getRandom()
            const cellulare = FakeData.generaTelefonoMobile()

            const genfield = []

            for (let field of fieldtofill) {
                // TODO: Handle foreign fields better

                if (foreignkeyfields.includes(field.name)) {
                    if (field.type.id === 1) {
                        genfield.push(Math.floor(Math.random() * amount) + 1)
                    } else {
                        genfield.push("")
                    }

                    continue
                }

                switch(field.type.id) {
                case 0: // Bit,
                    genfield.push(Math.floor(Math.random() * 2))
                    break
                case 1: // Intero,
                    if (field.type.sizes[0] === '0') {
                        genfield.push(Math.floor(Math.random() * 256) - 128)
                    } else if (field.type.sizes[0] === '1') {
                        genfield.push(Math.floor(Math.random() * 65536) - 32768)
                    } else if (field.type.sizes[0] === '2') {
                        genfield.push(Math.floor(Math.random() * 4294967296) - 2147483648)
                    } else if (field.type.sizes[0] === '3') {
                        genfield.push(Math.floor(Math.random() * 18446744073709551616n) - 9223372036854775809n)
                    }
                    break
                case 2: // Virgola fissa,
                    const integerpart = Math.floor(Math.random() * Math.pow(10, Number(field.type.sizes[0]) - Number(field.type.sizes[1])))
                    const decpart = Math.floor(Math.random() * Math.pow(10, Number(field.type.sizes[1])))
                    genfield.push(integerpart + (decpart / Math.pow(10, Number(field.type.sizes[1]))))
                    break
                case 3: // Virgola mobile,
                    genfield.push(Math.random() * 1000)
                    break
                case 4: // Data,
                    genfield.push(FakeData.generaData().toISOString().split('T')[0])
                    break
                case 5: // Ora,
                    const randomhour = FakeData.generaOra().toISOString().split('T')
                    genfield.push(
                        randomhour[0] + ' ' +
                        randomhour[1].split('.')[0]
                    )
                    break
                case 6: // Data e Ora,
                    const randomdatehour = FakeData.generaDataOra().toISOString().split('T')
                    genfield.push(
                        randomdatehour[0] + ' ' +
                        randomdatehour[1].split('.')[0]
                    )
                    break
                case 7: // Carattere,
                    genfield.push(FakeData.generaCarattere())
                    break
                case 8: // Testo variabile,
                    genfield.push(FakeData.generaStringa(Number(field.type.sizes[0])))
                    break
                case 9: // Testo fisso,
                    genfield.push(FakeData.generaStringa(100))
                    break
                case 10: // Nome (Persona),
                    genfield.push(persona.nome)
                    break
                case 11: // Cognome (Persona),
                    genfield.push(persona.cognome)
                    break
                case 12: // Sesso (Persona),
                    genfield.push(persona.sesso)
                    break
                case 13: // Data di nascita (Persona),
                    genfield.push(persona.data_nascita.toISOString().split('T')[0])
                    break
                case 14: // Email,
                    genfield.push(persona.email)
                    break
                case 15: // Codice Fiscale,
                    genfield.push(persona.cf)
                    break
                case 16: // Username,
                    genfield.push(persona.username)
                    break
                case 17: // Password,
                    genfield.push(persona.password)
                    break
                case 18: // Comune,
                    genfield.push(comune.comune)
                    break
                case 19: // Provincia,
                    genfield.push(comune.provincia)
                    break
                case 20: // CAP,
                    genfield.push(comune.cap)
                    break
                case 21: // Prefisso telefonico,
                    genfield.push(comune.prefisso)
                    break
                case 22: // Codice catastale,
                    genfield.push(comune.codcat)
                    break
                case 23: // Indirizzo,
                    genfield.push(indirizzo.indirizzo)
                    break
                case 24: // Telefono fisso,
                    genfield.push(indirizzo.tel)
                    break
                case 25: // Numero fax,
                    genfield.push(indirizzo.fax)
                    break
                case 26: // Nazione,
                    genfield.push(nazione.nazione)
                    break
                case 27: // Nazionalità,
                    genfield.push(nazione.nazionalita)
                    break
                case 28: // ISO2,
                    genfield.push(nazione.iso2)
                    break
                case 29: // ISO3,
                    genfield.push(nazione.iso3)
                    break
                case 30: // Codice chip,
                    genfield.push(animale.chip)
                    break
                case 31: // Nome (Animale),
                    genfield.push(animale.nome)
                    break
                case 32: // Specie,
                    genfield.push(animale.tipo)
                    break
                case 33: // Sesso (Animale),
                    genfield.push(animale.sesso)
                    break
                case 34: // Data di nascita (Animale),
                    genfield.push(animale.data_nascita.toISOString().split('T')[0])
                    break
                case 35: // Peso,
                    genfield.push(animale.peso)
                    break
                case 36: // Altezza,
                    genfield.push(animale.altezza)
                    break
                case 37: // Partita IVA,
                    genfield.push(azienda.piva)
                    break
                case 38: // Categoria azienda,
                    genfield.push(azienda.categoria)
                    break
                case 39: // Ragione sociale,
                    genfield.push(azienda.ragione)
                    break
                case 40: // Tipologia azienda,
                    genfield.push(azienda.tipologia)
                    break
                case 41: // Opera,
                    genfield.push(opera.titolo)
                    break
                case 42: // Autore,
                    genfield.push(opera.autore)
                    break
                case 43: // ISBN,
                    genfield.push(libro.isbn)
                    break
                case 44: // Genere (Libro),
                    genfield.push(libro.genere)
                    break
                case 45: // Pagine,
                    genfield.push(libro.pagine)
                    break
                case 46: // Prezzo,
                    genfield.push(libro.prezzo)
                    break
                case 47: // ISAN,
                    genfield.push(film.isan)
                    break
                case 48: // Regista,
                    genfield.push(film.regista)
                    break
                case 49: // Genere (Film),
                    genfield.push(film.genere)
                    break
                case 50: // Durata
                    genfield.push(film.durata)
                    break
                case 51: // Punteggio IMDB,
                    genfield.push(film.imdb)
                    break
                case 52: // Circuito,
                    genfield.push(cartacredito.circuito)
                    break
                case 53: // Numero (Carta di Credito),
                    genfield.push(cartacredito.numero)
                    break
                case 54: // Data di scadenza,
                    genfield.push(
                        String(cartacredito.scadenza.getFullYear()) + '-' +
                        String(cartacredito.scadenza.getMonth() + 1).padStart(2, '0') +
                        '-01'
                    )
                    break
                case 55: // CVV,
                    genfield.push(cartacredito.cvv)
                    break
                case 56: // Marca (Automobile),
                    genfield.push(automobile.marca)
                    break
                case 57: // Modello (Automobile),
                    genfield.push(automobile.modello)
                    break
                case 58: // Alimentazione (Automobile),
                    genfield.push(automobile.alimentazione)
                    break
                case 59: // Targa,
                    genfield.push(automobile.targa)
                    break
                case 60: // Numero porte,
                    genfield.push(automobile.porte)
                    break
                case 61: // Colore,
                    genfield.push(colore.colore)
                    break
                case 62: // Colore (RGB),
                    genfield.push(colore.rgb)
                    break
                case 63: // Cellulare
                    genfield.push(cellulare)
                    break
                }
            }

            gendata.push(genfield.reduce((acc, curr) => {
                if (acc !== '(') {
                    acc += ', '
                }

                if (typeof curr === 'number') {
                    acc += String(curr)
                } else if (typeof curr === 'string') {
                    acc += '"' + escapeQuotes(curr) + '"'
                } else {
                    console.error(curr, acc)
                }

                return acc
            }, '(') + ')')
        }

        return [ true, res + gendata.join(',\n') + ';' ]
    }

    static table(table, prefix = null) {
        // TODO: Error checking

        const primarykeyfields = []
        const foreignkeyfields = {}
        let ai_amount = 0

        for (let field of table.fields) {
            for (let constraint of field.constraints) {
                if (constraint.id === Constraint.ids.PK && constraint.value) {
                    primarykeyfields.push(MySQL.#parsename(field.name))

                } else if (constraint.id === Constraint.ids.FK) {
                    foreignkeyfields[field.name] = constraint

                } else if (constraint.id === Constraint.ids.AI && constraint.value) {
                    ai_amount++
                }
            }
        }

        if (ai_amount > 1) {
            return [ false, 'Solo un campo può essere auto incrementale' ]
        }

        const resfields = []
        for (let field of table.fields) {
            const currfield = [
                MySQL.#parsename(field.name),
                MySQL.#typestr(field.type.id, field.type.sizes),
            ]

            const fieldconst = MySQL.#parseconstraints(field.constraints, primarykeyfields)
            if (fieldconst !== '') currfield.push(fieldconst)
            resfields.push('  ' + currfield.join(' '))
        }

        if (primarykeyfields.length > 1) {
            resfields.push(`  PRIMARY KEY(${primarykeyfields.join(', ')})`)
        }

        for (let el in foreignkeyfields) {
            resfields.push(
                `  FOREIGN KEY (${MySQL.#parsename(el)}) ` +
                `REFERENCES ${MySQL.#parsename(foreignkeyfields[el].table)}(${MySQL.#parsename(foreignkeyfields[el].field)})` +
                (foreignkeyfields.onupdate === ''? '' : ` ON UPDATE ${MySQL.#parsefkconstraint(foreignkeyfields[el].onupdate)}`) +
                (foreignkeyfields.ondelete === ''? '' : ` ON DELETE ${MySQL.#parsefkconstraint(foreignkeyfields[el].ondelete)}`)
            )
        }

        return [ true, `CREATE TABLE ${prefix? MySQL.#parsename(prefix) + '.' : ''}${MySQL.#parsename(table.name)} (\n${resfields.join(',\n')}\n);` ]
    }

    static database(db, inserts = 0) {
        let str = `CREATE DATABASE ${MySQL.#parsename(db.name)};`
    
        for (let table of db.tables) {
            let [ status, res ] = MySQL.table(table, db.name)

            if (!status) {
                return [ false, res ]
            }

            str += '\n\n' + res

            let [ status1, res1 ] = MySQL.generateInsert(table, inserts, db.name)

            if (!status1) {
                return [ false, res1 ]
            }

            str += '\n\n' + res1
        }

        return [ true, str ]
    }

    static all(databases, inserts = 0) {
        let str = []

        for (let db of databases) {
            const [ status, res ] = MySQL.database(db, inserts)

            if (!status) {
                return [ false, res ]
            }

            str.push(res)
        }

        return [ true, str.join('\n\n') ]
    }
}

class ExportModal {
    static #modes = {
        all: 0,
        db: 1,
        table: 2
    }

    static #mode = -1
    static #data = {}

    static #modal = new Modal(document.getElementById('modal-export'))
    static #mainExportBtn = document.getElementById('export-button')
    static #dbExportBtn = document.getElementById('export-db')
    static #tableExportBtn = document.getElementById('export-structure')
    static #copyBtn = document.getElementById('copy-sql-btn')
    static #insertAmount = document.getElementById('insert-amount')
    static #outTextbox
    static #modalTitle

    static {
        ExportModal.#outTextbox = ExportModal.#modal.element.querySelector('textarea')
        ExportModal.#modalTitle = ExportModal.#modal.element.querySelector('.modal-title')

        ExportModal.#mainExportBtn.onclick = () => {
            ExportModal.openMain(Data.getAllDatabases())
        }

        ExportModal.#dbExportBtn.onclick = () => {
            ExportModal.openDatabase(Data.currentDatabase)
        }

        ExportModal.#tableExportBtn.onclick = () => {
            ExportModal.openTable(Data.currentTable)
        }

        ExportModal.#modal.setConfirm(ExportModal.#modal.element.querySelector('.confirm'), () => {
            let res, str

            switch (ExportModal.#mode) {
            case ExportModal.#modes.all:
                [ res, str ] = MySQL.all(ExportModal.#data, ExportModal.#insertAmount.value)
                break

            case ExportModal.#modes.db:
                [ res, str ] = MySQL.database(ExportModal.#data, ExportModal.#insertAmount.value)
                break

            case ExportModal.#modes.table:
                [ res, str ] = MySQL.table(ExportModal.#data)

                if (res) {
                    let [ status1, res1 ] = MySQL.generateInsert(ExportModal.#data, ExportModal.#insertAmount.value)

                    if (status1) {
                        str += '\n\n' + res1
                    } else {
                        res = status1
                        str = res1
                    }
                }

                break
            }

            if (!res) {
                ErrorModal.show(str)
                return
            }

            ExportModal.#outTextbox.value = str
        }, false)

        ExportModal.#modal.setCancel(ExportModal.#modal.element.querySelector('.cancel'))

        ExportModal.#copyBtn.onclick = () => {
            window.navigator.clipboard.writeText(ExportModal.#outTextbox.value)
        }
    }

    static #open() {
        ExportModal.#outTextbox.value = ''
        ExportModal.#modal.open()
    }

    static openTable(table) {
        ExportModal.#mode = ExportModal.#modes.table
        ExportModal.#data = table
        ExportModal.#modalTitle.textContent = 'Esporta tabella'
        ExportModal.#open()
    }

    static openDatabase(db) {
        ExportModal.#mode = ExportModal.#modes.db
        ExportModal.#data = db
        ExportModal.#modalTitle.textContent = 'Esporta database'
        ExportModal.#open()
    }

    static openMain(databases) {
        ExportModal.#mode = ExportModal.#modes.all
        ExportModal.#data = databases
        ExportModal.#modalTitle.textContent = 'Esporta tutto'
        ExportModal.#open()
    }
}
