function storage() { return browser.storage.local; }
;
async function storage_get(key) {
    var _a;
    const result = await storage().get(key);
    return (_a = result[key]) !== null && _a !== void 0 ? _a : false;
}
function qSel(selector) {
    return document.querySelector(selector);
}
function qSelAll(selector) {
    return document.querySelectorAll(selector);
}
dayjs.extend(dayjs_plugin_customParseFormat);
let customUrlList = [];
let customPatternList = [];
const url_table = qSel("tbody#url_table");
const pattern_table = qSel("tbody#pattern_table");
const use_defined_match_list = qSel("#use_defined_match_list");
const search = qSel("#search");
const clean = qSel("#clean");
const from_time = qSel("#from_time");
const to_time = qSel("#to_time");
const matched_table = qSel("#matched_table");
const history_entry_limit = 15;
const worker = new Worker("script/worker.js");
var history_entry_list_to_clean = [];
function getCheckedValue(groupName) {
    var radios = document.getElementsByName(groupName);
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}
(async () => {
    var _a;
    use_defined_match_list["checked"] = false;
    clean["disabled"] = true;
    const setting = await browser.storage.local.get("nohistory_setting");
    if ((_a = setting === null || setting === void 0 ? void 0 : setting.nohistory_setting) === null || _a === void 0 ? void 0 : _a.darkmode) {
        document.body.classList.add("dark_mode");
        document.body.classList.remove("light_mode");
    }
    else {
        document.body.classList.remove("dark_mode");
        document.body.classList.add("light_mode");
    }
    qSel("#versionNumber").innerText = browser.runtime.getManifest().version + (browser.runtime.id.includes("@temporary-addon") ? " (If you don't know what you are doing, please install this extension in a normal way.)" : "");
    reloadTable();
})();
async function reloadTable() {
    while (pattern_table.firstChild) {
        pattern_table.removeChild(pattern_table.lastChild);
    }
    while (url_table.firstChild) {
        url_table.removeChild(url_table.lastChild);
    }
    customUrlList.forEach((url) => {
        url_table.insertAdjacentHTML("beforeend", `
            <tr data-url="${url}">
                <td>
                    <p>${url}</p>
                </td>
                <td>
                    <button class="remove">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                    </button>
                </td>
            </tr>
        `);
    });
    customPatternList.forEach((pattern) => {
        var output = "";
        switch (pattern.type) {
            case "string":
                output = `${pattern.pattern}`;
                break;
            case "regex":
                output = pattern.pattern.toString();
                break;
            default:
                output = "";
                break;
        }
        pattern_table.insertAdjacentHTML("beforeend", `
            <tr data-pattern="${output}" data-type="${pattern.type}">
                <td>
                    <p>${output}</p>
                </td>
                <td>
                    <p>${pattern.type}</p>
                </td>
                <td>
                    <button class="remove">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                    </button>
                </td>
            </tr>
        `);
    });
    qSelAll("button.remove").forEach(e => {
        var button = e;
        button.onclick = async () => {
            const tr = button.closest("tr");
            if (tr.getAttribute("data-pattern") != null) {
                const result = await storage_get("nohistory_patternList");
                let patternList = result;
                patternList = patternList.filter(f => {
                    switch (tr.getAttribute("data-type")) {
                        case "string":
                            return f.pattern != tr.getAttribute("data-pattern");
                        case "regex":
                            return f.pattern.toString() != new RegExp(tr.getAttribute("data-pattern").replace(reRegex, "$1"), "gi").toString();
                        default:
                            return false;
                    }
                });
                customPatternList = patternList;
            }
            else if (tr.getAttribute("data-url") != null) {
                const result = await storage_get("nohistory_urlList");
                const url = tr.getAttribute("data-url");
                let urlList = result;
                urlList = urlList.filter(e => e != url);
                customUrlList = urlList;
            }
            button.closest("tr").remove();
        };
    });
}
use_defined_match_list.onclick = async () => {
    qSelAll(".not_using_defined_match_list").forEach(e => {
        e.style.display = use_defined_match_list["checked"] ? "none" : "block";
    });
};
qSelAll("button.tools_button").forEach(result => {
    var button = result;
    button.onclick = () => {
        qSelAll("button.tools_button").forEach(e => e.classList.remove("checked"));
        button.classList.add("checked");
        qSelAll("div.tools_page").forEach(e => e.classList.remove("opened"));
        qSel(`div[data-correspondingTab="${button.getAttribute("data-tab")}"].tools_page`).classList.add("opened");
    };
});
qSel("#add_url").onclick = async () => {
    const text = qSel("#addorsearchurl")["value"];
    try {
        const urlObj = new URL(text);
        if (urlObj.protocol.match(/^https?:$/).length > 0) {
            if (customUrlList.indexOf(urlObj.hostname) >= 0) {
                alert("This URL is already added.");
                return;
            }
            customUrlList.push(urlObj.hostname);
            await reloadTable();
            qSel("#addorsearchurl")["value"] = "";
        }
        else {
            alert("Sorry, but this is not a valid URL. Please make sure it start with \"http://\" or \"https://\".");
        }
        console.log(customUrlList);
    }
    catch (e) {
        alert("Sorry, but this is not a valid URL. Please make sure it start with \"http://\" or \"https://\".");
    }
};
qSel("#add_pattern").onclick = async () => {
    const text = qSel("#addorsearchpattern")["value"];
    const mode = getCheckedValue("pattern_mode");
    const valueList = customPatternList.map(value => value.pattern.toString());
    var yeahno = false;
    switch (mode) {
        case "string":
            yeahno = valueList.indexOf(text) >= 0;
            break;
        case "regex":
            yeahno = valueList.indexOf(new RegExp(text, "gi").toString()) >= 0;
            break;
        default:
            yeahno = false;
            break;
    }
    if (yeahno) {
        alert("This pattern is already added.");
        return;
    }
    switch (mode) {
        case "string":
            customPatternList.push({
                "type": "string",
                "pattern": text
            });
            break;
        case "regex":
            customPatternList.push({
                "type": "regex",
                "pattern": new RegExp(text, "gi")
            });
            break;
        default:
            alert("Seems like something is broken. Please report it to the developers.");
            break;
    }
    await reloadTable();
    console.log(customPatternList);
    qSel("#addorsearchpattern")["value"] = "";
};
search.onclick = async () => {
    clean["disabled"] = true;
    var urlList = [];
    var patternList = [];
    var allHistory = await browser.history.search({ text: "", maxResults: Number.MAX_SAFE_INTEGER, startTime: 0 });
    qSel("#search_status").innerText = "In progress";
    if (use_defined_match_list["checked"]) {
        urlList = await storage_get("nohistory_urlList");
        patternList = await storage_get("nohistory_patternList");
    }
    else {
        urlList = customUrlList;
        patternList = customPatternList;
    }
    var from = dayjs(from_time.value).unix();
    var to = dayjs(to_time.value).unix();
    if (isNaN(from)) {
        from = 0;
    }
    if (isNaN(to)) {
        to = dayjs().unix();
    }
    worker.onmessage = (e) => {
        var b = e.data;
        var position = 0;
        history_entry_list_to_clean = b.output;
        qSel("#matched_item").innerText = b.output.length.toString();
        qSel("#total_item_in_history").innerText = b.total.toString();
        qSel("#search_status").innerText = "Search complete";
        qSel("#searched_from").innerText = dayjs(from * 1000).toString();
        qSel("#searched_to").innerText = dayjs(to * 1000).toString();
        while (matched_table.firstChild) {
            matched_table.removeChild(matched_table.lastChild);
        }
        var observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                entry.target.classList.toggle("show", entry.isIntersecting);
            });
        }, {
            threshold: 0.5,
            root: qSel("#table_wrapper")
        });
        const getNewHistoryEntry = () => {
            b.output.slice(history_entry_limit * position, history_entry_limit * (position + 1)).forEach((url) => {
                matched_table.insertAdjacentHTML("beforeend", `
                    <tr class="history_entry">
                        <td>
                            <p>${url.url}</p>
                        </td>
                        <td>
                            <p>${url.title}</p>
                        </td>
                        <td>
                            <p>${dayjs(url.lastVisitTime)}</p>
                        </td>
                    </tr>
                `);
                observer.observe(matched_table.lastElementChild);
            });
            position++;
        };
        getNewHistoryEntry();
        if (b.output.length > 0)
            clean["disabled"] = false;
        var history_entry = qSelAll(".history_entry");
        var lastEntryObserver = new IntersectionObserver(entries => {
            const lastEntry = entries[0];
            if (!lastEntry.isIntersecting)
                return;
            getNewHistoryEntry();
            history_entry = qSelAll(".history_entry");
            lastEntryObserver.unobserve(lastEntry.target);
            var last_history_entry = history_entry[history_entry.length - 1];
            if (!!last_history_entry) {
                lastEntryObserver.observe(last_history_entry);
            }
        }, {
            rootMargin: "100px",
            root: qSel("#table_wrapper")
        });
        var last_history_entry = history_entry[history_entry.length - 1];
        if (!!last_history_entry) {
            lastEntryObserver.observe(last_history_entry);
        }
    };
    worker.postMessage([urlList, patternList, allHistory, from * 1000, to * 1000]);
};
clean.onclick = async () => {
    if (!confirm("Are you sure you want to clean the history?"))
        return;
    qSel("#search_status").innerText = "In progress (This might take a while)";
    setTimeout(() => {
        history_entry_list_to_clean.forEach(async (entry) => {
            await browser.history.deleteUrl({ url: entry.url });
        });
        qSel("#search_status").innerText = "Clean complete";
        alert("The history has been cleaned successfully.\nAnd just to make sure, do a search again to see if everything is gone.");
        clean["disabled"] = true;
    }, 1000);
};
//# sourceMappingURL=script.js.map