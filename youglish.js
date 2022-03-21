//https://youglish.com/api/doc/js-api

var ygWidget
var ygMaxScreen = false

const ygWidgetName = "yg-widget"
const ygWidgetFrameName = "fr_yg-widget"

function onYouglishAPIReady() {
    ygWidget = new YG.Widget(ygWidgetName, {
        components: /*1 + 2 +*/ 8 + 16 + 64 + 2048 + 4096,
        events: {
            "onPlayerReady": ygInitializeCaptionHandler,
            "onCaptionChange": ygUpdateCaption
        }
    })

    ygWidget.setAdWidthRatio = 10

    let fixed_width, fixed_height
    let max_screen_width, max_screen_height

    let resize = ygWidget.resize
    ygWidget.resize = function (width, height, somebool, new_size, max_screen) {
        if (new_size) {
            fixed_width = (width) ? width : undefined
            fixed_height = (height) ? height : undefined
        } else if (max_screen) {
            max_screen_width = width
            max_screen_height = height
        }

        width = (max_screen_width) ? undefined : (fixed_width) ? fixed_width : width
        height = (max_screen_height) ? max_screen_height : (fixed_height) ? fixed_height : height

        resize.call(this, width, height, somebool)

        ygUpdateCaption()
    }

    let close = YG.close
    YG.close = function (widget) {
        close.call(this, widget)

        max_screen_height = 0
        max_screen_width = 0

        ygMaxScreen = false
    }

    const hangul_range = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/
    const kana_range = /[\u3041-\u3096\u309D-\u309F]|\uD82C\uDC01|\uD83C\uDE00|[\u30A1-\u30FA\u30FD-\u30FF\u31F0-\u31FF\u32D0-\u32FE\u3300-\u3357\uFF66-\uFF6F\uFF71-\uFF9D]|\uD82C\uDC00/
    const chinese_range = /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/
    const russian_range = /[а-яА-ЯёЁѢѣ]/

    let last_query
    let yg_fetch = ygWidget.fetch
    ygWidget.fetch = function (query, lang, accent, pos, width, height, accent_set) {
        if (!query) {
            query = last_query
        }

        let autolang = false
        if (!lang) {
            if (hangul_range.test(query)) {
                lang = "korean"
            } else if (kana_range.test(query)) {
                lang = "japanese"
            } else if (chinese_range.test(query)) {
                lang = "chinese"
            } else if (russian_range.test(query)) {
                lang = "russian"
            } else {
                lang = "english"
            }

            autolang = true

            accent = (accent_set && accent_set[lang]) ? accent_set[lang] : undefined
        }

        last_query = query

        yg_fetch.call(this, query, lang, accent)

        ygWidget.resize(width, height, true, true)

        ygFixRestricted(lang, autolang)

        if (is_hidden) {
            YG.toggle(ygWidgetName)
        }

        if (pos === undefined) {
            return
        }

        ygReposition(pos)
    }

    let replay = ygWidget.replay
    ygWidget.replay = function () {
        replay.call(this)

        ygUpdateCaption()
    }

    let is_hidden = false
    let toggle = YG.toggle
    YG.toggle = function (widget) {
        toggle.call(this, widget)

        is_hidden = !is_hidden
    }

    let css = `
    div#yg-widget {
        background-color: transparent !important;
        position: fixed;
    }`

    let style = document.createElement("style")
    style.innerHTML = css
    document.head.appendChild(style)
}

function ygFixRestricted(lang, autolang) {
    let pinyin_button = document.getElementById("yg-pinyin-button")

    if (pinyin_button) {
        if (lang !== "chinese") {
            pinyin_button.style.display = "none"
        } else {
            pinyin_button.style.display = "block"
        }

        if (autolang) {
            ygCreateAccentMenu(lang)
        }

        return
    }

    let container = document.getElementById(ygWidgetName)
    if (!container) {
        return
    }

    let sa = Array.from(container.querySelectorAll('span'))

    let close = sa.find(el => el.textContent.startsWith("×"))
    let toggle = sa.find(el => el.textContent.startsWith("☰"))

    close.onclick = undefined
    toggle.onclick = undefined

    close.addEventListener("click", function () {
        YG.close(ygWidgetName)
    })

    toggle.addEventListener("click", function () {
        YG.toggle(ygWidgetName)
    })

    let max_screen = document.createElement("span")
    max_screen.title = "Maximize/minimaze widget"
    max_screen.id = "yg-max-screen"
    max_screen.style.cssText = toggle.style.cssText
    max_screen.innerHTML = "⛶"

    max_screen.addEventListener("click", function () {
        let container = document.getElementById(ygWidgetName)
        if (!container) {
            return
        }

        if (!ygMaxScreen) {
            container.style.width = "100%"
            ygWidget.resize("100%", window.innerHeight - this.parentElement.offsetHeight, true, false, true)
            ygSetFrameDefaultWidth()

            ygMaxScreen = true
        } else {
            container.style.width = ""
            ygWidget.resize(0, 0, true, false, true)
            ygRefreshSize()

            ygMaxScreen = false
        }
    })

    close.parentElement.insertBefore(max_screen, close.nextSibling)

    pinyin_button = document.createElement("span")
    pinyin_button.title = "Show/hide pinyin"
    pinyin_button.id = "yg-pinyin-button"
    pinyin_button.innerHTML = "拼音"
    pinyin_button.style.cssText = max_screen.style.cssText

    let font_size = document.defaultView.getComputedStyle(max_screen, null).fontSize
    pinyin_button.style.fontSize = font_size
    pinyin_button.style.float = "left"
    pinyin_button.addEventListener('click', function () {
        ygTogglePinyin()
    })

    max_screen.parentElement.appendChild(pinyin_button)

    if (lang !== "chinese") {
        pinyin_button.style.display = "none"
    }

    ygCreateLanguageMenu((autolang) ? lang : undefined)
}

function ygReposition(pos) {
    let container = document.getElementById(ygWidgetName)
    if (!container) {
        return
    }

    container.style.top = ""
    container.style.bottom = ""
    container.style.right = ""
    container.style.left = ""

    switch (pos) {
        case 1:
            container.style.bottom = "0"
            container.style.left = "0"

            break
        /*case 2:
            container.style.top = "0"
            container.style.left = "0"
            container.style.right = "0"
            container.style.bottom = "0"

            break*/
        case 3:
            container.style.top = "0"
            container.style.right = "0"

            break
        case 4:
            container.style.top = "0"
            container.style.left = "0"

            break
        default:
            container.style.bottom = "0"
            container.style.right = "0"
    }
}

function ygSetFrameDefaultWidth() {
    let frame = document.getElementById(ygWidgetFrameName)
    if (frame) {
        frame.style.width = "100%"
    }
}

function ygCreateAccentMenu(lang) {
    let accent_menu = document.getElementById("yg-accent-menu-creator")
    if (!accent_menu) {
        return
    }

    accent_menu.title = lang
    accent_menu.click()
}

function ygCreateLanguageMenu(autolang) {
    let language_menu = document.getElementById("yg-language-menu-creator")
    if (!language_menu) {
        return
    }

    language_menu.title = (autolang) ? autolang : undefined
    language_menu.click()
}

function ygTogglePinyin() {
    document.getElementById("yg-pinyin-toggler").click()
}

function ygInitializeCaptionHandler() {
    document.getElementById("yg-caption-handler-initializer").click()
}

function ygUpdateCaption() {
    ygPostMessage("ygUpdateCaption")
}

function ygRefreshSize() {
    ygPostMessage("ygRefreshSize")
}

function ygPostMessage(msg) {
    let frame = document.getElementById(ygWidgetFrameName)
    if (!frame || !frame.contentWindow) {
        return
    }

    frame.contentWindow.postMessage(msg, "https://youglish.com")
}

console.log("youglish.js")