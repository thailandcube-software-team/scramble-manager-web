let wcifData = null;

async function handleLoadWCIF(event) 
{
    const competitionId = document.getElementById('competition-id').value.trim();

    if (!competitionId) 
    {
        showToast('Please enter a Competition ID', 'error');
        return;
    }

    const button = event.target;
    button.disabled = true;
    button.innerText = 'Loading...';

    try
    {
        const response = await fetch(`https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`);

        wcifData = await response.json();

        console.log('Loaded WCIF:', wcifData);

        showToast(`Successfully loaded data for ${competitionId}`, 'success');
    }
    catch (err)
    {
        showToast('Failed to load competition data', 'error');
        console.error(`Error: ${err}`);
    }
    finally
    {
        button.disabled = false;
        button.innerText = 'Load WCIF';
    }
}

function showToast(message, type = 'success') 
{
    const container = document.getElementById('toast-container');
    
    // Create the toast element
    const toast = document.createElement('div');
    
    // Set base classes (Dark mode styling matching your theme)
    toast.className = `max-w-xs w-full px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transform transition-all duration-300 translate-y-5 opacity-0 flex items-center gap-3`;
    
    // Style based on type (success vs error)
    if (type === 'error') 
    {
        toast.classList.add('bg-red-500/10', 'border', 'border-red-500/20', 'text-red-400');
        toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> ${message}`;
    } 
    else 
    {
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