"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.find = find;
exports.match = match;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const minimatch_1 = __importDefault(require("minimatch"));
function find(findPath) {
    if (!findPath) {
        core.debug('no path specified');
        return [];
    }
    // normalize the path, otherwise the first result is inconsistently formatted from the rest of the results
    // because path.join() performs normalization.
    findPath = path.normalize(findPath);
    // debug trace the parameters
    core.debug(`findPath: '${findPath}'`);
    // return empty if not exists
    try {
        fs.lstatSync(findPath);
    }
    catch (err) {
        if (err.code == 'ENOENT') {
            core.debug('0 results');
            return [];
        }
        throw err;
    }
    try {
        let result = [];
        // push the first item
        let stack = [new _FindItem(findPath, 1)];
        while (stack.length) {
            // pop the next item and push to the result array
            let item = stack.pop(); // non-null because `stack.length` was truthy
            result.push(item.path);
            // stat the item.  the stat info is used further below to determine whether to traverse deeper
            //
            // stat returns info about the target of a symlink (or symlink chain),
            // lstat returns info about a symlink itself
            let stats;
            // use lstat (not following symlinks)
            stats = fs.lstatSync(item.path);
            // note, isDirectory() returns false for the lstat of a symlink
            if (stats.isDirectory()) {
                core.debug(`  ${item.path} (directory)`);
                // push the child items in reverse onto the stack
                let childLevel = item.level + 1;
                let childItems = fs.readdirSync(item.path)
                    .map((childName) => new _FindItem(path.join(item.path, childName), childLevel));
                for (var i = childItems.length - 1; i >= 0; i--) {
                    stack.push(childItems[i]);
                }
            }
            else {
                core.debug(`  ${item.path} (file)`);
            }
        }
        core.debug(`${result.length} results`);
        return result;
    }
    catch (err) {
        throw new Error('Failed find: ' + err.message);
    }
}
class _FindItem {
    constructor(path, level) {
        this.path = path;
        this.level = level;
    }
}
function _getDefaultMatchOptions() {
    return {
        debug: false,
        nobrace: true,
        noglobstar: false,
        dot: true,
        noext: false,
        nocase: process.platform == 'win32',
        nonull: false,
        matchBase: false,
        nocomment: false,
        nonegate: false,
        flipNegate: false
    };
}
function _debugMatchOptions(options) {
    core.debug(`matchOptions.debug: '${options.debug}'`);
    core.debug(`matchOptions.nobrace: '${options.nobrace}'`);
    core.debug(`matchOptions.noglobstar: '${options.noglobstar}'`);
    core.debug(`matchOptions.dot: '${options.dot}'`);
    core.debug(`matchOptions.noext: '${options.noext}'`);
    core.debug(`matchOptions.nocase: '${options.nocase}'`);
    core.debug(`matchOptions.nonull: '${options.nonull}'`);
    core.debug(`matchOptions.matchBase: '${options.matchBase}'`);
    core.debug(`matchOptions.nocomment: '${options.nocomment}'`);
    core.debug(`matchOptions.nonegate: '${options.nonegate}'`);
    core.debug(`matchOptions.flipNegate: '${options.flipNegate}'`);
}
function match(list, patterns, patternRoot, options) {
    // trace parameters
    core.debug(`patternRoot: '${patternRoot}'`);
    options = options || _getDefaultMatchOptions(); // default match options
    _debugMatchOptions(options);
    // convert pattern to an array
    if (typeof patterns == 'string') {
        patterns = [patterns];
    }
    // hashtable to keep track of matches
    let map = {};
    let originalOptions = options;
    for (let pattern of patterns) {
        core.debug(`pattern: '${pattern}'`);
        // trim and skip empty
        pattern = (pattern || '').trim();
        if (!pattern) {
            core.debug('skipping empty pattern');
            continue;
        }
        // clone match options
        let options = _cloneMatchOptions(originalOptions);
        // skip comments
        if (!options.nocomment && _startsWith(pattern, '#')) {
            core.debug('skipping comment');
            continue;
        }
        // set nocomment - brace expansion could result in a leading '#'
        options.nocomment = true;
        // determine whether pattern is include or exclude
        let negateCount = 0;
        if (!options.nonegate) {
            while (pattern.charAt(negateCount) == '!') {
                negateCount++;
            }
            pattern = pattern.substring(negateCount); // trim leading '!'
            if (negateCount) {
                core.debug(`trimmed leading '!'. pattern: '${pattern}'`);
            }
        }
        let isIncludePattern = negateCount == 0 ||
            (negateCount % 2 == 0 && !options.flipNegate) ||
            (negateCount % 2 == 1 && options.flipNegate);
        // set nonegate - brace expansion could result in a leading '!'
        options.nonegate = true;
        options.flipNegate = false;
        // expand braces - required to accurately root patterns
        let expanded;
        let preExpanded = pattern;
        if (options.nobrace) {
            expanded = [pattern];
        }
        else {
            // convert slashes on Windows before calling braceExpand(). unfortunately this means braces cannot
            // be escaped on Windows, this limitation is consistent with current limitations of minimatch (3.0.3).
            core.debug('expanding braces');
            let convertedPattern = process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern;
            expanded = minimatch_1.default.braceExpand(convertedPattern);
        }
        // set nobrace
        options.nobrace = true;
        for (let pattern of expanded) {
            if (expanded.length != 1 || pattern != preExpanded) {
                core.debug(`pattern: '${pattern}'`);
            }
            // trim and skip empty
            pattern = (pattern || '').trim();
            if (!pattern) {
                core.debug('skipping empty pattern');
                continue;
            }
            // root the pattern when all of the following conditions are true:
            if (patternRoot && // patternRoot supplied
                !_isRooted(pattern) && // AND pattern not rooted
                // AND matchBase:false or not basename only
                (!options.matchBase || (process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern).indexOf('/') >= 0)) {
                pattern = _ensureRooted(patternRoot, pattern);
                core.debug(`rooted pattern: '${pattern}'`);
            }
            if (isIncludePattern) {
                // apply the pattern
                core.debug('applying include pattern against original list');
                let matchResults = minimatch_1.default.match(list, pattern, options);
                core.debug(matchResults.length + ' matches');
                // union the results
                for (let matchResult of matchResults) {
                    map[matchResult] = true;
                }
            }
            else {
                // apply the pattern
                core.debug('applying exclude pattern against original list');
                let matchResults = minimatch_1.default.match(list, pattern, options);
                core.debug(matchResults.length + ' matches');
                // substract the results
                for (let matchResult of matchResults) {
                    delete map[matchResult];
                }
            }
        }
    }
    // return a filtered version of the original list (preserves order and prevents duplication)
    let result = list.filter((item) => map.hasOwnProperty(item));
    core.debug(result.length + ' final results');
    return result;
}
function _cloneMatchOptions(matchOptions) {
    return {
        debug: matchOptions.debug,
        nobrace: matchOptions.nobrace,
        noglobstar: matchOptions.noglobstar,
        dot: matchOptions.dot,
        noext: matchOptions.noext,
        nocase: matchOptions.nocase,
        nonull: matchOptions.nonull,
        matchBase: matchOptions.matchBase,
        nocomment: matchOptions.nocomment,
        nonegate: matchOptions.nonegate,
        flipNegate: matchOptions.flipNegate
    };
}
function _startsWith(str, start) {
    return str.slice(0, start.length) == start;
}
function _isRooted(p) {
    p = _normalizeSeparators(p);
    if (!p) {
        throw new Error('isRooted() parameter "p" cannot be empty');
    }
    if (process.platform == 'win32') {
        return _startsWith(p, '\\') || // e.g. \ or \hello or \\hello
            /^[A-Z]:/i.test(p); // e.g. C: or C:\hello
    }
    return _startsWith(p, '/'); // e.g. /hello
}
function _ensureRooted(root, p) {
    if (!root) {
        throw new Error('ensureRooted() parameter "root" cannot be empty');
    }
    if (!p) {
        throw new Error('ensureRooted() parameter "p" cannot be empty');
    }
    if (_isRooted(p)) {
        return p;
    }
    if (process.platform == 'win32' && root.match(/^[A-Z]:$/i)) { // e.g. C:
        return root + p;
    }
    // ensure root ends with a separator
    if (_endsWith(root, '/') || (process.platform == 'win32' && _endsWith(root, '\\'))) {
        // root already ends with a separator
    }
    else {
        root += path.sep; // append separator
    }
    return root + p;
}
function _normalizeSeparators(p) {
    p = p || '';
    if (process.platform == 'win32') {
        // convert slashes on Windows
        p = p.replace(/\//g, '\\');
        // remove redundant slashes
        let isUnc = /^\\\\+[^\\]/.test(p); // e.g. \\hello
        return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\'); // preserve leading // for UNC
    }
    // remove redundant slashes
    return p.replace(/\/\/+/g, '/');
}
function _endsWith(str, end) {
    return str.slice(-end.length) == end;
}
