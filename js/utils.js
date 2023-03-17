/**
 * Convert the data of a form Element to an object
 * @param {Element} elm 
 * @returns Object
 */
export const formToObj = elm => [...new FormData(elm)].reduce((o, [k, v]) => ({...o, [k]:v}), {})

/**
 * Format a Date object to give only the time (hh:mm), see https://stackoverflow.com/a/13052187
 * @param {Date | string | Number} dtRepr 
 * @param {Boolean} fixTzForInput if set, overcorrect the time by the timezone offset, for use with input[type="time"] tags
 */
export const formatTime = (dtRepr, fixTzForInput = false) => {
    const date = new Date(dtRepr)
    if(fixTzForInput === true)
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toJSON().slice(11, 16)
}

/**
 * Convert a timestamp to a Date object
 * @param {string} timestamp The timestamp returned from the REST API
 * @returns A Date object corresponding to the given timestamp
 */
export const tsToDate = timestamp => new Date(parseInt(timestamp) * 1000)

export const formatDelay = delay => {
    if(delay == 0)
        return ""
    if(delay > 0)
        return `+${delay}`
    return delay
}