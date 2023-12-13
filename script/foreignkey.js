class FKPrompt {
    #element
    #modal
    #childtable
    #childfield
    #parenttable
    #parentfield
    #data = null

    #childtablename = null
    #parenttablename = null
    #childfieldid = null

    constructor(foreignkey_modal) {
        this.#modal = foreignkey_modal
        this.#element = this.#modal.element
        this.#childtable = this.#element.querySelector('#foreign-childtable')
        this.#childfield = this.#element.querySelector('#foreign-childfield')
        this.#parenttable = this.#element.querySelector('#foreign-parenttable')
        this.#parentfield = this.#element.querySelector('#foreign-parentfield')

        this.#parenttable.onchange = () => {
            this.#parenttablename = this.#parenttable.value
            this.#emptySelect(this.#parentfield)

            for (let field of data.tables[this.#parenttablename].fields) {
                this.#parentfield.appendChild(document.createElement('option'))
                this.#parentfield.lastElementChild.textContent = field.name
            }
        }

        modalForeign.setCancel(modalForeign.element.querySelector('.cancel'))
    }

    // Maybe make this global in some helper class?
    static #arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false

        for (let x in arr1)
            if (arr1[x] !== arr2[x]) return false

        return true
    }

    #emptySelect(el) {
        while (el.lastElementChild) {
            el.lastElementChild.remove()
        }

        el.appendChild(document.createElement('option'))
        el.lastElementChild.classList.add('hidden')
    }

    prompt(data, table_name, fieldid) {
        this.#data = data
        this.#childfieldid = fieldid
        this.#childtablename = table_name
        this.#childtable.textContent = table_name
        this.#childfield.textContent = data.tables[table_name].fields[fieldid].name

        this.#emptySelect(this.#parenttable)

        for (let table in data.tables) {
            if (table == table_name) continue
            this.#parenttable.appendChild(document.createElement('option'))
            this.#parenttable.lastElementChild.textContent = table
        }

        this.#emptySelect(this.#parentfield)
        this.#element.querySelectorAll('input[value="noaction"]').forEach(el => el.click())

        this.#modal.open()

        return new Promise((res, rej) => {
            modalForeign.setConfirm(modalForeign.element.querySelector('.confirm'), () => {
                if (this.#parenttablename === null) return


                modalForeign.close()
                res()
            }, false)
        })
    }
}

const modalForeign = new Modal(document.getElementById('modal-foreign'))

const fkprompt = new FKPrompt(modalForeign)

fkprompt.prompt(
    data,
    'animali',
    1
).then(console.log)