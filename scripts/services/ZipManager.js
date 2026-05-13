import { PasscodeSorter } from './PasscodeSorter.js';
import { EventCodeToFullMap } from './EnumMapping.js';
import { ScrambleSorter } from './ScrambleSorter.js';

export class ZipManager {
    #file;
    #extractedFiles;

    constructor(file) {
        this.#file = file;
        this.#extractedFiles = [];
    }

    async unzip() {
        const zip = new JSZip();

        try {
            const loadedZip = await zip.loadAsync(this.#file);
            const filePromises = [];

            loadedZip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && !relativePath.includes('/')) {
                    const isText = relativePath.toLowerCase().endsWith('.txt');
                    
                    const dataType = isText ? 'string' : 'arraybuffer';

                    const readPromise = zipEntry.async(dataType).then(content => {
                        return {
                            name: relativePath,
                            content: content
                        };
                    });
                    
                    filePromises.push(readPromise);
                }
            });

            this.#extractedFiles = await Promise.all(filePromises);

            return this.#extractedFiles;
        }
        catch (err) {
            console.error('Zip processing failed:', err);
            throw new Error('Could not read the zip file. It may be corrupted.');
        }
    }

    #getPasscodeFile() {
        if (this.#extractedFiles.length === 0)
            throw new Error('No files found in the archive or the file hasn\'t been unzipped before.')

        const passcodeFile = this.#extractedFiles.find((file) => {
            return file.name.includes(' - Computer Display PDF Passcodes - SECRET.txt');
        });

        return passcodeFile;
    }

    #getScrambleZip() {
        if (this.#extractedFiles.length === 0)
            throw new Error('No files found in the archive or the file hasn\'t been unzipped before.')

        const scrambleFile = this.#extractedFiles.find((file) => {
            return file.name.includes(' - Computer Display PDFs.zip');
        });

        return scrambleFile;
    }

    async reorganizeScrambles(wcif) {
        const passcodeFile = this.#getPasscodeFile();
        const scrambleFile = this.#getScrambleZip();

        const passcodeSorter = new PasscodeSorter(passcodeFile, wcif);
        const sortedPasscodesString = passcodeSorter.sort();

        const outputZip = new JSZip();
        outputZip.file('Sorted Passcodes.txt', sortedPasscodesString);

        const scramblesRootFolder = outputZip.folder('Organized Scrambles');

        const scrambleSorter = new ScrambleSorter(scrambleFile, wcif);
        await scrambleSorter.sort(scramblesRootFolder); 

        return outputZip;
    }
}