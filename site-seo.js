(function () {
  "use strict";

  var article = document.querySelector(".article-body");
  var canonical = document.querySelector('link[rel="canonical"]');
  var description = document.querySelector('meta[name="description"]');
  var heading = document.querySelector("h1");
  var hero = document.querySelector(".article-hero-image img");

  if (!article || !canonical || !description || !heading) return;

  var schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: heading.textContent.trim(),
    description: description.content,
    mainEntityOfPage: canonical.href,
    author: {
      "@type": "Person",
      "@id": "https://ollietype1travel.com/about/#ollie",
      name: "Ollie",
      url: "https://ollietype1travel.com/about/"
    },
    publisher: {
      "@type": "Organization",
      name: "Ollie Type 1 Travel",
      url: "https://ollietype1travel.com/"
    },
    inLanguage: "en-GB"
  };

  if (hero && hero.src) schema.image = hero.src;

  var hasBlogPostingSchema = Array.prototype.some.call(document.querySelectorAll('script[type="application/ld+json"]'), function (script) {
    return script.textContent.indexOf('"BlogPosting"') !== -1;
  });
  if (!hasBlogPostingSchema) {
    var node = document.createElement("script");
    node.type = "application/ld+json";
    node.text = JSON.stringify(schema);
    document.head.appendChild(node);
  }

  var related = {
    "/blog/can-you-stay-in-hostels-with-type-1-diabetes/": [
      ["Keeping insulin cool while backpacking", "/blog/keeping-insulin-cool-southeast-asia/"],
      ["The day my insulin froze in Vietnam", "/blog/insulin-froze-ha-giang-loop-vietnam/"],
      ["Flying with insulin, needles and a CGM", "/blog/flying-from-uk-with-insulin-pens-needles-cgm/"]
    ],
    "/blog/keeping-insulin-cool-southeast-asia/": [
      ["Staying in hostels with Type 1 diabetes", "/blog/can-you-stay-in-hostels-with-type-1-diabetes/"],
      ["The day my insulin froze in Vietnam", "/blog/insulin-froze-ha-giang-loop-vietnam/"],
      ["My free Type 1 travel resources", "/resources/"]
    ],
    "/blog/insulin-froze-ha-giang-loop-vietnam/": [
      ["How I keep insulin cool while backpacking", "/blog/keeping-insulin-cool-southeast-asia/"],
      ["My hostel guide for Type 1 diabetes", "/blog/can-you-stay-in-hostels-with-type-1-diabetes/"],
      ["What travelling taught me about fear", "/blog/type-1-diabetes-travel-fear/"]
    ],
    "/blog/flying-from-uk-with-insulin-pens-needles-cgm/": [
      ["My Type 1 travel packing resources", "/resources/"],
      ["Keeping insulin cool in hot countries", "/blog/keeping-insulin-cool-southeast-asia/"],
      ["Staying in hostels with Type 1 diabetes", "/blog/can-you-stay-in-hostels-with-type-1-diabetes/"]
    ],
    "/blog/first-time-ate-out-abroad-severe-allergies/": [
      ["Using allergy translation cards in Southeast Asia", "/blog/food-allergy-translation-cards-southeast-asia/"],
      ["My practical travel resources", "/resources/"],
      ["More stories from the road", "/stories/"]
    ],
    "/blog/food-allergy-translation-cards-southeast-asia/": [
      ["The first time I ate abroad with severe allergies", "/blog/first-time-ate-out-abroad-severe-allergies/"],
      ["My practical travel resources", "/resources/"],
      ["Browse all travel guides", "/blog/"]
    ]
  };

  var suggestions = related[window.location.pathname];
  if (!suggestions) {
    suggestions = [
      ["Flying with insulin, needles and a CGM", "/blog/flying-from-uk-with-insulin-pens-needles-cgm/"],
      ["Keeping insulin cool while backpacking", "/blog/keeping-insulin-cool-southeast-asia/"],
      ["Browse all travel stories and guides", "/blog/"]
    ];
  }

  var keepReading = document.createElement("nav");
  keepReading.className = "keep-reading";
  keepReading.setAttribute("aria-labelledby", "keep-reading-title");
  keepReading.innerHTML = '<h2 id="keep-reading-title">Keep reading</h2><div class="keep-reading-grid">' + suggestions.map(function (item) {
    return '<a href="' + item[1] + '" data-conversion="related-article"><span>' + item[0] + '</span><strong>Read next &rarr;</strong></a>';
  }).join("") + "</div>";

  var actions = article.querySelector(".article-actions");
  article.insertBefore(keepReading, actions || null);
})();
