const door = document.querySelector('#open-door');
const party = document.querySelector('#party');
const form = document.querySelector('#wish-form');
const status = document.querySelector('#form-status');
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby0QgVPo5T8AzQRTM-7EQnp4aegnWHX_1xwW99X2I1k3YaNKp2l32E4S8cQcVlW163W/exec';

// Photo carousel
const carousel = document.querySelector('#photo-carousel');
const carouselFrame = document.querySelector('.carousel-frame');
const carouselImage = document.querySelector('#carousel-image');
const carouselCount = document.querySelector('#carousel-count');
const carouselDots = document.querySelector('#carousel-dots');
const carouselPrev = document.querySelector('.carousel-prev');
const carouselNext = document.querySelector('.carousel-next');
const PHOTO_API = 'https://api.github.com/repos/lalalattay/Arabella/contents/photos?ref=main';
const PHOTO_BASE = 'https://raw.githubusercontent.com/lalalattay/Arabella/main/photos/';
let photoFiles = [];
let photoIndex = 0;
let photoTouchStartX = 0;
let photoTouchStartY = 0;
let slideBusy = false;
const DOT_COUNT = 5;

async function loadCarousel() {
  if (!carousel || photoFiles.length) return;
  try {
    const response = await fetch(PHOTO_API, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load photos');
    const files = await response.json();
    photoFiles = files
      .filter(file => file.type === 'file' && /\.(jpe?g|png|webp)$/i.test(file.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (!photoFiles.length) throw new Error('No photos found');
    buildCarouselDots();
    showPhoto(photoIndex, false);
  } catch (error) {
    console.error('Error loading photo carousel:', error);
    carouselImage.alt = 'Photos are loading...';
    carouselCount.textContent = 'Photos are loading...';
  }
}

function buildCarouselDots() {
  carouselDots.innerHTML = '';
  const dotCount = Math.min(DOT_COUNT, photoFiles.length);
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Photo position ${i + 1}`);
    dot.addEventListener('click', () => {
      const target = Math.min(i, photoFiles.length - 1);
      showPhoto(target, true, target > photoIndex ? 1 : -1);
    });
    carouselDots.appendChild(dot);
  }
}

function updateCarouselDots() {
  const dots = carouselDots.querySelectorAll('.carousel-dot');
  if (!dots.length) return;
  const activeDot = photoIndex % dots.length;
  dots.forEach((dot, index) => dot.classList.toggle('active', index === activeDot));
}

function showPhoto(index, animate = true, direction = null) {
  if (!photoFiles.length || slideBusy) return;

  const nextIndex = (index + photoFiles.length) % photoFiles.length;
  if (nextIndex === photoIndex && carouselImage.src) return;

  const previousIndex = photoIndex;
  photoIndex = nextIndex;
  const file = photoFiles[photoIndex];
  const nextSrc = PHOTO_BASE + encodeURIComponent(file.name);
  const slideDirection = direction ?? (photoIndex > previousIndex ? 1 : -1);

  if (!animate || !carouselImage.src) {
    carouselImage.classList.remove('slide-out-left', 'slide-out-right');
    carouselImage.src = nextSrc;
    carouselImage.alt = `Arabella memory ${photoIndex + 1} of ${photoFiles.length}`;
    carouselCount.textContent = `${photoIndex + 1} / ${photoFiles.length}`;
    updateCarouselDots();
    preloadPhoto(photoIndex - 1);
    preloadPhoto(photoIndex + 1);
    return;
  }

  slideBusy = true;
  updateCarouselDots();
  carouselCount.textContent = `${photoIndex + 1} / ${photoFiles.length}`;

  // Only the incoming photo moves. The current photo stays still underneath it,
  // so each navigation produces exactly ONE clean left/right slide.
  const incoming = document.createElement('img');
  incoming.className = 'carousel-slide-image';
  incoming.alt = `Arabella memory ${photoIndex + 1} of ${photoFiles.length}`;
  incoming.draggable = false;
  incoming.src = nextSrc;
  incoming.style.setProperty('--slide-from', slideDirection > 0 ? '100%' : '-100%');
  incoming.style.setProperty('--slide-to', '0%');
  carouselFrame.appendChild(incoming);

  const finish = () => {
    carouselImage.classList.remove('slide-out-left', 'slide-out-right');
    carouselImage.src = nextSrc;
    carouselImage.alt = incoming.alt;
    incoming.remove();
    slideBusy = false;
    preloadPhoto(photoIndex - 1);
    preloadPhoto(photoIndex + 1);
  };

  incoming.onload = () => {
    requestAnimationFrame(() => incoming.classList.add('slide-in'));
    setTimeout(finish, 430);
  };

  incoming.onerror = () => {
    incoming.remove();
    slideBusy = false;
  };
}

function preloadPhoto(index) {
  if (!photoFiles.length) return;
  const file = photoFiles[(index + photoFiles.length) % photoFiles.length];
  const image = new Image();
  image.src = PHOTO_BASE + encodeURIComponent(file.name);
}

function nextPhoto() {
  if (!slideBusy) showPhoto(photoIndex + 1, true, 1);
}

function previousPhoto() {
  if (!slideBusy) showPhoto(photoIndex - 1, true, -1);
}

if (carousel) {
  carouselNext.addEventListener('click', nextPhoto);
  carouselPrev.addEventListener('click', previousPhoto);

  carousel.addEventListener('touchstart', event => {
    const touch = event.changedTouches[0];
    photoTouchStartX = touch.clientX;
    photoTouchStartY = touch.clientY;
  }, { passive: true });

  carousel.addEventListener('touchend', event => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - photoTouchStartX;
    const dy = touch.clientY - photoTouchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextPhoto();
      else previousPhoto();
    }
  }, { passive: true });

  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') previousPhoto();
    if (event.key === 'ArrowRight') nextPhoto();
  });
}

// Door functionality
door.addEventListener('click', () => {
  const opened = door.classList.toggle('open');
  door.setAttribute('aria-expanded', String(opened));
  if (opened) {
    party.hidden = false;
    setTimeout(() => party.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
    loadCarousel();
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
      body: new URLSearchParams({ name: name, wish: wish })
    });

    const data = await response.json();

    if (data.success) {
      status.textContent = '✦ Your wish has been added to the garden! ✦';
      status.className = 'form-status success';
      form.reset();
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

function displayWishes(wishes) {
  const wishesContainer = document.getElementById('wishes-list');
  wishesContainer.innerHTML = '';

  if (wishes.length === 0) return;

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

form.addEventListener('submit', submitWish);

if (!party.hidden) {
  loadCarousel();
  fetchWishes();
}