const date = new Date()

const options = {
    weekday: "short",
    month: "short",
    year: "numeric",
    day: "numeric"
}
const today = date.toDateLocaleString("en-Us", options)