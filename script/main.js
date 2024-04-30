// Helper functions
const arrayEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) return false
    }

    return true
}

const escapeQuotes = str => str.replace('"', '\\"')

// Global variables
const imageBase = 'img/'

// This is a static class used to modify the global state of
// the application, it is not intended to be instantiated
// NOTE: Only methods defined in this class should modify
// the `data` field in localStorage in order to avoid conflicts
// also, this class should only do edits to the `data` field,
// it should not touch the DOM directly.
// TODO: Actually do this
class Data {
    static #data
    static currentDatabase = null
    static currentTable = null

    static {
        const lsData = localStorage.getItem('data')

        if (lsData === null) {
            Data.#data = {databases: []}
        } else {
            Data.#data = {databases: Database.fromJSON(JSON.parse(lsData))}
        }
    }
    
    static newDB(name) {
        if (Data.getDBIndex(name) !== null) {
            ErrorModal.show('Il database esiste già')
            // error
            return
        }

        const db = new Database(name)
        Data.#data.databases.push(db)

        Sidebar.addDB(db)
        Data.saveData()
    }

    static newTable(dbname, name) {
        if (Data.getTableIndex(dbname, name) !== null) {
            ErrorModal.show(`La tabella "${name}" esiste già nel database "${dbname}"`)
            return
        }

        const table = new Table(name)

        Data.addTable(dbname, table)

        Sidebar.addTable(dbname, table)
        Data.saveData()
    }

    static newDBFromJSON(db) {
        Data.#data.databases.push(db)
        Sidebar.addDB(db)
        Data.saveData()
    }

    // TODO: Does it even make sense to expose Data method
    // publicly or should it be private so only Data class's
    // members can access it?
    // In theory it should be private, but the ER graph updates
    // the data directly when saving its contents, so that saving
    // should be made part of Data class and then that functionality removed.
    static saveData() {
        localStorage.setItem('data', JSON.stringify({databases: Data.#data.databases.map(db => db.toJSON())}))
    }

    static getAllDatabases() {
        return Data.#data.databases
    }

    static getDBIndex(name) {
        for (let i = 0; i < Data.#data.databases.length; i++) {
            if (Data.#data.databases[i].name === name) {
                return i
            }
        }

        return null
    }

    static getDB(name) {
        const idx = Data.getDBIndex(name)
        if (idx === null) {
            return null
        }

        return Data.#data.databases[idx]
    }

    static addTable(dbname, table) {
        const idx = Data.getDBIndex(dbname)
        if (idx === null) {
            return false
        }

        Data.#data.databases[idx].tables.push(table)
        return true
    }

    static getAllTables(dbname) {
        const idx = Data.getDBIndex(dbname)
        if (idx === null) {
            return null
        }
        
        return Data.#data.databases[idx].tables
    }

    static getTableIndex(dbname, name) {
        const idx = Data.getDBIndex(dbname)
        if (idx === null) {
            return null
        }

        for (let i = 0; i < Data.#data.databases[idx].tables.length; i++) {
            if (Data.#data.databases[idx].tables[i].name === name) {
                return {dbid: idx, tableid: i}
            }
        }

        return null
    }

    static getDBAndTable(dbname, tablename) {
        const idx = Data.getTableIndex(dbname, tablename)
        if (idx === null) {
            return null
        }

        const { dbid, tableid } = idx
        
        return {
            db:    Data.#data.databases[dbid],
            table: Data.#data.databases[dbid].tables[tableid]
        }
    }

    static getTable(dbname, tablename) {
        const idx = Data.getTableIndex(dbname, tablename)
        if (idx === null) {
            return null
        }

        const { dbidx, tableidx } = idx
        
        return Data.#data.databases[dbidx].tables[tableidx]
    }

    static renameDatabase(dbname, newname) {
        const id = Data.getDBIndex(dbname)
        if (id === null) {
            return null
        }

        let iscurrent = false
        
        if (Data.currentDatabase.name === dbname) {
            iscurrent = true
        }

        Data.#data.databases[id].name = newname

        if (iscurrent) {
            Data.currentDatabase = Data.#data.databases[id]
        }

        Data.saveData()
    }

    static deleteDatabase(dbname) {
        const id = Data.getDBIndex(dbname)
        if (id === null) {
            return null
        }

        Data.#data.databases.splice(id, 1)
        Data.saveData()
    }

    static renameTable(dbname, tablename, newname) {
        const idx = Data.getTableIndex(dbname, tablename)
        if (idx === null) {
            return null
        }

        const { dbid, tableid } = idx
        let iscurrent = false

        if (Data.currentTable.name === tablename) {
            iscurrent = true
        }

        for (let table of Data.#data.databases[dbid].tables) {
            for (let field of table.fields) {
                for (let constraint of field.constraints) {
                    if (constraint.id === Constraint.ids.FK) {
                        if (constraint.table === tablename) {
                            constraint.table = newname
                        }
                    }
                }
            }
        }

        Data.#data.databases[dbid].tables[tableid].name = newname

        if (iscurrent) {
            Data.currentTable = Data.#data.databases[dbid].tables[tableid]
        }

        Data.saveData()
    }

    static deleteTable(dbname, tablename) {
        const idx = Data.getTableIndex(dbname, tablename)
        if (idx === null) {
            return null
        }

        const { dbid, tableid } = idx

        Data.#data.databases[dbid].tables.splice(tableid, 1)
        Data.saveData()
    }

    static updateTableFields(dbname, tablename, newfields) {
        const idx = Data.getTableIndex(dbname, tablename)
        if (idx === null) {
            return false
        }

        const { dbid, tableid } = idx

        Data.#data.databases[dbid].tables[tableid].fields = newfields
        Data.saveData()

        return true
    }

    // TODO: Meant for testing purposes
    static getData() {
        return Data.#data
    }

    static loadData() {
        for (let db of Data.#data.databases) {
            Sidebar.addDB(db)
        }
    }
}

class MainDiv {
    static element = document.getElementsByTagName('main')[0]

    static #renameDBButton = document.getElementById('rename-db')
    // static #exportDBButton
    static #deleteDBButton = document.getElementById('delete-db')
    static #landingdbcreate = document.getElementById('landing-db-create')
    static #landingeropen = document.getElementById('landing-er-open')

    static #landingViewID = 'landing-view'
    static #dbViewID = 'db-view'
    static #tableViewID = 'table-view'

    static {
        MainDiv.#renameDBButton.onclick = async () => {
            const [ newname, oldname ] = await TextInput.openRenameDB(Data.currentDatabase.name)
            if (newname === null) {
                return
            }

            Data.renameDatabase(oldname, newname)
            Sidebar.renameDatabase(oldname, newname)
        }

        MainDiv.#deleteDBButton.onclick = async () => {
            const [ response, dbtodelete ] = await YesNoInput.deleteDB(Data.currentDatabase.name)

            if (response) {
                Data.deleteDatabase(dbtodelete)
                Data.currentDatabase = null
                Data.currentTable = null
                Sidebar.deleteDB(dbtodelete)
                MainDiv.showLandingView()
            }
        }

        MainDiv.#landingdbcreate.onclick = () => Sidebar.addDbButton.dispatchEvent(new MouseEvent('click'))

        MainDiv.#landingeropen.onclick = () => Sidebar.btnErd.dispatchEvent(new MouseEvent('click'))
    }

    static #showView(view_id) {
        MainDiv.element.querySelector(`main > div:not(#${escapeQuotes(view_id)}):not(.hidden)`)?.classList.add('hidden')
        MainDiv.element.querySelector(`main > div#${escapeQuotes(view_id)}.hidden`)?.classList.remove('hidden')
    }

    static showLandingView() {
        MainDiv.#showView(MainDiv.#landingViewID)
    }

    static showDBView(dbname) {
        const db = Data.getDB(dbname)
        if (db === null) {
            return
        }

        TablesTable.loadTable(db)

        Data.currentDatabase = db
        MainDiv.#showView(MainDiv.#dbViewID)
    }

    static showTableView(dbname, tablename) {
        const ids = Data.getDBAndTable(dbname, tablename)
        if (ids === null) {
            return
        }

        const { db, table } = ids

        Data.currentDatabase = db
        Data.currentTable = table

        FieldTable.loadTable(table)

        MainDiv.#showView(MainDiv.#tableViewID)
    }
}

Data.loadData()
