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

  var node = document.createElement("script");
  node.type = "application/ld+json";
  node.text = JSON.stringify(schema);
  document.head.appendChild(node);

  var headings = article.querySelectorAll(":scope > h2");
  if (headings.length > 1) {
    var checklist = document.createElement("aside");
    checklist.className = "inline-checklist-cta article-checklist-cta";
    checklist.setAttribute("aria-label", "Free Type 1 travel packing checklist");
    checklist.innerHTML = '<div><p class="eyebrow">Planning a trip with Type 1?</p><h3>The packing checklist I wish I had.</h3><p>Diabetes kit, documents, backups, allergy equipment and the things I nearly forgot before backpacking Southeast Asia. Add your email in Kit and I’ll send it over.</p></div><a href="https://travel-with-ollie.kit.com/efe60fb8e9" data-conversion="checklist-cta" class="button primary">Send me the checklist</a>';
    headings[1].parentNode.insertBefore(checklist, headings[1]);
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
      ["More honest stories from the road", "/blog/#personal-stories"]
    ],
    "/blog/food-allergy-translation-cards-southeast-asia/": [
      ["The first time I ate abroad with severe allergies", "/blog/first-time-ate-out-abroad-severe-allergies/"],
      ["My practical travel resources", "/resources/"],
      ["More allergy-aware travel guides", "/blog/#allergy-guides"]
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
