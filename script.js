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

$$$("search-submit").addEventListener("click", function (event) {
  event.preventDefault()
  var data = new FormData(this.form)
  var query = "?" + [...data].map(e => e.map(s => encodeURIComponent(s)).join("=")).join("&")
  try{
  search(query)
  }catch(e){alert(e)}
})

/** @param {string} query */
function search(query) {
  $$$("intro").hidden = true
  $$$("browse").hidden = false
  var containerEl = $$$("browse-images")
  var templateEl = $$$("result-template").content
  containerEl.textContent = ""
  containerEl.appendChild($$$("loading-template").content.cloneNode(true))

  var xhr = new XMLHttpRequest()
  xhr.open("get", "api.php" + query, false)
  xhr.send()
  containerEl.textContent = ""
  var response = JSON.parse(xhr.responseText)
  for (let image of response.images) {
    var imageEl = templateEl.cloneNode(true)
    imageEl.firstElementChild.firstElementChild.src = image.representations["medium"]
    containerEl.appendChild(imageEl)
  }
}
