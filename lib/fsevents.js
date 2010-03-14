var os = require("os");

exports.watch = function(dirOrDirs, callback) {
    if (dirOrDirs instanceof Array) {
        dirOrDirs = dirOrDirs.join(" ");
    }
    
    loop(dirOrDirs, callback);
};

var loop = function(stringOfDirsToWatch, callback)
{
    os.system("fsevents-wait" + " " + stringOfDirsToWatch);
    os.sleep(1); // This allows the user to quit using CTRL-C twice
    
    if (callback)
        callback();
    
    loop(stringOfDirsToWatch, callback);
};

if (require.main === module) {
    var parser = new (require("args").Parser)();

    parser.usage("WATCH_DIR");
    parser.help("The directory on which to watch changes.");

    parser.helpful();
    
    var options = parser.parse(require("system").args);
    
    if (options.args.length < 1) {
        parser.printUsage(options);
        os.exit(-1);
    }
        
    exports.watch(options.args[0]);
}