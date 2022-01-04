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
    resultEl.firstElementChild.firstElementChild.src = result.representations["tall"]
    containerEl.appendChild(imageEl)
  }
}
