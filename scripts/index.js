import { ZipManager } from './services/ZipManager.js';

let wcifData = null;
let competitionName = '';

const loadWCIFButton = document.getElementById('load-wcif-button');
loadWCIFButton.addEventListener('click', handleLoadWCIF);

const reorganizeButton = document.getElementById('reorganize-button');
reorganizeButton.addEventListener('click', handleOrganizeZip);

async function handleLoadWCIF(event) {
    const competitionID = document.getElementById('competition-id').value.trim();

    if (!competitionID) {
        showToast('Please enter a Competition ID', 'error');
        return;
    }

    const button = event.target;
    button.disabled = true;
    button.innerText = 'Loading...';

    try {
        const response = await fetch(`https://www.worldcubeassociation.org/api/v0/competitions/${competitionID}/wcif/public`);

        wcifData = await response.json();
        competitionName = wcifData.name;

        console.log('Loaded WCIF:', wcifData);

        showToast(`Successfully loaded data for ${competitionID}`, 'success');
    }
    catch (err) {
        showToast('Failed to load competition data', 'error');
        console.error(`Error: ${err}`);
    }
    finally {
        button.disabled = false;
        button.innerText = 'Load WCIF';
    }
}

async function handleOrganizeZip(event) {
    event.preventDefault();

    const fileInput = document.getElementById('scramble-file');

    if (fileInput.files.length === 0) {
        showToast('Please select a .zip file first', 'error');
        return;
    }

    const file = fileInput.files[0];
    const button = event.target;
    
    button.disabled = true;
    button.innerText = 'Processing...';

    try {
        const zipper = new ZipManager(file);
        const extractedData = await zipper.unzip();

        showToast(`Successfully extracted ${extractedData.length} files!`, 'success');

        const organizedZip = await zipper.reorganizeScrambles(wcifData);
        const blob = await organizedZip.generateAsync({type: 'blob'});

        const downloadURL = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadURL;

        link.download = `[ORGANIZED] - ${competitionName || 'Competition'}.zip`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(downloadURL);

        showToast('Successfully reorganized and downloaded scrambles!', 'success');
    } 
    catch (error) {
        console.error(error);
        showToast('Failed to process the zip file.', 'error');
    } 
    finally {
        button.disabled = false;
        button.innerText = 'Reorganize & Zip';
    }

    return;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    
    // Create the toast element
    const toast = document.createElement('div');
    
    // Set base classes (Dark mode styling matching your theme)
    toast.className = `max-w-xs w-full px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transform transition-all duration-300 translate-y-5 opacity-0 flex items-center gap-3`;
    
    // Style based on type (success vs error)
    if (type === 'error') {
        toast.classList.add('bg-red-500/10', 'border', 'border-red-500/20', 'text-red-400');
        toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> ${message}`;
    } 
    else {
        toast.classList.add('bg-emerald-500/10', 'border', 'border-emerald-500/20', 'text-emerald-400');
        toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> ${message}`;
    }

    // Add to container
    container.appendChild(toast);

    // Trigger animation (slight delay needed for CSS transitions to catch the DOM insertion)
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-5', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-5', 'opacity-0');
        
        // Wait for the fade-out animation to finish before removing from DOM
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}