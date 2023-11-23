class Modal {
    constructor(element) {
        this.element = element

        this.element.onclick = e => {
            if (e.target.matches('.modal'))
                this.close()
        }
    }

    open() {
        this.element.classList.remove('hidden')
    }

    close() {
        this.element.onanimationend = () => {
            this.element.classList.remove('out')
            this.element.classList.add('hidden')
            this.element.onanimationend = null
        }

        this.element.classList.add('out')
    }

    setConfirm(btn, callback = null, autoclose = true) {
        btn.onclick = () => {
            if (callback !== null) callback()
            if (autoclose) this.close()
        }
    }

    setCancel(btn, callback = null) {
        btn.onclick = () => {
            if (callback !== null) callback()
            this.close()
        }
    } 
}