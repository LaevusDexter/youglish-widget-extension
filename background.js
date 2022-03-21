// noinspection JSJQueryEfficiency

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "yg-context-menu") {
        executeFunc(context_menu_fetch, [info.selectionText], tab.id)
    }
})

chrome.contextMenus.create({
    id: "yg-context-menu",
    title: `Search for "%s" with Youglish`,
    contexts:["selection"]
});

chrome.runtime.onMessage.addListener(youglish_handler)

function youglish_handler(request, sender, sendResponse) {
    if (request.load_widget) {
        load_widget(request, sender.tab.id)
    } else if (request.fetch) {
        chrome.storage.local.get(['yg_width', 'yg_height', 'yg_pos', 'yg_lang', 'yg_accents'], function (result) {
            let lang = (result.yg_lang) ? result.yg_lang : ""

            executeFunc(fetch, [
                request.content,
                lang,
                (result.yg_accents && result.yg_accents[lang]) ? result.yg_accents[lang] : null,
                (result.yg_pos) ? result.yg_pos : 0,
                (result.yg_width !== undefined) ? result.yg_width : null,
                (result.yg_height) ? result.yg_height : null,
                (!lang && result.yg_accents) ? result.yg_accents : null
            ], sender.tab.id)
        })
    } else if (request.resize) {
        executeFunc(resize,
            [
                (request.width !== undefined) ? request.width : null,
                request.height ? request.height : null
            ],
            sender.tab.id)
    } else if (request.reposition) {
        executeFunc(reposition, [request.pos], sender.tab.id)
    } else if (request.caption_handler_init) {
        executeFuncAllFrames(caption_handler, [request.pinyin], sender.tab.id)
    } else if (request.set_pinyin) {
        executeFunc(set_pinyin, [request.show], sender.tab.id)
    } else if (request.pause) {
        executeFunc(pause, [], sender.tab.id)
    }

    return true
}

function caption_handler(pinyin) {
    if (typeof Y === "undefined" || typeof Y.CaptionMng === "undefined") {
        return
    }

    if (Y.ygCaptionKludge !== undefined) {
        return
    }

    function refresh_size() {
        $(window).trigger("resize")
    }

    let hide_pinyin = !pinyin

    const spacing_val = 2

    function update() {
        let rc = $("#r_caption")
        let rc_size = rc.css("font-size")
        let spacing = (parseInt(rc_size, 10) + spacing_val).toString() + "px"

        rc.css({"line-height": spacing})

        if (hide_pinyin) {
            let rmc = $("#rom_caption")

            rmc.hide()

            return
        }

        let cap = Y.CaptionMng.getCaption()
        if (!cap.pinyin || cap.pinyin.length === 0) {
            return
        }

        let rmc = $("#rom_caption")

        if (rmc.length === 0) {
            rmc = document.createElement("div")

            rmc.id = "rom_caption"
            rmc.className = "rom_caption"
            rc[0].parentElement.appendChild(rmc)

            rmc = $(rmc)
        }

        rmc.show()
        rmc.html(cap.pinyin)

        rmc.css({"font-size": rc_size})
        rmc.css({"line-height": spacing})

        refresh_size()
    }

    update()

    let marker_style = document.createElement("style")
    marker_style.innerHTML = `.marker { padding: initial; }`
    document.head.appendChild(marker_style)

    $("#videowrapper").css({"padding-bottom": "25%"})

    Y.ygCaptionKludge = function (event) {
        if (event.origin.indexOf("youtube.com") !== -1) {
            return
        }

        if (event.data === "ygUpdateCaption") {
            update()
        } else if (event.data === "ygShowPinyin") {
            hide_pinyin = false

            update()
            refresh_size()
        } else if (event.data === "ygHidePinyin") {
            hide_pinyin = true

            update()
            refresh_size()
        } else if (event.data === "ygRefreshSize") {
            refresh_size()
        }
    }

    window.addEventListener("message", Y.ygCaptionKludge, false)
}

function set_pinyin(show) {
    let msg
    if (show) {
        msg = "ygShowPinyin"
    } else {
        msg = "ygHidePinyin"
    }

    ygPostMessage(msg)
}

function fetch(content, lang, accent, pos, width, height, accent_set) {
    if (!accent) {
        accent = undefined
    }

    ygWidget.fetch(content, lang, accent, pos, width, height, accent_set)
}

function context_menu_fetch(content) {
    let cmsf = document.getElementById("yg-context-menu-selection-fetcher")
    console.log("context_menu_fetch", content, cmsf)
    if (!cmsf || !content) {
        return
    }

    console.log(content)

    cmsf.title = content
    cmsf.click()
}

function pause() {
    ygWidget.pause()
}

function inject_youglish_widget(fetch_content, lang, accent, pos, width, height, accent_set) {
    let script = document.createElement("script")
    script.src = "https://youglish.com/public/emb/widget.js"
    script.onload = function () {
        ygWidget.fetch(
            fetch_content,
            lang,
            (accent) ? accent : undefined,
            pos,
            (width !== null) ? width : undefined,
            (height !== null) ? height : undefined,
            accent_set
        )
    }

    document.body.appendChild(script)
}

async function load_widget(request, id) {
    await injectFile("youglish.js", id)
    await chrome.storage.local.get(['yg_width', 'yg_height', 'yg_pos', 'yg_lang', 'yg_accents'], function (result) {
        let lang = (result.yg_lang) ? result.yg_lang : ""

        executeFunc(inject_youglish_widget, [
            request.content,
            lang,
            (result.yg_accents && result.yg_accents[lang]) ? result.yg_accents[lang] : null,
            (result.yg_pos) ? result.yg_pos : 0,
            (result.yg_width) ? result.yg_width : null,
            (result.yg_height) ? result.yg_height : null,
            (!lang && result.yg_accents) ? result.yg_accents : null
        ], id)
    })
}

function resize(width, height) {
    ygWidget.resize(
        (width !== null) ? width : undefined,
        (height !== null) ? height : undefined,
        true, true
    )

    if (width === 0) {
        ygSetFrameDefaultWidth()

        if (height === 0) {
            ygRefreshSize()
        }
    }
}

function reposition(pos) {
    ygReposition(pos)
}

function executeFuncAllFrames(func, args, id) {
    chrome.scripting.executeScript(
        {
            target: {tabId: id, allFrames: true},
            func: func,
            args: args,
            world: "MAIN"
        })
}

function executeFunc(func, args, id) {
    return chrome.scripting.executeScript(
        {
            target: {tabId: id},
            func: func,
            args: args,
            world: "MAIN"
        })
}

function injectFile(file, id) {
    return chrome.scripting.executeScript(
        {
            target: {tabId: id},
            files: [file],
            world: "MAIN"
        })
}

