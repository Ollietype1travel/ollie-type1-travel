(function () {
  'use strict';

  if (document.body.classList.contains('article-page') && !document.querySelector('link[data-article-cleanup]')) {
    var articleCss = document.createElement('link');
    articleCss.rel = 'stylesheet';
    articleCss.href = '/article-cleanup.css?v=20260917-1';
    articleCss.setAttribute('data-article-cleanup', 'true');
    document.head.appendChild(articleCss);
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
