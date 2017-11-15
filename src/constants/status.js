const ADDED = 'ADDED';
const CHANGED = 'CHANGED';
const DELETED = 'DELETED';
const UNCHANGED = 'UNCHANGED';

module.exports = {
    ADDED,
    CHANGED,
    DELETED,
    UNCHANGED,
    colors: {
        [ADDED]: 'green',
        [CHANGED]: 'blue',
        [DELETED]: 'red',
        [UNCHANGED]: 'black'
    },
    symbols: {
        [ADDED]: '+',
        [CHANGED]: '%',
        [DELETED]: '-',
        [UNCHANGED]: ' '
    },
    verbs: {
        [ADDED]: 'Uploaded',
        [CHANGED]: 'Uploaded',
        [DELETED]: 'Deleted',
        [UNCHANGED]: 'Skipped'
    }
};