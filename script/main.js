/*
    Formato data:

    Constraints {
        NULL: {value: bool} |
        PK: {value: bool} |
        AI: {value: bool, start: 1} |
        UNIQUE: {value: bool} |
        FK: {table: string, field: string, <update | delete>: <noaction | cascade | set null>} 
    }

    // https://dev.mysql.com/doc/workbench/en/wb-migration-database-mssql-typemapping.html
    Type {
        // numbers
        tinyint (8 bit)
        smallint (16 bit)
        mediumint (24 bit, mysql only)
        int (32 bit)
        bigint (64 bit)
        decimal (p, s => 1 to 38 for ms and to 56 for mysql)
        bit (s => max size for sql, ms is size 1)

        // floating points
        single (4 byte; float on mysql, real on microsoft)
        double (8 byte; double on mysql, float on microsoft)

        // date and time
        date (date on both)
        datetime (datetime on both)
        time (time on both)

        // characters
        char (just 1. char(1) on microsoft, char on mysql)
        varchar (1 to 2^31-1 on microsoft, 1 to 65535 on mysql, then text)
        text (1 to 2^31-1 on microsoft, texts on mysql)
    }

    Field {
        name: string,
        type: Type,
        constraints: Constraints[]
    }

    data = {
        tables: {
            name: {
                fields: Field[]
                // data: ...
            }
        }
    }

*/

const imageBase = 'img/'

const main = document.getElementsByTagName('main')[0]

const addTableBtn = document.getElementById('btn-createtable')
const exportBtn = document.getElementById('export-button')
const entryTemplate = document.getElementById('table-entry-template')
const tableContainer = document.getElementById('table-container')
const targetSelect = document.getElementById('target-select')
const databaseLogo = document.getElementById('database-logo')
const deleteStructure = document.getElementById('delete-structure')

let currentTable = null
let data = JSON.parse(localStorage.getItem('data'))?? {tables: {}}

class Constraint {
    static action = {
        ignore: 'ignore',
        setnull: 'setnull',
        cascade: 'cascade'
    }

    static nullable() {
        return {'NULL': {value: true}}
    }

    static primarykey() {
        return {'PK': {value: true}}
    }

    static ai(startpos = 1) { // >= 1
        return {'AI': {value: true, start: startpos}}
    }

    static unique() {
        return {'UNIQUE': {value: true}}
    }

    static external(table, field, onupdate = '', ondelete = '') {
        const fields = {}

        if (onupdate != '') fields.update = onupdate
        if (ondelete != '') fields.delete = ondelete
        return {'FK': {table: table, field: field, ...fields}}
    }
}

const saveData = () => {
    localStorage.setItem('data', JSON.stringify(data))
}

const addTable = (name, onlyel = false) => {
    if (!onlyel) {
        if (Object.keys(data.tables).some(el => el == name)) {
            alert('La tabella esiste già')
            // error
            return
        }

        data.tables[name] = {fields: []}
        saveData()
    }

    const newel = entryTemplate.content.cloneNode(true).firstElementChild
    newel.querySelector('span').textContent = name
    newel.setAttribute('name', name)
    newel.onclick = () => {
        if (isEditing) return
        main.classList.remove('hidden')
        currentTable = name
        tableContainer.querySelector('.active')?.classList.remove('active')
        newel.classList.add('active')
        clearTable()
        loadTable(name)
    }

    tableContainer.appendChild(newel)
}

const updateTableFields = (table, fields) => {
    data.tables[table].fields = [...fields]
    saveData()
}

const deleteTable = (table) => {
    delete data.tables[table]
    saveData()
}

const loadData = () => {
    for (let table in data.tables) {
        addTable(table, true)
    }
}

loadData()

const addTableEl = document.getElementById('modal-createtable')
const addTableModal = new Modal(addTableEl)
addTableModal.setCancel(addTableEl.querySelector('.cancel'))
addTableModal.setConfirm(addTableEl.querySelector('.confirm'), () => {
    addTable(addTableEl.querySelector('input').value)
})

addTableBtn.onclick = () => {addTableModal.open()}

targetSelect.onchange = () => {
    databaseLogo.src = imageBase + targetSelect.value + '.svg'
}

targetSelect.dispatchEvent(new InputEvent('change'))

const exportEl = document.getElementById('modal-export')
const exportElTitle = exportEl.querySelector('.modal-title')
const exportarea = exportEl.querySelector('textarea')
const exportModal = new Modal(exportEl)
exportModal.setCancel(exportEl.querySelector('.cancel'))
exportModal.setConfirm(exportEl.querySelector('.confirm'), () => {
    const table = exportEl.getAttribute('table')

    const target = {access: MicrosoftSQL, mysql: MySQL}[targetSelect.value]

    if (table === null) {
        exportarea.value = target.all(data.tables)
    } else {
        exportarea.value = target.table(table, data.tables[table])
    }
}, false)

exportBtn.onclick = () => {
    exportElTitle.textContent = 'Esporta SQL'
    exportEl.removeAttribute('table')
    exportarea.value = ''
    exportModal.open()
}

exportStructure.onclick = () => {
    exportElTitle.textContent = 'Esporta tabella'
    exportEl.setAttribute('table', currentTable)
    exportarea.value = ''
    exportModal.open()
}

const deleteTableEl = document.getElementById('modal-delete-table')
const deleteTableModal = new Modal(deleteTableEl)
deleteTableModal.setCancel(deleteTableEl.querySelector('.cancel'))
deleteTableModal.setConfirm(deleteTableEl.querySelector('.confirm'), () => {
    main.classList.add('hidden')
    clearTable()
    deleteTable(currentTable)
    tableContainer.querySelector(`div[name="${currentTable}"]`).remove()
    currentTable = null
})

deleteStructure.onclick = () => {
    deleteTableModal.open()
}

const btnErd = document.getElementById('btn-erd')
const erdModalEl = document.getElementById('modal-er')
const erModal = new Modal(erdModalEl)
const erd = new ERDiagram(
    document.getElementById('er-diagram'),
    true,
    document.getElementById('modal-createassoc'),
    document.getElementById('er-createentity'),
    document.getElementById('er-createrelation'),
    document.getElementById('modal-edititem'),
    document.getElementById('er-exportimage')
)

erModal.setCancel(erdModalEl.querySelector('.cancel'))
erModal.setConfirm(erdModalEl.querySelector('.confirm'), () => {
    alert('Ok')
}, false)

erd.toggleDragging(true)
erd.redraw()
btnErd.onclick = () => erModal.open()