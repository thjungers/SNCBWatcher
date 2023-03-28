const apiUrl = "https://api.irail.be"
const format = "json"

/**
 * Check the return code of the response and throw an error if it is not OK
 * @param {Response} res the fetch Response
 * @returns the response
 */
const throwNotOkResponse = res => {
    if (!res.ok)
        throw new Error("Not 2xx response", { cause: res })
    return res
}

/**
 * Perform an API call with the given string, using the format and language parameters
 * @param {string} uri the URI of the API call, relative to the root API URL
 * @returns the fetch Promise
 */
const request = async uri => {
    const sep = uri.includes("?") ? "&" : "?"
    const lang = document.documentElement.lang
    return fetch(apiUrl + uri + sep + `format=${format}&lang=${lang}`)
    .then(throwNotOkResponse)
}

/**
 * Get all stations from the API
 * @returns the fetch Promise
 */
export const getStations = async () => request("/stations/")

/**
 * Get a vehicle from the API
 * @param {string} trainNumber the train number
 * @returns the fetch Promise
 */
export const getVehicle = async trainNumber => request(`/vehicle/?id=BE.NMBS.${trainNumber}`)

/**
 * Get connections
 * @param {string} startStation the departure station
 * @param {string} endStation the arrival station
 * @param {"departure" | "arrival"} timeSel the type of time
 * @param {string} time the departure or arrival time, in format hh[:]mm
 * @returns the fetch Promise
 */
export const getConnections = async (startStation, endStation, timeSel, time) => {
    time = time.replace(":", "")
    return request(`/connections/?from=${startStation}&to=${endStation}&timesel=${timeSel}&time=${time}`)
}