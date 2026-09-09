(function () {
  "use strict";

  /* Add future verified partner URLs here once, rather than editing articles. */
  var affiliateConfig = Object.freeze({
    airalo: "https://airalo.pxf.io/jRGjmM",
    twelveGo: null, /* 12GO_AFFILIATE_LINK_REQUIRED */
    bookingCom: null, /* BOOKING_COM_AFFILIATE_LINK_REQUIRED */
    klook: null /* KLOOK_AFFILIATE_LINK_REQUIRED */
  });

  var equalEats = Object.freeze({
    url: "https://equaleats.com/?ref=ukazjsiw",
    coupon: "OLLIETYPETRAVEL",
    discount: "10%",
    heading: "Travelling with food allergies?",
    description: "Equal Eats makes translated allergy cards you can show restaurant staff abroad, making it easier to communicate your allergies when language becomes a barrier.",
    buttonLabel: "Get an Equal Eats allergy card →",
    disclosure: "Affiliate link — I may earn a commission if you buy through this link, at no extra cost to you."
  });

  function renderEqualEatsRecommendation(mount) {
    var card = document.createElement("aside");
    card.className = "equal-eats-recommendation";
    card.setAttribute("aria-labelledby", "equal-eats-recommendation-title");

    var heading = document.createElement("h2");
    heading.id = "equal-eats-recommendation-title";
    heading.textContent = equalEats.heading;

    var description = document.createElement("p");
    description.className = "equal-eats-description";
    description.textContent = equalEats.description;

    var offer = document.createElement("p");
    offer.className = "equal-eats-offer";
    var discount = document.createElement("strong");
    discount.textContent = equalEats.discount + " OFF";
    var separator = document.createElement("span");
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "—";
    var codeLabel = document.createElement("span");
    codeLabel.className = "equal-eats-code-label";
    codeLabel.textContent = "Code ";
    var code = document.createElement("code");
    code.textContent = equalEats.coupon;
    codeLabel.appendChild(code);
    offer.append(discount, separator, codeLabel);

    var action = document.createElement("p");
    action.className = "equal-eats-action";
    var link = document.createElement("a");
    link.className = "button primary";
    link.href = equalEats.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer sponsored";
    link.textContent = equalEats.buttonLabel;
    action.appendChild(link);

    var disclosure = document.createElement("p");
    disclosure.className = "equal-eats-disclosure";
    disclosure.textContent = equalEats.disclosure;

    card.append(heading, description, offer, action, disclosure);
    mount.replaceWith(card);
  }

  var mounts = document.querySelectorAll('[data-affiliate-recommendation="equal-eats"]');
  mounts.forEach(function (mount, index) {
    if (index === 0) {
      renderEqualEatsRecommendation(mount);
    } else {
      mount.remove();
    }
  });

  var airaloCopy = {
    "maps-and-connectivity": {
      heading: "Staying connected on the road",
      description: "Having data made solo travel much easier for maps, messaging hostels and working out where the hell I was going. Airalo is one option if you want to set up an eSIM before you arrive."
    },
    "arrival-and-transport": {
      heading: "Data when you land",
      description: "One boring thing that makes arriving somewhere massively easier is having data for maps, transport and contacting your accommodation. You can check Airalo's eSIM options before you travel."
    },
    general: {
      heading: "Need data while you travel?",
      description: "An eSIM can be useful for maps, bookings and contacting accommodation without hunting for a physical SIM as soon as you arrive. Airalo is one option to compare for your destination."
    }
  };

  function renderAiraloRecommendation(mount) {
    var context = mount.getAttribute("data-context") || "general";
    var copy = airaloCopy[context] || airaloCopy.general;
    var country = mount.getAttribute("data-country");
    var card = document.createElement("aside");
    card.className = "affiliate-recommendation airalo-recommendation";
    card.setAttribute("aria-label", "Airalo eSIM recommendation");

    var heading = document.createElement("h2");
    heading.textContent = copy.heading;
    var description = document.createElement("p");
    description.textContent = copy.description + (country ? " Check the options available for " + country + " before relying on any particular network or coverage." : "");
    var action = document.createElement("p");
    var link = document.createElement("a");
    link.className = "publication-button";
    link.href = affiliateConfig.airalo;
    link.target = "_blank";
    link.rel = "sponsored noopener noreferrer";
    link.textContent = "Check Airalo eSIMs →";
    action.appendChild(link);
    var disclosure = document.createElement("p");
    disclosure.className = "affiliate-disclosure";
    disclosure.textContent = "Affiliate link — I may earn a commission if you buy through this link, at no extra cost to you.";
    card.append(heading, description, action, disclosure);
    mount.replaceWith(card);
  }

  document.querySelectorAll('[data-affiliate-recommendation="airalo"]').forEach(function (mount, index) {
    if (index === 0) renderAiraloRecommendation(mount);
    else mount.remove();
  });

  window.OLLIE_AFFILIATES = affiliateConfig;
})();
