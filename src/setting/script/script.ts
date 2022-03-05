function toggleDarkMode(isIt: boolean) {
    if (isIt) {
        document.body.classList.add("dark_mode");
        document.body.classList.remove("light_mode");
    } else {
        document.body.classList.remove("dark_mode");
        document.body.classList.add("light_mode");
    }
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
    document.getElementById("versionNumber").innerHTML = browser.runtime.getManifest().version;
    const setting = await browser.storage.local.get("nohistory_setting");
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
                await browser.storage.local.set({
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
    var data1 = await browser.storage.local.get("nohistory_setting");
    var data2 = await browser.storage.local.get("nohistory_urlList");
    var data = {
        "setting": data1.nohistory_setting,
        "urlList": data2.nohistory_urlList
    }

    var blob = new Blob([JSON.stringify(data, null, 4)], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "nohistory_config.json");
}

document.getElementById("import_setting").onclick = async () => {
    const result = await openFile();
    if (result == null || typeof result != "string") return;
    var data = JSON.parse(result);
    await browser.storage.local.set({
        "nohistory_setting": data.setting,
        "nohistory_urlList": data.urlList
    })
    location.reload();
}

const url_table = document.querySelector("div[data-correspondingTab='url']").querySelector("tbody") as HTMLTableSectionElement;

async function reloadTable() {
    const result = await browser.storage.local.get("nohistory_urlList");
    let urlList: string[] = result.nohistory_urlList || [];
    urlList.forEach((url) => {
        const template = `
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
        url_table.insertAdjacentHTML("beforeend", template);
    })
    document.querySelectorAll("button.remove").forEach(e => {
        var button = e as HTMLButtonElement;
        button.onclick = async () => {
            const url = button.closest("tr").getAttribute("data-url");
            const result = await browser.storage.local.get("nohistory_urlList");
            let urlList: string[] = result.nohistory_urlList || [];
            urlList = urlList.filter(e => e != url);
            browser.storage.local.set({
                "nohistory_urlList": urlList
            })
            button.closest("tr").remove();
        }
    })
}

window.addEventListener("load", reloadTable)

document.getElementById("refresh_table").onclick = async () => {
    while (url_table.firstChild) {
        url_table.removeChild(url_table.lastChild);
    }
    await reloadTable();
}

document.getElementById("add_url").onclick = async () => {
    const text = document.getElementById("addorsearchurl")["value"];
    try {
        const urlObj = new URL(text);
        if (urlObj.protocol.match(/^https?:$/).length > 0) {
            const result = await browser.storage.local.get("nohistory_urlList");
            let urlList: string[] = result.nohistory_urlList || [];
            if (urlList.indexOf(urlObj.hostname) >= 0) {
                alert("This URL is already added.");
                return;
            }
            urlList.push(urlObj.hostname);
            await browser.storage.local.set({
                "nohistory_urlList": urlList
            })
            while (url_table.firstChild) {
                url_table.removeChild(url_table.lastChild);
            }
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