const door = document.querySelector('#open-door');
const party = document.querySelector('#party');
const form = document.querySelector('#wish-form');
const status = document.querySelector('#form-status');

door.addEventListener('click', () => {
  const opened = door.classList.toggle('open');
  door.setAttribute('aria-expanded', String(opened));
  if (opened) {
    party.hidden = false;
    setTimeout(() => party.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  status.textContent = 'The Wish Garden is almost ready to receive your sparkle.';
});