class TablesTable {
    static #dbAddRowButton = document.getElementById('db-add-row')
    static #tableList = document.querySelector('#db-tablelist > tbody')
    static #dbViewTableEntryTemplate = document.getElementById('dbview-table-entry')

    static {
        TablesTable.#dbAddRowButton.onclick = async () => {
            const [ tablename, _ ] = await TextInput.openNewTable()
            if (tablename === null) {
                return
            }

            Data.newTable(Data.currentDatabase.name, tablename)
        }
    }

    static #removeTableEntries() {
        TablesTable.#tableList.querySelectorAll(`tbody > tr:not(#${escapeQuotes(TablesTable.#dbAddRowButton.id)})`).forEach(el => {
            el.remove()
        })
    }
    
    static #addTableEntry(tablename) {
        const newel = TablesTable.#dbViewTableEntryTemplate.content.cloneNode(true).firstElementChild
        newel.setAttribute('tablename', tablename)
        newel.querySelector('.table-name').textContent = tablename

        newel.querySelector('.db-show-table').onclick = () => {
            Sidebar.selectTable(Data.currentDatabase.name, tablename)
        }

        newel.querySelector('.db-delete-table').onclick = async () => {
            const [ response, _ ] = await YesNoInput.deleteTable(Data.currentDatabase.name, tablename)

            if (response) {
                Data.deleteTable(Data.currentDatabase.name, tablename)
                Sidebar.deleteTable(Data.currentDatabase.name, tablename)
                TablesTable.#tableList.querySelector(`*[tablename="${escapeQuotes(tablename)}"]`).remove()
            }
        }

        TablesTable.#tableList.insertBefore(newel, TablesTable.#dbAddRowButton)
    }

    static loadTable(db) {
        TablesTable.#removeTableEntries()

        for (let table of db.tables) {
            TablesTable.#addTableEntry(table.name)
        }
    }

    static addTable(dbname, tablename) {
        if (dbname !== Data.currentDatabase?.name) {
            return
        }

        TablesTable.#addTableEntry(tablename)
    }
}

class FieldTable {
    static #rowTemplate = document.getElementById('table-row-template')
    static #rowEditTemplate = document.getElementById('table-row-edit-template')
    static #fieldList = document.querySelector('#table-fieldlist > tbody')
    static #addRowButton = document.getElementById('table-add-row')
    static #emptyMessage = document.getElementById('empty-fieldlist')
    static #tableActions = document.getElementById('table-actions')

    static #editButton = document.getElementById('edit-structure')
    static #renameButton = document.getElementById('rename-structure')
    static #deleteButton = document.getElementById('delete-structure')
    static #saveButton = document.getElementById('save-structure')
    static #discardButton = document.getElementById('discard-structure')

    static {
        FieldTable.#addRowButton.onclick = () => {
            FieldTable.#addEditRow()
        }

        FieldTable.#editButton.onclick = () => {
            FieldTable.loadTableEdit(Data.currentTable)
        }

        FieldTable.#renameButton.onclick = async () => {
            const [ newname, oldname ] = await TextInput.openRenameTable(Data.currentTable.name)
            if (newname === null) {
                return
            }

            Data.renameTable(Data.currentDatabase.name, oldname, newname)
            Sidebar.renameTable(Data.currentDatabase.name, oldname, newname)
        }

        FieldTable.#deleteButton.onclick = async () => {
            const [ response, { dbname, tablename } ] = await YesNoInput.deleteTable(Data.currentDatabase.name, Data.currentTable.name)

            if (response) {
                Data.deleteTable(dbname, tablename)
                Data.currentDatabase = null
                Data.currentTable = null
                Sidebar.deleteTable(dbname, tablename)
                MainDiv.showLandingView()
            }
        }

        FieldTable.#saveButton.onclick = FieldTable.#saveEdits

        FieldTable.#discardButton.onclick = () => {
            FieldTable.loadTable(Data.currentTable)
        }
    }

    static #saveEdits() {
        // TODO: Check if two fields have the same name

        let ai_amount = 0
        const fields = []

        for (let el of FieldTable.#fieldList.children) {
            if (el.id !== '') {
                continue
            }

            let constraints = []

            // TODO: Test what happens with special characters in foreign key constraints
            const fkConstraint = el.querySelector('.foreignkey')
            if (fkConstraint.getAttribute('disabled') === null) {
                constraints.push(new ForeignKeyConstraint(
                    fkConstraint.getAttribute('table'),
                    fkConstraint.getAttribute('field'),
                    fkConstraint.getAttribute('onupdate'),
                    fkConstraint.getAttribute('ondelete'),
                ))
            }

            if (el.querySelector('.primarykey').getAttribute('disabled') === null) {
                constraints.push(new PrimaryKeyConstraint)
            }

            if (el.querySelector('.nullable-constraint').checked) {
                constraints.push(new NullableConstraint)
            }

            if (el.querySelector('.unique-constraint').checked) {
                constraints.push(new UniqueConstraint)
            }

            const fieldName = el.querySelector('.entry-name-input').value
            const typeField = el.querySelector('.entry-type').parentElement

            if (fieldName === '') {
                ErrorModal.show('Almeno un campo non ha un nome')
                return
            }

            if (typeField.getAttribute('typeid') === null) {
                ErrorModal.show('Almeno un campo non ha un tipo')
                return
            }

            const fieldtype = new FieldType(
                Number(typeField.getAttribute('typeid')),
                typeField.getAttribute('typesizes').split(','),
                typeField.getAttribute('typeshowsizes').split(',')
            )

            if (el.querySelector('.ai-constraint').checked) {
                if (fieldtype.id !== FieldType.types.integer) {
                    ErrorModal.show('Solo i campi di tipo "intero" possono essere auto incrementali')
                    return
                }
                ai_amount++
                constraints.push(new AutoIncrementConstraint)
            }

            fields.push(new Field(
                fieldName,
                fieldtype,
                constraints
            ))
        }

        if (ai_amount > 1) {
            ErrorModal.show('Solo un campo può essere auto incrementale')
            return
        }

        Data.updateTableFields(Data.currentDatabase.name, Data.currentTable.name, fields)
        FieldTable.loadTable(Data.currentTable)
    }

    static #removeFieldEntries() {
        FieldTable.#fieldList.querySelectorAll('tbody > tr:not(.no-delete)').forEach(el => {
            el.remove()
        })
    }

    static #addRow(field) {
        const newel = FieldTable.#rowTemplate.content.cloneNode(true).firstElementChild

        for (let constraint of field.constraints) {
            if (constraint.id === Constraint.ids.FK) {
                newel.querySelector('.foreignkey').classList.remove('hidden')
                continue
            }

            newel.querySelector('.' + {
                [Constraint.ids.NULL]:   'nullable-constraint',
                [Constraint.ids.PK]:     'primarykey',
                [Constraint.ids.AI]:     'ai-constraint',
                [Constraint.ids.UNIQUE]: 'unique-constraint'
            }[constraint.id]).classList.toggle('hidden', !constraint.value)
        }

        newel.querySelector('.entry-name').textContent = field.name
        newel.querySelector('.entry-type').textContent = field.type.format()
        newel.querySelector('.entry-size').textContent = field.type.formatSizes()

        FieldTable.#fieldList.insertBefore(newel, FieldTable.#addRowButton)
    }

    static #toggleEditActions(status) {
        for (let el of FieldTable.#tableActions.children) {
            el.classList.toggle('hidden', el.classList.contains('show-edit') !== status)
        }
    }

    static #addEditRow(field = null) {
        const newel = FieldTable.#rowEditTemplate.content.cloneNode(true).firstElementChild
        const pkimg = newel.querySelector('.primarykey')
        const fkimg = newel.querySelector('.foreignkey')

        if (field !== null) {
            for (let constraint of field.constraints) {
                switch (constraint.id) {
                case Constraint.ids.NULL:
                    newel.querySelector('.nullable-constraint').checked = constraint.value
                    break

                case Constraint.ids.PK:
                    if (constraint.value) {
                        pkimg.removeAttribute('disabled')
                    }

                    break

                case Constraint.ids.AI:
                    newel.querySelector('.ai-constraint').checked = constraint.value
                    break

                case Constraint.ids.UNIQUE:
                    newel.querySelector('.unique-constraint').checked = constraint.value
                    break

                case Constraint.ids.FK:
                    fkimg.removeAttribute('disabled')

                    fkimg.setAttribute('table', constraint.table)
                    fkimg.setAttribute('field', constraint.field)
                    fkimg.setAttribute('onupdate', constraint.onupdate)
                    fkimg.setAttribute('ondelete', constraint.ondelete)

                    break
                }
            }

            newel.querySelector('.entry-name-input').value = field.name

            const entryType = newel.querySelector('.entry-type')
            entryType.textContent = field.type.format()
            entryType.parentElement.setAttribute('typeid', String(field.type.id))
            entryType.parentElement.setAttribute('typesizes', field.type.sizes.join(','))
            entryType.parentElement.setAttribute('typeshowsizes', field.type.showsizes.join(','))

            newel.querySelector('.entry-size').textContent = field.type.formatSizes()
        }

        newel.querySelector('.table-delete-field').onclick = () => {
            newel.remove()
        }
                    
        fkimg.onclick = () => {
            let prom = null
            if (fkimg.getAttribute('table') !== null) {
                prom = FKPrompt.promptEdit(
                    Data.currentDatabase.tables,
                    Data.currentTable.name,
                    newel.querySelector('.entry-name-input').value,
                    {
                        table: fkimg.getAttribute('table'),
                        field: fkimg.getAttribute('field'),
                        onupdate: fkimg.getAttribute('onupdate'),
                        ondelete: fkimg.getAttribute('ondelete'),
                    }
                )
            } else {
                prom = FKPrompt.promptNew(
                    Data.currentDatabase.tables,
                    Data.currentTable.name,
                    newel.querySelector('.entry-name-input').value
                )
            }

            prom.then(res => {
                if (!res.status) {
                    fkimg.removeAttribute('table')
                    fkimg.removeAttribute('field')
                    fkimg.removeAttribute('onupdate')
                    fkimg.removeAttribute('ondelete')

                    fkimg.setAttribute('disabled', '')
                    return
                }

                fkimg.setAttribute('table', res.table)
                fkimg.setAttribute('field', res.field)
                fkimg.setAttribute('onupdate', res.onupdate)
                fkimg.setAttribute('ondelete', res.ondelete)
                fkimg.removeAttribute('disabled')

            }).catch(() => {})
        }

        pkimg.onclick = () => {
            if (pkimg.getAttribute('disabled') !== null) {
                pkimg.removeAttribute('disabled')
            } else {
                pkimg.setAttribute('disabled', '')
            }
        }

        const editTypeEl = newel.querySelector('.entry-edit-type')
        editTypeEl.onclick = async () => {
            const previous = {}
            if (editTypeEl.parentElement.getAttribute('typeid') !== null) {
                previous.id = editTypeEl.parentElement.getAttribute('typeid')
                previous.sizes = editTypeEl.parentElement.getAttribute('typesizes').split(',')
                previous.showsizes = editTypeEl.parentElement.getAttribute('typeshowsizes').split(',')
            }

            TypePrompt.getType(previous).then(res => {
                editTypeEl.parentElement.setAttribute('typeid', res.id)
                editTypeEl.parentElement.setAttribute('typesizes', res.sizes.join(','))
                editTypeEl.parentElement.setAttribute('typeshowsizes', res.showsizes.join(','))

                newel.querySelector('.entry-type').textContent = res.format()
                newel.querySelector('.entry-size').textContent = res.formatSizes()

            }).catch(() => {})
        }

        FieldTable.#fieldList.insertBefore(newel, FieldTable.#addRowButton)
    }

    static loadTable(table) {
        FieldTable.#toggleEditActions(false)
        FieldTable.#fieldList.classList.remove('editing')
        FieldTable.#emptyMessage.classList.toggle('hidden', table.fields.length !== 0)
        FieldTable.#addRowButton.classList.add('hidden')

        FieldTable.#removeFieldEntries()

        for (let field of table.fields) {
            FieldTable.#addRow(field)
        }
    }

    static loadTableEdit(table) {
        FieldTable.#toggleEditActions(true)
        FieldTable.#fieldList.classList.add('editing')
        FieldTable.#emptyMessage.classList.add('hidden')
        FieldTable.#addRowButton.classList.remove('hidden')

        FieldTable.#removeFieldEntries()
        
        for (let field of table.fields) {
            FieldTable.#addEditRow(field)
        }
    }
}
