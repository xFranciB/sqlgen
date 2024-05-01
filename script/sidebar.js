class Sidebar {
    static #dbContainer = document.getElementById('db-container')
    static #dbEntryTemplate = document.getElementById('db-entry-template')
    static #tableEntryTemplate = document.getElementById('table-entry-template')
    static addDbButton = document.getElementById('btn-createdb')
    static btnErd = document.getElementById('btn-erd')

    static {
        Sidebar.addDbButton.onclick = async () => {
            const [ dbname, _ ] = await TextInput.openNewDB()
            if (dbname === null) {
                return
            }

            Data.newDB(dbname)
        }

        Sidebar.btnErd.onclick = () => erModal.open()
    }

    static #selectDB(name, element) {
        Sidebar.#dbContainer.querySelector(`.active:not([dbname="${escapeQuotes(name)}"])`)?.classList.remove('active')
        element.classList.add('active')
        MainDiv.showDBView(name)
    }

    static selectTable(dbname, tablename) {
        Sidebar.#toggleExpandDB(dbname)
        Sidebar.#dbContainer.querySelector(`.active:not([tablename="${escapeQuotes(tablename)}"])`)?.classList.remove('active')
        Sidebar.#dbContainer.querySelector(`*[tablename="${escapeQuotes(tablename)}"]`).classList.add('active')
        Sidebar.#dbContainer.querySelector(`.db-entry[dbname="${escapeQuotes(dbname)}"]`).classList.add('expanded')
        MainDiv.showTableView(dbname, tablename)
    }

    static #toggleExpandDB(dbname) {
        const el = Sidebar.#dbContainer.querySelector(`.db-entry[dbname="${escapeQuotes(dbname)}"]`)

        if (el.classList.contains('expanded')) {
            // TODO: Handle hiding the tables
            el.classList.remove('expanded')
        } else {
            // TODO: Handle showing the tables
            Sidebar.#dbContainer.querySelector('.db-entry.expanded')?.classList.remove('expanded')
            el.classList.add('expanded')
        }
    }

    static addDB(db) {
        const newel = Sidebar.#dbEntryTemplate.content.cloneNode(true).firstElementChild
        newel.querySelector('span').textContent = db.name
        newel.setAttribute('dbname', db.name)

        newel.querySelector('.db-button').onclick = e => {
            if (
                e.target.matches('.db-entry-expand, .db-entry-expand *') ||
                e.target.matches('.db-entry-create-table, .db-entry-create-table *')
            ) {
                return
            }

            Sidebar.#selectDB(db.name, newel)
        }

        const newelExpand = newel.querySelector('.db-entry-expand')
        newelExpand.onclick = () => Sidebar.#toggleExpandDB(db.name)

        const newTable = newel.querySelector('.db-entry-create-table')

        newTable.onclick = async () => {
            const [ tablename, _ ] = await TextInput.openNewTable()
            if (tablename === null) {
                return
            }

            Data.newTable(db.name, tablename)
        }

        Sidebar.#dbContainer.appendChild(newel)

        for (let table of db.tables) {
            Sidebar.addTable(db.name, table)
        }
    }

    static addTable(dbname, table) {
        const tableContainer = Sidebar.#dbContainer.querySelector(`.db-entry[dbname="${escapeQuotes(dbname)}"] .db-tables`)

        const newel = Sidebar.#tableEntryTemplate.content.cloneNode(true).firstElementChild
        newel.querySelector('span').textContent = table.name
        newel.setAttribute('tablename', table.name)
        newel.onclick = () => Sidebar.selectTable(dbname, table.name)

        TablesTable.addTable(dbname, table.name)

        tableContainer.appendChild(newel)
    }

    static renameDatabase(oldname, newname) {
        const el = Sidebar.#dbContainer.querySelector(`.db-entry[dbname="${escapeQuotes(oldname)}"]`)

        if (el === null) {
            // NOTE: This is a big error and should never happen
            return
        }

        el.setAttribute('dbname', newname)
        el.querySelector('span').textContent = newname
    }

    static deleteDB(dbname) {
        Sidebar.#dbContainer.querySelector(`.db-entry[dbname="${escapeQuotes(dbname)}"]`)?.remove()
    }

    static renameTable(dbname, oldname, newname) {
        const el = Sidebar.#dbContainer.querySelector(`.db-entry[dbname="${escapeQuotes(dbname)}"] *[tablename="${escapeQuotes(oldname)}"]`)

        if (el === null) {
            // NOTE: This is a big error and should never happen
            return
        }

        el.setAttribute('tablename', newname)
        el.querySelector('span').textContent = newname
    }

    static deleteTable(dbname, tablename) {
        Sidebar.#dbContainer.querySelector(`.db-entry[dbname="${escapeQuotes(dbname)}"] *[tablename="${escapeQuotes(tablename)}"]`)?.remove()
    }

    static reset() {
        Sidebar.#dbContainer.querySelectorAll('.db-entry').forEach(el => el.remove())
    }
}
