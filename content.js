let yg_ex_keys = ctrlKey | altKey
let yg_key = " "
let pinyin = true
let widget_loaded = false

document.addEventListener("keyup", function (event) {
    let keys = calculateKeys(event.shiftKey, event.ctrlKey, event.altKey)

    if (keys === yg_ex_keys && event.key === yg_key) {
        let content = window.getSelection().toString()

        youglish_fetch(content)
    }
})

function youglish_fetch(content) {
    if (!content || content.length === 0) {
        return
    }

    let container = document.getElementById("yg-widget")
    if (!container) {

        container = document.createElement("div")
        container.id = "yg-widget"

        let caption_initializer = document.createElement("div")
        caption_initializer.id = "yg-caption-handler-initializer"
        caption_initializer.style.display = "none"
        caption_initializer.addEventListener("click", function () {
            sendMessage({caption_handler_init: true, pinyin: pinyin})
        })

        let pinyin_toggler = document.createElement("div")
        pinyin_toggler.id = "yg-pinyin-toggler"
        pinyin_toggler.style.display = "none"
        pinyin_toggler.addEventListener('click', function () {
            chrome.storage.local.get(['yg_pinyin'], function (result) {
                chrome.storage.local.set(
                    {
                        "yg_pinyin": (result.yg_pinyin !== undefined) ? !result.yg_pinyin : !pinyin
                    })
            })
        })

        let language_menu_creator = document.createElement("div")
        language_menu_creator.id = "yg-language-menu-creator"
        language_menu_creator.style.display = "none"
        language_menu_creator.addEventListener("click", function (event) {
            let autolang = event.target.title

            chrome.storage.local.get(['yg_lang'], function (result) {
                create_language_menu(
                    (result.yg_lang) ? result.yg_lang : "",
                    autolang
                )
            })
        })

        let accent_menu_creator = document.createElement("div")
        accent_menu_creator.id = "yg-accent-menu-creator"
        accent_menu_creator.style.display = "none"
        accent_menu_creator.addEventListener("click", function (event) {
            let lang = event.target.title

            create_accent_menu(lang)
        })

        document.body.appendChild(container)
        document.body.appendChild(caption_initializer)
        document.body.appendChild(pinyin_toggler)
        document.body.appendChild(language_menu_creator)
        document.body.appendChild(accent_menu_creator)

        sendMessage({load_widget: true, content: content})

        widget_loaded = true

        return
    }

    sendMessage({fetch: true, content: content})
}

let context_menu_selection_fetcher = document.createElement("div")
context_menu_selection_fetcher.id = "yg-context-menu-selection-fetcher"
context_menu_selection_fetcher.style.display = "none"
context_menu_selection_fetcher.addEventListener("click", function (event) {
    let content = event.target.title

    youglish_fetch(content)
})

document.body.appendChild(context_menu_selection_fetcher)

const languages = [
    ["", "auto"],
    ["english", "eng"],
    ["chinese", "chin"],
    ["russian", "rus"],
    ["japanese", "jap"],
    ["korean", "kor"],
    ["spanish", "spa"],
    ["polish", "pol"],
    ["italian", "ital"],
    ["greek", "grk"],
    ["german", "germ"],
    ["french", "fren"],
    ["swedish", "swed"],
    ["turkish", "turk"],
    ["dutch", "dut"],
    ["hebrew", "heb"],
    ["arabic", "arab"],
    ["signlanguage", "sign"],
    ["portuguese", "port"]
]

const accents = {
    "arabic": [
        "any", "sa", "eg", "dz", "ma", "tn", "lb", "sy", "jo",
        "iq", "qa", "ae", "kw", "bh", "om af", "ps", "il", "ly"
    ],
    "chinese": ["any", "cn", "tw", "sg", "hk", "sh", "mo", "mn"],
    "dutch": ["any", "nl", "be"],
    "english": ["any", "us", "uk", "aus", "ca", "ie", "sco", "nz"],
    "french": ["any", "fr", "qc", "be", "ch"],
    "portuguese": ["any", "pt", "br"],
    "spanish": ["any", "es", "la"],
    "signlanguage": ["any", "us", "uk", "ie", "nz", "aus", "is"]
}

function create_language_menu(selected_lang, autolang) {
    let pinyin_button = document.getElementById("yg-pinyin-button")
    if (!pinyin_button) {
        return
    }

    let language_menu = document.createElement("select")
    language_menu.id = "yg-language-menu"
    language_menu.style.cssText = pinyin_button.style.cssText
    language_menu.style.border = "none"
    language_menu.style.float = "left"
    language_menu.style.display = "block"
    language_menu.style.padding = "initial"
    language_menu.style.margin = "initial"
    language_menu.style.marginLeft = "5px"
    language_menu.style.fontFamily = "initial"
    language_menu.style.backgroundColor = "transparent"

    for (let i = 0; i < languages.length; i++) {
        let opt = document.createElement("option")
        let l = languages[i]

        if (l[0] === selected_lang) {
            opt.defaultSelected = true
        }

        opt.value = l[0]
        opt.title = l[0]
        opt.innerHTML = l[1]

        language_menu.appendChild(opt)
    }

    language_menu.addEventListener("change", function (event) {
        let lang = event.target.value

        chrome.storage.local.set({"yg_lang": lang}, function () {
            sendMessage({fetch: true, content: ""})
            create_accent_menu(lang)
        })
    })

    language_menu.addEventListener("click", function () {
        sendMessage({pause: true})
    })

    pinyin_button.parentElement.insertBefore(language_menu, pinyin_button.previousSibling)

    create_accent_menu((selected_lang) ? selected_lang : autolang)
}

function create_accent_menu(lang) {
    if (!lang) {
        return
    }

    chrome.storage.local.get(['yg_accents'], function (result) {
        let accent_menu = document.getElementById("yg-accent-menu")
        if (accent_menu) {
            accent_menu.parentElement.removeChild(accent_menu)
        }

        let lang_accents = accents[lang]
        if (!lang_accents) {
            return
        }

        let language_menu = document.getElementById("yg-language-menu")
        if (!language_menu) {
            return
        }

        accent_menu = document.createElement("select")
        accent_menu.id = "yg-accent-menu"
        accent_menu.style.cssText = language_menu.style.cssText
        accent_menu.style.padding = "initial"
        accent_menu.style.margin = "initial"
        accent_menu.style.marginLeft = "5px"
        accent_menu.style.fontFamily = "initial"

        let selected_accent = (result.yg_accents && result.yg_accents[lang]) ? result.yg_accents[lang] : "any"

        for (let i = 0; i < lang_accents.length; i++) {
            let opt = document.createElement("option")

            if (lang_accents[i] === selected_accent) {
                opt.defaultSelected = true
            }

            opt.value = (lang_accents[i] === "any") ? "" : lang_accents[i]
            opt.innerHTML = lang_accents[i]

            accent_menu.appendChild(opt)
        }

        accent_menu.addEventListener("change", function (event) {
            chrome.storage.local.get(['yg_accents'], function (result) {
                result = (result.yg_accents) ? result.yg_accents : {}
                result[lang] = event.target.value

                chrome.storage.local.set({"yg_accents": result}, function () {
                    sendMessage({fetch: true, content: ""})
                })
            })
        })

        accent_menu.addEventListener("click", function () {
            sendMessage({pause: true})
        })

        language_menu.parentElement.insertBefore(accent_menu, language_menu.nextSibling)
    })
}

function sendMessage(msg) {
    chrome.runtime.sendMessage(msg)
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (!widget_loaded) {
        return
    }

    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
        switch (key) {
            case "yg_width":
                sendMessage({resize: true, width: newValue})

                break
            case "yg_height":
                sendMessage({resize: true, height: newValue})

                break
            case "yg_pos":
                sendMessage({reposition: true, pos: newValue})

                break
            case "yg_pinyin":
                pinyin = newValue

                sendMessage({set_pinyin: true, show: newValue})

                break
            case "yg_sca":
                yg_ex_keys = newValue

                break
            case "yg_key":
                yg_key = newValue

                break
        }
    }
})

chrome.storage.local.get(['yg_sca', 'yg_key', 'yg_pinyin'], function (result) {
    if (result.yg_sca) {
        yg_ex_keys = result.yg_sca
    }

    if (result.yg_key) {
        yg_key = result.yg_key
    }

    pinyin = (result.yg_pinyin !== undefined) ? result.yg_pinyin : pinyin
})




