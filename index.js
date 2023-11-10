let a = [];
let historyStack = [];

const moviesUl = document.querySelector("#movies-ul");
const tvshowsUl = document.querySelector("#tvshows-ul");
const animeUl = document.querySelector("#anime-ul");
const mangaUl = document.querySelector("#manga-ul");
const undoBtn = document.querySelector("#undo-el");

const del = document.querySelector("#del-el");
const movieBtn = document.querySelector("#movie-el");
const tvBtn = document.querySelector("#tv-el");
const animeBtn = document.querySelector("#anime-el");
const mangaBtn = document.querySelector("#manga-el");

const leads = JSON.parse(localStorage.getItem("a"));
if (leads) {
  a = leads;
  render(a);
}

function modifyUrl(url) {
  // Removing https://
  if (url.startsWith("https://")) {
    url = url.replace("https://", "");
  }

  // Handling theflixer domain patterns
  if (url.startsWith("theflixer.")) {
    // Removing the domain name
    url = url.replace("theflixer.", "");

    const theflixerPatterns = [
      "tv/tv/watch-",
      "tv/watch-movie/watch-",
      "tv/watch-tv/watch-",
      "tv/movie/watch-",

      "se/watch-movie/watch-",
      "se/watch-tv/watch-",
      "se/tv/watch-",
      "se/movie/watch-",
    ];
    for (let pattern of theflixerPatterns) {
      if (url.includes(pattern)) {
        url = url.replace(pattern, "");
        break; // exit once we've matched a pattern
      }
    }
  }

  // Handling animesuge pattern
  if (url.startsWith("animesuge.ru/anime/")) {
    url = url.replace("animesuge.ru/anime/", "");
  } else if (url.startsWith("https://vvw.dramacool.sr/video-watch/")) {
    url = url.replace("https://vvw.dramacool.sr/video-watch/", "");
  }

  // Removing everything after "full" or "free"
  if (url.includes("-full")) {
    url = url.split("-full")[0];
  } else if (url.includes("-free")) {
    url = url.split("-free")[0];
  } else if (url.includes("-20")) {
    url = url.split("-20")[0];
  }

  return url;
}

function addLink(type) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const originalUrl = tabs[0].url;
    const modifiedUrl = modifyUrl(originalUrl);
    a.push({ type: type, original: originalUrl, display: modifiedUrl });
    localStorage.setItem("a", JSON.stringify(a));
    render(a);
  });
}

movieBtn.addEventListener("click", function () {
  addLink("movie");
});

tvBtn.addEventListener("click", function () {
  addLink("tv");
});

animeBtn.addEventListener("click", function () {
  addLink("anime");
});

mangaBtn.addEventListener("click", function () {
  addLink("manga");
});

del.addEventListener("dblclick", function () {
  localStorage.clear();
  a = [];
  render(a);
});

// ... [Your other code remains unchanged]

function render(items) {
  let movieItems = "";
  let tvshowItems = "";
  let animeItems = "";
  let mangaItems = "";

  for (let i = 0; i < items.length; i++) {
    const listItem = `
      <li>
          <a target='_blank' href='${items[i].original}'>
              ${items[i].display}
          </a>
          <button class="delete-btn" data-index="${i}">Delete</button>
      </li>
    `;

    switch (items[i].type) {
      case "movie":
        movieItems += listItem;
        break;
      case "tv":
        tvshowItems += listItem;
        break;
      case "anime":
        animeItems += listItem;
        break;
      case "manga":
        mangaItems += listItem;
        break;
      default:
        // Handle legacy links without type (default to movie for this example)
        movieItems += listItem;
    }
  }

  moviesUl.innerHTML = movieItems;
  tvshowsUl.innerHTML = tvshowItems;
  animeUl.innerHTML = animeItems;
  mangaUl.innerHTML = mangaItems;

  // Attach the event listener inside the render function
  // Inside the render function

  const deleteBtns = document.querySelectorAll(".delete-btn");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const btnIndex = parseInt(e.currentTarget.getAttribute("data-index"), 10); // Get the index from data-index attribute
      historyStack.push([...a]);
      items.splice(btnIndex, 1);
      localStorage.setItem("a", JSON.stringify(items));
      render(items);
    });
  });
}

// ... [Your other code remains unchanged]

function extractChapterOrEpisode(url, type) {
  let base = url.split("/").slice(0, -1).join("/"); // Exclude last part (chapter/episode)
  let number = url.split("/").pop(); // Last part, which is the chapter/episode

  // For animesuge links, further extraction is needed
  if (type === "anime") {
    number = number.split("ep-").pop();
  }

  return [base, parseInt(number, 10)];
}

function addLink(type) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const originalUrl = tabs[0].url;
    const modifiedUrl = modifyUrl(originalUrl);

    if (type === "anime" || type === "manga") {
      const [base, num] = extractChapterOrEpisode(modifiedUrl, type);
      const existingItemIndex = a.findIndex((item) => item.display.startsWith(base) && item.type === type);
      if (existingItemIndex !== -1) {
        const [, existingNum] = extractChapterOrEpisode(a[existingItemIndex].display, type);
        if (existingNum < num) {
          a[existingItemIndex] = { type: type, original: originalUrl, display: modifiedUrl }; // Replace with the new link
        }
      } else {
        a.push({ type: type, original: originalUrl, display: modifiedUrl });
      }
    } else {
      a.push({ type: type, original: originalUrl, display: modifiedUrl });
    }

    localStorage.setItem("a", JSON.stringify(a));
    render(a);
  });
}

undoBtn.addEventListener("click", function () {
  if (historyStack.length > 0) {
    a = historyStack.pop();
    localStorage.setItem("a", JSON.stringify(a));
    render(a);
  }
});
