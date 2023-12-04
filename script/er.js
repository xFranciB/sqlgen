const pythagoras = (x, y) => Math.sqrt(x*x + y*y)
const herons = (x1, y1, x2, y2, x3, y3) => {
    const line1 = pythagoras(
        x2 - x1,
        y2 - y1
    )

    const line2 = pythagoras(
        x3 - x2,
        y3 - y2
    )

    const line3 = pythagoras(
        x1 - x3,
        y1 - y3
    )

    const sp = (line1 + line2 + line3) / 2
    return Math.sqrt(sp * (sp - line1) * (sp - line2) * (sp - line3))
}

const clamp = (val, min, max) => Math.min(max, Math.max(min, val))

class EREditItem {
    #modal
    #tbody
    #data = {}
    #lastId = -1
    static rowTemplate = document.getElementById('ertype-row-template').content

    constructor(edititem_modal_element) {
        this.#modal = new Modal(edititem_modal_element)
        this.#tbody = this.#modal.element.querySelector('tbody')
        this.#modal.element.querySelector('tr:last-child > td').onclick = () => this.#addRow()
    }

    async prompt(title) {
        this.#modal.element.querySelector('.modal-title').textContent = title
        this.#modal.element.querySelector('#erentity-name').value = ''

        while (this.#tbody.children.length > 1) {
            this.#tbody.children[0].remove()
        }

        for (let i = 0; i < 5; i++) {
            this.#addRow()
        }

        this.#modal.open()

        return new Promise((res, rej) => {
            this.#modal.setCancel(this.#modal.element.querySelector('button.cancel'), rej)
            this.#modal.setConfirm(this.#modal.element.querySelector('button.confirm'), () => {
                const name = this.#modal.element.querySelector('#erentity-name').value
                if (name === '') {
                    alert('Inserisci un nome')
                    return
                }

                const resp = []

                for (let i = 0; i < this.#tbody.children.length - 1; i++) {
                    const rowname = this.#tbody.children[i].querySelector('input[type="text"]').value
                    if (rowname === '') continue

                    if (!this.#data.hasOwnProperty(this.#tbody.children[i].getAttribute('rowid'))) {
                        alert('Inserisci un tipo')
                        return
                    }

                    resp.push({name: rowname, pk: this.#tbody.children[i].querySelector('input[type="checkbox"]').checked, type: this.#data[this.#tbody.children[i].getAttribute('rowid')]})
                }

                // Check if name is already used somehow
                this.#modal.close()
                res({name: name, attributes: resp})
            }, false)
        })
    }

    #addRow() {
        const newrow = EREditItem.rowTemplate.cloneNode(true).firstElementChild
        newrow.setAttribute('rowid', ++this.#lastId)
        newrow.querySelector('img').onclick = async () => {
            const res = await this.#getType()
            newrow.querySelector('span').textContent = formatType(res.type)
            this.#data[parseInt(newrow.getAttribute('rowid'))] = res
        }

        this.#tbody.insertBefore(newrow, this.#tbody.lastElementChild)
    }

    async #getType() {
        return await getType()
    }

}

class ERDiagram {
    static directions = {top: 0, right: 1, bottom: 2, left: 3}
    #editable
    #createassoc_modal = null
    #createassoc_erd
    #edititem_prompt = null
    #createassoc_erd_items = {}
    #isDragging = false
    #draggingEntity = null
    #offsetcoords = {x: null, y: null}
    #draggingEnabled = false
    #items = {}
    #boundscache = {}
    #lastentity = -1
    #canvas
    #canvasSizes
    #ctx

    static #shapeSizes = {
        rect: {
            w: 150,
            h: 75
        },
        relation: {
            w: 150,
            h: 75,
            gapBase: 10,
            radius: 5,

            slope: 0,
            rads: 0,
            cosine: 0,
            sine: 0,
            gapH: 0,
            gapV: 0
        },
        attribute: {
            length: 20,
            radius: 5,
            textGap: 5,

            // The offsets used when
            // creating attributes
            baseOffset: 10,
            offset: 50
        },
        link: {
            textGap: 5
        }
    }

    static {
        // Static shape sizes
        const slope = this.#shapeSizes.relation.h / this.#shapeSizes.relation.w
        const rads = Math.atan(slope)

        Object.assign(this.#shapeSizes.relation, {
            slope: slope,
            rads: rads,
            cosine: Math.cos(rads),
            sine: Math.sin(rads),
            area: Math.round((ERDiagram.#shapeSizes.relation.w * ERDiagram.#shapeSizes.relation.h) / 2),
            gapH: ((slope < 1)? (1/slope) : 1) * this.#shapeSizes.relation.gapBase,
            gapV: ((slope > 1)?    slope  : 1) * this.#shapeSizes.relation.gapBase
        })
    }

    constructor(
        canvas,
        editable = false,
        createassoc_modal_element = null,
        createentity_button = null,
        createrelation_button = null,
        edititem_modal_element = null
    ) {
        this.#canvas = canvas
        this.#canvasSizes = {w: canvas.width, h: canvas.height}
        this.#ctx = this.#createContext()
        this.#editable = editable

        // For diagrams that do not require editing
        // If this is set to false, all other elements and buttons
        // should be set to null for good practice.
        if (!this.#editable) return

        // Create Association modal
        this.#createassoc_modal = new Modal(createassoc_modal_element)
        this.#createassoc_modal.setCancel(this.#createassoc_modal.element.querySelector('button.cancel'), (() => {
            this.redraw()
        }).bind(this))

        this.#createassoc_erd = new ERDiagram(this.#createassoc_modal.element.querySelector('#er-createassoc'))
        this.#createassoc_erd_items.entity = this.#createassoc_erd.createEntity(50, 25)
        this.#createassoc_erd_items.relation = this.#createassoc_erd.createRelation(300, 25)
        this.#createassoc_erd_items.link = this.#createassoc_erd.createLink(
            this.#createassoc_erd_items.entity,
            this.#createassoc_erd_items.relation
        )

        for (let el of this.#createassoc_modal.element.querySelectorAll('input[type="radio"]')) {
            el.onclick = () => {
                this.#createassoc_modal.element.querySelector('button.confirm').removeAttribute('disabled')

                this.#createassoc_erd.editLink(
                    this.#createassoc_erd_items.link,
                    '(' + (this.#createassoc_modal.element.querySelector('input[type="radio"]:checked').value.split('').join(', ')) + ')'
                )

                this.#createassoc_erd.redraw()
            }
        }

        // Create Entity modal
        this.#edititem_prompt = new EREditItem(edititem_modal_element)
        createentity_button.onclick = async () => {
            const newdata = await this.#edititem_prompt.prompt("Crea Entità")
            const entityid = this.createEntity(75, 75, newdata.name)

            for (let i = 0; i < newdata.attributes.length; i++) {
                this.createEntityAttribute(
                    entityid,
                    ERDiagram.#shapeSizes.attribute.baseOffset + (ERDiagram.#shapeSizes.attribute.offset * i),
                    newdata.attributes[i].name,
                    newdata.attributes[i].pk
                )
            }

            this.redraw()
        }

        // Create Relation modal
        createrelation_button.onclick = async () => {
            const newdata = await this.#edititem_prompt.prompt("Crea Relazione")
            const relation = this.createRelation(75, 75, newdata.name)

            for (let i = 0; i < newdata.attributes.length; i++) {
                this.createRelationAttribute(
                    relation,
                    ERDiagram.#shapeSizes.attribute.baseOffset + (ERDiagram.#shapeSizes.attribute.offset * i),
                    newdata.attributes[i].name,
                    newdata.attributes[i].pk
                )
            }

            this.redraw()
        }
    }

    #createContext() {
        const ctx = this.#canvas.getContext('2d')
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'black'
        ctx.font = '12pt system-ui'
        return ctx
    }

    #cacheEntityBounds(entityid) {
        if (this.#boundscache.hasOwnProperty(entityid)) return
        const entity = this.#items[entityid]

        this.#boundscache[entityid] = {
            x: entity.pos.x,
            y: entity.pos.y,
            w: ERDiagram.#shapeSizes.rect.w,
            h: ERDiagram.#shapeSizes.rect.h
        }
    }

    #cacheRelationBounds(relationid) {
        if (this.#boundscache.hasOwnProperty(relationid)) return

        const pos = this.#items[relationid].pos
        const w = ERDiagram.#shapeSizes.relation.w
        const h = ERDiagram.#shapeSizes.relation.h

        this.#boundscache[relationid] = {
            dragging: null,
            p1: {
                x: pos.x + (w / 2),
                y: pos.y
            },
            p2: {
                x: pos.x + w,
                y: pos.y + (h / 2)
            },
            p3: {
                x: pos.x + (w / 2),
                y: pos.y + h
            },
            p4: {
                x: pos.x,
                y: pos.y + (h / 2)
            }
        }

        const radius = ERDiagram.#shapeSizes.relation.radius
        const gapV = ERDiagram.#shapeSizes.relation.gapV
        const gapH = ERDiagram.#shapeSizes.relation.gapH

        const boundscache = this.#boundscache[relationid]

        this.#boundscache[relationid].dots = {
            top: {
                x: boundscache.p1.x,
                y: boundscache.p1.y + gapV,
                bounds: {
                    x: boundscache.p1.x - radius,
                    y: boundscache.p1.y + gapV - radius,
                }
            },
            right: {
                x: boundscache.p2.x - gapH,
                y: boundscache.p2.y,
                bounds: {
                    x: boundscache.p2.x - gapH - radius,
                    y: boundscache.p2.y - radius
                }
            },
            bottom: {
                x: boundscache.p3.x,
                y: boundscache.p3.y - gapV,
                bounds: {
                    x: boundscache.p3.x - radius,
                    y: boundscache.p3.y - gapV - radius
                }
            },
            left: {
                x: boundscache.p4.x + gapH,
                y: boundscache.p4.y,
                bounds: {
                    x: boundscache.p4.x + gapH - radius,
                    y: boundscache.p4.y - radius
                }
            }
        }
    }

    #cacheEntityAttributeBounds(entityid) {
        if (this.#boundscache.hasOwnProperty(entityid)) return

        const attrib = this.#items[entityid]
        const rect = this.#items[this.#items[entityid].pos.relatedto]

        let direction, offset = 0
        if (attrib.pos.offset <= ERDiagram.#shapeSizes.rect.w) {
            direction = 0
        } else {
            offset = ERDiagram.#shapeSizes.rect.w

            if (attrib.pos.offset - offset <= ERDiagram.#shapeSizes.rect.h) {
                direction = 1
            } else {
                offset += ERDiagram.#shapeSizes.rect.h

                if (attrib.pos.offset - offset <= ERDiagram.#shapeSizes.rect.w) {
                    direction = 2
                } else {
                    offset += ERDiagram.#shapeSizes.rect.w
                    direction = 3
                }
            }
        }

        const radius = ERDiagram.#shapeSizes.attribute.radius
        const length = ERDiagram.#shapeSizes.attribute.length

        switch(direction) {
        case 0:
            this.#boundscache[entityid] = {
                x: rect.pos.x + attrib.pos.offset,
                y: rect.pos.y
            }

            this.#boundscache[entityid].bounds = {
                x: this.#boundscache[entityid].x - radius,
                y: this.#boundscache[entityid].y - length - (radius * 2),
                w: radius * 2,
                h: length + (radius * 2),
            }

            break

        case 1:
            this.#boundscache[entityid] = {
                x: rect.pos.x + ERDiagram.#shapeSizes.rect.w,
                y: rect.pos.y + attrib.pos.offset - offset
            }

            this.#boundscache[entityid].bounds = {
                x: this.#boundscache[entityid].x,
                y: this.#boundscache[entityid].y - radius,
                w: length + (radius * 2),
                h: radius * 2,
            }

            break

        case 2:
            this.#boundscache[entityid] = {
                x: rect.pos.x + ERDiagram.#shapeSizes.rect.w - (attrib.pos.offset - offset),
                y: rect.pos.y + ERDiagram.#shapeSizes.rect.h
            }

            this.#boundscache[entityid].bounds = {
                x: this.#boundscache[entityid].x - radius,
                y: this.#boundscache[entityid].y,
                w: radius * 2,
                h: length + (radius * 2),
            }

            break

        case 3:
            this.#boundscache[entityid] = {
                x: rect.pos.x,
                y: rect.pos.y + ERDiagram.#shapeSizes.rect.h - (attrib.pos.offset - offset)
            }

            this.#boundscache[entityid].bounds = {
                x: this.#boundscache[entityid].x - length - (radius * 2),
                y: this.#boundscache[entityid].y - radius,
                w: length + (radius * 2),
                h: radius * 2,
            }

            break
        }

        this.#boundscache[entityid].direction = direction

    }

    #cacheRelationAttributeBounds(entityid) {
        if (this.#boundscache.hasOwnProperty(entityid)) return

        const attrib = this.#items[entityid]
        const relation = this.#items[attrib.pos.relatedto]
        const w = ERDiagram.#shapeSizes.relation.w
        const h = ERDiagram.#shapeSizes.relation.h

        let direction = 0, offset = 0

        for (let i = 0; i < 3; i++) {
            if (attrib.pos.offset - offset <= (w / 2)) {
                break
            }

            direction++
            offset += (w / 2)
        }

        offset = attrib.pos.offset - offset

        const length = ERDiagram.#shapeSizes.attribute.length
        const radius = ERDiagram.#shapeSizes.attribute.radius
        const slope = ERDiagram.#shapeSizes.relation.slope
        const sine = ERDiagram.#shapeSizes.relation.sine
        const cosine = ERDiagram.#shapeSizes.relation.cosine

        switch (direction) {
        case 0:
            this.#boundscache[entityid] = {
                startx: relation.pos.x + (w / 2) + offset,
                starty: relation.pos.y + (offset * slope)
            }

            Object.assign(this.#boundscache[entityid], {
                endx: this.#boundscache[entityid].startx + (cosine * length),
                endy: this.#boundscache[entityid].starty + (-sine * length),
                centerx: this.#boundscache[entityid].startx + (cosine * (length + radius)),
                centery: this.#boundscache[entityid].starty + (-sine * (length + radius))
            })

            break

        case 1:
            this.#boundscache[entityid] = {
                startx: relation.pos.x + w - offset,
                starty: relation.pos.y + (h / 2) + (offset * slope)
            }

            Object.assign(this.#boundscache[entityid], {
                endx: this.#boundscache[entityid].startx + (cosine * length),
                endy: this.#boundscache[entityid].starty + (sine * length),
                centerx: this.#boundscache[entityid].startx + (cosine * (length + radius)),
                centery: this.#boundscache[entityid].starty + (sine * (length + radius))
            })

            break

        case 2:
            this.#boundscache[entityid] = {
                startx: relation.pos.x + (w / 2) - offset,
                starty: relation.pos.y + h - (offset * slope)
            }

            Object.assign(this.#boundscache[entityid], {
                endx: this.#boundscache[entityid].startx + (-cosine * length),
                endy: this.#boundscache[entityid].starty + (sine * length),
                centerx: this.#boundscache[entityid].startx + (-cosine * (length + radius)),
                centery: this.#boundscache[entityid].starty + (sine * (length + radius))
            })

            break

        case 3:
            this.#boundscache[entityid] = {
                startx: relation.pos.x + offset,
                starty: relation.pos.y + (((w / 2) - offset) * slope)
            }

            Object.assign(this.#boundscache[entityid], {
                endx: this.#boundscache[entityid].startx + (-cosine * length),
                endy: this.#boundscache[entityid].starty + (-sine * length),
                centerx: this.#boundscache[entityid].startx + (-cosine * (length + radius)),
                centery: this.#boundscache[entityid].starty + (-sine * (length + radius))
            })

            break
        }

        Object.assign(this.#boundscache[entityid], {
            direction: direction,
            bounds: {
                x: this.#boundscache[entityid].centerx - radius,
                y: this.#boundscache[entityid].centery - radius,
                w: radius * 2,
                h: radius * 2
            }
        })
    }

    #cacheLinkBounds(linkid) {
        if (this.#boundscache.hasOwnProperty(linkid)) return

        const entity = this.#items[this.#items[linkid].entityid]
        const relation = this.#items[this.#items[linkid].relationid]

        const entityHalves = [
            {x: entity.pos.x + (ERDiagram.#shapeSizes.rect.w / 2), y: entity.pos.y},
            {x: entity.pos.x + ERDiagram.#shapeSizes.rect.w, y: entity.pos.y + (ERDiagram.#shapeSizes.rect.h / 2)},
            {x: entity.pos.x + (ERDiagram.#shapeSizes.rect.w / 2), y: entity.pos.y + ERDiagram.#shapeSizes.rect.h},
            {x: entity.pos.x, y: entity.pos.y  + (ERDiagram.#shapeSizes.rect.h / 2)}
        ]

        const relationHalves = [
            {x: relation.pos.x + (ERDiagram.#shapeSizes.relation.w / 2), y: relation.pos.y},
            {x: relation.pos.x + ERDiagram.#shapeSizes.relation.w, y: relation.pos.y + (ERDiagram.#shapeSizes.relation.h / 2)},
            {x: relation.pos.x + (ERDiagram.#shapeSizes.relation.w / 2), y: relation.pos.y + ERDiagram.#shapeSizes.relation.h},
            {x: relation.pos.x, y: relation.pos.y  + (ERDiagram.#shapeSizes.relation.h / 2)}
        ]

        let minline = {len: Infinity}

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const len = pythagoras(entityHalves[i].x - relationHalves[j].x, entityHalves[i].y - relationHalves[j].y)
                if (len < minline.len) minline = {len: len, start: i, end: j}
            }
        }

        this.#boundscache[linkid] = {
            entityHalves: entityHalves,
            relationHalves: relationHalves,
            minline: minline
        }
    }

    createEntity(x, y, text = '') {
        this.#items[++this.#lastentity] = {
            type: 'entity',
            text: text,
            connections: [],
            pos: {
                x: x,
                y: y
            }
        }

        return this.#lastentity
    }

    createRelation(x, y, text = '') {
        this.#items[++this.#lastentity] = {
            type: 'relation',
            text: text,
            connections: [],
            pos: {
                x: x,
                y: y
            }
        }

        return this.#lastentity
    }

    createEntityAttribute(entityid, offset, text = '', primarykey = false) {
        this.#items[++this.#lastentity] = {
            type: 'entity-attr',
            text: text,
            primarykey: primarykey,
            pos: {
                relatedto: entityid,
                offset: offset % ((ERDiagram.#shapeSizes.rect.w + ERDiagram.#shapeSizes.rect.h) * 2)
            }
        }

        this.#items[entityid].connections.push(this.#lastentity)
        return this.#lastentity
    }

    createRelationAttribute(relationid, offset, text = '', primarykey = false) {
        this.#items[++this.#lastentity] = {
            type: 'relation-attr',
            text: text,
            primarykey: primarykey,
            pos: {
                relatedto: relationid,
                offset: offset % (ERDiagram.#shapeSizes.relation.w * 2)
            }
        }

        this.#items[relationid].connections.push(this.#lastentity)
        return this.#lastentity
    }

    createLink(entityid, relationid, text = '') {
        this.#items[++this.#lastentity] = {
            type: 'link',
            entityid: entityid,
            relationid: relationid,
            text: text
        }

        this.#items[entityid].connections.push(this.#lastentity)
        this.#items[relationid].connections.push(this.#lastentity)
        return this.#lastentity
    }

    editEntity(entityid, text) {
        this.#items[entityid].text = text
    }

    editRelation(relationid, text) {
        this.#items[relationid].text = text
    }

    editLink(linkid, text) {
        this.#items[linkid].text = text
    }

    #drawText(x, y, text, textAlign, textBaseline) {
        if (text === '') return
        this.#ctx.textAlign = textAlign
        this.#ctx.textBaseline = textBaseline
        this.#ctx.fillText(text, x, y)
    }

    #drawLine(x1, y1, x2, y2, startdir, enddir, starttext = '', endtext = '') {
        const drawLineText = (position, x, y, text) => {
            switch (position) {
            case 0:
                this.#drawText(x, y - ERDiagram.#shapeSizes.link.textGap, text, 'center', 'bottom')
                break

            case 1:
                this.#drawText(x, y, text, 'left', 'bottom')
                break

            case 2:
                this.#drawText(x, y + ERDiagram.#shapeSizes.link.textGap, text, 'center', 'top')
                break

            case 3:
                this.#drawText(x, y, text, 'right', 'bottom')
                break
            }
        }

        this.#ctx.beginPath()
        this.#ctx.moveTo(x1, y1)

        if ((startdir + enddir) % 2 == 0) {
            if (startdir % 2 == 0) {
                // bottom --> top; top --> bottom
                const avgy = (y1 + y2) / 2
                this.#ctx.lineTo(x1, avgy)
                this.#ctx.lineTo(x2, avgy)

            } else {
                // left --> right; right --> left
                const avgx = (x1 + x2) / 2
                this.#ctx.lineTo(avgx, y1)
                this.#ctx.lineTo(avgx, y2)
            }

        } else {
            if (startdir % 2 == 0) {
                // top or bottom --> left or right
                this.#ctx.lineTo(x1, y2)
            } else {
                // left or right --> top or bottom
                this.#ctx.lineTo(x2, y1)
            }
        }

        this.#ctx.lineTo(x2, y2)

        drawLineText(startdir, x1, y1, starttext)
        drawLineText(enddir, x2, y2, endtext)

        this.#ctx.stroke()
        this.#ctx.closePath()
    }

    #drawEntity(entityid) {
        this.#cacheEntityBounds(entityid)
        const boundscache = this.#boundscache[entityid]

        this.#ctx.strokeRect(boundscache.x, boundscache.y, boundscache.w, boundscache.h)
        this.#drawText(
            boundscache.x + (boundscache.w / 2),
            boundscache.y + (boundscache.h / 2),
            this.#items[entityid].text, 'center', 'middle'
        )
    }

    #drawRelation(relationid) {
        this.#cacheRelationBounds(relationid)
        const boundscache = this.#boundscache[relationid]
        const relation = this.#items[relationid]

        this.#ctx.beginPath()
        this.#ctx.moveTo(boundscache.p1.x, boundscache.p1.y)
        this.#ctx.lineTo(boundscache.p2.x, boundscache.p2.y)
        this.#ctx.lineTo(boundscache.p3.x, boundscache.p3.y)
        this.#ctx.lineTo(boundscache.p4.x, boundscache.p4.y)
        this.#ctx.lineTo(boundscache.p1.x, boundscache.p1.y)
        this.#ctx.stroke()
        this.#ctx.closePath()

        if (boundscache.dragging !== null) {
            this.#drawLine(
                boundscache.dots[boundscache.dragging].x,
                boundscache.dots[boundscache.dragging].y,
                boundscache.dragto.x,
                boundscache.dragto.y,
                ERDiagram.directions[boundscache.dragging],
                (ERDiagram.directions[boundscache.dragging] + 2) % 4
            )
        }

        // Dots
        if (this.#draggingEnabled) {
            const radius = ERDiagram.#shapeSizes.relation.radius
            this.#ctx.fillStyle = 'slategray'
            this.#ctx.beginPath()

            for (let dot of Object.values(boundscache.dots)) {
                this.#ctx.moveTo(dot.x + radius, dot.y)
                this.#ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
            }

            this.#ctx.fill()
            this.#ctx.fillStyle = '#000'
        }

        this.#drawText(
            relation.pos.x + (ERDiagram.#shapeSizes.relation.w / 2),
            relation.pos.y + (ERDiagram.#shapeSizes.relation.h / 2),
            relation.text, 'center', 'middle'
        )

        this.#ctx.closePath()
    }

    #drawEntityAttribute(attrid) {
        this.#cacheEntityAttributeBounds(attrid)

        const attrib = this.#items[attrid]
        const boundscache = this.#boundscache[attrid]

        const radius = ERDiagram.#shapeSizes.attribute.radius
        const length = ERDiagram.#shapeSizes.attribute.length
        const textGap = ERDiagram.#shapeSizes.attribute.textGap

        this.#ctx.beginPath()
        this.#ctx.moveTo(boundscache.x, boundscache.y)

        switch(boundscache.direction) {
        case 0:
            this.#ctx.lineTo(boundscache.x, boundscache.y - length)
            this.#ctx.moveTo(boundscache.x + radius, boundscache.y - length - radius)
            this.#ctx.arc(boundscache.x, boundscache.y - length - radius, radius, 0, 2 * Math.PI)
            this.#drawText(boundscache.x, boundscache.y - length - radius - textGap, attrib.text, 'center', 'bottom')

            break

        case 1:
            this.#ctx.lineTo(boundscache.x + length, boundscache.y)
            this.#ctx.moveTo(boundscache.x + length + (radius * 2), boundscache.y)
            this.#ctx.arc(boundscache.x + length + radius, boundscache.y, radius, 0, 2 * Math.PI)
            this.#drawText(boundscache.x + length - (radius * 2), boundscache.y - textGap, attrib.text, 'left', 'bottom')

            break

        case 2:
            this.#ctx.lineTo(boundscache.x, boundscache.y + length)
            this.#ctx.moveTo(boundscache.x + radius, boundscache.y + length + radius)
            this.#ctx.arc(boundscache.x, boundscache.y + length + radius, radius, 0, 2 * Math.PI)
            this.#drawText(boundscache.x, boundscache.y + length + radius + radius + textGap, attrib.text, 'center', 'top')

            break

        case 3:
            this.#ctx.lineTo(boundscache.x - length, boundscache.y)
            this.#ctx.arc(boundscache.x - length - radius, boundscache.y, radius, 0, 2 * Math.PI)
            this.#drawText(boundscache.x - length + (radius * 2), boundscache.y - textGap, attrib.text, 'right', 'bottom')

            break
        }

        if (attrib.primarykey) this.#ctx.fill()
        this.#ctx.stroke()
        this.#ctx.closePath()
    }

    #drawRelationAttribute(attrid) {
        this.#cacheRelationAttributeBounds(attrid)

        const attr = this.#items[attrid]
        const boundscache = this.#boundscache[attrid]
        const radius = ERDiagram.#shapeSizes.attribute.radius
        const textGap = ERDiagram.#shapeSizes.attribute.textGap

        this.#ctx.beginPath()
        this.#ctx.moveTo(boundscache.startx, boundscache.starty)
        this.#ctx.lineTo(boundscache.endx, boundscache.endy)
        this.#ctx.moveTo(boundscache.centerx + radius, boundscache.centery)
        this.#ctx.arc(boundscache.centerx, boundscache.centery, radius, 0, Math.PI * 2)

        switch (boundscache.direction) {
        case 0:
            this.#drawText(boundscache.centerx, boundscache.centery - textGap, attr.text, 'middle', 'bottom')
            break

        case 1:
            this.#drawText(boundscache.centerx, boundscache.centery + textGap + 2, attr.text, 'middle', 'top')
            break

        case 2:
            this.#drawText(boundscache.centerx, boundscache.centery + textGap + 2, attr.text, 'middle', 'top')
            break

        case 3:
            this.#drawText(boundscache.centerx, boundscache.centery - textGap, attr.text, 'middle', 'bottom')
            break
        }

        if (attr.primarykey) this.#ctx.fill()
        this.#ctx.stroke()
        this.#ctx.closePath()
    }

    #drawLink(linkid) {
        this.#cacheLinkBounds(linkid)
        const link = this.#items[linkid]
        const boundscache = this.#boundscache[linkid]

        this.#drawLine(
            boundscache.entityHalves[boundscache.minline.start].x,
            boundscache.entityHalves[boundscache.minline.start].y,
            boundscache.relationHalves[boundscache.minline.end].x,
            boundscache.relationHalves[boundscache.minline.end].y,
            boundscache.minline.start,
            boundscache.minline.end,
            '',
            link.text
        )
    }

    #moveItem(entityid, x, y) {
        const entity = this.#items[entityid]

        switch (entity.type) {
        case 'entity':
            this.#moveEntity(this.#draggingEntity, x, y)
            break

        case 'relation':
            this.#moveRelation(this.#draggingEntity, x, y)
            break

        case 'entity-attr':
            this.#moveEntityAttribute(this.#draggingEntity, x, y)
            break

        case 'relation-attr':
            // TODO: Not implemented
            break

        case 'link':
            // Ignored (for now?)
            break
        }
    }

    #moveEntity(entityid, x, y) {
        const entity = this.#items[entityid]
        const boundscache = this.#boundscache[entityid]
        entity.pos.x = x - this.#offsetcoords.x
        entity.pos.y = y - this.#offsetcoords.y
        boundscache.x = x - this.#offsetcoords.x
        boundscache.y = y - this.#offsetcoords.y

        for (let connection of entity.connections) {
            delete this.#boundscache[connection]
        }
    }

    #moveRelation(relationid, x, y) {
        const entity = this.#items[relationid]
        const boundscache = this.#boundscache[relationid]

        if (boundscache.dragging !== null) {
            boundscache.dragto = {x: x, y: y}
            return
        }
        entity.pos.x = x - this.#offsetcoords.x
        entity.pos.y = y - this.#offsetcoords.y
        delete this.#boundscache[relationid]

        for (let connection of entity.connections) {
            delete this.#boundscache[connection]
        }
    }

    #moveEntityAttribute(attrid, x, y) {
        const attrib = this.#items[attrid]
        const entity = this.#items[attrib.pos.relatedto]

        const l = entity.pos.x
        const r = entity.pos.x + ERDiagram.#shapeSizes.rect.w
        const t = entity.pos.y
        const b = entity.pos.y + ERDiagram.#shapeSizes.rect.h

        x = clamp(x, l, r)
        y = clamp(y, t, b)

        const dl = Math.abs(x - l)
        const dr = Math.abs(x - r)
        const dt = Math.abs(y - t)
        const db = Math.abs(y - b)
        const min = Math.min(dl, dr, dt, db)

        // Most of the stuff we save in this object is useless (for now?),
        // it could be used to avoid rebuilding the entire cache everytime.
        let minpoint = {}

        switch (min) {
        case dt:
            minpoint = {x: x, y: t, direction: 0, offset: x - l}
            break

        case dr:
            minpoint = {x: r, y: y, direction: 1, offset: ERDiagram.#shapeSizes.rect.w + (y - t)}
            break

        case db:
            minpoint = {x: x, y: b, direction: 2, offset: ERDiagram.#shapeSizes.rect.w + ERDiagram.#shapeSizes.rect.h + (r - x)}
            break

        case dl:
            minpoint = {x: l, y: y, direction: 3, offset: (ERDiagram.#shapeSizes.rect.w * 2) + ERDiagram.#shapeSizes.rect.h + (b - y)}
            break
        }

        attrib.pos.offset = minpoint.offset
        delete this.#boundscache[attrid]
    }

    redraw() {
        this.#ctx.clearRect(0, 0, this.#canvasSizes.w, this.#canvasSizes.h)

        for (let entityid in this.#items) {
            switch(this.#items[entityid].type) {
            case 'entity':
                this.#drawEntity(entityid)
                break

            case 'relation':
                this.#drawRelation(entityid)
                break

            case 'entity-attr':
                this.#drawEntityAttribute(entityid)
                break

            case 'relation-attr':
                this.#drawRelationAttribute(entityid)
                break

            case 'link':
                this.#drawLink(entityid)
                break
            }
        }
    }

    #elementAtPos(x, y) {
        // Out of bounds
        if (
            x < 0 || y < 0 ||
            x > this.#canvasSizes.w || y > this.#canvasSizes.h
        ) return null

        for (let entityid in this.#items) {
            const entity = this.#items[entityid]
            const boundscache = this.#boundscache[entityid]

            switch (entity.type) {
            case 'entity': {

                if (
                    x >= boundscache.x && x <= boundscache.x + boundscache.w &&
                    y >= boundscache.y && y <= boundscache.y + boundscache.h
                ) {
                    return entityid
                }

                break
            }

            case 'relation': {
                const totalarea = Math.round(
                    herons(boundscache.p1.x, boundscache.p1.y, boundscache.p2.x, boundscache.p2.y, x, y) +
                    herons(boundscache.p2.x, boundscache.p2.y, boundscache.p3.x, boundscache.p3.y, x, y) +
                    herons(boundscache.p3.x, boundscache.p3.y, boundscache.p4.x, boundscache.p4.y, x, y) +
                    herons(boundscache.p4.x, boundscache.p4.y, boundscache.p1.x, boundscache.p1.y, x, y)
                )

                if (totalarea !== ERDiagram.#shapeSizes.relation.area) break

                boundscache.dragging = null
                const diameter = ERDiagram.#shapeSizes.relation.radius * 2

                for (let dot in boundscache.dots) {
                    if (
                        x >= boundscache.dots[dot].bounds.x && x <= boundscache.dots[dot].bounds.x + diameter &&
                        y >= boundscache.dots[dot].bounds.y && y <= boundscache.dots[dot].bounds.y + diameter
                    ) {
                        boundscache.dragging = dot
                        break
                    }
                }

                return entityid
            }

            case 'entity-attr': {
                if (
                    x >= boundscache.bounds.x && x <= boundscache.bounds.x + boundscache.bounds.w &&
                    y >= boundscache.bounds.y && y <= boundscache.bounds.y + boundscache.bounds.h
                ) {
                    return entityid
                }
                break
            }

            case 'relation-attr':
                if (
                    x >= boundscache.bounds.x && x <= boundscache.bounds.x + boundscache.bounds.w &&
                    y >= boundscache.bounds.y && y <= boundscache.bounds.y + boundscache.bounds.h
                ) {
                    return entityid
                }
                break

            case 'link':
                // Ignored (for now?)
                break
            }
        }

        return null
    }

    #handleMouseDown(e) {
        const bdbox = this.#canvas.getBoundingClientRect()

        if (
            e.x < bdbox.x || e.y < bdbox.y ||
            e.x > bdbox.x + this.#canvasSizes.w ||
            e.y > bdbox.y + this.#canvasSizes.h
        ) {
            return
        }

        this.#isDragging = true
        this.#draggingEntity = erd.#elementAtPos(e.x - bdbox.x, e.y - bdbox.y)
        if (this.#draggingEntity === null) return

        const entity = this.#items[this.#draggingEntity]

        if (entity.type === 'entity' || entity.type === 'relation') {
            this.#offsetcoords = {x: e.x - bdbox.x - entity.pos.x, y: e.y - bdbox.y - entity.pos.y}
        } else {
            const boundscache = this.#boundscache[this.#draggingEntity]
            this.#offsetcoords = {x: e.x - bdbox.x - boundscache.bounds.x, y: e.y - bdbox.y - boundscache.bounds.y}
        }
    }

    #handleMouseUp(e) {
        const relationid = this.#draggingEntity
        this.#isDragging = false
        this.#offsetcoords = {x: null, y: null}
        this.#draggingEntity = null

        if (relationid !== null && this.#items[relationid].type === 'relation') {
            this.#boundscache[relationid].dragging = null
            const bdbox = this.#canvas.getBoundingClientRect()
            const entityid = this.#elementAtPos(e.x - bdbox.x, e.y - bdbox.y)

            if (entityid !== null) {
                const entity = this.#items[entityid]

                if (entity.type === 'entity' && !entity.connections.some(el => this.#items[relationid].connections.includes(el))) {
                    this.#createassoc_modal.element.querySelector('button.confirm').setAttribute('disabled', '')
                    const selectedradio = this.#createassoc_modal.element.querySelector('input[type="radio"]:checked')
                    if (selectedradio !== null) selectedradio.checked = false

                    this.#createassoc_erd.editEntity(
                        this.#createassoc_erd_items.entity,
                        entity.text
                    )
                    this.#createassoc_erd.editRelation(
                        this.#createassoc_erd_items.relation,
                        this.#items[relationid].text
                    )
                    this.#createassoc_erd.editLink(
                        this.#createassoc_erd_items.link,
                        ''
                    )

                    this.#createassoc_erd.redraw()
                    this.#createassoc_modal.open()

                    this.#createassoc_modal.setConfirm(this.#createassoc_modal.element.querySelector('button.confirm'), (() => {
                        this.createLink(
                            entityid, relationid,
                            '(' + (this.#createassoc_modal.element.querySelector('input[type="radio"]:checked').value.split('').join(', ')) + ')'
                        )

                        this.redraw()
                    }).bind(this))

                    return
                }
            }

            this.redraw()
        }
    }

    #handleMouseMove(e) {
        if (!this.#isDragging) return
        if (this.#draggingEntity === null) return

        const bdbox = this.#canvas.getBoundingClientRect()

        this.#moveItem(this.#draggingEntity, e.x - bdbox.x, e.y - bdbox.y)
        this.redraw()
    }

    toggleDragging(status) {
        if (!this.#editable) return

        if (status) {
            document.addEventListener('mousedown', e => this.#handleMouseDown(e))
            document.addEventListener('mouseup', e => this.#handleMouseUp(e))
            this.#canvas.addEventListener('mousemove', e => this.#handleMouseMove(e))
        } else {
            document.removeEventListener('mousedown', e => this.#handleMouseDown(e))
            document.removeEventListener('mouseup', e => this.#handleMouseUp(e))
            this.#canvas.removeEventListener('mousemove', e => this.#handleMouseMove(e))
        }

        this.#draggingEnabled = status
    }
}

const erd = new ERDiagram(
    document.getElementById('er-diagram'),
    true,
    document.getElementById('modal-createassoc'),
    document.getElementById('er-createentity'),
    document.getElementById('er-createrelation'),
    document.getElementById('modal-edititem')
)

// const entity1 = erd.createEntity(100, 60, 'Utente')
// const relation = erd.createRelation(350, 100, 'Possiede')
// const entity2 = erd.createEntity(600, 100, 'Animale')
// const entity3 = erd.createEntity(300, 300, 'Medico')
// erd.createEntityAttribute(entity1, 10, 'ID', true)
// erd.createRelationAttribute(relation, 50, 'TEST')
// erd.createLink(entity1, relation, '(0, N)')
// erd.createLink(entity2, relation, '(0, N)')

erd.toggleDragging(true)
erd.redraw()