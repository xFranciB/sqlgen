class ErrorModal {
    static #errorEl = document.getElementById('modal-error')
    static #errorModal 
    static #errorTitle
    static #errorBody
    static #errorOK

    static {
        ErrorModal.#errorModal = new Modal(ErrorModal.#errorEl)
        ErrorModal.#errorTitle = ErrorModal.#errorEl.querySelector('.modal-title')
        ErrorModal.#errorBody = ErrorModal.#errorEl.querySelector('.modal-body')
        ErrorModal.#errorOK = ErrorModal.#errorEl.querySelector('.delete')
    }

    static async #open(title, description, callbackvalue) {
        ErrorModal.#errorTitle.textContent = title
        ErrorModal.#errorBody.textContent = description
        ErrorModal.#errorModal.open()

        return new Promise(res => {
            ErrorModal.#errorModal.setCancel(ErrorModal.#errorOK, () => res([false, callbackvalue]))
        })
    }

    static async show(title, description = null, callbackvalue = null) {
        if (description === null) {
            return ErrorModal.#open('Si è verificato un errore', title, callbackvalue)
        }

        return ErrorModal.#open(title, description, callbackvalue)
    }
}

