class TextInput {
    static #textInputEl = document.getElementById('modal-textinput')
    static #textInputModal 
    static #textInputTitle
    static #textInputInput
    static #textInputBtnOK
    static #textInputBtnCancel

    static {
        TextInput.#textInputModal = new Modal(TextInput.#textInputEl)
        TextInput.#textInputTitle = TextInput.#textInputEl.querySelector('.modal-title')
        TextInput.#textInputInput = TextInput.#textInputEl.querySelector('input')
        TextInput.#textInputBtnOK = TextInput.#textInputEl.querySelector('.confirm')
        TextInput.#textInputBtnCancel = TextInput.#textInputEl.querySelector('.cancel')
    }

    static async #open(title, buttonok, buttoncancel, defvalue = '', callbackvalue = null) {
        TextInput.#textInputTitle.textContent = title
        TextInput.#textInputBtnOK.textContent = buttonok
        TextInput.#textInputBtnCancel.textContent = buttoncancel
        TextInput.#textInputInput.value = defvalue
        TextInput.#textInputModal.open()

        return new Promise(res => {
            TextInput.#textInputModal.setConfirm(TextInput.#textInputBtnOK, () => res([TextInput.#textInputInput.value, callbackvalue]))
            TextInput.#textInputModal.setCancel(TextInput.#textInputBtnCancel, () => res([null, callbackvalue]))
        })
    }

    static async openNewDB() {
        return TextInput.#open('Crea Database', 'Crea', 'Annulla')
    }

    static async openNewTable() {
        return TextInput.#open('Crea Tabella', 'Crea', 'Annulla')
    }

    static async openRenameDB(oldname) {
        return TextInput.#open('Rinomina Database', 'Conferma', 'Annulla', oldname, oldname)
    }

    static async openRenameTable(oldname) {
        return TextInput.#open('Rinomina Tabella', 'Conferma', 'Annulla', oldname, oldname)
    }
}
