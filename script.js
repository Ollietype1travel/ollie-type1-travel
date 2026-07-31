const header = document.querySelector("[data-header]");
const packageCards = document.querySelectorAll("[data-package-grid] .package-card");

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

packageCards.forEach((card) => {
  card.addEventListener("click", () => {
    packageCards.forEach((item) => item.classList.remove("is-active"));
    card.classList.add("is-active");
  });
});

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
