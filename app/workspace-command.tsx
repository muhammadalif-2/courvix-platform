"use client";
import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpRight, Command, X } from "lucide-react";
import { useModalKeyboard } from "./modal-keyboard";
export type WorkspaceCommandItem = {
  id: string;
  label: string;
  description: string;
  group: string;
  onSelect: () => void;
};
export default function WorkspaceCommand({
  items,
}: {
  items: WorkspaceCommandItem[];
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [index, setIndex] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const results = items
    .filter((i) =>
      (i.label + " " + i.description + " " + i.group)
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 35);
  useModalKeyboard(open, () => setOpen(false));
  function show() {
    setQuery("");
    setIndex(0);
    setOpen(true);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k" &&
        !document.querySelector('[role="dialog"][aria-modal="true"]')
      ) {
        e.preventDefault();
        trigger.current?.click();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function pick(item: WorkspaceCommandItem) {
    setOpen(false);
    item.onSelect();
  }
  return (
    <>
      <button
        className="workspace-command-trigger"
        ref={trigger}
        onClick={show}
        aria-label="Search pages and records"
      >
        <Search size={15} />
        <span>Find a page or record…</span>
        <kbd>⌘ / Ctrl K</kbd>
      </button>
      {open && (
        <div
          className="management-modal-backdrop command-backdrop"
          onClick={() => setOpen(false)}
        >
          <section
            className="workspace-command-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-command-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="command-search">
              <Search size={19} />
              <label
                className="sr-only"
                id="workspace-command-title"
                htmlFor="workspace-command-query"
              >
                Find a page or record
              </label>
              <input
                id="workspace-command-query"
                autoFocus
                placeholder="Search names, pages or appointments…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIndex(0);
                }}
                role="combobox"
                aria-expanded="true"
                aria-autocomplete="list"
                aria-activedescendant={
                  results[index] ? "command-result-" + index : undefined
                }
                aria-controls="workspace-command-results"
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setIndex((i) =>
                      Math.max(
                        0,
                        Math.min(
                          results.length - 1,
                          i + (e.key === "ArrowDown" ? 1 : -1),
                        ),
                      ),
                    );
                  }
                  if (e.key === "Enter" && results[index]) {
                    e.preventDefault();
                    pick(results[index]);
                  }
                }}
              />
              <button aria-label="Close search" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div
              className="command-results"
              id="workspace-command-results"
              role="listbox"
              aria-label="Matching pages and records"
            >
              {results.map((item, i) => (
                <button
                  key={item.id}
                  id={"command-result-" + i}
                  role="option"
                  aria-selected={i === index}
                  className={i === index ? "selected" : ""}
                  onClick={() => pick(item)}
                  onFocus={() => setIndex(i)}
                >
                  <span className="command-item-group">{item.group}</span>
                  <span>
                    <b>{item.label}</b>
                    <small>{item.description}</small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
              {!results.length && (
                <div className="management-empty">
                  <Search size={23} />
                  <p>No matching pages or records.</p>
                  <small>Try a name or a shorter search.</small>
                </div>
              )}
            </div>
            <footer>
              <span>Only records available to your role appear.</span>
              <span>↑ ↓ to browse · Enter to open · Esc to close</span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
