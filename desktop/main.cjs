const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
function createWindow(){
 const win=new BrowserWindow({width:1440,height:960,minWidth:900,minHeight:650,
  backgroundColor:'#10110f',title:'LA GUEUZE',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.loadFile(path.join(__dirname,'..','index.html'));
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://')||url.startsWith('mailto:')||url.startsWith('tel:'))shell.openExternal(url);return {action:'deny'}});
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
