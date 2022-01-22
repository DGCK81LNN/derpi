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
    xhr.onload = () => res()
    xhr.onerror = ev => rej(ev.error || ev.message)
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
    imgEl.src = result.representations[IMG_SIZE_KEYWORD]

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

      let buttonEl = overlayEl.querySelector(".result-spoilered-button")
      buttonEl.addEventListener("click", () => {
        resultEl.classList.remove("result-spoilered")
        overlayEl.hidden = true
        imgEl.ariaHidden = false
      })

      resultEl.append(overlayEl)
    }

    containerEl.appendChild(resultEl)
  }
}
