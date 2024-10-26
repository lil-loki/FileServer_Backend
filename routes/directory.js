const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const helpers = require('../utils/helpers.js');

const authenticator = require('../middleware/auth.js')

const File_Server_BASE_URL = "../FileServer";
const BIN_BASE_URL = "../BIN";

router.use(authenticator);

router.get('/ping', function (req, res, next) {
    res.send('pong');
});

/*----------------------------------------Create Routes----------------------------------------*/

//Create-Folder
router.post('/createFolder', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    let folderName = req.body.folderName || 'New Folder';   
    folderName = helpers.generateFolderName(path.join(__dirname, File_Server_BASE_URL,dir), folderName);
    let folderPath = path.resolve(path.join(__dirname, File_Server_BASE_URL,dir,folderName));
    try {
        fs.mkdirSync(folderPath, { recursive: true });
        res.send({ message: "Folder created successfully", folderName: folderName });
    } catch (err) {
        res.status(500).send({ message: "Error creating folder", error: err });
    }
});
//Upload-Folder
router.post('/uploadFolder', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    let filesArray = req.files.file;
    if (filesArray) {
        let folderPath = path.resolve(path.join(__dirname, File_Server_BASE_URL, dir));
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        filesArray.forEach(file => {
            let fileName = file.name;
            let filePath = path.resolve(path.join(folderPath, fileName));
            file.mv(filePath, err => {
                if (err) {
                    return res.status(500).send({ message: "Error uploading folder", error: err });
                }
            });
        });
        res.send({ message: "Folder uploaded successfully" });
    } else {
        res.status(400).send({ message: "No Folder uploaded" });
    }
});
//Upload-File
router.post('/uploadFile', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    let files = req.files;
    if(files){
        let file = files.file;
        let fileName = file.name;
        let filePath=path.resolve(path.join(__dirname,File_Server_BASE_URL,dir,fileName));
        file.mv(filePath, err => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send({ message: "Success" });
            }
        });
    }
});

/*----------------------------------------Read Routes----------------------------------------*/

//Read-File
//Download-File
router.post('/downloadFile', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    let filePath=path.resolve(path.join(__dirname,File_Server_BASE_URL,dir));
    fs.stat(filePath,(err,stat)=>{
        if(err){
            res.status(500).send(err)
        }
        if(!stat.isFile()){
            res.status(500).send({message:"Not a file."})
        }
        res.download(filePath);
    });
});
//Download-Folder
router.post('/downloadFolder', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    let folderPath = path.resolve(path.join(__dirname,File_Server_BASE_URL, dir));
    let folderName = path.basename(folderPath);
    folderName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');    
    if (!fs.existsSync(folderPath)) {
        return res.status(404).send({ message: "Folder not found" });
    }
    res.setHeader('Content-Disposition', `attachment; filename=${folderName}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    let archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.on('error', function (err) {
        return res.status(500).send({ message: "Error creating zip", error: err.message });
    });
    archive.pipe(res);
    archive.directory(folderPath, false);
    archive.finalize();
});

/*----------------------------------------Update Routes----------------------------------------*/

//Rename
router.post('/rename', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    let newName = body.newName;
    let oldDir=path.resolve(path.join(__dirname,File_Server_BASE_URL,dir));
    let dirName=path.dirname(oldDir);
    let newDir=path.join(dirName,newName);  
    if (!fs.existsSync(oldDir)) {
        return res.status(500).send({ message: "File/Folder not found" });
    }
    if (fs.existsSync(newDir)) {
        return res.status(500).send({ message: "A file or folder with the new name already exists." });
    }
    fs.rename(oldDir,newDir, (err) => {
        if (err) {
            return res.status(500).send({ message: " Error renaming File/Folder", error: err.message });
        }
        res.send({ message: "File/Folder renamed successfully" });
    });
});
//Move
router.post('/move', function (req, res, next) {
    let body = req.body;
    let dirSrc = body.pathSrc;
    let dirDest = body.pathDest;
    let dirSrcPath=path.resolve(path.join(__dirname,File_Server_BASE_URL,dirSrc));
    let dirDestPath=path.resolve(path.join(__dirname,File_Server_BASE_URL,dirDest,path.basename(dirSrcPath))); 
    if (!fs.existsSync(dirSrcPath)) {
        return res.status(500).send({ message: "File/Folder not found" });
    }
    if (fs.existsSync(dirDestPath)) {
        return res.status(500).send({ message: "A file or folder with the name already exists." });
    }
    fs.rename(dirSrcPath,dirDestPath, (err) => {
        if (err) {
            return res.status(500).send({ message: " Error moving File/Folder", error: err.message });
        }
        res.send({ message: "File/Folder moved successfully" });
    });
    
});
//Copy
router.post('/copy', function (req, res, next) {
    let body = req.body;
    let dirSrc = body.pathSrc;
    let dirDest = body.pathDest;
    let dirSrcPath=path.resolve(path.join(__dirname,File_Server_BASE_URL,dirSrc));
    let dirDestPath=path.resolve(path.join(__dirname,File_Server_BASE_URL,dirDest)); 
    if (!fs.existsSync(dirSrcPath)) {
        return res.status(500).send({ message: "File/Folder not found" });
    }
    try {
        let baseName = path.basename(dirSrcPath);
        if (fs.existsSync(dirDestPath) && fs.statSync(dirDestPath).isDirectory()) {
            dirDestPath = path.join(dirDestPath, baseName);
        }        
        let uniqueFileName = helpers.generateCopiedFileName(path.dirname(dirDestPath),baseName);
        dirDestPath = path.join(path.dirname(dirDestPath), uniqueFileName);        
        fs.cpSync(dirSrcPath, dirDestPath, { recursive: true });
        res.send({ message: "File/Folder copied successfully"});
    } catch (err) {
        return res.status(500).send({ message: "Error copying File/Folder", error: err.message });
    }
});

/*----------------------------------------Delete Routes----------------------------------------*/

//Delete
router.post('/delete', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    dir=path.resolve(path.join(__dirname,BIN_BASE_URL,dir));
    if (!fs.existsSync(dir)) {
        return res.status(500).send({ message: "File/Folder not found" });
    }
    fs.rm(dir, { recursive: true, force: true }, (err) => {
        if (err) {
            return res.status(500).send({ message: "Error deleting File/Folder", error: err.message });
        } 
        res.send({ message: "Success" });
    });
});
//MoveToBin
router.post('/MoveToBin', function (req, res, next) {
    let body = req.body;
    let dir = body.path;
    dir=path.resolve(path.join(__dirname,File_Server_BASE_URL,dir));    
    if (!fs.existsSync(dir)) {
        return res.status(500).send({ message: "File/Folder not found" });
    }
    fs.rename(dir,path.resolve(path.join(__dirname,BIN_BASE_URL,path.basename(dir))), (err) => {
        if (err) {
            return res.status(500).send({ message: "Error deleting file", error: err.message });
        }
        res.send({ message: "File/Folder Deleted successfully" });
    });
});

/*----------------------------------------Util Routes----------------------------------------*/

//File-Folder-List
router.get('/ls', function (req, res, next) {
    let query = req.query;
    let dir = query.dir;
    fs.readdir(path.resolve(path.join(__dirname,File_Server_BASE_URL,dir)), (err, files) => {
        if (err) {
            if(err.errno=-4058){
                res.status(500).send({message:"No Such Folder or File Found"})
            }else{
                res.status(500).send(err);
            }
        }
        var results = [];
        for (var file of files) {
            let filePath = path.resolve(path.join(__dirname,File_Server_BASE_URL,dir,file));
            stats = fs.statSync(filePath);
            results.push({
                name: file,
                type: stats.isFile() ? path.extname(file) : 'folder',
                size: stats.isFile() ? stats.size / (1024) : null, 
                modified: stats.mtime,
            });
        }
        let response = {
            files: results
        };
        res.send(response);
    });
});

//File-Folder-List-BIN
router.get('/lsBin', function (req, res, next) {
    let query = req.query;
    let dir = query.dir;
    fs.readdir(path.resolve(path.join(__dirname,BIN_BASE_URL,dir)), (err, files) => {
        if (err) {
            if(err.errno=-4058){
                res.status(500).send({message:"No Such Folder or File Found"})
            }else{
                res.status(500).send(err);
            }
        }
        var results = [];      
        for (var file of files) {
            let filePath = path.resolve(path.join(__dirname,BIN_BASE_URL,dir,file));
            stats = fs.statSync(filePath);
            results.push({
                name: file,
                type: stats.isFile() ? path.extname(file) : 'folder',
                size: stats.isFile() ? stats.size / (1024) : null, 
                modified: stats.mtime,
            });
        }
        let response = {
            files: results
        };
        res.send(response);
    });
});

//Restore-From-Bin



module.exports = router;