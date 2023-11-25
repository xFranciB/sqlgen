class ERDiagram {
    static directions = {up: 0, right: 1, down: 2, left: 3}
    #isDragging = false
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
            slope: 0,
            rads: 0,
            cosine: 0,
            sine: 0,
        },
        attribute: {
            length: 20,
            radius: 5,
            textGap: 5
        },
        link: {
            textGap: 5
        }
    }

    static {
        const slope = this.#shapeSizes.relation.h / this.#shapeSizes.relation.w
        const rads = Math.atan(slope)

        Object.assign(this.#shapeSizes.relation, {
            slope: slope,
            rads: rads,
            cosine: Math.cos(rads),
            sine: Math.sin(rads),
        })
    }

    constructor(canvas) {
        this.#canvas = canvas
        this.#canvasSizes = {w: canvas.width, h: canvas.height}
        this.#ctx = this.#createContext()
    }

    #createContext() {
        const ctx = this.#canvas.getContext('2d')
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'black'
        ctx.font = '12pt system-ui'
        return ctx
    }

    #cacheRelationBounds(relationid) {
        if (this.#boundscache.hasOwnProperty(relationid)) return

        const pos = this.#items[relationid].pos
        const w = ERDiagram.#shapeSizes.relation.w
        const h = ERDiagram.#shapeSizes.relation.h

        this.#boundscache[relationid] = {
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
                x: this.#boundscache[entityid].x - length - (radius * 2),
                y: this.#boundscache[entityid].y - radius,
                w: length + (radius * 2),
                h: radius * 2,
            }

            break

        case 3:
            this.#boundscache[entityid] = {
                x: rect.pos.x,
                y: rect.pos.y + ERDiagram.#shapeSizes.rect.h - (attrib.pos.offset - offset)
            }

            this.#boundscache[entityid].bounds = {
                x: this.#boundscache[entityid].x - radius,
                y: this.#boundscache[entityid].y,
                w: radius * 2,
                h: length + (radius * 2),
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
                const len = Math.sqrt(Math.pow(entityHalves[i].x - relationHalves[j].x, 2) + Math.pow(entityHalves[i].y - relationHalves[j].y, 2))
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

        return this.#lastentity
    }

    createLink(entityid, relationid, entitytext = '', relationtext = '') {
        this.#items[++this.#lastentity] = {
            type: 'link',
            entityid: entityid,
            relationid: relationid,
            entitytext: entitytext,
            relationtext: relationtext
        }

        return this.#lastentity
    }

    #drawText(x, y, text, textAlign, textBaseline) {
        if (text === '') return
        this.#ctx.textAlign = textAlign
        this.#ctx.textBaseline = textBaseline
        this.#ctx.fillText(text, x, y)
    }

    #drawEntity(entityid) {
        const entity = this.#items[entityid]

        this.#ctx.strokeRect(entity.pos.x, entity.pos.y, ERDiagram.#shapeSizes.rect.w, ERDiagram.#shapeSizes.rect.h)
        this.#drawText(
            entity.pos.x + (ERDiagram.#shapeSizes.rect.w / 2),
            entity.pos.y + (ERDiagram.#shapeSizes.rect.h / 2),
            entity.text, 'center', 'middle'
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

        this.#drawText(
            relation.pos.x + (ERDiagram.#shapeSizes.relation.w / 2),
            relation.pos.y + (ERDiagram.#shapeSizes.relation.h / 2),
            relation.text, 'center', 'middle'
        )
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

        const drawRelText = (position, halves, text) => {
            switch (position) {
            case 0:
                this.#drawText(halves.x, halves.y - ERDiagram.#shapeSizes.link.textGap, text, 'center', 'bottom')
                break

            case 1:
                this.#drawText(halves.x, halves.y, text, 'left', 'bottom')
                break

            case 2:
                this.#drawText(halves.x, halves.y + ERDiagram.#shapeSizes.link.textGap, 'center', 'top')
                break

            case 3:
                this.#drawText(halves.x, halves.y, text, 'right', 'bottom')
                break
            }
        }

        const boundscache = this.#boundscache[linkid]
        const link = this.#items[linkid]

        this.#ctx.beginPath()
        this.#ctx.moveTo(boundscache.entityHalves[boundscache.minline.start].x, boundscache.entityHalves[boundscache.minline.start].y)

        if ((boundscache.minline.start + boundscache.minline.end) % 2 == 0) {
            if (boundscache.minline.start % 2 == 0) {
                // bottom --> top; top --> bottom
                const avgy = (boundscache.entityHalves[boundscache.minline.start].y + boundscache.relationHalves[boundscache.minline.end].y) / 2
                this.#ctx.lineTo(boundscache.entityHalves[boundscache.minline.start].x, avgy)
                this.#ctx.lineTo(boundscache.relationHalves[boundscache.minline.end].x, avgy)

            } else {
                // left --> right; right --> left
                const avgx = (boundscache.entityHalves[boundscache.minline.start].x + boundscache.relationHalves[boundscache.minline.end].x) / 2
                this.#ctx.lineTo(avgx, boundscache.entityHalves[boundscache.minline.start].y)
                this.#ctx.lineTo(avgx, boundscache.relationHalves[boundscache.minline.end].y)
            }

        } else {
            if (boundscache.minline.start % 2 == 0) {
                // top or bottom --> left or right
                this.#ctx.lineTo(boundscache.entityHalves[boundscache.minline.start].x, boundscache.relationHalves[boundscache.minline.end].y)
            } else {
                // left or right --> top or bottom
                this.#ctx.lineTo(boundscache.relationHalves[boundscache.minline.end].x, boundscache.entityHalves[boundscache.minline.start].y)
            }
        }

        if (link.entitytext !== '') drawRelText(boundscache.minline.start, boundscache.entityHalves[boundscache.minline.start], link.entitytext)
        if (link.relationtext !== '') drawRelText(boundscache.minline.end, boundscache.relationHalves[boundscache.minline.end], link.relationtext)

        this.#ctx.lineTo(boundscache.relationHalves[boundscache.minline.end].x, boundscache.relationHalves[boundscache.minline.end].y)
        this.#ctx.stroke()
        this.#ctx.closePath()
    }

    redraw() {
        this.#ctx.clearRect(0, 0, this.#canvasSizes.w, this.#canvasSizes.h)

        // Redraw entities
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
}

const canvas = document.getElementById('er-diagram')
const erd = new ERDiagram(canvas)
const entityid = erd.createEntity(100, 60, 'users')
const relationid = erd.createRelation(400, 100, 'possiede')
erd.createEntityAttribute(entityid, 10, 'ID', true)
erd.createRelationAttribute(relationid, 50, 'TEST')
erd.createLink(entityid, relationid, '(0, N)', '(1, N)')

erd.redraw()

// const drawAttribute = (ctx, x, y, direction, fill = false, text = '') => {
//     const length = 20
//     const radius = 5
//     const textGap = 5
//     ctx.beginPath()
//     ctx.moveTo(x, y)

//     const sizes = {direction: direction}

//     switch(direction) {
//         case 0:
//         ctx.lineTo(x, y - length)
//         ctx.moveTo(x + radius, y - length - radius)
//         ctx.arc(x, y - length - radius, radius, 0, 2 * Math.PI)

//         if (text !== '') {
//             ctx.textAlign = 'center'
//             ctx.textBaseline = 'bottom'
//             ctx.fillText(text, x, y - length - radius - textGap)
//         }

//         sizes.x = x - radius
//         sizes.y = y - length - (radius * 2)
//         sizes.xs = radius * 2
//         sizes.ys = length + (radius * 2)

//         break

//     case 1:
//         ctx.lineTo(x + length, y)
//         ctx.moveTo(x + length + (radius * 2), y)
//         ctx.arc(x + length + radius, y, radius, 0, 2 * Math.PI)

//         if (text !== '') {
//             ctx.textAlign = 'left'
//             ctx.textBaseline = 'bottom'
//             ctx.fillText(text, x + length - (radius * 2), y - textGap)
//         }

//         sizes.x = x
//         sizes.y = y - radius
//         sizes.xs = length + (radius * 2)
//         sizes.ys = radius * 2

//         break

//     case 2:
//         ctx.lineTo(x, y + length)
//         ctx.moveTo(x + radius, y + length + radius)
//         ctx.arc(x, y + length + radius, radius, 0, 2 * Math.PI)

//         if (text !== '') {
//             ctx.textAlign = 'center'
//             ctx.textBaseline = 'top'
//             ctx.fillText(text, x, y + length + radius + radius + textGap)
//         }

//         sizes.x = x - length - (radius * 2)
//         sizes.y = y - radius
//         sizes.xs = length + (radius * 2)
//         sizes.ys = radius * 2

//         break

//     case 3:
//         ctx.lineTo(x - length, y)
//         ctx.arc(x - length - radius, y, radius, 0, 2 * Math.PI)

//         if (text !== '') {
//             ctx.textAlign = 'right'
//             ctx.textBaseline = 'bottom'
//             ctx.fillText(text, x - length + (radius * 2), y - textGap)
//         }

//         sizes.x = x - radius
//         sizes.y = y
//         sizes.xs = radius * 2
//         sizes.ys = length + (radius * 2)

//         break
//     }

//     if (fill) ctx.fill()
//     ctx.stroke()
//     ctx.closePath()

//     items.entities.push({
//         type: 'attribute',
//         text: text,
//         sizes: sizes
//     })
// }

// const drawLine = (startEn, endEn, startrel = '', endrel = '') => {
//     // 0 = top; 1 = right; 2 = down; 3 = left

//     const textGap = 5

//     const drawRelText = (position, halves, text) => {
//         switch (position) {
//         case 0:
//             ctx.textAlign = 'center'
//             ctx.textBaseline = 'bottom'
//             ctx.fillText(text, halves.x, halves.y - textGap)
//             break

//         case 1:
//             ctx.textAlign = 'left'
//             ctx.textBaseline = 'bottom'
//             ctx.fillText(text, halves.x, halves.y)
//             break

//         case 2:
//             ctx.textAlign = 'center'
//             ctx.textBaseline = 'top'
//             ctx.fillText(text, halves.x, halves.y + textGap)
//             break

//         case 3:
//             ctx.textAlign = 'right'
//             ctx.textBaseline = 'bottom'
//             ctx.fillText(text, halves.x, halves.y)
//         }
//     }

//     const startHalves = [
//         {x: startEn.sizes.x + (startEn.sizes.xs / 2), y: startEn.sizes.y},
//         {x: startEn.sizes.x + startEn.sizes.xs, y: startEn.sizes.y + (startEn.sizes.ys / 2)},
//         {x: startEn.sizes.x + (startEn.sizes.xs / 2), y: startEn.sizes.y + startEn.sizes.ys},
//         {x: startEn.sizes.x, y: startEn.sizes.y  + (startEn.sizes.ys / 2)}
//     ]

//     const endHalves = [
//         {x: endEn.sizes.x + (endEn.sizes.xs / 2), y: endEn.sizes.y},
//         {x: endEn.sizes.x + endEn.sizes.xs, y: endEn.sizes.y + (endEn.sizes.ys / 2)},
//         {x: endEn.sizes.x + (endEn.sizes.xs / 2), y: endEn.sizes.y + endEn.sizes.ys},
//         {x: endEn.sizes.x, y: endEn.sizes.y  + (endEn.sizes.ys / 2)}
//     ]

//     let minline = {len: Infinity}
    
//     for (let i = 0; i < 4; i++) {
//         for (let j = 0; j < 4; j++) {
//             const len = Math.sqrt(Math.pow(startHalves[i].x - endHalves[j].x, 2) + Math.pow(startHalves[i].y - endHalves[j].y, 2))
//             if (len < minline.len) minline = {len: len, start: i, end: j}
//         }
//     }

//     ctx.beginPath()
//     ctx.moveTo(startHalves[minline.start].x, startHalves[minline.start].y)

//     if ((minline.start + minline.end) % 2 == 0) {
//         if (minline.start % 2 == 0) {
//             // bottom --> top; top --> bottom
//             const avgy = (startHalves[minline.start].y + endHalves[minline.end].y) / 2
//             ctx.lineTo(startHalves[minline.start].x, avgy)
//             ctx.lineTo(endHalves[minline.end].x, avgy)

//         } else {
//             // left --> right; right --> left
//             const avgx = (startHalves[minline.start].x + endHalves[minline.end].x) / 2
//             ctx.lineTo(avgx, startHalves[minline.start].y)
//             ctx.lineTo(avgx, endHalves[minline.end].y)
//         }
        
//     } else {
//         if (minline.start % 2 == 0) {
//             // top or bottom --> left or right
//             ctx.lineTo(startHalves[minline.start].x, endHalves[minline.end].y)
//         } else {
//             // left or right --> top or bottom
//             ctx.lineTo(endHalves[minline.end].x, startHalves[minline.start].y)
//         }
//     }

//     if (startrel !== '') drawRelText(minline.start, startHalves[minline.start], startrel)
//     if (endrel !== '') drawRelText(minline.end, endHalves[minline.end], endrel)

//     ctx.lineTo(endHalves[minline.end].x, endHalves[minline.end].y)
//     ctx.stroke()
//     ctx.closePath()
// }


// TEMPORARY
// const drawExample = (relx, rely) => {
    // drawRect(ctx, 300, 200, 200, 100, 'users')
    // drawRelation(ctx, relx, rely, 200, 100, 'test')

    // drawAttribute(ctx, 310, 200, 0, true, 'ID')
    // drawAttribute(ctx, 350, 200, 0, false, 'nome')
    // drawAttribute(ctx, 415, 200, 0, false, 'cognome')
    // drawAttribute(ctx, 500, 210, 1, false, 'Codice Fiscale')
    // drawAttribute(ctx, 320, 300, 2, false, 'Email')
    // drawAttribute(ctx, 300, 210, 3, false, 'Telefono')

    // drawLine(items[0], items[1], '(0, N)', '(1, N)')
// }

// drawExample (50, 50)


// document.onmousedown = e => {
//     const bdRect = canvas.getBoundingClientRect()
//     dragstartpos.x = e.x - bdRect.x
//     dragstartpos.y = e.y - bdRect.y

//     // Check if click is out of bounds
//     if (
//         dragstartpos.x < 0 || dragstartpos.x > canvasWidth ||
//         dragstartpos.y < 0 || dragstartpos.y > canvasHeight
//     ) {
//         dragstartpos.x = Infinity
//         dragstartpos.y = Infinity
//         return
//     }

//     // Check which element is being clicked
    
//     for (let el of items.entities) {

//     }

//     isDragging = true
// }

// document.onmouseup = () => isDragging = false

// canvas.onmousemove = e => {
//     if (!isDragging) return

//     const bdRect = canvas.getBoundingClientRect()
//     ctx.clearRect(0, 0, canvasWidth, canvasHeight)
//     items.splice(0, items.length)
//     // moveRelation(ctx, 1, e.x - bdRect.x, e.y - bdRect.y)
//     drawExample(e.x - bdRect.x, e.y - bdRect.y)
// }