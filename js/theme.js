let theme = "light"

/**
 * Set the theme of the body to the value of "theme"
 */
const setTheme = () => document.body.setAttribute("data-bs-theme", theme)

/**
 * Toggle the value of the theme
 * @param {string} value "light" or "dark"
 * @returns the toggled value
 */
const toggleTheme = value => {
    if(value === "light")
        return "dark"
    return "light"
}

/**
 * General function to set the theme of the app
 * @param {"light" | "dark"} value the theme type
 * @param {Boolean} preferred use the preferred theme of the browser
 * @param {Boolean} toggle toggle the current theme
 */
export default function({value, preferred=false, toggle=false}) {
    if(value !== undefined) {
        if(value !== "light" && value !== "dark"){
            throw new Error(`Unexpected value: got ${value}`)
            return
        }
        theme = value
    }
    else if(preferred)
        theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "dark" : "light"
    else if(toggle)
        theme = toggleTheme(theme)
    
    setTheme()
}
