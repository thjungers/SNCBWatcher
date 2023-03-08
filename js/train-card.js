export default class TrainCard extends HTMLElement {
    constructor() {
        super()

        this.trainNumber = ""
        this.station = ""
        this.lastUpdate = null
        this.nextUpdate = null

        this.connected = false
        
        const template = document.getElementById("train-card-template")
        this.shadow = this.attachShadow({mode: "open"})
        this.shadow.appendChild(template.content.cloneNode(true))
        this.shadow.appendChild(document.getElementById("bootstrap-css").cloneNode())
        this.shadow.appendChild(document.getElementById("bootstrap-icons-css").cloneNode())
    }

    static get observedAttributes() { return ["train-number", "station", "last-update", "next-update"] }

    connectedCallback() {
        this.render()
        this.connected = true
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "train-number")
            this.trainNumber = newValue
        else if(name === "station")
            this.station = newValue
        else if(name === "last-update")
            this.lastUpdate = new Date(newValue)
        else if(name === "next-update")
            this.nextUpdate = newValue !== null ? new Date(newValue) : null
        else
            throw new Error(`unexpected change for attribute ${name} from ${oldValue} to ${newValue}`)
        
        if(this.connected)
            this.render() // only render if this change occured after the element was connected to the DOM
    }

    render() {
        const timeDiff = ((this.nextUpdate !== null ? this.nextUpdate : this.lastUpdate) - Date.now()) / 1000
        const reltimefmt = new Intl.RelativeTimeFormat("fr", {numeric: "auto"})
        let updateText = ""

        if(this.lastUpdate === null) {
            updateText = ""
        } else if(this.nextUpdate !== null && timeDiff < 0) {
            // next-update is defined but is in the past
            updateText = "bientôt"
        } else if(Math.abs(timeDiff) < 90) {
            updateText = reltimefmt.format(Math.round(timeDiff), "second")
            setTimeout(elm => elm.render(), 5 * 1000, this)
        } else if(Math.abs(timeDiff) < 3600) {
            updateText = reltimefmt.format(Math.round(timeDiff / 60), "minute")
            setTimeout(elm => elm.render(), 30 * 1000, this)
        } else if(Math.abs(timeDiff) < 60*60*24) {
            updateText = reltimefmt.format(Math.round(timeDiff / 3600), "hour")
            setTimeout(elm => elm.render(), 30 * 60 * 1000, this)
        } else {
            updateText = reltimefmt.format(Math.round(timeDiff / (60*60*24)), "day")
            setTimeout(elm => elm.render(), 12 * 60 * 60 * 1000, this)
        }

        if(updateText == "")
            this.shadow.querySelector(".tc-footer").classList.add("d-none")
        else
            this.shadow.querySelector(".tc-footer").classList.remove("d-none")

        this.shadow.querySelector(".tc-train-number").textContent = this.trainNumber
        this.shadow.querySelector(".tc-station").textContent = this.station
        this.shadow.querySelector(".tc-update").textContent = updateText
    }

    update() {
        fetch(apiUrl + `/vehicle/?id=BE.NMBS.${this.trainNumber}&format=json&lang=fr`)
        .then(res => {
            if(!res.ok) 
                throw new Error("Not 2xx response", {cause: res})
            return res
        })
        .then(res => res.json())
        .then(data => {
            this.setAttribute("last-update", new Date().toISOString())
        })
    }
}
