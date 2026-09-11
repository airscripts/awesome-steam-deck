import Fuse from "fuse.js";
import {
  Accessibility,
  AppWindow,
  ArrowUp,
  BatteryCharging,
  BookOpen,
  CircleHelp,
  Cpu,
  createIcons,
  ExternalLink,
  Folder,
  Gamepad2,
  Gauge,
  GitFork,
  Globe2,
  HardDrive,
  Monitor,
  Moon,
  Newspaper,
  Package,
  Palette,
  Podcast,
  Puzzle,
  Radio,
  Rocket,
  Search,
  SlidersHorizontal,
  Sun,
  Users,
  Video,
  Wrench,
  X,
} from "lucide";

const iconRegistry = {
  Accessibility,
  AppWindow,
  ArrowUp,
  BatteryCharging,
  BookOpen,
  CircleHelp,
  Cpu,
  ExternalLink,
  Folder,
  Gamepad2,
  Gauge,
  GitFork,
  Globe2,
  HardDrive,
  Monitor,
  Moon,
  Newspaper,
  Package,
  Palette,
  Podcast,
  Puzzle,
  Radio,
  Rocket,
  Search,
  SlidersHorizontal,
  Sun,
  Users,
  Video,
  Wrench,
  X,
};

createIcons({ icons: iconRegistry });

const markExternalLinks = () => {
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    let url: URL;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return;
    }
    if (url.origin === window.location.origin) return;
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    anchor.target = "_blank";
    const rel = new Set(anchor.rel.split(/\s+/).filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    anchor.rel = [...rel].join(" ");
  });
};

interface ResourceData {
  id: string;
  categoryId: string;
  category: string;
  name: string;
  descriptionText: string;
  domain: string;
  sourceOrder: number;
}
type SortMode = "classic" | "relevance" | "az" | "za";

const announce = (message: string) => {
  const status = document.querySelector<HTMLElement>("#result-status");
  if (status) status.textContent = message;
};
const getResources = (): ResourceData[] =>
  JSON.parse(
    document.querySelector("#catalog-data")?.textContent || "[]",
  ) as ResourceData[];
const params = new URLSearchParams(window.location.search);
const query = params.get("q") || "";
const selected = new Set(params.getAll("category"));
const initialSort = params.get("sort") as SortMode | null;

function init() {
  const resources = getResources();
  const cards = [
    ...document.querySelectorAll<HTMLElement>("[data-resource-id]"),
  ];
  const search = document.querySelector<HTMLInputElement>("#resource-search");
  const clearSearch =
    document.querySelector<HTMLButtonElement>("#clear-search");
  const clearAll = document.querySelector<HTMLButtonElement>("#clear-all");
  const emptyReset = document.querySelector<HTMLButtonElement>("#empty-reset");
  const sort = document.querySelector<HTMLSelectElement>("#sort-select");
  const themeMenu = document.querySelector<HTMLDetailsElement>(".theme-menu");
  const themeChoices = [
    ...document.querySelectorAll<HTMLInputElement>("[data-theme-choice]"),
  ];
  const controls = document.querySelector<HTMLElement>(".controls");
  const filterCount = document.querySelector<HTMLElement>("#filter-count");
  const footer = document.querySelector<HTMLElement>(".site-footer");
  const scrollTop = document.querySelector<HTMLButtonElement>("#scroll-top");
  const emptyState = document.querySelector<HTMLElement>("#empty-state");
  const activeFilters = document.querySelector<HTMLElement>("#active-filters");
  const filterDialog =
    document.querySelector<HTMLDialogElement>("#filter-dialog");
  const filterTrigger =
    document.querySelector<HTMLButtonElement>("#filter-trigger");
  const drawerClose =
    document.querySelector<HTMLButtonElement>("#drawer-close");
  const drawerReset =
    document.querySelector<HTMLButtonElement>("#drawer-reset");
  const drawerShow = document.querySelector<HTMLButtonElement>("#drawer-show");
  const checkboxes = [
    ...document.querySelectorAll<HTMLInputElement>("[data-category-checkbox]"),
  ];
  if (
    !search ||
    !clearSearch ||
    !clearAll ||
    !sort ||
    !themeMenu ||
    !controls ||
    !filterCount ||
    !footer ||
    !scrollTop ||
    !emptyState ||
    !activeFilters ||
    !filterDialog ||
    !filterTrigger ||
    !drawerClose ||
    !drawerReset ||
    !drawerShow
  )
    throw new Error("catalog controls failed to initialize");

  const categoryNames = new Map(
    checkboxes.map((box) => [
      box.value,
      box.parentElement?.querySelector("span:nth-child(2)")?.textContent ||
        box.value,
    ]),
  );
  const fuse = new Fuse(resources, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "descriptionText", weight: 0.25 },
      { name: "category", weight: 0.15 },
      { name: "domain", weight: 0.1 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  });
  let lastFocused: HTMLElement | null = null;
  let debounce: number | undefined;
  let sortExplicit = initialSort !== null;

  const syncCheckboxes = () =>
    checkboxes.forEach((box) => {
      box.checked = selected.has(box.value);
    });
  const writeUrl = (replace = true) => {
    const next = new URL(window.location.href);
    next.search = "";
    if (search.value.trim()) next.searchParams.set("q", search.value.trim());
    selected.forEach((category) =>
      next.searchParams.append("category", category),
    );
    if (sortExplicit || search.value.trim())
      next.searchParams.set("sort", sort.value);
    window.history[replace ? "replaceState" : "pushState"]({}, "", next);
  };
  const renderChips = () => {
    activeFilters.replaceChildren();
    selected.forEach((category) => {
      const name = categoryNames.get(category) || category;
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.setAttribute("role", "listitem");
      const label = document.createElement("span");
      label.textContent = name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${name} filter`);
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", "x");
      icon.setAttribute("aria-hidden", "true");
      remove.append(icon);
      remove.addEventListener("click", () => {
        const removeButtons = [
          ...activeFilters.querySelectorAll<HTMLButtonElement>(".chip button"),
        ];
        const removedIndex = removeButtons.indexOf(remove);
        selected.delete(category);
        syncCheckboxes();
        render();
        writeUrl(false);
        const nextButtons = [
          ...activeFilters.querySelectorAll<HTMLButtonElement>(".chip button"),
        ];
        nextButtons[Math.min(removedIndex, nextButtons.length - 1)]?.focus();
        if (nextButtons.length === 0) search.focus();
      });
      chip.append(label, remove);
      activeFilters.append(chip);
    });
    filterCount.textContent = String(selected.size);
    filterCount.hidden = selected.size === 0;
    filterTrigger.setAttribute(
      "aria-label",
      selected.size
        ? `Filter, ${selected.size} selected`
        : "Filter",
    );
    clearAll.hidden = selected.size === 0 && !search.value;
    createIcons({ icons: iconRegistry, root: activeFilters });
  };
  const render = () => {
    const normalizedQuery = search.value.trim();
    const matches = normalizedQuery
      ? new Set(fuse.search(normalizedQuery).map(({ item }) => item.id))
      : null;
    const visible = resources.filter(
      (resource) =>
        (!matches || matches.has(resource.id)) &&
        (selected.size === 0 || selected.has(resource.categoryId)),
    );
    const sorted = [...visible].sort((a, b) =>
      sort.value === "az" || sort.value === "za"
        ? a.name.localeCompare(b.name) * (sort.value === "za" ? -1 : 1)
        : sort.value === "relevance" && normalizedQuery
          ? fuse
              .search(normalizedQuery)
              .findIndex(({ item }) => item.id === a.id) -
            fuse
              .search(normalizedQuery)
              .findIndex(({ item }) => item.id === b.id)
          : a.sourceOrder - b.sourceOrder,
    );
    const visibleIds = new Set(sorted.map((resource) => resource.id));
    cards.forEach((card) => {
      card.hidden = !visibleIds.has(card.dataset.resourceId || "");
    });
    sorted.forEach((resource) => {
      const card = cards.find(
        (candidate) => candidate.dataset.resourceId === resource.id,
      );
      if (card) document.querySelector("#resource-grid")?.append(card);
    });
    emptyState.hidden = visible.length > 0;
    clearSearch.hidden = !search.value;
    drawerShow.textContent = `Show ${visible.length} Resource${visible.length === 1 ? "" : "s"}`;
    announce(
      `Showing ${visible.length} resource${visible.length === 1 ? "" : "s"}${normalizedQuery ? ` for “${normalizedQuery}”` : ""}`,
    );
    renderChips();
  };
  const reset = (push = false) => {
    search.value = "";
    selected.clear();
    sortExplicit = false;
    sort.value = "classic";
    syncCheckboxes();
    render();
    writeUrl(!push);
  };
  let pageScrollY = 0;
  const lockPageScroll = () => {
    if (document.documentElement.classList.contains("dialog-open")) return;
    pageScrollY = window.scrollY;
    document.documentElement.classList.add("dialog-open");
    document.body.style.top = `-${pageScrollY}px`;
  };
  const unlockPageScroll = () => {
    if (!document.documentElement.classList.contains("dialog-open")) return;
    const y = pageScrollY;
    document.documentElement.classList.remove("dialog-open");
    document.body.style.removeProperty("top");
    window.scrollTo(0, y);
  };
  const openDrawer = () => {
    lastFocused =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : filterTrigger;
    lockPageScroll();
    filterDialog.showModal();
    drawerClose.focus();
  };
  const closeDrawer = () => {
    if (filterDialog.open) filterDialog.close();
    lastFocused?.focus({ preventScroll: true });
    lastFocused = null;
    unlockPageScroll();
  };

  const themeIconName = (theme: string) =>
    theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor";
  const updateThemeIcon = (theme: string) => {
    const current = document.querySelector<HTMLElement>("#theme-trigger-icon");
    if (!current) return;
    const replacement = document.createElement("i");
    replacement.id = "theme-trigger-icon";
    replacement.setAttribute("data-lucide", themeIconName(theme));
    current.replaceWith(replacement);
    createIcons({ icons: iconRegistry });
  };
  const setTheme = (theme: string) => {
    const nextTheme = ["light", "dark", "system"].includes(theme)
      ? theme
      : "system";
    document.documentElement.dataset.theme = nextTheme;
    updateThemeIcon(nextTheme);
    themeChoices.forEach((choice) => {
      choice.checked = choice.dataset.themeChoice === nextTheme;
    });
    try {
      localStorage.setItem("awesome-steam-deck-theme", nextTheme);
    } catch {
      /* Storage failures must not break controls. */
    }
  };

  const relevanceOption = sort.querySelector<HTMLOptionElement>(
    'option[value="relevance"]',
  );
  const syncSortOptions = () => {
    const hasSearch = Boolean(search.value.trim());
    if (relevanceOption) {
      relevanceOption.hidden = !hasSearch;
      relevanceOption.disabled = !hasSearch;
    }
    if (!hasSearch && sort.value === "relevance") sort.value = "classic";
  };

  search.value = query;
  sort.value = ["classic", "relevance", "az", "za"].includes(initialSort || "")
    ? (initialSort as SortMode)
    : query
      ? "relevance"
      : "classic";
  syncSortOptions();
  const initialTheme = document.documentElement.dataset.theme || "system";
  setTheme(initialTheme);
  themeChoices.forEach((choice) =>
    choice.addEventListener("change", () => {
      setTheme(choice.value);
      themeMenu.open = false;
      themeMenu.querySelector<HTMLElement>("summary")?.focus();
    }),
  );
  themeMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      themeMenu.open = false;
      themeMenu.querySelector<HTMLElement>("summary")?.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!themeMenu.open) return;
    if (event.target instanceof Node && themeMenu.contains(event.target))
      return;
    themeMenu.open = false;
  });
  syncCheckboxes();
  render();
  search.addEventListener("input", () => {
    syncSortOptions();
    if (!sortExplicit)
      sort.value = search.value.trim() ? "relevance" : "classic";
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      render();
      writeUrl(true);
    }, 150);
  });
  clearSearch.addEventListener("click", () => {
    search.value = "";
    syncSortOptions();
    if (!sortExplicit) sort.value = "classic";
    render();
    writeUrl(true);
    search.focus();
  });
  clearAll.addEventListener("click", () => reset());
  emptyReset?.addEventListener("click", () => reset());
  sort.addEventListener("change", () => {
    sortExplicit = true;
    render();
    writeUrl(false);
  });
  checkboxes.forEach((checkbox) =>
    checkbox.addEventListener("change", () => {
      checkbox.checked
        ? selected.add(checkbox.value)
        : selected.delete(checkbox.value);
      syncCheckboxes();
      render();
      writeUrl(false);
    }),
  );
  filterTrigger.addEventListener("click", openDrawer);
  drawerClose.addEventListener("click", closeDrawer);
  drawerShow.addEventListener("click", closeDrawer);
  drawerReset.addEventListener("click", () => {
    selected.clear();
    syncCheckboxes();
    render();
    writeUrl(false);
  });
  filterDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDrawer();
  });
  filterDialog.addEventListener("click", (event) => {
    if (event.target === filterDialog) closeDrawer();
  });
  window.addEventListener("popstate", () => {
    const current = new URLSearchParams(window.location.search);
    search.value = current.get("q") || "";
    selected.clear();
    current.getAll("category").forEach((value) => selected.add(value));
    sortExplicit = current.has("sort");
    sort.value =
      current.get("sort") || (search.value.trim() ? "relevance" : "classic");
    syncSortOptions();
    syncCheckboxes();
    render();
  });

  const updateScrollTop = () => {
    scrollTop.hidden = window.scrollY < 480;
    const footerRect = footer.getBoundingClientRect();
    const visibleFooter = Math.max(
      0,
      Math.min(window.innerHeight, footerRect.bottom) -
        Math.max(0, footerRect.top),
    );
    document.documentElement.style.setProperty(
      "--footer-offset",
      `${visibleFooter}px`,
    );
  };
  const updateLayoutMetrics = () => {
    const controlsRect = controls.getBoundingClientRect();
    const controlsBottom =
      controlsRect.top <= 0 ? Math.max(0, controlsRect.bottom) : 0;
    document.documentElement.style.setProperty(
      "--controls-bottom",
      `${controlsBottom}px`,
    );
    document.documentElement.style.setProperty(
      "--controls-height",
      `${controls.offsetHeight}px`,
    );
  };
  const updateShell = () => {
    updateLayoutMetrics();
    updateScrollTop();
  };
  const resizeObserver = new ResizeObserver(() => {
    updateLayoutMetrics();
    updateScrollTop();
  });
  resizeObserver.observe(controls);
  resizeObserver.observe(footer);
  updateLayoutMetrics();
  window.addEventListener("scroll", updateShell, { passive: true });
  window.addEventListener("resize", updateShell, { passive: true });
  scrollTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  });
  updateShell();
  document
    .querySelectorAll<HTMLElement>("[data-requires-js]")
    .forEach((control) => {
      if ("disabled" in control)
        (
          control as HTMLButtonElement | HTMLInputElement | HTMLSelectElement
        ).disabled = false;
    });
  document.body.classList.add("js-ready");
}

try {
  markExternalLinks();
  init();
} catch (error) {
  console.error(error);
  document.querySelector("#interactive-error")?.classList.add("is-visible");
}
