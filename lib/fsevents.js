var os = require("os");
var File = require("file");
var FileList = require("jake").FileList;

exports.watch = function(dirOrDirs, callback) {
    if (!(dirOrDirs instanceof Array)) {
        dirOrDirs = [dirOrDirs];
    }
    
    // get absolute file paths
    dirOrDirs = dirOrDirs.map(function(dir) {
        return File.absolute(dir);
    });

    loop(dirOrDirs, callback);
};

var loop = function(arrayOfDirsToWatch, callback, startingFiles)
{
    startingFiles = startingFiles || getFileData(arrayOfDirsToWatch);
        
    var cmd = "fsevents-wait " + arrayOfDirsToWatch.map(function(dir) {return "'" + dir + "'";}).join(" ");
    os.system(cmd);
    os.sleep(1); // This allows the user to quit using CTRL-C twice

    var endingFiles = getFileData(arrayOfDirsToWatch);
    var modifiedFiles = getModifiedFiles(startingFiles, endingFiles);
    
    if (callback)
        callback(modifiedFiles);
    
    loop(arrayOfDirsToWatch, callback, endingFiles);
};

var getFileData = function(watchDirs) {
    var files = {};
    for (var i = 0; i < watchDirs.length; i++) {
        var newFiles = getFiles(watchDirs[i]);
        for (var j = 0; j < newFiles.length; j++) {
            var newFile = File.absolute(newFiles[j]);
            files[newFile] = {
                "path": newFile,
                "lastModified": File.mtime(newFile)
            };
        }
    }
    return files;
};

var getFiles = function(dir) {
    dir = File.absolute(dir);
    var files = [];
    
    File.list(dir).forEach(function(fileOrDir) {
        var fullPath = File.join(dir, fileOrDir);
        if (/^\..*$/.test(fileOrDir)) { // don't add hidden files or folders
            return;
        }
        if (File.isDirectory(fullPath)) {
            files.push(getFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    });
    
    return files.reduce(function(el1, el2) {
        return el1.concat(el2);
    }, []);
};

var getModifiedFiles = function(startingFiles, endingFiles) {
    var modifiedFiles = [];
    
    for (var filePath in startingFiles) {
        var startingFile = startingFiles[filePath];
        startingFile.visited = true;
        
        var endingFile = endingFiles[filePath];
        if (!endingFile) {
            startingFile.change = "deleted";
            modifiedFiles.push(startingFile);
            continue;
        }
        
        endingFile.visited = true;
        if (startingFile.lastModified < endingFile.lastModified) {
            endingFile.change = "updated";
            modifiedFiles.push(endingFile);
            continue;
        }
    }
    
    for (var filePath in endingFiles) {
        var endingFile = endingFiles[filePath];
        if (!endingFile.visited) {
            endingFile.visited = true;
            endingFile.change = "created";
            modifiedFiles.push(endingFile);
        }
    }
    
    return modifiedFiles;
};

var DEBUG = false;
var debug = function() {
    if (DEBUG)
        print.apply(this, arguments);
};

// expose for testing
exports.test = {};
exports.test.getFileData = getFileData;
exports.test.getFiles = getFiles;
exports.test.getModifiedFiles = getModifiedFiles;

if (require.main === module) {
    var parser = new (require("args").Parser)();

    parser.usage("WATCH_DIR");
    parser.help("The directory on which to watch changes.");
    
    parser.option("-d", "debug")
        .def(false)
        .set(true)
        .help("Debug flag. Use this option to print debug messages.");

    parser.helpful();
    
    var options = parser.parse(require("system").args);
    
    if (options.args.length < 1) {
        parser.printUsage(options);
        os.exit(-1);
    }
    
    DEBUG = options.debug;
    exports.watch(options.args[0]);
}