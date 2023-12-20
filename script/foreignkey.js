class FKPrompt {
    #element
    #modal
    #childtable
    #childfield
    #parenttable
    #parentfield
    #deletebtn
    #data = null

    #childtablename = null
    #parenttablename = null

    constructor(foreignkey_modal) {
        this.#modal = foreignkey_modal
        this.#element = this.#modal.element
        this.#childtable = this.#element.querySelector('#foreign-childtable')
        this.#childfield = this.#element.querySelector('#foreign-childfield')
        this.#parenttable = this.#element.querySelector('#foreign-parenttable')
        this.#parentfield = this.#element.querySelector('#foreign-parentfield')
        this.#deletebtn = this.#element.querySelector('.delete')

        this.#parenttable.onchange = () => this.#updateParentFieldsFromParentTable(this.#parenttable.value)

        modalForeign.setCancel(modalForeign.element.querySelector('.cancel'))
    }

    #updateParentFieldsFromParentTable(parenttablename) {
        this.#parenttablename = parenttablename
        this.#emptySelect(this.#parentfield)

        for (let field of data.tables[this.#parenttablename].fields) {
            this.#parentfield.appendChild(document.createElement('option'))
            this.#parentfield.lastElementChild.textContent = field.name
        }

        this.#parentfield.removeAttribute('disabled')
    }

    #setParentTable(parenttablename) {
        this.#parenttablename = parenttablename
        
        const tablechildren = Array.from(this.#parenttable.children)
        this.#parenttable.selectedIndex = tablechildren.indexOf(
            tablechildren.find(el => el.textContent == parenttablename)
        )

        this.#updateParentFieldsFromParentTable(this.#parenttablename)
    }

    #setParentField(parentfieldname) {
        const fieldchildren = Array.from(this.#parentfield.children)
        this.#parentfield.selectedIndex = fieldchildren.indexOf(
            fieldchildren.find(el => el.textContent == parentfieldname)
        )
    }

    #setOnUpdate(constraint) {
        this.#element.querySelector(`input[name="foreign-update"][value="${constraint}"]`).checked = true
    }

    #setOnDelete(constraint) {
        this.#element.querySelector(`input[name="foreign-delete"][value="${constraint}"]`).checked = true
    }

    #emptySelect(el) {
        while (el.lastElementChild) {
            el.lastElementChild.remove()
        }

        el.appendChild(document.createElement('option'))
        el.lastElementChild.classList.add('hidden')
    }

    #prepare(data, table_name, field_name) {
        this.#data = data
        this.#childtablename = table_name
        this.#childtable.textContent = table_name
        this.#childfield.textContent = field_name

        this.#parentfield.setAttribute('disabled', '')
        this.#emptySelect(this.#parenttable)

        for (let table in this.#data.tables) {
            if (table == table_name) continue
            this.#parenttable.appendChild(document.createElement('option'))
            this.#parenttable.lastElementChild.textContent = table
        }

        this.#emptySelect(this.#parentfield)
        this.#element.querySelectorAll('input[value="noaction"]').forEach(el => el.click())
    }

    #prompt() {
        return new Promise((res, rej) => {
            const tablesAmount = Object.keys(this.#data.tables).length
            if (tablesAmount == 0 || (tablesAmount == 1 && this.#data.tables.hasOwnProperty(this.#childtablename))) {
                alert('Crea un\'altra tabella prima di impostare le relazioni esterne!')
                rej()
                return
            }

            this.#modal.open()
        
            modalForeign.setConfirm(modalForeign.element.querySelector('.confirm'), () => {
                if (this.#parenttablename === null) {
                    alert('Inserisci una tabella')
                    rej()
                    return
                }

                if (this.#parentfield.value === '') {
                    alert('Inserisci un campo')
                    rej()
                    return
                }

                modalForeign.close()
                res({
                    table: this.#parenttablename,
                    field: this.#parentfield.value,
                    onupdate: this.#element.querySelector('input[name="foreign-update"]:checked').value,
                    ondelete: this.#element.querySelector('input[name="foreign-delete"]:checked').value
                })
            }, false)
        })
    }

    promptNew(data, table_name, field_name) {
        this.#prepare(data, table_name, field_name)
        this.#deletebtn.setAttribute('disabled', '')
        return this.#prompt()
    }

    promptEdit(data, table_name, field_name, status) {
        this.#prepare(data, table_name, field_name)
        this.#setParentTable(status.table)
        this.#setParentField(status.field)
        this.#setOnUpdate(status.onupdate)
        this.#setOnDelete(status.ondelete)
        this.#deletebtn.removeAttribute('delete')

        return this.#prompt()
    }
}