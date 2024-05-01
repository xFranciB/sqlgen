class Auth {
    static #sessiondata

    static #openAuthBtn = document.getElementById('btn-login')
    static #userBtn = document.getElementById('btn-user')

    static #loginModal = new Modal(document.getElementById('modal-login'))
    static #loginUsername = document.getElementById('login-username')
    static #loginPassword = document.getElementById('login-password')
    static #logintoregister

    static #registerModal = new Modal(document.getElementById('modal-register'))
    static #registerUsername = document.getElementById('register-username')
    static #registerPassword = document.getElementById('register-password')
    static #registertologin

    static {
        Auth.#logintoregister = Auth.#loginModal.element.querySelector('a')
        Auth.#registertologin = Auth.#registerModal.element.querySelector('a')

        Auth.#checkIfExpired()

        Auth.#openAuthBtn.onclick = () => Auth.#loginModal.open()

        Auth.#loginModal.setCancel(Auth.#loginModal.element.querySelector('.cancel'))
        Auth.#loginModal.setConfirm(Auth.#loginModal.element.querySelector('.confirm'), () => {
            Auth.#doAuth(Auth.#loginUsername.value, Auth.#loginPassword.value).then(() => {
                Auth.#loginModal.close()
            }).catch(err => {
                ErrorModal.show(err)
            })
        }, false)

        Auth.#registerModal.setCancel(Auth.#registerModal.element.querySelector('.cancel'))
        Auth.#registerModal.setConfirm(Auth.#registerModal.element.querySelector('.confirm'), () => {
            Auth.#doRegister(Auth.#registerUsername.value, Auth.#registerPassword.value).then(() => {
                Auth.#registerModal.close()
            }).catch(err => {
                ErrorModal.show(Auth.#formatErrorMsg(err))
            })
        }, false)

        Auth.#logintoregister.onclick = () => {
            Auth.#loginModal.close()
            Auth.#registerModal.open()
        }

        Auth.#registertologin.onclick = () => {
            Auth.#registerModal.close()
            Auth.#loginModal.open()
        }
    }

    static async #doAuth(username, password) {
        return new Promise((res, rej) => {
            if (username === '') {
                return rej('Inserisci uno username')
            } else if (password === '') {
                return rej('Inserisci una password')
            }

            fetch(apiEndpoint + 'auth', {
                method: 'POST',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }).then(async (resp) => {
                if (resp.status !== 200) {
                    return rej('Credenziali errate')
                }
                
                resp.json().then(data => {
                    localStorage.setItem('session', JSON.stringify({
                        token: data.token,
                        expires: resp.headers.get('Expires'),
                        username: username
                    }))

                    Auth.#checkIfExpired()
                    Data.loadData()
                    res()
                })
            })
        })
    }

    static async #doRegister(username, password) {
        return new Promise((res, rej) => {
            if (username === '') {
                return rej('Inserisci uno username')
            } else if (password === '') {
                return rej('Inserisci una password')
            }

            fetch(apiEndpoint + 'users', {
                method: 'POST',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }).then(async (resp) => {
                if (resp.status === 201) {
                    return res()
                }

                return rej(await resp.json())
            })
        })
    }

    static #formatErrorMsg(error) {
        const msg = []

        for (let field in error) {
            if (field === 'username') {
                if (error[field] === 'invalid') {
                    msg.push('Username invalido')
                } else if (error[field] === 'empty') {
                    msg.push('Inserisci un username')
                } else if (error[field] === 'alreadyused') {
                    msg.push('Lo username scelto è già in uso')
                }
            } else if (field === 'password') {
                if (error[field] === 'invalid') {
                    msg.push('Password invalida')
                } else if (error[field] === 'empty') {
                    msg.push('Inserisci una password')
                } else if (error[field] === 'alreadyused') {
                    msg.push('La password scelta è già in uso')
                }
            } else if (field === 'dati') {
                if (error[field] === 'invalid') {
                    msg.push('Dati invalidi')
                } else if (error[field] === 'empty') {
                    msg.push('Inserisci dati')
                } else if (error[field] === 'alreadyused') {
                    msg.push('I dati inseriti sono già in uso')
                }
            }
        }

        return msg.join('\n')
    }

    static async #authFetch(uri, options = {}) {
        const headers = new Headers()
        headers.append('Authorization', 'Bearer ' + this.#sessiondata.token)

        return fetch(apiEndpoint + uri, Object.assign(options, {
            headers: headers
        }))
    }

    static #authFetchAfter(resp) {
        Auth.#sessiondata.expires = resp.headers.get('Expires')
        localStorage.setItem('session', JSON.stringify(Auth.#sessiondata))
    }

    static async getData() {
        return new Promise((res, rej) => {
            if (Auth.#sessiondata === null) return rej()

            Auth.#authFetch('data').then(resp => {
                Auth.#authFetchAfter(resp)
                return resp.json()

            }).then(res).catch(rej)
        })
    }

    static async setData(data) {
        return new Promise((res, rej) => {
            if (Auth.#sessiondata === null) return rej()

            Auth.#authFetch('data', {
                method: 'POST',
                body: JSON.stringify({dati: data})
            }).then(resp => {
                Auth.#authFetchAfter(resp)
                res(resp)
            }).catch(rej)
        })
    }

    static async isLoggedIn() {
        Auth.#checkIfExpired()
        return Auth.#sessiondata !== null
    }

    static async #checkIfExpired() {
        Auth.#sessiondata = JSON.parse(localStorage.getItem('session'))

        if (Auth.#sessiondata !== null) {
            if (new Date(Date.parse(Auth.#sessiondata.expires + 'Z')) < new Date()) {
                Auth.#sessiondata = null
            } else {
                Auth.#userBtn.querySelector('span').textContent = Auth.#sessiondata.username
            }
        }

        Auth.#openAuthBtn.classList.toggle('hidden', Auth.#sessiondata !== null)
        Auth.#userBtn.classList.toggle('hidden', Auth.#sessiondata === null)
    }
}
