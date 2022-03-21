const shiftKey = 0b001
const altKey = 0b010
const ctrlKey = 0b100

function calculateKeys(shift, ctrl, alt) {
    let result = 0

    result = shift ? result | shiftKey : result
    result = alt ? result | altKey : result
    result = ctrl ? result | ctrlKey : result

    return result
}