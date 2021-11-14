const customTitlebar = require('custom-electron-titlebar');
const electron = require('electron')
window.addEventListener('DOMContentLoaded', () => {
    const CustomBar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#444'),
        titleHorizontalAlignment: "left",
        maximizable: false,
        menuPosition: "left"
    });
    window.insertCSS('html,body{ overflow: hidden !important; }');
})
