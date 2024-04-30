class FKPrompt {
    static #element = document.getElementById('modal-foreign')
    static #modal
    static #childtable
    static #childfield
    static #parenttable
    static #parentfield
    static #deletebtn
    static #tables = null

    static #childtablename = null
    static #parenttablename = null

    static {
        FKPrompt.#modal = new Modal(FKPrompt.#element)
        FKPrompt.#childtable = FKPrompt.#element.querySelector('#foreign-childtable')
        FKPrompt.#childfield = FKPrompt.#element.querySelector('#foreign-childfield')
        FKPrompt.#parenttable = FKPrompt.#element.querySelector('#foreign-parenttable')
        FKPrompt.#parentfield = FKPrompt.#element.querySelector('#foreign-parentfield')
        FKPrompt.#deletebtn = FKPrompt.#element.querySelector('.delete')

        FKPrompt.#parenttable.onchange = () => FKPrompt.#updateParentFieldsFromParentTable(FKPrompt.#parenttable.value)

        FKPrompt.#modal.setCancel(FKPrompt.#modal.element.querySelector('.cancel'))
    }

    static #updateParentFieldsFromParentTable(parenttablename) {
        FKPrompt.#parenttablename = parenttablename
        FKPrompt.#emptySelect(FKPrompt.#parentfield)

        let parentid = null
        for (let i = 0; i < FKPrompt.#tables.length; i++) {
            if (FKPrompt.#tables[i].name === FKPrompt.#parenttablename) {
                parentid = i
                break
            }
        }

        for (let field of FKPrompt.#tables[parentid].fields) {
            FKPrompt.#parentfield.appendChild(document.createElement('option'))
            FKPrompt.#parentfield.lastElementChild.textContent = field.name
        }

        FKPrompt.#parentfield.removeAttribute('disabled')
    }

    static #setParentTable(parenttablename) {
        FKPrompt.#parenttablename = parenttablename

        const tablechildren = Array.from(FKPrompt.#parenttable.children)
        FKPrompt.#parenttable.selectedIndex = tablechildren.indexOf(
            tablechildren.find(el => el.textContent == parenttablename)
        )

        console.log(FKPrompt.#parenttablename)
        FKPrompt.#updateParentFieldsFromParentTable(FKPrompt.#parenttablename)
    }

    static #setParentField(parentfieldname) {
        const fieldchildren = Array.from(FKPrompt.#parentfield.children)
        FKPrompt.#parentfield.selectedIndex = fieldchildren.indexOf(
            fieldchildren.find(el => el.textContent == parentfieldname)
        )
    }

    static #setOnUpdate(constraint) {
        FKPrompt.#element.querySelector(`input[name="foreign-update"][value="${escapeQuotes(constraint)}"]`).checked = true
    }

    static #setOnDelete(constraint) {
        FKPrompt.#element.querySelector(`input[name="foreign-delete"][value="${escapeQuotes(constraint)}"]`).checked = true
    }

    static #emptySelect(el) {
        while (el.lastElementChild) {
            el.lastElementChild.remove()
        }

        el.appendChild(document.createElement('option'))
        el.lastElementChild.classList.add('hidden')
    }

    static #prepare(tables, table_name, field_name) {
        FKPrompt.#tables = tables
        FKPrompt.#childtablename = table_name
        FKPrompt.#childtable.textContent = table_name
        FKPrompt.#childfield.textContent = field_name

        FKPrompt.#parentfield.setAttribute('disabled', '')
        FKPrompt.#emptySelect(FKPrompt.#parenttable)

        for (let table of FKPrompt.#tables) {
            if (table.name == table_name) continue
            FKPrompt.#parenttable.appendChild(document.createElement('option'))
            FKPrompt.#parenttable.lastElementChild.textContent = table.name
        }

        FKPrompt.#emptySelect(FKPrompt.#parentfield)
        FKPrompt.#element.querySelectorAll('input[value="noaction"]').forEach(el => el.click())
    }

    static #prompt() {
        return new Promise((res, rej) => {
            const tablesAmount = FKPrompt.#tables.length
            if (tablesAmount == 0 || (tablesAmount == 1 && FKPrompt.#tables[0].name == FKPrompt.#childtablename)) {
                ErrorModal.show('Crea un\'altra tabella prima di impostare le relazioni esterne!')
                rej()
                return
            }

            FKPrompt.#modal.open()

            FKPrompt.#modal.setConfirm(FKPrompt.#modal.element.querySelector('.confirm'), () => {
                if (FKPrompt.#parenttablename === null) {
                    ErrorModal.show('Inserisci una tabella')
                    return
                }

                if (FKPrompt.#parentfield.value === '') {
                    ErrorModal.show('Inserisci un campo')
                    return
                }

                FKPrompt.#modal.close()
                res({
                    status: true,
                    table: FKPrompt.#parenttablename,
                    field: FKPrompt.#parentfield.value,
                    onupdate: FKPrompt.#element.querySelector('input[name="foreign-update"]:checked').value,
                    ondelete: FKPrompt.#element.querySelector('input[name="foreign-delete"]:checked').value
                })
            }, false)

            FKPrompt.#deletebtn.onclick = () => {
                FKPrompt.#modal.close()

                res({
                    status: false
                })
            }
        })
    }

    static promptNew(tables, table_name, field_name) {
        FKPrompt.#prepare(tables, table_name, field_name)
        FKPrompt.#deletebtn.classList.add('hidden')
        return FKPrompt.#prompt()
    }

    static promptEdit(tables, table_name, field_name, status) {
        FKPrompt.#prepare(tables, table_name, field_name)
        FKPrompt.#setParentTable(status.table)
        FKPrompt.#setParentField(status.field)
        FKPrompt.#setOnUpdate(status.onupdate)
        FKPrompt.#setOnDelete(status.ondelete)
        FKPrompt.#deletebtn.classList.remove('hidden')

        return FKPrompt.#prompt()
    }
}
