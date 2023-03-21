"use strict"

import TrainCard from "./train-card.js"
import setTheme from "./theme.js"
import { getStations, getVehicle, getConnections } from "./api-calls.js"
import { formToObj, formatTime, tsToDate } from "./utils.js"
import { localize, t } from "./i18n.js"

/** @type {bootstrap.Modal} */
let watchTrainModal
/** @type {Array} */
let allStations

const init = () => {
    customElements.define("train-card", TrainCard)

    setTheme({preferred: true})

    watchTrainModal = new bootstrap.Modal(document.getElementById("watch-train-modal"), {})

    document.getElementById("request-notifications-btn").addEventListener("click", requestNotificationPermission)
    document.getElementById("toggle-theme-btn").addEventListener("click", () => setTheme({toggle: true}))

    // load dataset when modal is shown
    document.getElementById("watch-train-modal").addEventListener("show.bs.modal", initModal)
    // reset validation state for all form inputs on input change
    document.querySelectorAll("input").forEach(
        elm => elm.addEventListener("input", 
            event => event.target.classList.remove("is-valid", "is-invalid")
        )
    )
    // validate input list
    document.querySelectorAll("input[list]").forEach(
        elm => elm.addEventListener("blur", validateInputList)
    )
    // handle modal forms
    document.getElementById("modal-train-number").addEventListener("blur", loadVehicle)
    document.getElementById("form-by-train-number").addEventListener("submit", addByTrainNumber)
    document.getElementById("form-by-connection").addEventListener("submit", loadConnections)
    // reset the modal forms when it is hidden
    document.querySelectorAll(".modal").forEach(
        modal => modal.addEventListener("hidden.bs.modal", resetModal)
    )
    localize("body")
}

const requestNotificationPermission = () => {
    throw new Error("NotImplemented")
}

const initModal = () => {
    loadTrainStations()
    document.querySelectorAll("#watch-train-modal input[type='time']").forEach(elm => elm.value = formatTime(new Date(), true))
}

/**
 * Load all train stations
 */
const loadTrainStations = () => {
    const datalist = document.getElementById("all-stations")
    if(datalist.dataset.loaded == "0") {
        getStations()
        .then(res => res.json())
        .then(data => {
            allStations = data.station.map(station => station.name)
            allStations.sort()
            datalist.append(
                ...allStations.map(station => {
                    const elm = document.createElement("option")
                    elm.value = station
                    return elm
                })
            )
            datalist.dataset.loaded = "1"
        })
    }
}

/**
 * Load the vehicle's data
 * @param {Event} event 
 */
const loadVehicle = event => {
    const elm = event.target
    if(elm.value == "") 
        return

    document.getElementById("modal-train-number-spinner").classList.remove("d-none")
    getVehicle(elm.value)
    .then(res => res.json())
    .then(data => {
        elm.classList.add("is-valid")
        elm.value = data.vehicleinfo.shortname
        const select = document.getElementById("modal-train-number-station")
        select.innerHTML = ""
        select.append(
            document.createElement("option"),
            ...data.stops.stop.map(stop => {
                const elm = document.createElement("option")
                elm.value = stop.station
                elm.innerText = stop.station
                return elm
            })
        )
    })
    .catch(err => {
        elm.classList.add("is-invalid")
        console.error(err)
    })
    .finally(() => {
        document.getElementById("modal-train-number-spinner").classList.add("d-none")
    })
}

/**
 * Load and display connections for the given parameters
 * @param {Event} event
 */
const loadConnections = event => {
    event.preventDefault()
    const data = formToObj(event.target)
    document.getElementById("found-connections").innerHTML = ""

    document.getElementById("modal-connection-spinner").classList.remove("d-none")
    getConnections(data["start-station"], data["end-station"], data["time-type"], data["time"])
    .then(res => res.json())
    .then(data => {
        document.getElementById("found-connections").append(
            ...data.connection.map(connection => {
                const elm = document.createElement("button")
                elm.classList.add("list-group-item", "list-group-item-action")
                elm.setAttribute("type", "button")

                let btnText = connection.departure.vehicleinfo.shortname
                btnText += ` – ${formatTime(tsToDate(connection.departure.time))}-${formatTime(tsToDate(connection.arrival.time))}, `
                if(!connection.vias || connection.vias.number == 0)
                    btnText += "direct"
                else
                    btnText += "via " + connection.vias.via.map(via => via.station).join(", ")
                elm.textContent = btnText

                elm.addEventListener("click", () => addByConnection(elm, connection.departure.vehicleinfo.shortname, connection.departure.station))
                return elm
            })
        )
    })
    .catch(err => {
        if(err.cause?.status == 404)
            document.getElementById("found-connections").textContent = t("modal:connectionNotFound")
        else {
            document.getElementById("found-connections").textContent = t("modal:connectionLoadError")
            console.error(err)
        }
    })
    .finally(() => {
        document.getElementById("modal-connection-spinner").classList.add("d-none")
    })
}

/**
 * Check input content is in the datalist
 * @param {Event} event 
 */
const validateInputList = event => {
    if(allStations.includes(event.target.value))
        event.target.classList.add("is-valid")
    else
        event.target.classList.add("is-invalid")
}

/**
 * Add a new train watch card using the train number
 * @param {Event} event 
 */
const addByTrainNumber = event => {
    event.preventDefault()
    const data = formToObj(event.target)
    addTrainCard(
        data["train-number"],
        data["station"]
    )
    watchTrainModal.hide()
}

/**
 * Add a new train watch card using a connection
 * @param {Element} elm 
 * @param {string} trainNumber 
 * @param {string} station 
 */
const addByConnection = (elm, trainNumber, station) => {
    elm.disabled = true
    addTrainCard(trainNumber, station)
}

/**
 * Add a new train watch card
 * @param {string} trainNumber
 * @param {string} station
 */
const addTrainCard = (trainNumber, station) => {
    const card = document.createElement("train-card")
    card.setAttribute("train-number", trainNumber)
    card.setAttribute("station", station)
    document.querySelector("#watched-trains > .row").append(card)
}

/**
 * Reset the modal forms
 * @param {Event} event 
 */
const resetModal = event => {
    const modal = event.target
    modal.querySelectorAll("form").forEach(form => form.reset())
    modal.querySelectorAll(".is-valid, .is-invalid").forEach(elm => elm.classList.remove("is-valid", "is-invalid"))
    modal.querySelectorAll("[default-empty]").forEach(elm => elm.innerHTML = "")
}

if(document.readyState === "complete")
    init()
else
    document.addEventListener("DOMContentLoaded", init)