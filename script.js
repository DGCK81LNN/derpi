Array.prototype.forEach.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'), function (el) {
  new bootstrap.Tooltip(el)
})

function $$$(id) { return document.getElementById(id) }

function dismissWarning(index) {
  var articleEl = $$$("result-" + index)
  articleEl.classList.remove("result-spoilered")
  var overlayEl = articleEl.querySelector(".result-spoilered-overlay")
  if (overlayEl) overlayEl.hidden = true
  articleEl.querySelector("img").removeAttribute("aria-hidden")
}

$$$("search-submit").addEventListener("click", async function (event) {
  event.preventDefault()
  var data = new FormData(this.form)
  var query = "?" + [...data].map(e => e.map(s => encodeURIComponent(s)).join("=")).join("&")
  try{
    await search(query)
  }catch(e){alert(e)}
})

// https://github.com/derpibooru/philomena/blob/cbbdaf677fef8fdd952e167fc91ff39a13b04c06/lib/philomena/images/thumbnailer.ex#L14-L23
const IMG_SIZE_KEYWORD = "tall", IMG_MAX_WIDTH = 1024, IMG_MAX_HEIGHT = 4096

/** @param {string} query */
async function search(query) {
  $$$("intro").hidden = true
  $$$("browse").hidden = false
  var containerEl = $$$("browse-images")
  var templateEl = $$$("result-template").content
  document.body.scrollIntoView()
  containerEl.classList.add("loading")
  containerEl.setAttribute("aria-hidden", "true")
  // containerEl.textContent = ""
  // containerEl.appendChild($$$("loading-template").content.cloneNode(true))

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
    var resultEl = templateEl.cloneNode(true)

    var { width, height } = result
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

    var img = resultEl.firstElementChild.firstElementChild
    img.width = width, img.height = height
    img.src = result.representations[IMG_SIZE_KEYWORD]

    containerEl.appendChild(resultEl)
  }
}
