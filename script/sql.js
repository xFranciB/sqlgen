class SQLParser {
    static parsename(name) {
        if (name.length > 64) {
            throw new Error('')
        }

        if (name.match(/[^a-zA-Z0-1_]*/g).join('') !== '') {
            return `\`${name}\``
        }

        return name
    }

    static table(name, table) {return ''}

    static all(tables) {
        const res = []

        for (let table in tables) {
            res.push(this.table(table, tables[table]))
        }

        return res.join('\n\n')
    }
}

class MicrosoftSQL extends SQLParser {
    static #parsecontraints(constraints, primarykeyfields) {
        // TODO: Foreign keys

        let res = []

        if (constraints.hasOwnProperty('PK') && constraints.PK.value) {
            if (primarykeyfields.length === 1) {
                res.push('PRIMARY KEY')
            }
        }

        if (!constraints.hasOwnProperty('NULL') || !constraints.NULL.value) {
            res.push('NOT NULL')
        }

        if (constraints.hasOwnProperty('UNIQUE') && constraints.UNIQUE.value) {
            res.push('UNIQUE')
        }

        return res.join(' ')
    }

    static #typestr(constraints, type, size) {
        switch(type) {
        case 'integer':
            if (constraints.hasOwnProperty('AI')) return 'COUNTER'
            return 'INTEGER'

        case 'decimal':
            return `DECIMAL(${size[0]}, ${size[1]})`

        case 'float':
            return `FLOAT(${size[0]})`

        case 'varchar':
            return `VARCHAR(${size[0]})`

        // BIT, DATE, TIME, DATETIME, CHAR, TEXT
        default:
            return type.toUpperCase()
        }
    }


    static table(name, table) {
        // TODO: Error checking

        // TODO: Tables can only have one COUNTER type (AUTO_INCREMENT)
        let primarykeyfields = []

        for (let field of table.fields) {
            if (field.constraints.hasOwnProperty('PK') && field.constraints.PK.value) {
                primarykeyfields.push(field.name)
            }
        }

        let resfields = []
        for (let field of table.fields) {
            const currfield = [
                this.parsename(field.name),
                this.#typestr(field.constraints, field.type.type, field.type.sizes),
            ]

            const fieldconst = this.#parsecontraints(field.constraints, primarykeyfields)
            if (fieldconst !== '') currfield.push(fieldconst)
            resfields.push('  ' + currfield.join(' '))
        }

        if (primarykeyfields.length > 1) {
            resfields.push(`  PRIMARY KEY(${primarykeyfields.join(', ')})`)
        }

        return `CREATE TABLE ${this.parsename(name)} (\n${resfields.join(',\n')}\n);`
    }
}

class MySQL extends SQLParser {
    static #parsecontraints(constraints, primarykeyfields) {
        // TODO: Foreign keys

        let res = []

        if (constraints.hasOwnProperty('PK') && constraints.PK.value) {
            if (primarykeyfields.length === 1) {
                res.push('PRIMARY KEY')
            }
        }

        if (constraints.hasOwnProperty('AI') && constraints.AI.value) {
            res.push('AUTO_INCREMENT')
        }

        if (!constraints.hasOwnProperty('NULL') || !constraints.NULL.value) {
            res.push('NOT NULL')
        }

        if (constraints.hasOwnProperty('UNIQUE') && constraints.UNIQUE.value) {
            res.push('UNIQUE')
        }

        return res.join(' ')
    }

    static #typestr(constraints, type, size) {
        switch (type) {
        case 'integer':
            return [
                'TINY',
                'SMALL',
                '',
                'BIG'
            ][size[0]] + 'INT'

        case 'decimal':
            return `DECIMAL(${size[0]}, ${size[1]})`

        case 'float':
            return `FLOAT(${size[0]})`

        case 'varchar':
            return `VARCHAR(${size[0]})`

        case 'text':
            return [
                'TINY',
                '',
                'MEDIUM',
                'LONG'
            ][size[0]] + 'TEXT'

        // BIT, DATE, TIME, DATETIME, CHAR
        default:
            return type.toUpperCase()
        }
    }

    static table(name, table) {
        // TODO: Error checking

        // TODO: Tables can only have one AUTO_INCREMENT
        let primarykeyfields = []

        for (let field of table.fields) {
            if (field.constraints.hasOwnProperty('PK') && field.constraints.PK.value) {
                primarykeyfields.push(field.name)
            }
        }

        let resfields = []
        for (let field of table.fields) {
            const currfield = [
                this.parsename(field.name),
                this.#typestr(field.constraints, field.type.type, field.type.sizes),
            ]

            const fieldconst = this.#parsecontraints(field.constraints, primarykeyfields)
            if (fieldconst !== '') currfield.push(fieldconst)
            resfields.push('  ' + currfield.join(' '))
        }

        if (primarykeyfields.length > 1) {
            resfields.push(`  PRIMARY KEY(${primarykeyfields.join(', ')})`)
        }

        return `CREATE TABLE ${this.parsename(name)} (\n${resfields.join(',\n')}\n);`
    }
}