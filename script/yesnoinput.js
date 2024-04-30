class YesNoInput {
    static #yesNoEl = document.getElementById('modal-yesnoinput')
    static #yesNoModal 
    static #yesNoTitle
    static #yesNoBody
    static #yesNoBtnOK
    static #yesNoBtnCancel

    static {
        YesNoInput.#yesNoModal = new Modal(YesNoInput.#yesNoEl)
        YesNoInput.#yesNoTitle = YesNoInput.#yesNoEl.querySelector('.modal-title')
        YesNoInput.#yesNoBody = YesNoInput.#yesNoEl.querySelector('.modal-body')
        YesNoInput.#yesNoBtnOK = YesNoInput.#yesNoEl.querySelector('.confirm')
        YesNoInput.#yesNoBtnCancel = YesNoInput.#yesNoEl.querySelector('.cancel')
    }

    static async #open(title, description, buttonok, buttoncancel, callbackvalue) {
        YesNoInput.#yesNoTitle.textContent = title
        YesNoInput.#yesNoBody.textContent = description
        YesNoInput.#yesNoBtnOK.textContent = buttonok
        YesNoInput.#yesNoBtnCancel.textContent = buttoncancel
        YesNoInput.#yesNoModal.open()

        return new Promise(res => {
            YesNoInput.#yesNoModal.setConfirm(YesNoInput.#yesNoBtnOK, () => res([true, callbackvalue]))
            YesNoInput.#yesNoModal.setCancel(YesNoInput.#yesNoBtnCancel, () => res([false, callbackvalue]))
        })
    }

    static async deleteDB(dbname) {
        return YesNoInput.#open('Elimina Database', `Sei sicuro di voler eliminare il database "${dbname}"?`, 'Elimina', 'Annulla', dbname)
    }

    static async deleteTable(dbname, tablename) {
        return YesNoInput.#open('Elimina Tabella', `Sei sicuro di voler eliminare la tabella "${tablename}"?`, 'Elimina', 'Annulla', {dbname: dbname, tablename: tablename})
    }

    static async deleteEntity(entityname) {
        return YesNoInput.#open('Elimina entità', `Sei sicuro di voler eliminare l\'entità "${entityname}"?`, 'Elimina', 'Annulla', null)
    }

    static async deleteRelation(relationname) {
        return YesNoInput.#open('Elimina relazione', `Sei sicuro di voler eliminare la relazione "${relationname}"?`, 'Elimina', 'Annulla', null)
    }
}
