const tbody = document.querySelector('#table-structure tbody')
const tableRowTemplate = document.getElementById('table-row-template')
const addRowBtn = document.getElementById('add-row')
const saveButton = document.getElementById('save-structure')
const editButton = document.getElementById('edit-structure')
const discardStructure = document.getElementById('discard-structure')
const exportStructure = document.getElementById('export-structure')
const modalForeign = new Modal(document.getElementById('modal-foreign'))
const fkprompt = new FKPrompt(modalForeign)
let isEditing = false

const setType = (row, res) => {
    if (res === null || res.type === null) {
        return
    }

    const entryType = row.querySelector('.entry-type')
    entryType.setAttribute('type', JSON.stringify(res))
    entryType.textContent = formatType(res.type)

    const autoincrement = row.querySelector('.ai-constraint')

    if (res.type == 'integer') {
        autoincrement.removeAttribute('disabled')
    } else {
        autoincrement.setAttribute('disabled', '')
    }

    const entrySize = row.querySelector('.entry-size')
    entrySize.textContent = res.showsizes?.join(', ')
}

const editType = async (row) => {
    const res = await getType()
    setType(row, res)
}

const togglePrimaryKey = el => {
    if (!isEditing) return

    if (el.getAttribute('disabled') === '') {
        el.removeAttribute('disabled')
    } else {
        el.setAttribute('disabled', '')
    }
}

const editOnRow = row => {
    if (row.nextElementSibling === null) return
    if (row.getAttribute('editing') == 'true') return
    row.setAttribute('editing', 'true')

    const entryName = row.querySelector('.entry-name')
    const entryNameInput = row.querySelector('.entry-name-input')

    entryNameInput.value = entryName.textContent

    for (let tmp of row.querySelectorAll('td:first-child > img.hidden')) {
        tmp.classList.remove('hidden')
        tmp.setAttribute('disabled', '')
    }

    for (let tmp of row.querySelectorAll('td:nth-child(-n+3) .hidden')) {
        tmp.classList.remove('hidden')
    }

    for (let tmp of row.querySelectorAll('img.constraint')) {
        if (!tmp.classList.contains('hidden')) {
            tmp.previousElementSibling.checked = true
        }
        
        tmp.previousElementSibling.classList.remove('hidden')
        tmp.classList.add('hidden')
    }

    entryName.classList.add('hidden')
}

const editOn = () => {
    isEditing = true
    saveButton.classList.remove('hidden')
    discardStructure.classList.remove('hidden')
    editButton.classList.add('hidden')
    exportStructure.classList.add('hidden')
    deleteStructure.classList.add('hidden')
    
    addRowBtn.classList.remove('hidden')
    const rows = document.querySelectorAll('#table-structure tbody tr')

    for (let row of rows) {
        editOnRow(row)
    }
}

const addEmptyRow = () => {
    const newel = tableRowTemplate.content.cloneNode(true).firstElementChild
    newel.querySelector('.primarykey').onclick = e => {
        togglePrimaryKey(e.target)
    }

    // TODO: Handle editing and deleting
    // TODO: Handle saving to `data` array and to LocalStorage
    // TODO: Handle SQL exporting
    newel.querySelector('.foreignkey').onclick = e => {
        // New constraint
        if (e.target.getAttribute('table') === null) {
            fkprompt.promptNew(
                data,
                currentTable,
                newel.querySelector('.entry-name').textContent
            ).then(res => {
                /**
                 * res = {
                 *  table: "padrone", 
                 *  field: "ID",
                 *  onupdate: "cascade",
                 *  ondelete: "setnull"
                 * }
                 */
    
                e.target.setAttribute('table', res.table)
                e.target.setAttribute('field', res.field)
                e.target.setAttribute('onupdate', res.onupdate)
                e.target.setAttribute('ondelete', res.ondelete)
                e.target.removeAttribute('disabled')
            }).catch(() => {})

            return
        }

        // Edit constraint
        fkprompt.promptEdit(
            data,
            currentTable,
            newel.querySelector('.entry-name').textContent,
            {
                table: e.target.getAttribute('table'),
                field: e.target.getAttribute('field'),
                onupdate: e.target.getAttribute('onupdate'),
                ondelete: e.target.getAttribute('ondelete')
            }
        ).then(res => {
            //
        }).catch(() => {})
    }

    newel.querySelector('.entry-edit-type').onclick = () => {
        editType(newel)
    }

    return tbody.insertBefore(newel, tbody.lastElementChild)
}

const addRow = (rowdata) => {
    const row = addEmptyRow()
    row.querySelector('.entry-name').textContent = rowdata.name

    for (let c in rowdata.constraints) {
        switch (c) {
        case 'NULL':
            row.querySelector('img.nullable-constraint').classList.remove('hidden')
            break

        case 'PK': 
            row.querySelector('img.primarykey').classList.remove('hidden')
            break

        case 'AI':
            row.querySelector('img.ai-constraint').classList.remove('hidden')
            break

        case 'UNIQUE':
            row.querySelector('img.unique-constraint').classList.remove('hidden')
            break

        case 'FK':
            row.querySelector('img.foreignkey-constraint').classList.remove('hidden')
            break
        }
    }

    setType(row, rowdata.type)
}

const editOff = () => {
    isEditing = false
    saveButton.classList.add('hidden')
    discardStructure.classList.add('hidden')
    editButton.classList.remove('hidden')
    exportStructure.classList.remove('hidden')
    deleteStructure.classList.remove('hidden')

    const rows = document.querySelectorAll('#table-structure tbody tr')
    addRowBtn.classList.add('hidden')

    for (let i = 0; i < rows.length - 1; i++) {
        const row = rows[i]
        if (row.getAttribute('editing') != 'true') return
        row.removeAttribute('editing')

        for (let tmp of row.querySelectorAll('td:first-child > img[disabled]')) {
            tmp.removeAttribute('disabled')
            tmp.classList.add('hidden')
        }

        const entryNameInput = row.querySelector('.entry-name-input')
        const entryName = row.querySelector('.entry-name')
        entryName.textContent = entryNameInput.value
        entryNameInput.classList.add('hidden')
        entryName.classList.remove('hidden')

        row.querySelector('.entry-edit-type').classList.add('hidden')

        for (let check of row.querySelectorAll('input[type="checkbox"]')) {
            if (check.checked && check.getAttribute('disabled') !== '') {
                check.nextElementSibling.classList.remove('hidden')
                check.checked = false
            }

            check.classList.add('hidden')
        }
    }
}

const clearTable = () => {
    const rows = document.querySelectorAll('#table-structure tbody tr')

    for (let i = 0; i < rows.length - 1; i++) {
        rows[i].remove()
    }
}

addRowBtn.onclick = () => {
    editOnRow(addEmptyRow())
}

saveButton.onclick = () => {
    const rows = document.querySelectorAll('#table-structure tbody tr')
    const fields = []

    for (let i = 0; i < rows.length - 1; i++) {
        const row = rows[i]

        const field = {}
        const primarykey = row.querySelector('img.primarykey[disabled]') === null

        const entryNameInput = row.querySelector('.entry-name-input')
        field['name'] = entryNameInput.value

        field['type'] = JSON.parse(row.querySelector('.entry-type').getAttribute('type'))
        field.constraints = {}

        if (primarykey) field.constraints = {...field.constraints, ...Constraint.primarykey()}

        for (let check of row.querySelectorAll('input[type="checkbox"]')) {
            if (check.checked && check.getAttribute('disabled') !== '') {
                field.constraints = {...field.constraints, ...Constraint[check.classList[0].split('-constraint')[0]]()}
            }
        }

        fields.push(field)
    }

    const errorstrings = [
        '- La lunghezza massima per un campo è di 64',
        '- Può esserci soltanto un campo auto incrementale',
        '- Due o più campi hanno lo stesso nome',
        '- Almeno un campo non ha un nome',
        '- Almeno un campo non ha un tipo'
    ]

    const errors = {}

    let autoincrementfields = 0
    const fieldnames = []
    for (let field of fields) {
        if (field.constraints.hasOwnProperty('AI') && field.constraints.AI.value) {
            autoincrementfields++
        }

        if (field.name.length > 65) {
            errors[0] = true
        } else if (field.name.length == '') {
            errors[3] = true
        }

        if (field.type == null) {
            errors[4] = true
        }

        fieldnames.push(field.name)
    }

    if (autoincrementfields > 1) {
        errors[1] = 0
    }

    if (fieldnames.some((el, i) =>
        fieldnames.indexOf(el) !== i
    )) {
        errors[2] = true
    }

    if (Object.keys(errors).length > 0) {
        alert('Si sono verificati i seguenti errori:\n' +
            Object.keys(errors).map(el => errorstrings[el]).join('\n')
        )

    } else {
        editOff()
        updateTableFields(currentTable, fields)
    }
}

discardStructure.onclick = () => {
    saveButton.classList.add('hidden')
    discardStructure.classList.add('hidden')
    editButton.classList.remove('hidden')
    exportStructure.classList.remove('hidden')
    deleteStructure.classList.remove('hidden')

    editOff()
    clearTable()
    loadTable(currentTable)
}

const loadTable = name => {
    for (let field of data.tables[name].fields) {
        addRow(field)
    }
}

editButton.onclick = editOn