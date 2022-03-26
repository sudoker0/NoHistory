const default_setting = {
    versionNumber: browser.runtime.getManifest().version,
    darkmode: false,
    animation: true,
    statusBadge: true,
}

const addButton = document.getElementById("addthispage");
const removeButton = document.getElementById("removethispage");
const optionPage = document.getElementById("managenohistory");

const addTab = document.getElementById("makethetabnohistory");
const removeTab = document.getElementById("makethetabyeshistory");

const tabStatus = document.getElementById("status_of_tab");
const urlStatus = document.getElementById("status_of_url");

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

// Since there are two button in the popup page for adding and removing URL, this function will decide what button to show based on if of the current URL exist in the URl list.
async function isURLExist() {
    const result = await browser.runtime.sendMessage("isRemoveNotClicked");
    if (result) {
        addButton.classList.add("button_off");
        removeButton.classList.remove("button_off");
        urlStatus.innerText = "NO";
        urlStatus.classList.add("no");
    } else {
        addButton.classList.remove("button_off");
        removeButton.classList.add("button_off");
        urlStatus.innerText = "YES";
        urlStatus.classList.remove("no");
    }
}

// Just like the function above, but for tab instead.
async function isTabExist() {
    const result = await browser.runtime.sendMessage("isTabExist");
    if (result) {
        addTab.classList.add("button_off");
        removeTab.classList.remove("button_off");
        tabStatus.innerText = "NO";
        tabStatus.classList.add("no");
    } else {
        addTab.classList.remove("button_off");
        removeTab.classList.add("button_off");
        tabStatus.innerText = "YES";
        tabStatus.classList.remove("no");
    }
}

window.addEventListener('load', async () => {
    document.getElementById("versionNumber").innerText = browser.runtime.getManifest().version;
    await isURLExist();
    await isTabExist();
    await updateConf();
    const currentURL: string = await browser.runtime.sendMessage("getCurrentURL");
    const urlObj = new URL(currentURL);

    const currentTabId: number = await browser.runtime.sendMessage("getCurrentTabId");

    // Check if the current URL valid.
    if (urlObj.hostname.trim() == "" || !(urlObj.protocol.match(/^https?:$/)?.length > 0))
        // Show the error
        document.getElementById("error_cannotChange").classList.remove("hidden_by_default");
    else
        document.getElementById("hidden_wrapper").classList.remove("hidden_by_default");

    // Set the current URL and the tab ID on the popup page
    document.getElementById("page_currently_on").innerText = urlObj.hostname;
    document.getElementById("id_of_tab").innerText = currentTabId.toString();
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

addButton.addEventListener("click", async () => {
    await browser.runtime.sendMessage("addItem");
    await isURLExist();
})

removeButton.addEventListener("click", async () => {
    await browser.runtime.sendMessage("removeItem");
    await isURLExist();
})

addTab.addEventListener("click", async () => {
    await browser.runtime.sendMessage("addTab");
    await isTabExist();
})

removeTab.addEventListener("click", async () => {
    await browser.runtime.sendMessage("removeTab");
    await isTabExist();
})

optionPage.addEventListener("click", async () => {
    await browser.runtime.openOptionsPage();
})
