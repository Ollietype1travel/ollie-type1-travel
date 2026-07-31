const header = document.querySelector("[data-header]");
const packageCards = document.querySelectorAll("[data-package-grid] .package-card");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

packageCards.forEach((card) => {
  card.addEventListener("click", () => {
    packageCards.forEach((item) => item.classList.remove("is-active"));
    card.classList.add("is-active");
  });
});

if (menuToggle && navMenu) {
  const setMenu = (isOpen) => {
    document.body.classList.toggle("menu-is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  };

  menuToggle.addEventListener("click", () => {
    setMenu(!document.body.classList.contains("menu-is-open"));
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
    }
  });
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
