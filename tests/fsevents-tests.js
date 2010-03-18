var ASSERT = require("test/assert");
var FILE = require("file");
var modulePath = FILE.path(module.path);

var fsevents = require("../lib/fsevents.js").test;

exports.testGetFileDataForSingleDirectory = function() {
    var dirs = [getRelativePath("../lib")];
    var path = getRelativePath("../lib/fsevents.js");

    var expected = {};
    expected[path] = {
        "path": path,
        "lastModified": FILE.mtime(path)
    };
    
    ASSERT.eq(expected, fsevents.getFileData(dirs));
};

exports.testGetFileDataForMultipleDirectories = function() {
    var dirs = [getRelativePath("../lib"), getRelativePath("../src")];
    var fseventsjs_path = getRelativePath("../lib/fsevents.js");
    var fsevents_wait_path = getRelativePath("../src/fsevents-wait.m");
    
    var expected = {};
    expected[fseventsjs_path] = {
        "path": fseventsjs_path,
        "lastModified": FILE.mtime(fseventsjs_path)
    };
    expected[fsevents_wait_path] = {
        "path": fsevents_wait_path,
        "lastModified": FILE.mtime(fsevents_wait_path)
    };
    
    ASSERT.eq(expected, fsevents.getFileData(dirs));
};

exports.testGetFiles = function () {
    var dir = getRelativePath("../lib");
    
    var expected = [getRelativePath("../lib/fsevents.js")];
    
    ASSERT.eq(expected, fsevents.getFiles(dir));
};

exports.testGetFilesInSubdirectories = function () {
    var dir = getRelativePath("../");
    
    var expected = [
        getRelativePath("../bin/fsevents-wait"),
        getRelativePath("../lib/fsevents.js"),
        getRelativePath("../narwhal.conf"),
        getRelativePath("../package.json"),
        getRelativePath("../README"),
        getRelativePath("../src/fsevents-wait.m"),
        getRelativePath("../tests/fsevents-tests.js")
    ];    
    
    ASSERT.eq(expected, fsevents.getFiles(dir));
};

exports.testGetModifiedFiles = function () {
    var pastDate = new Date(1234567);
    var now = new Date();
    
    var startingFiles = {};
    var path1 = getRelativePath("../bin/fsevents-wait");
    startingFiles[path1] = {
        "path": path1,
        "lastModified": pastDate
    };
    var path2 = getRelativePath("../lib/fsevents.js");
    startingFiles[path2] = {
        "path": path2,
        "lastModified": pastDate
    };
    var path3 = getRelativePath("../src/fsevents-wait.m");
    startingFiles[path3] = {
        "path": path3,
        "lastModified": pastDate
    };
    
    var endingFiles = {};
    endingFiles[path1] = {
        "path": path1,
        "lastModified": now
    };
    endingFiles[path2] = {
        "path": path2,
        "lastModified": pastDate
    };
    var path4 = getRelativePath("../test/fsevents-tests.js");
    endingFiles[path4] = {
        "path": path4,
        "lastModified": now
    };
    
    var expected = [];
    expected.push({
        "path": path1,
        "lastModified": now,
        "change": "updated",
        "visited": true
    });
    expected.push({
        "path": path3,
        "lastModified": pastDate,
        "change": "deleted",
        "visited": true
    });
    expected.push({
        "path": path4,
        "lastModified": now,
        "change": "created",
        "visited": true
    });
    
    ASSERT.eq(expected, fsevents.getModifiedFiles(startingFiles, endingFiles));
};

var getRelativePath = function(relPath) {
    return modulePath.resolve(relPath).toString();
};

if (require.main === module)
    require("os").exit(require("test/runner").run(exports));