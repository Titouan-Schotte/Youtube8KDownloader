const {app, BrowserWindow, Menu, ipcMain, ipcRenderer, dialog, remote} = require('electron'),
    path = require('path'),
    url = require('url'),
    ytdl = require('ytdl-core'),
    fs=require('fs'),
    Store = require('electron-store'),
    store = new Store(),
    EventEmitter = require('events'),
    loadingEvents = new EventEmitter(),
    http = require('https')
ffmpeg = require('fluent-ffmpeg'),
    {exec} = require('child_process');
;


let dlrate = 0.0,
    dlratte = 0.0,
    pathaudio = '',
    pathvideo = ''

// Disable error dialogs by overriding
dialog.showErrorBox = function(title, content) {
    console.log(`${title}\n${content}`);
};






//       //
//Windows//
//       //


//CREATE LOADING SCREEN
const createLoadScreen = () => new BrowserWindow({
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    center: true,
    resizable: false,
    frame: false,
    width: 250,
    height: 300,
    show: false
})





//Create Main
function createMainWindow() {
    let winMain = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true, //this must be true
            preload: path.join(__dirname , 'windows/preload.js')
        },
        frame: false,
        width: 800,
        height: 600,
        resizable: false,
        center: true,
        title: 'Proxy Generator',
        icon: 'assets/icon-proxy.png',
        show: false
    })
    const mainMenu = Menu.buildFromTemplate([]);
    Menu.setApplicationMenu(mainMenu)
    winMain.once('ready-to-show', () => {
        winMain.show()
    })
    winMain.loadURL(url.format({pathname: path.join(__dirname, 'windows/mainWindow.html'), protocol: 'file:', slashes:true}));






    //const mainMenu = Menu.buildFromTemplate([]);
    //Menu.setApplicationMenu(mainMenu)
    winMain.on('close', function () {
        app.quit()
    })
}























//              //
//PROG PRINCIPAL//
//              //
app.whenReady().then(async () => {
    const window = createLoadScreen()
    window.loadURL(url.format({
        pathname: path.join(__dirname, "/windows/loadingScreen.html"),
        protocol: 'file:',
        slashes: true
    }));
    window.once('ready-to-show', () => {
        window.show()
        ipcMain.on('forceprogress', (e, a)=> {
            createMainWindow()
            window.close()
        })
        loadingEvents.on('finished', () => {
            createMainWindow()
            window.close()
        })
        loadingEvents.on('progress', percentage => {
            window.webContents.send('progress', percentage)
        })
        download(
            'https://512pixels.net/downloads/macos-wallpapers/10-15-Day.jpg'
        )
    })


})

const download = (url, closeCallback) => {
    const file = fs.createWriteStream('big-file.jpg');

    http.get(url, function(response) {
        let total = 0;
        response.on('data', (c) => {
            total += c.length
            loadingEvents.emit('progress', total/response.headers['content-length'])
        })
        response.pipe(file)
        file.on('finish', function() {
            file.close(() => loadingEvents.emit('finished'))
        }).on('error', function(err) {
            fs.unlink(dest)
        })
    })
}




ipcMain.on('req', async (event, args) => {
    console.log(args)
    dlrate = 0.0
    dlratte = 0.0
    pathaudio = ''
    pathvideo = ''
    args.path = args.path != '' ? args.path : __dirname + '\\out'
    console.log(args.path[0].toLowerCase() + args.path.substr(1))
    //MP4
    if(args.format == 'mp4'){
        var url = args.url;

        var video = ytdl(url,  { filter: 'videoonly', quality: 'highestvideo' }), output;
        await ytdl.getInfo(url).then(info => {
            var resvideo = {
                author : info.videoDetails.author.name,
                thumbnails : info.videoDetails.thumbnails[3].url,
                title : info.videoDetails.title.replace('/', '').replace('\\', '').replace('.', '').replace(':', '')
            }
            output = path.resolve(args.path, resvideo.title + '.mp4');
            pathvideo = [output, path.resolve(args.path, resvideo.title + '(edited).mp4'), resvideo.title];
            console.log(output)
            event.sender.send('res', resvideo)
        })
        video.pipe(fs.createWriteStream(output));

        video.on('response', function(res) {
            var totalSizevideo = res.headers['content-length'], dataReadvideo = 0, finishedvideo = false;
            res.on('data', function(data) {
                dataReadvideo += data.length;
                var percent = dataReadvideo / totalSizevideo;

                if(dlrate < percent*100 && !finishedvideo){
                    console.log((percent * 100)+ '% => Percent\n'+dlrate+' => DLRATE')
                    event.sender.send('percent', (percent * 100))
                    dlrate = percent*100
                    if(dlrate == 100){finishedvideo = true;}
                }
            });
            res.on('end', async function() {
                if(finishedvideo){
                    var audio = ytdl(url,  { filter : 'audioonly', quality: 'highestaudio' }), titlename, output;
                    await ytdl.getInfo(url).then(info => {
                        const resaudio = {
                            author : info.videoDetails.author.name,
                            thumbnails : info.videoDetails.thumbnails[3].url,
                            title : info.videoDetails.title.replace('/', '').replace('\\', '').replace('.', '').replace(':', '')
                        }
                        output = path.resolve(args.path, resaudio.title + '.m4a');
                        pathaudio = path.resolve(args.path, resaudio.title + '.m4a');
                        titlename = res.title
                        console.log(output)
                        event.sender.send('res', resaudio)
                    })
                    audio.pipe(fs.createWriteStream(output));

                    audio.on('response', function(ress) {
                        var totalSizeaudio = ress.headers['content-length'], dataReadaudio = 0, finishedaudio = false;
                        ress.on('data', function(data) {
                            dataReadaudio += data.length;
                            var percent =  dataReadaudio / totalSizeaudio;

                            if(dlratte < percent*100 && !finishedaudio){
                                console.log('AUDIO ==== ' + (percent * 100)+ '% => Percent\n'+dlratte+' => DLRATE')
                                event.sender.send('percent', (percent * 100))
                                dlratte = percent*100
                                if(dlratte == 100){finishedaudio = true;}
                            }
                        });
                        ress.on('end', async function() {
                            if(finishedaudio){
                                console.log('Audio Downloaded')
                                var content = `"${__dirname}\\ffmpeg\\bin\\ffmpeg.exe" -i "${pathvideo[0]}" -i "${pathaudio}" -c:v copy -c:a aac "${pathvideo[1]}"`
                                console.log(content)
                                await exec(content, async (err, stdout, stderr) => {
                                    if (err) {
                                        console.log(err)
                                        return;
                                    }
                                    console.log(stdout);
                                    await exec('y', async (err, stdout, stderr) => {
                                        if (err) {
                                            return;
                                        }
                                    })
                                    await exec('del "'+ pathvideo[0] +'" "' + pathaudio + '"', async (err, stdout, stderr) => {
                                        if (err) {
                                            console.error(err);
                                            return;
                                        }
                                        console.log(stdout);
                                        await exec('ren "'+pathvideo[1]+'" "'+ pathvideo[2] + '.mp4"', async (err, stdout, stderr) => {
                                            if (err) {
                                                console.error(err);
                                                return;
                                            }
                                            console.log(stdout);
                                        })
                                    })
                                })
                                return event.sender.send('finish', args.path)
                            }
                        })
                    });
                }
            });
        });
    }
    //MP3
    else {
        var url = args.url;

        var video = ytdl(url,  { filter : 'audioonly', quality: 'highestaudio' }), titlename, output,output2, output3;
        await ytdl.getInfo(url).then(info => {
            var res = {
                author : info.videoDetails.author.name,
                thumbnails : info.videoDetails.thumbnails[3].url,
                title : info.videoDetails.title.replace('/', '').replace('\\', '').replace('.', '').replace(':', '')
            }
            output = path.resolve(args.path, res.title + '.m4a');
            output2 = path.resolve(args.path, res.title + '.mp3');
            output3 = path.resolve(args.path, res.title + ' (edited).mp3');
            titlename = res.title
            console.log(output)
            event.sender.send('res', res)
        })
        video.pipe(fs.createWriteStream(output));

        video.on('response', function(res) {
            var totalSize = res.headers['content-length'];
            var dataRead = 0;
            res.on('data', function(data) {
                dataRead += data.length;
                var percent = dataRead / totalSize;
                console.log((percent * 100)+ '% => Percent\n'+dlrate+' => DLRATE')

                if(dlrate < percent*100){
                    event.sender.send('percent', (percent * 100))
                    dlrate = percent*100
                }
            });
            res.on('end', function() {

                exec(`"${__dirname}\\ffmpeg\\bin\\ffmpeg.exe" -i "${output}" "${output2}"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log(stdout);
                    exec('del "' + output + '"' , (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                    });
                });
                event.sender.send('finishmp3', [titlename, output2, output3, args.path])
                return
            });
        });
    }
})


ipcMain.on('opendir', (event, args) => {
    console.log(args[0].toLowerCase() + args.substr(1))
    require("child_process").exec('start "" "' + args[0].toLowerCase() + args.substr(1)+'"');
})


ipcMain.on('prop', (event, args) => {
    var content = `"${__dirname}\\ffmpeg\\bin\\ffmpeg.exe" -i "${args.pathorigin}"${args.img != '' ? ' -i "'+args.img+'" -map 0:0 -map 1:0 -c copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"': ''}${args.title != '' ? ' -metadata title="'+args.title+'"' : ''}${args.composer != '' ? ' -metadata composer="'+args.composer+'"' : ''}${args.album != '' ? ' -metadata album="'+args.album+'"' : ''}${args.year != '' ? ' -metadata year="'+args.year+'"' : ''}${args.description != '' ? ' -metadata description="'+args.description+'"' : ''} -codec copy "${args.pathedited}"`
    console.log(content)
    exec(content, (err, stdout, stderr) => {
        if (err) {
            console.log(err)
            return;
        }
        console.log(stdout);
        exec('y', (err, stdout, stderr) => {
            if (err) {
                return;
            }
        })
        exec('del "'+ args.pathorigin +'"', (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            exec('ren "'+args.pathedited+'" "'+args.title+'.mp3"', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            })
        })
    });
})

ipcMain.on('pleasefinishmp3', (eve, arg) =>{
    eve.sender.send('finishmp3', arg)
})

ipcMain.on('getfolder', (eve, args) => {
    if(typeof store.get(args) == "undefined"){
        eve.sender.send('responsefolder', false)
    }else{
        console.log('already exist')
        eve.sender.send('responsefolder', store.get(args))
    }
})
ipcMain.on('setfolder', (eve, args)=>{
    console.log('set ' + args[1])
    store.set(args[0], args[1])
})


ipcMain.on('getfile', (eve, args) => {

    if(typeof store.get(args) == "undefined"){
        eve.sender.send('responsefile', false)
    }else{
        console.log('already exist')
        eve.sender.send('responsefile', store.get(args))
    }
})
ipcMain.on('setfile', (eve, args)=>{
    console.log('set ' + args[1])
    store.set(args[0], args[1])
})