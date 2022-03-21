const yg_shift_check = document.getElementById("yg_shift_check")
const yg_ctrl_check = document.getElementById("yg_ctrl_check")
const yg_alt_check = document.getElementById("yg_alt_check")
const yg_input = document.getElementById("yg_input")
const yg_width_input = document.getElementById('yg_width_input')
const yg_height_input = document.getElementById('yg_height_input')
const yg_bottom_right_check = document.getElementById('yg_bottom_right_check')
const yg_top_left_check = document.getElementById('yg_top_left_check')
//const yg_middle_check = document.getElementById('yg_middle_check')
const yg_bottom_left_check = document.getElementById('yg_bottom_left_check')
const reset = document.getElementById("reset")
const yg_top_right_check = document.getElementById('yg_top_right_check')

const yg_poses = {
    yg_bottom_right_check: 0,
    yg_bottom_left_check: 1,
    //yg_middle_check: 2,
    yg_top_right_check: 3,
    yg_top_left_check: 4
}

function yg_checkbox_onchange(event) {
    chrome.storage.local.set(
        {"yg_sca": calculateKeys(yg_shift_check.checked, yg_ctrl_check.checked, yg_alt_check.checked)}
    )
}

function yg_pos_checkbox_onchange(event) {
    let checked = event.currentTarget.checked

    yg_bottom_right_check.checked = false
    yg_bottom_left_check.checked = false
    //yg_middle_check.checked = false
    yg_top_right_check.checked = false
    yg_top_left_check.checked = false

    if (checked) {
        event.currentTarget.checked = true

        chrome.storage.local.set(
            {"yg_pos": yg_poses[event.currentTarget.id]}
        )
    } else {
        yg_bottom_right_check.checked = true
        chrome.storage.local.set(
            {"yg_pos": yg_poses.yg_bottom_right_check}
        )
    }
}

reset.addEventListener('click',  async function (event) {
    await chrome.storage.local.set(
        {
            "yg_key": " ",
            "yg_height": 0,
            "yg_width": 0,
            "yg_pos": 0,
            "yg_pinyin": true,
            "yg_lang": "",
            "yg_accents": {}
        }
    )

    yg_shift_check.checked = false
    yg_ctrl_check.checked = true
    yg_alt_check.checked = true
    yg_input.value = " "

    yg_height_input.value = ""
    yg_width_input.value = ""

    yg_bottom_right_check.checked = true
    yg_bottom_left_check.checked = false
    //yg_middle_check.checked = false
    yg_top_right_check.checked = false
    yg_top_left_check.checked = false
})

chrome.storage.local.get(['yg_pos', 'yg_height', 'yg_width', 'yg_key', 'yg_sca'], function(result) {
    switch (result.yg_pos) {
        case 1:
            yg_bottom_left_check.checked = true; break
        /*case 2:
            yg_middle_check.checked = true; break*/
        case 3:
            yg_top_right_check.checked = true; break
        case 4:
            yg_top_left_check.checked = true; break
        default:
            yg_bottom_right_check.checked = true
    }

    if (result.yg_width) {
        yg_width_input.value = result.yg_width
    }

    if (result.yg_height) {
        yg_height_input.value = result.yg_height
    }

    yg_input.value = (result.yg_key) ? result.yg_key : " "

    if (result.yg_sca === undefined) {
        yg_ctrl_check.checked = true
        yg_alt_check.checked = true
    } else {
        if ((result.yg_sca & shiftKey) !== 0) {
            yg_shift_check.checked = true
        }

        if ((result.yg_sca & ctrlKey) !== 0) {
            yg_ctrl_check.checked = true
        }

        if ((result.yg_sca & altKey) !== 0) {
            yg_alt_check.checked = true
        }
    }

    yg_shift_check.addEventListener('change', yg_checkbox_onchange)
    yg_ctrl_check.addEventListener('change', yg_checkbox_onchange)
    yg_alt_check.addEventListener('change', yg_checkbox_onchange)

    yg_input.addEventListener('input', function(event) {
        chrome.storage.local.set({"yg_key":event.target.value})
    })

    yg_width_input.addEventListener('input', function(event) {
        chrome.storage.local.set({"yg_width":event.target.value})
    })

    yg_height_input.addEventListener('input', function(event) {
        chrome.storage.local.set({"yg_height":event.target.value})
    })

    yg_bottom_right_check.addEventListener('change', yg_pos_checkbox_onchange)

    yg_bottom_left_check.addEventListener('change', yg_pos_checkbox_onchange)

    //yg_middle_check.addEventListener('change', yg_pos_checkbox_onchange)

    yg_top_right_check.addEventListener('change', yg_pos_checkbox_onchange)

    yg_top_left_check.addEventListener('change', yg_pos_checkbox_onchange)
})