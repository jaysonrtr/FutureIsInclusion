document.documentElement.classList.add("js");

(function () {
  var EMAIL = "hello@futureisinclusion.org";

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function pageFile() {
    var path = window.location.pathname || "";
    var file = path.split("/").filter(Boolean).pop() || "";
    if (!file || file.indexOf(".") === -1) return "index.html";
    return file;
  }

  function markCurrent(root) {
    var current = pageFile();
    root.querySelectorAll("nav a[href]").forEach(function (link) {
      if (link.getAttribute("href") === current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach(function (node) {
      node.textContent = year;
    });
  }

  function hasLink(rel, href) {
    return Array.prototype.some.call(document.head.querySelectorAll("link"), function (link) {
      return link.getAttribute("rel") === rel && link.getAttribute("href") === href;
    });
  }

  function injectHead() {
    return fetch("head.html", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then(function (html) {
        var template = document.createElement("template");
        template.innerHTML = html;
        template.content.querySelectorAll("link, meta").forEach(function (node) {
          if (node.tagName === "LINK") {
            var rel = node.getAttribute("rel");
            var href = node.getAttribute("href");
            if (rel && href && hasLink(rel, href)) return;
          }
          if (node.matches("meta[name]")) {
            var name = node.getAttribute("name");
            if (name && document.head.querySelector('meta[name="' + name + '"]')) return;
          }
          document.head.appendChild(document.importNode(node, true));
        });
      })
      .catch(function () {
        /* Pages already link CSS and the icon, including when opened from file://. */
      });
  }

  function loadPartial(id, url) {
    var slot = document.getElementById(id);
    if (!slot) return Promise.resolve(false);
    return fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then(function (html) {
        if (!html.trim()) throw new Error("empty");
        slot.innerHTML = html;
        slot.setAttribute("data-partial", "loaded");
        return true;
      })
      .catch(function () {
        slot.setAttribute("data-partial", "fallback");
        return false;
      });
  }

  function setupNav(header) {
    var button = header.querySelector(".nav-toggle");
    var nav = header.querySelector("#primary-nav");
    if (!button || !nav || button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    function setOpen(open) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      var label = button.querySelector(".nav-toggle-label");
      if (label) label.textContent = open ? "Close" : "Menu";
    }

    button.addEventListener("click", function () {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var button = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!button || !nav || button.getAttribute("aria-expanded") !== "true") return;
    button.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    var label = button.querySelector(".nav-toggle-label");
    if (label) label.textContent = "Menu";
    button.focus();
  });

  function initChrome() {
    var header = document.getElementById("site-header");
    if (header) setupNav(header);
    markCurrent(document);
    setYear();
    injectHead();
    return Promise.all([
      loadPartial("site-header", "header.html"),
      loadPartial("site-footer", "footer.html")
    ]).then(function (results) {
      var headerSlot = document.getElementById("site-header");
      if (results[0] && headerSlot) setupNav(headerSlot);
      markCurrent(document);
      setYear();
    });
  }

  function initResources() {
    var root = document.getElementById("resource-results");
    if (!root) return;

    var status = document.getElementById("resource-status");
    var options = document.getElementById("category-options");
    var search = document.getElementById("resource-search");
    var form = document.getElementById("resource-search-form");
    var fieldset = document.getElementById("category-filter");
    var data = null;
    var category = "all";
    var timer = 0;

    function setStatus(message) {
      if (status) status.textContent = message;
    }

    function haystack(item, label) {
      return [item.title, item.summary, item.source || "", label].join(" ").toLowerCase();
    }

    function render() {
      if (!data) return;
      var query = search ? search.value.trim() : "";
      var needle = query.toLowerCase();
      root.replaceChildren();
      var shown = 0;
      var activeLabel = "all categories";

      data.categories.forEach(function (cat) {
        if (category !== "all" && category !== cat.id) return;
        if (category === cat.id) activeLabel = cat.label;
        var items = data.resources.filter(function (item) {
          if (item.category !== cat.id) return false;
          if (!needle) return true;
          return haystack(item, cat.label).indexOf(needle) !== -1;
        });
        if (!items.length) return;
        shown += items.length;

        var section = document.createElement("section");
        section.className = "resource-group";
        var heading = document.createElement("h2");
        heading.textContent = cat.label;
        section.appendChild(heading);

        var list = document.createElement("ul");
        list.className = "resource-list";
        items.forEach(function (item) {
          var li = document.createElement("li");
          li.className = "resource";

          var meta = document.createElement("p");
          meta.className = "resource-meta";
          if (item.placeholder) {
            var tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = "Placeholder";
            meta.appendChild(tag);
          }
          if (item.source) {
            var source = document.createElement("span");
            source.textContent = item.source;
            meta.appendChild(source);
          }
          if (meta.childNodes.length) li.appendChild(meta);

          var title = document.createElement("h3");
          if (item.url) {
            var link = document.createElement("a");
            link.href = item.url;
            link.textContent = item.title;
            title.appendChild(link);
          } else {
            title.textContent = item.title;
          }
          li.appendChild(title);

          var summary = document.createElement("p");
          summary.textContent = item.summary;
          li.appendChild(summary);
          list.appendChild(li);
        });
        section.appendChild(list);
        root.appendChild(section);
      });

      var noun = shown === 1 ? "resource" : "resources";
      var filtersHidden = fieldset && fieldset.hidden;
      if (query && shown === 0) {
        setStatus(filtersHidden
          ? "No resources match “" + query + "”. Try a different word."
          : "No resources match “" + query + "”. Try a different word, or choose All.");
      } else if (query) {
        setStatus(filtersHidden
          ? "Showing " + shown + " " + noun + " matching “" + query + "”."
          : "Showing " + shown + " " + noun + " matching “" + query + "” in " + activeLabel + ".");
      } else if (filtersHidden) {
        setStatus("Showing " + shown + " " + noun + ".");
      } else {
        setStatus("Showing " + shown + " " + noun + " in " + activeLabel + ".");
      }
    }

    function buildFilters() {
      options.replaceChildren();
      var counts = {};
      data.resources.forEach(function (item) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      var activeCategories = data.categories.filter(function (cat) {
        return (counts[cat.id] || 0) > 0;
      });
      var library = fieldset ? fieldset.closest(".library") : null;
      var hideFilters = activeCategories.length < 2;
      if (fieldset) fieldset.hidden = hideFilters;
      if (library) library.classList.toggle("filters-hidden", hideFilters);
      if (hideFilters) {
        category = "all";
        return;
      }
      var choices = [{ id: "all", label: "All", count: data.resources.length }].concat(
        activeCategories.map(function (cat) {
          return { id: cat.id, label: cat.label, count: counts[cat.id] || 0 };
        })
      );
      choices.forEach(function (choice, index) {
        var label = document.createElement("label");
        label.className = "filter-option";
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "category";
        input.value = choice.id;
        if (index === 0) input.checked = true;
        var text = document.createElement("span");
        text.className = "filter-label";
        text.appendChild(document.createTextNode(choice.label + " "));
        var count = document.createElement("span");
        count.className = "filter-count";
        count.textContent = "(" + choice.count + ")";
        text.appendChild(count);
        label.appendChild(input);
        label.appendChild(text);
        options.appendChild(label);
      });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        window.clearTimeout(timer);
        render();
      });
    }
    if (search) {
      search.addEventListener("input", function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(render, 250);
      });
    }
    if (fieldset) {
      fieldset.addEventListener("change", function (event) {
        if (!event.target || event.target.name !== "category") return;
        category = event.target.value;
        window.clearTimeout(timer);
        render();
      });
    }

    setStatus("Loading resources.");
    fetch("resources.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then(function (json) {
        if (!json || !Array.isArray(json.categories) || !Array.isArray(json.resources)) {
          throw new Error("The resource file is missing categories or resources.");
        }
        data = json;
        buildFilters();
        render();
      })
      .catch(function () {
        setStatus("The resource library could not be loaded. Open this site from a web server, then refresh. The rest of the site is still available.");
      });
  }

  function configuredEndpoint(form) {
    var raw = (form.getAttribute("action") || "").trim();
    if (!raw || raw === "#" || raw.indexOf("mailto:") === 0) return "";
    return raw;
  }

  function fieldError(form, id, message) {
    var input = form.querySelector("#" + id);
    var error = document.getElementById(id + "-error");
    if (!input || !error) return;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message || "";
    error.hidden = !message;
  }

  function validate(form) {
    var errors = {};
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var topic = form.topic.value;
    var message = form.message.value.trim();
    if (!name) errors.name = "Enter your name.";
    if (!email) errors.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter an email address like name@example.com.";
    }
    if (!topic) errors.topic = "Choose a topic.";
    if (!message) errors.message = "Enter a message.";
    return errors;
  }

  function applyErrors(form, errors) {
    ["name", "email", "topic", "message"].forEach(function (id) {
      fieldError(form, id, errors[id] || "");
    });
  }

  function valuesFrom(form) {
    return {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      topic: form.topic.value,
      organization: form.organization.value.trim(),
      message: form.message.value.trim()
    };
  }

  function mailtoFor(values) {
    var subject = values.topic || "Message for The Future is Inclusion";
    var lines = [
      "Name: " + values.name,
      "Email: " + values.email,
      values.organization ? "Organization: " + values.organization : null,
      "",
      values.message
    ].filter(function (line) { return line !== null; });
    var full = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
    if (full.length <= 1800) return { href: full, shortened: false };
    return {
      href: "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject),
      shortened: true
    };
  }

  function showNotice(form, kind, title, paragraphs, link) {
    var notice = document.getElementById("form-notice");
    if (!notice) return;
    notice.className = "form-notice" + (kind === "success" ? " is-success" : "");
    notice.replaceChildren();
    var heading = document.createElement("h3");
    heading.textContent = title;
    notice.appendChild(heading);
    paragraphs.forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      notice.appendChild(p);
    });
    if (link) {
      var p = document.createElement("p");
      var anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = "Email " + EMAIL;
      p.appendChild(anchor);
      notice.appendChild(p);
    }
    notice.hidden = false;
    notice.focus();
  }

  function initContact() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var attempted = false;
    var button = form.querySelector('[type="submit"]');

    function refreshIfNeeded() {
      if (!attempted) return;
      applyErrors(form, validate(form));
    }

    form.addEventListener("input", refreshIfNeeded);
    form.addEventListener("change", refreshIfNeeded);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      attempted = true;
      var errors = validate(form);
      applyErrors(form, errors);
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var endpoint = configuredEndpoint(form);
      var values = valuesFrom(form);
      var mail = mailtoFor(values);

      if (!endpoint) {
        var copy = [
          "This form is not connected to a delivery service yet, so your message was not sent. It is still in the form below if you want to copy it."
        ];
        if (mail.shortened) {
          copy.push("The email link opens with the subject filled in. Paste the message from the form into that email.");
        }
        showNotice(form, "", "Please email us directly", copy, mail);
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (!response.ok) throw new Error(String(response.status));
          form.hidden = true;
          showNotice(form, "success", "Message sent", [
            "Thank you. Your message is on its way. We will reply at the email address you gave us."
          ]);
        })
        .catch(function () {
          if (button) {
            button.disabled = false;
            button.textContent = "Send message";
          }
          showNotice(form, "", "Message not sent", [
            "We could not deliver the form. Please email us directly. Your message is still in the form."
          ], mail);
        });
    });
  }

  function readPickupLocations() {
    var dataEl = document.getElementById("pickup-locations");
    if (!dataEl) return [];
    try {
      var parsed = JSON.parse(dataEl.textContent);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function externalLink(href, label) {
    var link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.appendChild(document.createTextNode(label));
    var hint = document.createElement("span");
    hint.className = "visually-hidden";
    hint.textContent = " (opens in a new tab)";
    link.appendChild(hint);
    return link;
  }

  function renderPickupList(locations) {
    var listEl = document.getElementById("pickup-list");
    if (!listEl) return;
    listEl.replaceChildren();
    locations.forEach(function (loc) {
      if (!loc || !loc.name || !loc.mapsUrl) return;
      var li = document.createElement("li");
      li.appendChild(externalLink(loc.mapsUrl, loc.name));
      if (loc.place) li.appendChild(document.createTextNode(", " + loc.place));
      listEl.appendChild(li);
    });
  }

  function initPickupMap() {
    var locations = readPickupLocations().filter(function (loc) {
      return loc && typeof loc.lat === "number" && typeof loc.lng === "number" && loc.mapsUrl && loc.name;
    });
    renderPickupList(locations);
    var mapEl = document.getElementById("pickup-map");
    if (!mapEl || !locations.length || typeof L === "undefined") return;

    var map = L.map(mapEl, {
      scrollWheelZoom: false
    });
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 15);
    } else {
      map.fitBounds(locations.map(function (loc) {
        return [loc.lat, loc.lng];
      }), { padding: [24, 24], maxZoom: 15 });
    }

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapEl.setAttribute("role", "region");
    mapEl.setAttribute("aria-label", "Map of pick-up locations for Invitation to Inclusion bags. The same locations are listed as links below the map.");

    locations.forEach(function (loc) {
      var place = loc.place ? ", " + loc.place : "";
      var popup = document.createElement("p");
      popup.className = "pickup-popup";
      var link = externalLink(loc.mapsUrl, loc.name + " on Google Maps");
      popup.appendChild(link);

      var marker = L.marker([loc.lat, loc.lng], {
        keyboard: true,
        alt: loc.name + place
      });
      marker.bindPopup(popup);
      marker.addTo(map);
      var icon = marker.getElement();
      if (icon) {
        icon.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          marker.openPopup();
        });
      }
      marker.on("popupopen", function () {
        link.focus();
      });
    });
  }

  onReady(function () {
    initChrome();
    initResources();
    initContact();
    initPickupMap();
  });
})();
