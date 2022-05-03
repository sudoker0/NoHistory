const reRegex = /\/(.*)\/[gmiyu]*/g;

function storage() { return browser.storage.local };

async function storage_get(key: string): Promise<any | false> {
    const result = await storage().get(key)
    return result[key] ?? false
}

function qSel(selector: string): HTMLElement {
    return document.querySelector(selector)
}

function qSelAll(selector: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(selector)
}


function toggleDarkMode(isIt: boolean) {
    if (isIt) {
        document.body.classList.add("dark_mode");
        document.body.classList.remove("light_mode");
    } else {
        document.body.classList.remove("dark_mode");
        document.body.classList.add("light_mode");
    }
}

function getCheckedValue(groupName: string) {
    var radios = document.getElementsByName(groupName) as NodeListOf<HTMLInputElement>;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}

function toggleTransition(isIt: boolean) {
    if (isIt) {
        document.body.classList.remove("notransition");
    } else {
        document.body.classList.add("notransition");
    }
}

function saveAs(blob: Blob, filename: string) {
    var a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}

function openFile(): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
        const readFile = function(e: Event) {
            var file = e.target["files"][0];
            if (!file) {
                return null;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                var contents = e.target.result;
                document.body.removeChild(fileInput)
                resolve(contents);
            }
            reader.onerror = function(e) {
                reject(e);
            }
            reader.readAsText(file)
        }
        const fileInput = document.createElement("input")
        fileInput.type = 'file'
        fileInput.style.display = 'none'
        fileInput.onchange = readFile
        fileInput.accept = "application/json"
        document.body.appendChild(fileInput)
        fileInput.click();
    })
}

window.addEventListener("load", async () => {
    qSel("#versionNumber").innerText = browser.runtime.getManifest().version + (browser.runtime.id.includes("@temporary-addon") ? " (If you don't know what you are doing, please install this extension in a normal way.)" : "");
    const config: Settings = await storage_get("nohistory_setting");

    function toggleStuff() {
        toggleDarkMode(config.darkmode);
        toggleTransition(config.animation);
    }

    // Loop through the keys in the config
    Object.keys(config).forEach(key => {
        // Loop through the setting input (like switch or text)
        qSelAll(".setting_option").forEach(e => {
            var option = e as HTMLInputElement;
            option.onclick = async () => {
                var opt = option.getAttribute("data-settingOption");
                switch (typeof config[key]) {
                    case "boolean":
                        config[opt] = option.checked;
                        break;
                    case "string":
                    case "number":
                        config[opt] = option.value;
                        break;
                }
                await storage().set({
                    "nohistory_setting": config
                })
                toggleStuff();
            }
            if (e.getAttribute("data-settingOption") != key) return;
            switch (typeof config[key]) {
                case "boolean":
                    e["checked"] = config[key];
                    break;
                case "string":
                case "number":
                    e["value"] = config[key];
                    break;
            }
        })
    })
    toggleStuff();
})

qSelAll("button.setting_button").forEach(result => {
    var button = result as HTMLButtonElement;
    button.onclick = () => {
        // Change the tab page based on the clicked tab button
        qSelAll("button.setting_button").forEach(e => e.classList.remove("checked"));
        button.classList.add("checked");
        qSelAll("div.setting_page").forEach(e => e.classList.remove("opened"));
        qSel(`div[data-correspondingTab="${button.getAttribute("data-tab")}"].setting_page`).classList.add("opened");
    }
})

qSel("#export_setting").onclick = async () => {
    var patternList: Pattern[] = await storage_get("nohistory_patternList")
    patternList.forEach((t, i) => {
        switch (t.type) {
            case "regex":
                patternList[i].pattern = t.pattern.toString().replace(reRegex, "$1");
                break;
            default:
                return ""
        }
    })
    var data = {
        "setting": await storage_get("nohistory_setting"),
        "urlList": await storage_get("nohistory_urlList"),
        "patternList": patternList
    }

    var blob = new Blob([JSON.stringify(data, null, 4)], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "nohistory_config.json");
}

qSel("#import_setting").onclick = async () => {
    const result = await openFile();
    if (result == null || typeof result != "string") return;
    try {
        var data: Config = JSON.parse(result);
    }
    catch(e) {
        alert("Invalid JSON file.");
        return;
    }
    data.patternList?.forEach((t, i) => {
        switch (t.type) {
            case "regex":
                data.patternList[i].pattern = new RegExp(t.pattern, "gi");
                break;
            default:
                return ""
        }
    })
    var settingJSON = {
        "nohistory_setting": data.setting,
        "nohistory_urlList": data.urlList,
        "nohistory_patternList": data.patternList
    }
    if (Object.keys(settingJSON).some(t => settingJSON[t] == null || settingJSON[t] == undefined)) {
        alert("The file you uploaded is not a valid config file.")
        return;
    }

    await storage().set(settingJSON)
    location.reload();
}

const url_table = qSel("tbody#url_table");
const pattern_table = qSel("tbody#pattern_table");

async function reloadTable() {

    while (pattern_table.firstChild) { pattern_table.removeChild(pattern_table.lastChild) }
    while (url_table.firstChild) { url_table.removeChild(url_table.lastChild) }

    const url_list = await storage_get("nohistory_urlList");
    const pattern_list = await storage_get("nohistory_patternList");
    let urlList: string[] = url_list;
    let patternList: Pattern[] = pattern_list;

    urlList.forEach((url) => {
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
        `
        );
    })
    patternList.forEach((pattern) => {
        var output = ""
        switch (pattern.type) {
            case "string":
                output = `${pattern.pattern}`;
                break;
            case "regex":
                output = pattern.pattern.toString();
                break;
            default:
                output = ""
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
        `
        );
    })
    qSelAll("button.remove").forEach(e => {
        var button = e as HTMLButtonElement;
        button.onclick = async () => {
            const tr = button.closest("tr");
            if (tr.getAttribute("data-pattern") != null) {
                const result = await storage_get("nohistory_patternList");
                let patternList: Pattern[] = result;
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
                await storage().set({ "nohistory_patternList": patternList })
            } else if (tr.getAttribute("data-url") != null) {
                const result = await storage_get("nohistory_urlList");
                const url = tr.getAttribute("data-url");
                let urlList: string[] = result;
                urlList = urlList.filter(e => e != url);
                await storage().set({ "nohistory_urlList": urlList })
            }
            button.closest("tr").remove();
        }
    })
}

window.addEventListener("load", reloadTable)
qSel("#reload_everything").onclick = async () => { await reloadTable() }

qSel("#add_url").onclick = async () => {
    const text = qSel("#addorsearchurl")["value"];
    try {
        const urlObj = new URL(text);
        if (urlObj.protocol.match(/^https?:$/).length > 0) {
            const result = await storage_get("nohistory_urlList");
            let urlList: string[] = result;
            if (urlList.indexOf(urlObj.hostname) >= 0) {
                alert("This URL is already added.");
                return;
            }
            urlList.push(urlObj.hostname);
            await storage().set({
                "nohistory_urlList": urlList
            })
            await reloadTable();
            qSel("#addorsearchurl")["value"] = "";
        } else {
            alert("Sorry, but this is not a valid URL. Please make sure it start with \"http://\" or \"https://\".");
        }
    }
    catch (e) {
        alert("Sorry, but this is not a valid URL. Please make sure it start with \"http://\" or \"https://\".");
    }
}

qSel("#add_pattern").onclick = async () => {
    const text = qSel("#addorsearchpattern")["value"];
    const mode = getCheckedValue("pattern_mode");

    const result = await storage_get("nohistory_patternList");
    const patternList: Pattern[] = result;
    const valueList = patternList.map(value => value.pattern.toString());

    var yeahno = false;
    switch (mode) {
        case "string":
            yeahno = valueList.indexOf(text) >= 0
            break;
        case "regex":
            yeahno = valueList.indexOf(new RegExp(text, "gi").toString()) >= 0
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
            patternList.push({
                "type": "string",
                "pattern": text
            });
            break;
        case "regex":
            patternList.push({
                "type": "regex",
                "pattern": new RegExp(text, "gi")
            });
            break;
        default:
            alert("Seems like something is broken. Please report it to the developers.")
            break;
    }

    await storage().set({
        "nohistory_patternList": patternList
    })
    await reloadTable();
    qSel("#addorsearchpattern")["value"] = "";
}