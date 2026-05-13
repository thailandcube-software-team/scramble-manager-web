// Adapted from ThailandCube Web Application's code

export const EventCodeToFullMap = {
    '333': '3x3x3',
    '222': '2x2x2',
    '444': '4x4x4',
    '555': '5x5x5',
    '666': '6x6x6',
    '777': '7x7x7',
    '333BF': '3x3x3 Blindfolded',
    '333FM': '3x3x3 Fewest Moves',
    '333OH': '3x3x3 One-Handed',
    'CLOCK': 'Clock',
    'MINX': 'Megaminx',
    'PYRAM': 'Pyraminx',
    'SKEWB': 'Skewb',
    'SQ1': 'Square-1',
    '444BF': '4x4x4 Blindfolded',
    '555BF': '5x5x5 Blindfolded',
    '333MBF': '3x3x3 Multiple Blindfolded',
};

export function getEventIDByFullName(name) {
    return Object.keys(EventCodeToFullMap).find(key => EventCodeToFullMap[key] === name);
}