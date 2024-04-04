const options = {
    root: document.querySelector(".parent"),
    rootMargin: "0px",
    threshold: 0.75
};

const observer = new IntersectionObserver(callback, options);

const aElements = [...document.querySelectorAll(".navigation a")];

function callback(entries) {
    const intersectingSection = entries.find(entry => entry.isIntersecting);

    if (intersectingSection) {
        aElements.forEach(element => element.classList.remove("active"));
        aElements.find(element => element.getAttribute("href") === "#" + intersectingSection.target.id).classList.add("active");
    }
}

[...document.querySelectorAll(".section")].forEach(element => observer.observe(element));