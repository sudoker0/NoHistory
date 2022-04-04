var storage = () => browser.storage.local
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
    document.getElementById("versionNumber").innerText = browser.runtime.getManifest().version + (browser.runtime.id.includes("@temporary-addon") ? " (If you don't know what you are doing, please install this extension in a normal way.)" : "");
    const setting = await storage().get("nohistory_setting");
    const config: {
        darkmode: boolean,
        animation: boolean,
        statusBadge: boolean
    } = setting?.nohistory_setting;

    function toggleStuff() {
        toggleDarkMode(config.darkmode);
        toggleTransition(config.animation);
    }

    // Loop through the keys in the config
    Object.keys(config).forEach(key => {
        // Loop through the setting input (like switch or text)
        document.querySelectorAll(".setting_option").forEach(e => {
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

document.querySelectorAll("button.setting_button").forEach(result => {
    var button = result as HTMLButtonElement;
    button.onclick = () => {
        // Change the tab page based on the clicked tab button
        document.querySelectorAll("button.setting_button").forEach(e => e.classList.remove("checked"));
        button.classList.add("checked");
        document.querySelectorAll("div.setting_page").forEach(e => e.classList.remove("opened"));
        document.querySelector(`div[data-correspondingTab="${button.getAttribute("data-tab")}"].setting_page`).classList.add("opened");
    }
})

document.getElementById("export_setting").onclick = async () => {
    var data = {
        "setting": await storage().get("nohistory_urlList"),
        "urlList": await storage().get("nohistory_setting"),
        "patternList": await storage().get("nohistory_patternList")
    }

    var blob = new Blob([JSON.stringify(data, null, 4)], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "nohistory_config.json");
}

document.getElementById("import_setting").onclick = async () => {
    const result = await openFile();
    if (result == null || typeof result != "string") return;
    var data = JSON.parse(result);
    await storage().set({
        "nohistory_setting": data.setting,
        "nohistory_urlList": data.urlList,
        "nohistory_patternList": data.patternList
    })
    location.reload();
}

const url_table = document.querySelector("tbody#url_table");
const pattern_table = document.querySelector("tbody#pattern_table");

async function reloadTable() {
    const url_list = await storage().get("nohistory_urlList");
    const pattern_list = await storage().get("nohistory_patternList");
    let urlList: string[] = url_list.nohistory_urlList || [];
    let patternList: { type: string, pattern: string | RegExp }[] = pattern_list.nohistory_patternList || [];
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
    document.querySelectorAll("button.remove").forEach(e => {
        var button = e as HTMLButtonElement;
        button.onclick = async () => {
            const tr = button.closest("tr");
            if (tr.getAttribute("data-pattern") != null) {
                const result = await storage().get("nohistory_patternList");
                let patternList: { type: string, pattern: string | RegExp }[] = result.nohistory_patternList || [];
                patternList = patternList.filter(f => {
                    switch (tr.getAttribute("data-type")) {
                        case "string":
                            return f.pattern != tr.getAttribute("data-pattern");
                        case "regex":
                            return f.pattern.toString() != new RegExp(tr.getAttribute("data-pattern").replace(/\/(.*)\/[gmiyu]*/g, "$1"), "gi").toString();
                        default:
                            return false;
                    }
                });
                storage().set({ "nohistory_patternList": patternList })
            } else if (tr.getAttribute("data-url") != null) {
                const result = await storage().get("nohistory_urlList");
                const url = tr.getAttribute("data-url");
                let urlList: string[] = result.nohistory_urlList || [];
                urlList = urlList.filter(e => e != url);
                storage().set({ "nohistory_urlList": urlList })
            }
            button.closest("tr").remove();
        }
    })
}

window.addEventListener("load", reloadTable)

document.getElementById("refresh_url_table").onclick = async () => {
    while (url_table.firstChild) { url_table.removeChild(url_table.lastChild) }
    await reloadTable();
}

document.getElementById("refresh_pattern_table").onclick = async () => {
    while (pattern_table.firstChild) { pattern_table.removeChild(pattern_table.lastChild) }
    await reloadTable();
}

document.getElementById("add_url").onclick = async () => {
    const text = document.getElementById("addorsearchurl")["value"];
    try {
        const urlObj = new URL(text);
        if (urlObj.protocol.match(/^https?:$/).length > 0) {
            const result = await storage().get("nohistory_urlList");
            let urlList: string[] = result.nohistory_urlList || [];
            if (urlList.indexOf(urlObj.hostname) >= 0) {
                alert("This URL is already added.");
                return;
            }
            urlList.push(urlObj.hostname);
            await storage().set({
                "nohistory_urlList": urlList
            })
            while (url_table.firstChild) { url_table.removeChild(url_table.lastChild) }
            await reloadTable();
            document.getElementById("addorsearchurl")["value"] = "";
        } else {
            alert("Sorry, but this is not a valid URL. Please make sure it start with \"http://\" or \"https://\".");
        }
    }
    catch (e) {
        alert("Sorry, but this is not a valid URL. Please make sure it start with \"http://\" or \"https://\".");
    }
}

document.getElementById("add_pattern").onclick = async () => {
    const text = document.getElementById("addorsearchpattern")["value"];
    const mode = getCheckedValue("pattern_mode");

    const result = await storage().get("nohistory_patternList");
    const patternList: { type: string, pattern: string | RegExp }[] = result.nohistory_patternList || [];
    const valueList = patternList.map(value => value.pattern.toString());

    var yeahno = false;
    switch (mode) {
        case "string":
            yeahno = valueList.indexOf(text) >= 0
            break;
        case "regex":
            yeahno = valueList.indexOf(new RegExp(text, "gi").toString()) >= 0
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
    while (pattern_table.firstChild) { pattern_table.removeChild(pattern_table.lastChild) }
    await reloadTable();
    document.getElementById("addorsearchpattern")["value"] = "";
}