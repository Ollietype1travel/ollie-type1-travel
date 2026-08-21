(function () {
  "use strict";

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
})();
