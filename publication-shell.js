(function () {
  "use strict";

  if (!document.body.classList.contains("publication-page")) return;

  var header = document.getElementById("header");
  if (header) {
    header.className = "publication-masthead";
    header.setAttribute("data-publication-header", "enhanced");
    header.innerHTML = [
      '<a class="publication-brand" href="/" aria-label="Ollie Type 1 Travel home">Ollie<small>Type 1 Travel</small></a>',
      '<button class="publication-menu-toggle" type="button" aria-expanded="false" aria-controls="publication-nav"><span aria-hidden="true">☰</span><span class="label">Menu</span></button>',
      '<ul class="publication-nav" id="publication-nav">',
      '<li><a href="/blog/">Travel guides</a></li>',
      '<li><a href="/destinations/">Destinations</a></li>',
      '<li><a href="/type-1-travel/">Type 1 travel</a></li>',
      '<li><a href="/travel-tips/">Travel tips</a></li>',
      '<li><a href="/stories/">Stories</a></li>',
      '<li><a href="/about/">About Ollie</a></li>',
      '<li><a href="/resources/">Resources</a></li>',
      '</ul>',
      '<a class="publication-checklist" href="https://travel-with-ollie.kit.com/efe60fb8e9" data-conversion="checklist-cta">Free checklist</a>'
    ].join("");
  }

  var path = window.location.pathname;

  if (/^\/destinations\/(thailand|laos|cambodia|indonesia|malaysia)\/$/.test(path)) {
    document.body.classList.add("thin-country-hub");
  }
  document.querySelectorAll(".publication-nav a").forEach(function (link) {
    var href = link.getAttribute("href");
    var sectionLink = ["/blog/", "/destinations/", "/type-1-travel/", "/travel-tips/", "/stories/", "/about/", "/resources/"].indexOf(href) !== -1;
    if ((sectionLink && path.indexOf(href) === 0) || path === href) {
      link.setAttribute("aria-current", "page");
    }
  });

  var toggle = document.querySelector(".publication-menu-toggle");
  var nav = document.getElementById("publication-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector("[aria-hidden]").textContent = open ? "×" : "☰";
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.querySelector("[aria-hidden]").textContent = "☰";
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.querySelector("[aria-hidden]").textContent = "☰";
        toggle.focus();
      }
    });
  }

  /* Turn the existing article heading and image into one full-bleed opening. */
  var articleHeader = document.querySelector("#main > .inner > section > header.main");
  var articleHero = document.querySelector("#main > .inner > section > .article-hero-image");
  if (articleHeader && articleHero) {
    var eyebrow = articleHeader.querySelector(".eyebrow");
    var articleLabel = eyebrow ? eyebrow.textContent.toLowerCase() : "";
    var isStory = articleLabel.indexOf("story") !== -1 || articleLabel.indexOf("personal") !== -1;
    document.body.classList.add(isStory ? "article-story" : "article-guide");
    var articleSection = articleHeader.parentNode;
    var breadcrumbs = articleHeader.previousElementSibling;
    if (!breadcrumbs || !breadcrumbs.classList.contains("breadcrumbs")) breadcrumbs = null;

    var opening = document.createElement("div");
    opening.className = "article-opening";
    articleSection.insertBefore(opening, breadcrumbs || articleHeader);
    opening.appendChild(articleHero);

    var openingCopy = document.createElement("div");
    openingCopy.className = "article-opening-copy";
    if (breadcrumbs) openingCopy.appendChild(breadcrumbs);
    openingCopy.appendChild(articleHeader);
    opening.appendChild(openingCopy);

    var openingImage = articleHero.querySelector("img");
    if (openingImage) {
      openingImage.setAttribute("fetchpriority", "high");
      openingImage.setAttribute("decoding", "async");
      openingImage.removeAttribute("loading");
    }
  }

  document.querySelectorAll(".article-comparison").forEach(function (table) {
    if (table.parentElement && table.parentElement.classList.contains("article-table-scroll")) return;
    var scroller = document.createElement("div");
    scroller.className = "article-table-scroll";
    table.parentNode.insertBefore(scroller, table);
    scroller.appendChild(table);
  });

  var article = document.querySelector(".article-body");
  if (article && document.body.classList.contains("article-page") && !article.querySelector(".author-box")) {
    var author = document.createElement("aside");
    author.className = "author-box";
    author.innerHTML = '<img src="/Website assets/editorial-photos/selected/ollie-portrait-hue.jpg" alt="Ollie Steadman travelling in Vietnam" loading="lazy"><div><p class="card-kicker">About the author</p><h2>Ollie Steadman</h2><p>In 2026 I spent five months backpacking solo through Southeast Asia with Type 1 diabetes and severe food allergies.</p><a class="text-link" href="/about/">More about me →</a></div>';
    var related = article.querySelector(".keep-reading");
    article.insertBefore(author, related || null);
  }

  document.querySelectorAll("img").forEach(function (img) {
    img.setAttribute("decoding", "async");
    if (!img.closest(".publication-hero, .hub-hero, .article-opening") && !img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
    }
  });

  var footer = document.querySelector(".publication-footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.className = "publication-footer";
    document.body.appendChild(footer);
  }
  if (!footer.querySelector(".publication-footer-inner")) {
    footer.innerHTML = '<div class="publication-footer-inner"><a class="publication-footer-brand" href="/">Ollie <span>Type 1 Travel</span></a><nav aria-label="Footer"><a href="/blog/">Travel guides</a><a href="/resources/">Resources</a><a href="/work-with-me/">Work with me</a><a href="/affiliate-disclosure/">Affiliate disclosure</a><a href="/contact/">Contact</a></nav><p>&copy; Ollie Type 1 Travel</p></div>';
  }

  document.body.classList.add("publication-ready");
})();
