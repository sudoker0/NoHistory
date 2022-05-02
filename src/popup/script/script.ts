var storage = () => browser.storage.local
var qSel = (selector: string) => document.querySelector(selector) as HTMLElement;
var qSelAll = (selector: string) => document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
var validURL = true;

const default_setting = {
    versionNumber: browser.runtime.getManifest().version,
    darkmode: true,
    animation: true,
    statusBadge: true,
}

const urlButton = qSel("#thispage");
const tabButton = qSel("#makethetab");
const optionPage = qSel("#managenohistory");

// {a: 1, b: 3, d: 2}; {a: 3, c: 4, d: 2} => { a: 1, c: 4, d: 2 }
function migrateObj(oldObj: Object, newObj: Object): Object {
    oldObj = Object.keys(newObj).reduce((acc, key) => ({ ...acc, [key]: oldObj[key] == null || oldObj[key] == undefined ? newObj[key] : oldObj[key] }), {})
    return oldObj;
}

// Is the two array equal?
function areArraysEqualSets (a1: string[], a2: string[]) {
    const superSet = {};
    for (const i of a1) {
        const e = i + typeof i;
        superSet[e] = 1;
    }
    for (const i of a2) {
        const e = i + typeof i;
        if (!superSet[e]) {
            return false;
        }
        superSet[e] = 2;
    }
    for (let e in superSet) {
        if (superSet[e] === 1) {
            return false;
        }
    }
    return true;
}

async function updateConf() {
    const oldConf = (await browser.storage.local.get("nohistory_setting"))["nohistory_setting"];
    const currentVersionNumber = browser.runtime.getManifest().version
    if (oldConf != undefined && (oldConf?.versionNumber != currentVersionNumber || !areArraysEqualSets(Object.keys(oldConf), Object.keys(default_setting)))) {
        var migratedObj = migrateObj(oldConf, default_setting);
        migratedObj["versionNumber"] = currentVersionNumber;
        await browser.storage.local.set({nohistory_setting: migratedObj});
    }
}

function toggleButton(button: HTMLElement, on: boolean) {
    if (!validURL) return false;
    button.querySelector(".on").classList[on ? "remove" : "add"]("not");
    button.querySelector(".off").classList[on ? "add" : "remove"]("not");
    button.style.setProperty("--current-status-color", on ? "var(--no-color)" : "var(--yes-color)");
}

// Since there are two button in the popup page for adding and removing URL, this function will decide what button to show based on if of the current URL exist in the URl list.
async function isURLExist() {
    const result = await browser.runtime.sendMessage("isURLExist");
    urlButton.title = `Is this URL going to be saved to history? ${result ? "No" : "Yes"}`;
    toggleButton(urlButton, result);
}

// Just like the function above, but for tab instead.
async function isTabExist() {
    const result = await browser.runtime.sendMessage("isTabExist");
    tabButton.title = `Is every single link in this tab going to be saved to history? ${result ? "No" : "Yes"}`;
    toggleButton(tabButton, result);
}

window.addEventListener('load', async () => {
    qSel("#versionNumber").innerText = browser.runtime.getManifest().version + (browser.runtime.id.includes("@temporary-addon") ? " (If you don't know what you are doing, please install this extension in a normal way.)" : "");
    await isURLExist();
    await isTabExist();
    await updateConf();
    const currentURL: string = await browser.runtime.sendMessage("getCurrentURL");
    const urlObj = new URL(currentURL);

    const currentTabId: number = await browser.runtime.sendMessage("getCurrentTabId");

    // Check if the current URL valid.
    if (urlObj.hostname.trim() == "" || !(urlObj.protocol.match(/^https?:$/)?.length > 0)) {
        // Show the error
        qSel("#error_cannotChange").classList.remove("hidden_by_default");
        qSelAll(".depend_on_url").forEach(v => v.classList.add("grayed_out"));
        validURL = false;
    } else {
        qSel("#hidden_wrapper").classList.remove("hidden_by_default");
        qSelAll(".depend_on_url").forEach(v => v.classList.remove("grayed_out"));
        validURL = true;
    }

    // Set the current URL and the tab ID on the popup page
    qSel("#page_currently_on").innerText = urlObj.hostname;
    qSel("#id_of_tab").innerText = currentTabId.toString();
    const setting = await browser.storage.local.get("nohistory_setting");
    if (setting?.nohistory_setting == null) {
        await browser.storage.local.set({
            nohistory_setting: default_setting
        });
    }
    if (setting?.nohistory_setting?.darkmode) {
        document.body.classList.add("dark_mode");
        document.body.classList.remove("light_mode");
    } else {
        document.body.classList.remove("dark_mode");
        document.body.classList.add("light_mode");
    }
});

urlButton.addEventListener("click", async () => {
    const result = await browser.runtime.sendMessage("isURLExist");
    await browser.runtime.sendMessage(result ? "removeItem" : "addItem");
    await isURLExist();
})

tabButton.addEventListener("click", async () => {
    const result = await browser.runtime.sendMessage("isTabExist");
    await browser.runtime.sendMessage(result ? "removeTab" : "addTab");
    await isTabExist();
})

optionPage.addEventListener("click", async () => {
    await browser.runtime.openOptionsPage();
    window.close();
})
