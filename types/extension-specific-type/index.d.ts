declare interface Pattern {
    type: string,
    pattern: string | RegExp
}

declare interface Settings {
    versionNumber: string,
    darkmode: boolean,
    animation: boolean,
    statusBadge: boolean
}

declare interface Config {
    setting: Settings,
    urlList: string[],
    patternList: Pattern[]
}