class FKPrompt {
    #element
    #modal
    #childtable
    #childfield
    #parenttable
    #parentfield
    #data = null

    constructor(foreignkey_modal) {
        this.#modal = foreignkey_modal
        this.#element = this.#modal.element
        this.#childtable = this.#element.querySelector('#foreign-childtable')
        this.#childfield = this.#element.querySelector('#foreign-childfield')
        this.#parenttable = this.#element.querySelector('#foreign-parenttable')
        this.#parentfield = this.#element.querySelector('#foreign-parentfield')

        this.#parenttable.onchange = () => {
            this.#emptySelect(this.#parentfield)
            const tablename = this.#parenttable.value

            for (let field of data.tables[tablename].fields) {
                this.#parentfield.appendChild(document.createElement('option'))
                this.#parentfield.lastElementChild.textContent = field.name
            }

            // Check if types match
            // FKPrompt.#arraysEqual
        }
    }

    // Maybe make this global in some helper class?
    static #arraysEqual(arr1, arr2) {
        // NOT IMPLEMENTED
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
            res('')
        })
    }
}

const fkprompt = new FKPrompt(new Modal(document.getElementById('modal-foreign')))
fkprompt.prompt(
    data,
    'animale',
    1
).then(console.log)