import { EventCodeToFullMap, getEventIDByFullName } from './EnumMapping.js';

export class ScrambleSorter {
    #file;
    #wcif;

    constructor(file, wcif) {
        this.#file = file;
        this.#wcif = wcif;
    }

    async sort(baseFolder) {
        const innerZip = new JSZip();
        const loadedPDFs = await innerZip.loadAsync(this.#file.content);

        console.log('Loaded PDFS:', loadedPDFs);

        const allActivities = [];

        for (const venue of this.#wcif.schedule.venues) {
            for (const room of venue.rooms) {
                for (const activity of room.activities) {
                    const eventID = activity.activityCode.split('-')[0];
                    
                    if (eventID !== 'other' && activity.startTime) {
                        allActivities.push({
                            venueName: venue.name,
                            roomName: room.name,
                            activity: activity
                        });
                    }
                }
            }
        }

        allActivities.sort((a, b) => {
            return new Date(a.activity.startTime) - new Date(b.activity.startTime);
        });

        let activityIndex = 1;

        for (const item of allActivities) {
            const activity = item.activity;
            const [eventID, round] = activity.activityCode.split('-');
            
            const venueFolder = baseFolder.folder(item.venueName);
            const roomFolder = venueFolder.folder(item.roomName);
            
            const dateStr = activity.startTime.split('T')[0];
            const dateFolder = roomFolder.folder(dateStr);

            const folderName = `${activityIndex++}-${EventCodeToFullMap[eventID.toUpperCase()]}-${round.toUpperCase()}`;
            const eventRoundFolder = dateFolder.folder(folderName);

            if (activity.childActivities.length !== 0) {
                for (const childActivity of activity.childActivities) {
                    const groupParts = childActivity.activityCode.split('-g');
                    
                    if (groupParts.length > 1) {
                        const groupNumber = parseInt(groupParts[1], 10);
                        const setLetter = String.fromCharCode(64 + groupNumber);
                        const roundNumber = round.replace('r', '');
                        const eventName = EventCodeToFullMap[eventID.toUpperCase()];

                        let expectedFileName = '';

                        if (eventID === '333mbf') {
                            const attemptNumber = parseInt(groupParts[1].split('-a')[1], 10);
                            expectedFileName = `${eventName} Round ${roundNumber} Scramble Set ${setLetter} Attempt ${attemptNumber}.pdf`;
                        } else {
                            expectedFileName = `${eventName} Round ${roundNumber} Scramble Set ${setLetter}.pdf`;
                        }

                        const matchedZipEntry = Object.values(loadedPDFs.files).find(zipFile => 
                            !zipFile.dir && zipFile.name.includes(expectedFileName)
                        );

                        if (matchedZipEntry) {
                            const pdfBinaryData = await matchedZipEntry.async('arraybuffer');
                            eventRoundFolder.file(expectedFileName, pdfBinaryData);
                            console.log(`Moved: ${expectedFileName}`);
                        } else {
                            console.warn(`Missing PDF for: ${expectedFileName}`);
                        }
                    }
                }
            }
        }
    }
}