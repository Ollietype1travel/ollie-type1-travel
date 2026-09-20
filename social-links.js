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
  if (document.body.classList.contains('homepage-v3')) {
    var utility = document.querySelector('.publication-utility');
    var header = document.getElementById('header');
    if (utility && header) {
      var icons = {"Instagram": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><circle cx=\"17.5\" cy=\"6.5\" r=\"1.2\"/>", "TikTok": "<path d=\"M14 2h3c.3 2.7 1.8 4.3 4 4.6v3a9 9 0 0 1-4-1.3v7.2a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z\"/>", "YouTube": "<path d=\"M21.5 6.5c-.3-1-1-1.7-2-2C17.8 4 12 4 12 4s-5.8 0-7.5.5c-1 .3-1.7 1-2 2C2 8.2 2 12 2 12s0 3.8.5 5.5c.3 1 1 1.7 2 2C6.2 20 12 20 12 20s5.8 0 7.5-.5c1-.3 1.7-1 2-2 .5-1.7.5-5.5.5-5.5s0-3.8-.5-5.5z\"/><path d=\"m10 8 6 4-6 4z\" fill=\"#24434b\"/>", "Facebook": "<path d=\"M14 22v-9h3l.5-3H14V8c0-.9.3-1.5 1.6-1.5H18V3.2c-.4-.1-1.8-.2-3.3-.2C11.5 3 10 4.8 10 8v2H7v3h3v9z\"/>"};
      var socials = document.createElement('nav');
      socials.className = 'home-header-socials';
      socials.setAttribute('aria-label', 'Social media');
      profiles.slice(0, 4).forEach(function (profile) {
        var link = document.createElement('a');
        link.href = profile[1];
        link.setAttribute('aria-label', profile[0]);
        link.title = profile[0];
        link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + icons[profile[0]] + '</svg>';
        socials.appendChild(link);
      });
      utility.querySelectorAll('a').forEach(function (link) {
        if (profiles.some(function (profile) { return link.href === profile[1]; })) link.remove();
      });
      utility.insertBefore(socials, utility.querySelector('.publication-checklist'));
      var mobileSocials = socials.cloneNode(true);
      mobileSocials.classList.add('home-header-socials-mobile');
      header.appendChild(mobileSocials);
    }
  }
  profiles.forEach(function (profile) {
    var link = document.createElement('a');
    link.href = profile[1];
    link.textContent = profile[0];
    nav.appendChild(link);
  });
  var footer = document.querySelector('.publication-footer, #footer');
  (footer || document.body).appendChild(nav);
})();
