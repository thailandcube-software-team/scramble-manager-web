import { EventCodeToFullMap, getEventIDByFullName } from './EnumMapping.js';

const PASSCODE_REGEX = /^(.+) Round ([1-4]) Scramble Set ([A-Z]+)(?: Attempt ([0-9]+))?: ([0-9a-z]+)$/;

export class PasscodeSorter {
    #file;
    #wcif;

    constructor(file, wcif) {
        this.#file = file;
        this.#wcif = wcif;
    }

    #getEventStartDateTime(activityCode) {
        for (const venue of this.#wcif.schedule.venues) {
            for (const room of venue.rooms) {
                for (const activity of room.activities) {
                    if (activity.activityCode === activityCode)
                        return activity.startTime; 
                    else if (activityCode.includes(activity.activityCode)) {
                        for (const childActivity of activity.childActivities) {
                            if (childActivity.activityCode === activityCode)
                                return childActivity.startTime;
                        }
                    }
                }
            }
        }

        return null; 
    }

    sort() {
        const fileContents = this.#file.content.split('\n');

        const passcodes = [];
        
        fileContents.forEach((line) => {
            const match = line.trim().match(PASSCODE_REGEX)
            if (match) {
                const eventName = match[1];
                const round = match[2];
                const set = match[3];
                const passcode = match[5];
                
                const eventID = getEventIDByFullName(eventName).toLowerCase();
                
                const groupNumber = set.toLowerCase().charCodeAt(0) - 96;
                const activityCode = `${eventID}-r${round}-g${groupNumber}`;

                const scrambleData = {
                    eventID: eventID,
                    eventName: eventName,
                    round: round,
                    set: set,
                    passcode: passcode,
                    startDateTime: this.#getEventStartDateTime(activityCode),
                };

                passcodes.push(scrambleData);
            }
        });

        passcodes.sort((a, b) => {
            if (!a.startDateTime) return 1;
            if (!b.startDateTime) return -1;

            const dateA = new Date(a.startDateTime);
            const dateB = new Date(b.startDateTime);

            return dateA - dateB; 
        });

        const sortedPasscodeLines = [];
        
        let lastDate = '';

        passcodes.forEach((passcode) => {
            let dateStr = 'Unknown Date';
            if (passcode.startDateTime)
                dateStr = new Date(passcode.startDateTime).toLocaleDateString();

            let header = '';
            if (dateStr !== lastDate) {
                header = `=== ${dateStr} ===\n`;
                lastDate = dateStr;
            }

            const attemptStr = passcode.attempt ? ` Attempt ${passcode.attempt}` : '';

            const line = `${header}${passcode.eventName} Round ${passcode.round} Scramble Set ${passcode.set}${attemptStr}: ${passcode.passcode}`;

            sortedPasscodeLines.push(line);
        });

        return sortedPasscodeLines.join('\n');
    }
}