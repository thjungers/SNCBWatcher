import { getVehicle } from "./api-calls.js"

/**
 * Custom component for train watch cards
 * @class
 * @constructor
 */
export default class TrainCard extends HTMLElement {
    constructor() {
        super()

        /** @type {string} The train number, set by the "train-number" attribute */
        this.trainNumber = ""
        /** @type {string} The watched station, set by the "station" attribute */
        this.station = ""
        /** @type {?Date} The time of the last update */
        this.lastUpdate = null
        /** @type {?Date} The time of the next planned update */
        this.nextUpdate = null

        /** @type {Boolean} Whether the custom element is connected to the DOM */
        this.connected = false
        
        const template = document.getElementById("train-card-template")
        /** @type {ShadowRoot} The root shadow element */
        this.shadow = this.attachShadow({mode: "open"})
        this.shadow.appendChild(template.content.cloneNode(true))
        this.shadow.appendChild(document.getElementById("bootstrap-css").cloneNode())
        this.shadow.appendChild(document.getElementById("bootstrap-icons-css").cloneNode())

        /** @type {?int} The ID of the timer used to re-render the card */
        this.renderTimer = null
        /** @type {?int} The ID of the timer used to update the card data */
        this.UpdateTimer = null
    }

    static get observedAttributes() { return ["train-number", "station"] }

    connectedCallback() {
        this.shadow.querySelector(".tc-btn-refresh").addEventListener("click", () => this.update())
        this.shadow.querySelector(".tc-btn-close").addEventListener("click", () => this.remove())

        this.update() // update calls render 
        this.connected = true
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "train-number")
            this.trainNumber = newValue
        else if(name === "station")
            this.station = newValue
        else
            throw new Error(`unexpected change for attribute ${name} from ${oldValue} to ${newValue}`)
        
        if(this.connected) {
            // only update and render if this change occured after the element was connected to the DOM
            this.update() // update calls render 
        }
    }

    render() {
        // clear the timer that will be set in this method. If it is not set (timer == null), clearTimeout does nothing
        clearTimeout(self.renderTimer)

        const timeDiff = ((this.nextUpdate !== null ? this.nextUpdate : this.lastUpdate) - Date.now()) / 1000
        const reltimefmt = new Intl.RelativeTimeFormat("fr", {numeric: "auto"})
        let updateText = ""

        if(this.lastUpdate === null) {
            updateText = ""
        } else if(this.nextUpdate !== null && timeDiff < 0) {
            // nextUpdate is defined but is in the past: the component should update momentarily
            updateText = "bientôt"
        } else if(Math.abs(timeDiff) < 90) {
            updateText = reltimefmt.format(Math.round(timeDiff), "second")
            self.renderTimer = setTimeout(elm => elm.render(), 5 * 1000, this)
        } else if(Math.abs(timeDiff) < 3600) {
            updateText = reltimefmt.format(Math.round(timeDiff / 60), "minute")
            self.renderTimer = setTimeout(elm => elm.render(), 30 * 1000, this)
        } else if(Math.abs(timeDiff) < 60*60*24) {
            updateText = reltimefmt.format(Math.round(timeDiff / 3600), "hour")
            self.renderTimer = setTimeout(elm => elm.render(), 30 * 60 * 1000, this)
        } else {
            updateText = reltimefmt.format(Math.round(timeDiff / (60*60*24)), "day")
            self.renderTimer = setTimeout(elm => elm.render(), 12 * 60 * 60 * 1000, this)
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
        clearTimeout(self.UpdateTimer)

        getVehicle(this.trainNumber)
        .then(res => res.json())
        .then(data => {
            this.lastUpdate = new Date()
            this.nextUpdate = null
        })
        .finally(() => this.render())
    }
}
