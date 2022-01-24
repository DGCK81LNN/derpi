/**
 * Shorthand for `document.getElementById`.
 * @param {string} id
 * @returns {HTMLElement}
 */
function $$$(id) {
  return document.getElementById(id)
}

/**
 * Clone a template.
 * This assumes that a template has only one child element.
 * @param {string} id  the template's `id` without the `-template` postfix.
 * @returns {HTMLElement}
 */
function cloneTemplate(id) {
  return $$$(id + "-template").content.cloneNode(true).firstElementChild
}

/**
 * Handle an event only once.
 *
 * @param {EventTarget} target
 * @param {string} name
 * @param {((event: Event) => any)} handler
 * @param {boolean | { capture: boolean }} [options=]
 */
function once(target, name, handler, options) {
  var f = function (event) {
    target.removeEventListener(name, f, options)
    handler.call(this, event)
  }
  target.addEventListener(name, f, options)
}

$$$("search-submit").addEventListener("click", async function (event) {
  event.preventDefault()
  var data = [...new FormData(this.form)]
  let queryParts = data.map(e => e.map(s => encodeURIComponent(s)).join("="))
  var query = "?" + queryParts.join("&")

  try {
    await search(query)
  } catch (err) {
    alert("获取图片出错：" + err)
    throw err
  }
})

/** @type {{ [tagName: string]: string }} */
const TAG_TRANSL = {
  "suggestive": "性暗示",
  "questionable": "强烈性暗示",
  "explicit": "露骨性描写",
  "semi-grimdark": "轻度黑暗",
  "grimdark": "黑暗",
  "grotesque": "血腥/恶心",
  "seizure warning": "光敏癫痫警告",
  "pony": "小马",
  "human": "人类",
  "anthro": "兽人",
}
/** @type {string[]} */
const SPOILERED_TAGS = [
  "suggestive",
  "questionable",
  "explicit",
  "semi-grimdark",
  "grimdark",
  "grotesque",
  "seizure warning",
]

// for all sizes see:
// https://github.com/derpibooru/philomena/blob/cbbdaf677fef8fdd952e167fc91ff39a13b04c06/lib/philomena/images/thumbnailer.ex#L14-L23
const IMG_SIZE_KEYWORD = "medium",
  IMG_MAX_WIDTH = 800,
  IMG_MAX_HEIGHT = 600

/** @param {string} query */
async function search(query) {
  $$$("intro").hidden = true
  $$$("browse").hidden = false
  var containerEl = $$$("browse-images")
  document.body.scrollIntoView()
  // containerEl.classList.add("loading")
  // containerEl.setAttribute("aria-hidden", "true")
  containerEl.textContent = ""
  containerEl.appendChild(cloneTemplate("loading"))

  var xhr = new XMLHttpRequest()
  xhr.open("get", "api.php" + query)
  await new Promise((res, rej) => {
    once(xhr, "load", () => res())
    once(xhr, "error", ev => rej(ev.error || ev.message))
    xhr.send()
  })

  containerEl.classList.remove("loading")
  containerEl.removeAttribute("aria-hidden")
  containerEl.textContent = ""
  var response = JSON.parse(xhr.responseText)
  for (let result of response.images) {
    // calculate size of image preview
    let { width, height } = result
    if (width >= height) {
      if (width > IMG_MAX_WIDTH) {
        height *= IMG_MAX_WIDTH / width
        height = Math.round(height)
        width = IMG_MAX_WIDTH
      }
    } else {
      if (height > IMG_MAX_HEIGHT) {
        width *= IMG_MAX_HEIGHT / height
        width = Math.round(width)
        height = IMG_MAX_HEIGHT
      }
    }

    let resultEl = cloneTemplate("result")

    let imgEl = resultEl.querySelector("img")
    imgEl.width = width
    imgEl.height = height
    let imgUrl = result.representations[IMG_SIZE_KEYWORD]

    if (result.spoilered) {
      resultEl.classList.add("result-spoilered")
      resultEl.ariaHidden = true

      let overlayEl = cloneTemplate("result-spoiler")

      let messageEl = overlayEl.querySelector(".result-spoilered-message")
      SPOILERED_TAGS.forEach(tag => {
        if (result.tags.includes(tag)) {
          let tagEl = cloneTemplate("tag")
          tagEl.querySelector(".tag-transl").textContent = TAG_TRANSL[tag]
          tagEl.querySelector(".tag-name").textContent = tag
          messageEl.append(" ", tagEl)
        }
      })

      /** @type {HTMLCanvasElement?} */
      let canvasEl = null
      if (result.tags.includes("animated")) {
        canvasEl = document.createElement("canvas")
        canvasEl.width = width
        canvasEl.height = height
        canvasEl.className = imgEl.className
        canvasEl.role = "presentation"
        let cxt = canvasEl.getContext("2d")
        imgEl.parentElement.prepend(canvasEl)
        imgEl.classList.add("visually-hidden")
        imgEl.onload = () => {
          if (!imgEl.currentSrc) return
          imgEl.onload = null
          cxt.drawImage(imgEl, 0, 0, width, height)
        }
      }

      let buttonEl = overlayEl.querySelector(".result-spoilered-button")
      once(buttonEl, "click", () => {
        resultEl.classList.remove("result-spoilered")
        overlayEl.hidden = true
        setTimeout(() => {
          overlayEl.remove()
          if (canvasEl) canvasEl.remove()
          imgEl.classList.remove("visually-hidden")
        }, 500)
        imgEl.ariaHidden = false
      })

      resultEl.querySelector(".card-img-top").append(overlayEl)
    }

    { // details
      let detailsBtnEl = resultEl.querySelector(".result-details-button")
      once(detailsBtnEl, "click", () => {
        let detailsEl = cloneTemplate("result-details")

        let loadFullEl = detailsEl.querySelector(".result-loadfull"),
          loadFullBtnEl = detailsEl.querySelector(".result-loadfull-button")
        loadFullBtnEl.textContent += ` (${(result.size / 1000000).toFixed(1)}M)`
        once(loadFullBtnEl, "click", event => {
          let loadFullBtnEl = event.currentTarget
          loadFullBtnEl.disabled = true
          loadFullBtnEl.textContent = "加载原图…"
          loadFullBtnEl.append(" ", cloneTemplate("button-spinner"))
          imgEl.src = ""
          once(imgEl, "load", () => {
            loadFullEl.remove()
            loadFullEl = loadFullBtnEl = null
          })
          imgEl.src = result.representations["full"]
        })

        { // artist
          let artists = [], editors = [], photographers = []
          for (let tag of result.tags) {
            if (tag === "artist needed")
              artists.push("佚名")
            else if (tag === "photographer needed")
              photographers.push("佚名")
            else if (tag.startsWith("artist:") && !tag.endsWith(" edits"))
              artists.push(tag.slice(7))
            else if (tag.startsWith("editor:"))
              editors.push(tag.slice(7))
            else if (tag.startsWith("photographer:"))
              photographers.push(tag.slice(13))
          }

          let artistsStr = artists.join("、") || "–"
          let parens = []
          if (photographers.length) parens.push(`${photographers.join("、")} 拍摄`)
          if (editors.length) parens.push(`${editors.join("、")} 改图`)
          else if (result.tags.includes("edit")) parens.push("图有改动")
          if (parens.length) artistsStr += ` (${parens.join("，")})`

          detailsEl.querySelector(".result-details-artist").textContent = artistsStr
        }

        { // links
          let booruLinkEl = detailsEl.querySelector(".result-details-boorulink"),
            srcEl = detailsEl.querySelector(".result-details-src")
          booruLinkEl.href = `https://derpibooru.org/images/${result.id}`

          let host = ""
          if (result.source_url)
            host = new URL(result.source_url).hostname
          if (host && host !== "derpibooru.org") {
            srcEl.querySelector("a").href = result.source_url
            srcEl.querySelector("small").textContent = `(${host})`
          } else {
            srcEl.remove()
          }
        }

        resultEl.replaceChild(detailsEl, detailsBtnEl)
      })
    }

    imgEl.src = imgUrl
    containerEl.appendChild(resultEl)
  }
}
