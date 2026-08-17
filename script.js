const door = document.querySelector('#open-door');
const party = document.querySelector('#party');
const form = document.querySelector('#wish-form');
const status = document.querySelector('#form-status');
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby0QgVPo5T8AzQRTM-7EQnp4aegnWHX_1xwW99X2I1k3YaNKp2l32E4S8cQcVlW163W/exec';

// Door functionality
door.addEventListener('click', () => {
  const opened = door.classList.toggle('open');
  door.setAttribute('aria-expanded', String(opened));
  if (opened) {
    party.hidden = false;
    setTimeout(() => party.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
    // Fetch wishes when party content is revealed
    fetchWishes();
  }
});

// Fetch existing wishes from Google Apps Script
async function fetchWishes() {
  try {
    status.textContent = 'Loading wishes...';
    status.className = 'form-status loading';
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    
    if (data.success && data.wishes) {
      displayWishes(data.wishes);
      if (data.wishes.length === 0) {
        status.textContent = 'Be the first to leave a wish! ✦';
        status.className = 'form-status empty';
      } else {
        status.textContent = 'The Wish Garden is blooming with love.';
        status.className = 'form-status';
      }
    } else {
      throw new Error(data.message || 'Failed to fetch wishes');
    }
  } catch (error) {
    console.error('Error fetching wishes:', error);
    status.textContent = 'The Wish Garden is waiting for its first wish...';
    status.className = 'form-status';
  }
}

// Submit new wish to Google Apps Script
async function submitWish(event) {
  event.preventDefault();
  
  const name = document.getElementById('guest-name').value.trim();
  const wish = document.getElementById('guest-wish').value.trim();
  
  // Validate
  if (!name) {
    status.textContent = 'Please tell us your name. ✦';
    status.className = 'form-status error';
    return;
  }
  if (!wish) {
    status.textContent = 'Please share a wish for Arabella. ✦';
    status.className = 'form-status error';
    return;
  }
  
  try {
    status.textContent = 'Sending your sparkle...';
    status.className = 'form-status loading';
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: new URLSearchParams({
        name: name,
        wish: wish
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      status.textContent = '✦ Your wish has been added to the garden! ✦';
      status.className = 'form-status success';
      form.reset();
      // Refresh the wishes list
      setTimeout(fetchWishes, 800);
    } else {
      throw new Error(data.message || 'Failed to save wish');
    }
  } catch (error) {
    console.error('Error submitting wish:', error);
    status.textContent = 'Oops! Could not save your wish. Please try again. ✦';
    status.className = 'form-status error';
  }
}

// Display wishes in the garden
function displayWishes(wishes) {
  const wishesContainer = document.getElementById('wishes-list');
  wishesContainer.innerHTML = '';
  
  if (wishes.length === 0) {
    return;
  }
  
  wishes.forEach((wish, index) => {
    const wishCard = document.createElement('div');
    wishCard.className = 'wish-card';
    wishCard.style.animationDelay = (index * 0.1) + 's';
    
    const nameEl = document.createElement('p');
    nameEl.className = 'wish-name';
    nameEl.textContent = wish.name;
    
    const wishEl = document.createElement('p');
    wishEl.className = 'wish-text';
    wishEl.textContent = wish.wish;
    
    wishCard.appendChild(nameEl);
    wishCard.appendChild(wishEl);
    wishesContainer.appendChild(wishCard);
  });
}

// Form submission
form.addEventListener('submit', submitWish);

// Load wishes when page is ready
if (!party.hidden) {
  fetchWishes();
}