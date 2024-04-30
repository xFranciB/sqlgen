class FieldType {
    // Structure:
    // {
    //     type: string,
    //     sizes: string[],
    //     showsizes: string[]
    // }
    
    static types = Object.freeze({
        bit: 0,
        integer: 1,
        decimal: 2,
        float: 3,
        date: 4,
        time: 5,
        datetime: 6,
        char: 7,
        varchar: 8,
        text: 9,
        name: 10,
        surname: 11,
        gender: 12,
        birthdate: 13,
        email: 14,
        cf: 15,
        username: 16,
        password: 17,
        comune: 18,
        provincia: 19,
        cap: 20,
        prefix: 21,
        codcat: 22,
        address: 23,
        placetel: 24,
        placefax: 25,
        nation: 26,
        nationality: 27,
        iso2: 28,
        iso3: 29,
        chip: 30,
        animalname: 31,
        animalspecies: 32,
        animalgender: 33,
        animalbirthdate: 34,
        animalweight: 35,
        animalheight: 36,
        piva: 37,
        companycat: 38,
        reason: 39,
        companytype: 40,
        workname: 41,
        author: 42,
        isbn: 43,
        bookgenre: 44,
        pages: 45,
        price: 46,
        isan: 47,
        director: 48,
        filmgenre: 49,
        length: 50,
        imdb: 51,
        circuit: 52,
        ccnumber: 53,
        expire: 54,
        cvv: 55,
        brand: 56,
        model: 57,
        supply: 58,
        licence: 59,
        doorsnum: 60,
        color: 61,
        colorrgb: 62,
        mobile: 63,

        0: 'bit',
        1: 'integer',
        2: 'decimal',
        3: 'float',
        4: 'date',
        5: 'time',
        6: 'datetime',
        7: 'char',
        8: 'varchar',
        9: 'text',
        10: 'name',
        11: 'surname',
        12: 'gender',
        13: 'birthdate',
        14: 'email',
        15: 'cf',
        16: 'username',
        17: 'password',
        18: 'comune',
        19: 'provincia',
        20: 'cap',
        21: 'prefix',
        22: 'codcat',
        23: 'address',
        24: 'placetel',
        25: 'placefax',
        26: 'nation',
        27: 'nationality',
        28: 'iso2',
        29: 'iso3',
        30: 'chip',
        31: 'animalname',
        32: 'animalspecies',
        33: 'animalgender',
        34: 'animalbirthdate',
        35: 'animalweight',
        36: 'animalheight',
        37: 'piva',
        38: 'companycat',
        39: 'reason',
        40: 'companytype',
        41: 'workname',
        42: 'author',
        43: 'isbn',
        44: 'bookgenre',
        45: 'pages',
        46: 'price',
        47: 'isan',
        48: 'director',
        49: 'filmgenre',
        50: 'length',
        51: 'imdb',
        52: 'circuit',
        53: 'ccnumber',
        54: 'expire',
        55: 'cvv',
        56: 'brand',
        57: 'model',
        58: 'supply',
        59: 'licence',
        60: 'doorsnum',
        61: 'color',
        62: 'colorrgb',
        63: 'mobile'
    })

    static #formatTypes = Object.freeze({
        0: 'Bit',
        1: 'Intero',
        2: 'Virgola fissa',
        3: 'Virgola mobile',
        4: 'Data',
        5: 'Ora',
        6: 'Data e Ora',
        7: 'Carattere',
        8: 'Testo variabile',
        9: 'Testo fisso',
        10: 'Nome (Persona)',
        11: 'Cognome (Persona)',
        12: 'Sesso (Persona)',
        13: 'Data di nascita (Persona)',
        14: 'Email',
        15: 'Codice Fiscale',
        16: 'Username',
        17: 'Password',
        18: 'Comune',
        19: 'Provincia',
        20: 'CAP',
        21: 'Prefisso telefonico',
        22: 'Codice catastale',
        23: 'Indirizzo',
        24: 'Telefono fisso',
        25: 'Numero fax',
        26: 'Nazione',
        27: 'Nazionalità',
        28: 'ISO2',
        29: 'ISO3',
        30: 'Codice chip',
        31: 'Nome (Animale)',
        32: 'Specie',
        33: 'Sesso (Animale)',
        34: 'Data di nascita (Animale)',
        35: 'Peso',
        36: 'Altezza',
        37: 'Partita IVA',
        38: 'Categoria azienda',
        39: 'Ragione sociale',
        40: 'Tipologia azienda',
        41: 'Opera',
        42: 'Autore',
        43: 'ISBN',
        44: 'Genere (Libro)',
        45: 'Pagine',
        46: 'Prezzo',
        47: 'ISAN',
        48: 'Regista',
        49: 'Genere (Film)',
        50: 'Durata',
        51: 'Punteggio IMDB',
        52: 'Circuito',
        53: 'Numero (Carta di Credito)',
        54: 'Data di scadenza',
        55: 'CVV',
        56: 'Marca (Automobile)',
        57: 'Modello (Automobile)',
        58: 'Alimentazione (Automobile)',
        59: 'Targa',
        60: 'Numero porte',
        61: 'Colore',
        62: 'Colore (RGB)',
        63: 'Cellulare'
    })

    id
    sizes
    showsizes

    constructor(id, sizes = [], showsizes = []) {
        this.id = id
        this.sizes = sizes
        this.showsizes = showsizes
    }

    format() {
        return FieldType.#formatTypes[this.id]
    }

    formatSizes() {
        return this.showsizes.join(', ')
    }

    toJSON() {
        const s = {}

        if (this.sizes.length !== 0) {
            s.sizes = this.sizes
        }

        if (this.showsizes.length !== 0) {
            s.showsizes = this.showsizes
        }

        return {
            id: this.id,
            ...s
        }
    }
}

// NOTE: It is not really necessary to have all of these
// classes extend this one, they're not inheriting anything.
// It could be useful if strong typing was enforced
class Constraint {
    static ids = Object.freeze({
        NULL: 0,
        PK: 1,
        AI: 2,
        UNIQUE: 3,
        FK: 4
    })

    static fromJSON(data) {
        let constraints = []

        for (let constraint of data) {
            constraints.push({
                [Constraint.ids.NULL]:   new NullableConstraint(constraint.value),
                [Constraint.ids.PK]:     new PrimaryKeyConstraint(constraint.value),
                [Constraint.ids.AI]:     new AutoIncrementConstraint(constraint.value, constraint.startpos),
                [Constraint.ids.UNIQUE]: new UniqueConstraint(constraint.value),
                [Constraint.ids.FK]:     new ForeignKeyConstraint(
                    constraint.table,
                    constraint.field,
                    constraint.onupdate,
                    constraint.ondelete
                )
            }[constraint.id])
        }

        return constraints
    }
}

class NullableConstraint extends Constraint {
    id = Constraint.ids.NULL
    value

    constructor(value = true) {
        super()
        this.value = value
    }

    toJSON() {
        return {
            id: this.id,
            value: this.value
        }
    }
}

class PrimaryKeyConstraint extends Constraint {
    id = Constraint.ids.PK
    value

    constructor(value = true) {
        super()
        this.value = value
    }

    toJSON() {
        return {
            id: this.id,
            value: this.value
        }
    }
}

class AutoIncrementConstraint extends Constraint {
    id = Constraint.ids.AI
    value
    startpos

    constructor(value = true, startpos = 1) { // >= 1
        super()
        this.value = value
        this.startpos = startpos
    }

    toJSON() {
        return {
            id: this.id,
            value: this.value,
            startpos: this.startpos
        }
    }
}

class UniqueConstraint extends Constraint {
    id = Constraint.ids.UNIQUE
    value

    constructor(value = true) {
        super()
        this.value = value
    }

    toJSON() {
        return {
            id: this.id,
            value: this.value
        }
    }
}

class ForeignKeyConstraint extends Constraint {
    static actions = {
        ignore: 'ignore',
        setnull: 'setnull',
        cascade: 'cascade'
    }
    
    id = Constraint.ids.FK
    table
    field
    onupdate
    ondelete

    constructor(
        table, field,
        onupdate = ForeignKeyConstraint.actions.ignore, 
        ondelete = ForeignKeyConstraint.actions.ignore
    ) {
        super()
        this.table = table
        this.field = field
        this.onupdate = onupdate
        this.ondelete = ondelete
    }

    toJSON() {
        return {
            id: this.id,
            table: this.table,
            field: this.field,
            onupdate: this.onupdate,
            ondelete: this.ondelete
        }
    }
}

class Field {
    // Structure:
    // {
    //     constraints: Constraint[]
    //     name: string,
    //     type: FieldType
    // }
    
    name
    type
    constraints

    constructor(name, type, constraints = []) {
        this.name = name
        this.type = type
        this.constraints = constraints
    }

    static fromJSON(data) {
        const fields = []

        for (let field of data) {
            fields.push(
                new Field(
                    field.name,
                    new FieldType(field.type.id, field.type.sizes, field.type.showsizes),
                    Constraint.fromJSON(field.constraints)
                )
            )
        }

        return fields
    }
    
    // Name of type string
    // Type of type FieldType
    // Constraints of type Constraint[]
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            constraints: this.constraints.map(constraint => constraint.toJSON())
        }
    }
}

class Table {
    // Structure:
    // tables: Table[]
    
    name
    fields
    
    constructor(name, fields = []) {
        this.name = name
        this.fields = fields
    }

    static fromJSON(data) {
        const tables = []

        for (let table of data) {
            tables.push(new Table(table.name, Field.fromJSON(table.fields)))
        }

        return tables
    }
    
    toJSON() {
        return {
            name: this.name,
            fields: this.fields.map(field => field.toJSON())
        }
    }
}

class Database {
    // Structure:
    // const data = {
    //     databases: Database[]
    // }
    
    name
    tables
    
    constructor(name, tables = []) {
        this.name = name
        this.tables = tables
    }

    static fromJSON(data) {
        const dbs = []

        for (let db of data.databases) {
            dbs.push(new Database(db.name, Table.fromJSON(db.tables)))
        }

        return dbs
    }

    toJSON() {
        return {
            name: this.name,
            tables: this.tables.map(table => table.toJSON())
        }
    }
}

