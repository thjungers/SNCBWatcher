import { getVehicle } from "./api-calls.js"
import { formatTime, tsToDate, formatDelay } from "./utils.js"
import { localize, t } from "./i18n.js"

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

        /** @type {?int} The ID of the timer used to re-render the card */
        this.renderTimer = null
        /** @type {?int} The ID of the timer used to update the card data */
        this.UpdateTimer = null
        
        const template = document.getElementById("train-card-template")
        /** @type {ShadowRoot} The root shadow element */
        this.shadow = this.attachShadow({mode: "open"})
        this.shadow.appendChild(template.content.cloneNode(true))
        this.shadow.appendChild(document.getElementById("bootstrap-css").cloneNode())
        this.shadow.appendChild(document.getElementById("bootstrap-icons-css").cloneNode())
        
        const dedicatedCSS = document.createElement("link")
        dedicatedCSS.setAttribute("rel", "stylesheet")
        dedicatedCSS.setAttribute("href", "css/train-card.css")
        this.shadow.appendChild(dedicatedCSS)
    }

    static get observedAttributes() { return ["train-number", "station"] }

    connectedCallback() {
        this.shadow.querySelector(".tc-btn-refresh").addEventListener("click", () => this.update())
        this.shadow.querySelector(".tc-btn-close").addEventListener("click", () => this.remove())

        this.update() // update calls render 
        this.localize()
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

    localize() {
        localize("[data-i18n]", {document: this.shadow})
    }

    /**
     * Show an error box instead of the stops table
     * @param {Boolean} show Whether to show (true) or hide (false) the error box
     */
    showErrorBox(show) {
        if(show) {
            this.shadow.querySelector(".tc-error").classList.remove("d-none")
            this.shadow.querySelector(".tc-table").classList.add("d-none")
        }
        else {
            this.shadow.querySelector(".tc-error").classList.add("d-none")
            this.shadow.querySelector(".tc-table").classList.remove("d-none")
        }
    }

    render() {
        // clear the timer that will be set in this method. If it is not set (timer == null), clearTimeout does nothing
        clearTimeout(self.renderTimer)

        if(this.error !== null) {
            this.showErrorBox(true)
            this.shadow.querySelector(".tc-error").textContent = this.error.message
            return
        }

        this.showErrorBox(false)

        const timeDiff = ((this.nextUpdate !== null ? this.nextUpdate : this.lastUpdate) - Date.now()) / 1000
        const reltimefmt = new Intl.RelativeTimeFormat("fr", {numeric: "auto"})
        let updateText = ""

        if(this.lastUpdate === null) {
            updateText = ""
        } else if(this.nextUpdate !== null && timeDiff < 0) {
            // nextUpdate is defined but is in the past: the component should update momentarily
            updateText = t("train-card:update-soon")
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

        const tcRows = this.shadow.querySelector(".tc-rows")
        const rowTemplate = document.getElementById("train-card-row-template")
        tcRows.innerHTML = ""
        this.stops.forEach(stop => {
            const row = rowTemplate.content.cloneNode(true).firstElementChild // required to edit the reference to the element
            tcRows.appendChild(row)

            row.querySelector(".tsr-arrival-time").textContent = formatTime(stop.arrivalTime)
            if(stop.arrivalCanceled)
                row.querySelector(".tsr-arrival-time").classList.add("canceled")
            row.querySelector(".tsr-arrival-delay").textContent = formatDelay(stop.arrivalDelay)
            row.querySelector(".tsr-arrival-delay").classList.add(stop.arrivalDelay > 0 ? "text-danger" : "text-success")
            
            row.querySelector(".tsr-departure-time").textContent = formatTime(stop.departureTime)
            if(stop.departureCanceled)
                row.querySelector(".tsr-departure-time").classList.add("canceled")
            row.querySelector(".tsr-departure-delay").textContent = formatDelay(stop.departureDelay)
            row.querySelector(".tsr-departure-delay").classList.add(stop.departureDelay > 0 ? "text-danger" : "text-success")
            
            row.querySelector(".tsr-station").textContent = stop.station

            row.querySelector(".tsr-platform").textContent = stop.platform
            if(stop.platformChanged)
                row.querySelector(".tsr-platform").classList.add("text-danger")
        })
    }

    update() {
        clearTimeout(self.UpdateTimer)

        this.stops = []
        this.error = null
        getVehicle(this.trainNumber)
        .then(res => res.json())
        .then(data => {
            data.stops.stop.forEach(stop => {
                this.stops.push({
                    station: stop.station,
                    arrivalTime: tsToDate(stop.scheduledArrivalTime),
                    arrivalDelay: parseInt(stop.arrivalDelay) / 60,
                    arrivalCanceled: stop.arrivalCanceled == "1",
                    departureTime: tsToDate(stop.scheduledDepartureTime),
                    departureDelay: parseInt(stop.departureDelay) / 60,
                    departureCanceled: stop.departureCanceled == "1",
                    canceled: stop.canceled == "1",
                    platform: stop.platform,
                    platformChanged: stop.platforminfo.normal == "0"
                })
            })

            this.lastUpdate = new Date()
            this.nextUpdate = null
        })
        .catch(err => {
            const status = err.cause?.status
            this.error = {
                status: status,
                message: t([`train-card:error-${status}`, "train-card:error-undefined"])
            }
        })
        .finally(() => this.render())
    }
}