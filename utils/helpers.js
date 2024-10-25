const fs = require('fs');
const path = require('path');

const generateFolderName = (basePath, folderName)=> {
    let count = 1;
    let originalName = folderName;
    while (fs.existsSync(path.join(basePath, folderName))) {
        folderName = `${originalName} (${count++})`;
    }    
    return folderName;
}

const generateCopiedFileName = (basePath, baseName) => {
    let copyCount = 1;
    let newName = baseName;  
    while (fs.existsSync(path.join(basePath, newName))) {
        newName = `${baseName} copy${copyCount++}${path.extname(baseName)}`;
    }
    return newName;
};

module.exports = {
    generateFolderName,
    generateCopiedFileName
};