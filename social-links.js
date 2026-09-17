(function () {
  'use strict';

  if (!document.querySelector('link[data-site-typography]')) {
    var siteType = document.createElement('link');
    siteType.rel = 'stylesheet';
    siteType.href = '/site-typography.css?v=20260917-2';
    siteType.setAttribute('data-site-typography', 'true');
    document.head.appendChild(siteType);
  }

  if (document.body.classList.contains('article-page') && !document.querySelector('link[data-article-cleanup]')) {
    var articleCss = document.createElement('link');
    articleCss.rel = 'stylesheet';
    articleCss.href = '/article-cleanup.css?v=20260917-1';
    articleCss.setAttribute('data-article-cleanup', 'true');
    document.head.appendChild(articleCss);
  }

  /* Safari can refuse nested data images when an SVG is used directly as an <img>.
     Load the supplied smiling hero as an SVG document instead, while keeping the
     previous mountain photo as a fallback so the hero can never become a blue box. */
  var heroImg = document.querySelector('.home-hero-photo > img[src$="home-hero-smiling.svg"]');
  if (heroImg) {
    var heroObject = document.createElement('object');
    heroObject.data = heroImg.getAttribute('src');
    heroObject.type = 'image/svg+xml';
    heroObject.className = 'home-hero-visual';
    heroObject.setAttribute('aria-label', heroImg.getAttribute('alt') || 'Ollie smiling at a mountain viewpoint in Southeast Asia');
    heroObject.style.cssText = 'display:block;width:100%;aspect-ratio:3 / 4;height:auto;min-height:0;border:0;pointer-events:none;';

    var fallback = document.createElement('img');
    fallback.src = '/Website assets/editorial-photos/selected/mountain-viewpoint.jpg';
    fallback.alt = heroImg.getAttribute('alt') || 'Ollie at a mountain viewpoint in Southeast Asia';
    fallback.style.cssText = 'display:block;width:100%;height:auto;';
    heroObject.appendChild(fallback);

    heroImg.replaceWith(heroObject);
  }

  if (document.querySelector('.site-social-links')) return;
  var nav = document.createElement('nav');
  nav.className = 'site-social-links';
  nav.setAttribute('aria-label', 'Follow Ollie and get in touch');
  var profiles = [
    ['Instagram', 'https://www.instagram.com/ollietype1travel/'],
    ['TikTok', 'https://www.tiktok.com/@ollietype1travel'],
    ['YouTube', 'https://www.youtube.com/@ollietype1travel'],
    ['Facebook', 'https://www.facebook.com/ollietype1travel/'],
    ['Email Ollie', 'mailto:hello@ollietype1travel.com']
  ];
  profiles.forEach(function (profile) {
    var link = document.createElement('a');
    link.href = profile[1];
    link.textContent = profile[0];
    nav.appendChild(link);
  });
  var footer = document.querySelector('.publication-footer, #footer');
  (footer || document.body).appendChild(nav);
})();
