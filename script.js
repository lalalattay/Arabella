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
    photoFiles = files.filter(file => file.type === 'file' && /\.(jpe?g|png|webp)$/i.test(file.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
    if (!photoFiles.length) throw new Error('No photos found');
    buildCarouselDots(); showPhoto(photoIndex, false);
  } catch (error) { console.error('Error loading photo carousel:', error); carouselImage.alt='Photos are loading...'; carouselCount.textContent='Photos are loading...'; }
}
function buildCarouselDots(){carouselDots.innerHTML='';const dotCount=Math.min(DOT_COUNT,photoFiles.length);for(let i=0;i<dotCount;i++){const dot=document.createElement('button');dot.type='button';dot.className='carousel-dot';dot.setAttribute('aria-label',`Photo position ${i+1}`);dot.addEventListener('click',()=>{const target=Math.min(i,photoFiles.length-1);showPhoto(target,true,target>photoIndex?1:-1)});carouselDots.appendChild(dot)}}
function updateCarouselDots(){const dots=carouselDots.querySelectorAll('.carousel-dot');if(!dots.length)return;const activeDot=photoIndex%dots.length;dots.forEach((dot,index)=>dot.classList.toggle('active',index===activeDot))}
function showPhoto(index,animate=true,direction=null){if(!photoFiles.length||slideBusy)return;const nextIndex=(index+photoFiles.length)%photoFiles.length;if(animate&&nextIndex===photoIndex&&carouselImage.dataset.loaded==='true')return;const previousIndex=photoIndex;photoIndex=nextIndex;const file=photoFiles[photoIndex];const nextSrc=PHOTO_BASE+encodeURIComponent(file.name);const slideDirection=direction??(photoIndex>previousIndex?1:-1);if(!animate||carouselImage.dataset.loaded!=='true'){carouselImage.classList.remove('slide-out-left','slide-out-right');carouselImage.src=nextSrc;carouselImage.alt=`Arabella memory ${photoIndex+1} of ${photoFiles.length}`;carouselImage.dataset.loaded='true';carouselCount.textContent=`${photoIndex+1} / ${photoFiles.length}`;updateCarouselDots();preloadPhoto(photoIndex-1);preloadPhoto(photoIndex+1);return}slideBusy=true;updateCarouselDots();carouselCount.textContent=`${photoIndex+1} / ${photoFiles.length}`;const incoming=document.createElement('img');incoming.className='carousel-slide-image';incoming.alt=`Arabella memory ${photoIndex+1} of ${photoFiles.length}`;incoming.draggable=false;incoming.src=nextSrc;incoming.style.setProperty('--slide-from',slideDirection>0?'100%':'-100%');incoming.style.setProperty('--slide-to','0%');carouselFrame.appendChild(incoming);const finish=()=>{carouselImage.classList.remove('slide-out-left','slide-out-right');carouselImage.src=nextSrc;carouselImage.alt=incoming.alt;incoming.remove();slideBusy=false;preloadPhoto(photoIndex-1);preloadPhoto(photoIndex+1)};incoming.onload=()=>{requestAnimationFrame(()=>incoming.classList.add('slide-in'));setTimeout(finish,430)};incoming.onerror=()=>{incoming.remove();slideBusy=false}}
function preloadPhoto(index){if(!photoFiles.length)return;const file=photoFiles[(index+photoFiles.length)%photoFiles.length];const image=new Image();image.src=PHOTO_BASE+encodeURIComponent(file.name)}
function nextPhoto(){if(!slideBusy)showPhoto(photoIndex+1,true,1)} function previousPhoto(){if(!slideBusy)showPhoto(photoIndex-1,true,-1)}
if(carousel){carouselNext.addEventListener('click',nextPhoto);carouselPrev.addEventListener('click',previousPhoto);carousel.addEventListener('touchstart',event=>{const touch=event.changedTouches[0];photoTouchStartX=touch.clientX;photoTouchStartY=touch.clientY},{passive:true});carousel.addEventListener('touchend',event=>{const touch=event.changedTouches[0];const dx=touch.clientX-photoTouchStartX;const dy=touch.clientY-photoTouchStartY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){if(dx<0)nextPhoto();else previousPhoto()}},{passive:true});document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')previousPhoto();if(event.key==='ArrowRight')nextPhoto()})}

// Door functionality
door.addEventListener('click',()=>{const opened=door.classList.toggle('open');door.setAttribute('aria-expanded',String(opened));if(opened){party.hidden=false;setTimeout(()=>party.scrollIntoView({behavior:'smooth',block:'start'}),700);loadCarousel();fetchWishes()}});

async function fetchWishes(animateNewest=false){try{status.textContent='Loading wishes...';status.className='form-status loading';const response=await fetch(SCRIPT_URL);const data=await response.json();if(data.success&&data.wishes){displayWishes(data.wishes,animateNewest);if(data.wishes.length===0){status.textContent='Be the first to leave a wish! ✦';status.className='form-status empty'}else{status.textContent='Your note is safely tucked away. ♡';status.className='form-status'}}else throw new Error(data.message||'Failed to fetch wishes')}catch(error){console.error('Error fetching wishes:',error);status.textContent='The Fairy Post is waiting for its first note...';status.className='form-status'}}

async function submitWish(event){event.preventDefault();const name=document.getElementById('guest-name').value.trim();const wish=document.getElementById('guest-wish').value.trim();if(!name){status.textContent='Please tell us your name. ✦';status.className='form-status error';return}if(!wish){status.textContent='Please share a wish for Arabella. ✦';status.className='form-status error';return}try{status.textContent='Sending your sparkle...';status.className='form-status loading';const response=await fetch(SCRIPT_URL,{method:'POST',body:new URLSearchParams({name,wish})});const data=await response.json();if(data.success){status.textContent='Your note is safely tucked away. ♡';status.className='form-status success';form.reset();setTimeout(()=>fetchWishes(true),800)}else throw new Error(data.message||'Failed to save wish')}catch(error){console.error('Error submitting wish:',error);status.textContent='Oops! Could not save your wish. Please try again. ✦';status.className='form-status error'}}

function formatWishDate(wish){const rawDate=wish.date||wish.timestamp||wish.createdAt||wish.time||wish.created_at;if(!rawDate)return'';const date=new Date(rawDate);if(Number.isNaN(date.getTime()))return'';return date.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}

const avatarSymbols=['✦','✧','❀','☾','♡','❈'];
const cardOrnaments=[['✦','#c99655'],['✧','#d57987'],['❀','#9a9f7c'],['☾','#c99655'],['♡','#d57987'],['❈','#aa7b79']];
function stableStyleIndex(wish,index,length){const key=`${wish.name||''}|${wish.wish||''}|${formatWishDate(wish)||''}`;let hash=0;for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;return(hash+index*17)%length}
function addSparkles(card){const sparkles=['✦','✧','·','✦','✧','·','✦','⋆'];const positions=[[10,18],[27,6],[48,2],[70,6],[90,18],[96,48],[86,84],[58,96]];sparkles.forEach((symbol,index)=>{const el=document.createElement('span');el.className='wish-sparkle';el.textContent=symbol;const [x,y]=positions[index];el.style.setProperty('--sparkle-x',`${x}%`);el.style.setProperty('--sparkle-y',`${y}%`);el.style.setProperty('--sparkle-size',`${7+(index%3)*3}px`);el.style.setProperty('--sparkle-delay',`${index*0.07}s`);card.appendChild(el)});setTimeout(()=>card.querySelectorAll('.wish-sparkle').forEach(el=>el.remove()),1300)}

function displayWishes(wishes,animateNewest=false){const wishesContainer=document.getElementById('wishes-list');wishesContainer.innerHTML='';if(wishes.length===0)return;wishes.forEach((wish,index)=>{const wishCard=document.createElement('div');wishCard.className='wish-card';const styleIndex=stableStyleIndex(wish,index,cardOrnaments.length);const ornament=cardOrnaments[styleIndex];const avatar=avatarSymbols[styleIndex%avatarSymbols.length];wishCard.style.setProperty('--card-ornament',`'${ornament[0]}'`);wishCard.style.setProperty('--ornament-color',ornament[1]);wishCard.style.setProperty('--ornament-rotate',`${styleIndex%2?'8':'-8'}deg`);if(styleIndex%3===1){wishCard.style.setProperty('--ornament-top','auto');wishCard.style.setProperty('--ornament-right','auto');wishCard.style.setProperty('--ornament-bottom','5px');wishCard.style.setProperty('--ornament-left','12px')}else if(styleIndex%3===2){wishCard.style.setProperty('--ornament-top','5px');wishCard.style.setProperty('--ornament-right','auto');wishCard.style.setProperty('--ornament-bottom','auto');wishCard.style.setProperty('--ornament-left','12px')}const avatarEl=document.createElement('div');avatarEl.className='wish-avatar';avatarEl.setAttribute('aria-hidden','true');avatarEl.textContent=avatar;const wishBody=document.createElement('div');wishBody.className='wish-body';const wishHeader=document.createElement('div');wishHeader.className='wish-header';const nameEl=document.createElement('p');nameEl.className='wish-name';nameEl.textContent=wish.name;const dateEl=document.createElement('time');dateEl.className='wish-date';const formattedDate=formatWishDate(wish);if(formattedDate)dateEl.textContent=formattedDate;const wishEl=document.createElement('p');wishEl.className='wish-text';wishHeader.appendChild(nameEl);if(formattedDate)wishHeader.appendChild(dateEl);wishBody.appendChild(wishHeader);wishBody.appendChild(wishEl);wishEl.textContent=wish.wish;wishCard.appendChild(avatarEl);wishCard.appendChild(wishBody);wishesContainer.appendChild(wishCard);if(animateNewest&&index===wishes.length-1){wishCard.classList.add('sparkle-in');addSparkles(wishCard)}})}

form.addEventListener('submit',submitWish);if(!party.hidden){loadCarousel();fetchWishes()}